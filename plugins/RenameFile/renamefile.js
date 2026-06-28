(function() {
    'use strict';
    function AppendTitleField(text, event) {
        if ((!event.altKey && !event.ctrlKey) || event.shiftKey) {
			try {
				var titleInput = document.getElementById('title');
				if (event.shiftKey)
					titleInput.value = text;
				else
					titleInput.value += text;
				console.log('Appended title to title field: ' + text);
			} catch (err) {
				console.error('Failed to append text to title field:', err);
			}
		}
		
		var textArea = null;
		var fileckUrl = null;
		if (event.altKey) {
			try {
				const navElements = document.querySelectorAll("a");
				for (const element of navElements)
				{
					var ckUrl = decodeURI(element.href);
					if (ckUrl.startsWith("file://")){
						fileckUrl = ckUrl;
						ckUrl = ckUrl.replace("file:///", "");
						ckUrl = ckUrl.replace("file://", "");
						console.debug("Copping " + ckUrl + " to clipboard");
						textArea = document.createElement("textarea");
						textArea.value = ckUrl;
						document.body.appendChild(textArea);
						textArea.select();
						break;
					}
				}
			} catch (err) {
				console.error('Failed to get file URL:', err);
			}
		}
		else if (event.ctrlKey) {
			try {
				console.debug("Copping " + text + " to clipboard");
				textArea = document.createElement("textarea");
				textArea.value = text;
				document.body.appendChild(textArea);
				textArea.select();
			} catch (err) {
				console.error('Failed to get title:', err);
			}
		}
		
		if (textArea != null)
		{
			try {
				var successful = document.execCommand('copy');
				var msg = successful ? 'successful' : 'unsuccessful';
				console.log('Text copy ' + msg + ':', textArea.value);
			} catch (err) {
				console.error('Failed to copy text to clipboard:', err);
			}
			document.body.removeChild(textArea);
			try {
				if (fileckUrl != null && event.ctrlKey){
					window.open(fileckUrl, "_blank");
					console.log('Opening link ' + fileckUrl);
				}
			} catch (err) {
				console.error("Failed to open link '" + fileckUrl + "' with error:", err);
			}		
			
		}
    }

    var TITLE_SELECTOR = '.scene-header div.TruncatedText';
    var TOOLTIP = 'Click to append title to [Title] input field; OR ctrl-key & mouse click to copy title to clipboard; OR shift-key click to copy to [Title] input field; OR alt-key click to copy file URI to clipboard.';

    // Use event delegation instead of replacing the title element. The scene
    // title is a React-controlled component; restructuring its DOM (e.g.
    // wrapping it in an <a>) detaches the text node React updates, so the title
    // freezes on the previous scene when navigating with Next. By listening on
    // document and reading the title at click time, we never touch React's DOM.
    document.addEventListener('click', function(event) {
        var title = event.target.closest(TITLE_SELECTOR);
        if (!title) return;
        event.preventDefault();
        AppendTitleField(title.textContent.trim(), event);
    });

    // Non-destructive affordance: add the styling class and tooltip without
    // touching the element's children, so React's text node stays intact.
    function decorate(element) {
        if (!element.classList.contains('renamefile')) {
            element.classList.add('renamefile');
        }
        if (element.getAttribute('title') !== TOOLTIP) {
            element.setAttribute('title', TOOLTIP);
        }
    }

    function handleMutations(mutationsList) {
        for (const mutation of mutationsList) {
            for (const addedNode of mutation.addedNodes) {
                if (addedNode.nodeType !== Node.ELEMENT_NODE) continue;
                var title = addedNode.matches && addedNode.matches(TITLE_SELECTOR)
                    ? addedNode
                    : addedNode.querySelector && addedNode.querySelector(TITLE_SELECTOR);
                if (title) decorate(title);
            }
        }
    }
    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, { childList: true, subtree: true });

    var existing = document.querySelector(TITLE_SELECTOR);
    if (existing) decorate(existing);
})();
