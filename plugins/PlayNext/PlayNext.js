/*
  Play Next v1.1.1

  Hover a native Stash scene card and press Shift+N. The selected scene is a
  ordered one-shot override queue. The current video is not interrupted; after
  the last override, Stash resumes the queue that was active before it.

  This is a UI-only plugin. It performs only a read-only findScene query and
  never changes Stash metadata, files, settings, or the database.
*/
(function () {
  'use strict';
  if (window.__playNextLoaded) return;
  window.__playNextLoaded = true;

  const PLUGIN = 'PlayNext';
  const VERSION = '1.1.1';
  const STATE_KEY = 'PlayNext.override.v1';
  const ACTIVE_KEY = 'PlayNext.activePlayer.v1';
  const CHANGE_EVENT = 'playnext:change';
  const OWNER_ID = makeId();
  const ACTIVE_TTL_MS = 15000;
  const Api = window.PluginApi;
  const React = Api && Api.React;
  const h = React && React.createElement;

  let hoveredCard = null;
  let selectionSerial = 0;
  let pageRuntime = null;
  let playerRuntime = null;
  let activeHeartbeat = null;

  function makeId() {
    try {
      return crypto.randomUUID();
    } catch (_) {
      return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    }
  }

  function log(message, value) {
    if (value === undefined) console.info('[' + PLUGIN + '] ' + message);
    else console.info('[' + PLUGIN + '] ' + message, value);
  }

  function parseJSON(value) {
    if (!value) return null;
    try { return JSON.parse(value); } catch (_) { return null; }
  }

  function getState() {
    const state = parseJSON(localStorage.getItem(STATE_KEY));
    if (!state) return null;
    // Seamlessly accept a pending v1.0 single-slot record after an upgrade.
    if (state.version === 1 && state.target && state.target.id) {
      state.version = 2;
      state.items = [state.target];
      state.currentIndex = state.phase === 'playing' ? 0 : -1;
      delete state.target;
    }
    if (state.version !== 2 || !Array.isArray(state.items) || !state.items.length) return null;
    state.items = state.items.filter(function (scene) { return scene && scene.id; });
    if (!state.items.length) return null;
    return state;
  }

  function setState(state) {
    if (state) localStorage.setItem(STATE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STATE_KEY);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }

  function getActivePlayer() {
    const active = parseJSON(localStorage.getItem(ACTIVE_KEY));
    if (!active || !active.ownerId || Date.now() - Number(active.updatedAt || 0) > ACTIVE_TTL_MS) return null;
    return active;
  }

  function currentSceneId() {
    const match = location.pathname.match(/^\/scenes\/(\d+)(?:\/|$)/);
    return match ? match[1] : null;
  }

  function markActivePlayer(reason) {
    const sceneId = currentSceneId();
    if (!sceneId || !document.querySelector('.scene-player-container, #VideoJsPlayer')) return;
    const active = {
      version: 1,
      ownerId: OWNER_ID,
      sceneId: sceneId,
      url: location.pathname + location.search,
      updatedAt: Date.now(),
      reason: reason || 'heartbeat'
    };
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
  }

  function startHeartbeat() {
    markActivePlayer('player-mounted');
    if (activeHeartbeat) clearInterval(activeHeartbeat);
    activeHeartbeat = setInterval(function () {
      if (playerRuntime && currentSceneId()) markActivePlayer('heartbeat');
    }, 5000);
  }

  function stopHeartbeat() {
    if (activeHeartbeat) clearInterval(activeHeartbeat);
    activeHeartbeat = null;
  }

  function isEditable(element) {
    return !!(element && element.closest && element.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'));
  }

  function sceneCardFromEventTarget(target) {
    if (!target || !target.closest) return null;

    // Main grids use .scene-card, while Similar Scenes and third-party skins
    // can render a lighter card or a plain scene link. Prefer the exact link
    // under the pointer, then walk only as far as the nearest container that
    // owns exactly one scene link. This avoids accidentally selecting the
    // first result from an entire carousel or panel.
    const directAnchor = target.closest('a[href]');
    const directId = directAnchor && sceneIdFromHref(directAnchor.getAttribute('href'));
    if (directId) {
      const directCard = directAnchor.closest('.scene-card, .card, [data-scene-id], [class*="similar-scene"], [class*="scene-card"]') || directAnchor;
      return { card: directCard, anchor: directAnchor, id: directId };
    }

    let container = target;
    for (let depth = 0; container && container !== document.body && depth < 8; depth++, container = container.parentElement) {
      if (!container.querySelectorAll) continue;
      const matches = [];
      const seen = new Set();
      const anchors = container.querySelectorAll('a[href]');
      for (const anchor of anchors) {
        const id = sceneIdFromHref(anchor.getAttribute('href'));
        if (id && !seen.has(id)) {
          seen.add(id);
          matches.push({ anchor: anchor, id: id });
        }
      }
      if (matches.length === 1) return { card: container, anchor: matches[0].anchor, id: matches[0].id };
      if (matches.length > 1) return null;
    }
    return null;
  }

  function sceneIdFromHref(href) {
    if (!href) return null;
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return null;
      const match = url.pathname.match(/^\/scenes\/(\d+)(?:\/|$)/);
      return match ? match[1] : null;
    } catch (_) { return null; }
  }

  function onPointerOver(event) {
    const next = sceneCardFromEventTarget(event.target);
    if (hoveredCard && (!next || hoveredCard.card !== next.card)) {
      hoveredCard.card.classList.remove('play-next-hover-target');
    }
    hoveredCard = next;
    if (hoveredCard) hoveredCard.card.classList.add('play-next-hover-target');
  }

  function onPointerOut(event) {
    if (!hoveredCard || !hoveredCard.card.contains(event.target)) return;
    if (event.relatedTarget && hoveredCard.card.contains(event.relatedTarget)) return;
    hoveredCard.card.classList.remove('play-next-hover-target');
    hoveredCard = null;
  }

  function cardLabel(cardInfo) {
    const card = cardInfo.card;
    const labelled = card.querySelector('[data-title], .scene-card__title, .card-section-title, .card-title');
    const label = labelled && (labelled.getAttribute('data-title') || labelled.textContent);
    const image = card.querySelector('img[alt]');
    return String(label || (image && image.alt) || cardInfo.anchor.title || ('Scene ' + cardInfo.id)).trim();
  }

  async function findScene(id, fallbackTitle) {
    const response = await fetch('/graphql', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/graphql-response+json, application/json'
      },
      body: JSON.stringify({
        query: 'query PlayNextScene($id: ID!) { findScene(id: $id) { id title date paths { screenshot } performers { id name } studio { id name } } }',
        variables: { id: String(id) }
      })
    });
    if (!response.ok) throw new Error('GraphQL HTTP ' + response.status);
    const payload = await response.json();
    if (payload.errors && payload.errors.length) throw new Error(payload.errors.map(function (e) { return e.message; }).join('; '));
    const scene = payload.data && payload.data.findScene;
    if (!scene) throw new Error('Scene ' + id + ' was not found');
    if (!scene.title) scene.title = fallbackTitle || ('Scene ' + id);
    return scene;
  }

  async function queueHoveredScene() {
    const cardInfo = hoveredCard;
    if (!cardInfo || !document.contains(cardInfo.card)) {
      toast('Hover a scene card, then press Shift+N.', true);
      return;
    }

    const active = getActivePlayer();
    if (!active) {
      toast('No active Stash web player was found. Open or focus a scene player first.', true);
      return;
    }

    const existing = getState();
    if (existing && existing.ownerId === active.ownerId) {
      const existingIndex = existing.items.findIndex(function (scene) { return String(scene.id) === String(cardInfo.id); });
      if (existingIndex >= 0) {
        if (existing.phase === 'playing' && existingIndex === existing.currentIndex) {
          toast('That override is playing now. Use Next or clear the queue.', true);
          return;
        }
        existing.items.splice(existingIndex, 1);
        if (existing.phase === 'playing' && existingIndex < existing.currentIndex) existing.currentIndex--;
        if (!existing.items.length) setState(null);
        else setState(existing);
        toast('Removed from Play Next: ' + cardLabel(cardInfo));
        return;
      }
    }

    const serial = ++selectionSerial;
    try {
      const scene = await findScene(cardInfo.id, cardLabel(cardInfo));
      if (serial !== selectionSerial) return;
      const latest = getState();
      let nextState;
      if (latest && latest.ownerId === active.ownerId) {
        if (latest.items.some(function (item) { return String(item.id) === String(scene.id); })) return;
        latest.items.push(scene);
        nextState = latest;
      } else {
        nextState = {
          version: 2,
          phase: 'queued',
          ownerId: active.ownerId,
          items: [scene],
          currentIndex: -1,
          queuedAt: Date.now()
        };
      }
      setState(nextState);
      toast('Play Next #' + nextState.items.length + ': ' + displayTitle(scene));
      log('Appended override', scene);
    } catch (error) {
      console.error('[' + PLUGIN + '] Could not queue scene:', error);
      toast('Play Next could not read that scene: ' + error.message, true);
    }
  }

  function cancelOverride(message) {
    selectionSerial++;
    const state = getState();
    if (state && state.phase === 'playing') {
      state.items = state.items.slice(0, state.currentIndex + 1);
      state.cancelAfterCurrent = true;
      setState(state);
      toast(message || 'Remaining overrides cleared. The current override will finish normally.');
    } else {
      setState(null);
      toast(message || 'Play Next queue cleared.');
    }
  }

  function onKeyDown(event) {
    const isN = event.code === 'KeyN' || String(event.key || '').toLowerCase() === 'n';
    if (!event.isTrusted || event.repeat || !isN || !event.shiftKey || event.ctrlKey || event.metaKey) return;
    if (isEditable(event.target)) return;

    if (event.altKey) {
      if (getState()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        cancelOverride();
      }
      return;
    }

    if (!hoveredCard) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    queueHoveredScene();
  }

  function displayTitle(scene) {
    return (scene && scene.title) || ('Scene ' + (scene && scene.id || ''));
  }

  function stateForThisPlayer() {
    const state = getState();
    return state && state.ownerId === OWNER_ID ? state : null;
  }

  function makeQueueUrl(sceneId, baseUrl, pageDelta, forceContinue) {
    const url = new URL(baseUrl || location.href, location.origin);
    url.pathname = '/scenes/' + sceneId;
    url.searchParams.delete('t');
    url.searchParams.set('autoplay', 'true');
    if (forceContinue) url.searchParams.set('continue', 'true');
    if (pageDelta && url.searchParams.has('qfp')) {
      const page = Math.max(1, Number(url.searchParams.get('qfp') || 1) + pageDelta);
      url.searchParams.set('qfp', String(page));
    }
    return url.pathname + url.search + url.hash;
  }

  function navigate(url) {
    window.history.replaceState({ playNext: true }, '', url);
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
  }

  async function determineReturnUrl(sceneId, baseUrl) {
    const runtime = pageRuntime;
    if (!runtime || !runtime.props) return null;
    const props = runtime.props;
    const scenes = Array.isArray(props.queueScenes) ? props.queueScenes : [];
    const index = scenes.findIndex(function (scene) { return String(scene.id) === String(sceneId); });
    if (index >= 0 && index < scenes.length - 1) {
      return makeQueueUrl(scenes[index + 1].id, baseUrl, 0, false);
    }
    if (index >= 0 && props.queueHasMoreScenes && typeof props.onQueueMoreScenes === 'function') {
      try {
        const loaded = await props.onQueueMoreScenes();
        if (Array.isArray(loaded) && loaded.length) return makeQueueUrl(loaded[0].id, baseUrl, 1, false);
      } catch (error) {
        console.warn('[' + PLUGIN + '] Could not pre-load the following queue page:', error);
      }
    }
    return null;
  }

  async function playOverride(trigger, startIndex) {
    const state = stateForThisPlayer();
    const sceneId = currentSceneId();
    if (!state || state.phase !== 'queued' || !sceneId) return false;
    const source = new URL(location.href);
    if (pageRuntime && pageRuntime.props) {
      source.searchParams.set('continue', String(!!pageRuntime.props.continuePlaylist));
    }
    const sourceUrl = source.pathname + source.search + source.hash;
    const returnUrl = await determineReturnUrl(sceneId, sourceUrl);
    const playingState = Object.assign({}, state, {
      phase: 'playing',
      currentIndex: Math.max(0, Math.min(Number(startIndex || 0), state.items.length - 1)),
      sourceId: sceneId,
      sourceUrl: sourceUrl,
      returnUrl: returnUrl,
      startedAt: Date.now(),
      trigger: trigger
    });
    setState(playingState);
    navigate(makeQueueUrl(playingState.items[playingState.currentIndex].id, sourceUrl, 0, true));
    log('Started override queue; original queue saved', { count: playingState.items.length, returnUrl: returnUrl });
    return true;
  }

  function finishOverride(direction) {
    const state = stateForThisPlayer();
    if (!state || state.phase !== 'playing') return false;
    if (direction === 'previous' && state.currentIndex > 0) {
      state.currentIndex--;
      setState(state);
      navigate(makeQueueUrl(state.items[state.currentIndex].id, state.sourceUrl, 0, true));
      return true;
    }
    if (direction !== 'previous' && !state.cancelAfterCurrent && state.currentIndex < state.items.length - 1) {
      state.currentIndex++;
      setState(state);
      navigate(makeQueueUrl(state.items[state.currentIndex].id, state.sourceUrl, 0, true));
      return true;
    }
    const destination = direction === 'previous' ? state.sourceUrl : state.returnUrl;
    setState(null);
    if (destination) navigate(destination);
    else toast('Play Next finished. The original queue had no following scene.');
    return true;
  }

  function jumpToOverride(index) {
    const state = stateForThisPlayer();
    if (!state || state.phase !== 'playing' || index < 0 || index >= state.items.length) return false;
    state.currentIndex = index;
    setState(state);
    navigate(makeQueueUrl(state.items[index].id, state.sourceUrl, 0, true));
    return true;
  }

  function removeOverride(index) {
    const state = stateForThisPlayer() || getState();
    if (!state || index < 0 || index >= state.items.length) return;
    if (state.phase === 'playing' && index === state.currentIndex) {
      toast('The currently playing override cannot be removed. Use Next or clear the remaining queue.', true);
      return;
    }
    const removed = state.items[index];
    state.items.splice(index, 1);
    if (state.phase === 'playing' && index < state.currentIndex) state.currentIndex--;
    if (!state.items.length) setState(null);
    else setState(state);
    toast('Removed from Play Next: ' + displayTitle(removed));
  }

  function virtualQueue(props, state) {
    const original = Array.isArray(props.queueScenes) ? props.queueScenes : [];
    if (!state || !state.items.length) return original;
    const overrideIds = new Set(state.items.map(function (scene) { return String(scene.id); }));
    const withoutTargets = original.filter(function (scene) { return !overrideIds.has(String(scene.id)); });
    const anchorId = state.phase === 'playing' ? state.sourceId : String(props.scene && props.scene.id);
    const anchor = withoutTargets.findIndex(function (scene) { return String(scene.id) === String(anchorId); });
    const insertAt = anchor >= 0 ? anchor + 1 : 0;
    const result = withoutTargets.slice();
    const overrides = state.items.map(function (scene, index) {
      return Object.assign({}, scene, { __playNextOverride: true, __playNextIndex: index });
    });
    result.splice.apply(result, [insertAt, 0].concat(overrides));
    return result;
  }

  function useStoreTick() {
    const pair = React.useState(0);
    React.useEffect(function () {
      const update = function (event) {
        if (!event || !event.key || event.key === STATE_KEY || event.key === ACTIVE_KEY) pair[1](function (v) { return v + 1; });
      };
      window.addEventListener('storage', update);
      window.addEventListener(CHANGE_EVENT, update);
      return function () {
        window.removeEventListener('storage', update);
        window.removeEventListener(CHANGE_EVENT, update);
      };
    }, []);
    return pair[0];
  }

  function PlayerPatch(componentProps) {
    useStoreTick();
    const Original = componentProps.original;
    const props = componentProps.props;
    playerRuntime = { props: props };

    React.useEffect(function () {
      startHeartbeat();
      const video = document.querySelector('video.vjs-tech, .video-js video, video');
      const onPlay = function () { markActivePlayer('playing'); };
      if (video) video.addEventListener('play', onPlay, true);
      const onFocus = function () { markActivePlayer('window-focus'); };
      window.addEventListener('focus', onFocus);
      return function () {
        if (video) video.removeEventListener('play', onPlay, true);
        window.removeEventListener('focus', onFocus);
        playerRuntime = null;
        stopHeartbeat();
      };
    }, []);

    const wrapped = Object.assign({}, props, {
      onNext: function () {
        const state = stateForThisPlayer();
        if (state && state.phase === 'playing') return finishOverride('next');
        if (state && state.phase === 'queued') return void playOverride('next-button');
        return props.onNext();
      },
      onPrevious: function () {
        const state = stateForThisPlayer();
        if (state && state.phase === 'playing') return finishOverride('previous');
        return props.onPrevious();
      },
      onComplete: function () {
        const state = stateForThisPlayer();
        if (state && state.phase === 'playing') return finishOverride('complete');
        if (state && state.phase === 'queued' && pageRuntime && pageRuntime.props.continuePlaylist) {
          return void playOverride('complete');
        }
        return props.onComplete();
      }
    });
    return h(Original, wrapped);
  }

  function ScenePagePatch(componentProps) {
    useStoreTick();
    const Original = componentProps.original;
    const props = componentProps.props;
    const state = stateForThisPlayer();
    pageRuntime = { props: props };

    React.useEffect(function () {
      return function () { pageRuntime = null; };
    }, []);

    const wrapped = Object.assign({}, props, {
      queueScenes: virtualQueue(props, state),
      onQueueNext: function () {
        if (state && state.phase === 'playing') return finishOverride('next');
        if (state && state.phase === 'queued') return void playOverride('queue-next');
        return props.onQueueNext();
      },
      onQueuePrevious: function () {
        if (state && state.phase === 'playing') return finishOverride('previous');
        return props.onQueuePrevious();
      },
      onQueueSceneClicked: function (id) {
        const overrideIndex = state ? state.items.findIndex(function (scene) { return String(scene.id) === String(id); }) : -1;
        if (overrideIndex >= 0) {
          if (state.phase === 'queued') return void playOverride('queue-click', overrideIndex);
          return jumpToOverride(overrideIndex);
        }
        if (state) setState(null);
        return props.onQueueSceneClicked(id);
      }
    });
    return h(Original, wrapped);
  }

  function QueueStatusPatch(componentProps) {
    useStoreTick();
    const Original = componentProps.original;
    const props = componentProps.props;
    const state = stateForThisPlayer();
    const originalContent = h(Original, props, props.children);
    if (!state) return originalContent;
    const text = state.phase === 'playing' ? 'Play Next overrides' : 'Queued Play Next overrides';
    const list = h('ol', { className: 'play-next-queue-list' }, state.items.map(function (scene, index) {
      const isPlaying = state.phase === 'playing' && index === state.currentIndex;
      return h('li', {
        key: String(scene.id),
        className: isPlaying ? 'play-next-item-playing' : ''
      },
      h('span', { className: 'play-next-item-title' }, (isPlaying ? 'Playing: ' : '') + displayTitle(scene)),
      h('button', {
        type: 'button',
        className: 'btn btn-sm btn-link play-next-remove',
        disabled: isPlaying,
        title: isPlaying ? 'Currently playing' : 'Remove this override',
        onClick: function () { removeOverride(index); }
      }, 'Remove'));
    }));
    const panel = h('div', {
      className: 'play-next-queue-status',
      role: 'status',
      'aria-live': 'polite'
    },
    h('span', { className: 'play-next-queue-label' }, text),
    list,
    h('button', {
      type: 'button',
      className: 'btn btn-sm btn-secondary play-next-cancel',
      onClick: function () { cancelOverride(); }
    }, state.phase === 'playing' ? 'Clear remaining' : 'Clear all'));
    return h(React.Fragment, null, panel, originalContent);
  }

  function installPatches() {
    if (!Api || !React || !Api.patch) {
      console.error('[' + PLUGIN + '] Stash PluginApi.patch is unavailable.');
      toast('Play Next needs a newer Stash version with UI plugin patches.', true);
      return;
    }
    Api.patch.instead('ScenePlayer', function (props) {
      const next = arguments[arguments.length - 1];
      return h(PlayerPatch, { original: next, props: props });
    });
    Api.patch.instead('ScenePage', function (props) {
      const next = arguments[arguments.length - 1];
      return h(ScenePagePatch, { original: next, props: props });
    });
    Api.patch.instead('ScenePage.TabContent', function (props) {
      const next = arguments[arguments.length - 1];
      return h(QueueStatusPatch, { original: next, props: props });
    });
  }

  function installStyles() {
    const style = document.createElement('style');
    style.id = 'play-next-styles';
    style.textContent = [
      '.play-next-queue-status{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap;padding:.55rem .7rem;margin:.55rem 0;border:1px solid rgba(255,105,180,.7);border-radius:.35rem;background:rgba(255,105,180,.12);color:inherit}',
      '.play-next-queue-label{color:#ff8fc7;font-weight:700}',
      '.play-next-hover-target{outline:2px solid rgba(255,105,180,.85)!important;outline-offset:2px}',
      '.play-next-queue-list{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin:0;padding:0;list-style:none;counter-reset:playnext}',
      '.play-next-queue-list li{display:flex;align-items:center;gap:.2rem;padding:.2rem .35rem;border-radius:.3rem;background:rgba(0,0,0,.2);counter-increment:playnext}',
      '.play-next-queue-list li:before{content:counter(playnext) ".";font-weight:700;color:#ff8fc7}',
      '.play-next-item-playing{outline:1px solid #ff69b4}',
      '.play-next-remove{padding:.05rem .25rem;color:inherit;text-decoration:underline}',
      '.play-next-cancel{margin-left:auto}',
      '.play-next-toast{position:fixed;right:1rem;bottom:1rem;z-index:2147483646;max-width:min(28rem,calc(100vw - 2rem));padding:.7rem .9rem;border-radius:.4rem;background:#20242a;color:#fff;border:1px solid #ff69b4;box-shadow:0 .3rem 1.2rem rgba(0,0,0,.45);font-weight:600}',
      '.play-next-toast.play-next-error{border-color:#dc3545}',
      '@media (max-width:575px){.play-next-queue-status{align-items:flex-start}.play-next-cancel{margin-left:0}}'
    ].join('');
    document.head.appendChild(style);
  }

  let toastTimer = null;
  function toast(message, error) {
    let node = document.getElementById('play-next-toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'play-next-toast';
      node.className = 'play-next-toast';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      document.body.appendChild(node);
    }
    node.classList.toggle('play-next-error', !!error);
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.hidden = true; }, error ? 5500 : 3500);
  }

  document.addEventListener('pointerover', onPointerOver, true);
  document.addEventListener('pointerout', onPointerOut, true);
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('beforeunload', function () {
    const active = getActivePlayer();
    if (active && active.ownerId === OWNER_ID) localStorage.removeItem(ACTIVE_KEY);
  });
  installStyles();
  installPatches();
  log('v' + VERSION + ' loaded. Hover a scene card and press Shift+N.');
})();


