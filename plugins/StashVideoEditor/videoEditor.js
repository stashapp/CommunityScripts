(function () {
  "use strict";
  const PluginApi = window.PluginApi;
  if (!PluginApi) { console.warn("[StashVideoEditor] PluginApi not ready"); return; }

  const React = PluginApi.React; // core API — safe at load time
  const { useState, useRef, useCallback, useEffect } = React;

  const CONTAINER = { w: 720, h: 405 };
  const LOUPE = { w: 184, h: 140 };   // magnifier panel, in container px (= source px at 1:1)
  const MIN_BOX = 20;
  const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"]; // 8 resize handles

  // Presentational crop/frame rectangle with 8 resize handles + a draggable body.
  // props: { box:{x,y,w,h}, mode:"crop"|"stretch", onHandleDown:(handle)=>(e)=>void,
  //          onHandleEnter?, onHandleLeave?, activeHandle? }
  function CropBox(props) {
    const box = props.box;
    const handleEls = HANDLES.map((h) =>
      React.createElement("div", {
        key: h,
        className: "sve-handle sve-handle-" + h + (props.activeHandle === h ? " sve-handle-active" : ""),
        onMouseDown: props.onHandleDown(h),
        onMouseEnter: props.onHandleEnter && props.onHandleEnter(h),
        onMouseLeave: props.onHandleLeave && props.onHandleLeave(h),
      })
    );
    return React.createElement("div", {
      className: "sve-crop-box" + (props.mode === "stretch" ? " sve-frame" : ""),
      style: { left: box.x + "px", top: box.y + "px", width: box.w + "px", height: box.h + "px" },
      onMouseDown: props.onHandleDown("move"),
    }, handleEls);
  }

  // Did the last drawImage actually paint anything? Sampled at the corners and centre;
  // a tainted canvas throws, which counts as unusable too.
  function canvasIsBlank(ctx, w, h) {
    const pts = [[w >> 1, h >> 1], [1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]];
    try {
      for (let i = 0; i < pts.length; i++) {
        if (ctx.getImageData(pts[i][0], pts[i][1], 1, 1).data[3] !== 0) return false;
      }
      return true;
    } catch (err) {
      return true;
    }
  }

  // Mark the cut on the loupe. Every mark lands on the side being REMOVED — the whole
  // region gets a red wash and the boundary pixel row/column gets a solid line — so the
  // kept pixels are never painted over and "which side goes" needs no interpretation.
  // Geometry (including which row the line belongs on, which differs between a top and
  // a bottom edge) comes from cropLoupe.cutBands so it is unit-tested rather than
  // eyeballed here.
  function drawCut(ctx, s, lp) {
    const bands = lp.cutBands(s, LOUPE);
    ctx.fillStyle = "rgba(244,67,54,0.28)";
    bands.washes.forEach((r) => { if (r.w > 0 && r.h > 0) ctx.fillRect(r.x, r.y, r.w, r.h); });
    bands.lines.forEach((r) => {
      ctx.fillStyle = "rgba(0,0,0,0.75)"; // halo, also on the removed side only
      ctx.fillRect(r.x - (r.w === 1 ? 1 : 0), r.y - (r.h === 1 ? 1 : 0),
                   r.w === 1 ? 2 : r.w, r.h === 1 ? 2 : r.h);
      ctx.fillStyle = "#ff5252";
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });
    drawLegend(ctx, s);
  }

  // A two-word legend in the corners: which half is going, which is staying. Cheaper to
  // read than a caption, and it survives being glanced at mid-drag.
  function drawLegend(ctx, s) {
    const tag = (text, x, y, align, color) => {
      ctx.font = "600 9px system-ui, sans-serif";
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      const w = ctx.measureText(text).width + 8;
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(align === "right" ? x - w : x, y - 7, w, 14);
      ctx.fillStyle = color;
      ctx.fillText(text, align === "right" ? x - 4 : x + 4, y);
    };
    const CUT = "#ff8a80", KEEP = "#a5d6a7";
    if (s.hair.y != null && s.hair.x == null) {
      const above = s.keep.y === "below";
      tag(above ? "CUT" : "KEEP", 4, 9, "left", above ? CUT : KEEP);
      tag(above ? "KEEP" : "CUT", 4, LOUPE.h - 9, "left", above ? KEEP : CUT);
    } else if (s.hair.x != null && s.hair.y == null) {
      const left = s.keep.x === "right";
      tag(left ? "CUT" : "KEEP", 4, 9, "left", left ? CUT : KEEP);
      tag(left ? "KEEP" : "CUT", LOUPE.w - 4, 9, "right", left ? KEEP : CUT);
    } else if (s.hair.x != null) {
      // Corner: only the quadrant inside BOTH kept sides survives, so label that one.
      const kx = s.keep.x;                                   // "left" | "right"
      const ky = s.keep.y === "below" ? "bottom" : "top";
      tag("KEEP", kx === "left" ? 4 : LOUPE.w - 4, ky === "top" ? 9 : LOUPE.h - 9,
          kx === "left" ? "left" : "right", KEEP);
    }
  }

  // Stash can be served under a sub-path (a reverse proxy at /stash/). Every request
  // and stream URL is built from the page's <base href>, never from "/".
  function baseURL() {
    const b = document.querySelector("base");
    const href = (b && b.getAttribute("href")) || "/";
    return href.endsWith("/") ? href : href + "/";
  }

  // GraphQL call that REJECTS on a GraphQL error. A helper that returns only `data`
  // makes a refused mutation look exactly like a queued one.
  async function gql(query, variables) {
    const res = await fetch(baseURL() + "graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, variables: variables || {} }),
    });
    if (!res.ok) throw new Error("Stash answered HTTP " + res.status);
    const body = await res.json();
    if (body.errors && body.errors.length) {
      throw new Error(body.errors.map((e) => e.message).join("; "));
    }
    return body.data || {};
  }

  // Queue one of this plugin's tasks. Resolves with the job id; rejects when Stash
  // did not queue it (plugin disabled, session expired, manifest not reloaded).
  async function runTask(taskName, args) {
    const query = `mutation Run($task: String!, $args: Map!) {
      runPluginTask(plugin_id: "StashVideoEditor", task_name: $task, args_map: $args)
    }`;
    const data = await gql(query, { task: taskName, args: args });
    if (!data.runPluginTask) throw new Error("Stash did not queue the task");
    return data.runPluginTask;
  }

  function runCropTask(sceneId, crop, outW, outH) {
    return runTask("Crop and re-encode", { mode: "crop_reencode", scene_id: sceneId,
                                           crop, out_w: outW, out_h: outH });
  }

  // Image clips have no imageAssignFile/imageMerge, so the backend does an
  // overwrite-in-place swap (see video_editor.py:image_crop). Same crop geometry,
  // different id. Reuses the "Crop and re-encode" task; mode drives dispatch.
  function runImageCropTask(imageId, crop, outW, outH) {
    return runTask("Crop and re-encode", { mode: "image_crop", image_id: imageId,
                                           crop, out_w: outW, out_h: outH });
  }

  const MIN_TRIM = 0.25; // seconds — shortest selectable trim range

  function runTrimTask(sceneId, start, end, lossless) {
    return runTask("Trim", { mode: lossless ? "lossless_trim" : "precision_trim",
                             scene_id: sceneId, start, end });
  }

  // A scene's direct stream. Stash supplies the URL on the scene (paths.stream);
  // the fallback builds it under the base path.
  function sceneStreamUrl(sceneId, given) {
    return given || (baseURL() + "scene/" + sceneId + "/stream");
  }

  const QUEUE_FAILED = "Stash did not start this edit: ";

  function EditorModal(props) {
    // props: { sceneId, show, onHide }
    const { Modal, Button } = PluginApi.libraries.Bootstrap; // lazy: ready at render, not at load
    const cm = window.SVECropMath;
    const lp = window.SVECropLoupe;

    const [natural, setNatural] = useState(null);   // {w,h} source pixels
    // Non-null once we know the source can't be decoded here. The modal is
    // otherwise silent about it: a codec the browser lacks renders an empty
    // stage, and Stash's own player masks the problem by transcoding.
    const [unplayable, setUnplayable] = useState(null);
    const [mode, setMode] = useState("crop");        // "crop" | "stretch"
    const [box, setBox] = useState(null);            // {x,y,w,h} in container px
    const [crop, setCrop] = useState(null);          // {x,y,width,height} source px
    const [outW, setOutW] = useState("");            // crop-mode numeric override
    const [outH, setOutH] = useState("");
    const [outDims, setOutDims] = useState(null);    // {width,height} derived in stretch mode
    const [playing, setPlaying] = useState(false);   // our own transport (native controls removed)
    const [curTime, setCurTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loupeHandle, setLoupeHandle] = useState(null);   // edge the magnifier is showing
    const [activeHandle, setActiveHandle] = useState(null); // sticky keyboard-nudge target
    const [loupeBlind, setLoupeBlind] = useState(false);    // this video can't be read into a canvas
    const [submitError, setSubmitError] = useState(null);   // why the task was not queued

    const drag = useRef(null);
    const loupeCanvas = useRef(null);
    const loupeSampleRef = useRef(null); // latest geometry, read by the redraw loop
    const loupeRaf = useRef(null);
    const loupeTimer = useRef(null);
    const videoRef = useRef(null);
    const timeRef = useRef(0);                        // preserve playhead across mode remounts
    const frozen = useRef(null);                      // {crop, baseFrame, cropBox} captured on entering stretch
    const naturalRef = useRef(null);
    const inited = useRef(false);                     // init the box exactly once (survives video remounts)

    // Scenes use their stream URL; image clips pass their own URL (image.paths.image)
    // in via props since there is no image stream route.
    const streamUrl = props.imageId ? props.streamUrl : sceneStreamUrl(props.sceneId, props.streamUrl);
    const rendered = natural ? cm.getRenderedVideoRect(natural, CONTAINER) : null;

    // Push the current geometry up as crop (crop mode) or derived out dims (stretch mode).
    const commit = useCallback((nextBox, m, rnd) => {
      if (m === "crop") {
        setCrop(cm.rectToSourceCrop(nextBox, rnd, naturalRef.current));
      } else {
        const fr = frozen.current;
        setOutDims(cm.stretchOutputDims(fr.crop, { w: nextBox.w, h: nextBox.h }, fr.baseFrame));
      }
    }, [cm]);

    const onMeta = (e) => {
      const v = e.target;
      setUnplayable(null);   // metadata arrived: whatever we feared, it decoded
      const nat = { w: v.videoWidth, h: v.videoHeight };
      // The <video> remounts when toggling Crop/Stretch and re-fires this. Only push a
      // new `natural` when the dims actually change, so the init effect isn't handed a
      // fresh object ref that would reset the box mid-edit.
      if (!naturalRef.current || naturalRef.current.w !== nat.w || naturalRef.current.h !== nat.h) {
        naturalRef.current = nat;
        setNatural(nat);
      }
      setDuration(v.duration || 0);
    };

    // Watchdog for the silent case: certain browsers stall on an undecodable
    // source without ever firing `error`, leaving no event to react to and a
    // stage that stays blank indefinitely.
    useEffect(() => {
      const pl = window.SVEPlayability;
      if (!pl || natural || unplayable) return;
      const started = Date.now();
      const t = setTimeout(() => {
        if (pl.stalledWithoutMetadata({
              hasMetadata: !!naturalRef.current,
              elapsedMs: Date.now() - started,
              timeoutMs: pl.METADATA_TIMEOUT_MS })) {
          setUnplayable(pl.stalledMessage());
        }
      }, pl.METADATA_TIMEOUT_MS + 100);
      return () => clearTimeout(t);
    }, [natural, unplayable]);

    const fmtTime = (s) => {
      if (!isFinite(s)) return "0:00";
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return m + ":" + (sec < 10 ? "0" + sec : sec);
    };
    const togglePlay = () => {
      const v = videoRef.current; if (!v) return;
      if (v.paused) v.play(); else v.pause();
    };
    const seek = (e) => {
      const t = parseFloat(e.target.value);
      if (videoRef.current) videoRef.current.currentTime = t;
      setCurTime(t);
    };

    // Initialize the box to the full rendered frame ONCE the video's natural size is
    // known. The `inited` guard keeps a video remount (mode toggle) from re-running this
    // and wiping the user's crop/stretch edits.
    useEffect(() => {
      if (!natural || inited.current) return;
      inited.current = true;
      const rnd = cm.getRenderedVideoRect(natural, CONTAINER);
      const initial = { x: rnd.x, y: rnd.y, w: rnd.w, h: rnd.h };
      setBox(initial);
      setCrop(cm.rectToSourceCrop(initial, rnd, natural));
    }, [natural, cm]);

    // Show the magnifier for whichever edge is being touched, and remember it as the
    // keyboard-nudge target. Hover alone is enough — you can inspect an edge without
    // committing to a drag that might move it.
    const showLoupe = (handle) => {
      if (loupeTimer.current) { clearTimeout(loupeTimer.current); loupeTimer.current = null; }
      setLoupeHandle(handle);
      if (handle !== "move") setActiveHandle(handle);
    };
    const onHandleEnter = (handle) => () => { if (!drag.current) showLoupe(handle); };
    const onHandleLeave = () => () => { if (!drag.current) setLoupeHandle(null); };

    const onHandleDown = (handle) => (e) => {
      e.preventDefault();
      e.stopPropagation(); // keep a handle's resize from also triggering the body's "move"
      const bounds = mode === "crop"
        ? rendered
        : { x: 0, y: 0, w: CONTAINER.w, h: CONTAINER.h }; // stretch frame may exceed the video rect
      drag.current = { handle, sx: e.clientX, sy: e.clientY, start: box, bounds, mode, rendered };
      showLoupe(handle);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
    const onMove = (e) => {
      const d = drag.current; if (!d) return;
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      const nb = cm.resizeBox(d.start, d.handle, dx, dy, d.bounds, MIN_BOX);
      setBox(nb);
      commit(nb, d.mode, d.rendered);
    };
    const onUp = () => {
      drag.current = null;
      setLoupeHandle(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    // --- Magnifier ("loupe") -------------------------------------------------
    // The stage draws the source at a fraction of its real size (0.375x for 1080p)
    // and the crop box dims everything outside itself, so a letterbox bar and a
    // dimmed strip of content are indistinguishable there. The loupe re-draws the
    // pixels around the dragged edge at 1:1, undimmed, with a hairline on the cut.
    const loupeOn = !!(lp && !loupeBlind && mode === "crop" && box && natural && rendered
      && loupeHandle && lp.hasLoupe(loupeHandle));
    const sample = loupeOn ? lp.loupeSample(box, loupeHandle, rendered, natural, LOUPE) : null;
    const loupePos = loupeOn ? lp.loupePlacement(box, loupeHandle, CONTAINER, LOUPE) : null;
    const loupeText = loupeOn ? lp.formatReadout(lp.edgeReadout(box, loupeHandle, rendered, natural)) : "";
    loupeSampleRef.current = sample; // the redraw loop reads the newest geometry, not a stale closure

    // Repaint on every animation frame while visible: one loop covers dragging,
    // nudging, scrubbing and playback without a listener for each.
    useEffect(() => {
      if (!loupeOn) return;
      let stopped = false;
      let blankChecked = false;
      const draw = () => {
        if (stopped) return;
        const s = loupeSampleRef.current;
        const canvas = loupeCanvas.current;
        const v = videoRef.current;
        if (s && canvas && v && v.readyState >= 2) {
          const dpr = window.devicePixelRatio || 1;
          if (canvas.width !== Math.round(LOUPE.w * dpr)) {
            canvas.width = Math.round(LOUPE.w * dpr);
            canvas.height = Math.round(LOUPE.h * dpr);
          }
          const ctx = canvas.getContext("2d");
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.imageSmoothingEnabled = false; // nearest-neighbour: show real pixels, don't invent them
          ctx.clearRect(0, 0, LOUPE.w, LOUPE.h);
          try {
            ctx.drawImage(v, s.src.x, s.src.y, s.src.w, s.src.h, 0, 0, LOUPE.w, LOUPE.h);
          } catch (err) {
            console.warn("[StashVideoEditor] loupe: can't read this video into a canvas", err);
            setLoupeBlind(true);
            return;
          }
          // A browser that won't composite this video into a canvas no-ops silently,
          // leaving the canvas fully transparent. A real black bar is opaque, so alpha
          // is a clean discriminator — and cheaper than guessing from the user agent.
          // Checked once per open, not per frame.
          if (!blankChecked) {
            blankChecked = true;
            if (canvasIsBlank(ctx, canvas.width, canvas.height)) {
              console.warn("[StashVideoEditor] loupe: canvas draw produced nothing; hiding magnifier");
              setLoupeBlind(true);
              return;
            }
          }
          drawCut(ctx, s, lp);
        }
        loupeRaf.current = requestAnimationFrame(draw);
      };
      draw();
      return () => {
        stopped = true;
        if (loupeRaf.current) cancelAnimationFrame(loupeRaf.current);
        loupeRaf.current = null;
      };
    }, [loupeOn]);

    useEffect(() => () => { if (loupeTimer.current) clearTimeout(loupeTimer.current); }, []);

    // Arrow keys nudge the last-touched edge by exactly 2 source pixels (Shift: 10).
    // A mouse cannot resolve one source pixel on a 720px stage, which is the other
    // half of "took off too much or too little".
    useEffect(() => {
      if (!lp || !props.show || mode !== "crop" || !activeHandle || !box || !rendered || !natural) return;
      const onKey = (e) => {
        const t = e.target;
        if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return; // leave the W/H fields their arrows
        const d = lp.nudgeDelta(e.key, e.shiftKey);
        if (!d) return;
        e.preventDefault();
        const perSrcPx = rendered.w / natural.w; // source px → container px
        const nb = cm.resizeBox(box, activeHandle, d.dx * perSrcPx, d.dy * perSrcPx, rendered, MIN_BOX);
        setBox(nb);
        commit(nb, "crop", rendered);
        setLoupeHandle(activeHandle); // surface the loupe so you can see the nudge land
        if (loupeTimer.current) clearTimeout(loupeTimer.current);
        loupeTimer.current = setTimeout(() => setLoupeHandle(null), 1400);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [lp, props.show, mode, activeHandle, box, rendered, natural, cm, commit]);

    // Auto-crop: sample the current frame to a canvas, detect the sharp content box
    // (strips black bars AND blurred-zoom padding), and snap the crop box to it.
    // Detection is a starting point — the 8 handles stay live for fine-tuning.
    const autoCrop = () => {
      const v = videoRef.current;
      if (!v || !natural || !rendered) return;
      const sw = Math.min(natural.w, 320); // downscale: bar detection doesn't need full res
      const sh = Math.max(1, Math.round(natural.h * sw / natural.w));
      const canvas = document.createElement("canvas");
      canvas.width = sw; canvas.height = sh;
      const ctx = canvas.getContext("2d");
      try {
        ctx.drawImage(v, 0, 0, sw, sh);
        const img = ctx.getImageData(0, 0, sw, sh); // same-origin stream → not tainted
        const cb = cm.detectSharpContentBox(img.data, sw, sh);
        const sx = natural.w / sw, sy = natural.h / sh;   // sample px → source px
        const scale = rendered.w / natural.w;             // source px → container px
        const nb = {
          x: rendered.x + cb.x * sx * scale,
          y: rendered.y + cb.y * sy * scale,
          w: cb.w * sx * scale,
          h: cb.h * sy * scale,
        };
        setBox(nb);
        commit(nb, "crop", rendered);
      } catch (err) {
        console.error("[StashVideoEditor] auto-crop failed", err);
      }
    };

    const sameRect = (a, b) => a && b &&
      a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

    const toggleMode = () => {
      setPlaying(false); // the <video> remounts across modes; resync transport state
      if (mode === "crop") {
        const fc = cm.rectToSourceCrop(box, rendered, natural);
        const cropBox = { x: box.x, y: box.y, w: box.w, h: box.h };
        const prev = frozen.current;
        // Resume the prior stretch frame if the crop is unchanged; otherwise start
        // undistorted (frame == cropBox). baseFrame stays the crop's own dims, so the
        // output-dim math is always measured from the undistorted reference.
        const frame = (prev && prev.lastFrame && sameRect(prev.cropBox, cropBox))
          ? prev.lastFrame : cropBox;
        frozen.current = { crop: fc, baseFrame: { w: cropBox.w, h: cropBox.h }, cropBox: cropBox, lastFrame: frame };
        setBox(frame);
        setCrop(fc);
        setOutDims(cm.stretchOutputDims(fc, { w: frame.w, h: frame.h }, { w: cropBox.w, h: cropBox.h }));
        setMode("stretch");
      } else {
        // Remember the stretch frame so it can be resumed, then restore the crop box —
        // don't treat the dragged output frame as a new crop.
        if (frozen.current) frozen.current.lastFrame = { x: box.x, y: box.y, w: box.w, h: box.h };
        const cb = frozen.current ? frozen.current.cropBox : box;
        setBox(cb);
        commit(cb, "crop", rendered);
        setMode("crop");
      }
    };

    const submit = async () => {
      let w, h, theCrop;
      if (mode === "stretch") {
        theCrop = frozen.current.crop;
        w = outDims.width; h = outDims.height;
      } else {
        theCrop = crop;
        w = parseInt(outW, 10) || crop.width;
        h = parseInt(outH, 10) || crop.height;
      }
      // Close only when Stash accepted the task. On a refusal the modal stays open
      // with the reason, so nobody waits for an edit that was never queued.
      setSubmitError(null);
      try {
        if (props.imageId) {
          await runImageCropTask(props.imageId, theCrop, w, h);
        } else {
          await runCropTask(props.sceneId, theCrop, w, h);
        }
      } catch (err) {
        console.error("[StashVideoEditor] crop task was not queued", err);
        setSubmitError(QUEUE_FAILED + (err && err.message ? err.message : String(err)));
        return;
      }
      props.onHide();
    };

    // Shared <video> handlers. Native controls are intentionally OFF so the player's
    // control bar never overlaps the crop box — transport lives below the stage instead.
    // Preserve the playhead when the element remounts across modes.
    // Image clips (.vclip) are typically single-GOP (one keyframe at t=0), so Safari
    // can't present a *paused* seek — it only decodes frames during playback. Default
    // them to muted+looping playback so the clip animates on open (how you verify a
    // crop across a short loop) and the scrubber works (seeking while playing presents
    // frames). Scenes keep the normal paused/seekable behavior. playsInline everywhere
    // so iOS Safari doesn't hijack to fullscreen.
    const isImageClip = !!props.imageId;
    const videoProps = {
      ref: videoRef,
      src: streamUrl,
      playsInline: true,
      muted: isImageClip,
      loop: isImageClip,
      autoPlay: isImageClip,
      onLoadedMetadata: onMeta,
      onError: (e) => {
        const pl = window.SVEPlayability;
        const msg = pl && pl.unplayableMessage(e.target && e.target.error);
        if (msg) setUnplayable(msg);
      },
      onLoadedData: () => { if (videoRef.current) videoRef.current.currentTime = timeRef.current; },
      onTimeUpdate: () => {
        const v = videoRef.current; if (!v) return;
        timeRef.current = v.currentTime;
        setCurTime(v.currentTime);
      },
      onPlay: () => setPlaying(true),
      onPause: () => setPlaying(false),
    };

    // --- Stage rendering -----------------------------------------------------
    let stageChildren;
    if (mode === "stretch" && box && frozen.current) {
      // Show ONLY the frozen crop region, scaled (non-uniformly) to fill the frame box.
      const fc = frozen.current.crop;
      const vidStyle = {
        position: "absolute",
        left: (-(fc.x * box.w / fc.width)) + "px",
        top: (-(fc.y * box.h / fc.height)) + "px",
        width: (natural.w * box.w / fc.width) + "px",
        height: (natural.h * box.h / fc.height) + "px",
        objectFit: "fill",
      };
      stageChildren = [
        React.createElement("div", {
          key: "clip", className: "sve-frame-clip",
          style: { left: box.x + "px", top: box.y + "px", width: box.w + "px", height: box.h + "px" },
        }, React.createElement("video", Object.assign({}, videoProps, { style: vidStyle }))),
        React.createElement(CropBox, { key: "box", box, mode, onHandleDown }),
      ];
    } else {
      stageChildren = [
        React.createElement("video", Object.assign({}, videoProps, {
          key: "video",
          style: { width: "100%", height: "100%", objectFit: "contain" },
        })),
        box && React.createElement(CropBox, {
          key: "box", box, mode, onHandleDown, onHandleEnter, onHandleLeave, activeHandle,
        }),
      ];
    }

    const loupeEl = loupeOn && React.createElement("div", {
      key: "loupe", className: "sve-loupe",
      style: { left: loupePos.left + "px", top: loupePos.top + "px", width: LOUPE.w + "px" },
    },
      React.createElement("canvas", {
        ref: loupeCanvas, className: "sve-loupe-canvas",
        style: { width: LOUPE.w + "px", height: LOUPE.h + "px" },
      }),
      React.createElement("div", { className: "sve-loupe-label" }, loupeText));

    const controls = mode === "stretch"
      ? React.createElement("div", { className: "sve-controls" },
          React.createElement("span", { className: "sve-outdims" },
            "Output ", outDims ? (outDims.width + " × " + outDims.height) : "—", " px"),
          React.createElement("div", { className: "sve-hint" },
            "Drag the frame handles to stretch the cropped region. Output size follows the frame."))
      : React.createElement("div", { className: "sve-controls" },
          "Output W ", React.createElement("input", { type: "number", value: outW, onChange: (e) => setOutW(e.target.value), placeholder: crop ? crop.width : "" }),
          " H ", React.createElement("input", { type: "number", value: outH, onChange: (e) => setOutH(e.target.value), placeholder: crop ? crop.height : "" }),
          crop && React.createElement("div", { className: "sve-cropinfo" },
            "Crop " + crop.width + "×" + crop.height + " at (" + crop.x + ", " + crop.y + ") · cut " +
            (natural ? (natural.w - crop.width) + "px wide, " + (natural.h - crop.height) + "px tall" : "—")),
          React.createElement("div", { className: "sve-hint" },
            loupeBlind
              ? "Leave blank to keep crop size. Arrow keys nudge the last-touched handle 2px (Shift: 10px)."
              : "Hover or drag a handle for a 1:1 magnified view of that edge. Arrow keys nudge it 2px (Shift: 10px)."),
          React.createElement("div", { className: "sve-hint" }, "Leave output blank to keep the crop size. Set it to stretch numerically, or switch to Stretch to do it visually."));

    const submitDisabled = mode === "stretch" ? !outDims : !crop;

    // What will actually be re-encoded, so the submit button states it outright.
    let applyCrop = null, applyOut = null;
    if (mode === "stretch") {
      applyCrop = frozen.current ? frozen.current.crop : null;
      applyOut = outDims;
    } else if (crop) {
      applyCrop = crop;
      applyOut = { width: parseInt(outW, 10) || crop.width, height: parseInt(outH, 10) || crop.height };
    }
    const isStretched = applyCrop && applyOut &&
      (applyOut.width !== applyCrop.width || applyOut.height !== applyCrop.height);
    const applyLabel = applyOut
      ? (isStretched ? "Stretch & re-encode" : "Crop & re-encode") + " → " + applyOut.width + "×" + applyOut.height
      : "Crop & re-encode";

    return React.createElement(Modal, { show: props.show, onHide: props.onHide, size: "lg" },
      React.createElement(Modal.Header, { closeButton: true },
        React.createElement(Modal.Title, null, "Crop & re-encode")),
      React.createElement(Modal.Body, null,
        React.createElement("div", { className: "sve-stage", style: { width: CONTAINER.w, height: CONTAINER.h } },
          ...stageChildren,
          loupeEl,
          unplayable && React.createElement("div", { className: "sve-unplayable" },
            React.createElement("strong", null, "Can't edit this file"),
            React.createElement("p", null, unplayable))
        ),
        React.createElement("div", { className: "sve-transport" },
          React.createElement(Button, {
            variant: "secondary", size: "sm", className: "sve-play-btn",
            disabled: !natural, onClick: togglePlay,
          }, playing ? "❚❚" : "►"),
          React.createElement("input", {
            type: "range", className: "sve-seek", min: 0, max: duration || 0, step: 0.05,
            value: curTime, disabled: !duration, onChange: seek,
          }),
          React.createElement("span", { className: "sve-time" }, fmtTime(curTime) + " / " + fmtTime(duration))
        ),
        React.createElement("div", { className: "sve-modebar" },
          mode === "crop" && React.createElement(Button, {
            variant: "info", size: "sm", className: "sve-autocrop-btn",
            disabled: !natural, onClick: autoCrop, title: "Snap the crop to the sharp content, removing black bars or blurred padding",
          }, "Auto-crop bars"),
          React.createElement(Button, {
            variant: mode === "stretch" ? "primary" : "secondary",
            size: "sm", className: "sve-mode-btn", disabled: !box, onClick: toggleMode,
          }, mode === "stretch" ? "Stretching — switch to Crop" : "Switch to Stretch"),
        ),
        controls,
        submitError && React.createElement("div", { className: "sve-hint sve-warn", role: "alert" }, submitError)
      ),
      React.createElement(Modal.Footer, null,
        React.createElement(Button, { variant: "secondary", onClick: props.onHide }, "Cancel"),
        React.createElement(Button, { variant: "primary", disabled: submitDisabled || !!unplayable, onClick: submit }, applyLabel)
      )
    );
  }

  function CropTabButton(props) {
    const { Button } = PluginApi.libraries.Bootstrap; // lazy
    const [show, setShow] = useState(false);
    return React.createElement(React.Fragment, null,
      React.createElement(Button, { variant: "secondary", className: "sve-open-btn", onClick: () => setShow(true) }, "Crop & re-encode"),
      show && React.createElement(EditorModal, { sceneId: props.sceneId, streamUrl: props.streamUrl, show: true, onHide: () => setShow(false) })
    );
  }

  // Image-clip crop button. Images expose no ScenePage.TabContent-style React patch
  // anchor, so this is mounted via DOM injection (see syncImageCropButton) rather
  // than PluginApi.patch. Opens the same EditorModal, wired to the image clip.
  // The image id and the clip URL are read when the button is CLICKED, never when it
  // is mounted: Stash can move to another image without rebuilding the toolbar, and a
  // value captured at mount would then crop the previous image.
  function currentImageClip() {
    const m = window.location.pathname.match(/\/images\/(\d+)/);
    const video = document.querySelector("video.image-image"); // present only for clips
    const streamUrl = video && (video.currentSrc || video.getAttribute("src"));
    return (m && streamUrl) ? { imageId: m[1], streamUrl: streamUrl } : null;
  }

  function ImageCropButton() {
    const { Button } = PluginApi.libraries.Bootstrap; // lazy
    const [clip, setClip] = useState(null);     // non-null while the modal is open
    return React.createElement(React.Fragment, null,
      React.createElement(Button, { variant: "secondary", className: "sve-open-btn", onClick: () => setClip(currentImageClip()) }, "Crop & re-encode"),
      clip && React.createElement(EditorModal, { imageId: clip.imageId, streamUrl: clip.streamUrl, show: true, onHide: () => setClip(null) })
    );
  }

  // Lossless/precision TRIM modal. Distinct operation from crop (can't do both in
  // one pass), so it's a separate button + modal. The stage is identical in both
  // trim modes, so the <video> never remounts here — the in/out range lives safely
  // in component state. `inited` still guards against a stray metadata re-fire.
  // The timeline reuses Stash's already-generated sprite sheet as a filmstrip; if
  // sprites aren't generated it degrades to a plain track — the draggable handles
  // and live preview work either way.
  function TrimModal(props) {
    const { Modal, Button } = PluginApi.libraries.Bootstrap; // lazy: ready at render
    const tm = window.SVETimeMath;
    const sv = window.SVESpriteVtt;

    const [duration, setDuration] = useState(0);
    const [curTime, setCurTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [range, setRange] = useState(null);   // {in, out} (source seconds)
    const [lossless, setLossless] = useState(true);
    const [film, setFilm] = useState(null);     // {url, cues, sheet:{w,h}} or null
    const [unplayable, setUnplayable] = useState(null);  // see EditorModal
    const [submitError, setSubmitError] = useState(null);

    const videoRef = useRef(null);
    const filmRef = useRef(null);               // timeline element, for clientX→time
    const dragRef = useRef(null);               // "in" | "out" while dragging a handle
    const timeRef = useRef(0);                  // preserve playhead if the element reloads
    const inited = useRef(false);               // default the range to the whole clip once

    const streamUrl = sceneStreamUrl(props.sceneId, props.streamUrl);

    // Reuse the scene's sprite sheet (paths.sprite) + its VTT (paths.vtt) as a
    // filmstrip. Best-effort: any failure leaves `film` null → plain-track fallback.
    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const q = `query SvePaths($id: ID!) { findScene(id: $id) { paths { sprite vtt } } }`;
          const res = await gql(q, { id: props.sceneId });
          const paths = res && res.findScene && res.findScene.paths;
          if (!paths || !paths.sprite || !paths.vtt) return;
          const text = await fetch(paths.vtt, { credentials: "include" }).then((r) => r.ok ? r.text() : "");
          const cues = sv.parseSpriteVTT(text);
          if (!cancelled && cues.length) {
            setFilm({ url: paths.sprite, cues: cues, sheet: sv.spriteSheetSize(cues) });
          }
        } catch (err) {
          console.warn("[StashVideoEditor] sprite filmstrip unavailable; using plain track", err);
        }
      })();
      return () => { cancelled = true; };
    }, [props.sceneId, sv]);

    const onMeta = (e) => {
      const d = e.target.duration || 0;
      setDuration(d);
      if (!inited.current && d > 0) {
        inited.current = true;
        setRange({ in: 0, out: d });             // whole clip selected by default
      }
    };

    const togglePlay = () => {
      const v = videoRef.current; if (!v) return;
      if (v.paused) v.play(); else v.pause();
    };
    const seek = (e) => {
      const t = parseFloat(e.target.value);
      if (videoRef.current) videoRef.current.currentTime = t;
      setCurTime(t);
    };
    const setInHere = () => { if (range && duration) setRange(tm.clampIn(range, curTime, duration, MIN_TRIM)); };
    const setOutHere = () => { if (range && duration) setRange(tm.clampOut(range, curTime, duration, MIN_TRIM)); };

    // Drag an in/out handle along the timeline. Live preview: scrub the real
    // <video> to the handle's time so the exact frame shows under the cursor.
    const timeFromClientX = (clientX) => {
      const el = filmRef.current;
      if (!el || !duration) return 0;
      const r = el.getBoundingClientRect();
      return tm.clamp((clientX - r.left) / r.width, 0, 1) * duration;
    };
    const onDragMove = (e) => {
      const which = dragRef.current; if (!which) return;
      const t = timeFromClientX(e.clientX);
      setRange((r) => which === "in" ? tm.clampIn(r, t, duration, MIN_TRIM)
                                     : tm.clampOut(r, t, duration, MIN_TRIM));
      if (videoRef.current) videoRef.current.currentTime = t; // live preview frame
      setCurTime(t);
    };
    const onDragUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragUp);
    };
    const onHandleDown = (which) => (e) => {
      e.preventDefault(); e.stopPropagation();
      if (videoRef.current) videoRef.current.pause(); // freeze for a clean scrub
      dragRef.current = which;
      window.addEventListener("mousemove", onDragMove);
      window.addEventListener("mouseup", onDragUp);
    };

    const videoProps = {
      ref: videoRef,
      src: streamUrl,
      onLoadedMetadata: onMeta,
      onError: (e) => {
        const pl = window.SVEPlayability;
        const msg = pl && pl.unplayableMessage(e.target && e.target.error);
        if (msg) setUnplayable(msg);
      },
      onLoadedData: () => { if (videoRef.current) videoRef.current.currentTime = timeRef.current; },
      onTimeUpdate: () => {
        const v = videoRef.current; if (!v) return;
        timeRef.current = v.currentTime;
        setCurTime(v.currentTime);
      },
      onPlay: () => setPlaying(true),
      onPause: () => setPlaying(false),
      style: { width: "100%", height: "100%", objectFit: "contain" },
    };

    const pct = (t) => duration > 0 ? (tm.clamp(t, 0, duration) / duration) * 100 : 0;
    const valid = range ? tm.validateRange(range.in, range.out, duration, MIN_TRIM)
                        : { valid: false, reason: "Loading…" };
    const selDur = range ? Math.max(0, range.out - range.in) : 0;
    const fmtRange = range ? tm.formatTime(range.in) + "–" + tm.formatTime(range.out) : "";
    const submitLabel = (lossless ? "Lossless trim → " : "Precision trim → ") + fmtRange;

    const submit = async () => {
      if (!valid.valid) return;
      setSubmitError(null);
      try {
        await runTrimTask(props.sceneId, range.in, range.out, lossless);
      } catch (err) {
        console.error("[StashVideoEditor] trim task was not queued", err);
        setSubmitError(QUEUE_FAILED + (err && err.message ? err.message : String(err)));
        return;
      }
      props.onHide();
    };

    // --- Filmstrip timeline --------------------------------------------------
    const haveFilm = !!(film && film.sheet.w > 0 && duration > 0);
    const N = haveFilm ? Math.max(1, Math.round(CONTAINER.w / 96)) : 0; // ~8 thumbs
    const tileW = haveFilm ? CONTAINER.w / N : 0;
    const aspect = haveFilm ? film.cues[0].h / film.cues[0].w : 9 / 16;
    const stripH = haveFilm ? Math.round(tileW * aspect) : 54;

    const tiles = [];
    if (haveFilm) {
      for (let i = 0; i < N; i++) {
        const cue = sv.cueAt(film.cues, ((i + 0.5) / N) * duration);
        const scale = tileW / cue.w;
        tiles.push(React.createElement("div", {
          key: i, className: "sve-film-tile",
          style: {
            width: tileW + "px", height: stripH + "px",
            backgroundImage: `url("${film.url}")`,
            backgroundSize: (film.sheet.w * scale) + "px " + (film.sheet.h * scale) + "px",
            backgroundPosition: (-cue.x * scale) + "px " + (-cue.y * scale) + "px",
          },
        }));
      }
    }

    const timeline = React.createElement("div", {
      className: "sve-film", ref: filmRef,
      style: { width: CONTAINER.w + "px", height: stripH + "px" },
    },
      haveFilm
        ? React.createElement("div", { className: "sve-film-row" }, ...tiles)
        : React.createElement("div", { className: "sve-film-blank" }),
      range && React.createElement("div", { className: "sve-film-dim", style: { left: 0, width: pct(range.in) + "%" } }),
      range && React.createElement("div", { className: "sve-film-dim", style: { left: pct(range.out) + "%", right: 0 } }),
      React.createElement("div", { className: "sve-film-playhead", style: { left: pct(curTime) + "%" } }),
      range && React.createElement("div", {
        className: "sve-film-handle sve-in", style: { left: pct(range.in) + "%" },
        onMouseDown: onHandleDown("in"),
      }),
      range && React.createElement("div", {
        className: "sve-film-handle sve-out", style: { left: pct(range.out) + "%" },
        onMouseDown: onHandleDown("out"),
      })
    );

    return React.createElement(Modal, { show: props.show, onHide: props.onHide, size: "lg" },
      React.createElement(Modal.Header, { closeButton: true },
        React.createElement(Modal.Title, null, "Trim")),
      React.createElement(Modal.Body, null,
        React.createElement("div", { className: "sve-stage", style: { width: CONTAINER.w, height: CONTAINER.h } },
          React.createElement("video", Object.assign({ key: "video" }, videoProps)),
          unplayable && React.createElement("div", { className: "sve-unplayable" },
            React.createElement("strong", null, "Can't edit this file"),
            React.createElement("p", null, unplayable))
        ),
        timeline,
        React.createElement("div", { className: "sve-transport" },
          React.createElement(Button, {
            variant: "secondary", size: "sm", className: "sve-play-btn",
            disabled: !duration, onClick: togglePlay,
          }, playing ? "❚❚" : "►"),
          React.createElement("input", {
            type: "range", className: "sve-seek", min: 0, max: duration || 0, step: 0.05,
            value: curTime, disabled: !duration, onChange: seek,
          }),
          React.createElement("span", { className: "sve-time" }, tm.formatTime(curTime) + " / " + tm.formatTime(duration))
        ),
        React.createElement("div", { className: "sve-modebar" },
          React.createElement(Button, { variant: "secondary", size: "sm", disabled: !range, onClick: setInHere }, "Set In @ playhead"),
          React.createElement(Button, { variant: "secondary", size: "sm", disabled: !range, onClick: setOutHere }, "Set Out @ playhead"),
          // Segmented control: both modes shown, the active one filled. Each button
          // selects its own mode (no ambiguous "what does toggling do?").
          React.createElement("div", { className: "sve-modeseg", role: "group", "aria-label": "Trim mode" },
            React.createElement("span", { className: "sve-modeseg-label" }, "Mode"),
            React.createElement(Button, {
              variant: lossless ? "success" : "outline-secondary", size: "sm",
              className: "sve-modeseg-btn", active: lossless, "aria-pressed": lossless,
              onClick: () => setLossless(true),
            }, (lossless ? "✓ " : "") + "Lossless"),
            React.createElement(Button, {
              variant: !lossless ? "primary" : "outline-secondary", size: "sm",
              className: "sve-modeseg-btn", active: !lossless, "aria-pressed": !lossless,
              onClick: () => setLossless(false),
            }, (!lossless ? "✓ " : "") + "Precision")
          )
        ),
        React.createElement("div", { className: "sve-controls" },
          React.createElement("span", { className: "sve-outdims" }, "Selected: " + (range ? fmtRange + " (" + tm.formatTime(selDur) + ")" : "—")),
          React.createElement("div", { className: "sve-hint" },
            lossless
              ? "Lossless — instant, zero quality loss. Drag the in/out handles; the cut snaps to the nearest keyframe at or before your in-point, so the whole selection is kept."
              : "Precision — re-encodes the selection for a frame-accurate cut exactly where you set the handles."),
          !valid.valid && React.createElement("div", { className: "sve-hint sve-warn" }, valid.reason),
          submitError && React.createElement("div", { className: "sve-hint sve-warn", role: "alert" }, submitError)
        )
      ),
      React.createElement(Modal.Footer, null,
        React.createElement(Button, { variant: "secondary", onClick: props.onHide }, "Cancel"),
        React.createElement(Button, { variant: "primary", disabled: !valid.valid || !!unplayable, onClick: submit }, submitLabel)
      )
    );
  }

  function TrimButton(props) {
    const { Button } = PluginApi.libraries.Bootstrap; // lazy
    const [show, setShow] = useState(false);
    // If the scripts were updated but the manifest is still cached by the server, the
    // trim helpers are not in the served bundle. Say so instead of throwing.
    const onOpen = () => {
      if (window.SVETimeMath && window.SVESpriteVtt) { setShow(true); return; }
      window.alert("Trim needs a plugin reload: Settings → Plugins → \"Reload plugins\", then refresh this page.");
    };
    return React.createElement(React.Fragment, null,
      React.createElement(Button, { variant: "secondary", className: "sve-open-btn", onClick: onOpen }, "Trim"),
      show && React.createElement(TrimModal, { sceneId: props.sceneId, streamUrl: props.streamUrl, show: true, onHide: () => setShow(false) })
    );
  }

  // Keep the image-clip crop button in step with the page: present on an image clip
  // (a <video> on the image page), absent on a plain image or any other page.
  const IMAGE_MOUNT_ID = "sve-image-crop-mount";

  function syncImageCropButton() {
    const mount = document.getElementById(IMAGE_MOUNT_ID);
    const toolbar = document.querySelector(".image-toolbar");
    const wanted = !!(currentImageClip() && toolbar);
    if (wanted && !mount) {
      const el = document.createElement("span");
      el.id = IMAGE_MOUNT_ID;
      el.className = "image-toolbar-group";
      toolbar.appendChild(el);
      PluginApi.ReactDOM.render(React.createElement(ImageCropButton), el);
    } else if (!wanted && mount) {
      PluginApi.ReactDOM.unmountComponentAtNode(mount);
      mount.remove();
    }
  }

  // After each navigation the page settles over a few hundred ms (the old image's
  // elements can still be there on the first look), so re-check for a bounded time
  // and then stop. A newer navigation cancels the older watch.
  let imageWatch = 0;
  function watchImagePage() {
    const mine = ++imageWatch;
    let ticks = 0;
    const tick = function () {
      if (mine !== imageWatch) return;
      try { syncImageCropButton(); } catch (e) { console.error("[StashVideoEditor] image button", e); return; }
      if (++ticks < 25) setTimeout(tick, 200);
    };
    tick();
  }

  // Guard registration so a plugin error can never block Stash's UI bootstrap.
  try {
    PluginApi.patch.before("ScenePage.TabContent", function (props) {
      const sceneId = props.scene && props.scene.id;
      if (!sceneId) return [props];
      const children = Array.isArray(props.children) ? props.children.slice() : [props.children];
      const streamUrl = props.scene.paths && props.scene.paths.stream;
      children.push(React.createElement(CropTabButton, { key: "sve-crop-btn", sceneId, streamUrl }));
      children.push(React.createElement(TrimButton, { key: "sve-trim-btn", sceneId, streamUrl }));
      // Keep every other prop: a later patch on this component may read them.
      return [Object.assign({}, props, { children: React.createElement(React.Fragment, null, ...children) })];
    });
    PluginApi.Event.addEventListener("stash:location", watchImagePage);
    watchImagePage();
    console.log("[StashVideoEditor] loaded");
  } catch (e) {
    console.error("[StashVideoEditor] registration failed (UI unaffected)", e);
  }
})();
