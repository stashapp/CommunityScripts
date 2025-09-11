# PythonDepManager

https://discourse.stashapp.cc/t/pythondepmanager/1801

Python dependency management system for CommunityScripts plugins.

This plugin provides an easy way to install and manage Python package dependencies in your plugins without manual user interaction.

Don't worry about missing dependencies and wrong or conflicting versions anymore.

## Features

- 🚀 Automatic dependency installation and management
  - Users won't have to manually install dependencies

- 🔒 Isolated dependency versions
  - Specify exact version of your dependencies without worrying about conflicts with other plugin installs

- 📦 Support for multiple package sources:
  - PyPI packages with version constraints
  - Git repositories (with branch/tag/commit support)
  - Custom import names for metapackages
- 🔄 Automatic version resolution and compatibility checking
- 🧹 Easy dependency cleanup and flushing

## Installation

1. Add PythonDepManager as a requirement in your plugin's YAML file:

```yaml
name: YourPlugin
# requires: PythonDepManager
description: Your plugin description
```

## Usage

### Basic Usage

In your plugin's Python code, import and use the dependency manager:

```python
from PythonDepManager import ensure_import
# Install and import a package with specific version
ensure_import("requests==2.26.0")

# Afterwards imports will use only the requested versions
import requests
```

### Advanced Usage

#### Minimum Versions

Define a minimum version to use. This will either use any cached version
which matches or install the latest

```python
from PythonDepManager import ensure_import
ensure_import("requests>=2.26.0")
```

#### Custom Import Names/Meta Packages

Use custom import names for packages with different import names or meta packages

```python
from PythonDepManager import ensure_import
# Install beautifulsoup4 but import as bs4
ensure_import("bs4:beautifulsoup4==4.9.3")
```

```python
from PythonDepManager import ensure_import
# Install stashapp-tools but import as stashapi
ensure_import("stashapi:stashapp-tools==0.2.58")
```

#### Git Repository Dependencies

Install packages directly from Git repositories:

```python
from PythonDepManager import ensure_import
# Install from a Git repository
ensure_import("stashapi@git+https://github.com/user/repo.git")

# Install specific branch/tag
ensure_import("stashapi@git+https://github.com/user/repo.git@main")

# Install specific commit
ensure_import("stashapi@git+https://github.com/user/repo.git@ad483dc")
```

### Multiple Imports

Handle multiple different requirements for imports:

```python
from PythonDepManager import ensure_import
ensure_import(
  "requests",
  "bs4:beautifulsoup4==4.9.3",
  "stashapi:stashapp-tools==0.2.58",
  "someothermodule>=0.1",
)
```

### Managing Dependencies

To flush all cached dependencies:

```python
from PythonDepManager import flush_dependencies
flush_dependencies()
```

## Requirements

- Git (for Git repository dependencies)
- pip (Python package installer)
