(async () => {
  let pluginSettings = {};
  const defaultPluginSettings = {
    createIfNotExists: false,
    requireConfirmation: false,
  };

  // helper function to get the innerText of all elements matching a selector
  const getAllInnerText = (selector) => Array.from(document.querySelectorAll(selector))
    .map((el) => el.innerText.trim())
    .filter((text) => text !== "");

  // On image page, get data about gallery (image's position within gallery, next/prev image IDs),
  // add arrow buttons to page, and register arrow keypress handlers,
  async function setupTagCopyPaste(objType) {
    // Get plugin settings.
    const configSettings = await csLib.getConfiguration("tagCopyPaste", {}); // getConfiguration is from cs-ui-lib.js
    pluginSettings = {
      ...defaultPluginSettings,
      ...configSettings,
    };

    var objID = window.location.pathname.split("/")[2];

    // Add UI elements.
    if (objID !== "new") {
      insertCopyPasteButtons(objID, objType);
    }
  }

  function insertCopyPasteButtons(objID, objType) {
    // listen for copy and paste events within tag input box
    // find tag input box
    const tagInputBox = document.querySelector("label[for='tag_ids'] + div .react-select__value-container");
    if (tagInputBox) {
      tagInputBox.addEventListener("copy", (event) => {
        event.preventDefault();
        handleCopyClick();
      });
      tagInputBox.addEventListener("paste", (event) => {
        event.preventDefault();
        handlePasteClick(objID, objType);
      });
    }

    var copyButton = document.createElement("button");
    copyButton.className = "imageGalleryNav-copyButton btn btn-secondary";
    copyButton.innerText = "Copy";
    copyButton.onclick = (event) => {
      event.preventDefault();
      handleCopyClick();
    }

    var pasteButton = document.createElement("button");
    pasteButton.className = "imageGalleryNav-pasteButton btn btn-secondary";
    pasteButton.innerText = "Paste";
    pasteButton.onclick = (event) => {
      event.preventDefault();
      handlePasteClick(objID, objType);
    }

    if (document.querySelector("button.imageGalleryNav-pasteButton") == null) {
      document.querySelector("label[for='tag_ids']").append(pasteButton);
    }
    if (document.querySelector("button.imageGalleryNav-copyButton") == null) {
      document.querySelector("label[for='tag_ids']").append(copyButton);
    }
  }

  // Handle copy click. Return delimited list of current tags.
  async function handleCopyClick() {
    // Get tags from input box
    // join as comma delimited list
    const tagList = getAllInnerText("label[for='tag_ids'] + div .react-select__multi-value__label").join(",")
    // write to clipboard.
    navigator.clipboard.writeText(tagList);
  }

  // Handle paste click.
  async function handlePasteClick(objID, objType) {
    // Parse tag list from comma delimited string.
    const tagInput = await navigator.clipboard.readText();
    var inputTagList = tagInput.split(/\r?\n|\r|,/).map(s => s.trim()).filter((text) => text !== "") // do de-duplication later

    // Get tags from input box and also add to tag list.
    const existingTagList = getAllInnerText("label[for='tag_ids'] + div .react-select__multi-value__label");

    inputTagList = [...new Set([...inputTagList, ...existingTagList])].sort();

    var missingTags = [];
    var existingTags = [];
    var tagUpdateList = [];

    // Search for tag ID for each tag. If exists, add to tag ID list. If not exists, create new tag and add to tag ID list.
    for (const inputTag of inputTagList) {
      const tagID = await getTagByName(inputTag);
      if (tagID && tagID.length) {
        existingTags.push(inputTag);
        tagUpdateList.push(tagID[0]);
      } else {
        missingTags.push(inputTag);
      }
    }

    if (pluginSettings.requireConfirmation) {
      const missingTagsStr = missingTags.join(", ");
      const existingTagsStr = existingTags.join(", ");
      const msg = pluginSettings.createIfNotExists
        ? `Missing Tags that will be created:\n${missingTagsStr}\n\nExisting Tags that will be saved: \n${existingTagsStr}\n\nContinue?`
        : `Missing Tags that will be skipped:\n${missingTagsStr}\n\nExisting Tags that will be saved: \n${existingTagsStr}\n\nContinue?`;

      if (!confirm(msg)) {
        return;
      }
    }

    if (pluginSettings.createIfNotExists && missingTags.length) {
      for (const missingTag of missingTags) {
        const newTagID = await createNewTag(missingTag);
        if (newTagID != null) tagUpdateList.push(newTagID);
      }
    }

    // Update tags on object with new tag ID list.
    await updateObjTags(
      objID,
      tagUpdateList,
      `${objType.toLowerCase()}Update`,
      `${objType}UpdateInput`
    );

    window.location.reload();
  }

  // *** GQL Calls ***

  // Update Object by ID, new tags list, and GQL mutation name.
  async function updateObjTags(objID, tags, fnName, inputName) {
    const variables = { input: { id: objID, tag_ids: tags } };
    const query = `mutation UpdateObj($input:${inputName}!) { ${fnName}(input: $input) {id} }`;
    return await csLib.callGQL({ query, variables });
  }

  // Update Object by ID, new tags list, and GQL mutation name.
  async function createNewTag(tagName) {
    const variables = { input: { name: tagName } };
    const query = `mutation CreateTag($input:TagCreateInput!) { tagCreate(input: $input) {id} }`;
    return await csLib
      .callGQL({ query, variables })
      .then((data) => data.tagCreate.id);
  }

  // Find Tag by name/alias.
  // Return match tag ID.
  async function getTagByName(tagName) {
    const tagFilter = {
      name: { value: tagName, modifier: "EQUALS" },
      OR: { aliases: { value: tagName, modifier: "EQUALS" } },
    };
    const findFilter = { per_page: -1, sort: "name" };
    const variables = { tag_filter: tagFilter, filter: findFilter };
    const query = `query ($tag_filter: TagFilterType!, $filter: FindFilterType!) { findTags(filter: $filter, tag_filter: $tag_filter) { tags { id } } }`;
    return await csLib
      .callGQL({ query, variables })
      .then((data) => data.findTags.tags.map((item) => item.id));
  }

  // listener arrays
  [
    [ "/scenes/", "[id*='-edit-details']", "Scene" ],
    [ "/studios/", "[id='studio-edit']", "Studio" ],
    [ "/groups/", "[id='group-edit']", "Group" ],
    [ "/performers/", "[id='performer-edit']", "Performer" ],
    [ "/galleries/", "[id*='-edit-details']", "Gallery" ],
    [ "/images/", "[id*='-edit-details']", "Image" ]
  ].forEach(([path, selector, objType]) => {
    // Wait for the page to load and the element to be present.
    csLib.PathElementListener(path, selector, () => {
      setupTagCopyPaste(objType);
    }); // PathElementListener is from cs-ui-lib.js
  });
})();
