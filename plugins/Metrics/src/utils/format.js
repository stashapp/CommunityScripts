(function () {
  "use strict";

  const ns = (window.StashMetrics = window.StashMetrics || {});
  const fmt = (ns.format = {});

  fmt.bytes = function (n) {
    if (n == null || isNaN(n)) return "—";
    const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
    let i = 0;
    let v = Number(n);
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return v.toFixed(v >= 100 || i === 0 ? 0 : v >= 10 ? 1 : 2) + " " + units[i];
  };

  fmt.duration = function (seconds) {
    if (seconds == null || isNaN(seconds)) return "—";
    const s = Math.round(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return h + "h " + String(m).padStart(2, "0") + "m";
    if (m > 0) return m + "m " + String(r).padStart(2, "0") + "s";
    return r + "s";
  };

  // Compact integer formatting: 12_345 → "12.3k"
  fmt.int = function (n) {
    if (n == null || isNaN(n)) return "—";
    const abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (abs >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (abs >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return String(n);
  };

  fmt.pct = function (n, digits) {
    if (n == null || isNaN(n)) return "—";
    return (n * 100).toFixed(digits == null ? 1 : digits) + "%";
  };

  fmt.cmToFeet = function (cm) {
    const totalIn = cm / 2.54;
    const ft = Math.floor(totalIn / 12);
    const inch = Math.round(totalIn - ft * 12);
    return ft + "'" + inch + '"';
  };

  fmt.height = function (cm, unit) {
    if (cm == null) return "—";
    return unit === "in" ? fmt.cmToFeet(cm) : Math.round(cm) + " cm";
  };

  // ISO date → years old today. Birthdate format from Stash is YYYY-MM-DD.
  fmt.age = function (birthdate, asOf) {
    if (!birthdate) return null;
    const b = new Date(birthdate);
    if (isNaN(b.getTime())) return null;
    const now = asOf ? new Date(asOf) : new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  };

  fmt.ageBucket = function (age, size) {
    if (age == null) return null;
    const s = size && size > 0 ? size : 5;
    const lo = Math.floor(age / s) * s;
    return lo + "–" + (lo + s - 1);
  };

  fmt.shortDate = function (iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toISOString().slice(0, 10);
  };

  // Stable color palette for categorical data — chosen for legibility against
  // Stash's dark theme. Loops if requested past the end.
  const palette = [
    "#4f8ef7", "#f76e6e", "#3ecf8e", "#f7c948", "#c98ef7", "#6ec3f7",
    "#f7a26e", "#9ee06e", "#f76ec3", "#6e7df7", "#f7e26e", "#6ef7d7",
    "#c9f76e", "#f76e9e", "#8e6ef7", "#6ef7a2", "#f7886e", "#6eb7f7"
  ];
  fmt.color = function (i) { return palette[((i % palette.length) + palette.length) % palette.length]; };
  fmt.palette = palette;

  // Deterministic hash → color used to color performer / tag pills in tables.
  fmt.colorFor = function (key) {
    let h = 0;
    const s = String(key || "");
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return palette[Math.abs(h) % palette.length];
  };
})();
