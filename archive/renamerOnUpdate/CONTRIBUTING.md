# Contributing to RenamerOnUpdate

Thank you for your interest in contributing to RenamerOnUpdate! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Python 3.13 or later
- [uv](https://github.com/astral-sh/uv) (recommended) or pip for dependency management
- [pre-commit](https://pre-commit.com/) for code quality checks

### Initial Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd renamerOnUpdate
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

3. Install pre-commit hooks:
   ```bash
   pre-commit install
   ```

## Pre-commit Hooks

This project uses [pre-commit](https://pre-commit.com/) to ensure code quality and consistency. Pre-commit hooks run automatically before each commit to check your code.

### What's Configured

The following hooks are configured:

- **Basic checks**: Merge conflict detection, TOML/YAML validation, private key detection, end-of-file fixes, trailing whitespace removal
- **Ruff**: Python linter and formatter (with auto-fix enabled)
- **MyPy**: Static type checker

Python hooks run in the same environment where pre-commit is installed. The project requires Python 3.13 or later.

### Running Pre-commit Manually

You can run all hooks on all files at any time:

```bash
pre-commit run --all-files
```

To run a specific hook:

```bash
pre-commit run <hook-id>
```

For example:
```bash
pre-commit run ruff
pre-commit run mypy
```

### Updating Hooks

To update pre-commit hooks to their latest versions:

```bash
pre-commit autoupdate
```

## Code Quality Standards

### Type Checking

This project uses MyPy with strict type checking. All code must pass type checking:

```bash
uv run mypy .
```

### Linting and Formatting

Code is automatically linted and formatted with Ruff. The configuration enforces:

- **Docstrings**: All public modules, classes, and functions must have Google-style docstrings
- **Naming conventions**: Functions, variables, and arguments must follow PEP 8 naming conventions (snake_case)
- **Code style**: Ruff's default formatting rules
- **Import sorting**: Automatic import sorting with isort
- **Code quality**: Bugbear rules for potential bugs and security issues
- **Code simplification**: SIM rules for detecting and simplifying inefficient patterns
- **Modern syntax**: pyupgrade rules for modernizing Python syntax
- **Comprehensions**: C4 rules for efficient comprehension patterns
- **Unused code**: ARG rules for detecting unused arguments
- **PEP 8 compliance**: Full Pycodestyle error and warning checking

Run linting manually:

```bash
uv run ruff check .
uv run ruff format .
```

### Pre-commit Will Fix Many Issues Automatically

Many issues (formatting, trailing whitespace, etc.) are automatically fixed by pre-commit hooks. If a hook fails, check the output - it may have already fixed the issues, and you just need to stage the changes and commit again.

## Making Changes

1. Create a branch for your changes
2. Make your changes
3. Ensure all pre-commit hooks pass (they run automatically on commit)
4. Commit your changes (pre-commit will run automatically)
5. Push and create a pull request

## Configuration Files

- `.pre-commit-config.yaml`: Pre-commit hook configuration
- `pyproject.toml`: Project configuration, including MyPy and Ruff settings
- `.python-version`: Python version specification (3.13)

## Getting Help

If you encounter issues with pre-commit or have questions about the development setup, please open an issue on the repository.
