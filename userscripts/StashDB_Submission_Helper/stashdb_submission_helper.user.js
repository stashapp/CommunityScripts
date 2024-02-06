// ==UserScript==
// @name        StashDB Submission Helper
// @author      halorrr
// @version     0.7
// @description Adds button to add all unmatched aliases, measurements, and urls to a performer.
// @icon        https://raw.githubusercontent.com/stashapp/stash/develop/ui/v2.5/public/favicon.png
// @namespace   https://github.com/halorrr
// @match       https://stashdb.org/drafts/*
// @match       https://stashdb.org/performers/*/edit
// @match       https://stashdb.org/performers/add
// @homepageURL https://github.com/stashapp/CommunityScripts/tree/main/userscripts/StashDB_Submission_Helper
// @downloadURL https://raw.githubusercontent.com/stashapp/CommunityScripts/main/userscripts/StashDB_Submission_Helper/stashdb_submission_helper.user.js
// @updateURL   https://raw.githubusercontent.com/stashapp/CommunityScripts/main/userscripts/StashDB_Submission_Helper/stashdb_submission_helper.user.js
// ==/UserScript==

function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, "value")?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    "value",
  )?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    throw new Error("The given element does not have a value setter");
  }

  const eventName = element instanceof HTMLSelectElement ? "change" : "input";
  element.dispatchEvent(new Event(eventName, { bubbles: true }));
}

function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

const aliasInputSelector = 'label[for="aliases"] + div input';

