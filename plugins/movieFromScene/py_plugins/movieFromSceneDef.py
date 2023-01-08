import json
import sys
import log
import requests

def SaveSettings(configFile, config):
	try:
		f = open(configFile, "w")
		json.dump(config, f)
		f.close()
	except Exception:
		return False

	# Success.
	return True

def exit_plugin(msg=None, err=None):
    if msg is None and err is None:
        msg = "plugin ended"
    output_json = {"output": msg, "error": err}
    print(json.dumps(output_json))
    sys.exit()

def doRequest(query, variables, g, raise_exception=True):
    # Session cookie for authentication
    graphql_host = g['host']
    graphql_port = g['port']
    graphql_scheme = g['scheme']
    graphql_cookies = {
        'session': g['session']
    }

    graphql_headers = {
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1"
    }

    # Stash GraphQL endpoint
    graphql_url = graphql_scheme + "://" + graphql_host + ":" + str(graphql_port) + "/graphql"

    json = {'query': query}
    if variables is not None:
        json['variables'] = variables
    try:
        response = requests.post(graphql_url, json=json,headers=graphql_headers, cookies=graphql_cookies, timeout=20)
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
        raise ConnectionError(f"GraphQL query failed: {response.status_code} - {response.content}")

def get_scene(scene_id, g):
    query = """
    query FindScene($id: ID!, $checksum: String) {
        findScene(id: $id, checksum: $checksum) {
			id,
			title,
			files{
				basename,
				duration
			},
			movies{
				movie{
					id,
					duration
				}
			},
			date,
			url,
			details,
			studio{
				id,
				name
			},
			performers{
				id,
				name
			}
			tags{
				id,
				name
			}
			paths{
				screenshot
			}
		}
    }
    """
    variables = {
        "id": scene_id
    }
    result = doRequest(query=query, variables=variables, g=g)
    return result['findScene']

def get_api_version(g):
    query = """
    query SystemStatus {
        systemStatus {
            databaseSchema
            appSchema
        }
    }
    """
    result = doRequest(query, None, g)
    return result['systemStatus']

def create_movie_from_scene(s, g):
	# scene is the whole scene dictionary with all the info
	# A movie must have a valid title.
	title = s["title"]
	if not title:
		title = getDict(s, "files", "basename" )

	# Special treatment for duration.
	if not s["files"]:
		duration = None
	else:
		duration = int( s["files"][0].get("duration") )

	query = """
	mutation movieCreate(
		$name: String!,
		$duration: Int,
		$date: String,
		$studio_id: ID,
		$synopsis: String,
		$url: String,
		$front_image: String
		)
	{
	movieCreate(
		input: {
		name: $name,
		duration: $duration,
		date: $date,
		studio_id: $studio_id,
		synopsis: $synopsis,
		url: $url,
		front_image: $front_image
		})
		{
			id
		}
	}
	"""

	variables = {
		"name": title,
		"duration": duration,
		"date": getDict(s,"date", type = "date"),
		"studio_id": getDict( s, "studio", "id", type="number"),
		"synopsis": getDict(s, "details"),
		"url": getDict( s, "link"),
		"front_image": getDict( s,"paths","screenshot")
	}
	log.LogDebug( "movie var:" + json.dumps(variables))
	try:
		result = doRequest(query, variables, g)
		return result['movieCreate']["id"]
	except Exception:
		exit_plugin("", "Error in creating movie.")

def sceneLinkMovie(scene_id, movie_id, g):
	query = """
	mutation SceneUpdate($scene_id: ID!, $movie_id: ID! ){
		sceneUpdate(
			input:{
				id: $scene_id,
				movies:[
					{ movie_id : $movie_id}
				]
			}
		) { id }
	}
	"""
	vars = {
		"scene_id": scene_id,
		"movie_id": movie_id
	}
	try:
		result = doRequest(query, vars, g)
		return result['sceneUpdate']["id"]
	except Exception:
		exit_plugin("", "error in linking movie to scene")

def create_Movie_By_Config(s, config, g):
	# s = SCENE
	# ct = the criteria
	ct = config['criteria']
	scene_id = s["id"]
	# Does this scene have a movie?
	bDryRun = ( config['mode'] == 'dryrun' )

	if ct["no movie"] and s["movies"]:
		# Criteria is "Have No movie", yet scene has movie
		exit_plugin("Skip. Scene " + str(scene_id) + " has movie already.")

	if ct["title"] and not s["title"]:
		# Criteria is "has title", yet scene has no title
		exit_plugin("Skip. Scene " + str(scene_id) + " has no title.")

	if ct["URL"] and not s["url"]:
		# Criteria is "has URL", yet scene has no url
		exit_plugin("Skip. Scene " + str(scene_id) + " has no URL.")

	if ct["date"] and not s["date"]:
		# Criteria is "has date", yet scene has no date
		exit_plugin("Skip. Scene " + str(scene_id) + " has no date.")

	if ct["studio"] and not s["studio"]:
		# Criteria is "has studio", yet scene has no studio
		exit_plugin("Skip. Scene " + str(scene_id) + " has no studio.")

	if ct["performer"] and not s["performers"]:
		# Criteria is "has performer", yet scene has no performer
		exit_plugin("Skip. Scene " + str(scene_id) + " has no performers.")

	if ct["tag"] and not s["tags"]:
		# Criteria is "has tag", yet scene has no tag
		exit_plugin("Skip. Scene " + str(scene_id) + " has no URL.")

	if ct["details"] and not s["details"]:
		# Criteria is "has details", yet scene has no details
		exit_plugin("Skip. Scene " + str(scene_id) + " has no details.")

	if ct["organized"] and not s["organized"]:
		# Criteria is "Is Organized", yet scene is not organized
		exit_plugin("Skip. Scene " + str(scene_id) + " is not organized.")

	# Pass all of the above. Now the scene can be made into a movie.

	# Try to get something like "http://localhost:9999/scenes/1234" from screenshot
	strScreen = s["paths"]["screenshot"]
	link = str( strScreen[:strScreen.rfind("/")])    # Add the scene's "link" item to the dict
	s["link"] = link.replace("scene", "scenes")
	
	# Create a movie and set the detail from
	if not bDryRun:
		movie_id = create_movie_from_scene(s,g)

	# Link this movie to the scene.
	if not bDryRun:
		sceneLinkMovie(scene_id, movie_id, g)

	if bDryRun:
		exit_plugin("Dryrun: Movie with scene id: " + scene_id + " created.")
	else:
		exit_plugin("Movie with scene id: " + scene_id + " created. Movie id is:" + movie_id)

def getDict( rootDict, firstLevel, secondLevel="", type="string" ):
	# Safely reference the first level and second level of dictionary object
	if not rootDict:
		return empty(type)

	if not rootDict.get(firstLevel):
		return empty(type)

	if secondLevel == "":
		# No second level
		return rootDict.get(firstLevel)
	else:
		# Has second level
		if not rootDict[firstLevel].get(secondLevel):
			return empty(type)
		else:
			return rootDict[firstLevel][secondLevel]

def empty(type):
	# return empty according to type.
	match type:
		case "string":
			return ""
		case "date" | "number":
			return None
