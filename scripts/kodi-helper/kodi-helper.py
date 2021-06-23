import argparse
import os
import requests
import math
import re
import json

import config

BATCH_SIZE = 100

def parseArgs():
    parser = argparse.ArgumentParser(description="Generate nfo and strm files for Kodi integration.")
    parser.add_argument("mode", metavar="MODE", choices=["generate-nfo", "generate-strm"], help="generate-nfo or generate-strm")
    parser.add_argument("--inline", action="store_true", help="Generate nfo files along side video files")
    parser.add_argument("--outdir", metavar="<output directory>", help="Generate files in <outdir>")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite nfo/strm files if already present")
    parser.add_argument("--filter", metavar="<filter string>", help="JSON graphql string to filter scenes with")
    parser.add_argument("--hierarchy", metavar="<hierarchy string>", help="Generate strm/nfo files in a hierarchy based on scene metadata. See README for details")
    return parser.parse_args()

# raw plugins may accept the plugin input from stdin, or they can elect
# to ignore it entirely. In this case it optionally reads from the
# command-line parameters.
def main():
    args = parseArgs()
    
    if args.mode == "generate-nfo":
        generateNFOFiles(args)
    elif args.mode == "generate-strm":
        generateSTRMFiles(args)


def generateNFOFiles(args):
    if not args.inline and args.outdir == "":
        print("--outdir or --inline must be set\n")
        return

    filter = args.filter or ""
    if filter != "":
        filter = json.loads(filter)
    else:
        filter = {}

    total = getCount(filter)
    pages = math.ceil(total / BATCH_SIZE)

    i = 1
    while i <= pages:
        print("Processing page {} of {}".format(i, pages))
        scenes = getScenes(i, filter)

        for scene in scenes:
            # don't regenerate if file already exists and not overwriting
            output = getOutputNFOFile(scene["path"], args)
            if not args.overwrite and os.path.exists(output):
                continue
            
            nfo = generateNFO(scene) 
            writeFile(output, nfo)

        i += 1

def parseHierarchy(args):
    h = args.hierarchy
    items = h.split(",")

    ret = {}
    for i in items:
        ret[i] = True
    
    return ret

def generateHierarchyFilenames(scene, args, hierarchyFlags):
    ret = []
    bn = scene["id"]
    if hierarchyFlags.get("studios") and scene["studio"] != None:
        ret.append(os.path.join(args.outdir, "studios", sanitiseName(scene["studio"]["name"]), bn))
    
    if hierarchyFlags.get("tags"):
        for t in scene["tags"]:
            ret.append(os.path.join(args.outdir, "tags", sanitiseName(t["name"]), bn))
    
    if hierarchyFlags.get("performers"):
        for p in scene["performers"]:
            ret.append(os.path.join(args.outdir, "performers", sanitiseName(p["name"]), bn))

    if hierarchyFlags.get("movies"):
        for m in scene["movies"]:
            ret.append(os.path.join(args.outdir, "movies", sanitiseName(m["movie"]["name"]), bn))

    if hierarchyFlags.get("rating") and scene["rating"] != None:
        ret.append(os.path.join(args.outdir, "rating", "{}".format(scene["rating"]), bn))
    
    return ret

def sanitiseName(name: str):
    return re.sub("[*?\":]", "", name)

def generateSTRMFiles(args):
    if args.outdir == "":
        print("--outdir must be set\n")
        return

    filter = args.filter or ""
    if filter != "":
        filter = json.loads(filter)
    else:
        filter = {}

    total = getCount(filter)
    pages = math.ceil(total / BATCH_SIZE)

    hierarchies = parseHierarchy(args)

    i = 1
    while i <= pages:
        print("Processing page {} of {}".format(i, pages))
        scenes = getScenes(i, filter)

        for scene in scenes:
            # TODO - generate hierarchy
            names = generateHierarchyFilenames(scene, args, hierarchies)
            if len(names) == 0:
                names = [os.path.join(args.outdir, scene["id"])]

            for name in names:
                # don't regenerate if file already exists and not overwriting
                strmOut = name + ".strm"
                if args.overwrite or not os.path.exists(strmOut):
                    data = generateSTRM(scene)
                    writeFile(strmOut, data)

                output = name + ".nfo"
                if args.overwrite or not os.path.exists(output):
                    nfo = generateNFO(scene) 
                    writeFile(output, nfo)

        i += 1

def basename(f):
    # file could have a different separator, so check both
    i = f.rfind("\\")
    if i == -1:
        i = f.rfind("/")
    
    return f[i+1:]

def getOutputSTRMFile(sceneID, args):
    return os.path.join(args.outdir, "{}.strm".format(sceneID))

