"""
🐍 Simple dependency management for Python projects.

Automatically installs and manages dependencies in isolated folders.
Supports regular packages, git repositories, and version constraints.

Usage:
    Add a dependency to PythonDepManager into your plugin.yml file so it gets installed automatically:
    #requires: PythonDepManager

    Then, in your python code, you can use the "ensure_import" function to install and manage dependencies:
    # Example usage:
    from PythonDepManager import ensure_import

    ensure_import("requests==2.26.0")                                     # Specific version
    ensure_import("requests>=2.25.0")                                     # Minimum version
    ensure_import("bs4:beautifulsoup4==4.9.3")                            # Custom import name/Metapackage Imports
    ensure_import("stashapi@git+https://github.com/user/repo.git")        # Git repo
    ensure_import("stashapi@git+https://github.com/user/repo.git@main")   # Git branch/tag
    ensure_import("stashapi@git+https://github.com/user/repo.git@abc123") # Git commit
    ensure_import("bs4:beautifulsoup4==4.9.3", "requests==2.26.0") # Multiple packages

    # If you want to flush all dependencies, you can use the flush_dependencies function:
    from PythonDepManager import flush_dependencies
    flush_dependencies()
"""

import sys
import subprocess
import re
import importlib
import importlib.metadata
import hashlib
import os
from pathlib import Path
from inspect import stack
from typing import Optional, List, Set, Tuple
from dataclasses import dataclass
from PythonDepManager import log


@dataclass(frozen=True)
class PackageInfo:
    """Immutable representation of a package specification."""

    import_name: str
    pip_name: str
    version: Optional[str] = None
    min_version: Optional[str] = None
    git_url: Optional[str] = None
    git_ref: Optional[str] = None

    @property
    def is_git(self) -> bool:
        return self.git_url is not None

    @property
    def is_min_version(self) -> bool:
        return self.min_version is not None

    def __str__(self) -> str:
        if self.is_git:
            ref = f"@{self.git_ref}" if self.git_ref else ""
            return f"{self.import_name} (git{ref})"
        elif self.is_min_version:
            return f"{self.pip_name}>={self.min_version}"
        elif self.version:
            return f"{self.pip_name}=={self.version}"
        else:
            return self.pip_name


def check_system_requirements() -> None:
    """Ensure git and pip are available."""
    for cmd, name in [
        (["git", "--version"], "git"),
        ([sys.executable, "-m", "pip", "--version"], "pip"),
    ]:
        try:
            subprocess.run(
                cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True
            )
        except (FileNotFoundError, subprocess.CalledProcessError):
            log.throw(f"PythonDepManager: ❌ {name} is required but not available")


def run_git_command(args: List[str]) -> Optional[str]:
    """Run a git command and return the first 7 characters of output."""
    try:
        result = subprocess.run(
            ["git"] + args, capture_output=True, text=True, timeout=10, check=True
        )
        return result.stdout.split()[0][:7] if result.stdout.strip() else None
    except (
        subprocess.TimeoutExpired,
        subprocess.CalledProcessError,
        FileNotFoundError,
        IndexError,
    ):
        return None


def parse_package_spec(spec: str) -> PackageInfo:
    """Parse a package specification into structured information."""
    # Split custom import name from package spec
    if ":" in spec and not spec.startswith("git+") and "@git+" not in spec:
        import_name, package_spec = spec.split(":", 1)
    else:
        import_name, package_spec = "", spec

    # Handle git packages
    if "@git+" in package_spec:
        import_name = import_name or package_spec.split("@")[0]
        git_url = package_spec.split("@git+", 1)[1]

        if "@" in git_url:
            git_url, git_ref = git_url.rsplit("@", 1)
        else:
            git_ref = None

        return PackageInfo(
            import_name=import_name,
            pip_name="",
            git_url=f"git+{git_url}",
            git_ref=git_ref,
        )

    # Handle version constraints
    if ">=" in package_spec:
        match = re.match(r"^([^>=]+)>=(.+)$", package_spec)
        if not match:
            log.throw(
                f"PythonDepManager: ❌ Invalid version constraint: {package_spec}"
            )

        pip_name, min_version = match.groups()
        return PackageInfo(
            import_name=import_name or pip_name,
            pip_name=pip_name,
            min_version=min_version,
        )

    # Handle exact version or no version
    match = re.match(r"^([^=@]+)(?:==(.+))?$", package_spec)
    if not match:
        log.throw(f"PythonDepManager: ❌ Invalid package specification: {package_spec}")

    pip_name, version = match.groups()
    return PackageInfo(
        import_name=import_name or pip_name, pip_name=pip_name, version=version
    )


