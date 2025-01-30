import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json
import time
import re
import requests

per_page = 100

settings = {
    "processWikidata":True,
    "wikidatExtraUrls":True,
    "awards": True,
    "otherInfo": True,
    "createTag": True

}


wikidata_property_urls={
    # Claim P856 = Official Website,   https://www.wikidata.org/wiki/Property:P856
    'P856': '%s',
    # P3351 Adult Film Database actor ID, https://www.wikidata.org/wiki/Property:P3351
    'P3351':'https://www.adultfilmdatabase.com/actor/wd-%s/',
    # P8809 = AIWARDS ID https://www.wikidata.org/wiki/Property:P8809
    'P8809': 'https://aiwards.com/%s',
    # P12776 =  IAFD actor UUID https://www.wikidata.org/wiki/Property:P12776
    'P12776': 'https://www.iafd.com/person.rme/id=%s',
    # P2003 Instagram username https://www.wikidata.org/wiki/Property:P2003
    'P2003': 'https://www.instagram.com/_u/%s/',
    # P8604 OnlyFans username https://www.wikidata.org/wiki/Property:P8604
    'P8604': 'https://onlyfans.com/%s',
    # P4985 TMDB person ID https://www.wikidata.org/wiki/Property:P4985
    'P4985': 'https://www.themoviedb.org/person/%s',
    # P2002 X username  https://www.wikidata.org/wiki/Property:P2002
    'P2002': 'https://x.com/%s',
    # P345 IMDb ID https://www.wikidata.org/wiki/Property:P345
    'P345': 'https://www.imdb.com/name/%s/',
    # P7085 TikTok username
    'P7085': 'https://www.tiktok.com/%s',
    # P12122 ManyVids ID
    'P12122': 'https://www.manyvids.com/Profile/%s/-/',
    # P12478 Brazzers ID
    'P12478': 'https://www.brazzers.com/pornstar/%s/_',
    # P11079 linktree
    'P11079': 'https://linktree.com/%s',
    # P5797 Twitch channel ID
    'P5797': ' https://www.twitch.tv/%s'
}
wikidata_field_properties={
    'P172': 'Ethnic group',
    'P19': 'Place of birth',
    'P106': 'Occupation',
    'P91': 'Sexual Orientation',
    'P69':'Educated At',
    'P102':'Member of political party',
    'P551':'Residence'
}



request_wd = requests.Session()

wd_properties={}
tags_cache={}

def getWDPPropertyLabel(propertyId):
    if propertyId not in wd_properties:
        property_url = 'https://www.wikidata.org/wiki/Special:EntityData/%s.json' % (propertyId,)
        wd2 = request_wd.get(property_url)

        if wd2.status_code == 200:
            data2 = wd2.json()['entities'][propertyId]
            if 'en' in data2['labels']:
                wd_properties[propertyId]=data2['labels']['en']['value']
                return wd_properties[propertyId]
        else:
            wd_properties[propertyId]=''
    return wd_properties[propertyId]


def processWikidata(performer,performer_update,url):
    wikidata_id=url[30:]
    api_url='https://www.wikidata.org/wiki/Special:EntityData/%s.json' % (wikidata_id,)
    log.debug('about to fetch wikidata url: %s' % (api_url,))
    wd=request_wd.get(api_url)
    if wd.status_code==200:
        log.debug(wd.json().keys())
        data=wd.json()['entities'][wikidata_id]
        if settings['wikidatExtraUrls']:
            urls=[]
            for claim,urlstring in wikidata_property_urls.items():
                if claim in data['claims']:
                    for c in data['claims'][claim]:
                        log.debug(claim)
                        url = urlstring % (c['mainsnak']['datavalue']['value'],)
                        if url not in performer['urls']:
                            urls.append(url)

