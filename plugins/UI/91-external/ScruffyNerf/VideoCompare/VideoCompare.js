(function() {
	'use strict';
	function wfke(selector, callback) {
		var el = document.querySelector(selector);
		if (el) return callback();
		setTimeout(wfke, 100, selector, callback);
	}
	wfke(".navbar-brand", addbutton);

	function addbutton() {
		const navBar = document.querySelector(".navbar-nav");
		const buttonClass = navBar.firstChild.attributes.class.value;
		const linkClass = navBar.firstChild.firstChild.attributes.class.value;
		const newButton = document.createElement("div");
		newButton.setAttribute("class", buttonClass);
		newButton.onclick = compare
		const innerLink = document.createElement("a");
		innerLink.setAttribute("class", linkClass);
		const buttonLabel = document.createElement("span");
		buttonLabel.innerText = "Video Compare";
		innerLink.appendChild(buttonLabel);
		newButton.appendChild(innerLink);
		navBar.appendChild(newButton);
	}

	function compare() {
		var numberOfChecked = document.querySelectorAll('input[type="checkbox"]:checked').length;
		if (numberOfChecked == 2) {
			const r = /[^"]+\/scene\/\d+\/s/ms;
			var lr = []
			const list = document.querySelectorAll('input[type=checkbox]:checked')
			for (let item of list) {
				var urlstuff = item.nextElementSibling.innerHTML
				var m = r.exec(urlstuff)
				lr.push(m[0])
			}
			var site = "http://scruffynerf.stashapp.cc"
			var url = site.concat("?leftVideoUrl=", lr[0], "tream&rightVideoUrl=", lr[1], "tream")
			window.open(url, '_blank');
		}
	}
})();