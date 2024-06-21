// ==UserScript==
// @name        FansDB Submission Helper
// @author      mmenanno, DogmaDragon
// @version     0.7
// @description Adds button to add all unmatched aliases, measurements, and urls to a performer.
// @icon        https://raw.githubusercontent.com/FansDB/docs/main/docs/assets/images/favicon.png
// @namespace   FansDB-Submission-Helper
// @match       https://fansdb.cc/drafts/*
// @match       https://fansdb.cc/performers/*/edit
// @match       https://fansdb.cc/performers/add
// @homepageURL https://github.com/stashapp/CommunityScripts/tree/main/userscripts/FansDB_Submission_Helper
// @downloadURL https://raw.githubusercontent.com/stashapp/CommunityScripts/main/userscripts/FansDB_Submission_Helper/fansdb_submission_helper.user.js
// @updateURL   https://raw.githubusercontent.com/stashapp/CommunityScripts/main/userscripts/FansDB_Submission_Helper/fansdb_submission_helper.user.js
// ==/UserScript==

function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, "value")?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      "value"
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
      null
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
      null
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
      null
    ).singleNodeValue;
  }
  
  function addAlias(alias) {
    alias = alias.trim();
    const existingAliases = Array.from(
      document.querySelectorAll(
        'label[for="aliases"] + div .react-select__multi-value__label'
      )
    );
    let aliasMatch = existingAliases.find((element) => {
      return element.innerText == alias;
    });
    if (typeof aliasMatch !== "undefined") {
      console.warn(
        "Skipping alias '" + alias + "' as it is already added to this performer."
      );
      return;
    }
    const aliasInput = document.querySelector(aliasInputSelector);
    setNativeValue(aliasInput, alias);
    var addButton = document.querySelector(
      'label[for="aliases"] + div .react-select__option'
    );
    formTab("Personal Information").click();
    addButton.click();
  }
  
  function existingUrlObjects() {
    const existingUrls = Array.from(
      document.querySelectorAll(".URLInput ul .input-group")
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
    if (/(^https?:\/\/(?:www.)?addfriends\.com\/[^?]+)/.test(url)) {
      site = "+AddFriends";
    } else if (/(^https?:\/\/(?:www.)?4based\.com\/[^?]+)/.test(url)) {
      site = "4based";
    } else if (/(^https?:\/\/(?:www.)?4my\.fans\/[^?]+)/.test(url)) {
      site = "4MyFans";
    } else if (/(^https?:\/\/(?:www.)?admireme\.vip\/[^?]+)/.test(url)) {
      site = "AdmireMe";
    } else if (/(^https?:\/\/(?:www.)?allmylinks\.com\/[^?]+)/.test(url)) {
      site = "AllMyLinks";
    } else if (/(^https?:\/\/(?:www.)?alua\.com\/[^?]+)/.test(url)) {
      site = "Alua";
    } else if (/(^https?:\/\/(?:www.)?apclips\.com\/[^?]+)/.test(url)) {
      site = "APClips";
    } else if (/(^https?:\/\/(?:www.)?beacons\.ai\/[^?]+)/.test(url)) {
      site = "Beacons";
    } else if (/(^https?:\/\/(?:www.)?bestfans\.com\/[^?]+)/.test(url)) {
      site = "BestFans";
    } else if (/(^https?:\/\/(?:www.)?bsky\.app\/[^?]+)/.test(url)) {
      site = "Bluesky";
    } else if (/(^https?:\/\/(?:www.)?bongacams\.com\/[^?]+)/.test(url)) {
      site = "BongaCams";
    } else if (/(^https?:\/\/(?:www.)?campsite\.bio\/[^?]+)/.test(url)) {
      site = "Campsite";
    } else if (/(^https?:\/\/(?:www.)?camsoda\.com\/[^?]+)/.test(url)) {
      site = "CamSoda";
    } else if (/(^https?:\/\/(?:www.)?chaturbate\.com\/[^?]+)/.test(url)) {
      site = "Chaturbate";
    } else if (/(^https?:\/\/(?:www.)?cosoc\.com\/[^?]+)/.test(url)) {
      site = "Compiled";
    } else if (/(^https?:\/\/(?:www.)?f2f\.com\/[^?]+)/.test(url)) {
      site = "F2F";
    } else if (/(^https?:\/\/(?:www.)?facebook\.com\/[^?]+)/.test(url)) {
      site = "Facebook";
    } else if (/(^https?:\/\/(?:www.)?fanberry\.com\/[^?]+)/.test(url)) {
      site = "Fanberry";
    } else if (/(^https?:\/\/(?:www.)?fancentro\.com\/[^?]+)/.test(url)) {
      site = "Fancentro";
    } else if (/(^https?:\/\/(?:www.)?fanfever\.com\/[^?]+)/.test(url)) {
      site = "FanFever";
    } else if (/(^https?:\/\/(?:www.)?fanplace\.com\/[^?]+)/.test(url)) {
      site = "Fanplace";
    } else if (/(^https?:\/\/(?:www.)?fanseven\.com\/[^?]+)/.test(url)) {
      site = "fanseven";
    } else if (/(^https?:\/\/(?:www.)?fansly\.com\/[^?]+)/.test(url)) {
      site = "Fansly";
    } else if (/(^https?:\/\/(?:www.)?fansoda\.com\/[^?]+)/.test(url)) {
      site = "Fansoda";
    } else if (/(^https?:\/\/(?:www.)?fantia\.jp\/[^?]+)/.test(url)) {
      site = "Fantia";
    } else if (/(^https?:\/\/(?:www.)?adult\.contents\.fc2\.com\/[^?]+)/.test(url)) {
      site = "FC2";
    } else if (/(^https?:\/\/(?:www.)?findrow\.com\/[^?]+)/.test(url)) {
      site = "Findrow";
    } else if (/(^https?:\/\/(?:www.)?flow\.page\/[^?]+)/.test(url)) {
      site = "Flowpage";
    } else if (/(^https?:\/\/(?:www.)?frisk\.chat\/[^?]+)/.test(url)) {
      site = "Frisk";
    } else if (/(^https?:\/\/(?:www.)?gayeroticvideoindex\.com\/[^?]+)/.test(url)) {
      site = "GEVI";
    } else if (/(^https?:\/\/(?:www.)?honeydrip\.com\/[^?]+)/.test(url)) {
      site = "HoneyDrip";
    } else if (/(^https?:\/\/(?:www.)?hoo\.be\/[^?]+)/.test(url)) {
      site = "Hoo";
    } else if (/(^https?:\/\/(?:www.)?hubzter\.com\/[^?]+)/.test(url)) {
      site = "Hubzter";
    } else if (/(^https?:\/\/(?:www.)?iafd\.com\/[^?]+)/.test(url)) {
      site = "IAFD";
    } else if (/(^https?:\/\/(?:www.)?instagram\.com\/[^?]+)/.test(url)) {
      site = "Instagram";
    } else if (/(^https?:\/\/(?:www.)?justfor\.fans\/[^?]+)/.test(url)) {
      site = "JustForFans";
    } else if (/(^https?:\/\/(?:www.)?jvid\.com\/[^?]+)/.test(url)) {
      site = "JVID";
    } else if (/(^https?:\/\/(?:www.)?kick\.com\/[^?]+)/.test(url)) {
      site = "Kick";
    } else if (/(^https?:\/\/(?:www.)?lemmynsfw\.com\/[^?]+)/.test(url)) {
      site = "LemmyNSFW";
    } else if (/(^https?:\/\/(?:www.)?linkgenie\.net\/[^?]+)/.test(url)) {
      site = "LinkGenie";
    } else if (/(^https?:\/\/(?:www.)?link\.me\/[^?]+)/.test(url)) {
      site = "Linkme";
    } else if (/(^https?:\/\/(?:www.)?linkr\.bio\/[^?]+)/.test(url)) {
      site = "Linkr";
    } else if (/(^https?:\/\/(?:www.)?linktr\.ee\/[^?]+)/.test(url)) {
      site = "Linktree";
    } else if (/(^https?:\/\/(?:www.)?lnk\.bio\/[^?]+)/.test(url)) {
      site = "LnkBio";
    } else if (/(^https?:\/\/(?:www.)?loverfans\.com\/[^?]+)/.test(url)) {
      site = "Loverfans";
    } else if (/(^https?:\/\/(?:www.)?loyalfans\.com\/[^?]+)/.test(url)) {
      site = "LoyalFans";
    } else if (/(^https?:\/\/(?:www.)?magic\.ly\/[^?]+)/.test(url)) {
      site = "Magicly";
    } else if (/(^https?:\/\/(?:www.)?many\.bio\/[^?]+)/.test(url)) {
      site = "Many";
    } else if (/(^https?:\/\/(?:www.)?manyvids\.com\/[^?]+)/.test(url)) {
      site = "ManyVids";
    } else if (/(^https?:\/\/(?:www.)?memberme\.net\/[^?]+)/.test(url)) {
      site = "MemberMe";
    } else if (/(^https?:\/\/(?:www.)?(?:profiles|share)\.myfreecams\.com\/[^?]+)/.test(url)) {
      site = "MFC Share";
    } else if (/(^https?:\/\/(?:www.)?modelmayhem\.com\/[^?]+)/.test(url)) {
      site = "Model Mayhem";
    } else if (/(^https?:\/\/(?:www.)?(?:.+)\.modelcentro\.com)/.test(url)) {
      site = "ModelCentro";
    } else if (/(^https?:\/\/(?:www.)?modelhub\.com\/[^?]+)/.test(url)) {
      site = "Modelhub";
    } else if (/(^https?:\/\/(?:www.)?my\.club\/[^?]+)/.test(url)) {
      site = "MyClub";
    } else if (/(^https?:\/\/(?:www.)?mydirtyhobby\.(?:com|de)\/[^?]+)/.test(url)) {
      site = "MyDirtyHobby";
    } else if (/(^https?:\/\/(?:www.)?mym\.fans\/[^?]+)/.test(url)) {
      site = "MYM";
    } else if (/(^https?:\/\/(?:www.)?onlyfans\.com\/[^?]+)/.test(url)) {
      site = "OnlyFans";
    } else if (/(^https?:\/\/(?:www.)?patreon\.com\/[^?]+)/.test(url)) {
      site = "Patreon";
    } else if (/(^https?:\/\/(?:www.)?legacy\.peach\.com\/[^?]+)/.test(url)) {
      site = "Peach (legacy)";
    } else if (/(^https?:\/\/(?:www.)?pornhub\.com\/[^?]+)/.test(url)) {
      site = "Pornhub";
    } else if (/(^https?:\/\/(?:www.)?privacy\.com\.br\/[^?]+)/.test(url)) {
      site = "Privacy";
    } else if (/(^https?:\/\/(?:www.)?reddit\.com\/[^?]+)/.test(url)) {
      site = "Reddit";
    } else if (/(^https?:\/\/(?:www.)?redgifs\.com\/[^?]+)/.test(url)) {
      site = "RedGIFs";
    } else if (/(^https?:\/\/(?:www.)?rumble\.com\/[^?]+)/.test(url)) {
      site = "Rumble";
    } else if (/(^https?:\/\/(?:www.)?sheer\.com\/[^?]+)/.test(url)) {
      site = "Sheer";
    } else if (/(^https?:\/\/(?:www.)?myslink\.app\/[^?]+)/.test(url)) {
      site = "Slink";
    } else if (/(^https?:\/\/(?:www.)?slushy\.com\/[^?]+)/.test(url)) {
      site = "Slushy";
    } else if (/(^https?:\/\/(?:www.)?snapchat\.com\/[^?]+)/.test(url)) {
      site = "Snapchat";
    } else if (/(^https?:\/\/(?:www.)?snipfeed\.co\/[^?]+)/.test(url)) {
      site = "Snipfeed";
    } else if (/(^https?:\/\/(?:www.)?socprofile\.com\/[^?]+)/.test(url)) {
      site = "SocProfile";
    } else if (/(^https:\/\/stashdb\.org\/performers\/[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/.test(url)) {
      site = "StashDB";
    } else if (/(^https?:\/\/(?:www.)?swag\.live\/[^?]+)/.test(url)) {
      site = "SWAG";
    } else if (/(^https?:\/\/(?:www.)?stripchat\.com\/[^?]+)/.test(url)) {
      site = "Stripchat";
    } else if (/(^https?:\/\/(?:www.)?swame\.com\/[^?]+)/.test(url)) {
      site = "Swame";
    } else if (/(^https?:\/\/(?:www.)?tempted\.com\/[^?]+)/.test(url)) {
      site = "Tempted";
    } else if (/(^https?:\/\/(?:www.)?theporndb\.net\/[^?]+)/.test(url)) {
      site = "ThePornDB";
    } else if (/(^https?:\/\/(?:www.)?threads\.net\/[^?]+)/.test(url)) {
      site = "Threads";
    } else if (/(^https?:\/\/(?:www.)?tiktok\.com\/[^?]+)/.test(url)) {
      site = "TikTok";
    } else if (/(^https?:\/\/(?:www.)?tumblr\.com\/[^?]+)/.test(url)) {
      site = "Tumblr";
    } else if (/(^https?:\/\/(?:www.)?twitch\.tv\/[^?]+)/.test(url)) {
      site = "Twitch";
    } else if (/(^https?:\/\/(?:www.)?(?:twitter|x)\.com\/[^?]+)/.test(url)) {
      site = "Twitter";
    } else if (/(^https?:\/\/(?:www.)?unlockedxx\.com\/[^?]+)/.test(url)) {
      site = "UnlockedXX";
    } else if (/(^https?:\/\/(?:www.)?uviu\.com\/[^?]+)/.test(url)) {
      site = "UVIU";
    } else if (/(^https?:\/\/(?:www.)?visit-x\.net\/[^?]+)/.test(url)) {
      site = "VISIT-X";
    } else if (/(^https?:\/\/(?:www.)?xvideos\.com\/[^?]+)/.test(url)) {
      site = "XVideos";
    } else if (/(^https?:\/\/(?:www.)?xxxclusive\.com\/[^?]+)/.test(url)) {
      site = "XXXCLUSIVE";
    } else if (/(^https?:\/\/(?:www.)?youtube\.com\/[^?]+)/.test(url)) {
      site = "YouTube";
    }
  
  else {
      return;
    }
  
    return site;
  }
  
  function siteMatch(url, selections) {
    const match = Array.from(selections.options).find(
      (option) => option.text == urlSite(url)
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
        "Skipping url '" + url + "' as it is already added to this performer."
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
          "' is invalid and cannot be automatically added."
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
      "border-radius: 0.25rem; margin-right: 0.5rem;"
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
  