#                        log.debug(url)
            for k, v in data['sitelinks'].items():
                if v['url'] not in performer['urls']:
                    urls.append(v['url'])
            if len(urls) > 0:
                if 'urls' not in performer_update:
                    performer_update['urls'] = performer['urls']
                for url in urls:
                    if url not in performer['urls']:
                        performer_update['urls'].append(url)
                        performer_update['update'] = True
                        log.debug(performer_update)
        if settings['awards']:
            #  award received (P166)
            #  nominated for (P1411)
            for prop in ['P166','P1411']:
                if prop in data['claims']:
                    for c in data['claims'][prop]:
                        log.debug(c)

                        award = {}
                        award_id = c['mainsnak']['datavalue']['value']['id']

                        award['name']= getWDPPropertyLabel(award_id)

                        if 'qualifiers' in c:
                            for q,qv in c['qualifiers'].items():
                                # point in time
                                log.debug('q=%s qv=%s'% (q,qv,))
                                if q=='P585':
                                    if len(qv)> 0:
                                        award['time']=qv[0]['datavalue']['value']['time'][1:5]
                                # Subject of (the event name
                                if q=='P805':
                                    award['venue'] = getWDPPropertyLabel(qv[0]['datavalue']['value']['id'])

                        if award:
                            log.info('award: %s' % (award,))
                            if 'custom_fields' not in performer_update:
                                performer_update['custom_fields']={'full':performer['custom_fields']}
                            award_name=award['name']
                            award_value=award['name']
                            if 'venue' in award and 'time' in award:
                                award_value='%s - %s: %s' % (award['time'], award['venue'],award['name'],)
                            elif 'time' in award:
                                award_value='%s:  %s' % (award['time'],award['name'],)
                            elif 'venue'  in award:
                                award_value='%s: %s' % (award['venue'],award['name'],)
                            if prop=='P1411':
                                award_value='%s - Nominated' % award_value
                            if award_name not in performer_update['custom_fields']['full']:
                                performer_update['custom_fields']['full'][award_name]= award_value
                                performer_update['update'] = True
                                log.debug(performer_update)
                    if settings['createTag']:
                        if prop=='P166':
                            performer_update['tag_names'].append('[Award Winner]')
                            performer_update['update'] = True
                        elif prop=='P1411':
                            performer_update['tag_names'].append('[Award Nominated]')
                            performer_update['update'] = True
        if settings['otherInfo']:
            for claim, label in wikidata_field_properties.items():
                if claim in data['claims']:
                    claim_values=[]
                    for c in data['claims'][claim]:
                        log.debug(c)
                        claim_values.append(getWDPPropertyLabel(c['mainsnak']['datavalue']['value']['id']))
                    if len(claim_values)> 0:
                        if 'custom_fields' not in performer_update:
                            performer_update['custom_fields'] = {'full': performer['custom_fields']}
                        if label not in performer_update['custom_fields']['full']:
                            performer_update['update'] = True
                            performer_update['custom_fields']['full'][label] = ', '.join(claim_values)



def processPerformer(performer):

    performer_update={'id':performer['id'],'update':False,"tag_names":[]}
    log.debug(performer)
    for u in performer['urls']:
        if u.startswith('https://www.wikidata.org') and settings['processWikidata']:
            processWikidata(performer,performer_update,u)
    if performer_update['update']:
        log.debug('needs update')
        performer_update.pop('update')
        performer_update['tag_ids']=[x['id'] for x in performer['tags']]
        for t in performer_update['tag_names']:
            tt = stash.find_tag(t, create=True)
            if tt['id'] not in performer_update['tag_ids']:
                performer_update['tag_ids'].append(tt['id'])
        performer_update.pop('tag_names')



        log.info('updating performer: %s' %  (performer_update,))
        stash.update_performer(performer_update)

def processPerformers():
    query={}
    count = stash.find_scenes(
        f=query,
        filter={"per_page": 1},
        get_count=True,
    )[0]

    for r in range(1, int(count / per_page) + 2):
        i = (r - 1) * per_page
        log.info(
            "fetching data: %s - %s %0.1f%%"
            % (
                (r - 1) * per_page,
                r * per_page,
                (i / count) * 100,
            )
        )
        performers=stash.find_performers(filter={ "direction": "ASC", "page": r, "per_page": per_page, "sort": "created_at"})
        for performer in performers:
            processPerformer(performer)






json_input = json.loads(sys.stdin.read())

FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)

res = stash.call_GQL("{systemStatus {databaseSchema databasePath}}")
settings["schema"] = res["systemStatus"]["databaseSchema"]
config = stash.get_configuration()["plugins"]

if "extraPerformerInfo" in config:
    settings.update(config["extraPerformerInfo"])
log.info("config: %s " % (settings,))


if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    log.debug(json_input)
    if "processAll" == PLUGIN_ARGS:
        if "performer_id" in json_input["args"]:
            performer=stash.find_performer(json_input["args"]["performer_id"])
            processPerformer(performer)
        else:
            processPerformers()

elif "hookContext" in json_input["args"]:
    id = json_input["args"]["hookContext"]["id"]
    if json_input["args"]["hookContext"]["type"] == "Performer.Update.Post":
        stash.run_plugin_task("extraPerformerInfo", "Process all", args={"performer_id": id})

