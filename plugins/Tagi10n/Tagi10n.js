// Stash Tag Translation
(async function () {
  "use strict";

  const { waitForElement, PathElementListener, getConfiguration, baseURL } =
    window.csLib;

  const defaultConfig = {
    defaultLanguage: "zh_CN",
  };

  async function loadLanguageFile(lang) {
    try {
      const module = await import(
        `https://cdn.jsdelivr.net/gh/dongfengweixiao/CommunityScripts@tagi10n1/plugins/Tagi10n/i10n/tag_${lang}.js`
      );
      return module.default || {};
    } catch (error) {
      console.error(`Failed to load language file tag_${lang}.js`, error);
      return {};
    }
  }

  function translateTags(languageMap, xpathArray) {
    if (!languageMap) {
      console.error("languageMap is undefined or null. Translation skipped.");
      return;
    }

    xpathArray.forEach((xpath) => {
      const elements = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      for (let i = 0; i < elements.snapshotLength; i++) {
        const element = elements.snapshotItem(i);
        const originalText = element.textContent.trim();
        const translation = languageMap[originalText];
        console.log(translation);
        // 检查 translation 是否为数组且长度大于 0
        if (Array.isArray(translation) && translation.length > 0) {
          element.textContent = translation[0];
        } else {
          // 若没有翻译，可选择保留原始文本或记录日志
          console.warn(`No translation found for "${originalText}"`);
        }
      }
    });
  }

  function translateTagDescriptions(languageMap) {
    if (!languageMap) {
      console.error(
        "languageMap is undefined or null. Description translation skipped."
      );
      return;
    }

    const tagNameElements = document.evaluate(
      "//div[contains(@class, 'tag-card')]//div[@class='TruncatedText']",
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    for (let i = 0; i < tagNameElements.snapshotLength; i++) {
      const tagNameElement = tagNameElements.snapshotItem(i);
      const tagName = tagNameElement.textContent.trim();

      const descriptionElement = document.evaluate(
        "//div[contains(@class, 'tag-card')]//div[contains(@class, 'tag-description')]",
        tagNameElement.parentNode,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      const translationEntry = languageMap[tagName];

      if (
        descriptionElement &&
        Array.isArray(translationEntry) &&
        translationEntry.length > 1
      ) {
        descriptionElement.textContent = translationEntry[1];
      }
    }
  }

  async function main() {
    const config = await getConfiguration("Tagi10n", defaultConfig);
    const lang = config.defaultLanguage;
    const languageMap = await loadLanguageFile(lang);

    const xpathArray = [
      "//div[contains(@span, 'tag-item')]//div",
      "//*[contains(@class, 'tag-item')]//div",
      "//div[contains(@class, 'tag-card')]//div[@class='TruncatedText']",
      "//*[contains(@class, 'tag-name')]",
      "//span[contains(@span, 'tag-item')]//div",
    ];

    PathElementListener(baseURL + "scenes", ".tag-item", () => {
      translateTags(languageMap, xpathArray);
    });
    PathElementListener(baseURL + "tags", ".card-section", () => {
      translateTagDescriptions(languageMap);
      translateTags(languageMap, xpathArray);
    });
    PathElementListener(baseURL + "tags/", ".tag-name", () => {
      translateTagDescriptions(languageMap);
      translateTags(languageMap, xpathArray);
    });
    PathElementListener(baseURL + "images", ".tag-item", () => {
      translateTags(languageMap, xpathArray);
    });
    PathElementListener(baseURL + "performers", ".tag-item", () => {
      translateTags(languageMap, xpathArray);
    });
    PathElementListener(baseURL + "groups", ".tag-item", () => {
      translateTags(languageMap, xpathArray);
    });
    PathElementListener(baseURL + "galleries", ".tag-item", () => {
      translateTags(languageMap, xpathArray);
    });
  }

  main();
})();
