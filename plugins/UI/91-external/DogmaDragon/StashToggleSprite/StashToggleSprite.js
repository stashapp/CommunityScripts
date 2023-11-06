(function() {
    'use strict';
    function createSpriteToggle() {
        const poster = document.querySelector('.vjs-poster')
        const scrubberItem = document.querySelector('.scrubber-item')
        if (!poster || !scrubberItem) return
        if (poster.querySelector('button')) return

        const toggleBtn = document.createElement('button')
        toggleBtn.type = 'button'
        toggleBtn.innerHTML = 'TOGGLE SPRITE'
        toggleBtn.style.padding = '1em'

        const posterUrl = poster.style.backgroundImage
        const spriteUrl = scrubberItem.style.backgroundImage
        const bigPlayBtn = document.querySelector('.vjs-big-play-button')

        let toggle = false
        toggleBtn.addEventListener('click', (e) => {
            // prevent video from playing
            e.stopPropagation()
            // hide/show big play button on toggle
            bigPlayBtn.hidden = !toggle
            // toggle background image
            poster.style.backgroundImage = toggle ? posterUrl : spriteUrl
            toggle = !toggle
        })
        poster.appendChild(toggleBtn)
    }
    stash.addEventListener('page:scene', function () {
        waitForElementClass("scrubber-item", function() {
            createSpriteToggle()
        });
    });
})();