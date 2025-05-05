# Bulk Image Scraper

Apply any image scraper to all of your images 

## Config

Go into your Stash then under `Settings > Plugins` you'll find the config for Bulk Image Scrape

It is mandatory to enter the Scraper ID (the Name) of the Scraper you want to use. In this example [SHALookup](https://github.com/FansDB/metadata-scrapers) is used but you can use any Scraper that is installed in your Stash and is valid for image scraping.

![Settings](./res/settings.png)

- `Create Missing movies/groups from scrape result`
> if the scraper returns a movie/group and it is not already in your stash, the plugin will create it if enabled
- `Create Missing performer from scrape result`
> if the scraper returns a performer and it is not already in your stash, the plugin will create it if enabled
- `Create Missing studios from scrape result`
> if the scraper returns a studio and it is not already in your stash, the plugin will create it if enabled
- `Exclude images that are set as organized`
> Any image that is set as organized will be skipped if enabled
- `Merge existingtags with scraped tags`
> merge scraped tags with existing tags instead of overwriting them when enabled
- `The Scraper ID of the image scraper to use`
> Enter the ID/Name of the scraper you want to use here. If this is not set correctly the plugin will tell you in the logs when you run the plugin task
- `List of tags to skip`
> Any image that has one or more of the Tags from this setting will be skipped by the plugin if Tags are specified here. Multiple Tags must be comma separated. If the plugin can't find a tag you specified it will notify you in the logs

## Task

After you adapted the config to your liking and made sure your image scraper of choice works properly simply start the task in `Settings > Tasks`

![Task](./res/task.png)

Once the Task is running you can track the progress in `Settings > Log`
If the plugin encounters any issues you will be informed here

![Running](./res/running.png)
