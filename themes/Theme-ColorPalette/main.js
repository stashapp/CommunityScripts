if (!localStorage.getItem('UserColor')) {
  localStorage.setItem('UserColor', 0);
}
document.documentElement.style.setProperty('--maincolorDeg', localStorage.getItem('UserColor') +"deg");

async function mainFunction() {
  let hueValue;
  try {
      const config = await csLib.getConfiguration("colorPalette", {});
      // 假设config是一个对象，其中包含hue属性
      hueValue = config.hue;
      let UserColorValue = hueValue;
      localStorage.setItem('UserColor', UserColorValue);
  } catch (error) {
      console.error('Error getting configuration:', error);
  }
  // 在这里可以继续使用hueValue变量进行其他操作
  return hueValue;
}
mainFunction();


if (!localStorage.getItem('UserColor')) {
  localStorage.setItem('UserColor', 0);
}
document.documentElement.style.setProperty('--maincolorDeg', localStorage.getItem('UserColor') +"deg");

document.querySelector("meta[name='theme-color']").content = window.getComputedStyle(document.querySelectorAll(".top-nav")[0]).backgroundColor


