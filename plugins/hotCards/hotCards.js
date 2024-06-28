(async () => {
  "use strict";

  const userSettings = await csLib.getConfiguration("hotCards", {});
  const TAG_ID = userSettings?.tagId;
  const RATING_THRESHOLD = parseInt(userSettings?.threshold ?? 0);
  const CARDS = {
    gallery: {
      class: "gallery-card",
      data: stash.galleries,
      enabled: userSettings?.galleries,
    },
    image: {
      class: "image-card",
      data: stash.images,
      enabled: userSettings?.images,
    },
    movie: {
      class: "movie-card",
      data: stash.movies,
      enabled: userSettings?.movies,
    },
    performer: {
      class: "performer-card",
      data: stash.performers,
      enabled: userSettings?.performers,
    },
    scene: {
      class: "scene-card",
      data: stash.scenes,
      enabled: userSettings?.scenes,
    },
    studio: {
      class: "studio-card",
      data: stash.studios,
      enabled: userSettings?.studios,
    },
  };
  const isTagBased = TAG_ID?.length;
  const isRatingBased = RATING_THRESHOLD !== 0;
  let backupCards = [];
  let hotCards = [];

  // Mapping of configuration keys to functions
  const hotCardsHandlers = {
    home: handleHomeHotCards,
    galleries: handleGalleriesHotCards,
    images: handleImagesHotCards,
    movies: handleMoviesHotCards,
    performers: handlePerformersHotCards,
    scenes: handleScenesHotCards,
    studios: handleStudiosHotCards,
  };

  // Iterate over the corresponding config to call the appropriate functions
  for (const [key, value] of Object.entries(userSettings)) {
    if (
      value === true &&
      hotCardsHandlers[key] &&
      (isTagBased || isRatingBased)
    ) {
      hotCardsHandlers[key]();
    }
  }

  /**
   * Add hot cards to the home page.
   *
   * Sets up a path listener for the home page, and after a delay,
   * processes each enabled card type to add hot elements.
   */
  function handleHomeHotCards() {
    const pattern = /^\/$/;
    registerPathChangeListener(pattern, () => {
      setTimeout(() => {
        for (const card of Object.values(CARDS))
          if (card.enabled) handleHotCards(card, true);
      }, 3000);
    });
  }

  /**
   * Adds gallery hot cards to specific paths in the application.
   *
   * The supported paths are:
   * - /galleries
   * - /performers/{id}/galleries
   * - /studios/{id}/galleries
   * - /tags/{id}/galleries
   * - /scenes/{id}
   */
  function handleGalleriesHotCards() {
    const pattern =
      /^\/(galleries|(performers|studios|tags)\/\d+\/galleries|scenes\/\d+)$/;
    addHotCards(pattern, CARDS.gallery);
  }

  /**
   * Adds image hot cards to specific paths in the application.
   *
   * The supported paths are:
   * - /images
   * - /performers/{id}/images
   * - /studios/{id}/images
   * - /tags/{id}/images
   * - /galleries/{id}
   */
  function handleImagesHotCards() {
    const pattern =
      /^\/(images|(performers|studios|tags)\/\d+\/images|galleries\/\d+)$/;
    addHotCards(pattern, CARDS.image);
  }

  /**
   * Adds movie hot cards to specific paths in the application.
   *
   * The supported paths are:
   * - /movies
   * - /performers/{id}/movies
   * - /studios/{id}/movies
   * - /tags/{id}/movies
   * - /scenes/{id}
   */
  function handleMoviesHotCards() {
    const pattern =
      /^\/(movies|(performers|studios|tags)\/\d+\/movies|scenes\/\d+)$/;
    addHotCards(pattern, CARDS.movie);
  }

  /**
   * Adds performer hot cards to specific paths in the application.
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
  function handlePerformersHotCards() {
    const pattern =
      /^\/(performers(?:\/\d+\/appearswith)?|(performers|studios|tags)\/\d+\/performers|(scenes|galleries|images)\/\d+)$/;
    addHotCards(pattern, CARDS.performer);
  }

  /**
   * Adds scene hot cards to specific paths in the application.
   *
   * The supported paths are:
   * - /scenes
   * - /performers/{id}/scenes
   * - /studios/{id}/scenes
   * - /tags/{id}/scenes
   * - /movies/{id}
   * - /galleries/{id}
   */
  function handleScenesHotCards() {
    const pattern =
      /^\/(scenes|(performers|studios|tags|movies)\/\d+\/scenes|(movies|galleries)\/\d+)$)/;
    addHotCards(pattern, CARDS.scene);
  }

  /**
   * Adds studio hot cards to specific paths in the application.
   *
   * The supported paths are:
   * - /studios
   * - /studios/{id}/childstudios
   * - /tags/{id}/studios
   */
  function handleStudiosHotCards() {
    const pattern =
      /^\/(studios|(studios\/\d+\/childstudios)|(tags\/\d+\/studios))$/;
    addHotCards(pattern, CARDS.studio);
  }

  function addHotCards(pattern, card) {
    registerPathChangeListener(pattern, () => {
      handleHotCards(card);
    });
  }

  function handleHotCards(card, isHome = false) {
    waitForClass(card.class, () => {
      createAndInsertHotCards(card.data, card.class, isHome);
    });
  }

  /**
   * Wraps cards in "hot" elements based on specific conditions (tag or rating).
   *
   * On the home page, this function may be triggered by multiple intercepted GraphQL requests,
   * each corresponding to a user-customized carousel.
   *
   * The user is able to customize the home page as desired and add
   * several carousels of the same type of resource with different filters saved.
   * As a result, several graphql request are intercepted and this function runs
   * as many times as the user configured carousels.
   *
   * The first time it runs, the hotCards array is populated,
   * so we need an additional flag to differentiate that we are on the home page.
   *
   * @param {Object} stashData - Data fetched from the GraphQL interceptor. e.g. stash.performers.
   * @param {string} cardClass - CSS class used to identify cards in the DOM. e.g. 'performer-card'.
   * @param {boolean} isHome - Flag indicating if the current page is the homepage.
   */
  function createAndInsertHotCards(stashData, cardClass, isHome) {
    // To avoid DOM exceptions, it only runs when `hotCards` is empty and we are not in the home page.
    if (hotCards.length === 0 || isHome) {
      const cards = document.querySelectorAll(`.${cardClass}`);

      cards.forEach((card) => {
        const link = card.querySelector(".thumbnail-section > a");
        const id = new URL(link.href).pathname.split("/").pop();
        const data = stashData[id];

        if (isTagBased) {
          if (data?.tags?.length) {
            data.tags.forEach((tag) => {
              if (tag.id === TAG_ID) createHotElementAndAttachToDOM(card);
            });
          }
        } else if (isRatingBased && data?.rating100 !== null) {
          if (data.rating100 >= RATING_THRESHOLD)
            createHotElementAndAttachToDOM(card);
        }
      });
    }
  }

  function createHotElementAndAttachToDOM(cardElement) {
    const hotElement = createElementFromHTML(`<div class="hot-border">`);

    backupCards.push(cardElement);
    cardElement.classList.add("hot-card");
    cardElement.before(hotElement);
    hotElement.append(cardElement);
    hotCards.push(hotElement);
  }

  function createElementFromHTML(htmlString) {
    const div = document.createElement("div");
    div.innerHTML = htmlString.trim();
    return div.firstChild;
  }

  /**
   * Since it was necessary to insert a div before the card for
   * the border design to be visible (otherwise the overflow:hidden; property of
   * the .card class does not allow it to be seen), this also brought up another problem:
   *
   * "DOMException: Node.removeChild: The node to be removed is not a child of this node".
   *
   * Because of how the internal content of some divs are updated when navigating.
   *
   * This restores the card back to the original DOM structure to prevent that.
   * -
   */
  function restoreCards() {
    backupCards.forEach((backupCard, i) => {
      if (hotCards[i] && hotCards[i].parentNode) {
        hotCards[i].before(backupCard);
        hotCards[i].remove();
      }
    });
    backupCards.length = 0;
    hotCards.length = 0;
  }

  ["pushState", "replaceState"].forEach((method) => {
    const original = history[method];
    history[method] = function () {
      restoreCards();
      return original.apply(this, arguments);
    };
  });
})();
