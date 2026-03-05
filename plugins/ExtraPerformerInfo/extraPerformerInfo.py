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
    'P551':'Residence',
    'P3373': 'Sibling'
}



request_wd = requests.Session()

wd_properties={}
tags_cache={}

def getWDPPropertyLabel(propertyId):
    if propertyId not in wd_properties:
        property_url = 'https://www.wikidata.org/wiki/Special:EntityData/%s.json' % (propertyId,)
        wd2 = request_wd.get(property_url)

        if wd2.status_code == 200:
            log.debug(wd2.json())
#            data2 = wd2.json()['entities']
            for k,data2 in wd2.json()['entities'].items():
                if 'en' in data2['labels']:
                    data2['label']=data2['labels']['en']['value']
                if 'mul' in data2['labels']:
                    data2['label']=data2['labels']['mul']['value']
                if 'label' not in data2:
                    if len(data2['labels']) ==0:
                        label=''
                    else:
                        key=next(iter(data2['labels']))
                        data2['label'] = data2['labels'][key]['value']

                if k !=propertyId:
                    wd_properties[k]=data2
                else:
                    wd_properties[propertyId]=data2
                return data2
        else:
            wd_properties[propertyId]=''
    return wd_properties[propertyId]


def processWikidata(performer,performer_update,url):
    wikidata_id=url[30:]
    api_url='https://www.wikidata.org/wiki/Special:EntityData/%s.json' % (wikidata_id,)
    log.debug('about to fetch wikidata url: %s for performer %s' % (api_url,performer['name'],))
    wd=request_wd.get(api_url)
    if wd.status_code==200:
#        log.debug(wd.json().keys())

        data2=wd.json()['entities']
        data=data2[next(iter(data2))]
        if settings['wikidatExtraUrls']:
            urls=[]
            for claim,urlstring in wikidata_property_urls.items():
                if claim in data['claims']:
                    for c in data['claims'][claim]:
#                        log.debug(claim)
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
            won_award=[]
            nominated_award=[]
            award_totals={}
            nominated_totals={}
            #  award received (P166)
            #  nominated for (P1411)
            for prop in ['P166','P1411']:
                if prop in data['claims']:
                    for c in data['claims'][prop]:
                        log.debug(c)


                        award = {}
                        award_id = c['mainsnak']['datavalue']['value']['id']

                        award['wd']= getWDPPropertyLabel(award_id)
                        award['name']=award['wd']['label']
                        award['label'] = award['wd']['label']

                        if prop == 'P166':
                            award['type']='award received'
                        elif prop == 'P1411':
                            award['type']='nominated'


                        if 'P1027' in award['wd']['claims'].keys():
                            award['conferred_wd']=getWDPPropertyLabel(award['wd']['claims']['P1027'][0]['mainsnak']['datavalue']['value']['id'])
                            award['conferred'] =award['conferred_wd']['label']
                            if award['type']=='award received':
                                if award['conferred'] not in award_totals:
                                    award_totals[award['conferred']]=0
                                award_totals[award['conferred']] =award_totals[award['conferred']] +1
                                if settings['createTag']:
                                    performer_update['tag_names'].append(
                                            '[%s Award Winner]' % (award['conferred'],))

                            else:
                                if award['conferred'] not in nominated_totals:
                                    nominated_totals[award['conferred']]=0
                                nominated_totals[award['conferred']] =nominated_totals[award['conferred']] +1
                                if settings['createTag']:
                                    performer_update['tag_names'].append('[%s Award Nominated]' % (award['conferred'],))
                        else:
                            if award['type']=='award received':
                                if 'unknown' not in nominated_totals:
                                    award_totals['unknown'] = 0
                                award_totals['unknown'] = award_totals['unknown'] + 1
                            else:
                                if 'unknown' not in nominated_totals:
                                    nominated_totals['unknown']=0
                                nominated_totals['unknown'] =nominated_totals['unknown'] +1


                        # sublcass of, can be award for best scene
                        if 'P279' in award['wd']['claims'].keys():
                            award['subclass_wd'] = getWDPPropertyLabel(award['wd']['claims']['P279'][0]['mainsnak']['datavalue']['value']['id'])
                            award['subclass'] = award['subclass_wd']['label']




                        if 'qualifiers' in c:
                            for q,qv in c['qualifiers'].items():
                                # point in time
                                log.debug('q=%s qv=%s'% (q,qv,))
                                if q=='P585':
                                    if len(qv)> 0:
                                        award['time']=qv[0]['datavalue']['value']['time'][1:5]
                                # Subject of (the event name)
                                if q=='P805':
                                    award['venue_wd'] = getWDPPropertyLabel(qv[0]['datavalue']['value']['id'])
                                    award['venue'] = award['venue_wd']['label']
                                # Award Rationale
                                if q=='P6208':
                                    award['name']=qv[0]['datavalue']['value']['text']



                        if award:
