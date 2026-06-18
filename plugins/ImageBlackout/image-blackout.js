(function() {
  let enabled = false;
  const cssId = 'image-blackout-style';

  const blackoutCSS = `img, video, .card-image, .card-image-container, .scene-card-preview-video, .scene-card-preview-image, .scene-scrubber, .scrubber, .scrubber-sprites, .scrubber-viewport, .preview-strip, .tag-card img, .tag-image, .tag-thumbnail, .sprite, .sprites, .sprite-image, .scrubber-sprite, .scrubber-item, [class*="svelte-1d03wug"], .ai-tagger, .ai-tag, .tagger-preview, [class*="sprite"], [class*="preview"], .performer-card img, .scene-card img, .gallery-card img, .hover-card, [class*="hover"] { display: none !important; visibility: hidden !important; background-image: none !important; }`;

  function createButton() {
    const nav = document.querySelector('.navbar-nav');
    if (!nav || document.getElementById('blackout-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'blackout-btn';
    btn.textContent = '🖼️';
    btn.style.margin = '0 4px';
    btn.style.padding = '2px 8px';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.backgroundColor = '#6c757d';
    btn.style.color = 'white';
    btn.style.fontSize = '16px';

    btn.onclick = function() {
      enabled = !enabled;
      if (enabled) {
        if (!document.getElementById(cssId)) {
          const style = document.createElement('style');
          style.id = cssId;
          style.innerHTML = blackoutCSS;
          document.head.appendChild(style);
        }
        btn.style.backgroundColor = '#28a745';
      } else {
        document.getElementById(cssId)?.remove();
        btn.style.backgroundColor = '#6c757d';
      }
    };

    nav.appendChild(btn);
  }

  createButton();
  const observer = new MutationObserver(createButton);
  observer.observe(document.body, { childList: true, subtree: true });
})();
