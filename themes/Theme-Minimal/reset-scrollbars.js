const existingStyles = document.styleSheets;

for (let sheet of existingStyles) {
  try {
    const rules = sheet.cssRules || sheet.rules; // Get the CSS rules
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      // Check if the rule targets the scrollbar
      if (
        rule.selectorText &&
        rule.selectorText.includes("::-webkit-scrollbar")
      ) {
        // Remove the rule from the stylesheet
        sheet.deleteRule(i);
        i--; // Adjust index due to rule removal
      }
    }
    console.log("done");
  } catch (e) {
    // Catch and ignore cross-origin stylesheets (they can't be modified)
  }
}
