# Build Pipeline

This project keeps the original teaching pages and the integrated production page in the same root. Use this file to avoid editing the wrong layer.

## Source Layers

### Original files

These files are source references and historical originals:

- `index_moon.html`
- `CORE_01.html`
- `CORE_02.html`
- `CORE_03.html`
- `CORE_04.html`

Treat them as upstream material. They are useful for comparing original behavior, extracting shader/UI fragments, and understanding intent.

### Generated files

These files are generated or assembled by the build pipeline:

- `js/i18n.js`
- `js/webgl-utils.js`
- `js/ui.js`
- `js/shader-partial.js`
- `js/shader-penumbral.js`
- `js/shader-total.js`
- `js/orbiter.js`
- `js/main.js`
- `js/bundle.js`

If a generated file needs a persistent structural change, update `tools/build.js` as well. Otherwise `npm run build` can overwrite the change.

### Hand-maintained integration files

These files are currently maintained directly:

- `index.html`
- `css/main.css`
- `js/core-subpages-manager.js`
- `js/core-01.js`
- `js/core-02.js`
- `js/core-03.js`
- `js/core-04.js`
- `tools/integration-check.js`
- `tools/build.js`

The CORE modules were extracted from the original CORE files, but the current versions include integration fixes such as scoped selectors and `start()` / `pause()` lifecycle control.

## Canonical Commands

Use this for the normal rebuild:

```powershell
npm run build
```

Use this for integration checks:

```powershell
node tools\integration-check.js
```

On this Windows environment, the PowerShell `npm` shim can sometimes resolve to a stale global npm prefix. If `npm run check-integration` fails with a missing `npm-cli.js`, use:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run check-integration
```

## What `npm run build` Does

`tools/build.js` reads `index_moon.html`, regenerates the main app modules, applies integration patches, and writes `js/bundle.js`.

Important generated behavior currently encoded in `tools/build.js`:

- `c4SubPage` is preserved in `MoonApp.state`.
- CORE next/previous navigation is preserved for `currentProgress >= 0.88`.
- Course 03 WebGL contexts are lazy-created via `MoonApp.ensureCourse03Scene(index)`.
- `MoonApp.init()` creates the main orbiter immediately but leaves Course 03 contexts as `null` until visible.

## Legacy Extraction Scripts

These scripts are legacy extraction scripts, not the daily build path:

- `tools/extract-core.js`
- `tools/extract-core-lazy.js`
- `tools/merge-core-css.js`
- `tools/split_check.js`
- `tools/extract_css.js`

They may still be useful as references, but running them can overwrite current integrated files or produce outdated output. Review their contents and expected output before using them.

## Verification Checklist

After changing build logic or generated files, run:

```powershell
npm run build
node tools\integration-check.js
node tools\verify.js
node --check js\bundle.js
```

The current integration checks protect:

- CORE_01 scoped `core0-tilt` selector.
- CORE subpage `start()` / `pause()` lifecycle.
- CORE `c4SubPage` navigation state.
- Course 03 lazy initialization.
- Legacy script labeling.
