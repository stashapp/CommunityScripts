import stashapi.log as log
from stashapi.stashapp import StashInterface
import stashapi.marker_parse as mp
import os
import sys
import requests
import json
import time
import math


per_page = 100
request_s = requests.Session()
scrapers = {}


def processScene(s):
    if "https://timestamp.trade/scene/" in [u[:30] for u in s["urls"]]:
        for url in s["urls"]:
            log.debug(url)
            if url.startswith("https://timestamp.trade/scene/"):
                json_url = "https://timestamp.trade/json-scene/%s" % (url[30:],)
                res = request_s.get(json_url)
                if res.status_code == 200:
                    data = res.json()
                    if len(data) == 0:
                        log.debug("no scene metadata")
                        return
                    log.debug(data)
                    log.debug(s["scene_markers"])
                    log.debug(len(s["scene_markers"]) > 0)
                    if (
                        settings["createMarkers"]
                        and (len(s["scene_markers"]) == 0)
                        or settings["overwriteMarkers"]
                    ):
                        log.debug("creating markers")
                        markers = []
                        for m in data["markers"]:
                            marker = {
                                "seconds": m["start_time"] / 1000,
                                "primary_tag": None,
                                "tags": [],
                                "title": m["name"],
                            }
                            if m["tag_name"]:
                                marker["primary_tag"] = m["tag_name"]
                            else:
                                marker["primary_tag"] = m["name"]
                            markers.append(marker)
                        #                        log.debug(marker)
                        if len(markers) > 0:
                            if settings["overwriteMarkers"]:
                                stash.destroy_scene_markers(s["id"])
                            mp.import_scene_markers(stash, markers, s["id"], 15)
                    new_scene = {
                        "id": s["id"],
                    }
                    needs_update = False
                    if settings["createGalleryFromScene"]:
                        for g in data["galleries"]:
                            for f in g["files"]:
                                res = stash.find_galleries(
                                    f={
                                        "checksum": {
                                            "value": f["md5"],
                                            "modifier": "EQUALS",
                                        },
                                        "tags": {
                                            "depth": 0,
                                            "excludes": [skip_sync_tag_id],
                                            "modifier": "INCLUDES_ALL",
                                            "value": [],
                                        },
                                    }
                                )
                                for gal in res:
                                    #                                log.debug('Gallery=%s'  %(gal,))
                                    needs_update = False
                                    gallery = {
                                        "id": gal["id"],
                                        "title": gal["title"],
                                        "urls": gal["urls"],
                                        "date": gal["date"],
                                        "rating100": gal["rating100"],
                                        "performer_ids": [
                                            x["id"] for x in gal["performers"]
                                        ],
                                        "tag_ids": [x["id"] for x in gal["tags"]],
                                        "scene_ids": [x["id"] for x in gal["scenes"]],
                                        "details": gal["details"],
                                    }
                                    if "studio" in gal:
                                        gallery["studio_id"] = gal["studio"]["id"]
                                    if len(gal["urls"]) == 0:
                                        log.debug(
                                            "no urls on gallery, needs new metadata"
                                        )
                                        gallery["urls"].extend(
                                            [x["url"] for x in g["urls"]]
                                        )
                                        needs_update = True

                                    if s["id"] not in gallery["scene_ids"]:
                                        log.debug(
                                            "attaching scene %s to gallery %s "
                                            % (
                                                s["id"],
                                                gallery["id"],
                                            )
                                        )
                                        gallery["scene_ids"].append(s["id"])
                                        needs_update = True
                                    if needs_update:
                                        log.info("updating gallery: %s" % (gal["id"],))
                                        stash.update_gallery(gallery_data=gallery)

                    if settings["extraUrls"]:
                        if "urls" in data and data["urls"]:
                            extra_urls = s["urls"]
                            for u in data["urls"]:
                                if u not in extra_urls:
                                    extra_urls.append(u)
                                    needs_update = True
                            if needs_update:
                                new_scene["urls"] = extra_urls
                    if settings["createMovieFromScene"]:
                        if "movies" in data:
                            movies_to_add = []
                            for m in data["movies"]:
                                log.debug("movie: %s" % (m,))
                                log.debug("scene: %s" % (s,))
                                movies = []
                                scene_index = None
                                for sc in m["scenes"]:
                                    if sc["scene_id"] == data["scene_id"]:
                                        scene_index = sc["scene_index"]
                                for u in m["urls"]:
                                    sm = stash.find_movies(
                                        f={
                                            "url": {
                                                "modifier": "EQUALS",
                                                "value": u["url"],
                                            }
                                        }
                                    )
                                    log.debug("sm: %s" % (sm,))
                                    movies.extend(sm)
                                if len(movies) == 0:
                                    # we need to determine what scrapers we have and what url patterns they accept, query what url patterns are supported, should only need to check once
                                    if len(scrapers) == 0:
                                        scrapers_graphql = """query ListPerformerScrapers {
                                              listScrapers(types: [MOVIE]) {
                                                  id
                                                  name
                                                  movie {
                                                      urls
                                                      supported_scrapes
                                                  }
                                              }
                                            }"""
                                        res = stash.callGQL(scrapers_graphql)
                                        for r in res["listScrapers"]:
                                            if r["movie"]["urls"]:
                                                for url in r["movie"]["urls"]:
                                                    scrapers[url] = r
                                    created = False
                                    for u in m["urls"]:
                                        # is there a scraper that can scrape this url
                                        for su in scrapers.keys():
                                            if su in u["url"]:
                                                movie_scrape = stash.scrape_movie_url(
                                                    u["url"]
                                                )
                                                if movie_scrape and not created:
                                                    log.debug(
                                                        "move scrape: %s"
                                                        % (movie_scrape,)
                                                    )
                                                    new_movie = {
                                                        "name": movie_scrape["name"],
                                                        "aliases": movie_scrape[
                                                            "aliases"
                                                        ],
                                                        "date": movie_scrape["date"],
                                                        "rating100": movie_scrape[
                                                            "rating"
                                                        ],
                                                        "director": movie_scrape[
                                                            "director"
                                                        ],
                                                        "synopsis": movie_scrape[
                                                            "synopsis"
                                                        ],
                                                        "url": movie_scrape["url"],
                                                        "front_image": movie_scrape[
                                                            "front_image"
                                                        ],
                                                        "back_image": movie_scrape[
                                                            "back_image"
                                                        ],
                                                    }
                                                    if not new_movie["name"]:
                                                        new_movie["name"] = m["title"]
                                                    if new_movie["date"] == "1-01-01":
                                                        new_movie["date"] = None
                                                    if not movie_scrape["url"]:
                                                        new_movie["url"] = u["url"]
                                                    if movie_scrape["studio"]:
                                                        new_movie["studio_id"] = (
                                                            movie_scrape["studio"][
                                                                "stored_id"
                                                            ]
                                                        )
                                                    log.debug(
                                                        "new movie: %s" % (new_movie,)
                                                    )
                                                    nm = stash.create_movie(new_movie)
                                                    if nm:
                                                        movies.append(nm)
                                                        created = True
                                    # the above has not created a movie from either no scraper or a bad scrape, just create the movie manually
                                    if not created:
                                        new_movie = {
                                            "name": m["title"],
                                            "synopsis": m["description"],
                                            "date": m["release_date"],
                                        }
                                        if len(m["urls"]) > 0:
                                            new_movie["url"] = m["urls"][0]["url"]
                                        log.debug("new movie: %s" % (new_movie,))
                                        nm = stash.create_movie(new_movie)
                                        if nm:
                                            movies.append(nm)
                                movies_to_add.extend(
                                    [
                                        {
                                            "movie_id": x["id"],
                                            "scene_index": scene_index,
                                        }
                                        for x in movies
                                    ]
                                )
                            if len(movies_to_add) > 0:

                                new_scene["movies"] = []
                                for m in movies_to_add:
                                    if m["movie_id"] not in [
                                        x["movie"]["id"] for x in s["movies"]
                                    ]:
                                        new_scene["movies"].append(m)
                                        needs_update = True

                    if needs_update:
                        log.debug("updating scene: %s" % (new_scene,))
                        stash.update_scene(new_scene)

    else:
        processSceneStashid(s)


