const stashListener = new EventTarget();

class Logger {
    constructor(enabled) {
        this.enabled = enabled;
    }
    debug() {
        if (!this.enabled) return;
        console.debug(...arguments);
    }
}

class Stash extends EventTarget {
    constructor({
        pageUrlCheckInterval = 1,
        logging = false
    } = {}) {
        super();
        this.log = new Logger(logging);
        this._pageUrlCheckInterval = pageUrlCheckInterval;
        this.fireOnHashChangesToo = true;
        this.pageURLCheckTimer = setInterval(() => {
            // Loop every 500ms
            if (this.lastPathStr !== location.pathname || this.lastQueryStr !== location.search || (this.fireOnHashChangesToo && this.lastHashStr !== location.hash)) {
                this.lastPathStr = location.pathname;
                this.lastQueryStr = location.search;
                this.lastHashStr = location.hash;
                this.gmMain();
            }
        }, this._pageUrlCheckInterval);
        stashListener.addEventListener('response', (evt) => {
            this.processRemoteScenes(evt.detail);
            this.processScene(evt.detail);
            this.processScenes(evt.detail);
            this.processStudios(evt.detail);
            this.processPerformers(evt.detail);
            this.processApiKey(evt.detail);
            this.dispatchEvent(new CustomEvent('stash:response', {
                'detail': evt.detail
            }));
        });
        this.getVersion()
        this.settingsCallbacks = [];
        this.remoteScenes = {};
        this.scenes = {};
        this.studios = {};
        this.performers = {};
    }
    async getVersion() {
        const reqData = {
            "operationName": "",
            "variables": {},
            "query": `query version {
                version {
                    version
                }
            }`
        };
        const data = await this.callGQL(reqData);
        const versionString = data.data.version.version;
        this.version = versionString.substring(1).split('.').map(o => parseInt(o));
    }
    async callGQL(reqData) {
        const options = {
            method: 'POST',
            body: JSON.stringify(reqData),
            headers: {
                'Content-Type': 'application/json'
            }
        }

        try {
            const res = await window.fetch('/graphql', options);
            this.log.debug(res);
            return res.json();
        } catch (err) {
            console.error(err);
        }
    }
    async getFreeOnesStats(link) {
        try {
            const doc = await fetch(link)
                .then(function(response) {
                    // When the page is loaded convert it to text
                    return response.text()
                })
                .then(function(html) {
                    // Initialize the DOM parser
                    var parser = new DOMParser();

                    // Parse the text
                    var doc = parser.parseFromString(html, "text/html");

                    // You can now even select part of that html as you would in the regular DOM
                    // Example:
                    // var docArticle = doc.querySelector('article').innerHTML;

                    console.log(doc);
                    return doc
                })
                .catch(function(err) {
                    console.log('Failed to fetch page: ', err);
                });

            var data = new Object();
            data.rank = doc.querySelector('rank-chart-button');
            console.log(data.rank);
            data.views = doc.querySelector('.d-none.d-m-flex.flex-column.align-items-center.global-header > div.font-weight-bold').textContent;
            data.votes = '0'
            return JSON.stringify(data);
        } catch (err) {
            console.error(err);
        }
    }
    async getStashBoxes() {
        const reqData = {
            "operationName": "Configuration",
            "variables": {},
            "query": `query Configuration {
                        configuration {
                          general {
                            stashBoxes {
                              endpoint
                              api_key
                              name
                            }
                          }
                        }
                      }`
        };
        return this.callGQL(reqData);
    }
    async getApiKey() {
        const reqData = {
            "operationName": "Configuration",
            "variables": {},
            "query": `query Configuration {
                        configuration {
                          general {
                            apiKey
                          }
                        }
                      }`
        };
        return this.callGQL(reqData);
    }
    matchUrl(location, fragment) {
        const regexp = concatRegexp(new RegExp(location.origin), fragment);
        this.log.debug(regexp, location.href.match(regexp));
        return location.href.match(regexp) != null;
    }
    get serverUrl() {
        return window.location.origin;
    }
    isPlugin = () => true;
    gmMain() {
        const location = window.location;
        this.log.debug(URL, window.location);

        // marker wall
        if (this.matchUrl(location, /\/scenes\/markers/)) {
            this.log.debug('[Navigation] Wall-Markers Page');
            this.dispatchEvent(new Event('page:markers'));
        }
        // scene page
        else if (this.matchUrl(location, /\/scenes\/\d+/)) {
            this.log.debug('[Navigation] Scene Page');
            this.dispatchEvent(new Event('page:scene'));
        }
        // scenes wall
        else if (this.matchUrl(location, /\/scenes\?/)) {
            this.processTagger();
            this.dispatchEvent(new Event('page:scenes'));
        }

        // images wall
        if (this.matchUrl(location, /\/images\?/)) {
            this.log.debug('[Navigation] Wall-Images Page');
            this.dispatchEvent(new Event('page:images'));
        }
        // image page
        if (this.matchUrl(location, /\/images\/\d+/)) {
            this.log.debug('[Navigation] Image Page');
            this.dispatchEvent(new Event('page:image'));
        }

        // movie scenes page
        else if (this.matchUrl(location, /\/movies\/\d+\?/)) {
            this.log.debug('[Navigation] Movie Page - Scenes');
            this.processTagger();
            this.dispatchEvent(new Event('page:movie:scenes'));
        }
        // movie page
        else if (this.matchUrl(location, /\/movies\/\d+/)) {
            this.log.debug('[Navigation] Movie Page');
            this.dispatchEvent(new Event('page:movie'));
        }
        // movies wall
        else if (this.matchUrl(location, /\/movies\?/)) {
            this.log.debug('[Navigation] Wall-Movies Page');
            this.dispatchEvent(new Event('page:movies'));
        }

        // galleries wall
        if (this.matchUrl(location, /\/galleries\?/)) {
            this.log.debug('[Navigation] Wall-Galleries Page');
            this.dispatchEvent(new Event('page:galleries'));
        }
        // gallery page
        if (this.matchUrl(location, /\/galleries\/\d+/)) {
            this.log.debug('[Navigation] Gallery Page');
            this.dispatchEvent(new Event('page:gallery'));
        }

        // performer scenes page
        if (this.matchUrl(location, /\/performers\/\d+\?/)) {
            this.log.debug('[Navigation] Performer Page - Scenes');
            this.processTagger();
            this.dispatchEvent(new Event('page:performer:scenes'));
        }
        // performer appearswith page
        if (this.matchUrl(location, /\/performers\/\d+\/appearswith/)) {
            this.log.debug('[Navigation] Performer Page - Appears With');
            this.processTagger();
            this.dispatchEvent(new Event('page:performer:performers'));
        }
        // performer galleries page
        else if (this.matchUrl(location, /\/performers\/\d+\/galleries/)) {
            this.log.debug('[Navigation] Performer Page - Galleries');
            this.dispatchEvent(new Event('page:performer:galleries'));
        }
        // performer movies page
        else if (this.matchUrl(location, /\/performers\/\d+\/movies/)) {
            this.log.debug('[Navigation] Performer Page - Movies');
            this.dispatchEvent(new Event('page:performer:movies'));
        }
        // performer page
        else if (this.matchUrl(location, /\/performers\//)) {
            this.log.debug('[Navigation] Performers Page');
            this.dispatchEvent(new Event('page:performer'));
            this.dispatchEvent(new Event('page:performer:details'));

            waitForElementClass('performer-tabs', (className, targetNode) => {
                const observerOptions = {
                    childList: true
                }
                const observer = new MutationObserver(mutations => {
                    let isPerformerEdit = false;
                    mutations.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.id === 'performer-edit') {
                                isPerformerEdit = true;
                            }
                        });
                    });
                    if (isPerformerEdit) {
                        this.dispatchEvent(new Event('page:performer:edit'));
                    } else {
                        this.dispatchEvent(new Event('page:performer:details'));
                    }
                });
                observer.observe(targetNode[0], observerOptions);
            });
        }
        // performers wall
        else if (this.matchUrl(location, /\/performers\?/)) {
            this.log.debug('[Navigation] Wall-Performers Page');
            this.dispatchEvent(new Event('page:performers'));
        }

        // studio galleries page
        if (this.matchUrl(location, /\/studios\/\d+\/galleries/)) {
            this.log.debug('[Navigation] Studio Page - Galleries');
            this.dispatchEvent(new Event('page:studio:galleries'));
        }
        // studio images page
        else if (this.matchUrl(location, /\/studios\/\d+\/images/)) {
            this.log.debug('[Navigation] Studio Page - Images');
            this.dispatchEvent(new Event('page:studio:images'));
        }
        // studio performers page
        else if (this.matchUrl(location, /\/studios\/\d+\/performers/)) {
            this.log.debug('[Navigation] Studio Page - Performers');
            this.dispatchEvent(new Event('page:studio:performers'));
        }
        // studio movies page
        else if (this.matchUrl(location, /\/studios\/\d+\/movies/)) {
            this.log.debug('[Navigation] Studio Page - Movies');
            this.dispatchEvent(new Event('page:studio:movies'));
        }
        // studio childstudios page
        else if (this.matchUrl(location, /\/studios\/\d+\/childstudios/)) {
            this.log.debug('[Navigation] Studio Page - Child Studios');
            this.dispatchEvent(new Event('page:studio:childstudios'));
        }
        // studio scenes page
        else if (this.matchUrl(location, /\/studios\/\d+\?/)) {
            this.log.debug('[Navigation] Studio Page - Scenes');
            this.processTagger();
            this.dispatchEvent(new Event('page:studio:scenes'));
        }
        // studio page
        else if (this.matchUrl(location, /\/studios\/\d+/)) {
            this.log.debug('[Navigation] Studio Page');
            this.dispatchEvent(new Event('page:studio'));
        }
        // studios wall
        else if (this.matchUrl(location, /\/studios\?/)) {
            this.log.debug('[Navigation] Wall-Studios Page');
            this.dispatchEvent(new Event('page:studios'));
        }

        // tag galleries page
        if (this.matchUrl(location, /\/tags\/\d+\/galleries/)) {
            this.log.debug('[Navigation] Tag Page - Galleries');
            this.dispatchEvent(new Event('page:tag:galleries'));
        }
        // tag images page
        else if (this.matchUrl(location, /\/tags\/\d+\/images/)) {
            this.log.debug('[Navigation] Tag Page - Images');
            this.dispatchEvent(new Event('page:tag:images'));
        }
        // tag markers page
        else if (this.matchUrl(location, /\/tags\/\d+\/markers/)) {
            this.log.debug('[Navigation] Tag Page - Markers');
            this.dispatchEvent(new Event('page:tag:markers'));
        }
        // tag performers page
        else if (this.matchUrl(location, /\/tags\/\d+\/performers/)) {
            this.log.debug('[Navigation] Tag Page - Performers');
            this.dispatchEvent(new Event('page:tag:performers'));
        }
        // tag scenes page
        else if (this.matchUrl(location, /\/tags\/\d+\?/)) {
            this.log.debug('[Navigation] Tag Page - Scenes');
            this.processTagger();
            this.dispatchEvent(new Event('page:tag:scenes'));
        }
        // tag page
        else if (this.matchUrl(location, /\/tags\/\d+/)) {
            this.log.debug('[Navigation] Tag Page');
            this.dispatchEvent(new Event('page:tag'));
        }
        // tags any page
        if (this.matchUrl(location, /\/tags\/\d+/)) {
            this.log.debug('[Navigation] Tag Page - Any');
            this.dispatchEvent(new Event('page:tag:any'));
        }
        // tags wall
        else if (this.matchUrl(location, /\/tags\?/)) {
            this.log.debug('[Navigation] Wall-Tags Page');
            this.dispatchEvent(new Event('page:tags'));
        }

        // settings page tasks tab
        if (this.matchUrl(location, /\/settings\?tab=tasks/)) {
            this.log.debug('[Navigation] Settings Page Tasks Tab');
            this.dispatchEvent(new Event('page:settings:tasks'));
        }
        // settings page system tab
        else if (this.matchUrl(location, /\/settings\?tab=system/)) {
            this.log.debug('[Navigation] Settings Page System Tab');
            this.createSettings();
            this.dispatchEvent(new Event('page:settings:system'));
        }
        // settings page (defaults to tasks tab)
        else if (this.matchUrl(location, /\/settings/)) {
            this.log.debug('[Navigation] Settings Page Tasks Tab');
            this.dispatchEvent(new Event('page:settings:tasks'));
        }

        // stats page
        if (this.matchUrl(location, /\/stats/)) {
            this.log.debug('[Navigation] Stats Page');
            this.dispatchEvent(new Event('page:stats'));
        }
    }
    async getPluginSettings(pluginName) {
        const reqData = {
            "operationName": "Configuration",
            "variables": { "pluginID": pluginName },
            "query": `query ($pluginID: String!) {
                configuration {
                    plugins(include: [$pluginID])
                }
            }`
        };
        const result = await this.callGQL(reqData);
        const settings = result.data.configuration.plugins?.[pluginName]
        return settings
    }
    async updateConfigValue(pluginName, settingName, value) {
        const existingSettings = await getPluginSettings(pluginName);
        existingSettings[settingName] = value;
        const reqData = {
            "operationName": "UpdateConfigValue",
            "variables": {
                "pluginID": pluginName,
                "settings": JSON.stringify(existingSettings)
            },
            "query": `mutation UpdateConfigValue($pluginID: String!, $settings: String!) {
                updateConfigValue(pluginID: $pluginID, settings: $settings)
            }`
        };
        return this.callGQL(reqData);
    }
    async getConfigValue(pluginName, settingName, fallback) {
        const settings = await getPluginSettings(pluginName);
        return settings?.[settingName] ?? fallback;
    }

    processTagger() {
        waitForElementByXpath("//button[text()='Scrape All']", (xpath, el) => {
            this.dispatchEvent(new CustomEvent('tagger', {
                'detail': el
            }));

            const searchItemContainer = document.querySelector('.tagger-container').lastChild;

            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node?.classList?.contains('entity-name') && node.innerText.startsWith('Performer:')) {
                            this.dispatchEvent(new CustomEvent('tagger:mutation:add:remoteperformer', {
                                'detail': {
                                    node,
                                    mutation
                                }
                            }));
                        } else if (node?.classList?.contains('entity-name') && node.innerText.startsWith('Studio:')) {
                            this.dispatchEvent(new CustomEvent('tagger:mutation:add:remotestudio', {
                                'detail': {
                                    node,
                                    mutation
                                }
                            }));
                        } else if (node.tagName === 'SPAN' && node.innerText.startsWith('Matched:')) {
                            this.dispatchEvent(new CustomEvent('tagger:mutation:add:local', {
                                'detail': {
                                    node,
                                    mutation
                                }
                            }));
                        } else if (node.tagName === 'UL') {
                            this.dispatchEvent(new CustomEvent('tagger:mutation:add:container', {
                                'detail': {
                                    node,
                                    mutation
                                }
                            }));
                        } else if (node?.classList?.contains('col-lg-6')) {
                            this.dispatchEvent(new CustomEvent('tagger:mutation:add:subcontainer', {
                                'detail': {
                                    node,
                                    mutation
                                }
                            }));
                        } else if (node.tagName === 'H5') { // scene date
                            this.dispatchEvent(new CustomEvent('tagger:mutation:add:date', {
                                'detail': {
                                    node,
                                    mutation
                                }
                            }));
                        } else if (node.tagName === 'DIV' && node?.classList?.contains('d-flex') && node?.classList?.contains('flex-column')) { // scene stashid, url, details
                            this.dispatchEvent(new CustomEvent('tagger:mutation:add:detailscontainer', {
                                'detail': {
                                    node,
                                    mutation
                                }
                            }));
                        } else {
                            this.dispatchEvent(new CustomEvent('tagger:mutation:add:other', {
                                'detail': {
                                    node,
                                    mutation
                                }
                            }));
                        }
                    });
                });
                this.dispatchEvent(new CustomEvent('tagger:mutations:searchitems', {
                    'detail': mutations
                }));
            });
            observer.observe(searchItemContainer, {
                childList: true,
                subtree: true
            });

            const taggerContainerHeader = document.querySelector('.tagger-container-header');
            const taggerContainerHeaderObserver = new MutationObserver(mutations => {
                this.dispatchEvent(new CustomEvent('tagger:mutations:header', {
                    'detail': mutations
                }));
            });
            taggerContainerHeaderObserver.observe(taggerContainerHeader, {
                childList: true,
                subtree: true
            });

            for (const searchItem of document.querySelectorAll('.search-item')) {
                this.dispatchEvent(new CustomEvent('tagger:searchitem', {
                    'detail': searchItem
                }));
            }

            if (!document.getElementById('progress-bar')) {
                const progressBar = createElementFromHTML(`<div id="progress-bar" class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>`);
                progressBar.classList.add('progress');
                progressBar.style.display = 'none';
                taggerContainerHeader.appendChild(progressBar);
            }
        });
        waitForElementByXpath("//div[@class='tagger-container-header']/div/div[@class='row']/h4[text()='Configuration']", (xpath, el) => {
            this.dispatchEvent(new CustomEvent('tagger:configuration', {
                'detail': el
            }));
        });
    }
    setProgress(value) {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.firstChild.style.width = value + '%';
            progressBar.style.display = (value <= 0 || value > 100) ? 'none' : 'flex';
        }
    }
    processRemoteScenes(data) {
        if (data.data?.scrapeMultiScenes) {
            for (const matchResults of data.data.scrapeMultiScenes) {
                for (const scene of matchResults) {
                    this.remoteScenes[scene.remote_site_id] = scene;
                }
            }
        } else if (data.data?.scrapeSingleScene) {
            for (const scene of data.data.scrapeSingleScene) {
                this.remoteScenes[scene.remote_site_id] = scene;
            }
        }
    }
    processScene(data) {
        if (data.data.findScene) {
            this.scenes[data.data.findScene.id] = data.data.findScene;
        }
    }
    processScenes(data) {
        if (data.data.findScenes?.scenes) {
            for (const scene of data.data.findScenes.scenes) {
                this.scenes[scene.id] = scene;
            }
        }
    }
    processStudios(data) {
        if (data.data.findStudios?.studios) {
            for (const studio of data.data.findStudios.studios) {
                this.studios[studio.id] = studio;
            }
        }
    }
    processPerformers(data) {
        if (data.data.findPerformers?.performers) {
            for (const performer of data.data.findPerformers.performers) {
                this.performers[performer.id] = performer;
            }
        }
    }
    parseSearchItem(searchItem) {
        const urlNode = searchItem.querySelector('a.scene-link');
        const url = new URL(urlNode.href);
        const id = url.pathname.replace('/scenes/', '');
        const data = this.scenes[id];
        const nameNode = searchItem.querySelector('a.scene-link > div.TruncatedText');
        const name = nameNode.innerText;
        const queryInput = searchItem.querySelector('input.text-input');
        const performerNodes = searchItem.querySelectorAll('.performer-tag-container');

        return {
            urlNode,
            url,
            id,
            data,
            nameNode,
            name,
            queryInput,
            performerNodes
        }
    }
    parseSearchResultItem(searchResultItem) {
        const remoteUrlNode = searchResultItem.querySelector('.scene-details .optional-field .optional-field-content a');
        const remoteId = remoteUrlNode?.href.split('/').pop();
        const remoteUrl = remoteUrlNode?.href ? new URL(remoteUrlNode.href) : null;
        const remoteData = this.remoteScenes[remoteId];

        const sceneDetailNodes = searchResultItem.querySelectorAll('.scene-details .optional-field .optional-field-content');
        let urlNode = null;
        let detailsNode = null;
        for (const sceneDetailNode of sceneDetailNodes) {
            if (sceneDetailNode.innerText.startsWith('http') && (remoteUrlNode?.href !== sceneDetailNode.innerText)) {
                urlNode = sceneDetailNode;
            } else if (!sceneDetailNode.innerText.startsWith('http')) {
                detailsNode = sceneDetailNode;
            }
        }

        const imageNode = searchResultItem.querySelector('.scene-image-container .optional-field .optional-field-content');

        const metadataNode = searchResultItem.querySelector('.scene-metadata');
        const titleNode = metadataNode.querySelector('h4 .optional-field .optional-field-content');
        const codeAndDateNodes = metadataNode.querySelectorAll('h5 .optional-field .optional-field-content');
        let codeNode = null;
        let dateNode = null;
        for (const node of codeAndDateNodes) {
            if (node.textContent.includes('-')) {
                dateNode = node;
            } else {
                codeNode = node;
            }
        }

        const entityNodes = searchResultItem.querySelectorAll('.entity-name');
        let studioNode = null;
        const performerNodes = [];
        for (const entityNode of entityNodes) {
            if (entityNode.innerText.startsWith('Studio:')) {
                studioNode = entityNode;
            } else if (entityNode.innerText.startsWith('Performer:')) {
                performerNodes.push(entityNode);
            }
        }

        const matchNodes = searchResultItem.querySelectorAll('div.col-lg-6 div.mt-2 div.row.no-gutters.my-2 span.ml-auto');
        const matches = []
        for (const matchNode of matchNodes) {
            let matchType = null;
            const entityNode = matchNode.parentElement.querySelector('.entity-name');

            const matchName = matchNode.querySelector('.optional-field-content b').innerText;
            const remoteName = entityNode.querySelector('b').innerText;

            let data;
            if (entityNode.innerText.startsWith('Performer:')) {
                matchType = 'performer';
                if (remoteData) {
                    data = remoteData.performers.find(performer => performer.name === remoteName);
                }
            } else if (entityNode.innerText.startsWith('Studio:')) {
                matchType = 'studio';
                if (remoteData) {
                    data = remoteData.studio
                }
            }

            matches.push({
                matchType,
                matchNode,
                entityNode,
                matchName,
                remoteName,
                data
            });
        }

        return {
            remoteUrlNode,
            remoteId,
            remoteUrl,
            remoteData,
            urlNode,
            detailsNode,
            imageNode,
            titleNode,
            codeNode,
            dateNode,
            studioNode,
            performerNodes,
            matches
        }
    }
}