def compare_versions(v1: str, v2: str) -> int:
    """Compare version strings. Returns -1, 0, or 1."""
    try:
        # Try using packaging library if available
        from packaging import version

        ver1, ver2 = version.parse(v1), version.parse(v2)
        return -1 if ver1 < ver2 else (1 if ver1 > ver2 else 0)
    except ImportError:
        # Fallback to simple numeric comparison
        try:

            def normalize(v: str) -> List[int]:
                return [int(x) for x in v.split(".")]

            parts1, parts2 = normalize(v1), normalize(v2)
            max_len = max(len(parts1), len(parts2))
            parts1.extend([0] * (max_len - len(parts1)))
            parts2.extend([0] * (max_len - len(parts2)))

            for a, b in zip(parts1, parts2):
                if a < b:
                    return -1
                if a > b:
                    return 1
            return 0
        except ValueError:
            return -1 if v1 < v2 else (1 if v1 > v2 else 0)


def find_compatible_version(pkg: PackageInfo, base_folder: Path) -> Optional[str]:
    """Find the best compatible version already installed."""
    if not pkg.is_min_version or not base_folder.exists():
        return None

    compatible_versions = []
    prefix = f"{pkg.import_name}_"

    for folder in base_folder.iterdir():
        if not (folder.is_dir() and folder.name.startswith(prefix)):
            continue

        version_part = folder.name[len(prefix) :]
        if version_part and "git_" not in version_part:
            try:
                if compare_versions(version_part, pkg.min_version) >= 0:
                    compatible_versions.append(version_part)
            except ValueError:
                continue

    if compatible_versions:
        try:
            return max(
                compatible_versions, key=lambda v: [int(x) for x in v.split(".")]
            )
        except ValueError:
            return max(compatible_versions)

    return None


def get_git_commit_hash(git_url: str, ref: Optional[str] = None) -> Optional[str]:
    """Get commit hash from git remote."""
    clean_url = git_url[4:] if git_url.startswith("git+") else git_url
    clean_url = clean_url.split("@")[0]

    if ref:
        for ref_type in ["heads", "tags"]:
            result = run_git_command(["ls-remote", clean_url, f"refs/{ref_type}/{ref}"])
            if result:
                return result
    else:
        return run_git_command(["ls-remote", clean_url, "HEAD"])

    return None


def get_folder_name(pkg: PackageInfo, base_folder: Path) -> str:
    """Generate folder name for package installation."""
    if pkg.is_git:
        if pkg.git_ref and re.match(r"^[a-f0-9]{7,40}$", pkg.git_ref):
            commit_hash = pkg.git_ref[:7]
        else:
            commit_hash = get_git_commit_hash(pkg.git_url, pkg.git_ref)

        if commit_hash:
            return f"{pkg.import_name}_git_{commit_hash}"
        else:
            url_hash = hashlib.md5(pkg.git_url.encode()).hexdigest()[:7]
            return f"{pkg.import_name}_git_{url_hash}"

    elif pkg.is_min_version:
        compatible_version = find_compatible_version(pkg, base_folder)
        return (
            f"{pkg.import_name}_{compatible_version}"
            if compatible_version
            else f"{pkg.import_name}_latest"
        )
    else:
        return f"{pkg.import_name}_{pkg.version}" if pkg.version else pkg.import_name