def processSceneStashid(s):
    if len(s["stash_ids"]) == 0:
        log.debug("no scenes to process")
        return
    skip_sync_tag_id = stash.find_tag("[Timestamp: Skip Sync]", create=True).get("id")

    for sid in s["stash_ids"]:
        try:
            if any(tag["id"] == str(skip_sync_tag_id) for tag in s["tags"]):
                log.debug("scene has skip sync tag")
                return
            log.debug("looking up markers for stash id: " + sid["stash_id"])
            res = request_s.get(
                "https://timestamp.trade/get-markers/" + sid["stash_id"]
            )
            if res.status_code != 200:
                log.debug("bad result from api, skipping")
                return
            md = res.json()
            if not md:
                log.debug("bad result from api, skipping")
                return
            if md.get("marker"):
                log.info(
                    "api returned markers for scene: "
                    + s["title"]
                    + " marker count: "
                    + str(len(md["marker"]))
                )
                markers = []
                for m in md["marker"]:
                    # log.debug('-- ' + m['name'] + ", " + str(m['start'] / 1000))
                    marker = {}
                    marker["seconds"] = m["start"] / 1000
                    marker["primary_tag"] = m["tag"]
                    marker["tags"] = []
                    marker["title"] = m["name"]
                    markers.append(marker)
                if len(markers) > 0:
                    log.info("Saving markers")
                    mp.import_scene_markers(stash, markers, s["id"], 15)
            else:
                log.debug("api returned no markers for scene: " + s["title"])
            if settings["createGalleryFromScene"]:
                if "galleries" in md:
                    log.debug("galleries: %s" % (md["galleries"],))
                    skip_sync_tag_id = stash.find_tag(
                        "[Timestamp: Skip Sync]", create=True
                    ).get("id")
                    for g in md["galleries"]:
                        for f in g["files"]:
                            res = stash.find_galleries(
                                f={
                                    "checksum": {
                                        "value": f["md5"],
                                        "modifier": "EQUALS",
                                    },
                                    "tags": {
                                        "depth": 0,
                                        "excludes": [skip_sync_tag_id],
                                        "modifier": "INCLUDES_ALL",
                                        "value": [],
                                    },
                                }
                            )
                            for gal in res:
                                #                                log.debug('Gallery=%s'  %(gal,))
                                needs_update = False
                                gallery = {
                                    "id": gal["id"],
                                    "title": gal["title"],
                                    "urls": gal["urls"],
                                    "date": gal["date"],
                                    "rating100": gal["rating100"],
                                    "performer_ids": [
                                        x["id"] for x in gal["performers"]
                                    ],
                                    "tag_ids": [x["id"] for x in gal["tags"]],
                                    "scene_ids": [x["id"] for x in gal["scenes"]],
                                    "details": gal["details"],
                                }
                                if "studio" in gal:
                                    gallery["studio_id"] = gal["studio"]["id"]
                                if len(gal["urls"]) == 0:
                                    log.debug("no urls on gallery, needs new metadata")
                                    gallery["urls"].extend(
                                        [x["url"] for x in g["urls"]]
                                    )
                                    needs_update = True

                                if s["id"] not in gallery["scene_ids"]:
                                    log.debug(
                                        "attaching scene %s to gallery %s "
                                        % (
                                            s["id"],
                                            gallery["id"],
                                        )
                                    )
                                    gallery["scene_ids"].append(s["id"])
                                    needs_update = True
                                if needs_update:
                                    log.info("updating gallery: %s" % (gal["id"],))
                                    stash.update_gallery(gallery_data=gallery)

            new_scene = {
                "id": s["id"],
            }
            needs_update = False

            if settings["createMovieFromScene"]:
                if "movies" in md:
                    movies_to_add = []
                    for m in md["movies"]:
                        log.debug("movie: %s" % (m,))
                        log.debug("scene: %s" % (s,))
                        movies = []
                        for u in m["urls"]:
                            sm = stash.find_movies(
                                f={"url": {"modifier": "EQUALS", "value": u["url"]}}
                            )
                            log.debug("sm: %s" % (sm,))
                            movies.extend(sm)
                        if len(movies) == 0:
                            for u in m["urls"]:
                                movie_scrape = stash.scrape_movie_url(u["url"])
                                log.debug("move scrape: %s" % (movie_scrape,))
                                new_movie = {
                                    "name": movie_scrape["name"],
                                    "aliases": movie_scrape["aliases"],
                                    "date": movie_scrape["date"],
                                    "rating100": movie_scrape["rating"],
                                    "director": movie_scrape["director"],
                                    "synopsis": movie_scrape["synopsis"],
                                    "url": movie_scrape["url"],
                                    "front_image": movie_scrape["front_image"],
                                    "back_image": movie_scrape["back_image"],
                                }
                                if not movie_scrape["url"]:
                                    new_movie["url"] = u["url"]
                                if movie_scrape["studio"]:
                                    new_movie["studio_id"] = movie_scrape["studio"][
                                        "stored_id"
                                    ]
                                log.debug("new movie: %s" % (new_movie,))
                                nm = stash.create_movie(new_movie)
                                movies.append(nm)
                        movies_to_add.extend(
                            [
                                {"movie_id": x["id"], "scene_index": m["scene_index"]}
                                for x in movies
                            ]
                        )
                    if len(movies_to_add) > 0:
                        new_scene["movies"] = []
                        for m in movies_to_add:
                            if m["movie_id"] not in [
                                x["movie"]["id"] for x in s["movies"]
                            ]:
                                new_scene["movies"].append(m)
                                needs_update = True

            if settings["extraUrls"]:
                if "urls" in md and md["urls"]:
                    extra_urls = s["urls"]
                    for url in md["urls"]:
                        if url["url"] not in s["urls"]:
                            extra_urls.append(url["url"])
                            needs_update = True
                    if needs_update:
                        new_scene["urls"] = extra_urls
            if settings[
                "addTimestampTradeUrl"
            ] and "https://timestamp.trade/scene/" not in [u[:30] for u in s["urls"]]:
                if "urls" not in new_scene:
                    new_scene["urls"] = s["urls"]
                log.debug(md)
                if "scene_id" in md:
                    new_scene["urls"].append(
                        "https://timestamp.trade/scene/%s" % (md["scene_id"],)
                    )
                    needs_update = True
            if needs_update:
                log.debug("new scene update: %s" % (new_scene,))
                stash.update_scene(new_scene)

        except json.decoder.JSONDecodeError:
            log.error("api returned invalid JSON for stash id: " + sid["stash_id"])


