# Image Matcher

A Stash UI plugin that finds images that look the same and lets you act on them:

- **Merge**: the look-alikes become one image in Stash. Every file stays where it is on disk, the better copy is the one shown, and the image appears in each folder's gallery.
- **Delete**: keep one copy, delete the others from disk. Their tags, ratings and details move to the kept copy first.
- **Folder sets**: when two folders share several look-alikes ("the same set in two places"), merge or dedupe the whole pair in one decision, and choose which folder wins.
  Each set card says how close its pairs are ("25 same hash · 9 within 2 bits") and *Show all* lists every pair with its distance, furthest first. The hash describes how a picture looks; files with the same hash can still differ in size or quality.
- **Leave out**: any pair on a set card, or any image in a group, can be left out of a merge or delete. A group with two pictures in each folder is shown as two pairs, never merged into one image.
- **One detail different**: the page compares the two thumbnails of every pair. A resized or recompressed copy differs a little everywhere; two drawings that differ in one detail differ a lot in one place. Those are marked "differs in one area" with a red box on the spot and are left out until you put them back. A very small or faint change can still pass.
- **Folders to ignore**: under Folder rules, one folder per line (end a line with `/*` to cover its subfolders). Images in those folders are left out of every match on both tabs, so nothing there can be merged or deleted.
- **All on this page**: under the list on the Images tab, one button merges (or deletes the other copies in) every group on the page, as the cards are set. The same bar has "Not a match, all N on this page", which hides every group listed there from now on.
- **Colour**: a black-and-white copy matches its colour original (the hash only sees brightness). The colour copy is the suggested keeper unless the black-and-white one has more than twice the pixels; folder rules still come first.
- **Zoom**: a slider in the toolbar enlarges every thumbnail up to 4×; the size is remembered in the browser.
- **Folders left out of sets**: list folders (one per line, under *Folder rules*) that should never be compared as a set, such as a year folder of loose images; or use *Leave this folder out of sets* on a card. Subfolders are still compared unless the line ends in `/*`.
- **Archives**: images inside a cbz or zip are left out and counted on the page. A file in an archive cannot be deleted or re-attached on its own, so neither merge nor delete can work on it.
- **Guide**: *How this works* on the page explains the tabs, the buttons, the labels and what is left out. It is open on a first visit. A set card whose folders mostly do not match carries a caution.
- **Folder rules**: an ordered list of folders that always win. Stored in Stash's plugin settings.

It opens from the stacked-squares button in the top bar, or at `/image-matcher`.

## Requirements

- Stash 0.31 or later (image perceptual hashes arrived in 0.31.0).
- Image phashes generated: Settings → Tasks → Generate → *Image perceptual hashes*. Images without one are skipped and counted on the page.

## Install

Install from the CommunityScripts source in Settings → Plugins → Available Plugins, or copy this folder into Stash's `plugins/` directory and press *Reload plugins*.

## How merge works

Stash has no "merge images" call, and this plugin does not write to the database or assume anything about the filesystem. It uses Stash's own scanner:

1. Both files get the same custom fingerprint (type `imagematch`) through `fileSetFingerprints`.
2. The lesser image's tags, performers, rating, details, URLs and hand-made gallery memberships are copied to the kept image.
3. The lesser image record is removed with its file kept (`imagesDestroy`, `delete_file: false`).
4. That file is rescanned. Stash's scanner attaches a file with no image to any image sharing a fingerprint, so it joins the kept image.
5. The plugin checks that the file landed on exactly the kept image.

The scanner matches on *any* shared fingerprint, including phash, so a detached file would also attach to every other look-alike with an equal phash. The plugin therefore hides the file's phash during the rescan and restores it afterwards.

Real content hashes (md5, oshash) are never touched. The `imagematch` stamp stays as the record that a person declared the files the same.

## Limits

- One merge or delete runs at a time; the other cards are locked until it finishes.
- Deleting an image deletes every file it holds. A copy that holds several files (one that was merged) lists every folder they are in, and the delete warning names those folders and gives the true file count.
- Stash deletes a file by first renaming it to `<name>.delete` ([stashapp/stash#3664](https://github.com/stashapp/stash/issues/3664)), so a file whose name is over 248 bytes cannot be deleted. Delete leaves those copies alone and labels them; merge them instead.
- **No undo.** Stash has no "split image" call. A merge can only be reversed by hand; a delete cannot be reversed at all.
- Matching uses the phash Stash already stores. It finds resized and recompressed copies well; crops, rotations and mirrors mostly not.
- Groups are chains: if A looks like B and B looks like C, all three are shown together even when A and C are further apart.
- Folder and zip galleries cannot be edited in Stash, so "merging galleries" means their details (tags, performers, rating, and so on) are synced; their contents converge because the merged images belong to both folders.
- Very loose accuracy on very large libraries is slow. At *High* a 200,000-image library compares in well under a second; at *Low* a 34,000-image library takes about a third of a second on a desktop.
- `custom_fields` are not merged.

## How it was tested

- Unit tests of the matching and decision logic (18), end-to-end tests of merge, delete and folder sets against a throwaway Stash in Docker (13), and a scripted browser pass. All three pass on Stash v0.31.1 (release) and v0.32.0-12 (development image).
- Used by its author on a real library.
- The test files are kept with the development copy, not shipped here, so they are not installed with the plugin. They can be added to this folder if that is preferred.

## Prior art and credit

- The interface follows the closed Stash PR #6675 (image duplicate checker) and the scene duplicate checker in spirit; no code was copied.
- The merge-on-resolve rules (highest rating, union of tags, combined details, merge only when exactly one copy is kept) follow Immich's duplicates utility.
- "Folders that win" is the reference-folder idea from dupeGuru.
- The task-computes / page-displays split in RyanAtNight's DuplicateScorer informed the layout, though here everything runs in the page.

## License

AGPL-3.0-or-later, compatible with this repository's AGPL-3.0 licence.
