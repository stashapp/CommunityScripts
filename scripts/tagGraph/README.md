
# Tag Graph Generator

## Requirements
 * python >= 3.7.X
 * `pip install -r requirements.txt`

## Usage

ensure `STASH_SETTINGS` is configured properly
> **⚠️ Note:** if you are connecting to a remote/docker instance of stash you will need to change this

run `python .\tag_graph.py`

## Customizing the graph
set `SHOW_OPTIONS` to `True` and you will get an interface to play around with that will affect what the graph looks like.

for more info see [pyvis docs](https://pyvis.readthedocs.io/en/latest/tutorial.html#using-the-configuration-ui-to-dynamically-tweak-network-settings)
