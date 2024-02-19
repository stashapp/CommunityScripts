import fs from "fs";
import path from "path";
import parseArgs from "minimist";
import SPB from "stash-plugin-builder";
import { execSync } from "child_process";
import "dotenv/config";

////////////////////////////// INIT //////////////////////////////

import config from "./build-config.json" assert { type: "json" };

const argv = parseArgs(process.argv.slice(2));
const isWin = process.platform === "win32";
config.outDir = config.outDir ?? "dist";

function getArgv(key, shortKey) {
  return argv[key] || (shortKey ? argv[shortKey] : argv[key[0]]);
}

config.mode = {};
config.mode.build = getArgv("build");
config.mode.dist = getArgv("dist");

if (config.mode.build) {
  // set out path to stash plugins folder
  config.outDir = path.join(
    process.env.STASH_PLUGIN_DIR,
    config.stashPluginSubDir ?? ""
  );
}

////////////////////////////// FUNCTIONS //////////////////////////////

// functions related to file system
class GlobModules {
  // gets all yml files inside a folder
  getYmlFiles(dirPath) {
    return fs
      .readdirSync(dirPath)
      .filter((file) => path.extname(file) === ".yml")
      .map((file) => path.join(dirPath, file));
  }

  // return the plugin yml path
  getPluginYmlPath(_path) {
    const ymls = Glob.getYmlFiles(_path);
    return ymls.length > 1
      ? (() => {
          const id = path.basename(_path);
          const yml = path.join(_path, `${id}.yml`);
          // check if there is a yml with the folder's name
          if (SPB.Glob.fsExsists(yml)) {
            return yml;
          } else {
            return ymls[0];
          }
        })()
      : ymls[0]; // if only 1 yml file is present then return its path
  }

  // get all 1 level down child dirs
  getChildDirs(source, relativePath = false) {
    return fs
      .readdirSync(source, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => {
        if (relativePath) {
          return path.join(source, dirent.name);
        } else {
          return dirent.name;
        }
      });
  }
}

// utility functions
class UtilsModules {
  getAllPluginFolders(paths) {
    const pluginPaths = {
      normalPluginPaths: [],
      stashPluginBuilderPluginPaths: [],
    };

    for (let _path of paths) {
      let isParentDir = false;

      // check if the plugin path is a parent folder
      if (_path.endsWith("/*")) {
        _path = _path.slice(0, -2);
        isParentDir = true;
      }

      if (isParentDir && SPB.Glob.fsExsists(_path)) {
        const recursivePluginPaths = this.getAllPluginFolders(
          SPB.Glob.fsExsists(Glob.getChildDirs(_path, true))
        );

        pluginPaths.normalPluginPaths.push(
          ...recursivePluginPaths.normalPluginPaths
        );
        pluginPaths.stashPluginBuilderPluginPaths.push(
          ...recursivePluginPaths.stashPluginBuilderPluginPaths
        );
      } else if (SPB.Glob.fsExsists(_path)) {
        const isSettingsYmlPresent = SPB.Glob.fsExsists(
          path.join(_path, "settings.yml")
        );
        const settingsYmlId = isSettingsYmlPresent
          ? SPB.Glob.getYml(path.join(_path, "settings.yml"))?.id
          : false;

        // separate normal and spb plugins by checking if folder has settings.yml
        if (settingsYmlId) {
          pluginPaths.stashPluginBuilderPluginPaths.push({
            pluginPath: _path,
            pluginDistPath: path.join(config.outDir, settingsYmlId),
          });
        } else {
          pluginPaths.normalPluginPaths.push({
            pluginPath: _path,
            pluginDistPath: path.join(config.outDir, path.basename(_path)),
          });
        }
      }
    }

    return pluginPaths;
  }

