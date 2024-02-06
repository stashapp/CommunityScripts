import argparse
import os
import requests
import math
import re
import json

import config

BATCH_SIZE = 100


def parseArgs():
    parser = argparse.ArgumentParser(
        description="Generate nfo and strm files for Kodi integration."
    )
    parser.add_argument(
        "mode",
        metavar="MODE",
        choices=["generate-nfo", "generate-strm"],
        help="generate-nfo or generate-strm",
    )
    parser.add_argument(
        "--inline",
        action="store_true",
        help="Generate nfo files along side video files",
    )
    parser.add_argument(
        "--outdir", metavar="<output directory>", help="Generate files in <outdir>"
    )
    parser.add_argument(
        "--preserve-path",
        action="store_true",
        help="Include source file directory structure in output directory (with --outdir only)",
    )
    parser.add_argument(
        "--truncate-prefix",
        type=str,
        metavar="<path prefix>",
        help="Remove prefix from output directory (with --preserve-path only)",
    )
    parser.add_argument(
        "--use-source-filenames",
        action="store_true",
        help="Use source filenames for strm files instead of stash id",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite nfo/strm files if already present",
    )
    parser.add_argument(
        "--filter",
        metavar="<filter string>",
        help="JSON graphql string to filter scenes with",
    )
    parser.add_argument(
        "--genre",
        metavar="<genre>",
        help="Genre to assign. May be included multiple times",
        action="append",
    )
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
    if not (args.inline or args.outdir):
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
            # skip scenes without files
            if not scene["files"]:
                continue

            # Quick fix for scenes with multiple files
            scene["path"] = scene["files"][0]["path"]
            # don't regenerate if file already exists and not overwriting
            output = getOutputNFOFile(scene["path"], args)
            if not args.overwrite and os.path.exists(output):
                continue

            nfo = generateNFO(scene, args)
            writeFile(output, nfo, True)

        i += 1


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

    i = 1
    while i <= pages:
        print("Processing page {} of {}".format(i, pages))
        scenes = getScenes(i, filter)

        for scene in scenes:
            name = ""
            outdir = getOutputDir(scene["path"], args)

            if args.use_source_filenames:
                name = basename(os.path.splitext(scene["path"])[0])
            else:
                name = scene["id"]

            name = os.path.join(outdir, name)

            # don't regenerate if file already exists and not overwriting
            strmOut = name + ".strm"
            if args.overwrite or not os.path.exists(strmOut):
                data = generateSTRM(scene)
                writeFile(strmOut, data, False)

            output = name + ".nfo"
            if args.overwrite or not os.path.exists(output):
                nfo = generateNFO(scene, args)
                writeFile(output, nfo, True)

        i += 1


def basename(f):
    f = os.path.normpath(f)
    return os.path.basename(f)


def getOutputSTRMFile(sceneID, args):
    return os.path.join(args.outdir, "{}.strm".format(sceneID))


def getOutputDir(sourceFile, args):
    ret = args.outdir

    if args.preserve_path:
        if args.truncate_prefix != None:
            toRemove = args.truncate_prefix
            if sourceFile.startswith(toRemove):
                sourceFile = sourceFile[len(toRemove) :]

        sourceFile = os.path.normpath(sourceFile)
        ret = os.path.join(args.outdir, os.path.dirname(sourceFile))

    return ret


def getOutputNFOFile(sourceFile, args):
    if args.inline:
        # just replace the extension
        return os.path.splitext(sourceFile)[0] + ".nfo"

    outdir = getOutputDir(sourceFile, args)

    ret = os.path.join(outdir, basename(sourceFile))
    return os.path.splitext(ret)[0] + ".nfo"


def getCount(sceneFilter):
    query = """
query findScenes($filter: FindFilterType!, $scene_filter: SceneFilterType!) {
  findScenes(filter: $filter, scene_filter: $scene_filter) {
    count
  }
}
"""
    variables = {
        "filter": {
            "per_page": 0,
        },
        "scene_filter": sceneFilter,
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
      files {
        path
      }
      rating100
      details
      date
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
        "filter": {
            "per_page": BATCH_SIZE,
            "page": page,
        },
        "scene_filter": sceneFilter,
    }

    result = __callGraphQL(query, variables)

    return result["findScenes"]["scenes"]


def addAPIKey(url):
    if config.api_key:
        return url + "&apikey=" + config.api_key
    return url


def getSceneTitle(scene):
    if scene["title"] != None and scene["title"] != "":
        return scene["title"]

    return basename(scene["path"])


def generateSTRM(scene):
    return scene["paths"]["stream"]


def generateNFO(scene, args):
    ret = """<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
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
    {genres}
</movie>"""
    tags = ""
    for t in scene["tags"]:
        tags = (
            tags
            + """
    <tag>{}</tag>""".format(
                t["name"]
            )
        )

    rating = ""
    if scene["rating100"] != None:
        # Kodi uses a 10 point scale, in increments of 0.5
        rating = (2 * scene["rating100"] // 10) / 2.0

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
        performers = (
            performers
            + """
    <actor>
        <name>{}</name>
        <role></role>
        <order>{}</order>
        <thumb>{}</thumb>
    </actor>""".format(
                p["name"], i, thumb
            )
        )
        i += 1

    thumbs = [
        """<thumb aspect="poster">{}</thumb>""".format(
            addAPIKey(scene["paths"]["screenshot"])
        )
    ]
    fanart = ["""<thumb>{}</thumb>""".format(addAPIKey(scene["paths"]["screenshot"]))]
    if logo != "":
        thumbs.append("""<thumb aspect="clearlogo">{}</thumb>""".format(logo))
        fanart.append("""<thumb>{}</thumb>""".format(logo))

    fanart = """<fanart>{}</fanart>""".format("\n".join(fanart))

    genres = []
    if args.genre != None:
        for g in args.genre:
            genres.append("<genre>{}</genre>".format(g))

    ret = ret.format(
        title=getSceneTitle(scene),
        rating=rating,
        id=scene["id"],
        tags=tags,
        date=date,
        studio=studio,
        performers=performers,
        details=scene["details"] or "",
        thumbs="\n".join(thumbs),
        fanart=fanart,
        genres="\n".join(genres),
    )

    return ret


def writeFile(fn, data, useUTF):
    encoding = None
    if useUTF:
        encoding = "utf-8-sig"
    os.makedirs(os.path.dirname(fn), exist_ok=True)
    f = open(fn, "w", encoding=encoding)
    f.write(data)
    f.close()


def __callGraphQL(query, variables=None):
    headers = {
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1",
        "ApiKey": config.api_key,
    }

    json = {}
    json["query"] = query
    if variables != None:
        json["variables"] = variables

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
        raise Exception(
            "GraphQL query failed:{} - {}. Query: {}. Variables: {}".format(
                response.status_code, response.content, query, variables
            )
        )


main()