def processAll(query):
    log.debug(query)
    log.info("Getting scene count")
    count = stash.find_scenes(
        f=query,
        filter={"per_page": 1},
        get_count=True,
    )[0]
    log.info(str(count) + " scenes to process.")
    i = 0
    for r in range(1, int(count / per_page) + 2):
        log.info(
            "fetching data: %s - %s %0.1f%%"
            % (
                (r - 1) * per_page,
                r * per_page,
                (i / count) * 100,
            )
        )
        scenes = stash.find_scenes(
            f=query,
            filter={"page": r, "per_page": per_page},
        )
        for s in scenes:
            processScene(s)
            i = i + 1
            log.progress((i / count))
            time.sleep(2)


def submitScene(query):
    scene_fgmt = """title
       details
       urls
       date
       performers{
           name
           stash_ids{
              endpoint
              stash_id
           }
       }
       tags{
           name
       }
       studio{
           name
           stash_ids{
              endpoint
              stash_id
           }
       }
       stash_ids{
           endpoint
           stash_id
       }
       scene_markers{
           title
           seconds
           primary_tag{
              name
           }
       }
    galleries{
      title
      urls
      date
      details
      tags{
           name
       }

      studio{
           name
           stash_ids{
              endpoint
              stash_id
           }
      }
      performers{
           name
           stash_ids{
              endpoint
              stash_id
           }
       }

      files{
        basename
        size
        fingerprints{
          type
          value
        }
      }
    }
    movies{
        scene_index
    	movie{
        name
        url
        date
        director
        synopsis
        studio{
           name
           stash_ids{
              endpoint
              stash_id
           }
        }
      }
    }
       """
    count = stash.find_scenes(f=query, filter={"per_page": 1}, get_count=True)[0]
    i = 0
    for r in range(1, math.ceil(count / per_page) + 1):
        log.info(
            "submitting scenes: %s - %s %0.1f%%"
            % (
                (r - 1) * per_page,
                r * per_page,
                (i / count) * 100,
            )
        )
        scenes = stash.find_scenes(
            f=query, filter={"page": r, "per_page": per_page}, fragment=scene_fgmt
        )
        for s in scenes:
            log.debug("submitting scene: " + str(s))
            request_s.post("https://timestamp.trade/submit-stash", json=s)
            i = i + 1
            log.progress((i / count))
            time.sleep(0.5)


