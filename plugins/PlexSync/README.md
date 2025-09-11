# Stash Plugin updating your Plex metadata automatically

https://discourse.stashapp.cc/t/plex-sync/1926

This plugin solves the problem of "I have many files in my Plex, but they don't get any of the changes I do in Stash, and doing a `refresh all metadata` takes too much time".

With this, Stash behaves as the main source for all your Stash scenes in Plex, and it keeps Plex in sync with changes done via Stash.



# Install

Install the plugin in Stash first, and then install the updated [Stash-Plex-Agent](https://github.com/Darklyter/StashPlexAgent.bundle) on your Plex server.

## Stash side

1. Install plugin via the CommunityScripts repository.

2. Go to the install directory and install requirements: `python3 -m pip install -r requirements.txt -t .` -- or, install the required packages globally `python3 -m pip install stashapi unidecode requests`

3. Configure the plugin in Stash UI.

## Plex side

Do this *after* making sure the Stash side is complete.

1. After installing the newest version of this agent, make sure that `AddPlexURL` is enabled ("Adds the Plex media ID to the scene in Stash; allows Stash to update Plex metadata.")

2. Refresh all metadata in Plex for the libraries using this agent.

Now, you should see scenes being updated in Stash, adding this URL to the scenes: `plex/library/metadata/12345` (12345 being the metadata ID of the scene in Plex)

# Usage

Update your scenes in Stash like normal, and these scenes will be automatically refreshed in Plex. 🎉

# Warnings
- If you have the "clean titles" option enabled in plugin, all titles are processed with `unidecode`.  Basically, all non-ASCII characters in your titles will be converted; Cyrillic script for example will be taken away.

- This plugin connects to your Plex via TLS, but it ignores cert errors.  But this is not really a problem, as your Stash is most likely on the same host as your Plex...