function unmatchedTargetElement(targetProperty) {
  var targetRegex =
    '//h6/following-sibling::ul/li[b[contains(text(), "' +
    targetProperty +
    '")]]/span/text()';
  var targetElement = document.evaluate(
    targetRegex,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
  return targetElement;
}

function unmatchedTargetValue(targetProperty) {
  var targetElement = unmatchedTargetElement(targetProperty);
  if (targetElement == null) {
    return;
  }
  return targetElement.data;
}

function unmatchedTargetButton(targetProperty) {
  var targetRegex =
    '//h6/following-sibling::ul/li[b[contains(text(), "' +
    targetProperty +
    '")]]';
  var targetElement = document.evaluate(
    targetRegex,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
  return targetElement;
}

function wrapUrlTag(url) {
  return "<a href='" + url + "' target='_blank'>" + url + "</a>";
}

function makeUrlLink(element) {
  const currentUrls = element.data.split(", ");

  const wrappedUrls = currentUrls.map((url) => {
    return wrapUrlTag(url);
  });

  element.parentElement.innerHTML = wrappedUrls.join(", ");
}

function formTab(tabName) {
  const tabRegex =
    '//ul[@role="tablist"]/li/button[contains(text(), "' + tabName + '")]';
  return document.evaluate(
    tabRegex,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
}

function addAlias(alias) {
  alias = alias.trim();
  const existingAliases = Array.from(
    document.querySelectorAll(
      'label[for="aliases"] + div .react-select__multi-value__label',
    ),
  );
  let aliasMatch = existingAliases.find((element) => {
    return element.innerText == alias;
  });
  if (typeof aliasMatch !== "undefined") {
    console.warn(
      "Skipping alias '" +
        alias +
        "' as it is already added to this performer.",
    );
    return;
  }
  const aliasInput = document.querySelector(aliasInputSelector);
  setNativeValue(aliasInput, alias);
  var addButton = document.querySelector(
    'label[for="aliases"] + div .react-select__option',
  );
  formTab("Personal Information").click();
  addButton.click();
}

function existingUrlObjects() {
  const existingUrls = Array.from(
    document.querySelectorAll(".URLInput ul .input-group"),
  );
  const urlObjects = existingUrls.map((urlGroup) => {
    let site = urlGroup.childNodes[1].innerText;
    let url = urlGroup.childNodes[2].innerText;
    let urlObject = {
      site: site,
      url: url,
    };
    return urlObject;
  });
  return urlObjects;
}

function urlSite(url) {
  let site;
  if (
    /(^https?:\/\/(?:www\.)?adultfilmdatabase\.com\/(?:video|studio|actor)\/.+)\??/.test(
      url,
    )
  ) {
    site = "AFDB";
  } else if (/(https?:\/\/www.babepedia.com\/babe\/[^?]+)\??/.test(url)) {
    site = "Babepedia";
  } else if (
    /(^https?:\/\/(?:www\.)?bgafd\.co\.uk\/(?:films|actresses)\/details.php\/id\/[^?]+)\??/.test(
      url,
    )
  ) {
    site = "BGAFD";
  } else if (/(https?:\/\/www.boobpedia.com\/boobs\/[^?]+)\??/.test(url)) {
    site = "Boobpedia";
  } else if (/(https?:\/\/www.data18.com\/[^?]+)\??/.test(url)) {
    site = "DATA18";
  } else if (
    /(^https?:\/\/(?:www\.)?egafd\.com\/(?:films|actresses)\/details.php\/id\/[^?]+)\??/.test(
      url,
    )
  ) {
    site = "EGAFD";
  } else if (
    /(https?:\/\/(www\.)?eurobabeindex.com\/sbandoindex\/.*?.html)/.test(url)
  ) {
    site = "Eurobabeindex";
  } else if (/(^https?:\/\/(?:www.)?facebook\.com\/[^?]+)/.test(url)) {
    site = "Facebook";
  } else if (/(https?:\/\/www.freeones.com\/[^/?]+)\??/.test(url)) {
    site = "FreeOnes";
  } else if (/(https?:\/\/www.iafd.com\/[^?]+)\??/.test(url)) {
    site = "IAFD";
  } else if (
    /(^https?:\/\/(?:www\.)?imdb\.com\/(?:name|title)\/[^?]+)\/?/.test(url)
  ) {
    site = "IMDB";
  } else if (/(https?:\/\/www.indexxx.com\/[^?]+)\??/.test(url)) {
    site = "Indexxx";
  } else if (/(https?:\/\/www.instagram.com\/[^/?]+)\??/.test(url)) {
    site = "Instagram";
  } else if (/(https?:\/\/www.manyvids.com\/[^?]+)\??/.test(url)) {
    site = "ManyVids";
  } else if (
    /(^https?:\/\/(?:www.)?minnano-av\.com\/actress\d+.html)/.test(url)
  ) {
    site = "Minnano-av";
  } else if (/(^https?:\/\/(?:www.)?myspace\.com\/[^?]+)/.test(url)) {
    site = "Myspace";
  } else if (/(https?:\/\/onlyfans.com\/[^?]+)\??/.test(url)) {
    site = "OnlyFans";
  } else if (/(https?:\/\/www.thenude.com\/[^?]+\.htm)/.test(url)) {
    site = "theNude";
  } else if (/(^https?:\/\/(?:www.)?tiktok\.com\/@[^?]+)/.test(url)) {
    site = "TikTok";
  } else if (/(https?:\/\/twitter.com\/[^?]+)\??/.test(url)) {
    site = "Twitter";
  } else if (/(^https?:\/\/(www\.)?wikidata.org\/wiki\/[^?]+)/.test(url)) {
    site = "Wikidata";
  } else if (/(^https?:\/\/(?:\w+\.)?wikipedia\.org\/wiki\/[^?]+)/.test(url)) {
    site = "Wikipedia";
  } else if (/(^https?:\/\/xslist\.org\/en\/model\/\d+\.html)/.test(url)) {
    site = "XsList";
  } else if (
    /(^https?:\/\/(?:www.)?youtube\.com\/(?:c(?:hannel)?|user)\/[^?]+)/.test(
      url,
    )
  ) {
    site = "YouTube";
  } else {
    return;
  }

  return site;
}

function siteMatch(url, selections) {
  const match = Array.from(selections.options).find(
    (option) => option.text == urlSite(url),
  );

  return match;
}

function addUrl(url) {
  const existingUrls = existingUrlObjects();
  let urlMatch = existingUrls.find((element) => {
    return element.url == url;
  });
  if (typeof urlMatch !== "undefined") {
    console.warn(
      "Skipping url '" + url + "' as it is already added to this performer.",
    );
    return;
  }

  const urlForm = document.querySelector("form .URLInput");
  const urlInput = urlForm.querySelector(":scope > .input-group");
  const selections = urlInput.children[1];
  const inputField = urlInput.children[2];
  const addButton = urlInput.children[3];

  const selection = siteMatch(url, selections);
  setNativeValue(selections, selection.value);
  setNativeValue(inputField, url);
  if (addButton.disabled) {
    console.warn("Unable to add url (Add button is disabled)");
  }

  formTab("Links").click();
  addButton.click();
}

function setStyles(element, styles) {
  Object.assign(element.style, styles);
  return element;
}

function baseButtonContainer() {
  const container = document.createElement("span");
  return container;
}

function baseButtonSet(name) {
  const set = document.createElement("a");
  set.innerText = "add " + name;
  set.classList.add("fw-bold");
  setStyles(set, {
    color: "var(--bs-yellow)",
    cursor: "pointer",
    "margin-left": "0.5em",
  });
  return set;
}

function insertButton(action, element, name) {
  const container = baseButtonContainer();
  const set = baseButtonSet(name);
  set.addEventListener("click", action);
  container.append(set);
  element.appendChild(container);
}

function addMeasurements(measurements) {
  const splitMeasurements = measurements.split("-");

  if (splitMeasurements.length > 0) {
    const braSize = splitMeasurements[0].trim();
    const braInput = document.querySelector('input[name="braSize"]');
    setNativeValue(braInput, braSize);
  }

  if (splitMeasurements.length > 1) {
    const waistSize = splitMeasurements[1].trim();
    const waistInput = document.querySelector('input[name="waistSize"]');
    setNativeValue(waistInput, waistSize);
  }

  if (splitMeasurements.length > 2) {
    const hipSize = splitMeasurements[2].trim();
    const hipInput = document.querySelector('input[name="hipSize"]');
    setNativeValue(hipInput, hipSize);
  }

  formTab("Personal Information").click();
}

function createAliasButton(unmatched, element) {
  const addAliases = () => unmatched.forEach(addAlias);
  insertButton(addAliases, element, "aliases");
}

function createMeasurementsButton(unmatched, element) {
  const insertMeasurements = () => addMeasurements(unmatched);
  insertButton(insertMeasurements, element, "measurements");
}

function createUrlsButton(unmatched, element) {
  const addUrls = () => unmatched.forEach(addUrl);
  insertButton(addUrls, element, "urls");
}

function isValidMeasurements(measurements) {
  const measurementsRegex = /(\d\d\w?\w?\w?\s?)(-\s?\d\d\s?)?(-\s?\d\d)?/;
  const isValid = measurementsRegex.test(measurements);
  if (!isValid) {
    console.warn(
      "Measurement format '" +
        measurements +
        "' is invalid and cannot be automatically added.",
    );
  }
  return measurementsRegex.test(measurements);
}

function addAliasInputContainer() {
  const performerForm = document.querySelector(".PerformerForm");
  const aliasContainer = document.createElement("div");
  aliasContainer.innerHTML = '<button id="aliasButton">Add Aliases</button>';
  aliasContainer.setAttribute("id", "aliasContainer");
  performerForm.prepend(aliasContainer);

  const aliasButton = document.createElement("input");
  aliasButton.innerText = "Add Aliases";
  aliasButton.setAttribute("id", "aliasButton");
  aliasButton.setAttribute("style", "border-radius: 0.25rem;");

  const aliasField = document.createElement("input");
  aliasField.setAttribute("id", "aliasField");
  aliasField.setAttribute("placeholder", " Comma separated aliases");
  aliasField.setAttribute("size", "50px");
  aliasField.setAttribute(
    "style",
    "border-radius: 0.25rem; margin-right: 0.5rem;",
  );

  document.getElementById("aliasContainer").prepend(aliasField);
  const enteredAliases = document.getElementById("aliasField").value;

  document
    .getElementById("aliasButton")
    .addEventListener("click", function handleClick(event) {
      event.preventDefault();
      const aliasField = document.getElementById("aliasField");
      if (aliasField.value != "") {
        aliasField.value.split(/,|\/|\sor\s/).forEach(addAlias);
        aliasField.value = "";
      }
    });
}

function performerEditPage() {
  const aliasValues = unmatchedTargetValue("Aliases");
  if (aliasValues != null) {
    const unmatchedAliases = aliasValues.split(/,|\/|\sor\s/);
    const aliasElement = unmatchedTargetButton("Aliases");
    createAliasButton(unmatchedAliases, aliasElement);
  }

  const urlsValues = unmatchedTargetValue("URLs");
  if (urlsValues != null) {
    const unmatchedUrls = urlsValues.split(", ");
    if (unmatchedUrls) {
      const umatchedUrlsElement = unmatchedTargetElement("URLs");
      makeUrlLink(umatchedUrlsElement);
    }
    const urlsElement = unmatchedTargetButton("URLs");
    createUrlsButton(unmatchedUrls, urlsElement);
  }

  const unmatchedMeasurements = unmatchedTargetValue("Measurements");
  if (unmatchedMeasurements != null) {
    if (isValidMeasurements(unmatchedMeasurements)) {
      const measurementsElement = unmatchedTargetButton("Measurements");
      createMeasurementsButton(unmatchedMeasurements, measurementsElement);
    }
  }

  addAliasInputContainer();
}

function sceneEditPage() {
  return;
}

function pageType() {
  return document
    .querySelector(".NarrowPage form")
    .className.replace("Form", "");
}

waitForElm(aliasInputSelector).then(() => {
  if (pageType() == "Performer") {
    performerEditPage();
  } else if (pageType() == "Scene") {
    sceneEditPage();
  } else {
    return;
  }
});
