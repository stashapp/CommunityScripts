# Image Gallery Navigation

https://discourse.stashapp.cc/t/imagegallerynavigation/1857

This plugin adds features for navigating between images within a Gallery from the Image details page. This is intended to make it easier to edit metadata on each Image in a Gallery one at a time without constantly having to go back and forth between the Gallery and Image page.

This plugin currently adds two things to the Image details page:
    - A line above the tabs in the left panel that indicates the current page and total number of pages in the current Gallery. The current image number can be changed to jump to a specific image within the Gallery.
    - Buttons along the left/right side of the main Image display panel that allow moving to the previous/next image in the Gallery.

In the case of Images that are in multiple Galleries, the Gallery being navigated is set by accessing an Images from the Gallery you want to navigate. Otherwise, if you navigate directly to an Image, the first Gallery the Image belongs to will be used as the basis for navigation.

Known issues/limitations:
    - Currently is hardcoded to always sort Images by title.