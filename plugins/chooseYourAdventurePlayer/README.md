# Choose Your Own Adventure Player
A plugin to adapt Choose Your Own Adventure Games to the Stash VideoJS player.

## Setup
The plugin provides various settings, but only the `Access tokem`, `Game tag`, `Resource path`, and `Scene directory path` settings are required for it to work. Please read through the details below for each of these settings to understand what each setting requires. Before attempting to run the plugin with your own game files, please run the provided sample files to ensure your configuration is set up properly.

Note:
This repo does not provide the JS and CSS files necessary to run this plugin. The files are only available to Stash backers. If you are a Stash backer, reach out to `_cj13` in the discord channel and provide your GitHub username, and you will be given access to the [BackerScripts](https://github.com/cj12312021/BackerScripts) repo where all the plugin resource are provided at.

### Access token (Required)
This plugin exists as an additional perk for our backers. So, an access token is required to verify you have sufficient access to the backer repo. If you are a backer of the project, feel free to reach out to me on our Discord channel with your GitHub account name in order to obtain the necessary access. Once your Github account has the permissions required, you will need to generate a classic personal access token with `repo` scope selected (See: [Creating a personal access token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)). The generated access token is what you will provide here.

### Game tag (Required)
This is the name of the tag created to indicate that the selected game clip is the starting video for the game. For example, you may choose to create a tag called `Game Start`. The `Game Start` tag would be added to the `Scene0.mp4` file as that is the starting file in the provided sample. (I would recommend setting your default filters up to hide other related videos that are not the starting video. You can create another tag to identify which videos/scenes these are)

### Resource path (Required)
This is the path where the non-video game resources would live. For example, the path to the `Sample` directory would be the `Resource path`, which contains one game with the id `1234`. Note that the game id should always be the parent directory of the `choice`, and `image` directories. Each game within this directory is expected to have a choices directory with all the necessary JSON files as well as an `images` directory with all the relevant images for the game. You can configure assets directly in this plugin if you want. But I would just recommend against it to prevent your game files from being deleted if you ever uninstalled this plugin from the Stash plugin page. I would recommend setting up a custom-served folder for your Stash; see: [Custom served folders](https://docs.stashapp.cc/in-app-manual/configuration/#custom-served-folders). Also, see the provided `Sample` directory for examples of what the relevant files should contain.

### Scene directory path (Required)
This is the path within your Stash library directories where your game videos/scenes are stored. For example, the path to the `Sample` directory would be the `Scene directory path`, which contains one game with the id/directory `1234`. In your case, the videos do not have to live under a videos directory within the `1234` directory. Note that this plugin relies on the studio code field in Stash to identify the directory all supporting videos live in, so for the sample project, make sure `Scene0.mp4` has `1234` set as its studio code.

## Choice Files
This section covers things to know when creating the choice JSON files.

### Start Choice
Every game should contain a `0.json` file, which is the starting file for these games. See the various properties of these files in the snippet below:

```
{
  /* The id here should correspond with the name of the file */
  "id": "0",
  "type": null, // In most cases this can be null expect for when dealing with an end choice. This is explained later.
  /* This is the name/title used for each choice. This name would be displayed when a dicision is required from the user. 
     This name is not as important for the start choice */
  "title": "Game Start",
  /* This property is not required, but when provided it would include details about the game the user is about to play. 
     This property would only exist in the 0.json file */
  "map": { 
    "title": "Demo",
    "description": "Your are viewing a demo of the Choose Your Adventure Player"
  },
  /* This property is not required, but when provided it would provide an overview of the different branches of the game. 
     This also serves as a portal user can take to navigate directly to specific branches */
  "mapItem": [
    {
      "choice_id": "TBD", // id of the choice this overview is attempting to highlight
      "title": "TBD",
      "picture": null // name of relevant photo. Not required, however if provided it would ideally be an image relevant to the branch it overs
    }
  ],
  /* This property can be specified in any choice. When provide it allows the user to skip dialog scenes and get striaght into the action. 
     The provided value should be the id of the choice the user would be directed to. */
  "skipto": "2",
  /* Each json file should contain atleast one choice here (unless the json file is the final branch). When one choice is provided 
     the game will navigae directly to the provided choice. When more than one choice is provided the user will be presented an 
     option to make their own choice at the end of the scene. */
  "choices": [
    {
      "description": "Good Choice", // text shown to user describing the choice
      "id": "1a", // id of the next choice to load
      "type": "",
      "photo": null // name of relevant photo to further describe choice. WHen no photo is provided a default photo will be used.
    },
    {
      "description": "Bad Choice",
      "id": "1b",
      "type": "",
      "photo": null
    }
  ],
  "resource": { // this should contain the name of the video that will be played as a part of this choice
    "resolved_content": "Scene0.mp4"
  }
}
```

### Multi Scene Choices
Multiple scenes can be provided within a choice. To do this, you would use the `fragments` property. This property will effectively replace the `resource` property, which can only contain one scene. Each fragment can include an action which is intended to be a shorter clip related to the fragment that the user can click as many times as they would like to repeat the action. For more info on how these can be used, see the example file below:

```
{
  "id": "2",
  "type": null,
  "title": "Action choice",
  "fragments": [
    {
      "id": "frag-a",
      "photo": {
        "id": "frag-a_photo",
        "content": "frag-a.jpg"
      },
      "video": {
        "id": "frag-a_video",
        "resolved_content": "Scene2A.mp4"
      },
      "actions": [
        {
          "id": "frag-a-action-a",
          "photo": {
            "id": "frag-a-action-a_photo",
            "content": "frag-a-action-a.jpg"
          },
          "video": {
            "id": "frag-a-action-a_video",
            "resolved_content": "Scene2A-1.mp4"
          },
          "title": "TBD"
        },
        {
          "id": "frag-a-action-b",
          "photo": {
            "id": "frag-a-action-b_photo",
            "content": "frag-a-action-b.jpg"
          },
          "video": {
            "id": "frag-a-action-b_video",
            "resolved_content": "Scene2A-1.mp4"
          },
          "title": "TBD"
        }
      ],
      "title": "TBD"
    },
    {
      "id": "frag-b",
      "photo": {
        "id": "frag-b_photo",
        "content": "frag-b.jpg"
      },
      "video": {
        "id": "frag-b_video",
        "resolved_content": "Scene2B.mp4"
      },
      "actions": null,
      "title": "TBA",
      "subtitles": "Scene3-08"
    }
  ],
  "skipto": null,
  "choices": [
    {
      "description": null,
      "id": "2-e",
      "type": "end",
      "photo": "TBD"
    }
  ],
  "resource": {
    "id": "empty",
    "resolved_content": null
  }
}

```

### End Choice
Similar to the start choice, each scene will contain an end choice. The choice will conclude the game. The choices are will either be of type `exit`, or `end`. 
The `exit` type is effectively a fail choice, letting the user know they have failed the game. When a user encounters this, they will be given an option to go back and choose a different choice or simply restart the game.
The `end` type is the success choice, letting the user know they have concluded the game as "intended". Once a user hits this screen, they can decide to replay the game from the start or exit it.
