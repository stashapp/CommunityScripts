# Clean Scene Details for StashApp

https://discourse.stashapp.cc/t/clean-scene-details-remove-text-strings-from-descriptions/19670

A lightweight, cross-platform utility plugin for **StashApp** that surgically strips out specific case-insensitive text phrases, website watermarks, tracker tags, or promotional links from your scene description fields.

It can be run manually as a bulk database-wide maintenance task, applied to a targeted selection of scenes right from the grid view, or left to run automatically in the background as a live hook whenever new scenes are added or scraped.

## ✨ Features

- 🌐 **Cross-Platform Support:** Built natively using the Stash `{python}` macro token. Runs flawlessly across standard Windows layouts, macOS, Linux distributions, and native Docker container environments out of the box.
- 🔍 **Case-Insensitive Sweeping:** Uses advanced regular expressions to match and wipe strings regardless of case variations (e.g., will catch `fansdb.cc`, `FansDB.cc`, and `FANSDB.CC` seamlessly).
- 🛡️ **Built-in Dry Run Mode:** Includes a non-destructive verification toggle. Test your search targets safely to see how many scenes match in your terminal logs before altering a single database entry.
- ⚡ **Database Memory Pagination:** Safely streams database chunks in pages of 500 records at a time, preventing memory overloads and background crashes on massive collections (tested on 100,000+ scene libraries).
- 📉 **Optimized Disk Operations:** Condenses multi-match strings in memory first, executing exactly one clean database update per scene to protect your drive read/write lifespans.

## 📦 Installation

1. Download or clone this repository folder.
2. Place the `clean_details` folder inside your Stash plugins path directory (commonly located at `~/.stash/plugins/` or your custom configured volume path).
   ```text
   plugins/
   └── clean_details/
       ├── clean_details.yml
       ├── clean_details.py
       └── README.md
   ```
3. Open your StashApp interface in your web browser.
4. Navigate to **Settings > Plugins** and click **Reload Plugins**.

## 🚀 How to Use

### 1. Configure the Target String
1. Go to **Settings > Plugins** and locate the **Clean Scene Details** card.
2. Input the exact text phrase or watermark string you wish to remove into the **Target String to Remove** field.
3. If you want to check your matching count safely first, toggle **Enable Dry Run Mode** to **ON**.
4. Click **Save** at the bottom of the configuration card.

### 2. Execution Options

#### Option A: Bulk Clean the Entire Library (Manual Task)
1. Navigate to **Settings > Tasks**.
2. Scroll to the bottom to the **Plugin Tasks** block.
3. Locate **Clean All Scene Details** and click the task button.
4. Click the **Log Window icon** in the upper-right corner of your browser screen to watch the completion metrics stream live.

#### Option B: Clean Selected Scenes Only (Manual Hook)
1. Head to your main **Scenes Dashboard Grid View**.
2. Click the individual checkboxes on the scene cards you want to alter.
3. Open the selection action menu panel bar (`...` icon or selection tools dropdown) and select **Clean Selected Scene Details**.

#### Option C: Live Background Scrubbing (Automated Hook)
You don't need to do anything! The plugin automatically binds itself to Stash's native `scene.update.post` engine. Whenever a new scene is pulled by your community metadata scrapers, the script intercepts it instantly and scrubs out your saved target phrase before you even load the description page.

## ⚠️ Notes

- **Empty Field Protection:** Leaving the configuration field completely blank triggers an immediate structural kill-switch. The script will safely abort execution with zero structural changes made to your data profile.
- **Database Index Synchronization:** If you notice strings are successfully removed when looking at a scene view but still visually persist inside the Scenes Grid cards, run **Settings > Tasks > Optimize Database** once to completely clear your browser's local cache pointers.
- **Always Backup:** Because the script edits metadata lines directly via your live database endpoint, it is highly recommended to create a standard backup of your `stash-go.db` data file before running your first large database-wide cleanup sweep.
