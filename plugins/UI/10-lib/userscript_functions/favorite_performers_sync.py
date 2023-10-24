import math
import sys

try:
    import stashapi.log as log
    log.LEVEL = log.StashLogLevel.INFO
    from stashapi.stashapp import StashInterface
    from stashapi.stashbox import StashBoxInterface
except ModuleNotFoundError:
    print("If you have pip (normally installed with python), run this command in a terminal (cmd): 'pip install stashapp-tools'", file=sys.stderr)
    sys.exit()

def get_stashbox_performer_favorite(sbox:StashBoxInterface, stash_id):
    query = """
query FullPerformer($id: ID!) {
  findPerformer(id: $id) {
    id
    is_favorite
  }
}
    """

    variables = {
        "id": stash_id
    }

    return sbox.call_gql(query, variables)

def update_stashbox_performer_favorite(sbox:StashBoxInterface, stash_id, favorite):
    query = """
mutation FavoritePerformer($id: ID!, $favorite: Boolean!) {
  favoritePerformer(id: $id, favorite: $favorite)
}
"""

    variables = {
        "id": stash_id,
        "favorite": favorite
    }

    return sbox.call_gql(query, variables)

def get_favorite_performers_from_stashbox(sbox:StashBoxInterface):
    query = """
query Performers($input: PerformerQueryInput!) {
  queryPerformers(input: $input) {
    count
    performers {
      id
      is_favorite
    }
  }
}
"""
    performer_input = {
        "names": "",
        "is_favorite": True,
        "page": 1,
        "per_page": 100,
        "sort": "NAME",
        "direction": "ASC"
    }
    performers = sbox._paginate_query(query, performer_input)


    return set([p["id"] for p in performers])

def get_stash_favorite_performers(stash: StashInterface, endpoint):
    local_performers = stash.find_performers({
        "stash_id_endpoint": {
            "endpoint": endpoint,
            "stash_id": "",
            "modifier": "NOT_NULL"
        }
    }, fragment="id name favorite stash_ids { stash_id endpoint }")

    stash_ids = []
    performer_count = {}
    for p in local_performers:
        for sid in p["stash_ids"]:
            if sid["endpoint"] != endpoint:
                continue
            if p["favorite"]:
                stash_ids.append(sid["stash_id"])
            if sid["stash_id"] in performer_count:
                log.warning(f'multiple performers with StashID {sid["stash_id"]} {p["name"]}')
                performer_count[sid["stash_id"]] += 1
            else:
                performer_count[sid["stash_id"]] = 1

    return set(stash_ids), performer_count

def set_stashbox_favorite_performers(stash: StashInterface, sbox:StashBoxInterface):
    
    stash_ids, local_count = get_stash_favorite_performers(stash, sbox.endpoint)

    log.info(f'{len(stash_ids)} favorite performers in Stash')
    log.info(f'Fetching Stashbox favorite performers...')
    stashbox_stash_ids = get_favorite_performers_from_stashbox(sbox)
    log.info(f'{len(stashbox_stash_ids)} favorite performers from {sbox.endpoint}')

    favorites_to_add = stash_ids - stashbox_stash_ids
    favorites_to_remove = stashbox_stash_ids - stash_ids
    log.info(f'{len(favorites_to_add)} favorites to add')
    log.info(f'{len(favorites_to_remove)} favorites to remove')

    for stash_id in favorites_to_add:
        update_stashbox_performer_favorite(sbox, stash_id, True)
    log.info('Add done.')

    for stash_id in favorites_to_remove:
        update_stashbox_performer_favorite(sbox, stash_id, False)
    log.info('Remove done.')

    # unsure if this id for issues with pagination?
    # for performer_id, count in performercounts.items():
    #     if count > 1:
    #         log.info(f'Fixing duplicate stashbox favorite {performer_id} count={count}')
    #         update_stashbox_performer_favorite(sbox, performer_id, False)
    #         update_stashbox_performer_favorite(sbox, performer_id, True)
    # log.info('Fixed duplicates.')

def set_stashbox_favorite_performer(sbox:StashBoxInterface, stash_id, favorite):
    result = get_stashbox_performer_favorite(sbox, stash_id)
    if not result:
        return
    if favorite != result["findPerformer"]["is_favorite"]:
        update_stashbox_performer_favorite(sbox, stash_id, favorite)
        log.info(f'Updated Stashbox performer {stash_id} favorite={favorite}')
    else:
        log.info(f'Stashbox performer {stash_id} already in sync favorite={favorite}')