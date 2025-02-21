import json
import sys

import requests


def exit_plugin(msg=None, err=None):
    if msg is None and err is None:
        msg = "plugin ended"
    output_json = {"output": msg, "error": err}
    print(json.dumps(output_json))
    sys.exit()


def doRequest(
    query, variables=None, port=9999, session=None, scheme="http", raise_exception=True
):
    # Session cookie for authentication
    graphql_port = port
    graphql_scheme = scheme
    graphql_cookies = {"session": session}

    graphql_headers = {
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1",
    }
    graphql_domain = "localhost"
    # Stash GraphQL endpoint
    graphql_url = (
        graphql_scheme + "://" + graphql_domain + ":" + str(graphql_port) + "/graphql"
    )

    json = {"query": query}
    if variables is not None:
        json["variables"] = variables
    try:
        response = requests.post(
            graphql_url,
            json=json,
            headers=graphql_headers,
            cookies=graphql_cookies,
            timeout=20,
        )
    except Exception as e:
        exit_plugin(err=f"[FATAL] Exception with GraphQL request. {e}")
    if response.status_code == 200:
        result = response.json()
        if result.get("error"):
            for error in result["error"]["errors"]:
                if raise_exception:
                    raise Exception(f"GraphQL error: {error}")
                else:
                    log.LogError(f"GraphQL error: {error}")
            return None
        if result.get("data"):
            return result.get("data")
    elif response.status_code == 401:
        exit_plugin(err="HTTP Error 401, Unauthorised.")
    else:
        raise ConnectionError(
            f"GraphQL query failed: {response.status_code} - {response.content}"
        )


def update_scene_title(scene_id, scene_title, port, session, scheme):
    query = """
    mutation UpdateSceneTitle($id: ID!, $title: String) {
            sceneUpdate(
                input: {id: $id, title: $title}
                ) {
                    title
                  }
    }
    """
    variables = {"id": scene_id, "title": scene_title}
    result = doRequest(
        query=query, variables=variables, port=port, session=session, scheme=scheme
    )
    return result.get("sceneUpdate")


def get_scene_base(scene_id, port, session, scheme):
    query = """
    query FindScene($id: ID!, $checksum: String) {
        findScene(id: $id, checksum: $checksum) {
            files {
                basename
            }
        }
    }
    """
    variables = {"id": scene_id}
    result = doRequest(
        query=query, variables=variables, port=port, session=session, scheme=scheme
    )
    return result.get("findScene")


def get_api_version(port, session, scheme):
    query = """
    query SystemStatus {
        systemStatus {
            databaseSchema
            appSchema
        }
    }
    """
    result = doRequest(query=query, port=port, session=session, scheme=scheme)
    return result.get("systemStatus")
