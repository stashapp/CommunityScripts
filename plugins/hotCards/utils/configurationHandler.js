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
const CARD_KEYS = {
  galleries: "gallery",
  images: "image",
  groups: "group",
  performers: "performer",
  scenes: "scene",
  studios: "studio",
};

let previousPathname = window.location.pathname;

async function getUserSettings() {
  const userSettings = await csLib.getConfiguration("hotCards", {});
  return parseSettings(userSettings ?? "");
}

function parseSettings(settings) {
  return Object.keys(settings).reduce((acc, key) => {
    if (key === "threshold" || key === "tagId" || key === "home") {
      acc[key] = settings[key];
    } else {
      acc[key] = parseField(settings[key]);
    }
    return acc;
  }, {});
}

function parseField(input) {
  const segments = input.toString().split(SEPARATOR);

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

async function setConfiguration() {
  const settings = await getUserSettings();
  const { tagId, threshold } = settings;
  const ratingThreshold = parseInt(threshold ?? 0);
  const isTagBased = tagId?.length;
  const isRatingBased = ratingThreshold !== 0;

  hotCardClasses.length = 0;
  Object.assign(CONFIG, {
    settings,
    tagId,
    ratingThreshold,
    is: {
      tagBased: isTagBased,
      ratingBased: isRatingBased,
      tagOrRatingBased: isTagBased || isRatingBased,
    },
  });
  Object.assign(CARDS, getCards(settings));
}

function getCards(settings) {
  return Object.entries(CARD_KEYS).reduce((acc, [plural, singular]) => {
    acc[singular] = {
      type: singular,
      class: `${singular}-card`,
      config: settings[plural] || "",
      data: stash[plural],
      enabled: settings[plural]?.criterion !== CRITERIA.disabled,
    };
    return acc;
  }, {});
}

/** Refresh configuration if previous page is /settings */
async function checkConfigurationRefresh() {
  const pattern = /^\/settings$/;
  const currentPathname = window.location.pathname;
  const previousPathnameIsSettings = pattern.test(previousPathname);
  const currentPathnameIsSettings = pattern.test(currentPathname);

  if (previousPathnameIsSettings && !currentPathnameIsSettings)
    await setConfiguration();

  previousPathname = currentPathname;
}
