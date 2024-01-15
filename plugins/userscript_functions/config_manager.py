import pathlib
import os
from configparser import ConfigParser

def init_config(configpath):
    config_object = ConfigParser()

    config_object["STASH"] = {
        "url": "http://localhost:9999",
        "api_key": ""
    }

    config_object["MEDIAPLAYER"] = {
        "path": "C:/Program Files/VideoLAN/VLC/vlc.exe"
    }

    #Write the above sections to config.ini file
    with open(configpath, 'w') as conf:
        config_object.write(conf)

def get_config_value(configpath, section_key, prop_name):
    config_object = ConfigParser()
    config_object.read(configpath)

    return config_object[section_key][prop_name]

def update_config_value(configpath, section_key, prop_name, new_value):
    config_object = ConfigParser()
    config_object.read(configpath)

    config_object[section_key][prop_name] = new_value

    with open(configpath, 'w') as conf:
        config_object.write(conf)

if __name__ == "__main__":
    init_config(os.path.join(pathlib.Path(__file__).parent.resolve(), 'config.ini'))