# StashDB Submission Helper

- Adds button to add all unmatched aliases to performer
- Adds button to add all unmatched urls to performer
- Adds button to add all unmatched measurements to performer (if they match expected formats)
- Convert unmatched urls from regular strings to linked strings

## [**INSTALL USERSCRIPT**](https://raw.githubusercontent.com/stashapp/CommunityScripts/main/userscripts/StashDB_Submission_Helper/stashdb_submission_helper.user.js)

Installation requires a browser extension such as [Violentmonkey](https://violentmonkey.github.io/) / [Tampermonkey](https://www.tampermonkey.net/) / [Greasemonkey](https://www.greasespot.net/).

### Screenshot
![script preview](https://user-images.githubusercontent.com/1358708/178110989-3bc33371-e3bb-4064-8851-a9356b5a4882.png)

### Demo GIF:
![demo gif](https://monosnap.com/image/p4pkcqrKWYp3V5quHl5LWOAZUG3oAP)

## Changelog

### 0.7
- Allow alias separator to also be `/` or ` or ` (space on either side of the or).
- Allow measurements to be added without the cup size
- Support full current list of sites for adding URLS (previously only IAFD, DATA18, Indexxx, and Twitter were supported because I forgot to add the others)

### 0.6
- Add input field / button to performer edit pages to add a comma separated list of aliases to a performer
![alias input](https://user-images.githubusercontent.com/1358708/179358258-89385345-36ed-42ea-8b71-4f7e84d3a253.png)
- Cleaned up code so that it doesn't run on non-performer drafts
- Added performer add and edit pages to the pages it runs on (since alias function isn't just draft related)

### 0.5
Public Release
