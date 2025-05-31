(async () => {
  let pluginSettings = {};
  const defaultPluginSettings = {
    createIfNotExists: false,
    requireConfirmation: false,
  };

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
    var copyButton = document.createElement("button");
    copyButton.className = "imageGalleryNav-copyButton btn btn-secondary";
    copyButton.innerText = "Copy";
    copyButton.addEventListener("click", (e) => {
      e.preventDefault();
      handleCopyClick();
    });

    var pasteButton = document.createElement("button");
    pasteButton.className = "imageGalleryNav-pasteButton btn btn-secondary";
    pasteButton.innerText = "Paste";
    pasteButton.addEventListener("click", (e) => {
      e.preventDefault();
      handlePasteClick(objID, objType);
    });

    if (document.querySelector("button.imageGalleryNav-pasteButton") == null) {
      document.querySelector("label[for='tag_ids']").append(pasteButton);
    }
    if (document.querySelector("button.imageGalleryNav-copyButton") == null) {
      document.querySelector("label[for='tag_ids']").append(copyButton);
    }
  }

  // Handle copy click. Return delimited list of current tags.
  async function handleCopyClick() {
    // Get tags from input box.
    var tagList = [];
    document
      .querySelectorAll(
        "label[for='tag_ids'] + div .react-select__multi-value__label"
      )
      .forEach((item) => {
        tagList.push(item.innerText);
      });

    // Join tags as comma delimited list and write to clipboard.
    await navigator.clipboard.writeText(tagList.join(","));
  }

  // Handle paste click.
  async function handlePasteClick(objID, objType) {
    var inputTagList = [];

    // Parse tag list from comma delimited string.
    var tagInput = await navigator.clipboard.readText();
    tagInput.split(",").forEach((item) => {
      if (!inputTagList.includes(item)) {
        inputTagList.push(item);
      }
    });

    // Get tags from input box and also add to tag list.
    document
      .querySelectorAll(
        "label[for='tag_ids'] + div .react-select__multi-value__label"
      )
      .forEach((item) => {
        if (!inputTagList.includes(item)) {
          inputTagList.push(item.innerText);
        }
      });

    inputTagList.sort();

    var missingTags = [];
    var existingTags = [];
    var tagUpdateList = [];

    // Search for tag ID for each tag. If exists, add to tag ID list. If not exists, create new tag and add to tag ID list.
    for (let i = 0; i < inputTagList.length; i++) {
      var inputTag = inputTagList[i];
      var tagID = await getTagByName(inputTag);
      if (tagID != null && tagID.length) {
        existingTags.push(inputTag);
        tagUpdateList.push(tagID[0]);
      } else {
        missingTags.push(inputTag);
      }
    }

    if (pluginSettings.requireConfirmation) {
      var msg = "";
      if (pluginSettings.createIfNotExists) {
        msg = `Missing Tags that will be created:\n${missingTags.join(
          ", "
        )}\n\nExisting Tags that will be saved: \n${existingTags.join(
          ", "
        )}\n\nContinue?`;
      } else {
        msg = `Missing Tags that will be skipped:\n${missingTags.join(
          ", "
        )}\n\nExisting Tags that will be saved: \n${existingTags.join(
          ", "
        )}\n\nContinue?`;
      }

      var userConfirmed = confirm(msg);
      if (!userConfirmed) {
        return;
      }
    }

    if (pluginSettings.createIfNotExists && missingTags.length) {
      for (let i = 0; i < missingTags.length; i++) {
        var newTagName = missingTags[i];
        var newTagID = await createNewTag(newTagName);
        if (newTagID != null) {
          tagUpdateList.push(newTagID);
        }
      }
    }

    // Update tags on object with new tag ID list.
    await updateObjTags(
      objID,
      tagUpdateList,
      objType.toLowerCase() + "Update",
      objType + "UpdateInput"
    );

    window.location.reload();
  }

  // *** Utility Functions ***

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

  // Wait for scenes page.
  csLib.PathElementListener("/scenes/", "[id*='-edit-details']", () => {
    setupTagCopyPaste("Scene");
  }); // PathElementListener is from cs-ui-lib.js

  // Wait for studios page.
  csLib.PathElementListener("/studios/", "[id='studio-edit']", () => {
    setupTagCopyPaste("Studio");
  }); // PathElementListener is from cs-ui-lib.js

  // Wait for groups page.
  csLib.PathElementListener("/groups/", "[id='group-edit']", () => {
    setupTagCopyPaste("Group");
  }); // PathElementListener is from cs-ui-lib.js

  // Wait for performers page.
  csLib.PathElementListener("/performers/", "[id='performer-edit']", () => {
    setupTagCopyPaste("Performer");
  }); // PathElementListener is from cs-ui-lib.js

  // Wait for galleries page.
  csLib.PathElementListener("/galleries/", "[id*='-edit-details']", () => {
    setupTagCopyPaste("Gallery");
  }); // PathElementListener is from cs-ui-lib.js

  // Wait for images page.
  csLib.PathElementListener("/images/", "[id*='-edit-details']", () => {
    setupTagCopyPaste("Image");
  }); // PathElementListener is from cs-ui-lib.js
})();
