# StashPlexAgent.bundle
A very simplistic Plex agent to pull metadata from Stash.

Scenes are matched based on filename (without path or extension) against the Stash "Path", so files must be scanned into Stash with their current filename.

Preferences are set under the plugin, or in the library definition (if you set it as the primary agent for the library).  I'm using "Video Files Scanner" with it.

By default it will create Plex "Site: <STUDIO>" and "Studio: <STUDIO PARENT>" collection tags, but this can be disabled in preferences.  There are several collection tag options available, and each can be modified with what it prepends the Collection name with

Also Stash "Tags" are placed into Plex "Genres", as well as optionally pulling attached Performer tags into the Plex genre list

You can also set tag numbers to ignore on import, I've left mine in as an example.  You probably want to change these unless your "temporary" tags miraculously line up with mine. (Also initially you might need to try saving a couple of times.  Plex seems to not want to initally keep changes in this field for some reason)

And optionally you can pull in any images from galleries attached to Scenes as Plex artwork.  (There is an option to auto split gallery images into Poster/Background depending on basic orientation...  If it's taller than wide, it's a poster)

For installing just download the bundle and put it into your "\PlexMediaServer\Plex Media Server\Plug-ins" folder.  (The entire bundle as a directory...  "\StashPlexAgent.bundle")

I guarantee there will be problems.  When they pop up feel free to get with me (@Darklyter) on either the TPDB or Stash Discord channels.

Also this agent only handles scenes currently.  I haven't played with movies in Stash much yet, but can take a look if there is interest (though it will optionally create Collections based on defined movies).  Currently the Plex ADE agent handles that for me.

Also a bit of explanation for Sites vs Studios:

I help out with TPDB, so I'm very much in the Site -> Studio -> Network mentality.  In Stash it is simply "Studio".

For my thinking, a Stash studio that is directly connected to the scene is the "Site".  If that site has a parent studio, that is defined as "Studio".  If the scene studio has a grandparent, that would be "Network" (though I'm not doing anything with that yet.

For example, in my Stash I have:  Mind Geek as the Parent of Brazzers which is the Parent of Brazzers Live.  

Therefore a scene would have:  Site = "Brazzers Live", Studio = "Brazzers", Network = "Mind Geek"