  // zips the plugin folder and writes its details to index.yml folder
  packPlugin(pluginPath, pluginDistPath) {
    if (path.resolve(config.outDir) === path.resolve(pluginDistPath)) {
      pluginDistPath = Glob.getChildDirs(pluginDistPath, true)?.[0];
    }

    const ymls = Glob.getYmlFiles(pluginDistPath);

    if (ymls.length) {
      const pluginYmlPath = Glob.getPluginYmlPath(pluginDistPath);
      const pluginYmlData = SPB.Glob.getYml(pluginYmlPath); // read yml data
      const pluginRawYml = SPB.Glob.getFileContents(pluginYmlPath); // get yml raw data
      const indexYmlChunk = {}; // index.yml data for this plugin

      // set plugin yml file's basename as plugin id
      indexYmlChunk.id = path.basename(
        pluginYmlPath,
        path.extname(pluginYmlPath)
      );

      indexYmlChunk.name = pluginYmlData.name;

      if (pluginYmlData.description) {
        indexYmlChunk.metadata = {};
        indexYmlChunk.metadata.description = pluginYmlData.description;
      }

      // get version from raw data and cobine it with git latest commit sha hash
      indexYmlChunk.version = `${pluginRawYml.match(/^version:\s*(['"]?)([0-9]+(?:\.[0-9]+)*)\1/m)?.[2]?.trim() ?? ""}-${Shell.run(`git log -n 1 --pretty=format:%h -- "${pluginPath}"/*`)}`;

      // get latest modified date
      indexYmlChunk.date = Shell.run(
        `TZ=UTC0 git log -n 1 --date="format-local:%F %T" --pretty=format:%ad -- "${pluginPath}"/*`
      );

      indexYmlChunk.path = `${indexYmlChunk.id}.zip`;

      // zip the plugin dist folder
      Shell.run(
        `cd ${pluginDistPath} && zip -r ../${indexYmlChunk.id}.zip . && cd .. && rm -r ${path.basename(pluginDistPath)}`
      );

      // get sha256 hash
      indexYmlChunk.sha256 = Shell.run(
        `sha256sum "${path.join(config.outDir, indexYmlChunk.path)}" | cut -d' ' -f1`
      );

      // handle dependencies
      if (pluginYmlData.ui?.requires?.length)
        indexYmlChunk.requires = pluginYmlData.ui.requires;

      return indexYmlChunk;
    } else {
      // if no yml file is found then its prob not a plugin folder so delete it from out path
      SPB.Glob.delete(pluginDistPath);
    }
  }

  // copied external files like README.md, LICENSE, etc...
  copyExternalFiles(paths, dest) {
    paths.forEach((_path) => {
      let isCopyContents = false;

      if (_path.endsWith("/*")) {
        _path = _path.slice(0, -2);
        isCopyContents = true;
      }

      if (SPB.Glob.fsExsists(_path)) SPB.Glob.copy(_path, dest, isCopyContents);
    });
  }
}

// function related to child process
class ShellModules {
  run(command) {
    const stdout = execSync(command);
    return stdout.toString().trim();
  }
}

////////////////////////////// MAIN //////////////////////////////

const Glob = new GlobModules();
const Utils = new UtilsModules();
const Shell = new ShellModules();

const allPluginFolders = Utils.getAllPluginFolders(config.plugins ?? ["./"]);
const indexYml = [];

// filter files and folder by excluding all exclude folders and files
if (config.excludePluginFolders?.length) {
  allPluginFolders.normalPluginPaths =
    allPluginFolders.normalPluginPaths.filter(
      ({ pluginPath }) =>
        !config.excludePluginFolders.includes(path.basename(pluginPath))
    );
  allPluginFolders.stashPluginBuilderPluginPaths =
    allPluginFolders.stashPluginBuilderPluginPaths.filter(
      ({ pluginPath }) =>
        !config.excludePluginFolders.includes(path.basename(pluginPath))
    );
}

// copy normal plugins
allPluginFolders.normalPluginPaths.forEach(({ pluginPath, pluginDistPath }) => {
  SPB.Glob.copy(pluginPath, config.outDir);

  console.log(path.basename(pluginPath), "built ✅");

  // if its windows don't pack the plugin
  if (!isWin && config.mode.dist)
    indexYml.push(Utils.packPlugin(pluginPath, pluginDistPath)); // works only on linux
});
// build SPB plugins
allPluginFolders.stashPluginBuilderPluginPaths.forEach(
  ({ pluginPath, pluginDistPath }) => {
    console.log(
      Shell.run(
        `npx stash-plugin-builder --in=${pluginPath} --out=${config.outDir}${config.mode.dist ? " --minify" : ""}`
      )
    );

    // if its windows don't pack the plugin
    if (!isWin && config.mode.dist)
      indexYml.push(Utils.packPlugin(pluginPath, pluginDistPath)); // works only on linux
  }
);

if (indexYml.length && !isWin && config.mode.dist)
  SPB.Glob.writeYml(path.join(config.outDir, "index.yml"), indexYml);

// copy all external files
if (config.include?.length && config.mode.dist) {
  Utils.copyExternalFiles(
    config.include,
    config.externalFilesPath ?? config.outDir
  );
}
