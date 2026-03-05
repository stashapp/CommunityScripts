"""Minimal plugin setup helper using only standard library facilities."""

from __future__ import annotations

import json
import os
import ssl
import sys
import urllib.error
import urllib.request
import urllib.parse
import gzip
import zlib
from typing import Any, Dict, Optional


CONFIG_QUERY = """
query Configuration($pluginIds: [ID!]) {
  configuration {
    general {
      databasePath
      apiKey
    }
    # Keep plugins in the payload so callers can still inspect plugin entries if needed
    plugins(include: $pluginIds)
  }
}
"""

# Shared fallback backend base so setup can still sync metadata when no override exists yet.
DEFAULT_BACKEND_BASE_URL = "http://localhost:4153"


def _normalize_backend_base(raw: Any) -> Optional[str]:
    if isinstance(raw, str):
        trimmed = raw.strip()
        if not trimmed:
            return ""
        return trimmed.rstrip("/")
    return None


def _format_base_url(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None
    if cleaned.endswith('/'):
        cleaned = cleaned.rstrip('/')
    return cleaned or None

def _build_backend_setting_url(base: str, key: str) -> str:
    clean_base = _format_base_url(base) or ''
    if not clean_base:
        raise ValueError('backend base URL is required')
    return f"{clean_base}/api/v1/plugins/system/settings/{urllib.parse.quote(key, safe='')}"


def _push_backend_setting(base: str, key: str, value: Any, timeout: float = 10.0) -> None:
    url = _build_backend_setting_url(base, key)
    payload = json.dumps({"value": value}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="PUT",
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        # Drain response body to allow connection reuse; backend returns small JSON.
        response.read()


def _build_logger():
    try:
        import stashapi.log as stash_log  # type: ignore

        return stash_log
    except Exception:  # pragma: no cover - fallback when stashapi isn't available
        class _FallbackLog:
            def info(self, msg: Any) -> None:
                sys.stderr.write(f"[INFO] {msg}\n")

            def warning(self, msg: Any) -> None:
                sys.stderr.write(f"[WARN] {msg}\n")

            def error(self, msg: Any) -> None:
                sys.stderr.write(f"[ERROR] {msg}\n")

        return _FallbackLog()


log = _build_logger()


def main() -> None:
    raw_input = sys.stdin.read()
    result = {"output": "ok", "error": None}

    try:
        payload = json.loads(raw_input) if raw_input.strip() else {}
    except json.JSONDecodeError as exc:
        log.error(f"Failed to decode input JSON: {exc}")
        result = {"output": None, "error": f"invalid JSON input: {exc}"}
        _emit_result(result)
        return

    try:
        result = run(payload)
    except Exception as exc:  # pragma: no cover - surfaced to caller
        log.error(f"Plugin setup failed: {exc}")
        result = {"output": None, "error": str(exc)}

    # If run returned a dict-style result, use it; otherwise fall back to ok
    if isinstance(result, dict):
        _emit_result(result)
    else:
        _emit_result({"output": "ok", "error": None})


def _emit_result(result: Dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(result))
    sys.stdout.flush()


def run(json_input: Dict[str, Any]) -> Dict[str, Any]:
    args = json_input.get("args") or {}
    mode = args.get("mode")
    log.info(f"Plugin setup triggered (mode={mode!r})")

    if mode != "plugin_setup":
        log.info("No setup action requested; exiting early.")
        return {"output": None, "error": "no setup requested"}

    return plugin_setup(json_input)


def plugin_setup(json_input: Dict[str, Any]) -> Dict[str, Any]:
    connection = json_input.get("server_connection") or {}
    plugin_info = json_input.get("plugin") or {}
    plugin_id = plugin_info.get("id") or plugin_info.get("name")

    target = _build_graphql_url(connection)
    headers = _build_headers(connection)
    verify_ssl = connection.get("VerifySSL", True)

    log.info(f"Connecting to GraphQL endpoint: {target}")
    if plugin_id:
        log.info(f"Fetching configuration for plugin: {plugin_id}")
        variables: Optional[Dict[str, Any]] = {"pluginIds": [plugin_id]}
    else:
        log.info("Fetching configuration for all plugins (no plugin id supplied)")
        variables = {"pluginIds": []}
    # Request only the specific configuration fields we need (no introspection):
    # general.databasePath and general.apiKey. Keep plugins in the payload so
    # the caller can still inspect plugin entries if desired.
    try:
        full_query = CONFIG_QUERY
        response = _execute_graphql(target, full_query, variables, headers, verify_ssl)
        config = (response or {}).get("configuration")
        log.info(f"Received configuration: {json.dumps(config, default=str)[:1000]}")
    except Exception as exc:  # pragma: no cover - runtime fallback
        log.warning(f"Configuration query failed: {exc}; falling back to plugins-only query")
        fallback_query = """
        query PluginSetupConfig($pluginIds: [ID!]) {
          configuration { plugins(include: $pluginIds) }
        }
        """
        response = _execute_graphql(target, fallback_query, variables, headers, verify_ssl)
        config = ((response or {}).get("configuration") or {}).get("plugins")
        log.info(f"Current plugin configuration payload (fallback): {json.dumps(config, default=str)}")

    # Resolve database path (absolute or relative to stash base dir) and verify existence
    database_path_raw = None
    api_key = None
    absolute_db_path = None
    db_exists = False
    plugin_entries: Dict[str, Any] = {}

    if isinstance(config, dict):
        if 'general' in config or 'plugins' in config:
            general = config.get("general") or {}
            database_path_raw = general.get("databasePath")
            api_key = general.get("apiKey")
            raw_plugins = config.get("plugins")
            log.info(f"Resolved raw plugins entry: {raw_plugins!r}")
            if isinstance(raw_plugins, dict):
                plugin_entries = raw_plugins
        else:
            general = {}
            plugin_entries = config
    elif isinstance(config, list):
        general = {}
    else:
        general = {}

    if database_path_raw:
        if os.path.isabs(database_path_raw):
            log.info(f"Database path {database_path_raw} is absolute")
            absolute_db_path = os.path.normpath(database_path_raw)
        else:
            stash_dir = connection.get("Dir") or ""
            log.info(f"Database path {database_path_raw} is relative to Stash directory {stash_dir}")
            absolute_db_path = os.path.normpath(os.path.join(stash_dir, database_path_raw))

        db_exists = os.path.isabs(absolute_db_path) and os.path.exists(absolute_db_path)

    plugin_entry: Optional[Dict[str, Any]] = None
    if isinstance(plugin_entries, dict) and plugin_entries:
        entry = plugin_entries.get("AIOverhaul")
        if isinstance(entry, dict):
            plugin_entry = entry

    backend_base_override = None
    if isinstance(plugin_entry, dict):
        backend_base_override = plugin_entry.get("backend_base_url")

    backend_base_override = _normalize_backend_base(backend_base_override)
    normalized_api_key = api_key
    if isinstance(normalized_api_key, str):
        trimmed = normalized_api_key.strip()
        if not trimmed:
            normalized_api_key = ''
        elif trimmed.upper() == 'REPLACE_WITH_API_KEY':
            normalized_api_key = None

    backend_base_url = (
        _format_base_url(backend_base_override)
        or _format_base_url(os.getenv('AI_BACKEND_BASE_URL'))
        or DEFAULT_BACKEND_BASE_URL
    )
    stash_base_url = target
    if stash_base_url.endswith('/graphql'):
        stash_base_url = stash_base_url[:-len('/graphql')]
    stash_base_url = _format_base_url(stash_base_url)

    if backend_base_url:
        log.info(f"Syncing Stash connection metadata to AI backend at {backend_base_url}")
        try:
            if stash_base_url:
                _push_backend_setting(backend_base_url, 'STASH_URL', stash_base_url)
            else:
                log.warning('Unable to derive Stash base URL; skipping STASH_URL sync')

            if normalized_api_key is None:
                log.info('No Stash API key detected; clearing backend value')
                _push_backend_setting(backend_base_url, 'STASH_API_KEY', None)
            else:
                if str(normalized_api_key):
                    log.info(f'Setting Stash API key in backend (length={len(str(normalized_api_key))})')
                else:
                    log.info('Setting empty Stash API key in backend')
                _push_backend_setting(backend_base_url, 'STASH_API_KEY', normalized_api_key)

            if db_exists and absolute_db_path:
                _push_backend_setting(backend_base_url, 'STASH_DB_PATH', absolute_db_path)
            else:
                log.info('No valid Stash database path detected; skipping STASH_DB_PATH sync')
        except Exception as exc:
            log.warning(f"Failed to sync configuration to AI backend {backend_base_url}: {exc}")
    else:
        log.warning('No backend base URL could be determined; skipping AI backend configuration sync')

    result_payload = {
        "configuration": config,
        "databasePath": absolute_db_path,
        "databaseExists": db_exists,
        "apiKey": api_key,
        "backendBaseOverride": backend_base_override
    }
    log.info(f"Plugin setup completed successfully: {json.dumps(result_payload, default=str)}")
    return {"output": result_payload, "error": None}


def _build_graphql_url(connection: Dict[str, Any]) -> str:
    host = connection.get("Host", "localhost")
    if host == "0.0.0.0" or host == "127.0.0.1":
        host = "localhost"

    port = connection.get("Port", 9999)
    scheme = connection.get("Scheme", "http")
    base_path = connection.get("Path", "/graphql")
    if not base_path.startswith("/"):
        base_path = f"/{base_path}"

    return f"{scheme}://{host}:{port}{base_path}"


def _build_headers(connection: Dict[str, Any]) -> Dict[str, str]:
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "User-Agent": "AIOverhaulPluginSetup/1.0",
    }

    api_key = connection.get("ApiKey")
    if api_key:
        headers["ApiKey"] = str(api_key)

    cookie_value: Optional[str] = None
    session_cookie = connection.get("SessionCookie")
    if isinstance(session_cookie, dict):
        cookie_value = session_cookie.get("Value") or session_cookie.get("value")
    elif isinstance(session_cookie, str):
        cookie_value = session_cookie

    if cookie_value:
        headers["Cookie"] = f"session={cookie_value}"

    return headers


def _execute_graphql(
    url: str,
    query: str,
    variables: Optional[Dict[str, Any]],
    headers: Dict[str, str],
    verify_ssl: bool = True,
    timeout: float = 15.0,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"query": query}
    if variables is not None:
        payload["variables"] = variables

    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers=headers, method="POST")

    context = None
    if url.lower().startswith("https") and not verify_ssl:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(request, context=context, timeout=timeout) as response:
            body = _read_response_body(response)
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"HTTP error {exc.code} while calling GraphQL: {exc.reason}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Failed to reach GraphQL endpoint: {exc.reason}") from exc

    try:
        preview = body if len(body) < 500 else body[:500] + "…"
        log.info(f"Received GraphQL response: {preview}")
        payload = json.loads(body) if body else {}
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid JSON from GraphQL endpoint: {exc}") from exc

    errors = payload.get("errors")
    if errors:
        raise RuntimeError(f"GraphQL returned errors: {errors}")

    return payload.get("data", {})





def _read_response_body(response: Any, default_charset: str = "utf-8") -> str:
    raw = response.read()
    encoding = (response.headers.get("Content-Encoding") or "").lower()

    if "gzip" in encoding:
        try:
            raw = gzip.decompress(raw)
        except OSError:
            pass
    elif "deflate" in encoding:
        try:
            raw = zlib.decompress(raw)
        except zlib.error:
            try:
                raw = zlib.decompress(raw, -zlib.MAX_WBITS)
            except zlib.error:
                pass

    charset = response.headers.get_content_charset() or default_charset
    try:
        return raw.decode(charset)
    except UnicodeDecodeError:
        return raw.decode(charset, errors="replace")


if __name__ == "__main__":
    main()
