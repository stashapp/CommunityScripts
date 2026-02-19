(async () => {
  const PluginApi = window.PluginApi;
  const React = PluginApi.React;

  let pluginSettings = {};
  const defaultPluginSettings = {
    createIfNotExists: false,
    requireConfirmation: false,
  };

  // Helper functions for handling array of tags.
  const getTagNameArray = (tagArray) => tagArray.map((value) => value.name);
  const getTagNameString = (tagArray) => getTagNameArray(tagArray).join(", ");
  const sortTagArray = (tagArray) =>
    tagArray.sort((a, b) => {
      var aCompStr = a.sort_name ? a.sort_name : a.name;
      var bCompStr = b.sort_name ? b.sort_name : b.name;
      return aCompStr.localeCompare(bCompStr);
    });

  async function setupTagCopyPaste() {
    // Get plugin settings.
    const configSettings = await csLib.getConfiguration("tagCopyPaste", {}); // getConfiguration is from cs-ui-lib.js
    pluginSettings = {
      ...defaultPluginSettings,
      ...configSettings,
    };

    // Patch TagSelect to add copy/paste buttons.
    PluginApi.patch.after("TagSelect", function (props, _, originalComponent) {
      const copyButtonRef = React.useRef(null);
      const pasteButtonRef = React.useRef(null);
      const propsRef = props;

      // Copy Button click handler
      const copyClickHandler = (event) => {
        event.preventDefault();
        handleCopyClick(propsRef.values);
      };

      // Paste Button click handler
      const pasteClickHandler = (event) => {
        event.preventDefault();
        handlePasteClick(propsRef.onSelect, propsRef.values);
      };

      React.useEffect(() => {
        // Not the ideal way to handle this, but it works.
        // Wait for the buttons to render and then add the onCopy/onPaste handlers to select control DOM element.
        if (copyButtonRef && copyButtonRef.current) {
          var mainCopyPasteWrapper =
            copyButtonRef.current.parentElement.parentElement;
          var tagInputBox = mainCopyPasteWrapper.querySelector(
            ".react-select__value-container",
          );

          const copyEventHandler = (e) => {
            e.preventDefault();
            copyButtonRef.current.click();
          };

          const pasteEventHandler = (e) => {
            e.preventDefault();
            pasteButtonRef.current.click();
          };

          if (tagInputBox) {
            tagInputBox.addEventListener("copy", copyEventHandler);
            tagInputBox.addEventListener("paste", pasteEventHandler);
          }
        }
      }, []);

      return React.createElement("div", { className: "tagCopyPaste" }, [
        React.createElement(
          "div",
          {
            className: "btn-group",
          },
          [
            React.createElement(
              "button",
              {
                type: "button",
                ref: copyButtonRef,
                onClick: copyClickHandler,
                className:
                  "imageGalleryNav-copyButton btn btn-secondary btn-sm",
              },
              "Copy",
            ),
            React.createElement(
              "button",
              {
                type: "button",
                ref: pasteButtonRef,
                onClick: pasteClickHandler,
                className:
                  "imageGalleryNav-pasteButton btn btn-secondary btn-sm",
              },
              "Paste",
            ),
          ],
        ),
        originalComponent,
      ]);
    });
  }

  // Handle copy click. Return delimited list of current tags.
  async function handleCopyClick(propValues) {
    // Get tags from input box
    // join as comma delimited list
    const tagList = getTagNameString(propValues);
    navigator.clipboard.writeText(tagList);
  }

  // Handle paste click.
  async function handlePasteClick(onSelect, propValues) {
    // Parse tag list from comma delimited string.
    const tagInput = await navigator.clipboard.readText();
    var inputTagList = tagInput
      .split(/\r?\n|\r|,/)
      .map((s) => s.trim())
      .filter((text) => text !== ""); // do de-duplication later

    // Get tags from input box and also add to tag list.
    const existingTagList = getTagNameArray(propValues);

    inputTagList = [...new Set([...inputTagList, ...existingTagList])].sort();

    var missingTagNames = [];
    var existingTags = [];
    var tagUpdateList = [];

    // Search for tag ID for each tag. If exists, add to tag ID list. If not exists, create new tag and add to tag ID list.
    for (const inputTag of inputTagList) {
      const tagID = await getTagByName(inputTag);
      if (tagID && tagID.length) {
        existingTags.push(inputTag);
        tagUpdateList.push(tagID[0]);
      } else {
        missingTagNames.push(inputTag);
      }
    }

    // Create missing tags if enabled. Prompt user to confirm if confirmation option is also enabled.
    const missingTagsStr = missingTagNames.join(", ");
    const msg = `Missing Tags that will be created:\n${missingTagsStr}\n\nContinue?`;
    if (
      pluginSettings.createIfNotExists &&
      missingTagNames.length &&
      (!pluginSettings.requireConfirmation || confirm(msg))
    ) {
      for (const missingTagName of missingTagNames) {
        const newTag = await createNewTag(missingTagName);
        if (newTag != null) tagUpdateList.push(newTag);
      }
    }

    // Update TagSelect control with new tag list.
    onSelect(sortTagArray(tagUpdateList));
  }

  // *** GQL Calls ***

  // Create new tag.
  // Return newly created tag object.
  async function createNewTag(tagName) {
    const variables = { input: { name: tagName } };
    const query = `mutation CreateTag($input:TagCreateInput!) { tagCreate(input: $input) { id, name, sort_name, favorite, description, aliases, image_path, parents {id, name}, stash_ids {endpoint, stash_id, updated_at } } }`;
    return await csLib
      .callGQL({ query, variables })
      .then((data) => data.tagCreate);
  }

  // Find Tag by name/alias.
  // Return matched list of tag objects.
  async function getTagByName(tagName) {
    const tagFilter = {
      name: { value: tagName, modifier: "EQUALS" },
      OR: { aliases: { value: tagName, modifier: "EQUALS" } },
    };
    const findFilter = { per_page: -1, sort: "name" };
    const variables = { tag_filter: tagFilter, filter: findFilter };
    const query = `query ($tag_filter: TagFilterType!, $filter: FindFilterType!) { findTags(filter: $filter, tag_filter: $tag_filter) { tags { id, name, sort_name, favorite, description, aliases, image_path, parents {id, name}, stash_ids {endpoint, stash_id, updated_at } } } }`;
    return await csLib
      .callGQL({ query, variables })
      .then((data) => data.findTags.tags);
  }

  setupTagCopyPaste();
})();
