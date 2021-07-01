# Kodi helper

## Features

Kodi helper generates files that can be imported with Kodi, to integrate your stash metadata into your Kodi system.

Kodi helper can generate nfo files alongside the source files, or in a specific directory. For more information on how Kodi uses nfo files, see the [Kodi wiki page](https://kodi.wiki/view/NFO_files).

Kodi helper can also generate strm files, along with nfo files. For more information on how Kodi uses strm files, see the [Kodi wiki page](https://kodi.wiki/view/Internet_video_and_audio_streams).

## Configuration

Modify `config.py` to enter values for `API_KEY` and `SERVER_URL`.

## Generating NFO files

`python kodi-helper.py generate-nfo [--inline | --outdir=<output directory>] [--overwrite] [--filter=<filter string>] [--preserve-path --truncate-prefix=<prefix>] [--genre <genre> ...]`

All nfo files will be named using the same basename as the source file. For example: `foo.mp4` will have `foo.nfo` generated. 

If `--inline` is used, then nfo files will be created alongside the source files. This requires the source files being accessible using the `path` stored by stash. This usually means that the script must be run on the same machine as stash, and if the stash libraries are relative, then the script must be run from the same directory as stash.

If `--outdir` is provided, then all nfo files will be created in the provided directory. Note that this may cause issues if there are source files with the same basename, as they will generate the same filename. If `--preserve-path` is included, then the full path of the source file will be added to the directory provided with `--outdir`. The path can be stripped of a prefix by providing a `--truncate-prefix` parameter.

The nfo files will not be overwritten by default. This can be overridden with `--overwrite`.

nfo files will be generated for all scenes in the system. The scenes can be filtered by providing the `--filter` parameter. The filter parameter must be a JSON graphql string. For example:

`--filter='{"path": { "value": "foo", "modifier": "INCLUDES" }}'`

This will only generate for files that include `foo` in the path.

Genres can be added to nfo files by providing `--genre` parameters. More than one `--genre <genre>` parameter may be provided (ie `--genre=foo --genre=bar`).

## Generating STRM files

`python kodi-helper.py generate-strm --outdir=<output directory> [--preserve-path --truncate-prefix=<prefix>] [--use-source-filenames] [--overwrite] [--filter=<filter string>] [--genre <genre> ...]`

This will generate strm and nfo files.

All strm files will be named by the scene ID in stash. ie `30.strm`. If `--use-source-filenames` is provided, then the strm and nfo filenames will be named by the source file instead.

All files will be generated in the directory provided by `--outdir`. If `--preserve-path` is included, then the full path of the source file will be added to the directory provided with `--outdir`. The path can be stripped of a prefix by providing a `--truncate-prefix` parameter. 

The generated files will not be overwritten by default. This can be overridden with `--overwrite`.

As per generating nfo files, the scenes to generate for can be filtered using the `--filter` parameter.
