# Path Default Tags
Define default tags/performers/studio for Scenes, Images, and Galleries by file path.
Big thanks to @WithoutPants - I based this entire script off of yours (markerTagToScene) and learned about Stash plugins during the process :)

## Requirements
- Stash

## Installation

- Download the whole folder 'defaultDataForPath' (defaultDataForPath.js, defaultDataForPath.yml)
- Place it in your **plugins** folder
- Reload plugins (Settings > Plugins)
- Default Data For Path (1.0) should appear. 

## Usage

- This plugin will execute on Tasks->Scan. Any new file added to Stash will be created with the specified data if configured.

## Configuration

- Edit **_jsonData_** array. Refer to Examples.

## Notes
- Remember to escape file paths!
- Note this script only works on NEWLY created Scenes/Images/Galleries. To run on existing content, the content will need to be removed from Stash and then rescanned.
- There is NO validation of tags/performers/studios being performed. They must exist in Stash and be spelled exactly the same to work.  These values are not updated when they are updated in Stash. They will have to manually be configured. If there is a mismatch, an error will be logged and the affected file will not have any default data added. The Scan task will continue to execute however.
- If you misconfigure the script, the Task->Scan will complete and files will be created, but you can remove those files from Stash, fix the script, and try again.
- I recommend using VS Code but any text editor should do. I especially recommend an editor with collapse functionality as your config JSON grows.
- This requires a decent bit of manual effort and verbosity to configure, but only needs to be maintained after that. 
- This may slow down your Task->Scan. This script is probably sloppily written, I was not sober when I wrote it, and haven't looked much at it since it works ¯\\\_(ツ)_/¯ 

## Examples

> Here is a simple config Object. It defines data for any Scene/Image/Gallery found within the paths listed (it includes all subfolders). Matching files will be assigned Studio **'Brazzers'** and Tag **'Default_Data_For_Path_Tagged'** assuming that Studio and Tag exist in Stash and are spelled this way.
<br>**_'name'_** is optional and not used by the script. Feel free to include it for the purposes of organization.
<br>**_'paths'_** is optional and defines what file paths the current Object config should apply to. If it is not included, then no files will be matched to this config, unless **_'children'_** is used, in which case, those files in **_'children'_** will be matched to this config. See next example.
<br>**_'studio'_** is optional and defines a Studio to apply to file matches. The Studio must exist in Stash and be spelled the same.
<br>**_'tags'_** is optional and defines Tags to apply to file matches. The Tags must exist in Stash and be spelled the same.
```
var jsonData = [
    {
        "name": "OPTIONAL NAME - NOT USED IN SCRIPT",
        "paths": [
            "C:\\Users\\UserName\\Desktop\\NOTPORN\\Brazzers",
            "D:\\SecretStorage\\Porn\\Brazzers"
        ],
        "studio": "Brazzers",
        "tags": [
            "Default_Data_For_Path_Tagged"
        ]
    }
];
```

> This config introduces a new concept. Note the _'Instagram Root'_ config object has no paths. It defines a studio and then children. This means all child config object of this will recieve the Studio _'Instagram'_ (it will overwrite any child config object studio definitions if different). You may also specify Performers and Tags in this way, those will be appended to child config objects definitions. See the _'Celebrities_' config object is used in a similar way to add the tag _'PERFORMER - Celebrity_' to its underlying children (which also recieve the _Instagram_ studio as it is their ancestor). It saves you from having to add the tag to each config object seperately and allows for more logical config groupings to be created. 

> If you also add a **_'paths'_** value to _'Instagram Root'_, then the data specified on _'Instagram Root'_ config object will be applied to files in that path as well. Data from children will not be carried over. For example, _'PornHub Root'_ applies studio PornHub to all files in **_"C:\\Users\\UserName\\Desktop\\Pornhub"_**, and has children objects with more specific config. Instagram Root does not have such a paths specification. So a file in path **_"C:\\Users\\UserName\\Desktop\\Pornhub\\SweetBunny"_** will have Studio PornHub added while a file in **_"C:\\Users\\UserName\\Desktop\\Instagram\\Kylie Jenner"_** will not have Studio Instagram added.

> So say a file is scanned that has file path **_"C:\\Users\\UserName\\Desktop\\Instagram\\alexisfawx\\video1.mp4"_**. The data added will be:
<br /> **Studio:** _Instagram_ - because the "Alexis Fawx" Config object is a descendant of the Instagram config object, and the scanned file matches "Alexis Fawx" Config object paths.
<br /> **Tag:** _ORGANIZED - Unorganized_ - because the scanned file matches "Default Tag - Matches all scanned files" Config object paths.
<br /> **Tag:** _PERFORMER - Pornstar_ - because the "Alexis Fawx" Config object is a child of the Pornstars config object, and the scanned file matches "Alexis Fawx" Config object paths.
<br /> **Tag:** _PERFORMER - Caucasian_ - beacause the scanned file matches "Alexis Fawx" Config object paths.
<br /> **Tag:** _PERFORMER - Fake Tits_ - beacause the scanned file matches "Alexis Fawx" Config object paths.
<br /> **Performer:** _Alexis Fawx_ - beacause the scanned file matches "Alexis Fawx" Config object paths.
<br />

```
var jsonData = [
	{
		"name": "Default Tag - Matches all scanned files",
		"paths": [
			""
		],
		"tags": [
			"ORGANIZED - Unorganized"
		]
	},
    	{
		"name": "Instagram Root",
        	"studio": "Instagram",
		"children": [
			{
				"name": "Celebrities",
				"tags": [
					"PERFORMER - Celebrity"
				],
				"children": [
					{
						"name": "Kim Kardashian",
						"paths": [
							"C:\\Users\\UserName\\Desktop\\Instagram\\kimkardashian"
						],
						"performers": [
							"Kim Kardashian"
						],
						"tags": [
							"PERFORMER - Armenian",
							"PERFORMER - Big Ass"
						]
					},
					{
						"name": "Katy Perry",
						"paths": [
							"C:\\Users\\UserName\\Desktop\\Instagram\\katyperry"
						],
						"performers": [
							"Katy Perry"
						],
						"tags": [
							"PERFORMER - Caucasian,
							"PERFORMER - Big Tits"
						]
					}
				]
			},
			{
				"name": "Pornstars",
				"tags": [
					"PERFORMER - Pornstar
				],
				"children": [
					{
						"name": "Alexis Fawx",
						"paths": [
							"C:\\Users\\UserName\\Desktop\\Instagram\\alexisfawx"
						],
						"performers": [
							"Alexis Fawx"
						],
						"tags": [
							"PERFORMER - Caucasian",
							"PERFORMER - Fake Tits"
						]
					}
				]
			}
		]
	},
	{
		"name": "PornHub Root",
		"paths": [
			"C:\\Users\\UserName\\Desktop\\PornHub"
		]
		"studio": "PornHub",
		"children": [
			(etc...)
		]
	}
];
```