stash = new Stash();

function waitForElementBySelector(selector, callback, time) {
    time = time ?? 100;
    const elements = document.querySelectorAll(selector);
    return elements?.length > 0
        ? callback(selector, elements)
        : setTimeout(waitForElementBySelector, time, selector, callback, time);
}

function waitForElementClass(elementId, callback, time) {
    waitForElementBySelector(`.${elementId}`, callback, time);
}
function waitForElementId(elementId, callback, delay) {
    waitForElementBySelector(`#${elementId}`, callback, delay);
}

function waitForElementByXpath(xpath, callback, delay) {
    delay = delay ?? 100;
    time = (typeof time !== 'undefined') ? time : 100;
    window.setTimeout(() => {
        const elements = getElementByXpath(xpath);
        return elements?.length > 0
            ? callback(selector, elements)
            : waitForElementByXpath(xpath, callback);
    }, time);
}

function createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes.
    return div.firstChild;
}

function getElementByXpath(xpath, contextNode) {
    return document.evaluate(xpath, contextNode || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function getElementsByXpath(xpath, contextNode) {
    return document.evaluate(xpath, contextNode || document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
}

function getClosestAncestor(el, selector, stopSelector) {
    let retval = null;
    while (el) {
        if (el.matches(selector)) {
            retval = el;
            break
        } else if (stopSelector && el.matches(stopSelector)) {
            break
        }
        el = el.parentElement;
    }
    return retval;
}

function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
    } else {
        valueSetter.call(element, value);
    }
}

function updateTextInput(element, value) {
    setNativeValue(element, value);
    element.dispatchEvent(new Event('input', {
        bubbles: true
    }));
}

function concatRegexp(reg, exp) {
    let flags = reg.flags + exp.flags;
    flags = Array.from(new Set(flags.split(''))).join();
    return new RegExp(reg.source + exp.source, flags);
}

function sortElementChildren(node) {
    const items = node.childNodes;
    const itemsArr = [];
    for (const i in items) {
        if (items[i].nodeType == Node.ELEMENT_NODE) { // get rid of the whitespace text nodes
            itemsArr.push(items[i]);
        }
    }

    itemsArr.sort((a, b) => {
        return a.innerHTML == b.innerHTML ?
            0 :
            (a.innerHTML > b.innerHTML ? 1 : -1);
    });

    for (let i = 0; i < itemsArr.length; i++) {
        node.appendChild(itemsArr[i]);
    }
}

function xPathResultToArray(result) {
    let node = null;
    const nodes = [];
    while (node = result.iterateNext()) {
        nodes.push(node);
    }
    return nodes;
}

const reloadImg = url =>
    fetch(url, {
        cache: 'reload',
        mode: 'no-cors'
    })
    .then(() => document.body.querySelectorAll(`img[src='${url}']`)
        .forEach(img => img.src = url));
