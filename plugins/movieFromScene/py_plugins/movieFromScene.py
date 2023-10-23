import json
import os
import sys
import time
import log

try:
	import movieFromSceneDef as defs
except Exception:
	output_json = {"output":"", "error": 'Import module movieFromSceneDef.py failed.'}
	sys.exit

# APP/DB Schema version prior to files refactor PR
# 41 is v0.18.0 (11/30/2022)
API_VERSION_BF_FILES = 41  

# check python version
p_version = sys.version
if float( p_version[:p_version.find(".",2)] ) < 3.1 :
	defs.exit_plugin("", "Error: You need at least python 3.10 for this plugin.")

# Get data from Stash
FRAGMENT = json.loads(sys.stdin.read())
# log.LogDebug("Fragment:" + json.dumps(FRAGMENT))


FRAGMENT_SERVER = FRAGMENT["server_connection"]
FRAGMENT_SCENE = FRAGMENT["args"].get("hookContext")

# Graphql properties in a dict
g = { "port": FRAGMENT_SERVER['Port'], 
	"scheme": FRAGMENT_SERVER['Scheme'],
	"session": FRAGMENT_SERVER['SessionCookie']['Value'],
	"args": FRAGMENT["args"],
	"plugin_dir": FRAGMENT_SERVER['PluginDir'],
	"dir": FRAGMENT_SERVER['Dir']}
# log.LogDebug("g:" + str(g) )

if FRAGMENT_SERVER['Host'] == "0.0.0.0":
	g['host'] = 'localhost'
else:
	g['host'] = FRAGMENT_SERVER['Host']

system_status = defs.get_api_version(g)
# log.LogDebug(json.dumps(system_status))

api_version = system_status["appSchema"]

if api_version < API_VERSION_BF_FILES:  # Only needed for versions after files refactor
	defs.exit_plugin(
		f"Stash with API version:{api_version} is not supported. You need at least {API_VERSION_BF_FILES}"
	)

# load config file.
configFile = g['plugin_dir']+"/py_plugins/movieFromScene.config"
try:
	f = open( configFile,"r" )
	config = json.load( f )
	f.close()
except FileNotFoundError as e:
	# This is the default config, when the config file is missing.
	configStr = """
	{
		"mode": "disable",
		"criteria" : {
			"no movie" : true,
			"title" : true,
			"URL" : false,
			"date" : false,
			"studio" : false,
			"performer" : true,
			"tag" : false,
			"details" : true,
			"organized" : false
		}
	}
	"""
	f = open( configFile, "w")
	f.write(configStr)
	f.close()
	config = json.loads(configStr)
except:
	defs.exit_plugin("","Error in config file: movieFromScene.config. Err:" + str(Exception) )

if not FRAGMENT_SCENE:
	match g["args"]["mode"]:
		case "config":
			# log.LogDebug("run the gui process.")
			# Require tkinter module installed in Python.
			import subprocess
			DETACHED_PROCESS = 0x00000008
			g['dir'] = str( g['dir'] ).replace('\\', '/')
			guiPy = g['dir'] + '/' + g['plugin_dir']+"/py_plugins/movieFromSceneGui.py"
			# log.LogDebug("guiPy:" + guiPy)
			subprocess.Popen([sys.executable, guiPy], creationflags=DETACHED_PROCESS)
			defs.exit_plugin("Config GUI launched.")

		case "disable":
			# Disable the plugin and save the setting.
			config['mode'] = "disable"
			bSuccess = defs.SaveSettings(configFile, config)
			if bSuccess:
				defs.exit_plugin("Plugin Disabled.")
			else:
				defs.exit_plugin("Error saving settings.")
			# log.LogDebug("hit the disable button.")
		case "enable":
			config['mode'] = "enable"
			bSuccess = defs.SaveSettings(configFile, config)
			if bSuccess:
				defs.exit_plugin("Plugin Enabled.")
			else:
				defs.exit_plugin("Error saving settings.")

			# log.LogDebug("hit the enable button.")
		case "dryrun":
			config['mode'] = "disable"
			bSuccess = defs.SaveSettings(configFile, config)
			if bSuccess:
				defs.exit_plugin("Plugin in Dry Run mode.")
			else:
				defs.exit_plugin("Error saving settings.")
			
			# log.LogDebug("hit the dryrun button.")
		case "batch":
			log.LogDebug("hit the batch button.")

# The above is for settings run in Tasks.
# The below is for auto movie creation.

if config['mode'] == 'disable':
	defs.exit_plugin("Plugin disabled. Not doing anything.")


scene_id = FRAGMENT_SCENE["id"]
if not scene_id:
	defs.exit_plugin("", "No Scene ID found!")

SCENE = defs.get_scene( scene_id, g )
# Get the scene info
# log.LogDebug("scene:" + json.dumps(SCENE))

defs.create_Movie_By_Config(SCENE, config, g)