#                            log.info('award: %s' % (award,))
                            if 'custom_fields' not in performer_update:
                                performer_update['custom_fields']={'full':performer['custom_fields'].copy()}

                            award_name=award['name']
                            award['award_value']=award['name']
                            if 'venue' in award and 'time' in award:
                                award['award_value']='%s - %s: %s' % (award['time'], award['venue'],award['name'],)
                            elif 'time' in award:
                                award['award_value']='%s:  %s' % (award['time'],award['name'],)
                            elif 'venue'  in award:
                                award['award_value']='%s: %s' % (award['venue'],award['name'],)


                            if award['type']=='award received':
                                won_award.append(award)
                            if award['type']=='nominated':
                                award['award_value']='%s - Nominated' % award['award_value']
                                nominated_award.append(award)
                            if award_name not in performer_update['custom_fields']['full']:

                                performer_update['custom_fields']['full'][award_name]= award['award_value']
                                performer_update['update'] = True
                            else:
                                if award['award_value'] not in  performer_update['custom_fields']['full'][award_name]:
                                    tmp=performer_update['custom_fields']['full'][award_name].split(', ')
                                    tmp.append(award['award_value'])
                                    performer_update['custom_fields']['full'][award_name]=', '.join(sorted(tmp,reverse=True))
                                    performer_update['update'] = True
                            #check what type of
                            log.debug(award['wd'])

            log.debug(performer)
            if award_totals:
                    performer_update['custom_fields']['full']['award totals'] =', '.join(
                        [  "%s: %s"% (k,v,) for k,v in award_totals.items()])
                    performer_update['update'] = True
            if nominated_totals:
                performer_update['custom_fields']['full']['nominated totals'] = ', '.join(
                    ["%s: %s" % (k, v,) for k, v in nominated_totals.items()])
                performer_update['update'] = True
            if won_award:
#                performer_update['custom_fields']['full']['json_awards'] = json.dumps([x[for x in won_award])
                performer_update['custom_fields']['full']['Awards Won'] = ', '.join(
                    [x['award_value'] for x in won_award])
                if settings['createTag']:
                    performer_update['tag_names'].append('[Award Winner]')
                performer_update['update'] = True
            if nominated_award:
#                performer_update['custom_fields']['full']['json_nominated'] = json.dumps(nominated_award)
                performer_update['custom_fields']['full']['Awards Nominated'] = ', '.join(
                    [x['award_value'] for x in nominated_award])
                if settings['createTag']:
                    performer_update['tag_names'].append('[Award Nominated]')
                performer_update['update'] = True
                #         if settings['createTag']:
                    #             if 'P31' in award['wd']['claims']:
                    #                 for c in award['wd']['claims']['P31']:
                    #                     log.debug('c  %s' % (c,))
                    #                     # avn Award Q824540
                    #                     if c['mainsnak']['datavalue']['value']['id']=='Q824540':
                    #                         log.debug('---------------')
                    #                         if prop=='P166':
                    #                             performer_update['tag_names'].append('[AVN Award Winner]')
                    #                             performer_update['update'] = True
                    #                         elif prop=='P1411':
                    #                             performer_update['tag_names'].append('[AVN Award Nominated]')
                    #                             performer_update['update'] = True
                    #
                # if settings['createTag']:
                #     if prop=='P166':
                #         performer_update['tag_names'].append('[Award Winner]')
                #         performer_update['update'] = True
                #     elif prop=='P1411':
                #         performer_update['tag_names'].append('[Award Nominated]')
                #         performer_update['update'] = True
        if settings['otherInfo']:
            for claim, label in wikidata_field_properties.items():
                if claim in data['claims']:
                    claim_values=[]
                    for c in data['claims'][claim]:
#                        log.debug(c)
                        # some bad data, used th have a property but no longer, maybe it got deleted and this is pointing to the delted item, 'unknown value'
                        if 'datavalue' in c['mainsnak']:
                            claim_values.append(getWDPPropertyLabel(c['mainsnak']['datavalue']['value']['id'])['label'])
                    if len(claim_values)> 0:
                        if 'custom_fields' not in performer_update:
                            performer_update['custom_fields'] = {'full': performer['custom_fields'].copy()}
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
        needs_update=False
        performer_update.pop('update')
        performer_update['tag_ids']=[x['id'] for x in performer['tags']]
        for t in performer_update['tag_names']:
            tt = stash.find_tag(t, create=True)
            if tt['id'] not in performer_update['tag_ids']:
                performer_update['tag_ids'].append(tt['id'])
                needs_update=True
        performer_update.pop('tag_names')

        if settings['schema'] <  71:
            log.info('your version of stash does not support custom fields, a new version of stash should be released soon')
            # other features will still work for other versions
            performer_update.pop('custom_fields')
        else:
            if not performer['custom_fields']==performer_update['custom_fields']['full']:
                needs_update=True
        if needs_update:
            log.info('updating performer: %s' %  (performer_update,))
            stash.update_performer(performer_update)
        else:
            log.debug('no performer update needed')

def processPerformers():
    query={}
    count = stash.find_performers(
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
#    log.debug(json_input)
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

