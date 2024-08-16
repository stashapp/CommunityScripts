(async () => {
  "use strict";

  const userSettings = await csLib.getConfiguration("hotCards", {});
  const SEPARATOR = "_";
  const INNER_SEPARATOR = ",";
  const INNER_SEGMENT_SEPARATOR = "/";
  const DEFAULTS = {
    criterion: "",
    value: [""],
    style: ["default"],
    gradient_opts: {
      type: "linear",
      angle: "0deg",
      animation: "",
    },
    hover_opts: {
      color: "transparent",
      animation: "",
    },
    card_opts: {
      fill: true,
      opacity: 80,
      animate: false,
    },
  };
  const CRITERIA = { tag: "t", rating: "r", disabled: "d" };
  const SETTINGS = parseSettings(userSettings ?? "");
  const TAG_ID = SETTINGS.tagId;
  const RATING_THRESHOLD = parseInt(SETTINGS.threshold ?? 0);
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
      config: SETTINGS[plural] || "",
      data: stash[plural],
      enabled: SETTINGS[plural]?.criterion !== CRITERIA.disabled,
    };
    return acc;
  }, {});

  /**
   * Custom CSS style presets for hot cards.
   */
  const STYLES = {
    default: getDefaultStylePreset(),
    hot: getHotStylePreset(),
    gold: getGoldStylePreset(),
    holo: getHoloStylePreset(),
  };

  /**
   * Element to inject custom CSS styles.
   */
  const styleElement = document.createElement("style");
  document.head.appendChild(styleElement);

  const isTagBased = TAG_ID?.length;
  const isRatingBased = RATING_THRESHOLD !== 0;
  const isTagOrRatingBased = isTagBased || isRatingBased;
  const isStarsRatingSystem = RATING_THRESHOLD <= 5;

  let backupCards = [];
  let hotCards = [];
  let hotCardClasses = [];

  function parseSettings(settings) {
    return Object.keys(settings).reduce((acc, key) => {
      if (key === "threshold" || key === "tagId" || key === "home") {
        acc[key] = settings[key];
      } else {
        acc[key] = parseCustomFormat(settings[key]);
      }
      return acc;
    }, {});
  }

  function parseCustomFormat(custom) {
    const segments = custom.toString().split(SEPARATOR);

    return {
      criterion: segments[0] || DEFAULTS.criterion,
      value: parseValues(segments[1]) || DEFAULTS.value,
      style: parseValues(segments[2]) || DEFAULTS.style,
      gradient_opts: parseArraySegment(segments[3], DEFAULTS.gradient_opts, [
        "type",
        "angle",
        "animation",
      ]),
      hover_opts: parseArraySegment(segments[4], DEFAULTS.hover_opts, [
        "color",
        "animation",
      ]),
      card_opts: parseArraySegment(segments[5], DEFAULTS.card_opts, [
        "fill",
        "opacity",
        "animate",
      ]),
    };
  }

  function parseArraySegment(segment, defaults, keys) {
    if (!segment) return [defaults];

    const parsedValues = parseValues(segment);

    // If parsedValues is a single array, convert it to an array of arrays
    const segmentsArray = Array.isArray(parsedValues[0])
      ? parsedValues
      : [parsedValues];

    return segmentsArray.map((valuesArray) =>
      keys.reduce((acc, key, index) => {
        acc[key] = valuesArray[index] || defaults[key];
        return acc;
      }, {})
    );
  }

  function parseValues(values) {
    if (typeof values !== "string") return values;

    const parts = values.split(INNER_SEGMENT_SEPARATOR);

    if (parts.length === 1)
      return parts[0].split(INNER_SEPARATOR).map((item) => item.trim());

    return parts.map((part) =>
      part.split(INNER_SEPARATOR).map((item) => item.trim())
    );
  }

  // Mapping of configuration keys to functions
  const hotCardsHandlers = {
    gallery: handleGalleriesHotCards,
    image: handleImagesHotCards,
    movie: handleMoviesHotCards,
    performer: handlePerformersHotCards,
    scene: handleScenesHotCards,
    studio: handleStudiosHotCards,
  };

  // Handle home hot cards separately
  if (SETTINGS.home && isTagOrRatingBased) handleHomeHotCards();

  for (const [key, card] of Object.entries(CARDS)) {
    if (card.enabled && hotCardsHandlers[key] && isTagOrRatingBased) {
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
    let timeoutId;

    overrideHistoryMethods(() => clearTimeout(timeoutId));

    registerPathChangeListener(pattern, () => {
      timeoutId = setTimeout(() => {
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
      /^\/(scenes|(performers|studios|tags|movies)\/\d+\/scenes|(movies|galleries)\/\d+)$/;
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
      createAndInsertHotCards(card.data, card.class, card.config, isHome);
      setHotCardStyling(card);
    });
  }

  /**
   * Wraps cards in "hot" elements based on specific conditions (tag or rating).
   *
   * On the home page, multiple GraphQL requests are intercepted,
   * each corresponding to a premade filter / user saved filter.
   *
   * This function is called for each card type enabled to add hot elements.
   *
   * The first time it runs, the hotCards array is populated,
   * so we need an additional flag to differentiate that we are on the home page.
   *
   * @param {Object} stashData - Data fetched from the GraphQL interceptor. e.g. stash.performers.
   * @param {string} cardClass - CSS class used to identify cards in the DOM. e.g. 'performer-card'.
   * @param {Object} config - User settings for the current card type.
   * @param {boolean} isHome - Flag indicating if the current page is the homepage.
   */
  function createAndInsertHotCards(stashData, cardClass, config, isHome) {
    const { criterion, value, style, card_opts } = config;
    const cards = document.querySelectorAll(`.${cardClass}`);
    const isCriterionTagOrEmpty =
      isTagBased && (criterion === CRITERIA.tag || criterion.length === 0);
    const isCriterionRatingOrEmpty =
      isRatingBased &&
      (criterion === CRITERIA.rating || criterion.length === 0);

    // Skip processing if hotCards are already present and we're not on the home page.
    if (hotCards.length !== 0 && !isHome) return;

    cards.forEach((card) => {
      const link = card.querySelector(".thumbnail-section > a");
      const id = new URL(link.href).pathname.split("/").pop();
      const data = stashData[id];

      if (!data) return;

      const segmentParams = findMatchingValueSegment(
        value,
        data.tags,
        data.rating100,
        isCriterionTagOrEmpty,
        isCriterionRatingOrEmpty,
        style,
        card_opts
      );

      if (segmentParams) {
        const classId = segmentParams.value.join("-").replace(/\./g, "-");
        const hotCardEl = createHotElementAndAttachToDOM(
          card,
          cardClass,
          classId,
          isHome
        );
        checkHoloCardAndAttachToDOM(
          hotCardEl,
          cardClass,
          segmentParams.style,
          segmentParams.cardOptions
        );
      }
    });
  }

  function findMatchingValueSegment(
    value,
    tags,
    rating,
    isCriterionTagOrEmpty,
    isCriterionRatingOrEmpty,
    style,
    cardOptions
  ) {
    for (let i = 0; i < value.length; i++) {
      const segment = value[i];
      const valueNotSet = segment.length === 0;
      const segmentOrValue = Array.isArray(segment) ? segment : value;

      if (
        (isCriterionTagOrEmpty &&
          matchesTagCriterion(tags, segmentOrValue, valueNotSet)) ||
        (isCriterionRatingOrEmpty &&
          matchesRatingCriterion(rating, segmentOrValue, valueNotSet))
      ) {
        const v = segmentOrValue || [""];
        const s = style[i] || style[0];
        const co = cardOptions[i] || cardOptions[0];
        return { value: v, style: s, cardOptions: co };
      }

      if (segmentOrValue === value) break;
    }
    return null;
  }

  function matchesTagCriterion(tags, valueSegment, valueNotSet) {
    if (!tags) return false;

    const tagIds = valueNotSet ? [TAG_ID] : valueSegment;
    return tagIds.every((tag) => tags.some((t) => t.id === tag));
  }

  function matchesRatingCriterion(rating, valueSegment, valueNotSet) {
    if (!rating) return false;

    const parsedRating = isStarsRatingSystem ? rating / 20 : rating;
    const ratingThresholds = valueNotSet ? [RATING_THRESHOLD] : valueSegment;
    return ratingThresholds.length > 1
      ? ratingThresholds.includes(parsedRating.toString())
      : parsedRating >= ratingThresholds[0];
  }

  function createHotElementAndAttachToDOM(
    cardElement,
    className,
    classId,
    isHome
  ) {
    const hotCardClassName = `hot-${className}-${classId}`;
    const hotElement = createElementFromHTML(
      `<div class="hot-card ${hotCardClassName}">`
    );
    if (isHome) hotElement.style.height = "100%";

    backupCards.push(cardElement);
    cardElement.classList.add("hot-border");
    cardElement.before(hotElement);
    hotElement.append(cardElement);
    hotCards.push(hotElement);

    return hotElement;
  }

  function createElementFromHTML(htmlString) {
    const div = document.createElement("div");
    div.innerHTML = htmlString.trim();
    return div.firstChild;
  }

  /**
   * Sets the style of the hot card based on the user's configuration.
   */
  function setHotCardStyling(card) {
    const { value, style, gradient_opts, hover_opts, card_opts } = card.config;
    const hotElement = document.querySelector(".hot-card");
    // Check if the hot card already contains all the necessary classes
    const hotCardContainsAllClasses = hotCardClasses.every((hotCardClass) =>
      hotElement?.classList.contains(hotCardClass)
    );

    if (hotCardClasses.length === 0 || !hotCardContainsAllClasses) {
      const pseudoElementStyles = value.map((segment, index) => {
        const segmentOrValue = Array.isArray(segment) ? segment : value;
        const classId = segmentOrValue.join("-").replace(/\./g, "-");
        const hotCardClass = `.hot-${card.class}-${classId}`;

        // Skip if the hot card class is already present
        if (hotCardClasses.includes(hotCardClass)) return;

        hotCardClasses.push(hotCardClass);
        const currentStyle = Array.isArray(style[index]) ? style[index] : style;
        const gradientOptions = gradient_opts[index] || gradient_opts[0];
        const hoverOptions = hover_opts[index] || hover_opts[0];
        const cardOptions = card_opts[index] || card_opts[0];

        // If there is only a single style, get the single color style
        if (style.length === 1 || style[index].length === 1) {
          return getSingleColorStyle(
            hotCardClass,
            style[index] || style[0],
            gradientOptions,
            hoverOptions,
            cardOptions
          );
        }

        return getCustomGradientStyle(
          hotCardClass,
          currentStyle,
          gradientOptions,
          hoverOptions,
          cardOptions
        );
      });

      // Join pseudo styles to the style element
      styleElement.innerHTML += pseudoElementStyles.join("");
    }
  }

  /**
   * Apply a single color style, which can be a style preset or a fixed color.
   */
  function getSingleColorStyle(
    hotCardClass,
    color,
    gradientOptions,
    hoverOptions,
    cardOptions
  ) {
    return STYLES[color]
      ? getPresetStyle(
          hotCardClass,
          STYLES[color],
          gradientOptions,
          hoverOptions,
          cardOptions
        )
      : /**
         * Get a fixed color style.
         */
        getHotCardPseudoElementString(
          hotCardClass,
          color,
          hoverOptions,
          cardOptions
        );
  }

  /**
   * Apply a style preset.
   */
  function getPresetStyle(
    hotCardClass,
    preset,
    gradientOptions,
    hoverOptions,
    cardOptions
  ) {
    const { gradient, hover, card } = preset;
    const { angle, animation } = gradientOptions;
    const { color: hoverColor, animation: hoverAnimation } = hoverOptions;

    // Update gradient options with preset defaults if not provided
    const updatedGradientOpts = {
      type: gradient.type,
      angle: angle !== DEFAULTS.gradient_opts.angle ? angle : gradient.angle,
      animation: animation || gradient.animation,
    };

    // Update hover options with preset defaults if not provided
    const updatedHoverOpts = {
      color:
        hoverColor !== DEFAULTS.hover_opts.color ? hoverColor : hover.color,
      animation: hoverAnimation || hover.animation,
    };

    // Update card options with preset defaults if not provided
    const updatedCardOpts = {
      fill:
        cardOptions.fill !== DEFAULTS.card_opts.fill
          ? cardOptions.fill
          : card.fill,
      opacity:
        cardOptions.opacity !== DEFAULTS.card_opts.opacity
          ? cardOptions.opacity
          : card.opacity,
      additional: card.additional,
    };

    return getCustomGradientStyle(
      hotCardClass,
      gradient.colors,
      updatedGradientOpts,
      updatedHoverOpts,
      updatedCardOpts
    );
  }

  /**
   * If there are more than one color, it's a custom gradient.
   */
  function getCustomGradientStyle(
    hotCardClass,
    colors,
    gradientOptions,
    hoverOptions,
    cardOptions
  ) {
    const { type, angle, animation } = gradientOptions;
    const gradient = getGradient(type, angle, colors);
    return getHotCardPseudoElementString(
      hotCardClass,
      gradient,
      hoverOptions,
      cardOptions,
      animation
    );
  }

  function getGradient(type, positionAngle = "", colors) {
    const positionAngleStr = positionAngle ? `${positionAngle},` : "";
    if (type === "stacked") return colors.join(", ");
    return `${type}-gradient(${positionAngleStr} ${colors.join(", ")})`;
  }

  function getHotCardPseudoElementString(
    hotCardClass,
    background,
    hoverOptions,
    cardOptions,
    gradientAnimation = "",
    filter = ""
  ) {
    const opacity = getFixedBackgroundOpacity(cardOptions.opacity);
    const fill = /true/i.test(cardOptions.fill);
    const gradientAnimationStr = gradientAnimation
      ? `animation: move ${gradientAnimation};`
      : "";
    const hoverAnimationStr = hoverOptions.animation
      ? `animation: pulse ${hoverOptions.animation};`
      : "";
    const additionalAttrStr = cardOptions.additional
      ? cardOptions.additional
      : "";
    const fillStr = fill ? `background-color: rgba(0, 0, 0, ${opacity});` : "";
    const filterStr = filter ? `filter: ${filter};` : "";

    return `${hotCardClass}::before,
      ${hotCardClass}::after {
        content: "";
        position: absolute;
        top: calc(0.8 * var(--border-width));
        left: calc(0.8 * var(--border-width));
        width: calc(100% + var(--border-width) * -1.5);
        height: calc(100% + var(--border-width) * -1.5);
        border-radius: calc(2 * var(--border-width));
        background: ${background};
        background-size: 300% 300%;
        background-position: 0 50%;
        ${gradientAnimationStr}
        ${additionalAttrStr}
      }
      ${hotCardClass} > .hot-border {
        --hover-color: ${hoverOptions.color};
        ${hoverAnimationStr}
        ${fillStr}
      }
      ${hotCardClass}::after {
        ${filterStr}
      }`;
  }

  function checkHoloCardAndAttachToDOM(
    hotCardEl,
    cardClass,
    style,
    cardOptions
  ) {
    if (STYLES[style] !== STYLES.holo) return;

    const animateCard = /true/i.test(cardOptions.animate);
    const cardClasses = ["image-card", "scene-card", "studio-card"];
    const classInArray = cardClasses.includes(cardClass);
    const isStudioCard = cardClass === "studio-card";
    const isImageOrSceneCard = classInArray && !isStudioCard;
    const classSuffix = isImageOrSceneCard ? "preview-image" : "image";
    const imgClass = `.${cardClass}-${classSuffix}`;
    const targetEl = hotCardEl.querySelector(imgClass);

    if (!targetEl) return;

    const holoEl = createElementFromHTML(`<div class="holo"></div>`);
    const shineEl = createElementFromHTML(`<div class="shine"></div>`);
    const seedX = getRandomInt(100);
    const seedY = getRandomInt(100);

    const calculateAspectRatio = (width, height) => width / height;
    const calculateDegrees = (aspectRatio, degreesOffset) =>
      degreesOffset + Math.atan(aspectRatio) * (180 / Math.PI);
    const setFixedAspectRatio = (el, aspectRatio) => {
      el.style.setProperty("aspect-ratio", aspectRatio.toFixed(3));
    };
    const applyInitialStyles = () => {
      if (isStudioCard) {
        holoEl.style.display = "block";
        shineEl.style.position = "absolute";
        shineEl.style.top = "0px";
        shineEl.style.left = "0px";
      }
      holoEl.style.setProperty("--posx", `${seedX}%`);
      holoEl.style.setProperty("--posy", `${seedY}%`);
    };

    targetEl.classList.add("holo-img");
    targetEl.before(holoEl);
    holoEl.append(targetEl);
    holoEl.append(shineEl);
    applyInitialStyles();

    waitForImageLoad(targetEl, () => {
      const hotBorderEl = hotCardEl.querySelector(".hot-border");

      if (!hotBorderEl) return;

      const studioCardMarginSize = 5;
      const isSceneCard = cardClass === "scene-card";
      const degreesOffset = isStudioCard ? 98 : isSceneCard ? 83 : 97;
      let aspectRatio = 0;
      let degrees = 0;

      // Delay to ensure the resizing of the width for the cardClass element / hotBorderEl has been completed
      setTimeout(() => {
        if (isStudioCard) {
          aspectRatio = calculateAspectRatio(
            hotBorderEl.offsetWidth - studioCardMarginSize,
            hotBorderEl.offsetHeight - studioCardMarginSize
          );
          degrees = Math.floor(calculateDegrees(aspectRatio, degreesOffset));
        } else {
          aspectRatio = calculateAspectRatio(
            hotBorderEl.offsetWidth,
            targetEl.offsetHeight
          );
          degrees = Math.round(calculateDegrees(aspectRatio, degreesOffset));
        }

        holoEl.style.setProperty("--angle", `${degrees}deg`);
        setFixedAspectRatio(shineEl, aspectRatio);
      }, 100);
    });

    if (animateCard) animateHoloCards(holoEl, seedX, seedY);
  }

  function animateHoloCards(holoEl, seedX, seedY) {
    const increment = 0.05;
    let posX = seedX;
    let posY = seedY;
    let add = increment;

    function animate() {
      posX += add;
      posY += add;

      if (posX > 100) add = -increment;
      if (posY > 100) add = -increment;
      if (posX < 0) add = increment;
      if (posY < 0) add = increment;

      holoEl.style.setProperty("--posx", `${posX}%`);
      holoEl.style.setProperty("--posy", `${posY}%`);

      requestAnimationFrame(animate);
    }
    animate();
  }

  function createCardStyle(
    hoverColor,
    hoverAnimation,
    gradientType,
    gradientAngle,
    gradientColors,
    gradientAnimation,
    fill = DEFAULTS.card_opts.fill,
    opacity = DEFAULTS.card_opts.opacity,
    additional,
    filter
  ) {
    return {
      hover: {
        color: hoverColor,
        animation: hoverAnimation,
      },
      gradient: {
        type: gradientType,
        angle: gradientAngle,
        colors: gradientColors,
        animation: gradientAnimation,
      },
      card: {
        fill,
        opacity,
        additional,
      },
      filter,
    };
  }

  function getDefaultStylePreset() {
    return createCardStyle(
      "#ff2409",
      "3s ease-in-out infinite",
      "linear",
      "60deg",
      [
        "hsl(224, 85%, 66%)",
        "hsl(269, 85%, 66%)",
        "hsl(314, 85%, 66%)",
        "hsl(359, 85%, 66%)",
        "hsl(44, 85%, 66%)",
        "hsl(357.2, 87.7%, 52.4%)",
        "hsl(301, 70.2%, 50%)",
        "hsl(179, 85%, 66%)",
      ],
      "4s alternate infinite"
    );
  }

  function getHotStylePreset() {
    return createCardStyle(
      "#a41111",
      "4s ease-in-out infinite",
      "radial",
      "",
      [
        "hsl(351.7, 86.5%, 62.4%)",
        "hsl(351.7, 86.4%, 46.1%)",
        "hsl(357, 86.6%, 49.6%)",
        "hsl(343.3, 73.1%, 39.4%)",
        "hsl(0, 84.9%, 36.5%)",
        "hsl(354.4, 72.9%, 40.6%)",
        "hsl(348.8, 92.9%, 44.1%)",
        "hsl(345, 80%, 49%)",
        "hsl(354.5, 83.1%, 46.5%)",
        "hsl(357, 86.6%, 49.6%)",
        "hsl(328.2, 73.9%, 22.5%)",
        "hsl(345, 81%, 49.4%)",
        "hsl(0, 70%, 31.4%)",
      ],
      "20s linear infinite"
    ); // 'blur(2.0rem)'
  }

  function getGoldStylePreset() {
    return createCardStyle(
      "#d4af37",
      "6s ease-in-out infinite",
      "linear",
      "45deg",
      [
        "hsl(19.9, 62.7%, 52.7%)",
        "hsl(45, 90.4%, 40.8%)",
        "hsl(40.2, 56.5%, 37.8%)",
        "hsl(42.1, 96.5%, 55.1%)",
        "hsl(30.4, 100%, 27.1%)",
        "hsl(30.8, 49.4%, 45.7%)",
        "hsl(20, 85%, 60%)",
        "hsl(14.9, 75.8%, 32.4%)",
      ],
      "8s ease-in-out infinite"
    );
  }

  function getHoloStylePreset() {
    return createCardStyle(
      "#fbe1f6",
      "8s ease-in-out infinite",
      "stacked",
      "133deg",
      [
        "linear-gradient(180deg, #FFB7B7 0%, #727272 100%)",
        "radial-gradient(60.91% 100% at 50% 0%, #FFD1D1 0%, #260000 100%)",
        "linear-gradient(238.72deg, #FDD 0%, #720066 100%)",
        "linear-gradient(127.43deg, #0FF 0%, #F44 100%)",
        "radial-gradient(100.22% 100% at 70.57% 0%, #69e4a5 0%, #00FFE0 100%)",
        "linear-gradient(127.43deg, #B7D500 0%, #30F 100%)",
      ],
      "14s ease-in-out infinite",
      true,
      70,
      "background-blend-mode: screen, overlay, hard-light, color-burn, color-dodge, normal;"
    );
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

  overrideHistoryMethods(restoreCards);
})();
