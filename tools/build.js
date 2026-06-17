var fs = require('fs');
var path = require('path');

var src = fs.readFileSync(path.join(__dirname, '..', 'index_moon.html'), 'utf8');

function extractAfter(content, startMarker, endMarker) {
  var idx = content.indexOf(startMarker);
  if (idx === -1) return '';
  idx += startMarker.length;
  var endIdx = content.indexOf(endMarker, idx);
  if (endIdx === -1) return content.substring(idx);
  return content.substring(idx, endIdx);
}

var scripts = src.substring(src.indexOf('<script>') + 8, src.lastIndexOf('</script>'));
var outDir = path.join(__dirname, '..', 'js');

function writeFile(filename, lines) {
  var filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('  => js/' + filename);
}

function remapVars(code) {
  return code
    .replace(/\bcamTheta\b/g, 'MoonApp.state.camTheta')
    .replace(/\bcamPhi\b/g, 'MoonApp.state.camPhi')
    .replace(/\bcamRadius\b/g, 'MoonApp.state.camRadius')
    .replace(/\bcurrentProgress\b/g, 'MoonApp.state.currentProgress')
    .replace(/\btargetProgress\b/g, 'MoonApp.state.targetProgress')
    .replace(/\bcurrentThemeBlend\b/g, 'MoonApp.state.currentThemeBlend')
    .replace(/\btargetThemeBlend\b/g, 'MoonApp.state.targetThemeBlend')
    .replace(/\bcurrentCoursePhase\b/g, 'MoonApp.state.currentCoursePhase')
    .replace(/\btargetCoursePhase\b/g, 'MoonApp.state.targetCoursePhase')
    .replace(/\bcurrentCourse02Phase\b/g, 'MoonApp.state.currentCourse02Phase')
    .replace(/\btargetCourse02Phase\b/g, 'MoonApp.state.targetCourse02Phase')
    .replace(/\bidleRotation\b/g, 'MoonApp.state.idleRotation')
    .replace(/\bcurrentZoom\b/g, 'MoonApp.state.currentZoom')
    .replace(/\bcurrentOffsetX\b/g, 'MoonApp.state.currentOffsetX')
    .replace(/\bcurrentOffsetY\b/g, 'MoonApp.state.currentOffsetY')
    .replace(/\bisThumbnail\b/g, 'MoonApp.state.isThumbnail')
    .replace(/\bautoMiniTriggered\b/g, 'MoonApp.state.autoMiniTriggered')
    .replace(/\bc3SubPage\b/g, 'MoonApp.state.c3SubPage')
    .replace(/\bisPrologueActive\b/g, 'MoonApp.state.isPrologueActive')
    .replace(/\bpendingPrologue\b/g, 'MoonApp.state.pendingPrologue')
    .replace(/\bpendingVideo\b/g, 'MoonApp.state.pendingVideo')
    .replace(/\bisVideoOpen\b/g, 'MoonApp.state.isVideoOpen')
    .replace(/\bmenuVisible\b/g, 'MoonApp.state.menuVisible')
    .replace(/\bstartTime\b/g, 'MoonApp.state.startTime')
    .replace(/\bmouseX\b/g, 'MoonApp.state.mouseX')
    .replace(/\bmouseY\b/g, 'MoonApp.state.mouseY')
    .replace(/\bcurrentLang\b/g, 'MoonApp.state.currentLang')
    .replace(/\bglCanvas\b/g, 'MoonApp.orbiter.canvas')
    .replace(/\bglContext\b/g, 'MoonApp.orbiter.gl')
    .replace(/\bvertexPositionMain\b/g, 'MoonApp.orbiter.vertexPosition')
    .replace(/\bshaderProgramMain\b/g, 'MoonApp.orbiter.program')
    .replace(/\bcityCtx\b/g, 'MoonApp.cityCtx')
    .replace(/\bmoonCtx\b/g, 'MoonApp.moonCtx')
    .replace(/\bbridgeCtx\b/g, 'MoonApp.bridgeCtx')
    .replace(/\bpenumbralMoonCtx\b/g, 'MoonApp.penumbralMoonCtx')
    .replace(/\btotalCityCtx\b/g, 'MoonApp.totalCityCtx')
    .replace(/\btotalMoonCtx\b/g, 'MoonApp.totalMoonCtx')
    .replace(/\blocRes\b/g, 'MoonApp.orbiter.locs.res')
    .replace(/\blocCam\b/g, 'MoonApp.orbiter.locs.cam')
    .replace(/\blocProgress\b/g, 'MoonApp.orbiter.locs.progress')
    .replace(/\blocTime\b/g, 'MoonApp.orbiter.locs.time')
    .replace(/\blocOffset\b/g, 'MoonApp.orbiter.locs.offset')
    .replace(/\blocZoom\b/g, 'MoonApp.orbiter.locs.zoom')
    .replace(/\blocIdleRotation\b/g, 'MoonApp.orbiter.locs.idleRotation')
    .replace(/\blocThemeBlend\b/g, 'MoonApp.orbiter.locs.themeBlend')
    .replace(/\blocCoursePhase\b/g, 'MoonApp.orbiter.locs.coursePhase')
    .replace(/\blocCourse02Phase\b/g, 'MoonApp.orbiter.locs.course02Phase')
    .replace(/\bMoonApp\.state\.MoonApp\.state\./g, 'MoonApp.state.')
    .replace(/(?<!\.)\bi18n\b/g, 'MoonApp.i18n')
    .replace(/\blerp\(/g, 'MoonApp.lerp(')
    .replace(/\bsmoothstep\(/g, 'MoonApp.smoothstep(')
    .replace(/requestAnimationFrame\(render\)/g, 'requestAnimationFrame(MoonApp.render)')
    .replace(/\bproject3Dto2D\b/g, 'MoonApp.project3Dto2D')
    .replace(/\bupdateDynamicPanel\b/g, 'MoonApp.updateDynamicPanel')
    .replace(/\bupdateLanguageUI\b/g, 'MoonApp.updateLanguageUI')
    .replace(/\btoggleMini\b/g, 'MoonApp.toggleMini')
    .replace(/\btoggleLanguage\b/g, 'MoonApp.toggleLanguage')
    .replace(/\btoggleMenuDrawer\b/g, 'MoonApp.toggleMenuDrawer')
    .replace(/\bswitchTopTab\b/g, 'MoonApp.switchTopTab')
    .replace(/\bsetProgress\b/g, 'MoonApp.setProgress')
    .replace(/\bloadShader\b/g, 'MoonApp.loadShader')
    .replace(/\bshowError\b/g, 'MoonApp.showError')
    .replace(/\bcreateFBO\b/g, 'MoonApp.createFBO')
    .replace(/\bupdateTextArc\b/g, 'MoonApp.updateTextArc')
    .replace(/\bcourseModules\b/g, 'MoonApp.courseModules')
    .replace(/\bstartPrologue\b/g, 'MoonApp.prologue.start')
    .replace(/\bstopPrologue\b/g, 'MoonApp.prologue.stop')
    .replace(/\binitPrologue\b/g, 'MoonApp.prologue.init')
    .replace(/\bopenVideo\b/g, 'MoonApp.openVideo')
    .replace(/\bcloseVideo\b/g, 'MoonApp.closeVideo')
    .replace(/\bsetPanelState\b/g, 'MoonApp.prologue.setPanelState')
    .replace(/\bsharedVertexShaderMoon\b/g, 'MoonApp.SHARED_VERTEX_SHADER_MOON')
    .replace(/\bsharedVertexShader(?!Moon)\b/g, 'MoonApp.SHARED_VERTEX_SHADER')
    .replace(/MoonApp\.MoonApp\.project3Dto2D/g, 'MoonApp.project3Dto2D')
    .replace(/MoonApp\.MoonApp\./g, 'MoonApp.');
}

function remapShaders(code) {
  return code
    .replace(/\bloadShader\b/g, 'MoonApp.loadShader')
    .replace(/\bshowError\b/g, 'MoonApp.showError')
    .replace(/\bcreateFBO\b/g, 'MoonApp.createFBO')
    .replace(/\bsharedVertexShaderMoon\b/g, 'MoonApp.SHARED_VERTEX_SHADER_MOON')
    .replace(/\bsharedVertexShader(?!Moon)\b/g, 'MoonApp.SHARED_VERTEX_SHADER');
}

// ============ i18n.js ============
var i18nObj = extractAfter(scripts, 'const i18n = {', '\n\n        function updateLanguageUI');
writeFile('i18n.js', [
  'var MoonApp = MoonApp || {};',
  '',
  'MoonApp.i18n = {' + i18nObj.trim() + ';'
]);

// ============ webgl-utils.js ============
writeFile('webgl-utils.js', [
  'var MoonApp = MoonApp || {};',
  '',
  'MoonApp.showError = function' + extractAfter(scripts, 'function showError', '\n        function loadShader').trim() + ';',
  '',
  'MoonApp.loadShader = function' + extractAfter(scripts, 'function loadShader', '\n        function lerp').trim() + ';',
  '',
  'MoonApp.lerp = function(start, end, amt) { return (1 - amt) * start + amt * end; };',
  '',
  'MoonApp.smoothstep = function(min, max, value) {',
  '  var x = Math.max(0, Math.min(1, (value - min) / (max - min)));',
  '  return x * x * (3 - 2 * x);',
  '};',
  '',
  'MoonApp.createFBO = function' + extractAfter(scripts, 'function createFBO', '\n\n        // ======').trim() + ';',
  '',
  'MoonApp.setupQuadBuffer = function(gl) {',
  '  var buf = gl.createBuffer();',
  '  gl.bindBuffer(gl.ARRAY_BUFFER, buf);',
  '  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);',
  '  return buf;',
  '};'
]);

// ============ ui.js ============
var uiUpdateLang = remapVars(extractAfter(scripts, 'function updateLanguageUI', '\n        function toggleLanguage').trim());
var uiToggleLang = remapVars(extractAfter(scripts, 'function toggleLanguage', '\n        function toggleMenuDrawer').trim());
var uiToggleMenu = remapVars(extractAfter(scripts, 'function toggleMenuDrawer', '\n        function switchTopTab').trim());
var uiSwitchTab = remapVars(extractAfter(scripts, 'function switchTopTab', '\n        function toggleMini').trim());
var uiToggleMini = remapVars(extractAfter(scripts, 'function toggleMini', '\n\n        window.setProgress').trim());
var uiSetProgress = remapVars(extractAfter(scripts, 'window.setProgress = function', '\n\n        function updateDynamicPanel').trim());
var uiUpdateDyn = remapVars(extractAfter(scripts, 'function updateDynamicPanel', '\n\n        // ======').trim());

uiSwitchTab = uiSwitchTab.replace(
  "if (MoonApp.state.currentProgress > 0.6 && MoonApp.state.currentProgress < 0.9) {\n                if (action === 'next') {\n                    MoonApp.state.c3SubPage = Math.min(2, MoonApp.state.c3SubPage + 1);\n                } else if (action === 'prev') {\n                    MoonApp.state.c3SubPage = Math.max(0, MoonApp.state.c3SubPage - 1);\n                }\n            }",
  "if (MoonApp.state.currentProgress > 0.6 && MoonApp.state.currentProgress < 0.88) {\n                if (action === 'next') {\n                    MoonApp.state.c3SubPage = Math.min(2, MoonApp.state.c3SubPage + 1);\n                } else if (action === 'prev') {\n                    MoonApp.state.c3SubPage = Math.max(0, MoonApp.state.c3SubPage - 1);\n                }\n            } else if (MoonApp.state.currentProgress >= 0.88) {\n                if (action === 'next') {\n                    MoonApp.state.c4SubPage = Math.min(3, MoonApp.state.c4SubPage + 1);\n                } else if (action === 'prev') {\n                    MoonApp.state.c4SubPage = Math.max(0, MoonApp.state.c4SubPage - 1);\n                }\n            }"
);
uiSetProgress = uiSetProgress.replace(
  "MoonApp.state.c3SubPage = 0; ",
  "MoonApp.state.c3SubPage = 0; \n            MoonApp.state.c4SubPage = 0; "
);
uiToggleMenu = "() {\n            MoonApp.state.menuVisible = !MoonApp.state.menuVisible;\n            MoonApp.applyConsoleVisibility();\n            MoonApp.updateLanguageUI();\n        }";
uiToggleMini = uiToggleMini.replace(
  "            }\n        }",
  "            }\n            MoonApp.applyConsoleVisibility();\n        }"
);
uiSetProgress = uiSetProgress.replace(
  "            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));",
  "            MoonApp.applyConsoleVisibility();\n            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));"
);

writeFile('ui.js', [
  'var MoonApp = MoonApp || {};',
  '',
  'MoonApp.state = {',
  '  menuVisible: true,',
  '  isThumbnail: false,',
  '  autoMiniTriggered: true,',
  '  currentLang: \'zh\',',
  '  c3SubPage: 0,',
  '  c4SubPage: 0,',
  '  currentProgress: 0.0,',
  '  targetProgress: 0.0,',
  '  currentThemeBlend: 0.0,',
  '  targetThemeBlend: 0.0,',
  '  currentCoursePhase: 1.0,',
  '  targetCoursePhase: 1.0,',
  '  currentCourse02Phase: 0.0,',
  '  targetCourse02Phase: 0.0,',
  '  idleRotation: 0.0,',
  '  currentZoom: 1.0,',
  '  currentOffsetX: 0.6,',
  '  currentOffsetY: 0.0,',
  '  startTime: 0,',
  '  camTheta: Math.PI / 4.0,',
  '  camPhi: Math.PI / 2.6,',
  '  camRadius: 26.0,',
  '  isDragging: false,',
  '  lastX: 0,',
  '  lastY: 0,',
  '  mouseX: 0,',
  '  mouseY: 0,',
  '  isPrologueActive: false,',
  '  pendingPrologue: false,',
  '  pendingVideo: false,',
  '  isVideoOpen: false',
  '};',
  '',
  'MoonApp.courseModules = [',
  '  { alert: false },',
  '  { alert: false },',
  '  { alert: false },',
  '  { alert: true }',
  '];',
  '',
  'MoonApp.coreConsoleIds = [\'core0-lab-ui\', \'core1-lab-ui\', \'core2-lab-ui\', \'core3-ui-layer\'];',
  '',
  'MoonApp.isCoreActive = function() {',
  '  return MoonApp.state.currentProgress >= 0.88 && MoonApp.state.isThumbnail;',
  '};',
  '',
  'MoonApp.applyConsoleVisibility = function() {',
  '  var labUi = document.getElementById(\'lab-ui-container\');',
  '  var svgLayer = document.getElementById(\'text-svg-layer\');',
  '  var inCore = MoonApp.isCoreActive();',
  '  document.body.classList.toggle(\'core-mode\', inCore);',
  '  var showMain = MoonApp.state.menuVisible && !inCore && !MoonApp.state.isPrologueActive && !MoonApp.state.isVideoOpen && !MoonApp.state.pendingVideo;',
  '  if (labUi) {',
  '    if (showMain) labUi.classList.remove(\'ui-hidden\');',
  '    else labUi.classList.add(\'ui-hidden\');',
  '  }',
  '  if (svgLayer) {',
  '    svgLayer.style.opacity = showMain && !MoonApp.state.isThumbnail ? \'1\' : \'0\';',
  '  }',
  '  MoonApp.coreConsoleIds.forEach(function(id, index) {',
  '    var panel = document.getElementById(id);',
  '    if (!panel) return;',
  '    var showCore = inCore && MoonApp.state.menuVisible && index === MoonApp.state.c4SubPage;',
  '    if (showCore) panel.classList.remove(\'ui-hidden\');',
  '    else panel.classList.add(\'ui-hidden\');',
  '  });',
  '  var dict = MoonApp.i18n && MoonApp.i18n[MoonApp.state.currentLang];',
  '  var toggleText = document.getElementById(\'menu-toggle-text\');',
  '  if (dict && toggleText) {',
  '    toggleText.innerHTML = MoonApp.state.menuVisible ? dict.hideConsole : dict.showConsole;',
  '  }',
  '};',
  '',
  'MoonApp.updateLanguageUI = function' + uiUpdateLang + ';',
  '',
  'MoonApp.toggleLanguage = function' + uiToggleLang + ';',
  '',
  'MoonApp.toggleMenuDrawer = function' + uiToggleMenu + ';',
  '',
  'MoonApp.switchTopTab = function' + uiSwitchTab + ';',
  '',
  'MoonApp.toggleMini = function' + uiToggleMini + ';',
  '',
  'MoonApp.setProgress = function' + uiSetProgress + ';',
  '',
  'MoonApp.updateDynamicPanel = function' + uiUpdateDyn + ';',
  '',
  'window.setProgress = MoonApp.setProgress;',
  'window.switchTopTab = MoonApp.switchTopTab;',
  'window.toggleMini = MoonApp.toggleMini;',
  'window.toggleLanguage = MoonApp.toggleLanguage;',
  'window.toggleMenuDrawer = MoonApp.toggleMenuDrawer;'
]);

// ============ shader-partial.js ============
var initCityCode = remapShaders(extractAfter(scripts, 'function initCityShader', '\n\n        function initMoonShader').trim());
var initMoonCode = remapShaders(extractAfter(scripts, 'function initMoonShader', '\n\n        const cityCtx').trim());

writeFile('shader-partial.js', [
  'var MoonApp = MoonApp || {};',
  '',
  'MoonApp.initCityShader = function' + initCityCode + ';',
  '',
  'MoonApp.initMoonShader = function' + initMoonCode + ';'
]);

// ============ shader-penumbral.js ============
var sharedVertMoon = extractAfter(scripts, 'const sharedVertexShaderMoon = ', ';\n\n        const sharedVertexShader');
var sharedVert = extractAfter(scripts, 'const sharedVertexShader = `', '`;\n\n        function initPenumbralBridge');
var bridgeCode = remapShaders(extractAfter(scripts, 'function initPenumbralBridge', '\n\n        function initPenumbralMoon').trim());
var penumbralMoonCode = remapShaders(extractAfter(scripts, 'function initPenumbralMoon', '\n\n        const bridgeCtx').trim());

writeFile('shader-penumbral.js', [
  'var MoonApp = MoonApp || {};',
  '',
  'MoonApp.SHARED_VERTEX_SHADER_MOON = ' + sharedVertMoon.trim() + ';',
  '',
  'MoonApp.SHARED_VERTEX_SHADER = `' + sharedVert + '`;',
  '',
  'MoonApp.initPenumbralBridge = function' + bridgeCode + ';',
  '',
  'MoonApp.initPenumbralMoon = function' + penumbralMoonCode + ';'
]);

// ============ shader-total.js ============
var totalCityCode = remapShaders(extractAfter(scripts, 'function initTotalCityPipeline', '\n\n        function initTotalMoonShader').trim());
var totalMoonCode = remapShaders(extractAfter(scripts, 'function initTotalMoonShader', '\n\n        const totalCityCtx').trim());

writeFile('shader-total.js', [
  'var MoonApp = MoonApp || {};',
  '',
  'MoonApp.initTotalCityPipeline = function' + totalCityCode + ';',
  '',
  'MoonApp.initTotalMoonShader = function' + totalMoonCode + ';'
]);

// ============ orbiter.js ============
var orbiterCore = extractAfter(scripts,
  'const glCanvas = document.getElementById(\'glcanvas\');',
  '\n        let camTheta');
orbiterCore = orbiterCore.replace(/\bloadShader\(/g, 'MoonApp.loadShader(');

writeFile('orbiter.js', [
  'var MoonApp = MoonApp || {};',
  '',
  'MoonApp.initOrbiter = function() {',
  '  var glCanvas = document.getElementById(\'glcanvas\');',
  orbiterCore.trim(),
  '  return {',
  '    gl: glContext,',
  '    program: shaderProgramMain,',
  '    canvas: glCanvas,',
  '    locs: {',
  '      res: locRes,',
  '      cam: locCam,',
  '      progress: locProgress,',
  '      time: locTime,',
  '      offset: locOffset,',
  '      zoom: locZoom,',
  '      idleRotation: locIdleRotation,',
  '      themeBlend: locThemeBlend,',
  '      coursePhase: locCoursePhase,',
  '      course02Phase: locCourse02Phase',
  '    },',
  '    vertexPosition: vertexPositionMain',
  '  };',
  '};'
]);

// ============ main.js ============
var resizeCode = extractAfter(scripts, 'function resize()', '\n        window.addEventListener').trim();
var renderCode = extractAfter(scripts, 'function render(now)', '\n\n        updateLanguageUI').trim();
var projCode = extractAfter(scripts, 'function project3Dto2D', '\n\n        const courseModules').trim();
var arcCode = extractAfter(scripts, 'function updateTextArc', '\n\n        function resize').trim();

resizeCode = remapVars(resizeCode);
resizeCode = resizeCode.replace(/^\s*\{\s*/, '').replace(/\s*\}\s*$/, '');
renderCode = remapVars(renderCode);
renderCode = renderCode.replace(/^\s*\{\s*\n?/, '').replace(/\s*\}\s*$/, '');
renderCode = 'const percText = document.getElementById(\'perc-text\');\n' + renderCode;
renderCode = renderCode.replace(
  "c3Scene.style.opacity = showC3 ? '1' : '0';\n            penumbralScene.style.opacity = showPenumbral ? '1' : '0';\n            totalScene.style.opacity = showTotal ? '1' : '0';",
  "c3Scene.style.opacity = showC3 ? '1' : '0';\n            penumbralScene.style.opacity = showPenumbral ? '1' : '0';\n            totalScene.style.opacity = showTotal ? '1' : '0';\n\n            if (inCourse03) {\n                MoonApp.ensureCourse03Scene(MoonApp.state.c3SubPage);\n            }"
);
renderCode = renderCode.replace(
  'requestAnimationFrame(MoonApp.render);',
  "let inCore = MoonApp.state.currentProgress >= 0.88 && MoonApp.state.isThumbnail;\n\n            if (inCore && MoonApp.CoreSubpages) {\n                MoonApp.CoreSubpages.activate(MoonApp.state.c4SubPage);\n            } else if (!inCore && MoonApp.CoreSubpages) {\n                MoonApp.CoreSubpages.pauseAll();\n            }\n\n            requestAnimationFrame(MoonApp.render);"
);
projCode = remapVars(projCode);
arcCode = remapVars(arcCode);

writeFile('main.js', [
  'var MoonApp = MoonApp || {};',
  '',
  'MoonApp.ensureCourse03Scene = function(index) {',
  '  var didInit = false;',
  '  if (index === 0) {',
  '    if (!MoonApp.cityCtx) { MoonApp.cityCtx = MoonApp.initCityShader(); didInit = true; }',
  '    if (!MoonApp.moonCtx) { MoonApp.moonCtx = MoonApp.initMoonShader(); didInit = true; }',
  '  } else if (index === 1) {',
  '    if (!MoonApp.bridgeCtx) { MoonApp.bridgeCtx = MoonApp.initPenumbralBridge(); didInit = true; }',
  '    if (!MoonApp.penumbralMoonCtx) { MoonApp.penumbralMoonCtx = MoonApp.initPenumbralMoon(); didInit = true; }',
  '  } else if (index === 2) {',
  '    if (!MoonApp.totalCityCtx) { MoonApp.totalCityCtx = MoonApp.initTotalCityPipeline(); didInit = true; }',
  '    if (!MoonApp.totalMoonCtx) { MoonApp.totalMoonCtx = MoonApp.initTotalMoonShader(); didInit = true; }',
  '  }',
  '  if (didInit) MoonApp.resize();',
  '};',
  '',
  'MoonApp.resize = function() {',
   '  if (!MoonApp.orbiter) return;',
   resizeCode,
   '};',
  '',
  'MoonApp.render = function(now) {\n' + renderCode + '};',
  '',
  'var _cross = function(a, b) { return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]]; };',
  'var _dot = function(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; };',
  'var _normalize = function(v) { var len = Math.sqrt(_dot(v,v)); return [v[0]/len, v[1]/len, v[2]/len]; };',
  '',
  'MoonApp.project3Dto2D = function' + projCode.replace(/\bcross\(/g, '_cross(').replace(/\bdot\(/g, '_dot(').replace(/\bnormalize\(/g, '_normalize(') + ';',
  '',
  'MoonApp.updateTextArc = function' + arcCode + ';',
  '',
  'MoonApp.init = function() {',
  '  var app = MoonApp;',
  '  var s = app.state;',
  '',
  '  app.updateLanguageUI();',
  '',
  '  window.addEventListener(\'resize\', app.resize);',
  '',
  '  var interactionLayer = document.getElementById(\'interaction-layer\');',
  '',
  '  window.addEventListener(\'mousemove\', function(e) { s.mouseX = e.clientX; s.mouseY = window.innerHeight - e.clientY; });',
  '',
  '  interactionLayer.addEventListener(\'mousedown\', function(e) { s.isDragging = true; s.lastX = e.clientX; s.lastY = e.clientY; });',
  '  interactionLayer.addEventListener(\'mousemove\', function(e) {',
  '    if (s.isDragging) {',
  '      s.camTheta -= (e.clientX - s.lastX) * 0.005;',
  '      s.camPhi -= (e.clientY - s.lastY) * 0.005;',
  '      s.camPhi = Math.max(0.05, Math.min(Math.PI / 2.0 - 0.05, s.camPhi));',
  '      s.lastX = e.clientX; s.lastY = e.clientY;',
  '    }',
  '  });',
  '  interactionLayer.addEventListener(\'mouseup\', function() { s.isDragging = false; });',
  '  interactionLayer.addEventListener(\'wheel\', function(e) {',
  '    s.camRadius = Math.max(12.0, Math.min(50.0, s.camRadius + e.deltaY * 0.02));',
  '  });',
  '',
  '  interactionLayer.addEventListener(\'touchstart\', function(e) {',
  '    s.isDragging = true;',
  '    s.lastX = e.touches[0].clientX;',
  '    s.lastY = e.touches[0].clientY;',
  '  }, { passive: true });',
  '  interactionLayer.addEventListener(\'touchmove\', function(e) {',
  '    if (s.isDragging) {',
  '      s.camTheta -= (e.touches[0].clientX - s.lastX) * 0.005;',
  '      s.camPhi -= (e.touches[0].clientY - s.lastY) * 0.005;',
  '      s.camPhi = Math.max(0.05, Math.min(Math.PI / 2.0 - 0.05, s.camPhi));',
  '      s.lastX = e.touches[0].clientX; s.lastY = e.touches[0].clientY;',
  '    }',
  '  }, { passive: true });',
  '  interactionLayer.addEventListener(\'touchend\', function() { s.isDragging = false; });',
  '',
  '  s.startTime = performance.now();',
  '',
  '  app.cityCtx = null;',
  '  app.moonCtx = null;',
  '  app.bridgeCtx = null;',
  '  app.penumbralMoonCtx = null;',
  '  app.totalCityCtx = null;',
  '  app.totalMoonCtx = null;',
  '  app.orbiter = app.initOrbiter();',
  '',
  '  app.resize();',
  '  if (app.prologue) app.prologue.init();',
  '  requestAnimationFrame(app.render);',
  '};',
  '',
  'MoonApp.openVideo = function() {',
  '  var state = MoonApp.state;',
  '  state.isVideoOpen = true;',
  '  var vc = document.getElementById(\'video-panel-container\');',
  '  vc.classList.add(\'active\');',
  '  document.getElementById(\'interaction-layer\').style.pointerEvents = \'none\';',
  '  document.getElementById(\'lab-ui-container\').classList.add(\'ui-hidden\');',
  '  document.getElementById(\'text-svg-layer\').style.opacity = \'0\';',
  '  var vid = document.getElementById(\'columbus-video\');',
  '  vid.currentTime = 0;',
  '  vid.play();',
  '};',
  '',
  'MoonApp.closeVideo = function() {',
  '  var state = MoonApp.state;',
  '  state.isVideoOpen = false;',
  '  var vc = document.getElementById(\'video-panel-container\');',
  '  vc.classList.remove(\'active\');',
  '  var vid = document.getElementById(\'columbus-video\');',
  '  vid.pause();',
  '  document.getElementById(\'interaction-layer\').style.pointerEvents = \'auto\';',
  '  document.getElementById(\'lab-ui-container\').classList.remove(\'ui-hidden\');',
  '  if(state.menuVisible) document.getElementById(\'text-svg-layer\').style.opacity = \'1\';',
  '};',
  '',
  'window.closeVideo = MoonApp.closeVideo;',
  'window.openVideo = MoonApp.openVideo;'
]);

console.log('\nAll modules generated successfully!');

var bundleOrder = [
  'i18n.js', 'webgl-utils.js', 'ui.js',
  'shader-partial.js', 'shader-penumbral.js', 'shader-total.js',
  'orbiter.js', 'main.js', 'prologue.js',
  'core-subpages-manager.js', 'core-01.js', 'core-02.js', 'core-03.js', 'core-04.js'
];
var bundleCode = bundleOrder.map(function(f) {
  return '// ====== ' + f + ' ======\n' + require('fs').readFileSync(require('path').join(outDir, f), 'utf8');
}).join('\n\n');
require('fs').writeFileSync(require('path').join(outDir, 'bundle.js'), bundleCode, 'utf8');
var kb = (require('fs').statSync(require('path').join(outDir, 'bundle.js')).size / 1024).toFixed(1);
console.log('Bundle: js/bundle.js (' + kb + ' KB)');
