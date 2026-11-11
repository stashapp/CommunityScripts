"""TagAI Stash plugin entry point.

Stash runs this file directly (see tagAI.yml, ``exec: [python, "{pluginDir}/tagAI.py"]``).
The implementation lives in the ``tagai_core`` package next to this file; this
module only bootstraps it.

Stash passes the job arguments as JSON on stdin; this process must never write
anything but (optionally) JSON to stdout -- Stash parses stdout. All logging goes
through :mod:`tagai_core.stashlog` (stashapi.log, falling back to stderr).

Package layout::

    config        constants, model registry, class-name tables
    stashlog      logging (stashapi.log + stderr fallback)
    stash_client  GraphQL connection, tag lookup/creation
    models        model sessions, Hugging Face download, label loading
    preprocess    per-family image preprocessing
    postprocess   per-family score post-processing and aggregation
    debug         calibration debug report
    inference     generic inference shared by the image and video pipelines
    images        image queries and tag application
    frames        video frame timing and ffmpeg extraction
    markers       scene marker planning and creation
    scenes        scene queries and per-scene processing
    jobs          pagination loop and image/scene runners
    cli           argument parsing and main()
"""

from tagai_core.cli import main


if __name__ == "__main__":
    main()
