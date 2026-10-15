# Changelog

All notable changes to the A Haven VLM Connector project will be documented in this file.

## [1.2.0] - 2026-10-13
### Added
- `systemone_endpoints` support in `haven_vlm_config.py` model configs (Jev `/v1/systemone` endpoint pool, kept separate from `multiplexer_endpoints`)
### Changed
- Updated all dependencies to latest pinned versions: vlm-engine 1.1.0 (brings openai 3.29.0 / multiplexer-llm 0.4.0), aiohttp 3.14.5, pydantic 2.14.1, pyyaml 6.0.3, stashapp-tools 0.2.59
- Pinned development dependencies: coverage 7.16.2, pytest 9.1.1, pytest-cov 7.1.0
- Minimum Python version raised from 3.8 to 3.10 (required by the openai 3.x stack)

## [1.1.1] - 2026-04-05
### Fixes
- Mitigate TorchVision v0.26.0 release https://github.com/Haven-hvn/haven-vlm-engine-package/commit/7a3a6f9dd931237c93c5205f3d31df3e285ae21d

## [1.0.0] - 2025-06-29

### Added
- **Initial release**
