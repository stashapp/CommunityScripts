import os
import dateutil.parser as dateparser
from urllib2 import quote

# preferences
preference = Prefs
DEBUG = preference['debug']
if DEBUG:
  Log('Agent debug logging is enabled!')
else:
  Log('Agent debug logging is disabled!')

def ValidatePrefs():
    pass


def Start():
    Log("Stash metadata agent started")
    HTTP.Headers['Accept'] = 'application/json'
    HTTP.CacheTime = 0.1
    ValidatePrefs()


def HttpReq(url, authenticate=True, retry=True):
    Log("Requesting: %s" % url)
    api_string = ''
    if Prefs['APIKey']:
        api_string = '&apikey=%s' % Prefs['APIKey']

    if Prefs['UseHTTPS']:
        connectstring = 'https://%s:%s/graphql?query=%s%s'
    else:
        connectstring = 'http://%s:%s/graphql?query=%s%s'
    try:
        connecttoken = connectstring % (Prefs['Hostname'].strip(), Prefs['Port'].strip(), url, api_string)
        Log(connecttoken)
        return JSON.ObjectFromString(
            HTTP.Request(connecttoken).content)
    except Exception as e:
        if not retry:
            raise e
        return HttpReq(url, authenticate, False)

class StashPlexAgent(Agent.Movies):
    name = 'Stash Plex Agent'
    languages = [Locale.Language.English]
    primary_provider = True
    accepts_from = ['com.plexapp.agents.localmedia', 'com.plexapp.agents.xbmcnfo', 'com.plexapp.agents.phoenixadult', 'com.plexapp.agents.data18-phoenix', 'com.plexapp.agents.adultdvdempire']

    def search(self, results, media, lang):
        DEBUG = Prefs['debug']
        file_query = r"""query{findScenes(scene_filter:{path:{value:"\"<FILENAME>\"",modifier:INCLUDES}}){scenes{id,title,date,studio{id,name}}}}"""
        mediaFile = media.items[0].parts[0].file
        filename = String.Unquote(mediaFile).encode('utf8', 'ignore')
        filename = os.path.splitext(os.path.basename(filename))[0]
        if filename:
            filename = str(quote(filename.encode('UTF-8')))
            query = file_query.replace("<FILENAME>", filename)
            request = HttpReq(query)
            if DEBUG:
                Log(request)
            movie_data = request['data']['findScenes']['scenes']
            score = 100 if len(movie_data) == 1 else 85
            for scene in movie_data:
                if scene['date']:
                    title = scene['title'] + ' - ' + scene['date']
                else:
                    title = scene['title']
                Log("Title Found: " + title + " Score: " + str(score) + " ID:" + scene['id'])
                results.Append(MetadataSearchResult(id = str(scene['id']), name = title, score = int(score), lang = lang))


    def update(self, metadata, media, lang, force=False):
        DEBUG = Prefs['debug']
        Log("update(%s)" % metadata.id)
        mid = metadata.id
        id_query = "query{findScene(id:%s){path,id,title,details,url,date,rating,paths{screenshot,stream}movies{movie{id,name}}studio{id,name,image_path,parent_studio{id,name,details}}organized,stash_ids{stash_id}tags{id,name}performers{name,image_path,tags{id,name}}movies{movie{name}}galleries{id,title,url,images{id,title,path,file{size,width,height}}}}}"
        data = HttpReq(id_query % mid)
        data = data['data']['findScene']
        metadata.collections.clear()

        allow_scrape = False
        if (Prefs["RequireOrganized"] and data["organized"]) or not Prefs["RequireOrganized"]:
            if DEBUG and Prefs["RequireOrganized"]:
                Log("Passed 'Organized' Check, continuing...")
            if (Prefs["RequireURL"] and data["url"]) or not Prefs["RequireURL"]:
                if DEBUG and Prefs["RequireURL"]:
                    Log("Passed 'RequireURL' Check, continuing...")
                if (Prefs["RequireStashID"] and len(data["stash_ids"])) or not Prefs["RequireStashID"]:
                    if DEBUG and Prefs["RequireStashID"]:
                        Log("Passed 'RequireStashID' Check, continuing...")
                    allow_scrape = True
                else:
                    Log("Failed 'RequireStashID' Check, stopping.")
                    allow_scrape = False
            else:
                Log("Failed 'RequireURL' Check, stopping.")
                allow_scrape = False
        else:
            Log("Failed 'Organized' Check, stopping.")
            allow_scrape = False

        if allow_scrape:
            if data['date']:
                try:
                    Log("Trying to parse:" + data["date"])
                    date=dateparser().parse(data["date"])
                except Exception as ex:
                    Log(ex)
                    date=None
                    pass
                # Set the date and year if found.
                if date is not None:
                    metadata.originally_available_at = date
                    metadata.year = date.year

            # Get the title
            if data['title']:
                metadata.title = data["title"]

            # Get the Studio
            if not data["studio"] is None:
                metadata.studio = data["studio"]["name"]

            # Get the rating
            if not data["rating"] is None:
                metadata.rating = float(data["rating"]) * 2
                if Prefs["CreateRatingTags"]:
                    if int(data["rating"]) > 0:
                        rating = str(int(data["rating"]))
                        ratingstring = "Rating: " + rating + " Stars"
                        try:
                            metadata.collections.add(ratingstring)
                        except:
                            pass

            # Set the summary
            if data['details']:
                summary = data["details"].replace("\n", " ").replace("\r", "").replace("\t", "")
                metadata.summary = summary

            # Set series and add to collections
            if Prefs["CreateSiteCollectionTags"]:
                if not data["studio"] is None:
                    if Prefs["PrefixSiteCollectionTags"]:
                        SitePrefix = Prefs["PrefixSiteCollectionTags"]
                    else:
                        SitePrefix = "Site: "
                    site = SitePrefix + data["studio"]["name"]
                    try:
                        if DEBUG:
                            Log("Adding Site Collection: " + site)
                        metadata.collections.add(site)
                    except:
                        pass
            if Prefs["CreateStudioCollectionTags"]:
                if not data["studio"] is None:
                    if Prefs["PrefixStudioCollectionTags"]:
                        StudioPrefix = Prefs["PrefixStudioCollectionTags"]
                    else:
                        StudioPrefix = "Studio: "
                    if not data["studio"]["parent_studio"] is None:
                        site = StudioPrefix + data["studio"]["parent_studio"]["name"]
                    else:
                        if Prefs["UseSiteForStudioCollectionTags"]:
                            site = StudioPrefix + data["studio"]["name"]
                        else:
                            site = None
                    try:
                        if DEBUG:
                            Log("Adding Studio Collection: " + site)
                        if site:
                            metadata.collections.add(site)
                    except:
                        pass
            if Prefs["CreateMovieCollectionTags"]:
                if not data["movies"] is None:
                    for movie in data["movies"]:
                        if Prefs["PrefixMovieCollectionTags"]:
                            MoviePrefix = Prefs["PrefixMovieCollectionTags"]
                        else:
                            MoviePrefix = "Movie: "
                        if "name" in movie["movie"]:
                            movie_collection = MoviePrefix + movie["movie"]["name"]
                        try:
                            if DEBUG:
                                Log("Adding Movie Collection: " + movie_collection)
                            metadata.collections.add(movie_collection)
                        except:
                            pass
            if Prefs["CreatePerformerCollectionTags"]:
                if not data["performers"] is None:
                    for performer in data["performers"]:
                        if Prefs["CreatePerformerCollectionTags"]:
                            PerformerPrefix = Prefs["PrefixPerformerCollectionTags"]
                        else:
                            PerformerPrefix = "Actor: "
                        if "name" in performer:
                            actor_collection = PerformerPrefix + performer["name"]
                        try:
                            if DEBUG:
                                Log("Adding Performer Collection: " + actor_collection)
                            metadata.collections.add(actor_collection)
                        except:
                            pass

            # Add the genres
            metadata.genres.clear()
            if Prefs["IgnoreTags"]:
                ignore_tags = Prefs["IgnoreTags"].split(",")
                ignore_tags = list(map(lambda x: x.strip(), ignore_tags))
            else:
                ignore_tags = []
            if Prefs["CreateTagCollectionTags"]:
                collection_tags = Prefs["CreateTagCollectionTags"].split(",")
                collection_tags = list(map(lambda x: x.strip(), collection_tags))
            else:
                collection_tags = []
            try:
                if data["tags"]:
                    genres = data["tags"]
                    for genre in genres:
                        if not genre["id"] in ignore_tags and "ambiguous" not in genre["name"].lower():
                            metadata.genres.add(genre["name"])
                            if not Prefs["CreateAllTagCollectionTags"] and genre["id"] in collection_tags:
                                try:
                                    if DEBUG:
                                        Log("Adding Tag Collection: " + genre["name"])
                                    metadata.collections.add(genre["name"])
                                except:
                                    pass
                            elif Prefs["CreateAllTagCollectionTags"] and genre["id"] not in collection_tags:
                                try:
                                    if DEBUG:
                                        Log("Adding Tag Collection: " + genre["name"])
                                    metadata.collections.add(genre["name"])
                                except:
                                    pass
                if Prefs["AppendPerformerTags"]:
                    for performer in data["performers"]:
                        if performer["tags"]:
                            genres = performer["tags"]
                            for genre in genres:
                                if not genre["id"] in ignore_tags and "ambiguous" not in genre["name"].lower() and genre["name"] not in metadata.genres:
                                    if DEBUG:
                                        Log("Added Performer (" + performer['name'] + ") tag to scene: " + genre['name'] )
                                    metadata.genres.add(genre["name"])
                                    if genre["id"] in collection_tags:
                                        try:
                                            if DEBUG:
                                                Log("Adding Tag Collection: " + genre["name"])
                                            metadata.collections.add(genre["name"])
                                        except:
                                            pass
            except:
                pass

            # Add the performers
            metadata.roles.clear()
            # Create and populate role with actor's name
            try:
                if data["performers"]:
                    api_string = ""
                    if Prefs['APIKey']:
                        api_string = '&apikey=%s' % Prefs['APIKey']
                    models=data["performers"]
                    for model in models:
                        if DEBUG:
                            Log("Pulling Model: " + model["name"] + " With Image: " + model["image_path"])
                        role = metadata.roles.new()
                        role.name = model["name"]
                        role.photo = model["image_path"] + api_string
            except:
                pass

            # Add posters and fan art.
            if not data["paths"]["screenshot"] is None:
                api_string = ""
                if Prefs['APIKey']:
                    api_string = '&apikey=%s' % Prefs['APIKey']
                try:
                    thumb = HTTP.Request(data["paths"]["screenshot"] + api_string)
                    metadata.posters[data["paths"]["screenshot"] + api_string] = Proxy.Preview(thumb, sort_order=0)
                    metadata.art[data["paths"]["screenshot"] + api_string] = Proxy.Preview(thumb, sort_order=0)
                except Exception as e:
                    pass

            if Prefs["IncludeGalleryImages"]:
                api_string = ""
                if Prefs['APIKey']:
                    api_string = '&apikey=%s' % Prefs['APIKey']
                if Prefs['UseHTTPS']:
                    imagestring = 'https://%s:%s/image/%s/image' + api_string
                else:
                    imagestring = 'http://%s:%s/image/%s/image' + api_string
                if not data["galleries"] is None:
                    for gallery in data["galleries"]:
                        for image in gallery["images"]:
                            if Prefs["SortGalleryImages"]:
                                if image["file"]["height"] > image["file"]["width"]:
                                    image_orientation = "poster"
                                else:
                                    image_orientation = "background"
                            else:
                                image_orientation = "all"
                            imageurl = imagestring % (Prefs['Hostname'], Prefs['Port'], image["id"])
                            try:
                                thumb = HTTP.Request(imageurl)
                                if image_orientation == "poster" or image_orientation == "all":
                                    if DEBUG:
                                        Log("Inserting Poster image: " + image["title"] + " (" + str(image["file"]["width"]) + "x" + str(image["file"]["height"]) + " WxH)")
                                    metadata.posters[imageurl] = Proxy.Preview(thumb)
                                if image_orientation == "background" or image_orientation == "all":
                                    if DEBUG:
                                        Log("Inserting Background image: " + image["title"] + " (" + str(image["file"]["width"]) + "x" + str(image["file"]["height"]) + " WxH)")
                                        metadata.art[imageurl] = Proxy.Preview(thumb)
                            except Exception as e:
                                pass
