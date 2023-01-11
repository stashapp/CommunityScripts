# Scene Card Video Player
<p>
<img src="https://user-images.githubusercontent.com/22040708/211264163-5f25f566-8217-4334-9df6-ca742a5e92c5.png" width=500 />
<p>
Inspired by clangmoyai's IINA plugin. I added more cross platform support. <br>
It is tested fully in windows 11 environment. Hopefully it will work in others. <br>

* The script will add a simple "Play" button for each scene card. You click on it, and the video get played.<br>
You click on the video, then it will disappear. You are back to the scene list. <br>
* To install it, copy and paste the code from the pwPlayer.js into Stash->Settings->Interface->Custom Javascript.<br>
Then refresh the browser.
* Well, it's supposed to be this simple. Don't know why Stash guys make it so complicated. <br>
So, enjoy play with it. In the future I will try to make it work with DeoVr.

### Updates
#### 1/09/2023
* Move file info to display when mouse hovers over play buttons.
#### 1/10/2023
* Improve the "wait for element" to preview video only.
* Now when play, the top nav bar will be hidden as well.
#### 1/11/2023
* Add "browser" mode and "player" mode. Player mode is useful for using device's internal players, while browser mode works most of the time.
* Add Oculus browser detection and special handling of it.
<p>
Finally, if you use "player" mode, you will be happy to use Quest 2 browser to watch Stash, as I am very happy now.
