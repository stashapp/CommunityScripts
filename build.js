import fs from "fs";
import path from "path";
import parseArgs from "minimist";
import SPB from "stash-plugin-builder";
import { execSync } from "child_process";
import "dotenv/config";

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
  config.outDir = path.join(
    process.env.STASH_PLUGIN_DIR,
    config.stashPluginSubDir ?? "",
  );
}

class GlobModules {
  getYmlFiles(dirPath) {
    return fs
      .readdirSync(dirPath)
      .filter((file) => path.extname(file) === ".yml")
      .map((file) => path.join(dirPath, file));
  }

  getPluginYmlPath(_path) {
    const ymls = Glob.getYmlFiles(_path);
    return ymls.length > 1
      ? (() => {
          const id = path.basename(_path);
          const yml = path.join(_path, `${id}.yml`);
          if (SPB.Glob.fsExsists(yml)) {
            return yml;
          } else {
            return ymls[0];
          }
        })()
      : ymls[0];
  }

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

class UtilsModules {
  getAllPluginFolders(paths) {
    const pluginPaths = {
      normalPluginPaths: [],
      stashPluginBuilderPluginPaths: [],
    };

    for (let _path of paths) {
      let isParentDir = false;

      if (_path.endsWith("/*")) {
        _path = _path.slice(0, -2);
        isParentDir = true;
      }

      if (isParentDir && SPB.Glob.fsExsists(_path)) {
        const recursivePluginPaths = this.getAllPluginFolders(
          SPB.Glob.fsExsists(Glob.getChildDirs(_path, true)),
        );

        pluginPaths.normalPluginPaths.push(
          ...recursivePluginPaths.normalPluginPaths,
        );
        pluginPaths.stashPluginBuilderPluginPaths.push(
          ...recursivePluginPaths.stashPluginBuilderPluginPaths,
        );
      } else if (SPB.Glob.fsExsists(_path)) {
        const isSettingsYmlPresent = SPB.Glob.fsExsists(
          path.join(_path, "settings.yml"),
        );
        const settingsYmlId = isSettingsYmlPresent
          ? SPB.Glob.getYml(path.join(_path, "settings.yml"))?.id
          : false;

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

  packPlugin(pluginPath, pluginDistPath) {
    if (path.resolve(config.outDir) === path.resolve(pluginDistPath)) {
      pluginDistPath = Glob.getChildDirs(pluginDistPath, true)?.[0];
    }

    const ymls = Glob.getYmlFiles(pluginDistPath);

    if (ymls.length) {
      const pluginYmlPath = Glob.getPluginYmlPath(pluginDistPath);
      const pluginYmlData = SPB.Glob.getYml(pluginYmlPath);
      const pluginRawYml = SPB.Glob.getFileContents(pluginYmlPath);
      const indexYmlChunk = {};

      indexYmlChunk.id = path.basename(
        pluginYmlPath,
        path.extname(pluginYmlPath),
      );

      indexYmlChunk.name = pluginYmlData.name;

      if (pluginYmlData.description) {
        indexYmlChunk.metadata = {};
        indexYmlChunk.metadata.description = pluginYmlData.description;
      }

      indexYmlChunk.version = `${pluginRawYml.match(/^version:\s*(['"]?)([0-9]+(?:\.[0-9]+)*)\1/m)?.[2]?.trim() ?? ""}-${Shell.run(`git log -n 1 --pretty=format:%h -- "${pluginPath}"/*`)}`;

      indexYmlChunk.date = Shell.run(
        `TZ=UTC0 git log -n 1 --date="format-local:%F %T" --pretty=format:%ad -- "${pluginPath}"/*`,
      );

      indexYmlChunk.path = `${indexYmlChunk.id}.zip`;

      Shell.run(
        `cd ${pluginDistPath} && zip -r ../${indexYmlChunk.id}.zip . && cd .. && rm -r ${path.basename(pluginDistPath)}`,
      );

      indexYmlChunk.sha256 = Shell.run(
        `sha256sum "${path.join(config.outDir, indexYmlChunk.path)}" | cut -d' ' -f1`,
      );

      if (pluginYmlData.ui?.requires?.length)
        indexYmlChunk.requires = pluginYmlData.ui.requires;

      return indexYmlChunk;
    } else {
      SPB.Glob.delete(pluginDistPath);
    }
  }

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

if (config.excludePluginFolders?.length) {
  allPluginFolders.normalPluginPaths =
    allPluginFolders.normalPluginPaths.filter(
      ({ pluginPath }) =>
        !config.excludePluginFolders.includes(path.basename(pluginPath)),
    );
  allPluginFolders.stashPluginBuilderPluginPaths =
    allPluginFolders.stashPluginBuilderPluginPaths.filter(
      ({ pluginPath }) =>
        !config.excludePluginFolders.includes(path.basename(pluginPath)),
    );
}

allPluginFolders.normalPluginPaths.forEach(({ pluginPath, pluginDistPath }) => {
  SPB.Glob.copy(pluginPath, config.outDir);

  console.log(path.basename(pluginPath), "built ✅");

  if (!isWin && config.mode.dist)
    indexYml.push(Utils.packPlugin(pluginPath, pluginDistPath)); // works only on linux
});
allPluginFolders.stashPluginBuilderPluginPaths.forEach(
  ({ pluginPath, pluginDistPath }) => {
    console.log(
      Shell.run(
        `npx stash-plugin-builder --in=${pluginPath} --out=${config.outDir}${config.mode.dist ? " --minify" : ""}`,
      ),
    );
    if (!isWin && config.mode.dist)
      indexYml.push(Utils.packPlugin(pluginPath, pluginDistPath)); // works only on linux
  },
);

if (indexYml.length && !isWin && config.mode.dist)
  SPB.Glob.writeYml(path.join(config.outDir, "index.yml"), indexYml);

if (config.include?.length && config.mode.dist) {
  Utils.copyExternalFiles(
    config.include,
    config.externalFilesPath ?? config.outDir,
  );
}
