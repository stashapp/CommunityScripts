(function () {
    "use strict"; 
    const capturingRegexHeight = /^(\d{1,2})\.(\d)/;
    const capturingRegexWeight = /^(\d{1,4})\.(\d{1,2})/;
    let timeoutIDWeight;
  
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
  
    function feetAndInchesToCM(feet, inches) {
      const cmTotal = feet * 30.48 + inches * 2.54;
      return cmTotal;
    }
  
    function lbsAndOzToK(imperial) {
      var pounds = (imperial.pounds + imperial.ounces / 16) / 10;
      return pounds * 0.45359237;
    }
  
    function inchesToCM(inches, secondDecimal) {
      const cmTotal = inches * 2.54 + secondDecimal * 0.254;
      return cmTotal;
    }
  
    function addEventLisener(inputElem, type) {
      if (type === "height") {
        console.log(inputElem);
        inputElem.setAttribute(
          "placeholder",
          "Height (cm) ¦ Dot notation on input value: <Feet . Inches> (Needs intiger after . to convert)"
        );
      }
      if (type === "weight") {
        console.log(inputElem);
        inputElem.setAttribute(
          "placeholder",
          "Weight (kg) ¦ Dot notation on input value: <Pounds . Ounces> (Needs intiger after . to convert)"
        );
      }
      if (type === "penis") {
        console.log(inputElem);
        inputElem.setAttribute(
          "placeholder",
          "Penis Length (cm) ¦ Dot notation on input value: <Inches . Inches> (Needs intiger after . to convert)"
        );
      }
  
      inputElem.addEventListener("input", function () {
        // This function will be called whenever text is typed into the input box
        const typedText = inputElem.value;
  
        if (type === "height") {
          const found = typedText.match(capturingRegexHeight);
          if (found) {
            const calculted = Math.round(feetAndInchesToCM(found[1], found[2]));
            setNativeValue(inputElem, calculted);
          }
        } else if (type === "weight") {
          const found = typedText.match(capturingRegexWeight);
          if (found) {
            timeoutIDWeight = setTimeout(() => {
              setNativeValue(
                inputElem,
                Math.round(lbsAndOzToK({ pounds: found[1], ounces: found[2] }))
              );
            }, 1000);
          }
        } else if (type === "penis") {
          const found = typedText.match(capturingRegexHeight);
          if (found) {
            const calculted = Math.round(inchesToCM(found[1], found[2]));
            setNativeValue(inputElem, calculted);
          }
        }
      });
    }
  
    stash.addEventListener("page:performer:details", function () {
      waitForElementClass("form-group", function () {
        const heightInputElement = document.evaluate(
          '//input[@placeholder="Height (cm)"]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
  
        const weightInputElement = document.evaluate(
          '//input[@placeholder="Weight (kg)"]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
  
        const penisInputElement = document.evaluate(
          '//input[@placeholder="Penis Length (cm)"]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
  
        addEventLisener(heightInputElement, "height");
        addEventLisener(weightInputElement, "weight");
        addEventLisener(penisInputElement, "penis");
      });
    });
  })();