def submitGallery():
    scene_fgmt = """    title
    url
    date
    details
    tags{
      name
    }
    studio{
      name
      stash_ids{
        endpoint
        stash_id
      }
    }
    performers{
      name
      stash_ids{
        endpoint
        stash_id
      }
    }

    files{
      basename
      size
      fingerprints{
        type
        value
      }
    }
    scenes{
      title
      details
      url
      date
      performers{
        name
        stash_ids{
          endpoint
          stash_id
        }
      }
      tags{
        name
      }
      studio{
        name
        stash_ids{
          endpoint
          stash_id
        }
      }
      stash_ids{
        endpoint
        stash_id
      }
    }"""

    skip_submit_tag_id = stash.find_tag("[Timestamp: Skip Submit]", create=True).get(
        "id"
    )
    count = stash.find_galleries(
        f={
            "url": {"value": "", "modifier": "NOT_NULL"},
            "tags": {
                "depth": 0,
                "excludes": [skip_submit_tag_id],
                "modifier": "INCLUDES_ALL",
                "value": [],
            },
        },
        filter={"per_page": 1},
        get_count=True,
        fragment=scene_fgmt,
    )[0]
    log.debug(count)
    i = 0
    for r in range(1, math.ceil(count / per_page) + 1):
        log.info(
            "submitting gallery: %s - %s %0.1f%%"
            % (
                (r - 1) * per_page,
                r * per_page,
                (i / count) * 100,
            )
        )
        galleries = stash.find_galleries(
            f={
                "url": {"value": "", "modifier": "NOT_NULL"},
                "tags": {
                    "depth": 0,
                    "excludes": [skip_submit_tag_id],
                    "modifier": "INCLUDES_ALL",
                    "value": [],
                },
            },
            filter={
                "page": r,
                "per_page": per_page,
                "sort": "created_at",
                "direction": "DESC",
            },
            fragment=scene_fgmt,
        )
        for g in galleries:
            log.debug("submitting gallery: %s" % (g,))
            request_s.post("https://timestamp.trade/submit-stash-gallery", json=g)
            i = i + 1
            log.progress((i / count))
            time.sleep(2)


