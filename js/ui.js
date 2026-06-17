var MoonApp = MoonApp || {};

MoonApp.state = {
  menuVisible: true,
  isThumbnail: false,
  autoMiniTriggered: true,
  currentLang: 'zh',
  c3SubPage: 0,
  c4SubPage: 0,
  currentProgress: 0.0,
  targetProgress: 0.0,
  currentThemeBlend: 0.0,
  targetThemeBlend: 0.0,
  currentCoursePhase: 1.0,
  targetCoursePhase: 1.0,
  currentCourse02Phase: 0.0,
  targetCourse02Phase: 0.0,
  idleRotation: 0.0,
  currentZoom: 1.0,
  currentOffsetX: 0.6,
  currentOffsetY: 0.0,
  startTime: 0,
  camTheta: Math.PI / 4.0,
  camPhi: Math.PI / 2.6,
  camRadius: 26.0,
  isDragging: false,
  lastX: 0,
  lastY: 0,
  mouseX: 0,
  mouseY: 0,
  isPrologueActive: false,
  pendingPrologue: false,
  pendingVideo: false,
  isVideoOpen: false
};

MoonApp.courseModules = [
  { alert: false },
  { alert: false },
  { alert: false },
  { alert: true }
];

MoonApp.coreConsoleIds = ['core0-lab-ui', 'core1-lab-ui', 'core2-lab-ui', 'core3-ui-layer'];

MoonApp.isCoreActive = function() {
  return MoonApp.state.currentProgress >= 0.88 && MoonApp.state.isThumbnail;
};

MoonApp.applyConsoleVisibility = function() {
  var labUi = document.getElementById('lab-ui-container');
  var svgLayer = document.getElementById('text-svg-layer');
  var inCore = MoonApp.isCoreActive();
  document.body.classList.toggle('core-mode', inCore);
  var showMain = MoonApp.state.menuVisible && !inCore && !MoonApp.state.isPrologueActive && !MoonApp.state.isVideoOpen && !MoonApp.state.pendingVideo;
  if (labUi) {
    if (showMain) labUi.classList.remove('ui-hidden');
    else labUi.classList.add('ui-hidden');
  }
  if (svgLayer) {
    svgLayer.style.opacity = showMain && !MoonApp.state.isThumbnail ? '1' : '0';
  }
  MoonApp.coreConsoleIds.forEach(function(id, index) {
    var panel = document.getElementById(id);
    if (!panel) return;
    var showCore = inCore && MoonApp.state.menuVisible && index === MoonApp.state.c4SubPage;
    if (showCore) panel.classList.remove('ui-hidden');
    else panel.classList.add('ui-hidden');
  });
  var dict = MoonApp.i18n && MoonApp.i18n[MoonApp.state.currentLang];
  var toggleText = document.getElementById('menu-toggle-text');
  if (dict && toggleText) {
    toggleText.innerHTML = MoonApp.state.menuVisible ? dict.hideConsole : dict.showConsole;
  }
};

MoonApp.updateLanguageUI = function() {
            const dict = MoonApp.i18n[MoonApp.state.currentLang];
            const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.innerHTML = txt; };
            
            setTxt('tab-1', dict.tab1); setTxt('tab-2', dict.tab2); setTxt('tab-3', dict.tab3); setTxt('tab-4', dict.tab4);
            setTxt('menu-toggle-text', MoonApp.state.menuVisible ? dict.hideConsole : dict.showConsole);
            setTxt('lbl-ref', dict.references); setTxt('lang-btn', dict.langToggle);
            
            setTxt('ui-tagline', dict.tagline);
            setTxt('ui-title', dict.mainTitle);
            setTxt('ui-desc', dict.mainDesc);
            setTxt('lbl-synodic', dict.lblSynodic);
            setTxt('lbl-orbital', dict.lblOrbital);
            setTxt('lbl-atmo', dict.lblAtmo);

            setTxt('mod-1-text', dict.mod1);
            setTxt('mod-2-text', dict.mod2);
            setTxt('mod-3-text', dict.mod3);
            setTxt('mod-4-text', dict.mod4);
            
            MoonApp.updateDynamicPanel(MoonApp.state.currentProgress);
        };

