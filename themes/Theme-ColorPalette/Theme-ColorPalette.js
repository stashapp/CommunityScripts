if (!localStorage.getItem("UserColor")) {
  localStorage.setItem("UserColor", 0);
}
document.documentElement.style.setProperty(
  "--maincolorDeg",
  localStorage.getItem("UserColor") + "deg"
);

async function mainFunction() {
  let hueValue;
  try {
    const config = await csLib.getConfiguration("Theme-ColorPalette", {});
    hueValue = config.hue;
    let UserColorValue = hueValue;
    localStorage.setItem("UserColor", UserColorValue);
  } catch (error) {
    console.error("Error getting configuration:", error);
  }
  return hueValue;
}
mainFunction();

if (!localStorage.getItem("UserColor")) {
  localStorage.setItem("UserColor", 0);
}
document.documentElement.style.setProperty(
  "--maincolorDeg",
  localStorage.getItem("UserColor") + "deg"
);

document.querySelector("meta[name='theme-color']").content =
  window.getComputedStyle(
    document.querySelectorAll(".top-nav")[0]
  ).backgroundColor;
