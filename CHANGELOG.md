# CHANGESLOG

## v0.0.4

### Added
- Upgraded the Docker images with the latest node (v22).

## v0.0.3

### Added
- Updated the endpoint to take projects as parameters [project|database|collection]
- Added cli endpoints for the CLI client
    - ping endpoint to retrieve host informations
    - list databases of a project
    - list collections for a specific database

## v0.0.2

### Added
- Implemented a sophisticated cache system with a ttl per saved values
    - With a logic of 'as' and 'at'
- Supporting 'format' as query string parameter (yml, json, csv)

### Fixed
- Mismatch on github api integration fixed

## v0.0.1

### Added

- A working version of the gitrowspack-api

