(async () => {
  "use strict";

  const userSettings = await csLib.getConfiguration("cjCardTweaks", {});
  const SETTINGS = parseSettings(userSettings ?? "");
  const CARD_KEYS = {
    galleries: "gallery",
    images: "image",
    movies: "movie",
    performers: "performer",
    scenes: "scene",
    studios: "studio",
  };

  const CARDS = Object.entries(CARD_KEYS).reduce((acc, [plural, singular]) => {
    acc[singular] = {
      class: `${singular}-card`,
      data: stash[plural],
      isContentCard: ["scene", "gallery", "image"].includes(singular),
    };
    return acc;
  }, {});

  function parseSettings(settings) {
    return Object.keys(settings).reduce((acc, key) => {
      if (
        key === "fileCount" ||
        key === "addBannerDimension" ||
        key === "performerProfileCards" ||
        key === "stashIDIcon"
      ) {
        acc[key] = settings[key];
      } else {
        // does nothing for now
      }
      return acc;
    }, {});
  }

  const FILE_COUNT_STYLE =
    "span.file-count.badge.badge-pill.badge-info{position: absolute;top: 0.3rem;right: 0.5rem;border-radius: 50%;width: 1.7rem;height: 1.7rem;padding: 5px 8px;font-size: 100%;box-shadow: 1px 3px 4px rgba(0, 0, 0, 0.5)}.grid-card:hover .file-count.badge{opacity: 0;transition: opacity 0.5s}";
  const PERFORMER_PROFILE_CARD_STYLE =
    ".performer-card:hover img.performer-card-image{box-shadow: 0 0 0 rgb(0 0 0 / 20%), 0 0 6px rgb(0 0 0 / 90%);transition: box-shadow .5s .5s}@media (min-width: 1691px){.performer-recommendations .card .performer-card-image{height: unset}}button.btn.favorite-button.not-favorite,button.btn.favorite-button.favorite{transition: filter .5s .5s}.performer-card:hover .thumbnail-section button.btn.favorite-button.not-favorite, .performer-card:hover .thumbnail-section button.btn.favorite-button.favorite{filter: drop-shadow(0 0 2px rgba(0, 0, 0, .9))}.performer-card .thumbnail-section button.btn.favorite-button.not-favorite, .performer-card .thumbnail-section button.btn.favorite-button.favorite{top: 10px;filter: drop-shadow(0 2px 2px rgba(0, 0, 0, .9))}.item-list-container .performer-card__age,.recommendation-row .performer-card__age,.item-list-container .performer-card .card-section-title,.recommendation-row .performer-card .card-section-title,.item-list-container .performer-card .thumbnail-section,.recommendation-row .performer-card .thumbnail-section{display: flex;align-content: center;justify-content: center}.item-list-container .performer-card .thumbnail-section a,.recommendation-row .performer-card .thumbnail-section a{display: contents}.item-list-container .performer-card-image,.recommendation-row .performer-card-image{aspect-ratio: 1 / 1;display: flex;object-fit: cover;border: 3px solid var(--plex-yelow);border-radius: 50%;min-width: unset;position: relative;width: 58%;margin: auto;z-index: 1;margin-top: 1.5rem;box-shadow:0 13px 26px rgb(0 0 0 / 20%),0 3px 6px rgb(0 0 0 / 90%);object-position: center;transition: box-shadow .5s .5s}.item-list-container .performer-card hr,.recommendation-row .performer-card hr{width: 90%}.item-list-container .performer-card .fi,.recommendation-row .performer-card .fi{position: absolute;top: 81.5%;left: 69%;border-radius: 50% !important;background-size: cover;margin-left: -1px;height: 1.5rem;width: 1.5rem;z-index: 10;border: solid 2px #252525;box-shadow: unset}.item-list-container .performer-card .card-popovers .btn,.recommendation-row .performer-card .card-popovers .btn{font-size: 0.9rem}";
  const RATING_BANNER_3D_STYLE =
    ".grid-card{overflow:unset}.detail-group .rating-banner-3d,.rating-banner{display:none}.grid-card:hover .rating-banner-3d{opacity:0;transition:opacity .5s}.rating-banner-3d{height:110px;left:-6px;overflow:hidden;position:absolute;top:-6px;width:110px}.rating-banner-3d span{box-shadow:0 5px 4px rgb(0 0 0 / 50%);position:absolute;display:block;width:170px;padding:10px 5px 10px 0;background-color:#ff6a07;color:#fff;font:700 1rem/1 Lato,sans-serif;text-shadow:0 1px 1px rgba(0,0,0,.2);text-transform:uppercase;text-align:center;letter-spacing:1px;right:-20px;top:24px;transform:rotate(-45deg)}.rating-banner-3d::before{top:0;right:0;position:absolute;z-index:-1;content:'';display:block;border:5px solid #a34405;border-top-color:transparent;border-left-color:transparent}.rating-banner-3d::after{bottom:0;left:0;position:absolute;z-index:-1;content:'';display:block;border:5px solid #963e04}";
  const STASH_ID_ICON_STYLE =
    ".stash-id-count{display:inline-flex;align-items:center;flex-direction:row}.stash-id-count-number{display:inline-block;margin-right:0.25rem}.stash-id-icon{display:inline-flex;align-items:center}.stash-id-icon svg{width:0.875rem;height:0.875rem;fill:currentColor;color:#fff}";

  /**
   * Element to inject custom CSS styles.
   */
  const styleElement = document.createElement("style");
  document.head.appendChild(styleElement);

  if (SETTINGS.fileCount) styleElement.innerHTML += FILE_COUNT_STYLE;
  if (SETTINGS.addBannerDimension)
    styleElement.innerHTML += RATING_BANNER_3D_STYLE;
  if (SETTINGS.performerProfileCards)
    styleElement.innerHTML += PERFORMER_PROFILE_CARD_STYLE;
  if (SETTINGS.stashIDIcon)
    styleElement.innerHTML += STASH_ID_ICON_STYLE;

  function createElementFromHTML(htmlString) {
    const div = document.createElement("div");
    div.innerHTML = htmlString.trim();
    return div.firstChild;
  }

  // Mapping of configuration keys to functions
  const cardsHandlers = {
    gallery: handleGalleriesCards,
    image: handleImagesCards,
    movie: handleMoviesCards,
    performer: handlePerformersCards,
    scene: handleScenesCards,
    studio: handleStudiosCards,
  };

  // Handle home cards
  handleHomeHotCards();

  for (const [key, card] of Object.entries(CARDS)) {
    if (cardsHandlers[key]) {
      cardsHandlers[key]();
    }
  }

  /**
   * Add cards on home page.
   */
  function handleHomeHotCards() {
    const pattern = /^(\/)?$/;
    registerPathChangeListener(pattern, () => {
      setTimeout(() => {
        for (const card of Object.values(CARDS)) handleCards(card, true);
      }, 3000);
    });
  }

  /**
   * Handles gallery cards to specific paths in Stash. 
   *
   * The supported paths are:
   * - /galleries
   * - /performers/{id}/galleries
   * - /studios/{id}/galleries
   * - /tags/{id}/galleries
   * - /scenes/{id}
   */
  function handleGalleriesCards() {
    const pattern =
      /^\/(galleries|(performers|studios|tags)\/\d+\/galleries|scenes\/\d+)$/;
    tweakCards(pattern, CARDS.gallery);
  }

  /**
   * Handles image cards to specific paths in Stash.
   *
   * The supported paths are:
   * - /images
   * - /performers/{id}/images
   * - /studios/{id}/images
   * - /tags/{id}/images
   * - /galleries/{id}
   */
  function handleImagesCards() {
    const pattern =
      /^\/(images|(performers|studios|tags)\/\d+\/images|galleries\/\d+)$/;
    tweakCards(pattern, CARDS.image);
  }

  /**
   * Handles movie cards to specific paths in Stash.
   *
   * The supported paths are:
   * - /movies
   * - /performers/{id}/movies
   * - /studios/{id}/movies
   * - /tags/{id}/movies
   * - /scenes/{id}
   */
  function handleMoviesCards() {
    const pattern =
      /^\/(movies|(performers|studios|tags)\/\d+\/movies|scenes\/\d+)$/;
    tweakCards(pattern, CARDS.movie);
  }

  /**
   * Handles performer cards to specific paths in Stash.
   *
   * The supported paths are:
   * - /performers
   * - /performers/{id}/appearswith
   * - /studios/{id}/performers
   * - /tags/{id}/performers
   * - /scenes/{id}
   * - /galleries/{id}
   * - /images/{id}
   */
  function handlePerformersCards() {
    const pattern =
      /^\/(performers(?:\/\d+\/appearswith)?|(performers|studios|tags)\/\d+\/performers|(scenes|galleries|images)\/\d+)$/;
    tweakCards(pattern, CARDS.performer);
  }

  /**
   * Handles scene cards to specific paths in Stash.
   *
   * The supported paths are:
   * - /scenes
   * - /performers/{id}/scenes
   * - /studios/{id}/scenes
   * - /tags/{id}/scenes
   * - /movies/{id}
   * - /galleries/{id}
   */
  function handleScenesCards() {
    const pattern =
      /^\/(scenes|(performers|studios|tags|movies)\/\d+\/scenes|(movies|galleries)\/\d+)$/;
    tweakCards(pattern, CARDS.scene);
  }

  /**
   * Handles studio cards to specific paths in Stash.
   *
   * The supported paths are:
   * - /studios
   * - /studios/{id}/childstudios
   * - /tags/{id}/studios
   */
  function handleStudiosCards() {
    const pattern =
      /^\/(studios|(studios\/\d+\/childstudios)|(tags\/\d+\/studios))$/;
    tweakCards(pattern, CARDS.studio);
  }

  function tweakCards(pattern, card) {
    registerPathChangeListener(pattern, () => {
      handleCards(card);
    });
  }

  function handleCards(card, isHome = false) {
    waitForClass(card.class, () => {
      executeTweaks(card.data, card.class, card.isContentCard);
    });
  }

  function executeTweaks(stashData, cardClass, isContentCard) {
    const cards = document.querySelectorAll(`.${cardClass}`);

    cards.forEach((card) => {
      maybeAddFileCount(card, stashData, isContentCard);
      maybeAddDimensionToBanner(card);
      if (cardClass === "performer-card") {
        maybeAddStashIDIcon(card, stashData);
        
        // Also set up a MutationObserver to watch for card-popovers being added
        if (SETTINGS.stashIDIcon && !card.querySelector(".stash-id-count")) {
          const observer = new MutationObserver((mutations) => {
            const cardPopovers = card.querySelector(".card-popovers.btn-group") || 
                                 card.querySelector(".card-popovers") ||
                                 card.querySelector('[role="group"].btn-group');
            if (cardPopovers && !cardPopovers.querySelector(".stash-id-count")) {
              const link = card.querySelector(".thumbnail-section > a");
              if (link) {
                const id = new URL(link.href).pathname.split("/").pop();
                const idNum = parseInt(id, 10);
                // Query GraphQL for stash IDs
                queryStashIDs(card, id, idNum);
                observer.disconnect();
              }
            }
          });
          
          observer.observe(card, {
            childList: true,
            subtree: true
          });
          
          // Disconnect after 5 seconds to avoid memory leaks
          setTimeout(() => observer.disconnect(), 5000);
        }
      }
    });
  }

  /**
   * Add badge with file count on cards with more than 1 associated file
   *
   * @param {Element} card - Card element cards list.
   * @param {Object} stashData - Data fetched from the GraphQL interceptor. e.g. stash.performers.
   * @param {boolean} isContentCard - Flag indicating if card is a content card.
   */
  function maybeAddFileCount(card, stashData, isContentCard) {
    if (!SETTINGS.fileCount || !isContentCard) return;

    // verify this function was not run twice on the same card for some strange reason
    const fileCountBadge = card.querySelector(".file-count");
    if (fileCountBadge) return;

    const link = card.querySelector(".thumbnail-section > a");
    const id = new URL(link.href).pathname.split("/").pop();
    const data = stashData[id];

    if (!data || data.files.length <= 1) return;

    const el = createElementFromHTML(
      `<span class="file-count badge badge-pill badge-info">` +
        data?.files.length +
        `</span>`
    );
    link.parentElement.appendChild(el);
  }

  /**
   * Add additional dimention to rating banner
   *
   * @param {Element} card - Card element cards list.
   */
  function maybeAddDimensionToBanner(card) {
    if (!SETTINGS.addBannerDimension) return;

    const oldBanner = card.querySelector(".rating-banner");
    if (!oldBanner) return;

    const link = card.querySelector(".thumbnail-section > a");

    const rating = oldBanner.textContent;
    const color = window.getComputedStyle(oldBanner).backgroundColor;
    const colorClass =
      oldBanner.className.replace("rating-banner", "").trim() + "-3d";

    if (!styleElement.innerHTML.includes(colorClass)) {
      styleElement.innerHTML += `.${colorClass} span {background-color: ${color};}`;
      styleElement.innerHTML += `.rating-banner-3d.${colorClass}:before {border: 5px solid ${color}; filter: brightness(0.9);}`;
      styleElement.innerHTML += `.rating-banner-3d.${colorClass}:after {border: 5px solid ${color}; filter: brightness(0.9);}`;
    }
    const el = createElementFromHTML(
      `<div class="rating-banner-3d ${colorClass}"><span>${rating}</span></div>`
    );
    const span = el.querySelector("span");
    span.style.backgroundColor = color;
    link.parentElement.appendChild(el);
    oldBanner.remove();
  }

  /**
   * Add Stash ID count and icon to performer cards in the card-popovers btn-group
   *
   * @param {Element} card - Card element from cards list.
   * @param {Object} stashData - Data fetched from the GraphQL interceptor. e.g. stash.performers.
   */
  function maybeAddStashIDIcon(card, stashData) {
    if (!SETTINGS.stashIDIcon) return;

    // Verify this function was not run twice on the same card
    const existingCount = card.querySelector(".stash-id-count");
    if (existingCount) return;

    const link = card.querySelector(".thumbnail-section > a");
    if (!link) return;

    const id = new URL(link.href).pathname.split("/").pop();
    const idNum = parseInt(id, 10);
    
    // Query GraphQL for stash IDs
    queryStashIDs(card, id, idNum);
  }

  /**
   * Query GraphQL for performer stash IDs
   * @param {Element} card - Card element
   * @param {string} id - Performer ID as string
   * @param {number} idNum - Performer ID as number
   */
  async function queryStashIDs(card, id, idNum) {
    const query = `
      query FindPerformer($id: ID!) {
        findPerformer(id: $id) {
          id
          stash_ids {
            endpoint
            stash_id
          }
        }
      }
    `;
    
    const variables = {
      id: idNum
    };
    
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          variables: variables
        })
      });
      
      const result = await response.json();
      
      if (result.errors) return;
      
      const performer = result.data?.findPerformer;
      if (!performer) return;
      
      const stashIDs = performer.stash_ids || [];
      const stashIDCount = Array.isArray(stashIDs) ? stashIDs.length : 0;
      
      // Only show if count is greater than 0
      if (stashIDCount > 0) {
        // Find card-popovers and add button
        const cardPopovers = card.querySelector(".card-popovers.btn-group") || 
                            card.querySelector(".card-popovers") ||
                            card.querySelector('[role="group"].btn-group');
        
        if (cardPopovers && !cardPopovers.querySelector(".stash-id-count")) {
          addStashIDButton(cardPopovers, stashIDCount);
        }
      }
    } catch (error) {
      // On error, don't show anything (silent fail)
    }
  }

  /**
   * Helper function to add the stash ID button to the card-popovers
   */
  function addStashIDButton(cardPopovers, stashIDCount) {
    // Check if already added
    if (cardPopovers.querySelector(".stash-id-count")) return;

    // Box-open icon SVG (StashApp logo style - open box)
    const boxIconSVG = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="box-open" class="svg-inline--fa fa-box-open" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M58.9 42.1c3-6.1 9.6-9.6 16.3-8.7L320 64 564.8 33.4c6.7-.8 13.3 2.7 16.3 8.7l41.7 83.4c9 17.9-.6 39.6-19.8 45.1L439.6 217.3c-13.9 4-28.8-1.9-36.2-14.3L320 64 236.6 203c-7.4 12.4-22.3 18.3-36.2 14.3L37.1 170.6c-19.3-5.5-28.8-27.2-19.8-45.1L58.9 42.1zM321.1 128l54.9 91.4c14.9 24.8 44.6 36.6 72.5 28.6L576 211.6v167c0 22-15 41.2-36.4 46.6l-204.1 51c-10.2 2.6-20.9 2.6-31 0l-204.1-51C79 419.7 64 400.5 64 378.5v-167L191.6 248c27.8 8 57.6-3.8 72.5-28.6L318.9 128h2.2z"></path></svg>`;

    // Create a wrapper div similar to the tag-count structure
    const wrapper = document.createElement("div");
    
    // Create button with count FIRST, then icon (as requested)
    const button = createElementFromHTML(
      `<button type="button" class="minimal stash-id-count btn btn-primary" title="Has ${stashIDCount} Stash ID${stashIDCount !== 1 ? 's' : ''}">
        <span class="stash-id-count-number">${stashIDCount}</span>
        <span class="stash-id-icon">${boxIconSVG}</span>
      </button>`
    );
    
    wrapper.appendChild(button);
    cardPopovers.appendChild(wrapper);
  }
})();
