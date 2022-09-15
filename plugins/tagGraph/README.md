
# Tag Graph Generator

## Requirements
 * python >= 3.7.X
 * `pip install -r requirements.txt`

---

## Usage

### Running as a plugin
move the `tagGraph` directory into Stash's plugins directory, reload plugins and you can run the **Generate Graph** task 

### Running as a script
> **⚠️ Note:** use this if you are connecting to a remote instance of stash

ensure `STASH_SETTINGS` is configured properly, you will likely need to change it

run `python .\tag_graph.py -script`

### View graph
a `tag_graph.html` file will be generated inside the tagGraph directory, open it with a browser to view/interact with the graph

---

## Customizing the graph
set `SHOW_OPTIONS` to `True` and you will get an interface to play around with that will affect what the graph looks like.

for more info see [pyvis docs](https://pyvis.readthedocs.io/en/latest/tutorial.html#using-the-configuration-ui-to-dynamically-tweak-network-settings)
