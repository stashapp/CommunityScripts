# StashPlexAgent.bundle
A very simplistic Plex agent to pull metadata from Stash.

Scenes are matched based on filename (without path or extension) against the Stash "Path", so files must be scanned into Stash with their current filename.

Preferences are set under the plugin, or in the library definition (if you set it as the primary agent for the library).  I'm using "Video Files Scanner" with it.

By default it will create Plex "Site: <STUDIO>" and "Studio: <STUDIO PARENT>" collection tags, but this can be disabled in preferences.  (If the studio doesn't have a parent then the primary studio will be used instead and be in both tags) 

Also Stash "Tags" are placed into Plex "Genres"

You can also set tag numbers to ignore on import, I've left mine in as an example.  You probably want to change these unless your "temporary" tags miraculously line up with mine. (Also initially you might need to try saving a couple of times.  Plex seems to not want to initally keep changes in this field for some reason)

For installing just download the bundle and put it into your "\PlexMediaServer\Plex Media Server\Plug-ins" folder.  (The entire bundle as a directory...  "\StashPlexAgent.bundle")

I guarantee there will be problems.  When they pop up feel free to get with me (@Darklyter) on either the TPDB or Stash Discord channels.

Also this agent only handles scenes currently.  I haven't played with movies in Stash yet, but can take a look if there is interest.  Currently the Plex ADE agent handles that for me.