def get_base_folder() -> Path:
    """Get the base folder for automatic dependencies."""
    caller_file = stack()[2].filename

    if caller_file.startswith("<") or not caller_file:
        log.throw(
            "PythonDepManager: ❌ Cannot determine caller location", e_type=RuntimeError
        )

    caller_path = Path(caller_file).resolve()
    deps_folder = caller_path.parent.parent / "py_dependencies"

    try:
        deps_folder.mkdir(parents=True, exist_ok=True)
        # Test write permissions
        test_file = deps_folder / ".write_test"
        test_file.touch()
        test_file.unlink()
    except (OSError, PermissionError) as e:
        log.throw(
            f"PythonDepManager: ❌ Cannot access dependencies folder '{deps_folder}': {e}",
            e_type=RuntimeError,
            e_from=e,
        )

    return deps_folder


def is_package_available(pkg: PackageInfo, base_folder: Path) -> bool:
    """Check if managed package is already available and satisfies requirements."""
    # For ensure_import, we only care about our managed dependencies
    # System-installed packages are ignored to ensure we use the managed version

    folder = base_folder / get_folder_name(pkg, base_folder)
    if not folder.exists():
        return False

    # Check if the managed package folder is in sys.path
    folder_str = os.path.normpath(str(folder.resolve()))
    if folder_str not in sys.path:
        return False

    # Try importing from the managed location
    try:
        # Temporarily prioritize our managed path
        original_path = sys.path[:]
        sys.path.insert(0, folder_str)

        # Clear any existing module to force reload from managed location
        if pkg.import_name in sys.modules:
            del sys.modules[pkg.import_name]

        # Clear import caches
        importlib.invalidate_caches()

        # Try importing
        importlib.import_module(pkg.import_name)

        # Restore original path order (our managed paths should already be at front)
        sys.path[:] = original_path
        if folder_str not in sys.path:
            sys.path.insert(0, folder_str)

        return True
    except ImportError:
        # Restore original path
        sys.path[:] = original_path
        if folder_str not in sys.path:
            sys.path.insert(0, folder_str)
        return False


def get_install_spec(pkg: PackageInfo) -> str:
    """Get the pip install specification for a package."""
    if pkg.is_git:
        return f"{pkg.git_url}@{pkg.git_ref}" if pkg.git_ref else pkg.git_url
    return f"{pkg.pip_name}=={pkg.version}" if pkg.version else pkg.pip_name


def install_package(pkg: PackageInfo, folder: Path) -> None:
    """Install package to specified folder."""
    folder.mkdir(parents=True, exist_ok=True)
    install_spec = get_install_spec(pkg)

    subprocess.run(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "--no-input",
            "--upgrade",
            "--force-reinstall",
            "--quiet",
            f"--target={folder.resolve()}",
            install_spec,
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True,
    )


def add_to_path(folder: Path, current_paths: Set[str]) -> None:
    """Add folder to front of sys.path to ensure managed dependencies are prioritized."""
    folder_str = os.path.normpath(str(folder.resolve()))

    # Remove from current position if it exists to avoid duplicates
    if folder_str in sys.path:
        sys.path.remove(folder_str)
    current_paths.discard(folder_str)

    # Always add to front to ensure priority over system packages
    sys.path.insert(0, folder_str)
    current_paths.add(folder_str)


def clear_import_caches() -> None:
    """Clear Python import caches."""
    importlib.invalidate_caches()
    try:
        importlib.metadata._cache.clear()
    except AttributeError:
        pass


def remove_existing_modules(packages: List[PackageInfo]) -> None:
    """Remove existing modules for managed packages to ensure we use managed versions."""
    for pkg in packages:
        # Remove the main module
        if pkg.import_name in sys.modules:
            log.debug(
                f"PythonDepManager: 🔄 Removing existing module '{pkg.import_name}' to use managed version"
            )
            del sys.modules[pkg.import_name]

        # Also remove any submodules that might be cached
        modules_to_remove = []
        for module_name in sys.modules:
            if module_name.startswith(f"{pkg.import_name}."):
                modules_to_remove.append(module_name)

        for module_name in modules_to_remove:
            log.debug(
                f"PythonDepManager: 🔄 Removing existing submodule '{module_name}' to use managed version"
            )
            del sys.modules[module_name]


