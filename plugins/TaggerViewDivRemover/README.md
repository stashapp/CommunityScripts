# Stash Userscript Tagger View Scene Element DIV Removal Button

This is a userscript for Stash App, that adds a button on each scene element div in tagger view and is made to compliment 7dJx1qP's userscript Stash Batch Save found [here](https://github.com/7dJx1qP/stash-userscripts) (I might just PR and see if this can be added there), because currently, when hitting scrape all, if a particular scene gets missmatched to a wrong scene that is scraped, whilst all other scenes match up, ready for saving. There's no current way until now with 7dJx1qP's Stash Batch Save script, to save all scenes without saving the wrong metadata to the missmatched scene. Now you can just simply press the remove button on that scene and it will delete the DIV element from the DOM so that when save all is pressed, the scene(s) is safe from getting wrong metadata and all others can still be batch saved.

It uses a MutationObserver, to look out for new scene DIVS to add a remove button as they are loaded.

## Usage

Open and copy or load the Javascript into your favourite Userscript Manager, like Tampermonkey or Violent Monkey and change @match to point to the URL of your Stash configuration.

![Tagger Remover](https://github.com/elkorol/Stash-App-Userscript-Tagger-View-Div-Remover/blob/1a9660fe335b4640cba829fbdc8e6efd54e22bf4/images/1.png)