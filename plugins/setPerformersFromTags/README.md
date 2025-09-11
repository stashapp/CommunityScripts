# **Set Performers From Tags**  

https://discourse.stashapp.cc/t/set-performers-from-tags/1390

This Stash plugin automatically assigns performers to scenes and images based on their tags. It matches performer names (including aliases) with scene/image tags, even if tags contain special characters like dashes, underscores, dots, or hashtags. The plugin can be run manually or triggered automatically when scenes or images are created or updated.  

## **Features**  
✅ **Auto-matching performers** – Identifies performers in scenes and images by comparing tags with performer names and aliases.  
✅ **Handles special characters** – Matches tags like `joe-mama`, `joe_mama`, `joe.mama`, `#Joe+mama` to the performer "Joe Mama".  
✅ **Runs manually or via hooks** – Can be executed on demand or triggered automatically when scenes or images are created or updated.  
✅ **Prevents unnecessary updates** – Only updates scenes/images when performers actually change.  
✅ **Logging support** – Outputs logs to help track plugin activity.  

## **Installation**  
Refer to Stash-Docs: https://docs.stashapp.cc/plugins/

## **Usage**  

### **Manual Execution**
1. Navigate to **Settings → Tasks → Plugin Tasks**
2. Run **Auto Set Performers From Tags** to process all scenes and images.  

### **Automatic Execution via Hooks**
The plugin automatically updates performers when:  
- A scene is **created or updated**  
- An image is **created or updated**  

Stash will trigger the plugin to update performer assignments based on the tags present.  

## **How It Works**  

1. **Fetch Performers**  
   - Retrieves all performers and their aliases.  

2. **Process Scenes & Images**  
   - Fetches all scenes and images.  
   - Matches performer names/aliases against scene/image tags.  
   - Updates scenes and images with matched performers if necessary.  

3. **Handle Hooks**  
   - If triggered by a hook, processes only the relevant scene or image.  

### **Example Matching**  

| Performer Name | Alias List | Matching Tags |
|--------------|-----------|--------------|
| `Joe Mama` | `["Big Mama", "Mother Joe"]` | `joe-mama`, `joe.mama`, `#Joe_Mama`, `big-mama` |
| `John Doe` | `["JD", "Johnny"]` | `john-doe`, `#JD`, `johnny` |
| `Jane Smith` | `["J. Smith", "J-S"]` | `jane-smith`, `j_smith`, `#J-S` |

### **Logging**  
The plugin uses `log.Info()`, `log.Debug()`, and `log.Error()` for debugging. Check logs in Stash for details.  
