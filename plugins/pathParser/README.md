# Path Parser

Updates scene info based on the file path.

## Contents
* [Hooks](#hooks)
* [Triggers](#triggers)
* [Rules](#rules)
* [Patterns](#patterns)
* [Fields](#fields)
* [Examples](#examples)

## Hooks

### Run Rules on scan

Updates scene info whenever a new scene is added.

You can disable this hook by deleting the following section from `pathParser.yml`:

```yml
hooks:
  - name: Run Rules on scan
    description: Updates scene info whenever a new scene is added.
    triggeredBy: 
      - Scene.Create.Post
```

## Triggers

### Create Tags

Adds the \[Run\] and \[Test\] tags.

You can remove this trigger by deleting the following section from `pathParser.yml`:

```yml
  - name: Create Tags
    description: Create tags used by the path parser tasks.
    defaultArgs:
      task: createTags
```

### Remove Tags

Removes the \[Run\] and \[Test\] tags.

You can remove this trigger by deleting the following section from `pathParser.yml`:

```yml
  - name: Remove Tags
    description: Remove tags used by the path parser tasks.
    defaultArgs:
      task: removeTags
```

### Run Rules

Run rules for scenes containing the \[Run\] tag.

You can remove this trigger by deleting the following section from `pathParser.yml`:

```yml
  - name: Run Rules
    description: Run rules for scenes containing the [Run] tag.
    defaultArgs:
      task: runRules
```

### Test Rules

Test rules for scenes containing the \[Test\] tag.

You can remove this trigger by deleting the following section from `pathParser.yml`:

```yml
  - name: Test Rules
    description: Test rules for scenes containing the [Test] tag.
    defaultArgs:
      task: testRules
```

## Rules

A single rule must have a name, pattern, and fields:

```jsonc
{
  name: 'Your Rule',

  // This pattern would match a scene with the path: folder/folder/file.mp4
  pattern: [
    'folder',
    'folder',
    'file'
  ],

  // The matched scene would update it's title and studio
  fields: {
    title: 'Scene Title',
    studio: 'Studio'
  }
}
```

## Patterns

Each entry in pattern will match a folder or the filename (without extension).

Patterns behave differently depending on the type:

| Type     | Format                             | Description                                |
|:---------|:-----------------------------------|:-------------------------------------------|
| null     | `null`                             | Matches any value                          |
| String   | `'string'`                         | Matches a specific value exactly           |
| RegExp   | `/regex/`                          | Match using a regex<sup>1</sup>            |
| Array    | `['string1', 'string2', /regex/]`  | Match any one of the sub-patterns          |
| Function | `function (path) { return path; }` | Match if function returns a non-null value |

1. Parenthesis matches in the regex are able to be used in [field](#fields) replacements.

## Fields

The first matching rule will update the scene with the fields indicated:

| Field      | Format                            |
| :----------|:----------------------------------|
| title      | `'New Title'`                     |
| studio     | `'Studio Name'`                   |
| performers | `'Performer 1, Performer 2, ...'` |
| tags       | `'Tag 1, Tag 2, ...'`             |

Matched patterns can be inserted into any field by referencing their indexed value ([see examples](#examples) below).

## Examples

### Specific studio folders with scenes

```js
{
  name: 'Specific studio folders with scenes',
  pattern: [
    ['Specific Studio', 'Another Studio'], // A specific studio name
    null // Any filename
  ],
  fields: {
    title: '#1', // 1 refers to the second pattern (filename)
    studio: '#0' // 0 refers to the first pattern (folder)
  }
}
```

Input: `X:\DCE\Black Adam.mp4`

Output:

0. DCE
1. Black Adam

### Studio with movie sub-folder and scenes

```js
{
  name: 'Specific studio folders with scenes',
  pattern: [
    null, // Any studio name
    /(.+) \(\d{4}\)/, // A sub-folder with 'Movie Title (2022)'
    /(.+) - \w+ {d}/, // A filename with 'Scene Title - Scene 1'
  ],
  fields: {
    title: '#2',
    studio: '#0'
  }
}
```

Input: `X:\HBO\House of the Dragon (2022)\House of the Dragon - Episode 1.mp4`

Output:

0. HBO
1. House of the Dragon
2. House of the Dragon

### Filename with performers using function

```js

{
  name: 'Filename with performers using function',
  pattern: [
    null, // Any studio name
    function (path) {
      var parts = path.split('.');
      var performers = parts[1].split('&').map(function (performer) { return performer.trim() }).join(',');
      return [parts[0], performers];
    }
  ],
  fields: {
    title: '#1',
    studio: '#0'
  }
}
```

Input: `X:\Prime\The Boys.Karl Urban & Jack Quaid.S01E01.mp4`

Output:

0. Prime
1. The Boys
2. Karl Urban,Jack Quaid