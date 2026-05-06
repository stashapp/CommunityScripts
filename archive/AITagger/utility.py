import json
import config

def mutate_path(to_mutate):
    if isinstance(to_mutate, str):
        for key, value in config.path_mutation.items():
            to_mutate = to_mutate.replace(key, value)
    elif isinstance(to_mutate, list):
        for i in range(len(to_mutate)):
            to_mutate[i] = mutate_path(to_mutate[i])
    return to_mutate

def read_json_from_file(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)
    
def write_json_to_file(file_path, json_data):
    with open(file_path, 'w') as f:
        f.write(json_data)