def processGalleries():
    skip_sync_tag_id = stash.find_tag("[Timestamp: Skip Sync]", create=True).get("id")

    count = stash.find_galleries(
        f={
            "url": {"value": "", "modifier": "IS_NULL"},
            "tags": {
                "depth": 0,
                "excludes": [skip_sync_tag_id],
                "modifier": "INCLUDES_ALL",
                "value": [],
            },
        },
        filter={"per_page": 1},
        get_count=True,
    )[0]
    tag_cache = {}

    log.info("count %s " % (count,))
    i = 0
    for r in range(1, math.ceil(count / per_page) + 1):
        log.info(
            "processing gallery scenes: %s - %s %0.1f%%"
            % (
                (r - 1) * per_page,
                r * per_page,
                (i / count) * 100,
            )
        )
        galleries = stash.find_galleries(
            f={
                "url": {"value": "", "modifier": "IS_NULL"},
                "tags": {
                    "depth": 0,
                    "excludes": [skip_sync_tag_id],
                    "modifier": "INCLUDES_ALL",
                    "value": [],
                },
            },
            filter={
                "page": r,
                "per_page": 20,
                "sort": "created_at",
                "direction": "DESC",
            },
        )
        for gal in galleries:
            processGallery(gal)


def processGallery(gallery):
    process = False
    # ignore galleries with a url
    if len(gallery["urls"]) == 0:
        process = True
    # Process the gallery if it has the [Timestamp: Tag Gallery] tag
    tag_gallery_tag_id = stash.find_tag("[Timestamp: Tag Gallery]", create=True).get(
        "id"
    )
    if tag_gallery_tag_id in gallery["tags"]:
        process = True
    if process:
        for f in gallery["files"]:
            for fp in f["fingerprints"]:
                if fp["type"] == "md5":
                    log.debug("looking up galleries by file hash: %s " % (fp["value"],))
                    res = request_s.post(
                        "https://timestamp.trade/gallery-md5/" + fp["value"]
                    )
                    if res.status_code == 200:
                        for g in res.json():
                            log.debug("stash gallery=%s" % (gallery,))
                            log.debug("tt gallery=%s" % (g,))

                            new_gallery = {
                                "id": gallery["id"],
                                "title": g["title"],
                                "urls": [x["url"] for x in g["urls"]],
                                "date": g["release_date"],
                                "rating100": gallery["rating100"],
                                "studio_id": None,
                                "performer_ids": [],
                                "tag_ids": [],
                                "scene_ids": [],
                                "details": g["description"],
                            }
                            for p in g["performers"]:
                                performer_id = None
                                # try looking up stashid
                                for sid in p["stash_ids"]:
                                    performers = stash.find_performers(
                                        f={
                                            "stash_id_endpoint": {
                                                "endpoint": sid["endpoint"],
                                                "stash_id": sid["stash_id"],
                                                "modifier": "EQUALS",
                                            }
                                        }
                                    )
                                    if len(performers) > 0:
                                        performer_id = performers[0]["id"]
                                        log.debug(
                                            "performer matched %s" % (performer_id,)
                                        )
                                        break
                                # look for the performer
                                if not performer_id:
                                    performers = stash.find_performers(q=p["name"])
                                    for perf in performers:
                                        if p["name"].lower() == perf["name"].lower():
                                            performer_id = perf["id"]
                                        for pa in perf["alias_list"]:
                                            if p["name"].lower() == pa.lower():
                                                performer_id = perf["id"]
                                                log.debug("match alias")

                                # performer does not exist, create the performer
                                if not performer_id:
                                    log.info(
                                        "performer %s does not exist, creating"
                                        % (p["name"],)
                                    )
                                    new_perf = stash.create_performer(
                                        performer_in={
                                            "name": p["name"],
                                            "stash_ids": p["stash_ids"],
                                        }
                                    )
                                    performer_id = new_perf["id"]
                                    log.debug(new_perf)
                                new_gallery["performer_ids"].append(performer_id)
                                log.debug(performer_id)

                            for tag in g["tags"]:
                                new_gallery["tag_ids"].append(
                                    stash.find_tag(tag["name"], create=True).get("id")
                                )
                            for sid in g["studio"]["stash_ids"]:
                                stud = stash.find_studios(
                                    f={
                                        "stash_id_endpoint": {
                                            "endpoint": sid["endpoint"],
                                            "stash_id": sid["stash_id"],
                                            "modifier": "EQUALS",
                                        }
                                    }
                                )
                                if len(stud) > 0:
                                    new_gallery["studio_id"] = stud[0]["id"]
                                    break
                            if new_gallery["studio_id"] is None:
                                stud = stash.find_studios(q=g["studio"]["name"])
                                for s in stud:
                                    if s["name"].lower() == g["studio"]["name"].lower():
                                        new_gallery["studio_id"] = s["id"]
                                        break
                                    for sa in s["aliases"]:
                                        if (
                                            sa["name"].lower()
                                            == g["studio"]["name"].lower()
                                        ):
                                            new_gallery["studio_id"] = s["id"]
                                            break

                            log.debug(new_gallery)
                            stash.update_gallery(gallery_data=new_gallery)
                            time.sleep(1)

                    else:
                        log.debug("bad response from api")
                        time.sleep(10)


