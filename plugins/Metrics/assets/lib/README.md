# Vendored libraries

These files are produced by `npm install` (which triggers `scripts/vendor-libs.js` via the `postinstall` hook) or by running `npm run vendor` manually.

The plugin **will not render charts** until these files are populated — the placeholder stubs below are only here so the `<script>` tags declared in `plugin.yml` don't return 404 in the browser console.

Expected files:

| File | Source package | Purpose |
| --- | --- | --- |
| `chart.umd.min.js` | [`chart.js`](https://www.chartjs.org/) | Core charting (bar / line / pie / scatter / doughnut). |
| `chartjs-plugin-datalabels.min.js` | [`chartjs-plugin-datalabels`](https://chartjs-plugin-datalabels.netlify.app/) | Inline value labels for bars / pies. |
| `chartjs-chart-matrix.min.js` | [`chartjs-chart-matrix`](https://github.com/kurkle/chartjs-chart-matrix) | Optional matrix renderer for richer heatmaps. The plugin renders heatmaps with hand-rolled CSS grids as a fallback. |

```sh
cd <stash-plugins-dir>/Metrics
npm install
```
