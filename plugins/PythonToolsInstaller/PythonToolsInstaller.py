import shutil
import sys, json, sysconfig
from venv import create
from os.path import abspath
import subprocess
import shutil

def main():
	input = None

	if len(sys.argv) < 2:
		input = readJSONInput()

	output = {}
	run(input, output)

	out = json.dumps(output)
	print(out + "\n")

def readJSONInput():
	input = sys.stdin.read()
	return json.loads(input)


def run(input, output):

	if input == "None" or input == "":
		return


	PLUGIN_DIR = input["server_connection"]["PluginDir"]
	modeArg = input['args']["mode"]

	if modeArg == "" or modeArg == "add":
		return

	elif modeArg == "process_py_stashapi_tools":
		get_download_py_stashapp_tools(PLUGIN_DIR)

	output["output"] = "ok"

def get_download_py_stashapp_tools(PLUGIN_DIR):

	org_packagedir = sysconfig.get_paths()["purelib"]	# /usr/lib/python3.12/site-packages

	used_dir = f"{PLUGIN_DIR}"
	create(f"{used_dir}/venv/", with_pip=True)

	# where requirements.txt is in same dir as this script
	subprocess.run([f"{used_dir}/venv/bin/pip", "install", "-r", abspath(f"{used_dir}/packages/stashtools.txt")],stdout=None)

	# venv/lib/python3.11/site-packages/stashapp_tools-

	src = f"{used_dir}/venv/lib/python3.13/site-packages"
	destination = shutil.copytree(src, org_packagedir,ignore_func,None,shutil.copy2,False,True)
	fp = open(f'{used_dir}/copydo.txt', 'w+')
	fp.write("%s\n" % print(destination))

def ignore_func(src, names):
	return ['env'] if 'env' in names else []


main()
