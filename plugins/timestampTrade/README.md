# timestampTrade 
I've created the api https://timestamp.trade to sync markers between stash instances and xbvr.
This sits along side other metadata databases like stashdb while we wait for the feature to be added there.

The api does not currently require an api key but one may be required in the future.

Fetching scenes require a stashdb id on the scene.
Submitting markers does not require a stashid on the scene but it is recommended.

### Installation 
Move the `timestampTrade` directory into Stash's plugins directory, reload plugins.

### Tasks
* Submit - Submit markers for all scenes that have markers.
* Sync - Fetch markers for all scenes with a stash id.
* Post update hook - Fetch markers for that scene