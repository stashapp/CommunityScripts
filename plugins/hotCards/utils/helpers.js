/** General */

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getFixedBackgroundOpacity(opacity) {
  return parseFloat((1 - opacity / 100).toFixed(1));
}

/** Elements */

function waitForClass(className, callback) {
  const checkInterval = 100; // ms
  const maxRetries = 30; // Timeout after 3 seconds
  let retryCount = 0;

  const intervalId = setInterval(() => {
    const elements = document.getElementsByClassName(className);
    if (elements.length > 0) {
      clearInterval(intervalId);
      callback();
    } else if (retryCount >= maxRetries) {
      clearInterval(intervalId);
      console.info(
        `Element with class ${className} not found within timeout period`
      );
    }
    retryCount++;
  }, checkInterval);
}

function waitForImageLoad(selector, callback) {
  var imgEl = document.querySelector(selector);
  if (imgEl?.complete) return callback(imgEl);
  setTimeout(waitForImageLoad, 100, selector, callback);
}