def getOutputNFOFile(sourceFile, args):
    if args.inline:
        # just replace the extension
        return os.path.splitext(sourceFile)[0]+".nfo"

    ret = os.path.join(args.outdir, basename(sourceFile))
    return os.path.splitext(ret)[0]+".nfo"

def getCount(sceneFilter):
    query = """
query findScenes($filter: FindFilterType!, $scene_filter: SceneFilterType!) {
  findScenes(filter: $filter, scene_filter: $scene_filter) {
    count
  }
}
"""
    variables = {
        'filter': {
            'per_page': 0,
        },
        'scene_filter': sceneFilter
    }

    result = __callGraphQL(query, variables)

    return result["findScenes"]["count"]


def getScenes(page, sceneFilter):
    query = """
query findScenes($filter: FindFilterType!, $scene_filter: SceneFilterType!) {
  findScenes(filter: $filter, scene_filter: $scene_filter) {
    scenes {
      id
      title
      path
      rating
      details
      date
      oshash
      paths {
        screenshot
        stream
      }
      studio {
        name
        image_path
      }
      performers {
        name
        image_path
      }
      tags {
        name
      }
      movies {
        movie {
          name
        }
      }
    }
  }
}
"""

    variables = {
        'filter': {
            'per_page': BATCH_SIZE,
            'page': page,
        },
        'scene_filter': sceneFilter
    }

    result = __callGraphQL(query, variables)

    return result["findScenes"]["scenes"]

def addAPIKey(url):
    if config.api_key:
        return url + "&apiKey=" + config.api_key
    return url

def getSceneTitle(scene):
    if scene["title"] != "":
        return scene["title"]
    
    return basename(scene["path"])

def generateSTRM(scene):
    return scene["paths"]["stream"]

def generateNFO(scene):
    ret = """
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<movie>
    <title>{title}</title>
    <userrating>{rating}</userrating>
    <plot>{details}</plot>
    <uniqueid type="stash">{id}</uniqueid>
    {tags}
    <premiered>{date}</premiered>
    <studio>{studio}</studio>
    {performers}
    {thumbs}
    {fanart}
</movie>
"""
    tags = ""
    for t in scene["tags"]:
        tags = tags + """
    <tag>{}</tag>""".format(t["name"])

    rating = ""
    if scene["rating"] != None:
        rating = scene["rating"]

    date = ""
    if scene["date"] != None:
        date = scene["date"]

    studio = ""
    logo = ""
    if scene["studio"] != None:
        studio = scene["studio"]["name"]
        logo = scene["studio"]["image_path"]
        if not logo.endswith("?default=true"):
            logo = addAPIKey(logo)
        else:
            logo = ""

    performers = ""
    i = 0
    for p in scene["performers"]:
        thumb = addAPIKey(p["image_path"])
        performers = performers + """
    <actor>
        <name>{}</name>
        <role></role>
        <order>{}</order>
        <thumb>{}</thumb>
    </actor>""".format(p["name"], i, thumb)
        i += 1

    thumbs = [
        """<thumb aspect="poster">{}</thumb>""".format(scene["paths"]["screenshot"])
    ]
    fanart = [
        """<thumb>{}</thumb>""".format(scene["paths"]["screenshot"])
    ]
    if logo != "":
        thumbs.append("""<thumb aspect="clearlogo">{}</thumb>""".format(logo))
        fanart.append("""<thumb>{}</thumb>""".format(logo))

    fanart = """<fanart>{}</fanart>""".format("\n".join(fanart))

    ret = ret.format(title = getSceneTitle(scene), rating = rating, id = scene["id"], tags = tags, date = date, studio = studio, performers = performers, details = scene["details"] or "", thumbs = "\n".join(thumbs), fanart = fanart)

    return ret

def writeFile(fn, data):
    os.makedirs(os.path.dirname(fn), exist_ok=True)
    f = open(fn, "w", encoding="utf-8-sig")
    f.write(data)
    f.close()

def __callGraphQL(query, variables = None):
    headers = {
		"Accept-Encoding": "gzip, deflate, br",
		"Content-Type": "application/json",
		"Accept": "application/json",
		"Connection": "keep-alive",
		"DNT": "1",
        "ApiKey": config.api_key
    }

    json = {}
    json['query'] = query
    if variables != None:
        json['variables'] = variables
    
    # handle cookies
    response = requests.post(config.server_url, json=json, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        if result.get("error", None):
            for error in result["error"]["errors"]:
                raise Exception("GraphQL error: {}".format(error))
        if result.get("data", None):
            return result.get("data")
    else:
        raise Exception("GraphQL query failed:{} - {}. Query: {}. Variables: {}".format(response.status_code, response.content, query, variables))

main()