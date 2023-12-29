(function() {
    'use strict';

    const performerDetailsCache = [];
    class PerformerCache {
        constructor(id, details) {
            this.id = id;
            this.details = details;
        }
    }
    
    const addPerformerToCache = (performer) => {
        if (performerDetailsCache.some((p) => p.id === performer?.id)) return;
        const performerCacheObj = new PerformerCache(performer?.id, performer?.details);
        performerDetailsCache.push(performerCacheObj);
    };

    function awaitDisplay () {
        waitForElementClass('performer-card grid-card card', display)
    }

    function display() {
        const cardSections = document.querySelectorAll('.card-section');

        for(const card of cardSections) {
            const link = card?.querySelectorAll('a')[0].href;
            if (!link) continue;

            const userIdFromLink = link.split('/').pop();
            const performer = performerDetailsCache.find((p) => p.id === userIdFromLink);
            const performerId = performer?.id;
            const performerDetails = performer?.details;
            
            if(!performer || !performerDetails) continue;

            const descriptionNode = document.createElement('div');
            // descId to prevent duplicate append
            const descId = `desc-${performerId}`;
            descriptionNode.classList.add('performer-description', 'TruncatedText');
            descriptionNode.setAttribute('id', descId);
            descriptionNode.innerText = performerDetails;

            if (descriptionNode.innerText && !document.getElementById(descId)) {
                card.appendChild(descriptionNode);
            }
        }
    }

    stash.addEventListener('stash:response', function(e) {
        // any GQL queries for performers, including filters, pagination changes, etc.
        const performers = e.detail.data?.findPerformers?.performers;
        if (performers) {
            performers.forEach((p) => addPerformerToCache(p));
        }
    });

    stash.addEventListener('page:studio:performers', () => awaitDisplay());
    stash.addEventListener('page:performers', () => awaitDisplay());
})();
