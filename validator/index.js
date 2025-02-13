#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const safeRequire = (name) => {
  try {
    return require(name);
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') {
      console.log(`Error: Cannot find module '${name}', have you installed the dependencies?`);
      process.exit(1);
    }
    throw error;
  }
};

const Ajv = safeRequire('ajv').default;
const betterAjvErrors = safeRequire('better-ajv-errors').default;
const chalk = safeRequire('chalk');
const YAML = safeRequire('yaml');
const addFormats = safeRequire('ajv-formats');

// https://www.peterbe.com/plog/nodejs-fs-walk-or-glob-or-fast-glob
function walk(directory, ext, filepaths = []) {
  const files = fs.readdirSync(directory);
  for (const filename of files) {
    const filepath = path.join(directory, filename);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, ext, filepaths);
    } else if (path.extname(filename) === ext && !filename.includes('config')) {
      filepaths.push(filepath);
    }
  }
  return filepaths;
}

// https://stackoverflow.com/a/53833620
const isSorted = arr => arr.every((v,i,a) => !i || a[i-1] <= v);

class Validator {
  constructor(flags) {
    this.allowDeprecations = flags.includes('-d');
    this.stopOnError = !flags.includes('-a');
    this.sortedURLs = flags.includes('-s');
    this.verbose = flags.includes('-v');

    const schemaPath = path.resolve(__dirname, './plugin.schema.json');
    this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    this.ajv = new Ajv({
      // allErrors: true,
      allowUnionTypes: true, // Use allowUnionTypes instead of ignoreKeywordsWithRef
      strict: true,
      allowMatchingProperties: true, // Allow properties that match a pattern
    });
    addFormats(this.ajv);
  }

  run(files) {
    let plugins;

    if (files && Array.isArray(files) && files.length > 0) {
      plugins = files.map(file => path.resolve(file));
    } else {
      const pluginsDir = path.resolve(__dirname, '../plugins');
      const themesDir = path.resolve(__dirname, '../themes');
      plugins = walk(pluginsDir, '.yml').concat(walk(themesDir, '.yml'));
    }

    let result = true;
    const validate = this.ajv.compile(this.schema);

    for (const file of plugins) {
      const relPath = path.relative(process.cwd(), file);
      let contents, data;
      try {
        contents = fs.readFileSync(file, 'utf8');
        data = YAML.parse(contents);
      } catch (error) {
        console.error(`${chalk.red(chalk.bold('ERROR'))} in: ${relPath}:`);
        error.stack = null;
        console.error(error);
        result = result && false;
        if (this.stopOnError) break;
        else continue;
      }

      let valid = validate(data);

      // Output validation errors
      if (!valid) {
        const output = betterAjvErrors(this.schema, data, validate.errors, { indent: 2 });
        console.log(output);

        // Detailed error checks
        validate.errors.forEach(err => {
          switch (err.keyword) {
            case 'required':
              console.error(`${chalk.red('Missing Required Property:')} ${err.params.missingProperty}`);
              break;
            case 'type':
              console.error(`${chalk.red('Type Mismatch:')} ${err.dataPath} should be ${err.params.type}`);
              break;
            case 'pattern':
              console.error(`${chalk.red('Pattern Mismatch:')} ${err.dataPath} should match pattern ${err.params.pattern}`);
              break;
            case 'enum':
              console.error(`${chalk.red('Enum Violation:')} ${err.dataPath} should be one of ${err.params.allowedValues.join(', ')}`);
              break;
            case 'additionalProperties':
              console.error(`${chalk.red('Additional Properties:')} ${err.params.additionalProperty} is not allowed`);
              break;
            case '$ref':
              console.error(`${chalk.red('Invalid Reference:')} ${err.dataPath} ${err.message}`);
              break;
            case 'items':
              console.error(`${chalk.red('Array Item Type Mismatch:')} ${err.dataPath} ${err.message}`);
              break;
            case 'format':
              console.error(`${chalk.red('Invalid Format:')} ${err.dataPath} should match format ${err.params.format}`);
              break;
            default:
              console.error(`${chalk.red('Validation Error:')} ${err.dataPath} ${err.message}`);
          }
        });
      }

      if (this.verbose || !valid) {
        const validColor = valid ? chalk.green : chalk.red;
        console.log(`${relPath} Valid: ${validColor(valid)}`);
      }

      result = result && valid;

      if (!valid && this.stopOnError) break;
    }

    if (!this.verbose && result) {
      console.log(chalk.green('Validation passed!'));
    }

    return result;
  }
}

function main(flags, files) {
  const args = process.argv.slice(2)
  flags = (flags === undefined) ? args.filter(arg => arg.startsWith('-')) : flags;
  files = (files === undefined) ? args.filter(arg => !arg.startsWith('-')) : files;
  const validator = new Validator(flags);
  const result = validator.run(files);
  if (flags.includes('--ci')) {
    process.exit(result ? 0 : 1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
module.exports.Validator = Validator;