// ==UserScript==
// @name        FansDB Submission Helper
// @author      mmenanno, DogmaDragon
// @version     0.8.4
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

const urlPatterns = [
  {
    pattern: /(^https?:\/\/(?:www.)?addfriends\.com\/[^?]+)/,
    site: "+AddFriends",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?4based\.com\/[^?]+)/,
    site: "4based",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?4my\.fans\/[^?]+)/,
    site: "4MyFans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?admireme\.vip\/[^?]+)/,
    site: "AdmireMe",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?(?:allmylinks\.com|my\.bio)\/[^?]+)/,
    site: "AllMyLinks",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?alua\.com\/[^?]+)/,
    site: "Alua",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?apclips\.com\/[^?]+)/,
    site: "APClips",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?arsmate\.com\/[^?]+)/,
    site: "Arsmate",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?arousetv.\.vip\/[^?]+)/,
    site: "ArouseTV",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?beacons\.ai\/[^?]+)/,
    site: "Beacons",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?bestfans\.com\/[^?]+)/,
    site: "BestFans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?bsky\.app\/[^?]+)/,
    site: "Bluesky",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?bongacams\.com\/[^?]+)/,
    site: "BongaCams",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?bybio\.co\/[^?]+)/,
    site: "Bybio",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?cam4\.com\/[^?]+)/,
    site: "Cam4",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?cameraprive\.com\/[^?]+)/,
    site: "Camera Prive",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?campsite\.bio\/[^?]+)/,
    site: "Campsite",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?camsoda\.com\/[^?]+)/,
    site: "CamSoda",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?candfans\.jp\/[^?]+)/,
    site: "CandFans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?(?:.+)\.carrd\.to)/,
    site: "Carrd",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?chaturbate\.com\/[^?]+)/,
    site: "Chaturbate",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?clips4sale\.com\/[^?]+)/,
    site: "Clips4Sale",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?cosoc\.com\/[^?]+)/,
    site: "Compiled",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?darkfans\.com\/[^?]+)/,
    site: "Darkfans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?dirtyfans\.com\/[^?]+)/,
    site: "dirtyFans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?eplay\.com\/[^?]+)/,
    site: "ePlay",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?f2f\.com\/[^?]+)/,
    site: "F2F",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?facebook\.com\/[^?]+)/,
    site: "Facebook",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?fanberry\.com\/[^?]+)/,
    site: "Fanberry",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?fancentro\.com\/[^?]+)/,
    site: "Fancentro",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?fanfever\.com\/[^?]+)/,
    site: "FanFever",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?fanplace\.com\/[^?]+)/,
    site: "Fanplace",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?fanseven\.com\/[^?]+)/,
    site: "fanseven",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?fansly\.com\/[^?]+)/,
    site: "Fansly",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?fansoda\.com\/[^?]+)/,
    site: "Fansoda",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?fanspicy\.com\/[^?]+)/,
    site: "Fanspicy",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?fantia\.jp\/[^?]+)/,
    site: "Fantia",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?fanvue\.com\/[^?]+)/,
    site: "Fanvue",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?faphouse\.com\/[^?]+)/,
    site: "FapHouse",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?adult\.contents\.fc2\.com\/[^?]+)/,
    site: "FC2",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?fikfap\.com\/[^?]+)/,
    site: "FikFap",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?findrow\.com\/[^?]+)/,
    site: "Findrow",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?flow\.page\/[^?]+)/,
    site: "Flowpage",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?frisk\.chat\/[^?]+)/,
    site: "Frisk",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?gayeroticvideoindex\.com\/[^?]+)/,
    site: "GEVI",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?glamino\.com\/[^?]+)/,
    site: "Glamino",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?honeydrip\.com\/[^?]+)/,
    site: "HoneyDrip",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?hoo\.be\/[^?]+)/,
    site: "Hoo",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?hubzter\.(?:com|pro)\/[^?]+)/,
    site: "Hubzter",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?iafd\.com\/[^?]+)/,
    site: "IAFD",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?instagram\.com\/[^?]+)/,
    site: "Instagram",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?iwantclips\.com\/[^?]+)/,
    site: "IWantClips",
  },
  {
    pattern:
      /(^https:\/\/javstash\.org\/performers\/[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/,
    site: "JAV Stash",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?justforfans\.app\/[^?]+)/,
    site: "Just for Fans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?justfor\.fans\/[^?]+)/,
    site: "JustForFans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?jvid\.com\/[^?]+)/,
    site: "JVID",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?kick\.com\/[^?]+)/,
    site: "Kick",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?kinkyclips\.com\/[^?]+)/,
    site: "KinkyClips",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?linkin\.bio\/[^?]+)/,
    site: "Later",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?lemmynsfw\.com\/[^?]+)/,
    site: "LemmyNSFW",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?linkgenie\.net\/[^?]+)/,
    site: "LinkGenie",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?link\.me\/[^?]+)/,
    site: "Linkme",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?linkr\.bio\/[^?]+)/,
    site: "Linkr",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?linktr\.ee\/[^?]+)/,
    site: "Linktree",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?lnk\.bio\/[^?]+)/,
    site: "LnkBio",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?loverfans\.com\/[^?]+)/,
    site: "Loverfans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?loyalfans\.com\/[^?]+)/,
    site: "LoyalFans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?magic\.ly\/[^?]+)/,
    site: "Magicly",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?many\.bio\/[^?]+)/,
    site: "ManyBio",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?manyvids\.com\/[^?]+)/,
    site: "ManyVids",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?memberme\.net\/[^?]+)/,
    site: "MemberMe",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?share)\.myfreecams\.com\/[^?]+)/,
    site: "MFC Share",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?msha\.ke\/[^?]+)/,
    site: "Milkshake",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?modelmayhem\.com\/[^?]+)/,
    site: "Model Mayhem",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?(?:.+)\.modelcentro\.com)/,
    site: "ModelCentro",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?modelhub\.com\/[^?]+)/,
    site: "Modelhub",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?my\.club\/[^?]+)/,
    site: "MyClub",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?mydirtyhobby\.(?:com|de)\/[^?]+)/,
    site: "MyDirtyHobby",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?myfans\.jp\/[^?]+)/,
    site: "myfans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?myfreecams\.com\/[^?]+)/,
    site: "MyFreeCams",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?mym\.fans\/[^?]+)/,
    site: "MYM",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?mynx\.co\/[^?]+)/,
    site: "Mynx",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?myurl\.bio\/[^?]+)/,
    site: "myurlbio",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?ohh\.bio\/[^?]+)/,
    site: "Ohh",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?okfans\.com\/[^?]+)/,
    site: "Okfans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?onlyfans\.com\/[^?]+)/,
    site: "OnlyFans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?patreon\.com\/[^?]+)/,
    site: "Patreon",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?legacy\.peach\.com\/[^?]+)/,
    site: "Peach (legacy)",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?playboy\.com\/[^?]+)/,
    site: "Playboy Club",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?pornhub\.com\/[^?]+)/,
    site: "Pornhub",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?privacy\.com\.br\/[^?]+)/,
    site: "Privacy",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?reddit\.com\/[^?]+)/,
    site: "Reddit",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?redgifs\.com\/[^?]+)/,
    site: "RedGIFs",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?reelme\.com\/[^?]+)/,
    site: "ReelMe",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?revealme\.com\/[^?]+)/,
    site: "RevealMe",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?rumble\.com\/[^?]+)/,
    site: "Rumble",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?scatbook\.com\/[^?]+)/,
    site: "Scatbook",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?sextpanther\.com\/[^?]+)/,
    site: "SextPanther",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?sxyvip\.com\.br\/[^?]+)/,
    site: "SexyVip",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?sheer\.com\/[^?]+)/,
    site: "Sheer",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?sinparty\.com\/[^?]+)/,
    site: "SinParty",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?myslink\.app\/[^?]+)/,
    site: "Slink",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?slushy\.com\/[^?]+)/,
    site: "Slushy",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?snapchat\.com\/[^?]+)/,
    site: "Snapchat",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?snipfeed\.co\/[^?]+)/,
    site: "Snipfeed",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?socprofile\.com\/[^?]+)/,
    site: "SocProfile",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?solo\.to\/[^?]+)/,
    site: "solo",
  },
  {
    pattern: /(^https?:\/\/(?:www.)southern\-charms\.com\/[^?]+)/,
    site: "Southern Charms",
  },
  {
    pattern:
      /(^https:\/\/stashdb\.org\/performers\/[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/,
    site: "StashDB",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?stripchat\.com\/[^?]+)/,
    site: "Stripchat",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?sugarfans\.com\/[^?]+)/,
    site: "Sugarfans",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?suicidegirls\.com\/[^?]+)/,
    site: "SuicideGirls",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?swag\.live\/[^?]+)/,
    site: "SWAG",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?swame\.com\/[^?]+)/,
    site: "Swame",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?tempted\.com\/[^?]+)/,
    site: "Tempted",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?theporndb\.net\/[^?]+)/,
    site: "ThePornDB",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?threads\.net\/[^?]+)/,
    site: "Threads",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?tiktok\.com\/[^?]+)/,
    site: "TikTok",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?tolinkme\.com\/[^?]+)/,
    site: "Tolinkme",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?tumblr\.com\/[^?]+)/,
    site: "Tumblr",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?twitch\.tv\/[^?]+)/,
    site: "Twitch",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?(?:twitter|x)\.com\/[^?]+)/,
    site: "Twitter",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?umate\.me\/[^?]+)/,
    site: "Umate",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?unlockedxx\.com\/[^?]+)/,
    site: "UnlockedXX",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?uviu\.com\/[^?]+)/,
    site: "UViU",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?visit-x\.net\/[^?]+)/,
    site: "VISIT-X",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?wetspace\.com\/[^?]+)/,
    site: "WetSpace",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?xhamster\.com\/[^?]+)/,
    site: "xHamster",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?xhamsterlive\.com\/[^?]+)/,
    site: "xHamsterLive",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?xvideos\.com\/[^?]+)/,
    site: "XVideos",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?xxxclusive\.com\/[^?]+)/,
    site: "XXXCLUSIVE",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?xxxfollow\.com\/[^?]+)/,
    site: "XXXfollow",
  },
  {
    pattern: /(^https?:\/\/(?:www.)?youtube\.com\/[^?]+)/,
    site: "YouTube",
  },
];
function urlSite(url) {
  for (const { pattern, site } of urlPatterns) {
    if (pattern.test(url)) {
      return site;
    }
  }

  return;
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

  // Check if the selection is valid
  if (!selection) {
    console.warn(`Skipping URL '${url}' as it does not match any site.`);
    return; // Skip unmatched URL
  }

  setNativeValue(selections, selection.value);
  setNativeValue(inputField, url);
  if (addButton.disabled) {
    console.warn("Unable to add url (Add button is disabled)");
    return; // Exit if the button is disabled
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