MoonApp.toggleLanguage = function() { 
            MoonApp.state.currentLang = MoonApp.state.currentLang === 'zh' ? 'en' : 'zh'; 
            MoonApp.updateLanguageUI(); 
            MoonApp.updateDynamicPanel(MoonApp.state.currentProgress);
        };

MoonApp.toggleMenuDrawer = function() {
            MoonApp.state.menuVisible = !MoonApp.state.menuVisible;
            MoonApp.applyConsoleVisibility();
            MoonApp.updateLanguageUI();
        };

MoonApp.switchTopTab = function(element, action) {
            document.querySelectorAll('.retro-tab').forEach(tab => tab.classList.remove('active-tab'));
            element.classList.add('active-tab');

            if (MoonApp.state.currentProgress > 0.6 && MoonApp.state.currentProgress < 0.88) {
                if (action === 'next') {
                    MoonApp.state.c3SubPage = Math.min(2, MoonApp.state.c3SubPage + 1);
                } else if (action === 'prev') {
                    MoonApp.state.c3SubPage = Math.max(0, MoonApp.state.c3SubPage - 1);
                }
            } else if (MoonApp.state.currentProgress >= 0.88) {
                if (action === 'next') {
                    MoonApp.state.c4SubPage = Math.min(3, MoonApp.state.c4SubPage + 1);
                } else if (action === 'prev') {
                    MoonApp.state.c4SubPage = Math.max(0, MoonApp.state.c4SubPage - 1);
                }
            }
        };

MoonApp.toggleMini = function() {
            const topNavBar = document.getElementById('top-nav-bar');
            const interactionLayer = document.getElementById('interaction-layer');
            const svgLayer = document.getElementById('text-svg-layer');
            
            MoonApp.state.isThumbnail = !MoonApp.state.isThumbnail;
            
            if(MoonApp.state.isThumbnail) {
                topNavBar.classList.add('pip-active');
                interactionLayer.style.pointerEvents = 'none';
                svgLayer.style.opacity = '0'; 
            } else {
                topNavBar.classList.remove('pip-active');
                interactionLayer.style.pointerEvents = 'auto'; 
                
                if(MoonApp.state.isPrologueActive) {
                    MoonApp.state.isPrologueActive = false;
                    document.getElementById('prologue-layer').style.opacity = '0';
                    document.getElementById('prologue-layer').style.pointerEvents = 'none';
                    document.getElementById('interaction-layer').style.pointerEvents = 'auto';
                    document.getElementById('lab-ui-container').classList.remove('ui-hidden');
                    if(MoonApp.state.menuVisible) document.getElementById('text-svg-layer').style.opacity = '1';
                    setTimeout(MoonApp.prologue.stop, 1500); 
                }
                
                if(MoonApp.state.isVideoOpen) {
                    MoonApp.closeVideo();
                }
                
                if(MoonApp.state.menuVisible) svgLayer.style.opacity = '1';
                MoonApp.state.autoMiniTriggered = true; 
            }
            MoonApp.applyConsoleVisibility();
        };

