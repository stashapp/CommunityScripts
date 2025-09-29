# Star Identifier

https://discourse.stashapp.cc/t/star-identifier/3761

https://github.com/axxeman23/star_identifier

## Intro

Star Identifier uses [facial recognition](https://github.com/ageitgey/face_recognition) to automatically identify who is in images or scene screenshots from the performers already in your [Stash](https://github.com/stashapp/stash) library.

## Requirements

### Python3
__version: 3.10.x +__

#### Installing Python

1. Download Python [here](https://www.python.org/downloads/)
2. Install & add to your PATH
3. Configure Stash to use Python (if necessary. This can be set in the `System` tab of your `Settings` page)

### Libs & Dependencies

#### CMake

For Windows:

- You'll also need to install Microsoft Visual Studio 2015 (or newer) with C/C++ Compiler installed. [Link here](https://visualstudio.microsoft.com/downloads/)
- Install and add CMake to your PATH. [Link](https://cmake.org/download/)
- For more details, see [this issue](https://github.com/ageitgey/face_recognition/issues/175)

For Mac & Linux:
`brew install cmake`

#### Python Libraries

1. numpy
2. dlib
3. face_recognition

`pip install numpy dlib face_recognition`

For more details, see the [Face Recognition installation instructions](https://github.com/ageitgey/face_recognition#installation).

### Plugin Files

You'll need the following in your `plugins` folder from this repo. Copy `star_identifier.yml` to the `plugins` folder, and the rest of the files to a folder called `py_plugins` inside the `plugins` folder. If you already have `log.py` in `py_plugins`, skip copying that one (it should be the same)

```
star_identifier.yml
py_plugins:
  | log.py
  | star_identifier_config.py
  | star_identifier_interface.py
  | star_identifier.py
```

## Config

### Paths

Running the plugin will create a folder. By default, this will be created in your `plugins` folder, but you can change that in the config.

Face encodings will be saved to that new folder. The encodings file will be roughly 1MB per 1,000 performers.

### Stash Settings

Star Identifier uses a tag to find images or scenes you would like identified. By default, that tag is `star identifier`.

Since the recognition is based on a single performer image, that image needs to have a pretty clear front-facing view of the performer's face. If face_recognition fails to find a performer's face, Star Identifier will tag that performer with `star identifier performer error` by default.

### Star Identifier Settings

You can adjust the tolerance for identification here. `0.6` is default and typical, but I've found `0.5` to work well. Lower is more strict.

## Running

### Export Performers

This is the first step. Star Identifier loads each performer's image, encodes their facial features into a numpy array, and saves those arrays. The clearer the face of the performer, the better identification results will be. Performers whose faces are not recognized by face_recognition will be tagged for you to update as desired.

This only needs to be run once, or after new performers are added or have updated images.

### Identify Images

This loads all images in the stash database tagged with `star identifier` (by default), compares the recognized faces to the exported face database, and then adds all potential matches to those images as performers.

### Identify Scene Screenshots

This loads the screenshot for every scene in the stash database tagged with `star identifier` (by default), compares the recognized faces to the exported face database, and then adds all potential matches to those scenes as performers.

## Upcoming roadmap

See [issues](https://github.com/axxeman23/star_identifier/issues)
