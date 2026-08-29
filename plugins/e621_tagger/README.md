# e621 tagger

https://discourse.stashapp.cc/t/e621-tagger/1377

Just a quick script to tag your uploadings

Took some code from bulkImageScrape as example, because I'm not a python dev

https://github.com/stashapp/CommunityScripts/blob/main/plugins/bulkImageScrape/bulkImageScrape.py

## How to use

Go to Tasks -> e621_tagger -> Press Tag Everything

## Configuration

- You can configure which tags it will skip. By default, it will skip `e621_tagged` tag.
- e621 requires UserAgent to be set in this format: `Project/1.1 (by yourname on e621)`, otherwise, it will block requests with 403.



## Changelog
#### 0.7
- Breaking changes: now you have to configure extra fields:
  -  Delay between e621 requests in milliseconds
  -  List of tags to skip (comma separated)
  -  e621 User-Agent
- Fixed 403 on e621 requests. Now e621 requires UserAgent to be set in this format: `Project/1.1 (by yourname on e621)`. Generic or browser-like strings are rejected with 403. Default - `Stash-e621-Tagger/1.1 (by anonymous on e621)`