def process_packages(deps: Tuple[str, ...]) -> Tuple[List[PackageInfo], Path]:
    """Parse dependencies and prepare base folder."""
    check_system_requirements()
    base_folder = get_base_folder()

    packages = []
    for dep in deps:
        try:
            packages.append(parse_package_spec(dep))
        except ValueError as e:
            log.throw(
                f"PythonDepManager: ❌ Invalid package spec '{dep}': {e}",
                e_type=ValueError,
                e_from=e,
            )

    if not packages:
        log.throw(
            "PythonDepManager: ❌ No valid package specifications found",
            e_type=ValueError,
        )

    return packages, base_folder


def setup_existing_packages(packages: List[PackageInfo], base_folder: Path) -> Set[str]:
    """Add existing package folders to sys.path and ensure managed packages are prioritized."""
    # First, remove any existing modules for packages we're managing
    # This ensures we use the managed version instead of system-installed ones
    remove_existing_modules(packages)

    current_paths = set(sys.path)
    managed_paths = []

    for pkg in packages:
        folder = base_folder / get_folder_name(pkg, base_folder)
        if folder.exists():
            folder_str = os.path.normpath(str(folder.resolve()))
            managed_paths.append(folder_str)

            # Remove from current position if it exists
            if folder_str in sys.path:
                sys.path.remove(folder_str)
            current_paths.discard(folder_str)

    # Add all managed paths to the front of sys.path to ensure priority
    for folder_str in reversed(managed_paths):  # Reverse to maintain order
        sys.path.insert(0, folder_str)
        current_paths.add(folder_str)

    clear_import_caches()
    return current_paths


def install_missing_packages(
    packages: List[PackageInfo], base_folder: Path, current_paths: Set[str]
) -> None:
    """Install packages that aren't already satisfied."""
    # Handle minimum version packages by finding compatible versions
    resolved_packages = []
    for pkg in packages:
        if pkg.is_min_version:
            compatible_version = find_compatible_version(pkg, base_folder)
            if compatible_version:
                # Create new package info with resolved version
                resolved_pkg = PackageInfo(
                    import_name=pkg.import_name,
                    pip_name=pkg.pip_name,
                    version=compatible_version,
                )
                resolved_packages.append(resolved_pkg)
            else:
                resolved_packages.append(pkg)
        else:
            resolved_packages.append(pkg)

    to_install = [
        pkg for pkg in resolved_packages if not is_package_available(pkg, base_folder)
    ]

    if not to_install:
        log.debug("PythonDepManger: ✅ All dependencies satisfied")
        return

    # Remove existing modules for packages we're about to install
    # This ensures we use the newly installed managed version
    remove_existing_modules(to_install)

    for pkg in to_install:
        folder_name = get_folder_name(pkg, base_folder)
        folder = base_folder / folder_name

        log.info(f"PythonDepManager: 📦 Installing {pkg} → {folder_name}")

        try:
            install_package(pkg, folder)
            add_to_path(folder, current_paths)
            log.info(f"PythonDepManager: ✅ Successfully installed {pkg.import_name}")
        except Exception as e:
            log.throw(
                f"PythonDepManager: ❌ Failed to install {pkg.import_name}: {e}",
                e_type=RuntimeError,
                e_from=e,
            )

    clear_import_caches()


def ensure_import(*deps: str) -> None:
    """
    🎯 Install and import dependencies automatically.

    ⚠️  IMPORTANT: This function always prioritizes managed dependencies over system-installed ones.
    When you use ensure_import, any existing system-installed versions of the specified packages
    will be ignored in favor of the managed versions in the py_dependencies folder.

    Supported formats:
    • Regular: "requests", "requests==2.26.0"
    • Version ranges: "requests>=2.25.0"
    • Custom import name/Metapackage Imports: "bs4:beautifulsoup4==4.9.3"
    • Git: "stashapi@git+https://github.com/user/repo.git"
    • Git with ref: "stashapi@git+https://github.com/user/repo.git@main"
    """
    if not deps:
        return

    try:
        packages, base_folder = process_packages(deps)
        current_paths = setup_existing_packages(packages, base_folder)
        install_missing_packages(packages, base_folder, current_paths)

        # Final cache clear to ensure all imports use managed versions
        clear_import_caches()

    except (RuntimeError, ValueError) as e:
        log.throw(f"PythonDepManager: ❌ {e}", e_type=RuntimeError, e_from=e)
