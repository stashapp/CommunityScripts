# GroupAutoScraper

https://discourse.stashapp.cc/t/groupautoscraper/6196

Automatically re-scrape groups that have a supported URL and merge the scraped data back into the group.

## What it does

- **Trigger**
  - Listens to the **`Group.Create.Post`** hook only.
- **URL filter**
  - If the group has no URLs, the plugin exits quietly (no changes).
  - If the first URL does **not** contain `adultdvdempire.com/`, the plugin logs:
    - `AutoGroup only uses AdultDVDEmpire URLS. Exiting.`
    and exits without making any changes.
- **Scrape + merge**
  - When the first URL *does* contain `adultdvdempire.com/`:
    - Calls `scrapeGroupURL(url)` for that URL.
    - Merges scraped data into the group and performs a `GroupUpdate`:
      - Uses scraped values when present, otherwise keeps existing values.
      - Uses `scraped.studio.stored_id` as `studio_id` only when it is not `null`.
      - Builds `tag_ids` from:
        - existing group tag IDs, plus
        - scraped tag entries where `stored_id` is not `null`,
        - then de-duplicates.
      - Only sends `front_image` / `back_image` when present in the scrape result so existing images are not overwritten with `null`.
- **Summary logging**
  - On a successful update, the plugin logs a concise summary, e.g.:
    - `Group 9681 'Women Seeking Women Vol. 101' updated. Added 4 tag(s), set studio.`
  - If a studio name is scraped but cannot be resolved (no `stored_id`), the message instead reads:
    - `Group 9681 'Some Title' updated. Added 3 tag(s), could not set studio 'Some Studio', not found in studios.`

Groups without any URL, or with non-AdultDVD Empire URLs, are ignored without error.

## Installation

1. Copy this folder to your Stash plugins directory, typically:

   - `plugins/CommunityScripts/plugins/GroupAutoScraper/`

2. Install Python dependencies. From this plugin's directory run:

   ```bash
   pip install -r requirements.txt
   ```

   This installs:

   - `requests`
   - `stashapp-tools` (which provides the `stashapi` package used by the plugin)

3. Ensure the following files exist in this directory:

   - `manifest`
   - `GroupAutoScraper.yml`
   - `autoScraper.py`
   - `README.md`
   - `requirements.txt`

4. In Stash, open **Settings → Plugins** and reload or restart Stash so the plugin is detected.

You should then see **GroupAutoScraper** listed with a hook that triggers on `Group.Create.Post`.

## Configuration

This plugin intentionally uses the **server connection information provided by Stash**:

- GraphQL URL, scheme, host and port come from the plugin input.
- Authentication uses the Stash session cookie provided in `server_connection`.

As a result:

- **No API keys or URLs need to be hard-coded or edited in the script.**
- The plugin should work across environments as long as it is installed in the correct plugins directory and the Python dependencies are installed.

