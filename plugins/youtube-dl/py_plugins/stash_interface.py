import requests
import sys
import log
from urllib.parse import urlparse


class StashInterface:
    port = ""
    url = ""
    headers = {
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1"
    }
    cookies = {}

    def __init__(self, conn):
        self.port = conn['Port']
        scheme = conn['Scheme']

        # Session cookie for authentication
        self.cookies = {
            'session': conn.get('SessionCookie').get('Value')
        }

        try:
            # If stash does not accept connections from all interfaces use the host specified in the config
            host = conn.get('Host') if '0.0.0.0' not in conn.get('Host') or '' else 'localhost'
        except TypeError:
            # Pre stable 0.8
            host = 'localhost'

        # Stash GraphQL endpoint
        self.url = scheme + "://" + host + ":" + str(self.port) + "/graphql"
        log.LogDebug(f"Using stash GraphQl endpoint at {self.url}")

    def __callGraphQL(self, query, variables=None):
        json = {'query': query}
        if variables is not None:
            json['variables'] = variables

        response = requests.post(self.url, json=json, headers=self.headers, cookies=self.cookies)

        if response.status_code == 200:
            result = response.json()
            if result.get("error", None):
                for error in result["error"]["errors"]:
                    raise Exception("GraphQL error: {}".format(error))
            if result.get("data", None):
                return result.get("data")
        elif response.status_code == 401:
            sys.exit("HTTP Error 401, Unauthorised. Cookie authentication most likely failed")
        else:
            raise ConnectionError(
                "GraphQL query failed:{} - {}. Query: {}. Variables: {}".format(
                    response.status_code, response.content, query, variables)
            )

    def callGraphQL(self, query, variables=None):
        return self.__callGraphQL(query, variables)

    def scan_for_new_files(self):
        try:
            query = """
                    mutation {
                        metadataScan (
                            input: {
                                useFileMetadata: true 
                                scanGenerateSprites: false
                                scanGeneratePreviews: false
                                scanGenerateImagePreviews: false
                                stripFileExtension: false
                            }
                        ) 
                    }
            """
            result = self.__callGraphQL(query)
        except ConnectionError:
            query = """
                    mutation {
                        metadataScan (
                            input: {
                                useFileMetadata: true
                            }
                        ) 
                    }
            """
            result = self.__callGraphQL(query)
        log.LogDebug("ScanResult" + str(result))

    def findTagIdWithName(self, name):
        query = """
            query($name: String!) {
                findTags(
                    tag_filter: {
                        name: {value: $name, modifier: EQUALS}
                    }
                ){
                    tags{
                        id
                        name
                    }
                }
            }
        """

        variables = {
            'name': name,
        }

        result = self.__callGraphQL(query, variables)
        if result.get('findTags') is not None and result.get('findTags').get('tags') != []:
            return result.get('findTags').get('tags')[0].get('id')
        return None

    def createTagWithName(self, name):
        query = """
            mutation tagCreate($input:TagCreateInput!) {
                tagCreate(input: $input){
                    id
                }
            }
        """
        variables = {'input': {
            'name': name
        }}

        result = self.__callGraphQL(query, variables)
        if result.get('tagCreate'):
            log.LogDebug(f"Created tag: {name}")
            return result.get('tagCreate').get("id")
        else:
            log.LogError(f"Could not create tag: {name}")
            return None

    def destroyTag(self, tag_id):
        query = """
            mutation tagDestroy($input: TagDestroyInput!) {
                tagDestroy(input: $input)
            }
        """
        variables = {'input': {
            'id': tag_id
        }}

        self.__callGraphQL(query, variables)

    def getSceneById(self, scene_id):
        query = """
            query findScene($id: ID!) {
                findScene(id: $id) {
                    id
                    title
                    details
                    url
                    date
                    rating
                    galleries {
                        id
                    }
                    studio {
                        id
                    }
                    tags {
                        id
                    }
                    performers {
                        id
                    }
                    movies {
                        movie {
                            id
                        }
                    }
                }
            }
        """

        variables = {
            "id": scene_id
        }

        result = self.__callGraphQL(query, variables)

        return result.get('findScene')

    def findRandomSceneId(self):
        query = """
            query findScenes($filter: FindFilterType!) {
                findScenes(filter: $filter) {
                    count
                    scenes {
                        id
                        tags {
                            id
                        }
                    }
                }
            }
        """

        variables = {'filter': {
            'per_page': 1,
            'sort': 'random'
        }}

        result = self.__callGraphQL(query, variables)

        if result["findScenes"]["count"] == 0:
            return None

        return result["findScenes"]["scenes"][0]

    # This method wipes rating, tags, performers, gallery and movie if omitted
    def updateScene(self, scene_data):
        query = """
            mutation sceneUpdate($input:SceneUpdateInput!) {
                sceneUpdate(input: $input) {
                    id
                }
            }
        """
        variables = {'input': scene_data}

        self.__callGraphQL(query, variables)

    def updateGallery(self, gallery_data):
        query = """
            mutation galleryUpdate($input: GalleryUpdateInput!) {
                galleryUpdate(input: $input) {
                    id
                }
            }
        """

        variables = {'input': gallery_data}

        self.__callGraphQL(query, variables)

    def updateImage(self, image_data):
        query = """
            mutation($input: ImageUpdateInput!) {
                imageUpdate(input: $input) {
                    id
                }
            }
        """

        variables = {'input': image_data}

        self.__callGraphQL(query, variables)

    # Returns all scenes for the given regex
    def findScenesByPathRegex(self, regex):
        return self.__findScenesByPathRegex(regex)

    # Returns all scenes for the given regex
    # Searches all pages from given page on (default: 1)
    def __findScenesByPathRegex(self, regex, page=1):
        query = """
            query findScenesByPathRegex($filter: FindFilterType!) {
                findScenesByPathRegex(filter:$filter)  {
                    count
                    scenes {
                        title
                        id
                        url
                        rating
                        galleries {id}
                        studio {id}
                        tags {id}
                        performers {id}
                        path
                    }
                }
            }
        """

        variables = {
            "filter": {
                "q": regex,
                "per_page": 100,
                "page": page
            }
        }

        result = self.__callGraphQL(query, variables)
        log.LogDebug(f"Regex found {result.get('findScenesByPathRegex').get('count')} scene(s) on page {page}")

        scenes = result.get('findScenesByPathRegex').get('scenes')

        # If page is full, also scan next page:
        if len(scenes) == 100:
            next_page = self.__findScenesByPathRegex(regex, page + 1)
            for scene in next_page:
                scenes.append(scene)

        if page == 1:
            log.LogDebug(f"Regex found a total of {len(scenes)} scene(s)")
        return scenes

    # Searches for galleries with given tags
    # Requires a list of tagIds
    def findGalleriesByTags(self, tag_ids):
        query = """
        query($tags: [ID!]) {
            findGalleries(
            gallery_filter: { tags: { modifier: INCLUDES_ALL, value: $tags } }
            filter: { per_page: -1 }
            ) {
            count
            galleries {
              id
              scenes {
                        id
                    }
              url
              tags { id }
            }
          }
        }
        """

        variables = {
            "tags": tag_ids
        }

        result = self.__callGraphQL(query, variables)
        galleries = result.get('findGalleries').get('galleries')
        return galleries

    def findGalleries(self, gallery_filter=None):
        return self.__findGalleries(gallery_filter)

    def __findGalleries(self, gallery_filter=None, page=1):
        per_page = 100
        query = """
            query($studio_ids: [ID!], $page: Int, $per_page: Int) {
                findGalleries(
                    gallery_filter: { studios: { modifier: INCLUDES, value: $studio_ids } }
                    filter: { per_page: $per_page, page: $page }
                ) {
                    count
                    galleries {
                        id
                        studio {id}
                    }
                }
            }
        """

        variables = {
            "page": page,
            "per_page": per_page
        }
        if gallery_filter:
            variables['gallery_filter'] = gallery_filter

        result = self.__callGraphQL(query, variables)

        galleries = result.get('findGalleries').get('galleries')

        # If page is full, also scan next page(s) recursively:
        if len(galleries) == per_page:
            next_page = self.__findGalleries(gallery_filter, page + 1)
            for gallery in next_page:
                galleries.append(gallery)

        return galleries

    def findImages(self, image_filter=None):
        query = """
        query($image_filter: ImageFilterType) {
            findImages(image_filter: $image_filter ,filter: { per_page: -1 }) {
                count
                images {
                    id
                    title
                    studio {
                        id
                    }
                    performers {
                        id
                    }
                    tags {
                        id
                    }
                    rating
                    galleries {
                        id
                        date
                    }
                }
            }
        }
        """

        variables = {}
        if image_filter:
            variables['image_filter'] = image_filter

        result = self.__callGraphQL(query, variables)
        return result.get('findImages').get('images')

    def updateImageStudio(self, image_ids, studio_id):
        query = """
        mutation($ids: [ID!], $studio_id: ID) {
            bulkImageUpdate(input: { ids: $ids, studio_id: $studio_id }) {
                id
            }
        }
        """

        variables = {
            "ids": image_ids,
            "studio_id": studio_id
        }

        self.__callGraphQL(query, variables)

    def updateImageDate(self, image_ids, date):
        query = """
        mutation ($ids: [ID!], $date: String) {
            bulkImageUpdate(input: {ids: $ids, date: $date}) {
                id
            }
        }
        """

        variables = {
            "ids": image_ids,
            "date": date
        }

        self.__callGraphQL(query, variables)

    def findScenesByTags(self, tag_ids):
        query = """
                query($tags: [ID!], $page: Int) {
                    findScenes(
                        scene_filter: { tags: { modifier: INCLUDES_ALL, value: $tags } }
                        filter: { per_page: 1000, page: $page }
                    ) {
                        count
                        scenes {
                            id
                            url
                            tags { id }
                        }
                    }
                }
                """
        variables = {
            "tags": tag_ids
        }
        result = self.__callGraphQL(query, variables)
        return result.get('findScenes').get('scenes')

    # Scrape scene information from url
    def scrapeSceneURL(self, url):
        query = """
        query($url: String!) {
            scrapeSceneURL(url: $url) {
                title
                details
                date
                url
                tags {
                    name
                    stored_id
                }
                studio {
                    name
                    stored_id
                }
                performers {
                    name
                    stored_id
                }
                movies {
                    name
                    stored_id
                    url
                }
                image
            }
            }
        """

        variables = {
            'url': url
        }

        result = self.__callGraphQL(query, variables)
        return result.get('scrapeSceneURL')

    def scrapeGalleryURL(self, url):
        query = """
        query($url: String!) {
            scrapeGalleryURL(url: $url) {
                title
                details
                date
                url
                tags {
                    name
                    stored_id
                }
                studio {
                    name
                    stored_id
                }
                performers {
                    name
                    stored_id
                }
            }
        }
        """

        variables = {
            'url': url
        }

        result = self.__callGraphQL(query, variables)
        return result.get('scrapeGalleryURL')

    def findStudioIdWithUrl(self, url):
        query = """
        query($url: String!) {
            findStudios(
                studio_filter: {
                    url: {value: $url, modifier: EQUALS}
                }
            ){
                studios{
                    id
                    name
                }
            }
        }
        """

        variables = {
            'url': url
        }

        result = self.__callGraphQL(query, variables)
        if result.get('findStudios').get('studios') != []:
            return result.get('findStudios').get('studios')[0].get('id')
        return None

    def findStudiosWithName(self, name):
        query = """
        query($name: String!) {
            findStudios(
                studio_filter: {
                    name: {value: $name, modifier: EQUALS}
                }
            ){
                studios{
                    id
                    name
                }
            }
        }
        """

        variables = {
            'url': name
        }

        result = self.__callGraphQL(query, variables)
        if result.get('findStudios').get('studios') != []:
            return result.get('findStudios').get('studios')[0].get('id')
        return None

    def createStudio(self, name, url=None):
        query = """
            mutation($name: String!, $url: String) {
                studioCreate(input: { name: $name, url: $url }) {
                    id
                }
            }
        """
        variables = {
            'name': name,
            'url': url
        }

        result = self.__callGraphQL(query, variables)
        if result.get("studioCreate"):
            log.LogDebug(f"Created studio: {name}")
            return result.get("studioCreate").get("id")
        else:
            log.LogError(f"Could not create studio: {name}")
            return None

    def findPerformerIdWithName(self, name):
        query = """
            query($name: String!) {
                findPerformers(
                    performer_filter: {
                    name: { value: $name, modifier: EQUALS }
                    }
                    filter: { sort: "id", direction: ASC }
                ) {
                    performers {
                    id
                    name
                    }
                }
            }
        """

        variables = {
            'name': name,
        }

        result = self.__callGraphQL(query, variables)
        if result.get('findPerformers').get('performers') != []:
            return result.get('findPerformers').get('performers')[0].get('id')
        return None

    def createPerformerByName(self, name):
        query = """
            mutation($name: String!) {
                performerCreate(input: { name: $name }) {
                    id
                }
            }
        """

        variables = {
            'name': name
        }

        result = self.__callGraphQL(query, variables)
        if result.get('performerCreate'):
            log.LogDebug(f"Created performer: {name}")
            return result.get('performerCreate').get('id')
        else:
            log.LogError(f"Could not create performer: {name}")
            return None

    def findMovieByName(self, name):
        query = "query {allMovies {id name aliases date rating studio {id name} director synopsis}}"

        response = self.__callGraphQL(query)

        for movie in response.get('allMovies'):
            if movie.get('name') == name:
                return movie
        return None

    def createMovie(self, name, url=None):
        query = """
        mutation($name: String!, $url: String) {
            movieCreate(input: { name: $name, url: $url }) {
                id
            }
        }
        """
        variables = {
            'name': name,
            'url': url
        }

        result = self.__callGraphQL(query, variables)
        if result.get("movieCreate"):
            log.LogDebug(f"Created movie: {name}")
            return result.get("movieCreate").get("id")
        else:
            log.LogError(f"Could not create movie: {name}")
            return None

    def sceneScraperURLs(self):
        query = "query {listSceneScrapers {name scene {urls supported_scrapes}}}"

        response = self.__callGraphQL(query)
        url_lists = [x.get('scene').get('urls') for x in response.get('listSceneScrapers')
                     if 'URL' in x.get('scene').get('supported_scrapes')]
        return [urlparse('https://' + url).netloc for sublist in url_lists for url in sublist]

    def galleryScraperURLs(self):
        query = "query {listGalleryScrapers {name gallery {urls supported_scrapes}}}"
        response = self.__callGraphQL(query)
        url_lists = [x.get('gallery').get('urls') for x in response.get('listGalleryScrapers')
                     if 'URL' in x.get('gallery').get('supported_scrapes')]
        return [urlparse('https://' + url).netloc for sublist in url_lists for url in sublist]
