import json
import os
import re
import sys
import zipfile
from datetime import datetime

import requests

import log

FRAGMENT = json.loads(sys.stdin.read())
FRAGMENT_SERVER = FRAGMENT["server_connection"]
FRAGMENT_ARG = FRAGMENT['args']['mode']
log.LogDebug("Starting Plugin: Github Scraper Checker")

CHECK_LOG = False
GET_NEW_FILE = False
OVERWRITE = False

if FRAGMENT_ARG == "CHECK":
    CHECK_LOG = True
if FRAGMENT_ARG == "NEWFILE":
    GET_NEW_FILE = True
if FRAGMENT_ARG == "OVERWRITE":
    OVERWRITE = True


def graphql_getScraperPath():
    query = """
    query Configuration {
        configuration {
            general {
                scrapersPath
            }
        }
    }
    """
    result = callGraphQL(query)
    return result["configuration"]["general"]["scrapersPath"]


def callGraphQL(query, variables=None):
    # Session cookie for authentication
    graphql_port = FRAGMENT_SERVER['Port']
    graphql_scheme = FRAGMENT_SERVER['Scheme']
    graphql_cookies = {
        'session': FRAGMENT_SERVER.get('SessionCookie').get('Value')
    }
    graphql_headers = {
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1"
    }
    if FRAGMENT_SERVER.get('Domain'):
        graphql_domain = FRAGMENT_SERVER['Domain']
    else:
        if FRAGMENT_SERVER.get('Host'):
            graphql_domain = FRAGMENT_SERVER['Host']
        else:
            graphql_domain = 'localhost'
    # Because i don't understand how host work...
    graphql_domain = 'localhost'
    # Stash GraphQL endpoint
    graphql_url = graphql_scheme + "://" + \
        graphql_domain + ":" + str(graphql_port) + "/graphql"

    json = {'query': query}
    if variables is not None:
        json['variables'] = variables
    try:
        response = requests.post(
            graphql_url, json=json, headers=graphql_headers, cookies=graphql_cookies, timeout=10)
    except:
        sys.exit("[FATAL] Error with the graphql request, are you sure the GraphQL endpoint ({}) is correct.".format(
            graphql_url))
    if response.status_code == 200:
        result = response.json()
        if result.get("error"):
            for error in result["error"]["errors"]:
                raise Exception("GraphQL error: {}".format(error))
        if result.get("data"):
            return result.get("data")
    elif response.status_code == 401:
        sys.exit("HTTP Error 401, Unauthorised.")
    else:
        raise ConnectionError("GraphQL query failed:{} - {}. Query: {}. Variables: {}".format(
            response.status_code, response.content, query, variables))


def file_getlastline(path):
    line = bytes()
    with open(path, 'r', encoding="utf-8") as f:
        for line in f:
            pass
        last_line = line
    return last_line


def get_date(line):
    try:
        date = datetime.strptime(re.sub(r".*#.*Last Updated\s*", "", line), "%B %d, %Y")
    except:
        return None
    return date


scraper_folder_path = graphql_getScraperPath()
GITHUB_LINK = "https://github.com/stashapp/CommunityScrapers/archive/refs/heads/master.zip"

try:
    r = requests.get(GITHUB_LINK, timeout=10)
except:
    sys.exit("Failing to download the zip file.")
zip_path = os.path.join(scraper_folder_path, "github.zip")
log.LogDebug(zip_path)
with open(zip_path, "wb") as zip_file:
    zip_file.write(r.content)

with zipfile.ZipFile(zip_path) as z:
    for filename in z.namelist():
        #  Only care about the scrapers folders
        if "/scrapers/" in filename:
            # read the file
            line = bytes()
            with z.open(filename) as f:
                for line in f:
                    pass
                last_line = line.decode().strip()
            # Got last line
            gh_last = last_line
            if not gh_last:
                continue
            # Filename abc.yml
            gh_file = os.path.basename(filename)
            gh_date = get_date(gh_last)
            path_local = os.path.join(scraper_folder_path, gh_file)
            if OVERWRITE:
                with z.open(filename) as f:
                    scraper_content = f.read()
                    with open(path_local, 'wb') as yml_file:
                        yml_file.write(scraper_content)
                        log.LogInfo("Replacing/Creating {}".format(gh_file))
                        continue
            elif os.path.exists(path_local):
                local_updated = file_getlastline(path_local).strip()
                local_date = get_date(local_updated)
                if local_date is None or gh_date is None:
                    log.LogError("[{}] Problem getting date (L:{}|Gh:{})".format(gh_file, local_date, gh_date))
                    continue
                if gh_date > local_date and CHECK_LOG:
                    log.LogInfo("[{}] New version on github".format(gh_file))
            elif GET_NEW_FILE:
                # File don't exist local so we take the github version.
                with z.open(filename) as f:
                    scraper_content = f.read()
                    with open(path_local, 'wb') as yml_file:
                        yml_file.write(scraper_content)
                        log.LogInfo("Creating {}".format(gh_file))
                        continue
            elif CHECK_LOG:
                log.LogWarning("[{}] File don't exist locally".format(gh_file))

os.remove(zip_path)