def getImages(gallery_id):
    images = []
    res = stash.find_images(
        f={"galleries": {"value": [gallery_id], "modifier": "INCLUDES_ALL"}}
    )
    for r in res:
        print(r)
        img = {
            "title": r["title"],
            "filename": r["visual_files"][0]["basename"],
            "size": r["visual_files"][0]["size"],
            "width": r["visual_files"][0]["width"],
            "height": r["visual_files"][0]["height"],
            "md5": r["visual_files"][0]["fingerprints"][0]["value"],
        }
        images.append(img)
        print(img)
    print(images)


json_input = json.loads(sys.stdin.read())

FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)
config = stash.get_configuration()["plugins"]
settings = {
    "createGalleryFromScene": False,
    "createMovieFromScene": False,
    "extraUrls": False,
    "addTimestampTradeUrl": False,
    "disableSceneMarkersHook": False,
    "disableGalleryLookupHook": False,
    "createMarkers": True,
    "overwriteMarkers": False,
}
if "timestampTrade" in config:
    settings.update(config["timestampTrade"])
log.debug("settings: %s " % (settings,))


if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    if "submitScene" == PLUGIN_ARGS:
        skip_submit_tag_id = stash.find_tag(
            "[Timestamp: Skip Submit]", create=True
        ).get("id")
        query = {
            "has_markers": "true",
            "tags": {
                "depth": 0,
                "excludes": [skip_submit_tag_id],
                "modifier": "INCLUDES_ALL",
                "value": [],
            },
        }
        submitScene(query)
    elif "submitMovieScene" == PLUGIN_ARGS:
        skip_submit_tag_id = stash.find_tag(
            "[Timestamp: Skip Submit]", create=True
        ).get("id")
        query = {
            "movies": {"modifier": "NOT_NULL", "value": []},
            "tags": {
                "depth": 0,
                "excludes": [skip_submit_tag_id],
                "modifier": "INCLUDES_ALL",
                "value": [],
            },
        }
        submitScene(query)
    elif "submitSLRScene" == PLUGIN_ARGS:
        skip_submit_tag_id = stash.find_tag(
            "[Timestamp: Skip Submit]", create=True
        ).get("id")
        query = {
            "tags": {
                "depth": 0,
                "excludes": [skip_submit_tag_id],
                "modifier": "INCLUDES_ALL",
                "value": [],
            },
            "url": {"modifier": "INCLUDES", "value": "sexlikereal.com"},
        }
        submitScene(query)
    elif "submitEroscriptScene" == PLUGIN_ARGS:
        skip_submit_tag_id = stash.find_tag(
            "[Timestamp: Skip Submit]", create=True
        ).get("id")
        query = {
            "tags": {
                "depth": 0,
                "excludes": [skip_submit_tag_id],
                "modifier": "INCLUDES_ALL",
                "value": [],
            },
            "url": {"modifier": "INCLUDES", "value": "eroscripts.com"},
        }
        submitScene(query)

    elif "submitGallery" == PLUGIN_ARGS:
        submitGallery()
    elif "processGallery" == PLUGIN_ARGS:
        if "gallery_id" in json_input["args"]:
            gallery = stash.find_gallery(json_input["args"]["gallery_id"])
            processGallery(gallery)
        else:
            processGalleries()
    elif "processScene" == PLUGIN_ARGS:
        skip_sync_tag_id = stash.find_tag("[Timestamp: Skip Sync]", create=True).get(
            "id"
        )
        if "scene_id" in json_input["args"]:
            scene = stash.find_scene(json_input["args"]["scene_id"])
            processScene(scene)
        else:
            query = {
                "stash_id_endpoint": {
                    "endpoint": "",
                    "modifier": "NOT_NULL",
                    "stash_id": "",
                },
                "has_markers": "false",
                "tags": {
                    "depth": 0,
                    "excludes": [skip_sync_tag_id],
                    "modifier": "INCLUDES_ALL",
                    "value": [],
                },
            }
            processAll(query)
    elif "reprocessScene" == PLUGIN_ARGS:
        skip_sync_tag_id = stash.find_tag("[Timestamp: Skip Sync]", create=True).get(
            "id"
        )
        query = {
            "url": {"modifier": "INCLUDES", "value": "https://timestamp.trade/scene/"},
            "tags": {
                "depth": 0,
                "excludes": [skip_sync_tag_id],
                "modifier": "INCLUDES_ALL",
                "value": [],
            },
        }
        processAll(query)
    elif "processAll" == PLUGIN_ARGS:
        skip_sync_tag_id = stash.find_tag("[Timestamp: Skip Sync]", create=True).get(
            "id"
        )
        query = {
            "stash_id_endpoint": {
                "endpoint": "",
                "modifier": "NOT_NULL",
                "stash_id": "",
            },
            "tags": {
                "depth": 0,
                "excludes": [skip_sync_tag_id],
                "modifier": "INCLUDES_ALL",
                "value": [],
            },
        }
        processAll(query)


elif "hookContext" in json_input["args"]:
    _id = json_input["args"]["hookContext"]["id"]
    _type = json_input["args"]["hookContext"]["type"]
    if _type == "Scene.Update.Post" and not settings["disableSceneMarkersHook"]:
        #        scene = stash.find_scene(_id)
        #        processScene(scene)
        stash.run_plugin_task("timestampTrade", "Sync", args={"scene_id": _id})

    if _type == "Gallery.Update.Post" and not settings["disableGalleryLookupHook"]:
        #        gallery = stash.find_gallery(_id)
        #        processGallery(gallery)
        stash.run_plugin_task(
            "timestampTrade", "Sync Gallery", args={"gallery_id": _id}
        )
