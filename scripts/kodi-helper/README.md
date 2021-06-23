# Kodi helper

## Features

Kodi helper generates files that can be imported with Kodi, to integrate your stash metadata into your Kodi system.

Kodi helper can generate nfo files alongside the source files, or in a specific directory. For more information on how Kodi uses nfo files, see the [Kodi wiki page](https://kodi.wiki/view/NFO_files).

Kodi helper can also generate strm files, along with nfo files, in a customisable hierarchical directory structure. For more information on how Kodi uses strm files, see the [Kodi wiki page](https://kodi.wiki/view/Internet_video_and_audio_streams).

## Configuration

Modify `config.py` to enter values for `API_KEY` and `SERVER_URL`.

## Generating NFO files

`python kodi-helper.py generate-nfo [--inline | --outdir=<output directory>] [--overwrite] [--filter=<filter string>]`

All nfo files will be named using the same basename as the source file. For example: `foo.mp4` will have `foo.nfo` generated. 

If `--inline` is used, then nfo files will be created alongside the source files. This requires the source files being accessible using the `path` stored by stash. This usually means that the script must be run on the same machine as stash, and if the stash libraries are relative, then the script must be run from the same directory as stash.

If `--outdir` is provided, then all nfo files will be created in the provided directory. Note that this may cause issues if there are source files with the same basename, as they will generate the same filename.

The nfo files will not be overwritten by default. This can be overridden with `--overwrite`.

nfo files will be generated for all scenes in the system. The scenes can be filtered by providing the `--filter` parameter. The filter parameter must be a JSON graphql string. For example:

`--filter='{"path": { "value": "foo", "modifier": "INCLUDES" }}'`

This will only generate for files that include `foo` in the path.

## Generating STRM files

`python kodi-helper.py generate-strm --outdir=<output directory> [--hierarchy=<hierarchy string>] [--overwrite] [--filter=<filter string>]`

All strm files will be named by the scene ID in stash. ie `30.strm`. An nfo file will be generated alongside the strm file. 

By default, all files will be generated in the directory provided by `--outdir`. The output files can be organised by their metadata by providing the `--hierarchy` parameter. This parameter is a comma-delimited list of metadata to organise by. Valid values are:
* `studios`
* `tags`
* `performers`
* `movies`
* `rating`

For example, if `studios` is included in the `hierarchy` paratemer, and a scene has a studio, its strm and nfo files will be saved in `<outdir>/studios/<studio name>/`. If a scene does not have any applicable metadata to place it in a subdirectory, then the strm and nfo files will be generated in `<outdir>`.

The generated files will not be overwritten by default. This can be overridden with `--overwrite`.

As per generating nfo files, the scenes to generate for can be filtered using the `--filter` parameter.
