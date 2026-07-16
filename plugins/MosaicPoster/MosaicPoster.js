/* =========================================================================
 * Mosaic Poster (Stash UI plugin)
 *
 * Replaces the pre-playback poster on the scene detail page (/scenes/{id})
 * with a 5x5 contact sheet (a whole-video overview) sampled evenly across
 * the video.
 *
 *  - Hi-res sheet: generated from the real video by the backend
 *    (MosaicPoster.py) via runPluginOperation, and served by Stash at
 *    /plugin/MosaicPoster/assets/generated/{oshash}.jpg. Generation runs
 *    Python on demand (2-3s the first time, cached afterwards). No standalone
 *    daemon, no fixed port, no OS-specific service.
 *  - While a sheet is being generated for the first time, the cover art stays
 *    visible and a small loading spinner appears next to the toggle; the mosaic
 *    is shown only once the hi-res sheet is ready.
 *  - The button at the top-right of the poster toggles cover art <-> mosaic in
 *    one click. The choice is stored in localStorage and remembered across all
 *    scenes (default: mosaic ON).
 *  - Overlay approach: the cover art is kept underneath; the mosaic layer is
 *    added/removed on top.
 *  - Never touches cover art on list/card views.
 * ========================================================================= */
(function () {
  "use strict";

  var DEFAULT_ON = true;
  var DEFAULT_SEEK = true;             // tapping a mosaic cell seeks the video there
  var SIZES = [3, 4, 5, 6, 7, 8];      // selectable N x N grids (16:9 cells -> 16:9 sheet)
  var DEFAULT_SIZE = 5;
  var PLUGIN_ID = "MosaicPoster";

  // Both the on/off default and the grid size live in plugin settings (editable
  // in Settings > Plugins) and are the source of truth, shared across devices.
  // Cached here for synchronous reads; the poster buttons write them back via
  // configurePlugin so the Settings page and the buttons stay in sync.
  var currentOn = DEFAULT_ON;
  var currentGrid = DEFAULT_SIZE;
  var currentSeek = DEFAULT_SEEK;
  var settingsLoaded = false; // don't kick generation until the real grid size is known

  // ---- i18n: only the JS strings can be localised (yml setting labels can't).
  // Keyed by Stash's interface language code, lower-cased. English is the
  // default: any language without an entry falls back to it. To add a language,
  // add an entry keyed by its lower-cased Stash code (e.g. "pt-br") or base code
  // (e.g. "de"); lookup tries the full code first, then the base code, then en.
  var DEFAULT_LANG = "en";
  // Covers every language Stash ships. Keyed by base language code (zh split
  // into zh-cn / zh-tw). Non-English strings are best-effort — corrections from
  // native speakers are welcome.
  var STRINGS = {
    en: { mosaic: "Mosaic", on: "Mosaic on — click to show cover art", off: "Mosaic off — click to show mosaic", size: "Mosaic grid size (click to change)" },
    af: { mosaic: "Mosaïek", on: "Mosaïek aan — klik om die omslag te wys", off: "Mosaïek af — klik om die mosaïek te wys", size: "Mosaïek-roostergrootte (klik om te verander)" },
    ar: { mosaic: "فسيفساء", on: "الفسيفساء مفعّلة — انقر لعرض صورة الغلاف", off: "الفسيفساء متوقفة — انقر لعرض الفسيفساء", size: "حجم شبكة الفسيفساء (انقر للتغيير)" },
    bg: { mosaic: "Мозайка", on: "Мозайката е включена — щракнете, за да покажете корицата", off: "Мозайката е изключена — щракнете, за да покажете мозайката", size: "Размер на мрежата на мозайката (щракнете, за да промените)" },
    bn: { mosaic: "মোজাইক", on: "মোজাইক চালু — কভার দেখাতে ক্লিক করুন", off: "মোজাইক বন্ধ — মোজাইক দেখাতে ক্লিক করুন", size: "মোজাইক গ্রিডের আকার (পরিবর্তন করতে ক্লিক করুন)" },
    ca: { mosaic: "Mosaic", on: "Mosaic activat — fes clic per mostrar la portada", off: "Mosaic desactivat — fes clic per mostrar el mosaic", size: "Mida de la quadrícula del mosaic (fes clic per canviar)" },
    cs: { mosaic: "Mozaika", on: "Mozaika zapnuta — kliknutím zobrazíte obal", off: "Mozaika vypnuta — kliknutím zobrazíte mozaiku", size: "Velikost mřížky mozaiky (kliknutím změníte)" },
    da: { mosaic: "Mosaik", on: "Mosaik til — klik for at vise omslaget", off: "Mosaik fra — klik for at vise mosaikken", size: "Mosaikkens gitterstørrelse (klik for at ændre)" },
    de: { mosaic: "Mosaik", on: "Mosaik an — klicken, um das Cover anzuzeigen", off: "Mosaik aus — klicken, um das Mosaik anzuzeigen", size: "Mosaik-Rastergröße (zum Ändern klicken)" },
    es: { mosaic: "Mosaico", on: "Mosaico activado — haz clic para ver la carátula", off: "Mosaico desactivado — haz clic para ver el mosaico", size: "Tamaño de la cuadrícula del mosaico (haz clic para cambiar)" },
    et: { mosaic: "Mosaiik", on: "Mosaiik sees — klõpsake kaanepildi kuvamiseks", off: "Mosaiik väljas — klõpsake mosaiigi kuvamiseks", size: "Mosaiigi ruudustiku suurus (klõpsake muutmiseks)" },
    fa: { mosaic: "موزاییک", on: "موزاییک روشن — برای نمایش کاور کلیک کنید", off: "موزاییک خاموش — برای نمایش موزاییک کلیک کنید", size: "اندازه شبکه موزاییک (برای تغییر کلیک کنید)" },
    fi: { mosaic: "Mosaiikki", on: "Mosaiikki päällä — näytä kansikuva napsauttamalla", off: "Mosaiikki pois — näytä mosaiikki napsauttamalla", size: "Mosaiikin ruudukon koko (muuta napsauttamalla)" },
    fr: { mosaic: "Mosaïque", on: "Mosaïque activée — cliquez pour afficher la jaquette", off: "Mosaïque désactivée — cliquez pour afficher la mosaïque", size: "Taille de la grille de la mosaïque (cliquez pour changer)" },
    hi: { mosaic: "मोज़ेक", on: "मोज़ेक चालू — कवर दिखाने के लिए क्लिक करें", off: "मोज़ेक बंद — मोज़ेक दिखाने के लिए क्लिक करें", size: "मोज़ेक ग्रिड आकार (बदलने के लिए क्लिक करें)" },
    hr: { mosaic: "Mozaik", on: "Mozaik uključen — kliknite za prikaz naslovnice", off: "Mozaik isključen — kliknite za prikaz mozaika", size: "Veličina mreže mozaika (kliknite za promjenu)" },
    hu: { mosaic: "Mozaik", on: "Mozaik be — kattintson a borító megjelenítéséhez", off: "Mozaik ki — kattintson a mozaik megjelenítéséhez", size: "Mozaik rácsméret (kattintson a módosításhoz)" },
    id: { mosaic: "Mozaik", on: "Mozaik aktif — klik untuk menampilkan sampul", off: "Mozaik nonaktif — klik untuk menampilkan mozaik", size: "Ukuran kisi mozaik (klik untuk mengubah)" },
    it: { mosaic: "Mosaico", on: "Mosaico attivo — clicca per mostrare la copertina", off: "Mosaico disattivato — clicca per mostrare il mosaico", size: "Dimensione della griglia del mosaico (clicca per cambiare)" },
    ja: { mosaic: "モザイク", on: "モザイク表示中 — クリックでジャケット", off: "モザイク非表示 — クリックでモザイク", size: "モザイクのマス数（クリックで変更）" },
    ko: { mosaic: "모자이크", on: "모자이크 켜짐 — 클릭하면 표지 표시", off: "모자이크 꺼짐 — 클릭하면 모자이크 표시", size: "모자이크 격자 크기 (클릭하여 변경)" },
    lt: { mosaic: "Mozaika", on: "Mozaika įjungta — spustelėkite, kad būtų rodomas viršelis", off: "Mozaika išjungta — spustelėkite, kad būtų rodoma mozaika", size: "Mozaikos tinklelio dydis (spustelėkite, kad pakeistumėte)" },
    lv: { mosaic: "Mozaīka", on: "Mozaīka ieslēgta — noklikšķiniet, lai parādītu vāku", off: "Mozaīka izslēgta — noklikšķiniet, lai parādītu mozaīku", size: "Mozaīkas režģa izmērs (noklikšķiniet, lai mainītu)" },
    nb: { mosaic: "Mosaikk", on: "Mosaikk på — klikk for å vise omslaget", off: "Mosaikk av — klikk for å vise mosaikken", size: "Mosaikkens rutenettstørrelse (klikk for å endre)" },
    ne: { mosaic: "मोजाइक", on: "मोजाइक अन — कभर देखाउन क्लिक गर्नुहोस्", off: "मोजाइक अफ — मोजाइक देखाउन क्लिक गर्नुहोस्", size: "मोजाइक ग्रिड आकार (परिवर्तन गर्न क्लिक गर्नुहोस्)" },
    nl: { mosaic: "Mozaïek", on: "Mozaïek aan — klik om de hoes te tonen", off: "Mozaïek uit — klik om het mozaïek te tonen", size: "Mozaïek-rastergrootte (klik om te wijzigen)" },
    nn: { mosaic: "Mosaikk", on: "Mosaikk på — klikk for å vise omslaget", off: "Mosaikk av — klikk for å vise mosaikken", size: "Mosaikk-rutenettstorleik (klikk for å endre)" },
    pl: { mosaic: "Mozaika", on: "Mozaika włączona — kliknij, aby pokazać okładkę", off: "Mozaika wyłączona — kliknij, aby pokazać mozaikę", size: "Rozmiar siatki mozaiki (kliknij, aby zmienić)" },
    pt: { mosaic: "Mosaico", on: "Mosaico ativado — clique para mostrar a capa", off: "Mosaico desativado — clique para mostrar o mosaico", size: "Tamanho da grade do mosaico (clique para alterar)" },
    ro: { mosaic: "Mozaic", on: "Mozaic activat — dați clic pentru a afișa coperta", off: "Mozaic dezactivat — dați clic pentru a afișa mozaicul", size: "Dimensiunea grilei mozaicului (dați clic pentru a schimba)" },
    ru: { mosaic: "Мозаика", on: "Мозаика включена — нажмите, чтобы показать обложку", off: "Мозаика выключена — нажмите, чтобы показать мозаику", size: "Размер сетки мозаики (нажмите, чтобы изменить)" },
    sk: { mosaic: "Mozaika", on: "Mozaika zapnutá — kliknutím zobrazíte obal", off: "Mozaika vypnutá — kliknutím zobrazíte mozaiku", size: "Veľkosť mriežky mozaiky (kliknutím zmeníte)" },
    sv: { mosaic: "Mosaik", on: "Mosaik på — klicka för att visa omslaget", off: "Mosaik av — klicka för att visa mosaiken", size: "Mosaikens rutnätsstorlek (klicka för att ändra)" },
    th: { mosaic: "โมเสก", on: "เปิดโมเสก — คลิกเพื่อแสดงปก", off: "ปิดโมเสก — คลิกเพื่อแสดงโมเสก", size: "ขนาดตารางโมเสก (คลิกเพื่อเปลี่ยน)" },
    tr: { mosaic: "Mozaik", on: "Mozaik açık — kapağı göstermek için tıklayın", off: "Mozaik kapalı — mozaiği göstermek için tıklayın", size: "Mozaik ızgara boyutu (değiştirmek için tıklayın)" },
    uk: { mosaic: "Мозаїка", on: "Мозаїка увімкнена — натисніть, щоб показати обкладинку", off: "Мозаїка вимкнена — натисніть, щоб показати мозаїку", size: "Розмір сітки мозаїки (натисніть, щоб змінити)" },
    ur: { mosaic: "موزیک", on: "موزیک آن — کور دکھانے کے لیے کلک کریں", off: "موزیک آف — موزیک دکھانے کے لیے کلک کریں", size: "موزیک گرڈ سائز (تبدیل کرنے کے لیے کلک کریں)" },
    vi: { mosaic: "Khảm", on: "Bật khảm — nhấp để hiện ảnh bìa", off: "Tắt khảm — nhấp để hiện khảm", size: "Kích thước lưới khảm (nhấp để thay đổi)" },
    "zh-cn": { mosaic: "马赛克", on: "马赛克开 — 点击显示封面", off: "马赛克关 — 点击显示马赛克", size: "马赛克网格大小（点击更改）" },
    "zh-tw": { mosaic: "馬賽克", on: "馬賽克開 — 點擊顯示封面", off: "馬賽克關 — 點擊顯示馬賽克", size: "馬賽克網格大小（點擊變更）" },
  };
  function pickStrings(lang) {
    lang = (lang || "").toLowerCase();                 // e.g. "ja-jp"
    if (STRINGS[lang]) return STRINGS[lang];           // exact, e.g. "pt-br"
    var base = lang.split("-")[0];                     // e.g. "ja"
    if (STRINGS[base]) return STRINGS[base];
    return STRINGS[DEFAULT_LANG];
  }
  var T = STRINGS[DEFAULT_LANG];

  // Cache/URL key for a given scene sheet at a given grid size.
  function sheetKey(oshash, n) { return oshash + "_" + n + "x" + n; }

  // Generated sheets are served by Stash as plugin assets (same origin).
  function assetUrl(oshash, n) {
    return "/plugin/" + PLUGIN_ID + "/assets/generated/" + sheetKey(oshash, n) + ".jpg";
  }

  // Call the generation backend (Stash runs the Python). Promise<output|null>.
  function runOp(args) {
    return fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        query: "mutation($id:ID!,$a:Map){runPluginOperation(plugin_id:$id,args:$a)}",
        variables: { id: PLUGIN_ID, a: args },
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) { return (j && j.data && j.data.runPluginOperation) || null; })
      .catch(function () { return null; });
  }

  var infoCache   = new Map(); // sceneId  -> Promise<{oshash}|null>
  var probeCache  = new Map(); // sheetKey -> Promise<url|null> (existence check, no generation)
  var hiresReady  = new Set(); // sheetKey -> confirmed generated (no need to re-probe)
  var genInFlight = new Map(); // sheetKey -> Promise<url|null> (generation in progress; dedupes)

  /* ---------- state ----------
   * currentOn = the global default (plugin setting, shared across devices).
   * Each scene may override it locally via the poster button; the override is
   * stored per scene in localStorage and wins over the default for that scene. */
  var OV_PREFIX = "MosaicPoster.ov."; // per-scene override key prefix

  function overrideFor(id) {
    if (!id) return null;
    var v = localStorage.getItem(OV_PREFIX + id);
    return v === null ? null : (v === "1");
  }
  function sceneEnabled(id) {
    var o = overrideFor(id);
    return o === null ? currentOn : o;
  }
  function isEnabled() { return sceneEnabled(currentSceneId()); }
  // The poster button toggles THIS scene only; the global default is unchanged.
  function setEnabled(on) {
    var id = currentSceneId();
    if (id) localStorage.setItem(OV_PREFIX + id, on ? "1" : "0");
  }

  function clampSize(v) {
    var n = parseInt(v, 10);
    if (isNaN(n)) return null;
    return Math.max(SIZES[0], Math.min(SIZES[SIZES.length - 1], n));
  }
  function currentSize() { return currentGrid; }
  function cycleSize() {
    var i = SIZES.indexOf(currentSize());
    var next = SIZES[(i + 1) % SIZES.length];
    currentGrid = next;
    persistGrid(next);   // write back to the plugin setting (keeps Settings page in sync)
    return next;
  }

  function asBool(v) {
    if (v === true || v === false) return v;
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  }

  // Pick the string table from Stash's UI language (e.g. "ja-JP" -> Japanese).
  function loadLanguage() {
    return fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ query: "{configuration{interface{language}}}" }),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        try { T = pickStrings(j.data.configuration.interface.language); } catch (e) {}
      })
      .catch(function () {});
  }

  function readSettings() {
    return fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ query: "{configuration{plugins}}" }),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        try { return (j.data.configuration.plugins || {})[PLUGIN_ID] || {}; }
        catch (e) { return {}; }
      })
      .catch(function () { return {}; });
  }

  // Read on/off + grid size from the plugin settings (source of truth) into the
  // caches. When a setting is unset, initialise it to the default so the
  // Settings page reflects the actual behaviour.
  function loadSettings() {
    return readSettings().then(function (cfg) {
      var on = asBool(cfg.defaultOn);
      if (on !== null) currentOn = on;
      var n = clampSize(cfg.gridSize);
      if (n !== null) currentGrid = n;
      var sk = asBool(cfg.tapToSeek);
      if (sk !== null) currentSeek = sk;
      var patch = {};
      if (on === null) patch.defaultOn = currentOn;
      if (n === null) patch.gridSize = currentGrid;
      if (sk === null) patch.tapToSeek = currentSeek;
      if (Object.keys(patch).length) configure(patch); // initialise unset setting(s)
      settingsLoaded = true;
    });
  }

  // configurePlugin REPLACES the whole settings map, so read-modify-write: merge
  // the patch onto the current settings (preserving cacheMax and anything else).
  function configure(patch) {
    return readSettings().then(function (cur) {
      var merged = Object.assign({}, cur, patch);
      return fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          query: "mutation($id:ID!,$in:Map!){configurePlugin(plugin_id:$id,input:$in)}",
          variables: { id: PLUGIN_ID, in: merged },
        }),
      });
    }).catch(function () {});
  }
  function persistGrid(n) { return configure({ gridSize: n }); }

  function currentSceneId() {
    var m = location.pathname.match(/^\/scenes\/(\d+)(?:\/|$)/);
    return m ? m[1] : null;
  }

  /* ---------- scene info (oshash + duration) ---------- */
  function fetchInfo(id) {
    if (infoCache.has(id)) return infoCache.get(id);
    var p = fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        query: "query($id:ID!){findScene(id:$id){files{duration fingerprints{type value}}}}",
        variables: { id: id },
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        try {
          var sc = j.data.findScene;
          var f0 = sc.files[0] || {}, fps = f0.fingerprints || [];
          var oshash = null;
          for (var i = 0; i < fps.length; i++) {
            if (fps[i].type === "oshash") { oshash = fps[i].value; break; }
          }
          return { oshash: oshash, duration: f0.duration || 0 };
        } catch (e) { return null; }
      })
      .catch(function () { infoCache.delete(id); return null; });
    infoCache.set(id, p);
    return p;
  }

  function loadImage(src, crossOrigin) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      if (crossOrigin) img.crossOrigin = "anonymous";
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  /* ---------- hi-res sheet (Stash-served + generation backend) ----------
   * probe and generate are split. On navigation we first probeHires (just
   * checks whether the sheet already exists); if so we show it immediately.
   * Only when it is missing do we keep the cover art visible, show a loading
   * spinner, and generate the sheet in the background. */

  // Check whether a generated sheet already exists (without generating it).
  // Exists -> resolve URL. Missing -> null.
  // Just loads the Stash-served static URL as an image (same origin).
  function probeHires(oshash, n) {
    if (!oshash) return Promise.resolve(null);
    var key = sheetKey(oshash, n);
    if (hiresReady.has(key)) return Promise.resolve(assetUrl(oshash, n));
    if (probeCache.has(key)) return probeCache.get(key);
    var url = assetUrl(oshash, n);
    var p = loadImage(url)
      .then(function () { hiresReady.add(key); return url; })       // confirmed present
      .catch(function () { probeCache.delete(key); return null; }); // missing -> re-checkable
    probeCache.set(key, p);
    return p;
  }

  // When missing, ask the backend to generate it, then return the URL (2-3s).
  // In-flight generations are de-duped so repeated renders don't re-request.
  function generateHires(id, oshash, n) {
    if (!oshash) return Promise.resolve(null);
    var key = sheetKey(oshash, n);
    if (hiresReady.has(key)) return Promise.resolve(assetUrl(oshash, n));
    if (genInFlight.has(key)) return genInFlight.get(key);
    var url = assetUrl(oshash, n);
    var p = runOp({ mode: "generate", scene_id: id, n: n })
      .then(function () { return loadImage(url); })   // load the served URL after generation
      .then(function () { hiresReady.add(key); return url; })
      .catch(function () { return null; })            // generation failed -> keep the cover
      .then(function (res) { genInFlight.delete(key); return res; });
    genInFlight.set(key, p);
    return p;
  }

  /* ---------- seek: tap a mosaic cell to jump there ---------- */
  // Seek the video.js player (or the raw <video>) to t seconds and play.
  function seekTo(t) {
    try {
      var root = document.querySelector(".video-js");
      if (window.videojs && root) {
        var p = window.videojs.getPlayer ? window.videojs.getPlayer(root) : window.videojs(root);
        if (p) {
          var seek = function () { try { p.currentTime(t); } catch (e) {} };
          var pr = p.play();
          if (pr && pr.then) pr.then(seek, seek);
          p.one("loadedmetadata", seek);
          p.one("playing", seek);
          return;
        }
      }
    } catch (e) {}
    var v = document.querySelector(".vjs-tech");
    if (v && v.tagName === "VIDEO") {
      var apply = function () { try { v.currentTime = t; } catch (e) {} };
      try { var r = v.play(); if (r && r.then) r.then(apply, apply); } catch (e) {}
      if (v.readyState >= 1) apply();
      v.addEventListener("loadedmetadata", apply, { once: true });
      v.addEventListener("playing", apply, { once: true });
    }
  }

  // The sheet is always 16:9 (N x N of 16:9 cells) drawn with
  // background-size:contain, so work out the displayed image rect (accounting
  // for any letterboxing) and the per-cell size within the overlay.
  function cellGeom(ov) {
    var n = parseInt(ov.getAttribute("data-mp-n"), 10);
    if (!n) return null;
    var rect = ov.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    var aspect = 16 / 9, iw, ih;
    if (rect.width / rect.height > aspect) { ih = rect.height; iw = ih * aspect; }
    else { iw = rect.width; ih = iw / aspect; }
    return { n: n, rect: rect, iw: iw, ih: ih,
             ox: (rect.width - iw) / 2, oy: (rect.height - ih) / 2, cw: iw / n, ch: ih / n };
  }
  // Which cell (col,row) is at the given client point? null if in the letterbox.
  function cellAt(g, clientX, clientY) {
    var x = clientX - g.rect.left - g.ox, y = clientY - g.rect.top - g.oy;
    if (x < 0 || y < 0 || x > g.iw || y > g.ih) return null;
    return { col: Math.max(0, Math.min(g.n - 1, Math.floor(x / g.cw))),
             row: Math.max(0, Math.min(g.n - 1, Math.floor(y / g.ch))) };
  }

  // Tap a cell -> seek to that cell's timestamp (matches the backend sampling).
  function onOverlayClick(e) {
    if (!currentSeek) return;
    var ov = e.currentTarget;
    if (ov.style.display === "none") return;
    var g = cellGeom(ov); if (!g) return;
    var c = cellAt(g, e.clientX, e.clientY); if (!c) return;
    var dur = parseFloat(ov.getAttribute("data-mp-dur")) || 0;
    var idx = c.row * g.n + c.col;
    e.preventDefault(); e.stopPropagation();
    seekTo(dur > 0 ? dur * (idx + 0.5) / (g.n * g.n) : 0);
  }

  // Highlight the cell under the cursor (desktop hover) so it's clear what a
  // click would seek to.
  function onOverlayMove(e) {
    var ov = e.currentTarget;
    var hi = ov.querySelector(".mp-cell-hi"); if (!hi) return;
    if (!currentSeek || ov.style.display === "none") { setStyle(hi, "display", "none"); return; }
    var g = cellGeom(ov);
    var c = g && cellAt(g, e.clientX, e.clientY);
    if (!c) { setStyle(hi, "display", "none"); return; }
    setStyle(hi, "left", (g.ox + c.col * g.cw) + "px");
    setStyle(hi, "top", (g.oy + c.row * g.ch) + "px");
    setStyle(hi, "width", g.cw + "px");
    setStyle(hi, "height", g.ch + "px");
    setStyle(hi, "display", "block");
  }
  function onOverlayLeave(e) {
    var hi = e.currentTarget.querySelector(".mp-cell-hi");
    if (hi) setStyle(hi, "display", "none");
  }

  /* ---------- DOM (overlay + toggle button) ---------- */
  function ensureOverlay(poster) {
    var ov = poster.querySelector(".mp-overlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.className = "mp-overlay";
      ov.style.display = "none";
      var hi = document.createElement("div");   // hovered-cell highlight
      hi.className = "mp-cell-hi";
      hi.style.display = "none";
      ov.appendChild(hi);
      ov.addEventListener("click", onOverlayClick);
      ov.addEventListener("mousemove", onOverlayMove);
      ov.addEventListener("mouseleave", onOverlayLeave);
      poster.appendChild(ov);
    }
    return ov;
  }
  // "Mosaic" label + on/off switch. The switch reflects the CURRENT state
  // (on = mosaic shown for this scene), which is clearer than a button that
  // shows what the next click would switch to.
  function ensureButton(poster) {
    var btn = poster.querySelector(".mp-toggle");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mp-toggle";
      var spin = document.createElement("span");   // loading spinner (hidden unless generating)
      spin.className = "mp-spin";
      spin.style.display = "none";
      var lbl = document.createElement("span");
      lbl.className = "mp-toggle-label";
      lbl.textContent = T.mosaic;
      var sw = document.createElement("span");
      sw.className = "mp-switch";
      sw.appendChild(document.createElement("span")).className = "mp-knob";
      btn.appendChild(spin);
      btn.appendChild(lbl);
      btn.appendChild(sw);
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        setEnabled(!isEnabled()); render();
      });
      poster.appendChild(btn);
    }
    return btn;
  }
  // Show/hide the loading spinner in the toggle (while a sheet is generating).
  function setLoading(poster, on) {
    var btn = poster.querySelector(".mp-toggle");
    var spin = btn && btn.querySelector(".mp-spin");
    if (spin) setStyle(spin, "display", on ? "inline-block" : "none");
  }
  // Grid-size button: cycles 3×3 -> ... -> 8×8 -> back to 3×3 (only in mosaic mode).
  function ensureSizeButton(poster) {
    var btn = poster.querySelector(".mp-size");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mp-size";
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        cycleSize();
        resetWarm();   // re-warm the visible cards at the new size
        render();
      });
      poster.appendChild(btn);
    }
    return btn;
  }
  function setStyle(el, prop, val) { if (el.style[prop] !== val) el.style[prop] = val; }

  // Still showing the same scene at the same grid size, and mosaic still on?
  function stillCurrent(id, n) {
    return currentSceneId() === id && isEnabled() && currentSize() === n;
  }

  // Apply the mosaic background to the overlay (write nothing if identical, to
  // avoid a MutationObserver loop).
  function applyBg(ov, id, url) {
    var curId = ov.getAttribute("data-mp-id");
    var curUrl = ov.getAttribute("data-mp-url");
    if (curId === id && curUrl === url) return; // identical -> no-op
    ov.setAttribute("data-mp-id", id);
    ov.setAttribute("data-mp-url", url);
    setStyle(ov, "backgroundImage", 'url("' + url + '")');
    setStyle(ov, "display", "block");
  }

  /* ---------- render (idempotent) ---------- */
  function render() {
    var id = currentSceneId();
    if (!id) return;
    var poster = document.querySelector(".vjs-poster");
    if (!poster) return;

    var on = isEnabled();
    var n = currentSize();
    var view = id + ":" + n; // overlay identity: resets when scene OR size changes

    var btn = ensureButton(poster);
    var lbl = btn.querySelector(".mp-toggle-label");
    if (lbl && lbl.textContent !== T.mosaic) lbl.textContent = T.mosaic;
    if (btn.classList.contains("mp-on") !== on) btn.classList.toggle("mp-on", on);
    var ap = on ? "true" : "false";
    if (btn.getAttribute("aria-pressed") !== ap) btn.setAttribute("aria-pressed", ap);
    var tip = on ? T.on : T.off;
    if (btn.title !== tip) btn.title = tip;

    var sizeBtn = ensureSizeButton(poster);
    var sizeLabel = "⊞ " + n + "×" + n;
    if (sizeBtn.textContent !== sizeLabel) sizeBtn.textContent = sizeLabel;
    if (sizeBtn.title !== T.size) sizeBtn.title = T.size;
    setStyle(sizeBtn, "display", on ? "inline-flex" : "none"); // only in mosaic mode

    var seekable = on && currentSeek;

    var ov = ensureOverlay(poster);
    if (ov.classList.contains("mp-seekable") !== seekable) ov.classList.toggle("mp-seekable", seekable);
    if (!on) {                              // cover art underneath shows through
      setStyle(ov, "display", "none");
      setLoading(poster, false);
      return;
    }

    // Reset overlay state when the scene or grid size changes.
    if (ov.getAttribute("data-mp-id") !== view) {
      ov.setAttribute("data-mp-id", view);
      ov.setAttribute("data-mp-n", n);
      ov.removeAttribute("data-mp-url");
      setStyle(ov, "display", "none");
    }

    fetchInfo(id).then(function (info) {
      if (!stillCurrent(id, n)) return;
      var oshash = (info || {}).oshash;
      var dur = (info || {}).duration || 0;

      // Already generated? show it right away. Otherwise keep the cover art
      // visible and show the loading spinner while the sheet is generated.
      probeHires(oshash, n).then(function (hurl) {
        if (!stillCurrent(id, n)) return;
        var q = document.querySelector(".vjs-poster"); if (!q) return;
        var ovq = ensureOverlay(q);
        ovq.setAttribute("data-mp-n", n);
        ovq.setAttribute("data-mp-dur", dur);  // for cell -> timestamp seeking

        if (hurl) {                          // ready -> show the mosaic
          setLoading(q, false);
          applyBg(ovq, view, hurl);
          return;
        }

        // Not generated yet: cover art stays, spinner on, generate in background.
        setStyle(ensureOverlay(q), "display", "none");
        setLoading(q, true);
        generateHires(id, oshash, n).then(function (gurl) {
          if (!stillCurrent(id, n)) return;
          var r = document.querySelector(".vjs-poster"); if (!r) return;
          setLoading(r, false);
          if (gurl) applyBg(ensureOverlay(r), view, gurl);
        });
      });
    });
  }

  /* ---------- Viewport-following warm (pre-generation) ----------
   * Pre-generate sheets only for cards that are visible or about to become
   * visible (looking ahead downward), so navigating into their detail page
   * shows the hi-res sheet immediately (no 2s wait). Whether the list shows
   * 40 or 1000 cards, warm only touches the neighbourhood of the viewport, so
   * CPU/disk is spent only on what you actually scroll past — never the whole
   * list blindly.
   *  - Scene ids are collected via IntersectionObserver (~1.5 screens ahead)
   *    and flushed to the backend in small batches, one operation in flight at
   *    a time, so at most one ffmpeg runs for warm. Once queued, unobserve.
   */
  var WARM_BATCH = 8;                // scene ids per backend call
  var warmSeen = new Set();          // scene ids already queued this session
  var warmPending = [];              // ids waiting to be flushed
  var warmInFlight = false;
  var observedLinks = new WeakSet(); // cards already observed (avoid re-observe)

  function linkSceneId(a) {
    var m = (a.getAttribute("href") || "").match(/^\/scenes\/(\d+)/);
    return m ? m[1] : null;
  }

  // Send the next batch of pending ids to the backend at the current grid size;
  // chain until drained so only one operation (one ffmpeg) runs at a time.
  function flushWarm() {
    if (warmInFlight || !warmPending.length || !currentOn) return; // gate on global default
    var batch = warmPending.splice(0, WARM_BATCH);
    warmInFlight = true;
    runOp({ mode: "warm", scene_ids: batch, n: currentSize() }).then(function () {
      warmInFlight = false;
      flushWarm();
    });
  }

  // Queue a card for warming. Returns true if it was queued or is not needed
  // (safe to unobserve), false if warming is currently disabled (keep watching
  // so it can be picked up after the user toggles mosaic back on).
  function tryWarm(a) {
    if (!currentOn) return false; // gate on global default (per-scene overrides don't drive warm)
    var id = linkSceneId(a);
    if (!id) return true;
    if (id === currentSceneId() || warmSeen.has(id)) return true;
    warmSeen.add(id);
    warmPending.push(id);
    flushWarm();
    return true;
  }

  // On a grid-size change, forget what was warmed and re-observe the cards so
  // the now-visible ones get pre-generated at the new size.
  function resetWarm() {
    warmSeen = new Set();
    warmPending = [];
    observedLinks = new WeakSet();
    observeCards();
  }

  // Look ~1.5 screens ahead (downward) and only warm cards near the viewport.
  var warmIO = ("IntersectionObserver" in window)
    ? new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (!e.isIntersecting) continue;
          if (tryWarm(e.target)) warmIO.unobserve(e.target);
        }
      }, { root: null, rootMargin: "600px 0px 1200px 0px", threshold: 0 })
    : null;

  // Register any not-yet-observed scene cards currently in the DOM.
  function observeCards() {
    if (!warmIO) return;
    var links = document.querySelectorAll('a[href^="/scenes/"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (observedLinks.has(a) || !linkSceneId(a)) continue;
      observedLinks.add(a);
      warmIO.observe(a);
    }
  }

  // Kick generation for the current scene as soon as we know it, independent of
  // the poster DOM or tab focus. This only talks to the backend (fetch works in
  // background tabs), so a scene opened in an inactive tab starts generating
  // right away instead of waiting for the tab to become active.
  function maybeGenerate() {
    if (!settingsLoaded) return;              // wait until the real grid size is known
    var id = currentSceneId();
    if (!id || !isEnabled()) return;
    var n = currentSize();
    fetchInfo(id).then(function (info) {
      var oshash = (info || {}).oshash;
      if (!oshash) return;
      probeHires(oshash, n).then(function (url) {
        if (!url) generateHires(id, oshash, n); // start generation now (deduped)
      });
    });
  }

  /* ---------- SPA following (DOM observer) ----------
   * Debounce with setTimeout, NOT requestAnimationFrame: rAF is paused in
   * background/inactive tabs, so a scene opened in a background tab would not
   * generate until activated. setTimeout still fires (just throttled) when hidden. */
  var scheduled = false;
  var obs = new MutationObserver(function () {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () { scheduled = false; render(); observeCards(); maybeGenerate(); }, 0);
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // Load language + settings, then render/warm/generate at the resolved values.
  Promise.all([loadSettings(), loadLanguage()]).then(function () {
    resetWarm(); render(); maybeGenerate();
  });
  render();
  observeCards();
})();
