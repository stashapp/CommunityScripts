# ModulesValidate (By David Maisonave aka Axter)
# Description:
#               Checks if packages are installed, and optionally install packages if missing.
#               The below example usage code should be plave at the very top of the scource code before any other imports.
# Example Usage:
#                import ModulesValidate
#                ModulesValidate.modulesInstalled(["watchdog", "schedule", "requests"])
# Testing:
#           To test, uninstall packages via command line: pip uninstall -y watchdog schedule requests
import sys, os, pathlib, platform, traceback
# ToDo: Add logic to optionally pull package requirements from requirements.txt file.
#       Add logic to report error sys.exit(126) --  126 (0x7E) ERROR_MOD_NOT_FOUND: The specified module could not be found.

def modulesInstalled(moduleNames, install=True, silent=False):
    retrnValue = True
    for moduleName in moduleNames:
        try: # Try Python 3.3 > way
            import importlib
            import importlib.util
            if moduleName in sys.modules:
                if not silent: print(f"{moduleName!r} already in sys.modules")
            elif isModuleInstalled(moduleName):
                if not silent: print(f"Module {moduleName!r} is available.")
            else:
                if install and (results:=installModule(moduleName)) > 0:
                    if results == 1:
                        print(f"Module {moduleName!r} has been installed")
                    else:
                        if not silent: print(f"Module {moduleName!r} is already installed")
                    continue
                else:
                    if install:
                        print(f"Can't find the {moduleName!r} module") 
                    retrnValue = False
        except Exception as e:
            try:
                i = importlib.import_module(moduleName)
            except ImportError as e:
                if install and (results:=installModule(moduleName)) > 0:
                    if results == 1:
                        print(f"Module {moduleName!r} has been installed")
                    else:
                        if not silent: print(f"Module {moduleName!r} is already installed")
                    continue
                else:
                    if install:
                        tb = traceback.format_exc()
                        print(f"Can't find the {moduleName!r} module! Error: {e}\nTraceBack={tb}") 
                    retrnValue = False
    return retrnValue

def isModuleInstalled(moduleName):
    try:
        __import__(moduleName)
        return True
    except Exception as e:
        pass
    return False

def installModule(moduleName):
    try:
        if isLinux():
            # Note: Linux may first need : sudo apt install python3-pip
            #       if error starts with "Command 'pip' not found"
            #       or includes "No module named pip"
            results = os.popen(f"pip --disable-pip-version-check --version").read()
            if results.find("Command 'pip' not found") != -1 or results.find("No module named pip") != -1:
                results = os.popen(f"sudo apt install python3-pip").read()
                results = os.popen(f"pip --disable-pip-version-check --version").read()
                if results.find("Command 'pip' not found") != -1 or results.find("No module named pip") != -1:
                    return -1
        if isFreeBSD():
            print("Warning: installModule may NOT work on freebsd")
        pipArg = " --disable-pip-version-check"
        if isDocker():
            pipArg += " --break-system-packages"
        results = os.popen(f"{sys.executable} -m pip install {moduleName}{pipArg}").read() # May need to be f"{sys.executable} -m pip install {moduleName}"
        results = results.strip("\n")
        if results.find("Requirement already satisfied:") > -1:
            return 2
        elif results.find("Successfully installed") > -1:
            return 1
        elif modulesInstalled(moduleNames=[moduleName], install=False):
            return 1
    except Exception as e:
        pass
    return 0

def installPackage(package): # Should delete this.  It doesn't work consistently
    try:
        import pip
        if hasattr(pip, 'main'):
            pip.main(['install', package])
        else:
            pip._internal.main(['install', package])
    except Exception as e:
        return False
    return True

def isDocker():
    cgroup = pathlib.Path('/proc/self/cgroup')
    return pathlib.Path('/.dockerenv').is_file() or cgroup.is_file() and 'docker' in cgroup.read_text()

def isWindows():
    if any(platform.win32_ver()):
        return True
    return False

def isLinux():
    if platform.system().lower().startswith("linux"):
        return True
    return False

def isFreeBSD():
    if platform.system().lower().startswith("freebsd"):
        return True
    return False

def isMacOS():
    if sys.platform == "darwin":
        return True
    return False

def isWindows():
    if any(platform.win32_ver()):
        return True
    return False
