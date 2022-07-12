
import os, sys, json
import logging as log

# local dependencies
from stash_interface import StashInterface
# external dependencies
from pyvis.network import Network


### USER CONFIG ###
STASH_SETTINGS = {
	"Scheme":"http",
	"Domain": "localhost",
	"Port": "9999",
	"Logger": log,
	# "ApiKey": "YOUR_API_KEY_HERE",
}
SHOW_OPTIONS = False


def main():
	global stash

	log.basicConfig(level=log.INFO, format='%(levelname)s: %(message)s')

	stash = StashInterface(STASH_SETTINGS)

	log.info("getting tags from stash...")
	tags = stash.get_tags_with_relations()
	
	log.info("generating graph...")
	

	if SHOW_OPTIONS:
		G = Network(directed=True, height="100%", width="66%", bgcolor="#202b33", font_color="white")
		G.show_buttons()
	else:
		G = Network(directed=True, height="100%", width="100%", bgcolor="#202b33", font_color="white")

	node_theme = {
		"border": "#adb5bd",
		"background":"#394b59",
		"highlight":{
			"border": "#137cbd",
			"background":"#FFFFFF"
		}
	}
	edge_theme = {
		"color": "#FFFFFF",
		"highlight":"#137cbd"
	}

	# create all nodes
	for tag in tags:
		G.add_node(tag["id"], label=tag["name"], color=node_theme )
	# create all edges
	for tag in tags:
		for child in tag["children"]:
			G.add_edge( tag["id"], child["id"], color=edge_theme )


	current_abs_path = os.path.dirname(os.path.abspath(__file__))
	save_path = os.path.join(current_abs_path, "tag_graph.html")

	G.save_graph(save_path)
	log.info(f'saved graph to "{save_path}"')

if __name__ == '__main__':
	main()