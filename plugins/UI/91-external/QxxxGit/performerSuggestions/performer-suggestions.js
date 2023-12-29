(function() {
    'use strict';

    const Settings = {
        // The methodology for displaying the suggestions.
        // 0 = show performer names only
        // 1 = show performer images only
        // 2 = show both performer images and name badges
        display: 2,

        // The amount of tags randomly selected to find matching performers.
        tagSelectCount: 3,

        // Amount of performers to query from the backend
        performersQueryCount: 25,

        // The amount of performers returned as suggestions
        performerSuggestionMaxCount: 5,

        // Maximum amount of times to query for performers when no matches are found.
        queryRepeat: 3
    };

    // Unique id for the container of suggestions.
    // This is used to prevent duplication of suggestions when changing tabs.
    const suggestionRowId = 'suggestion-row';

    const getPerformerIdFromUrl = () => window.location.pathname.replace('/performers/', '').split('/')[0];

    const queryCurrentPerformerTags = async function() {
        const performerId = getPerformerIdFromUrl();
        const gqlQuery = {
            'query': `query {
                findPerformer(id: ${performerId}) {
                    tags {
                        id
                    }
                }
            }`
        };

        const tags = await stash.callGQL(gqlQuery)
            .then(res => res.data.findPerformer.tags)
        if (!tags) return;

        let tagIds = tags
            .map((tag) => tag.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, Settings.tagSelectCount)

        return tagIds;
    };

    const queryPerformersFromSimilarTags = async function(tags) {
        const performerId = getPerformerIdFromUrl();
        const gqlQuery = {
            'variables': {
                'performerFilter': {
                    'tags': {
                        'value': tags,
                        'modifier': 'INCLUDES_ALL'
                    }
                },
                'filter': {
                    'per_page': Settings.performersQueryCount
                }
            },
            'query': `query findPerformersFromSimilarTags($performerFilter: PerformerFilterType!, $filter: FindFilterType!) {
                findPerformers(performer_filter: $performerFilter, filter: $filter) {
                    performers {
                        id,
                        name,
                        image_path
                       }
                    }
                }`
        };

        const results = await stash.callGQL(gqlQuery);
        if(!results) return;

        let performers = await stash.callGQL(gqlQuery)
            .then(res => res.data.findPerformers.performers)

        if (!performers) return;
        performers = performers
            .filter(item => item.id != performerId)
            .sort(() => 0.5 - Math.random())
        return performers;
    };

    const wrapElementWithAnchor = function(element, performerId) {
        if (!performerId) return

        const anchor = document.createElement('a');
        anchor.innerHTML = element.outerHTML;
        anchor.setAttribute('href', `/performers/${performerId}`);

        return anchor;
    };

    const createPerformerBadge = function(performerName) {
        const performerBadge = document.createElement('span');
        performerBadge.classList.add('tag-item', (Settings.display === 2) ? 'd-block' : null, 'badge', 'secondary-badge');
        performerBadge.innerText = performerName;

        return performerBadge;
    };

    const createPerformerPicture = function(performerImageUrl) {
        const performerPicture = document.createElement('img');
        performerPicture.classList.add('image-thumbnail');
        performerPicture.setAttribute('src', performerImageUrl);

        return performerPicture;
    };

    let currentQueryCount = 1;

    const run = async function() {
        if(currentQueryCount > Settings.queryRepeat) return;

        if(!document.getElementById(suggestionRowId)) {
            const suggestionContainer = document.createElement('div');
            console.log(suggestionContainer)
            suggestionContainer.setAttribute('id', suggestionRowId);
            suggestionContainer.classList.add('pl-0', "detail-item-value");

            const tags = await queryCurrentPerformerTags();
            const performers = await queryPerformersFromSimilarTags(tags);

            let performerCount = 1;
            for(let performer of performers) {
                if(performerCount > Settings.performerSuggestionMaxCount) break;

                switch(Settings.display) {
                    case 0:
                        suggestionContainer.appendChild(
                            wrapElementWithAnchor(
                                createPerformerBadge(performer.name), performer.id));
                        break;
                    case 1:
                        suggestionContainer.appendChild(
                            wrapElementWithAnchor(
                                createPerformerPicture(performer.image_path), performer.id));
                        break;
                    case 2:
                        const performerContainer = document.createElement('div');
                        performerContainer.classList.add('performer-tag-container', 'row');

                        const picture = createPerformerPicture(performer.image_path);
                        const pictureLink = wrapElementWithAnchor(picture, performer.id);
                        pictureLink.classList.add('performer-tag', 'col', 'm-auto', 'zoom-2');

                        performerContainer.appendChild(pictureLink);
                        performerContainer.appendChild(
                            wrapElementWithAnchor(
                                createPerformerBadge(performer.name), performer.id));
                        suggestionContainer.appendChild(performerContainer);
                        break;
                }
                performerCount++;
            }

            if (performers.length) {
                // parent
                const detailsList = document.querySelector('.detail-group');
                // detail item
                const detailItem = document.createElement('div');
                detailItem.classList.add('detail-item');
                // detail title
                const detailTitle = document.createElement('span');
                detailTitle.classList.add('detail-item-title', 'align-top');
                detailTitle.innerText = 'Similar Performers:';
                // add to DOM
                detailsList.appendChild(detailItem);
                detailItem.appendChild(detailTitle);
                // add suggestions as detail value
                detailItem.appendChild(suggestionContainer);
            } else {
                currentQueryCount++;
                await run();
            }
        }
    };

    stash.addEventListener('page:performer', function () {
        waitForElementClass("performer-body", async function() {
            await run();
        });
    });
})();