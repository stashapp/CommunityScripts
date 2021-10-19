import os
import re
import time
import string
import thread
import threading
import copy
import json
import dateutil.parser as dateparser
from urllib2 import HTTPError
from urllib2 import quote
from datetime import datetime
from lxml import etree
    
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
        connecttoken = connectstring % (Prefs['Hostname'], Prefs['Port'], url, api_string)
        Log(connecttoken)
        return JSON.ObjectFromString(
            HTTP.Request(connecttoken).content)
    except Exception, e:
        if not retry:
            raise e
        return HttpReq(url, authenticate, False)
        
class StashPlexAgent(Agent.Movies):
    name = 'Stash Plex Agent'
    languages = [Locale.Language.English]
    primary_provider = True
    accepts_from = [
        'com.plexapp.agents.xbmcnfo'
    ]    
    
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
        id_query = "query{findScene(id:%s){path,id,title,details,url,date,rating,paths{screenshot,stream}studio{id,name,image_path,parent_studio{id,name,details}}tags{id,name}performers{name,image_path}movies{movie{name}}}}"
        data = HttpReq(id_query % mid)
        data = data['data']['findScene']
        metadata.collections.clear()
      
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
            summary=data["details"].replace("\n"," ").replace("\r", "").replace("\t","")
            metadata.summary = summary

        # Set series and add to collections
        if Prefs["CreateCollectionTags"]:
            if not data["studio"] is None:
                site="Site: " + data["studio"]["name"]
                try:
                    metadata.collections.add(site)
                except:
                    pass
                if not data["studio"]["parent_studio"] is None:
                    site="Studio: " + data["studio"]["parent_studio"]["name"]
                else:
                    site="Studio: " + data["studio"]["name"]
                try:
                    metadata.collections.add(site)
                except:
                    pass
            
        # Add the genres
        metadata.genres.clear()
        if Prefs["IgnoreTags"]:
            ignore_tags = Prefs["IgnoreTags"].split(",")
            ignore_tags = list(map(lambda x: x.strip(), ignore_tags))
        try:
            if data["tags"]:
                genres = data["tags"]
                for genre in genres:
                    if not genre["id"] in ignore_tags and "ambiguous" not in genre["name"].lower():
                        metadata.genres.add(genre["name"])
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
                    role.name=model["name"]
                    role.photo=model["image_path"] + api_string
        except:
            pass

        # Add posters and fan art.
        if not data["paths"]["screenshot"] is None:
            api_string = ""
            if Prefs['APIKey']:
                api_string = '&apikey=%s' % Prefs['APIKey']            
            try:
                thumb = HTTP.Request(data["paths"]["screenshot"] + api_string)
                metadata.posters[data["paths"]["screenshot"] + api_string] = Proxy.Preview(thumb)
                metadata.art[data["paths"]["screenshot"] + api_string] = Proxy.Preview(thumb)
            except:
                pass
            
