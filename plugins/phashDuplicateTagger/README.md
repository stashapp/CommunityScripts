*****  No longer the main repository for this.  stg-annon took the plugin and ran with it, you can find his fork at https://github.com/stg-annon/CommunityScripts/tree/suggested-changes/plugins/phashDuplicateTagger


----------------------------------------------
This plugin has four functions:

1) It will create two tags for review, [Dupe: Keep] and [Dupe: Remove]

2) It will auto assign those tags to scenes with EXACT PHashes based on (and in this order):
      a) Keep the larger resolution
      b) Keep the larger file size (if same resolution)
      c) Keep the older scene (if same file size.)
          (Older scene is kept since it's more likely to have been organized if they're the same file)
   With this order of precedence one scene is determined to be the "Keeper" and the rest are assigned for Removal
   When the scenes are tagged, the titles are also modified to add '[Dupe: {SceneID}K/R]'
   The SceneID put into the title is the one determined to be the "Keeper", and is put into all matching scenes
   This way you can sort by title after matching and verify the scenes are actually the same thing, and the Keeper
   will be the first scene in the set. (Since you'll have [Dupe: 72412K], [Dupe: 72412R], [Dupe: 72412R] as an example

   What I have personally done is essentially set a filter on the two Dupe tags, then sort by title.  Then I spot check the 
   'K' scenes versus the 'R' scenes.  If everything looks good then I just drop [Dupe: Keep] out of the filter (leaving only
   [Dupe: Remove], Select All and delete the files.

3) It will remove the [Dupe: Keep] and [Dupe: Remove] tags from Stash
4) It will remove the [Dupe: ######K/R] tags from the titles
  (These last two options are obviously for after you have removed the scenes you don't want any longer)

PS. This script is essentially a hack and slash job on scripts from Belley and WithoutPants, thanks guys!