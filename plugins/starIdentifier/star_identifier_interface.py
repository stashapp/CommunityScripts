# most of this copied from https://github.com/niemands/StashPlugins

import requests
import sys
import log

class IdentifierStashInterface:
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

	#
	#   Init
	#

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

	#
	#   Queries
	#

	# Performers

	def getPerformerImages(self, performer_filter=None):
		return self.__getPerformerImages(performer_filter)
		
	def __getPerformerImages(self, performer_filter=None, page=1):
		per_page = 1000
		query = """
			query($per_page: Int, $page: Int, $performer_filter: PerformerFilterType) {
				findPerformers(
					performer_filter: $performer_filter
					filter: { per_page: $per_page, page: $page }
				) {
					count
					performers {
						id
						name
						image_path
					}
				}
			}
		"""

		variables = {
			'per_page': per_page,
			'page': page
		}
		if performer_filter:
			variables['performer_filter'] = performer_filter

		result = self.__callGraphQL(query, variables)

		performers = result.get('findPerformers').get('performers')

		if len(performers) == per_page:
			next_page = self.__getPerformerImages(performer_filter, page + 1)
			for performer in next_page:
				performers.append(performer)

		return performers
	
	# Tags

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

	# Images

	def findImages(self, image_filter=None):
		return self.__findImages(image_filter)

	def __findImages(self, image_filter=None, page=1):
		per_page = 1000
		query = """
		query($per_page: Int, $page: Int, $image_filter: ImageFilterType) {
			findImages(
				image_filter: $image_filter,
				filter: { per_page: $per_page, page: $page }
			) {
				count
				images {
					id
					path
					performers {
						id
					}
				}
			}
		}
		"""

		variables = {
			'per_page': per_page,
			'page': page
		}
		if image_filter:
			variables['image_filter'] = image_filter

		result = self.__callGraphQL(query, variables)

		images = result.get('findImages').get('images')

		if len(images) == per_page:
			next_page = self.__findImages(image_filter, page + 1)
			for image in next_page:
				images.append(image)

		return images

	# Scenes

	def getScenePaths(self, scene_filter=None):
		return self.__getScenePaths(scene_filter)

	def __getScenePaths(self, scene_filter=None, page=1):
		per_page = 1000
		query = """
		query($per_page: Int, $page: Int, $scene_filter: SceneFilterType) {
			findScenes(
				scene_filter: $scene_filter,
				filter: { per_page: $per_page, page: $page }
			) {
				count
				scenes {
					id
					paths {
						screenshot
						stream
					}
				}
			}
		}
		"""

		variables = {
			'per_page': per_page,
			'page': page
		}
		if scene_filter:
			variables['scene_filter'] = scene_filter

		result = self.__callGraphQL(query, variables)
		scenes = result.get('findScenes').get('scenes')

		if len(scenes) == 1000:
			next_page = self.__getScenePaths(scene_filter, page + 1)
			for scene in next_page:
				scenes.append(scene)

		return scenes


	#
	#   Mutations
	#

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

	def addPerformersToImage(self, image_id, performer_ids):
		self.updateImage({
			'id': image_id,
			'performer_ids': performer_ids
		})

	def bulkPerformerAddTags(self, performer_ids, tag_ids):
		query = """
		mutation($ids: [ID!], $tag_ids: BulkUpdateIds) {
			bulkPerformerUpdate(input: { ids: $ids, tag_ids: $tag_ids }) {
				id
			}
		}
		"""

		variables = {
			"ids": performer_ids,
			"tag_ids": {
				"ids": tag_ids,
				"mode": 'ADD'
			}
		}

		self.__callGraphQL(query, variables)

	def addPerformersToScene(self, scene_id, performer_ids):
		query = """
		mutation BulkSceneUpdate($ids: [ID!], $performer_ids: BulkUpdateIds) {
			bulkSceneUpdate(input: { ids: $ids, performer_ids: $performer_ids}) {
				id
			}
		}
		"""

		variables = {
			"ids": [scene_id],
			"performer_ids": {
				"ids": performer_ids,
				"mode": "ADD"
			}
		}

		self.__callGraphQL(query, variables)