MoonApp.setProgress = function(val, btn) {
            MoonApp.state.targetProgress = val;
            MoonApp.state.idleRotation = 0.0; 
            MoonApp.state.autoMiniTriggered = false; 
            MoonApp.state.c3SubPage = 0; 
            MoonApp.state.c4SubPage = 0; 
            
            // ★ Course 01: 自动触发 Prologue / Course 02: 视频弹窗
            let isCourse01 = btn && btn.querySelector('span[id^="mod-1"]');
            if (isCourse01) {
                MoonApp.state.pendingPrologue = true;
            } else {
                MoonApp.state.pendingPrologue = false;
                if(MoonApp.state.isPrologueActive) {
                    MoonApp.state.isPrologueActive = false;
                    document.getElementById('prologue-layer').style.opacity = '0';
                    document.getElementById('prologue-layer').style.pointerEvents = 'none';
                    document.getElementById('interaction-layer').style.pointerEvents = 'auto';
                    document.getElementById('lab-ui-container').classList.remove('ui-hidden');
                    if(MoonApp.state.menuVisible) document.getElementById('text-svg-layer').style.opacity = '1';
                    setTimeout(MoonApp.prologue.stop, 1500);
                }
            }
            
            // ★ Theme switching
            let isCourse02 = btn && btn.querySelector('span[id^="mod-2"]');
            let isCoreButton = btn && btn.querySelector('span[id^="mod-4"]');
            document.body.classList.remove('theme-core', 'theme-course01', 'theme-course02');
            if (isCourse01) {
                document.body.classList.add('theme-course01');
                MoonApp.state.targetThemeBlend = 0.0;
                MoonApp.state.targetCoursePhase = 1.0;
                MoonApp.state.targetCourse02Phase = 0.0;
            } else if (isCourse02) {
                document.body.classList.add('theme-course02');
                MoonApp.state.targetThemeBlend = 0.0;
                MoonApp.state.targetCoursePhase = 0.0;
                MoonApp.state.targetCourse02Phase = 1.0;
                MoonApp.state.pendingVideo = true;
            } else if (isCoreButton) {
                document.body.classList.add('theme-core');
                MoonApp.state.targetThemeBlend = 1.0;
                MoonApp.state.targetCoursePhase = 0.0;
                MoonApp.state.targetCourse02Phase = 0.0;
                MoonApp.state.pendingVideo = false;
                if(MoonApp.state.isVideoOpen) MoonApp.closeVideo();
            } else {
                MoonApp.state.targetThemeBlend = 0.0;
                MoonApp.state.targetCoursePhase = 0.0;
                MoonApp.state.targetCourse02Phase = 0.0;
                MoonApp.state.pendingVideo = false;
                if(MoonApp.state.isVideoOpen) MoonApp.closeVideo();
            }

            if (MoonApp.state.isThumbnail && !isCourse01 && !isCourse02) MoonApp.toggleMini(); 
            
            MoonApp.applyConsoleVisibility();
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            if(btn) btn.classList.add('active');
        };

MoonApp.updateDynamicPanel = function(phase) {
            let q = -1;
            if (phase > 0.1) {
                q = Math.max(0, Math.min(Math.floor((phase - 0.001) * 4.0), 3));
            }

            const dict = MoonApp.i18n[MoonApp.state.currentLang];
            const vProg = document.getElementById('val-progress');
            const vSubj = document.getElementById('val-subject');
            const vMode = document.getElementById('val-mode');

            if (!vProg || !vSubj || !vMode) return;

            let isCore = document.body.classList.contains('theme-core');
            let isC01 = document.body.classList.contains('theme-course01');
            let isC02 = document.body.classList.contains('theme-course02');
            let mainColor = isCore ? '#ff2a4b' : (isC01 ? '#a855f7' : (isC02 ? '#ff77aa' : '#ffaa00'));
            let standbyColor = isCore ? '#aa99bb' : (isC01 ? '#9999cc' : (isC02 ? '#cba5c5' : '#94a3b8'));

            if (q === -1) {
                vProg.innerHTML = dict.standbyProg;
                vSubj.innerHTML = dict.standbySubj;
                vMode.innerHTML = dict.standbyMode;
                [vProg, vSubj, vMode].forEach(el => el.style.color = standbyColor); 
            } else {
                vProg.innerHTML = dict.dynProg[q];
                vSubj.innerHTML = dict.dynSubj[q];
                vMode.innerHTML = dict.dynMode[q];
                [vProg, vSubj, vMode].forEach(el => el.style.color = mainColor); 
            }
        };

window.setProgress = MoonApp.setProgress;
window.switchTopTab = MoonApp.switchTopTab;
window.toggleMini = MoonApp.toggleMini;
window.toggleLanguage = MoonApp.toggleLanguage;
window.toggleMenuDrawer = MoonApp.toggleMenuDrawer;