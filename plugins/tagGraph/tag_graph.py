
import os, sys, json, sqlite3

# local deps
import log
from stash_interface import StashInterface

# external deps
from pyvis.network import Network

class ro_stash_db:
	def __init__(self, db_path):
		self.conn = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True)

	def get_tag_relations(self):
		cur = self.conn.cursor()
		cur.execute("SELECT parent_id, child_id FROM tags_relations")
		return cur.fetchall()

	def get_tag(self, tag_id):
		cur = self.conn.cursor()
		cur.execute(f"SELECT id, name FROM tags WHERE id={tag_id}")
		return cur.fetchone()



def main():
	global stash, stash_db

	json_input = json.loads(sys.stdin.read())

	stash = StashInterface(json_input["server_connection"])
	stash_db = ro_stash_db(stash.get_db_path())

	create_graph()

	print(json.dumps({"output":"ok"}))



def create_graph():
	G = Network(height="1080px",width="1080px")

	for relation in stash_db.get_tag_relations():
		parent, child = relation

		parent_id, parent_name = stash_db.get_tag(parent)
		child_id, child_name = stash_db.get_tag(child)

		G.add_node(parent_id, label=parent_name)
		G.add_node(child_id, label=child_name)

		G.add_edge(parent_id, child_id)

	curr_path = os.path.dirname(os.path.abspath(__file__))
	save_path = os.path.join(curr_path, "tag_graph.html")

	G.save_graph(save_path)
	log.info(f"saved graph to {save_path}")

	
if __name__ == '__main__':
	main()