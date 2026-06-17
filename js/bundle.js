// ====== i18n.js ======
var MoonApp = MoonApp || {};

MoonApp.i18n = {zh: {
                tab1: "引言", tab2: "上一页", tab3: "下一页", tab4: "首页", langToggle: "ENGLISH",
                hideConsole: "收起控制面板", showConsole: "展开控制面板", references: "References",
                tagline: "CELESTIAL MECHANICS · 天体力学交互式推演",
                mainTitle: "覆绛",
                mainDesc: "欢迎进入本交互式学习枢纽。课程将带您跨越人文与科学的边界，从蒙昧时代的血月神话、哥伦布的星象博弈，一路深入到现代天文学对朔望交点的严谨解析与大气折射的三维推演。",
                lblSynodic: "当前课程进度:", lblOrbital: "核心课题:", lblAtmo: "教学模块:",
                mod1: "[ COURSE 01 ] 蒙昧时代的血月神话",
                mod2: "[ COURSE 02 ] 哥伦布的星象博弈",
                mod3: "[ COURSE 03 ] 可视化：不同月食的成因",
                mod4: "[ CORE ] 大气折射与本影推演",
                dynProg: ["PHASE 1 - 启蒙阶段", "PHASE 2 - 历史纪事", "PHASE 3 - 核心原理", "PHASE 4 - 深度进阶"],
                dynSubj: ["神话与图腾传说", "航海时代的星象学", "全阶段月食可视化", "地球大气与光学折射"],
                dynMode: ["历史档案阅读", "交互式叙事", "全息三维物理推演", "光学参数模拟"],
                standbyProg: "系统待机", standbySubj: "等待输入", standbyMode: "全息阵列就绪"
            },
            en: {
                tab1: "INTRO", tab2: "PREV", tab3: "NEXT", tab4: "HOME", langToggle: "中文",
                hideConsole: "HIDE PANEL", showConsole: "SHOW PANEL", references: "REFERENCES",
                tagline: "CELESTIAL MECHANICS",
                mainTitle: "ALIGNMENT",
                mainDesc: "Welcome to the interactive learning hub. This course bridges humanities and science, taking you from blood moon myths of the dark ages and Columbus's astrological gambit, to the rigorous analysis of syzygy nodes and 3D simulations of atmospheric refraction.",
                lblSynodic: "COURSE PROGRESS:", lblOrbital: "CORE SUBJECT:", lblAtmo: "TEACHING MODE:",
                mod1: "[ COURSE 01 ] MYTHS OF THE DARK AGES",
                mod2: "[ COURSE 02 ] THE COLUMBUS GAMBIT",
                mod3: "[ COURSE 03 ] VISUALIZING ECLIPSE CAUSES",
                mod4: "[ CORE ] ATMOSPHERIC REFRACTION",
                dynProg: ["PHASE 1 - INITIATION", "PHASE 2 - CHRONICLE", "PHASE 3 - CORE PRINCIPLES", "PHASE 4 - ADVANCED"],
                dynSubj: ["MYTHS & TOTEMS", "ASTRONOMY IN NAVAL ERA", "ECLIPSE VISUALIZATION", "ATMOSPHERE & REFRACTION"],
                dynMode: ["ARCHIVE READING", "INTERACTIVE NARRATIVE", "HOLOGRAPHIC 3D SIMULATION", "OPTICAL PARAMETER SIMULATION"],
                standbyProg: "STANDBY", standbySubj: "AWAITING INPUT", standbyMode: "HOLO-ARRAY READY"
            }
        };;

// ====== webgl-utils.js ======
var MoonApp = MoonApp || {};

MoonApp.showError = function(msg) {
            const el = document.getElementById('errorOverlay');
            el.style.display = 'block';
            el.textContent += msg + "\n\n";
        };

MoonApp.loadShader = function(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader Error:\n", gl.getShaderInfoLog(shader));
                showError("❌ 显卡拒绝编译着色器：\n" + gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

MoonApp.lerp = function(start, end, amt) { return (1 - amt) * start + amt * end; };

MoonApp.smoothstep = function(min, max, value) {
  var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
};

MoonApp.createFBO = function(gl, width, height) {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return { fbo, tex };
        };

MoonApp.setupQuadBuffer = function(gl) {
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  return buf;
};

// ====== ui.js ======
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

// ====== shader-partial.js ======
var MoonApp = MoonApp || {};

MoonApp.initCityShader = function() {
            const canvas = document.getElementById('cityCanvas');
            const gl = canvas.getContext('webgl2');
            if (!gl) return null;

            const vsSource = `#version 300 es
            in vec4 a_position;
            void main() { gl_Position = a_position; }`;

            const fsSource = `#version 300 es
            precision highp float;
            uniform vec3 iResolution;
            uniform float iTime;
            uniform vec4 iMouse;
            out vec4 fragColor_out;

            const float streetDistance = 0.6;
            const vec3 streetColor = vec3(4.0, 8.0, 10.0);
            const float fogDensity = 0.5;
            const float fogDistance = 4.0;
            const vec3 fogColor = vec3(0.34, 0.37, 0.4);
            const float windowSize = 0.1;
            const float windowDivergence = 0.2;
            const vec3 windowColor = vec3(0.1, 0.2, 0.5);
            const float beaconProb = 0.0003;
            const float beaconFreq = 0.6;
            const vec3 beaconColor = vec3(0.8, 0.3, 1.8);
            const float tau = 6.283185;

            float hash1(vec2 p2) { p2 = fract(p2 * vec2(5.3983, 5.4427)); p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137)); return fract(p2.x * p2.y * 95.4337); }
            float hash1(vec2 p2, float p) { vec3 p3 = fract(vec3(5.3983 * p2.x, 5.4427 * p2.y, 6.9371 * p)); p3 += dot(p3, p3.yzx + 19.19); return fract((p3.x + p3.y) * p3.z); }
            vec2 hash2(vec2 p2) { vec3 p3 = fract(vec3(5.3983 * p2.x, 5.4427 * p2.y, 6.9371 * p2.x)); p3 += dot(p3, p3.yzx + 19.19); return fract((p3.xx + p3.yz) * p3.zy); }
            vec2 hash2(vec2 p2, float p) { vec3 p3 = fract(vec3(5.3983 * p2.x, 5.4427 * p2.y, 6.9371 * p)); p3 += dot(p3, p3.yzx + 19.19); return fract((p3.xx + p3.yz) * p3.zy); }
            vec3 hash3(vec2 p2) { vec3 p3 = fract(vec3(p2.xyx) * vec3(5.3983, 5.4427, 6.9371)); p3 += dot(p3, p3.yxz + 19.19); return fract((p3.xxy + p3.yzz) * p3.zyx); }
            float noise1(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(hash1(i + vec2(0.0, 0.0)), hash1(i + vec2(1.0, 0.0)), u.x), mix(hash1(i + vec2(0.0, 1.0)), hash1(i + vec2(1.0, 1.0)), u.x), u.y); }

            vec4 castRay(vec3 eye, vec3 ray) {
                vec2 block = floor(eye.xy); vec3 ri = 1.0 / ray; vec3 rs = sign(ray); vec3 side = 0.5 + 0.5 * rs; vec2 ris = ri.xy * rs.xy; vec2 dis = (block - eye.xy + 0.5 + rs.xy * 0.5) * ri.xy; float beacon = 0.0;
                for (int i = 0; i < 200; ++i) {
                    vec2 lo0 = vec2(block + 0.01); vec2 loX = vec2(0.3, 0.3); vec2 hi0 = vec2(block + 0.69); vec2 hiX = vec2(0.3, 0.3); float height = (0.5 + hash1(block)) * (2.0 + 4.0 * pow(noise1(0.1 * block), 2.5));
                    float dist = 500.0; float face = 0.0;
                    for (int j = 0; j < 3; ++j) {
                        float top = height * (1.0 - 0.1 * float(j)); vec3 lo = vec3(lo0 + loX * hash2(block, float(j)), 0.0); vec3 hi = vec3(hi0 + hiX * hash2(block, float(j) + 0.5), top); vec3 wall = mix(hi, lo, side); vec3 t = (wall - eye) * ri; vec3 dim = step(t.zxy, t) * step(t.yzx, t); float maxT = dot(dim, t); float maxFace = 1.0 - dim.z; vec3 p = eye + maxT * ray; dim += step(lo, p) * step(p, hi);
                        if (dim.x * dim.y * dim.z > 0.5 && maxT < dist) { dist = maxT; face = maxFace; }
                    }
                    float prob = beaconProb * pow(height, 3.0); vec2 h = hash2(block);
                    if (h.x < prob) {
                        vec3 center = vec3(block + 0.5, height + 0.2); float t = dot(center - eye, ray);
                        if (t < dist) {
                            vec3 p = eye + t * ray; float fog = (exp(-p.z / fogDistance) - exp(-eye.z / fogDistance)) / ray.z; fog = exp(fogDensity * fog); t = distance(center, p); fog *= smoothstep(1.0, 0.5, cos(tau * (beaconFreq * iTime * 0.0 + h.y))); beacon += fog * pow(clamp(1.0 - 2.0 * t, 0.0, 1.0), 4.0);
                        }
                    }
                    if (dist < 400.0) return vec4(dist, beacon, face, 1.0);
                    vec2 dim = step(dis.xy, dis.yx); dis += dim * ris; block += dim * rs.xy;
                }
                if (ray.z < 0.0) return vec4(-eye.z * ri.z, beacon, 0.0, 1.0);
                return vec4(0.0, beacon, 0.0, 0.0);
            }

            void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                vec2 m = vec2(0.0, 0.8); if (iMouse.z > 0.0) m = iMouse.xy / iResolution.xy; m *= tau * vec2(1.0, 0.25);
                vec3 center = vec3(0.0, 0.5 + iTime * 0.1, 3.0); 
                float dist = 20.0; vec3 eye = center + vec3(dist * sin(m.x) * sin(m.y), dist * cos(m.x) * sin(m.y), dist * cos(m.y)); float zoom = 0.6; 
                vec3 forward = normalize(center - eye); vec3 right = normalize(cross(forward, vec3(0.0, 0.0, 1.0))); vec3 up = cross(right, forward); vec2 xy = 2.0 * fragCoord - iResolution.xy; zoom *= iResolution.y; vec3 ray = normalize(xy.x * right + xy.y * up + zoom * forward);
                vec4 res = castRay(eye, ray); vec3 p = eye + res.x * ray;
                vec2 block = floor(p.xy); vec3 window = floor(p / windowSize); float x = hash1(block, window.x); float y = hash1(block, window.y); float z = hash1(block, window.z);
                vec3 color = windowColor + windowDivergence * (hash3(block) - 0.5); color *= smoothstep(0.1, 0.9, fract(2.5 * (x * y * z)));
                vec3 streetLevel = streetColor * exp(-p.z / streetDistance); color += streetLevel; color = clamp(mix(0.25 * streetLevel, color, res.z), 0.0, 1.0);
                float fog = (exp(-p.z / fogDistance) - exp(-eye.z / fogDistance)) / ray.z; fog = exp(fogDensity * fog); color = mix(fogColor, color, fog);
                
                vec3 skyColor = fogColor; float star = hash1(ray.xy * 250.0 + ray.z * 150.0);
                if (star > 0.992) { skyColor += vec3(1.0) * (star - 0.992) * 80.0; }
                color = mix(skyColor, color, res.w);
                color += res.y * beaconColor; color += pow(res.y, 2.0);
                fragColor = vec4(color, 1.0);
            }
            void main() { mainImage(fragColor_out, gl_FragCoord.xy); }
            `;

            const program = gl.createProgram();
            const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, vsSource); gl.compileShader(vs); gl.attachShader(program, vs);
            const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, fsSource); gl.compileShader(fs); gl.attachShader(program, fs);
            gl.linkProgram(program);

            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
            const aPosition = gl.getAttribLocation(program, "a_position");
            gl.enableVertexAttribArray(aPosition);
            gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

            return {
                gl, program, canvas,
                locs: {
                    res: gl.getUniformLocation(program, "iResolution"),
                    time: gl.getUniformLocation(program, "iTime"),
                    mouse: gl.getUniformLocation(program, "iMouse")
                }
            };
        };

MoonApp.initMoonShader = function() {
            const canvas = document.getElementById('moonCanvas');
            const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
            if (!gl) return null;

            const vsSource = `#version 300 es
            in vec4 aPosition;
            void main() { gl_Position = aPosition; }`;

            const fsSource = `#version 300 es
            precision highp float;
            out vec4 fragColor_out;
            
            uniform vec3 iResolution;
            uniform float iTime;
            uniform vec2 uShadowPos; 
            uniform float uImpact;   

            float roty = 0.; float time;
            mat2 rot(float t) { return mat2(cos(t), -sin(t), sin(t), cos(t)); }
            
            float sdSphere(vec3 p, float r) { return length(p) - r; }
            vec2 map(vec3 p) { return vec2(sdSphere(p, 1.7), 1.0); }

            vec3 hash33(vec3 p) {
                p = fract(p * vec3(17.16, 31.79, 47.11));
                p += dot(p, p.yxz + 19.19);
                return fract((p.xxy + p.yxx) * p.zyx);
            }

            float getBump(vec3 p) {
                float h = 0.0; float freq = 0.8; float amp = 1.0;
                for(int layer = 0; layer < 4; layer++) {
                    vec3 ip = floor(p * freq); vec3 fp = fract(p * freq); float minDist = 2.0; float radius = 0.5; float craterShape = 0.0;
                    for(int i=-1; i<=1; i++) {
                        for(int j=-1; j<=1; j++) {
                            for(int k=-1; k<=1; k++) {
                                vec3 offset = vec3(float(i), float(j), float(k)); vec3 h3 = hash33(ip + offset); vec3 diff = offset + h3 - fp; float d = length(diff);
                                if (h3.z > 0.45) continue; 
                                if(d < minDist) { minDist = d; radius = 0.2 + 0.3 * h3.x; }
                            }
                        }
                    }
                    float x = minDist / radius;
                    if (x < 1.0) { float cavity = x * x - 1.0; float rim = smoothstep(0.5, 0.8, x) * smoothstep(1.0, 0.8, x) * 1.2; craterShape = cavity + rim; }
                    h += craterShape * amp; freq *= 2.3; amp *= 0.35;
                }
                h += fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 0.015; return h * 0.3; 
            }
            
            float worldBump(vec3 p) { vec3 localP = p; localP.xz *= rot(roty); localP.xy *= rot(time * 0.005); return getBump(localP); }
            vec3 getNormal(vec3 p) {
                vec3 n = normalize(p); vec2 e = vec2(0.015, 0.0); float b = worldBump(p);
                vec3 grad = vec3( worldBump(p + e.xyy) - b, worldBump(p + e.yxy) - b, worldBump(p + e.yyx) - b ) / e.x;
                return normalize(n - grad * 1.5); 
            }

            float hash(vec2 p) { return fract(sin(dot(p, vec2(49., 489.))) * 39284.); }

            vec4 raymarch(vec3 ro, vec3 rd, vec2 rp_xy_offset) {
                vec3 rp; float t = 0.0; vec2 hit; float iter; 
                vec3 col = vec3(0.0); float alpha = 0.0;
                
                for (int i = 0; i < 50; i++) {
                    iter = float(i); rp = ro + rd * t; rp.xy += rp_xy_offset; hit = map(rp);
                    if (hit.x < 0.01) break; else if (t > 30.) { hit = vec2(0.0); break; }
                    t += hit.x * 0.5;
                }

                vec3 ld = normalize(vec3(0.5, 0.2, 1.0)); 

                if (hit.y == 1.) {                                        
                    vec3 n = getNormal(rp); 
                    vec3 hv = normalize(ld - rd); float dif = clamp(dot(n, ld), 0.0, 1.0);
                    
                    float colorCycle = mod(iTime * 0.3, 3.0); 
                    vec3 brightGray = vec3(0.9, 0.9, 0.95); vec3 paleLilac = vec3(0.85, 0.75, 0.98); vec3 silverBlue = vec3(0.7, 0.8, 0.9); 
                    vec3 baseColor;
                    if (colorCycle < 1.0) { baseColor = mix(brightGray, paleLilac, smoothstep(0.0, 1.0, colorCycle)); }
                    else if (colorCycle < 2.0) { baseColor = mix(paleLilac, silverBlue, smoothstep(1.0, 2.0, colorCycle)); }
                    else { baseColor = mix(silverBlue, brightGray, smoothstep(2.0, 3.0, colorCycle)); }
                    
                    float spec = pow(clamp(dot(n, hv), 0.0, 1.0), 180.0) * 4.5; 
                    float fresnel = pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 3.0);
                    float sss = pow(clamp(dot(rd, -(n + ld)), 0.0, 1.0), 2.5) * 2.0;

                    vec3 sunlit = baseColor * (dif * 0.15 + 0.1); 
                    sunlit += baseColor * fresnel * 2.0;         
                    sunlit += spec;                              
                    sunlit += mix(vec3(0.6, 0.3, 1.0), baseColor, 0.5) * sss; 
                    
                    vec3 darkJelly = vec3(0.1, 0.02, 0.2); 
                    darkJelly += fresnel * vec3(0.5, 0.2, 0.8); 
                    darkJelly += spec * 0.6; 
                    darkJelly += sss * vec3(0.7, 0.3, 1.0); 

                    float shadowRadius = 1.7 * 2.6; float distToShadow = length(rp.xy - uShadowPos);
                    float inShadow = smoothstep(shadowRadius - 0.25, shadowRadius + 0.2, distToShadow); 
                    
                    col += mix(darkJelly, sunlit, inShadow);
                    col = mix(col, vec3(0.6, 0.2, 1.0) * length(col), smoothstep(0.0, 1.0, uImpact) * 0.8);
                    alpha = mix(0.4, 0.95, fresnel); 
                    alpha *= smoothstep(-8.0, 1.5, rp.y); 
                }   
                return vec4(col, alpha);
            }

            vec3 getRayDirection(vec2 uv_p) {
                float zoom = -1.0 - uImpact * 0.15;
                return normalize(vec3(uv_p, zoom + 0.2 * pow(length(uv_p), 2.0))); 
            }

            void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
                vec2 uv = fragCoord/max(iResolution.xy, vec2(1.0)); vec2 p = uv * 2. - 1.; p.x *= iResolution.x / iResolution.y;
                time = iTime; roty = time * 0.05; vec2 rp_offset = vec2(0.15, 0.2); p.y -= 0.45; 

                float stretchBand = step(0.95, hash(vec2(floor(p.y * 280.0), floor(time * 20.0))));
                float stretchIntensity = hash(vec2(floor(p.y * 280.0), 1.0)) * (0.5 + uImpact * 3.0); 
                p.x = mix(p.x, p.x * (1.0 - stretchIntensity), stretchBand);

                vec3 ro = vec3(0.0, 0.0, 5.0); vec3 rd = getRayDirection(p);
                vec4 c = raymarch(ro, rd, rp_offset);
                vec3 col = c.rgb; float alpha = c.a;

                vec3 flash = vec3(0.6, 0.4, 1.0) * uImpact * 0.3;
                col += flash;
                alpha = max(alpha, uImpact * 0.8);

                fragColor = vec4(col, clamp(alpha, 0.0, 1.0));
            }
            void main() { mainImage(fragColor_out, gl_FragCoord.xy); }
            `;

            const program = gl.createProgram();
            const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, vsSource); gl.compileShader(vs); gl.attachShader(program, vs);
            const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, fsSource); gl.compileShader(fs); gl.attachShader(program, fs);
            gl.linkProgram(program);

            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
            const aPosition = gl.getAttribLocation(program, "aPosition");
            gl.enableVertexAttribArray(aPosition);
            gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

            return {
                gl, program, canvas,
                locs: {
                    res: gl.getUniformLocation(program, 'iResolution'),
                    time: gl.getUniformLocation(program, 'iTime'),
                    shadow: gl.getUniformLocation(program, 'uShadowPos'),
                    impact: gl.getUniformLocation(program, 'uImpact')
                }
            };
        };

// ====== shader-penumbral.js ======
var MoonApp = MoonApp || {};

MoonApp.SHARED_VERTEX_SHADER_MOON = "#version 300 es\n" +
        "in vec4 aPosition;\n" +
        "void main() { gl_Position = aPosition; }\n";

MoonApp.SHARED_VERTEX_SHADER = `
            attribute vec2 aPosition;
            void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
        `;

MoonApp.initPenumbralBridge = function() {
            const canvas = document.getElementById('bridgeCanvas');
            const gl = canvas.getContext('webgl');
            if (!gl) return null;

            const vsSource = `
                attribute vec2 position;
                void main() { gl_Position = vec4(position, 0.0, 1.0); }
            `;

            const fsSource = `
            precision highp float;
            uniform vec3 iResolution;
            uniform float iTime;
            uniform vec4 iMouse;
            uniform float uImpact;
            uniform vec2 uShadowPos;

            #define PI 3.14159
            #define TWO_PI 6.28318
            #define PI_OVER_TWO 1.570796

            #define REALLY_SMALL_NUMBER 0.0001
            #define REALLY_BIG_NUMBER 1000000.

            #define BRIDGE_SURFACE_ID 1.
            #define ISLAND_SURFACE_ID 2.
            #define SKY_SURFACE_ID 3.
            #define WATER_SURFACE_ID 4.
            #define SUSPENSION_STRUTS_SURFACE_ID 5.
            #define BRIDGE_LIGHT_SURFACE_ID 6.
            #define MOON_SURFACE_ID 7.

            #define DIST_MARCH_STEPS 50
            #define DIST_MARCH_MAXDIST 44.
            #define MATCHES_SURFACE_ID(id1, id2) (id1 > (id2 - .5)) && (id1 < (id2 + .5))
            #define NUM_AA_SAMPLES 2. 

            vec4  g_debugcolor  = vec4(0.);
            float g_time        = 0.;
            float g_exposure    = 1.;
            float g_focus       = .9;
            vec3  g_moonpos     = vec3(0.);
            vec3  g_camorigin   = vec3(0.);
            vec3  g_campointsat = vec3(0.);

            vec3 getDynamicMoonColor() {
                float colorCycle = mod(iTime * 0.3, 3.0); 
                vec3 brightGray = vec3(0.95, 0.95, 1.0); 
                vec3 paleSilver = vec3(0.85, 0.85, 0.9); 
                vec3 coldWhite = vec3(0.75, 0.8, 0.85); 
                
                vec3 baseColor;
                if (colorCycle < 1.0) { baseColor = mix(brightGray, paleSilver, smoothstep(0.0, 1.0, colorCycle)); }
                else if (colorCycle < 2.0) { baseColor = mix(paleSilver, coldWhite, smoothstep(1.0, 2.0, colorCycle)); }
                else { baseColor = mix(coldWhite, brightGray, smoothstep(2.0, 3.0, colorCycle)); }
                
                return mix(baseColor, vec3(0.8, 0.9, 1.0), uImpact * 0.5);
            }

            #define MOON_COLOR getDynamicMoonColor()

            float hash(float n) { return fract(sin(n) * 1e4); }
            float noise(in vec3 x) {
                const vec3 step_val = vec3(110, 241, 171);
                vec3 i = floor(x); vec3 f = fract(x); float n = dot(i, step_val); vec3 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(mix( hash(n + dot(step_val, vec3(0, 0, 0))), hash(n + dot(step_val, vec3(1, 0, 0))), u.x),
                               mix( hash(n + dot(step_val, vec3(0, 1, 0))), hash(n + dot(step_val, vec3(1, 1, 0))), u.x), u.y),
                           mix(mix( hash(n + dot(step_val, vec3(0, 0, 1))), hash(n + dot(step_val, vec3(1, 0, 1))), u.x),
                               mix( hash(n + dot(step_val, vec3(0, 1, 1))), hash(n + dot(step_val, vec3(1, 1, 1))), u.x), u.y), u.z);
            }

            vec3 fresnel(vec3 R, vec3 N, float eta) {
                float ro = (1. - eta) / (1. + eta); ro *= ro;
                float fterm = pow(max(0., 1. - dot(R, N)), 5.);  
                return vec3(ro + ( 1. - ro ) * fterm); 
            }

            vec3 rotate_xaxis( vec3 point, float cosa, float sina ) { return vec3(point.x, point.y * cosa - point.z * sina, point.y * sina + point.z * cosa); }
            vec3 rotate_yaxis( vec3 point, float cosa, float sina ) { return vec3(point.x * cosa  + point.z * sina, point.y, point.x * -sina + point.z * cosa); }

            vec2 intersect_plane(vec3 ro, vec3 rd, vec3 pn, vec3 po) {
                float rddn = dot(rd, pn); float intersected = 0.; float t = REALLY_BIG_NUMBER;
                if (abs(rddn) > REALLY_SMALL_NUMBER) {
                    t = -dot(pn, (ro - po)) / rddn;   
                    if (t > REALLY_SMALL_NUMBER) intersected = 1.; else t = REALLY_BIG_NUMBER;
                }
                return vec2(intersected, t);
            }

            vec3 intersect_sphere(vec3 ro, vec3 rd, float sphr, vec3 sphc) {
                vec3 oro = ro - sphc; float a = dot(rd, rd); float b = dot(oro, rd); float c = dot(oro, oro) - sphr*sphr;
                float discr = b*b - a*c; float sdisc = sqrt(discr); float tmin = (-b - sdisc)/a; float tmax = (-b + sdisc)/a; 
                float hit = step(0., tmin); float outside = step(sphr*sphr, dot(oro, oro)); return outside * vec3(hit, tmin, tmax);
            }

            vec3 intersect_isphere(vec3 ro, vec3 rd, float sphr, vec3 sphc) {
                vec3 oro = ro - sphc; float a = dot(rd, rd); float b = dot(oro, rd); float c = dot(oro, oro) - sphr*sphr;
                float discr = b*b - a*c; float sdisc = sqrt(discr); float tmin = (-b - sdisc)/a; float tmax = (-b + sdisc)/a; 
                float hit = step(0., tmax); return vec3(hit, tmin, tmax);
            }

            float flow_noise( in vec3 p ) {
                vec3 q = p - vec3(0., .5 * g_time, 0.); float f = 0.50000*noise( q ); q = q*3.02 -vec3(0., .5 * g_time, 0.);
                f += 0.35000*noise( q ); q = q*3.03; f += 0.15000*noise( q ); q = q*3.01; return f;
            }

            float map4( in vec3 p ) {
                vec3 q = p; float f = 0.50000*noise( q ); q = q*2.02;
                f += 0.25000*noise( q ); q = q*2.03; f += 0.12500*noise( q ); q = q*2.01; f += 0.06250*noise( q ); return f;
            }

            void composite(inout vec4 ci, vec4 ca) { ci += ca * (1. - ci.a); }
            vec3 nearest_point_on_line( vec3 a, vec3 b, vec3 p) { vec3 ba = b - a; float t = dot(ba, (p - a)) / dot(ba, ba); return a + t * ba; }

            float periodicmix(float v1, float v2, float v3, float x) {
                float modx = mod(x, 3.);
                return mix(v1, mix(v2, mix(v3, v1, 1.0 - smoothstep(.5, .6, 3.0 - modx)), 1.0 - smoothstep(.5, .6, 2.0 - modx)), smoothstep(.5, .6, modx));
            }

            float sphere_df( vec3 p, float r ) { return length( p ) - r; }
            float roundbox_df ( vec3 p, vec3 b, float r ) {return length(max(abs(p-vec3(0., .5*b.y, 0.))-.5*b,0.0))-r; }

            struct CameraInfo { vec3 camera_origin; vec3 ray_look_direction; mat3 camera_transform; vec2 image_plane_uv; };
            struct SurfaceInfo { float surface_id; vec3 view_origin; vec3 view_dir; vec3 surface_point; vec3 surface_normal; vec2 surface_uv; float surface_depth; float shade_in_reflection; };
            struct MaterialInfo { vec3 bump_normal; vec3 diffuse_color; vec3 specular_color; float specular_exponent; float reflection_intensity; vec3 emissive_color; };

            #define INIT_SURFACE_INFO(view_origin, view_dir) SurfaceInfo(-1., view_origin, view_dir, vec3(0.), vec3(0.), vec2(0.), 0., 0.)
            #define INIT_MATERIAL_INFO(surface_normal) MaterialInfo(surface_normal, vec3(0.), vec3(0.), 1., 1., vec3(0.))

            void setup_globals() {
                g_time = 1. * iTime; g_exposure = 1.;   
                g_camorigin = vec3(0.0, .1, 7.0);
                float rotxang = -.02 * cos(.02 * g_time) - .03;
                g_camorigin = rotate_xaxis(g_camorigin, cos(rotxang), sin(rotxang));
                float rotyang = PI * .28 + .05 * sin(.2 * g_time);
                g_camorigin = rotate_yaxis(g_camorigin, cos(rotyang), sin(rotyang));
                g_campointsat = vec3(0., .55, 1.5);
                g_moonpos = vec3(-30., 15., 5.);
            }

            CameraInfo setup_camera(vec2 aaoffset, vec2 fragCoordModified) {
                float inv_aspect_ratio = iResolution.y / iResolution.x;
                vec2 image_plane_uv = (fragCoordModified + aaoffset) / iResolution.xy - .5;
                image_plane_uv.y *= inv_aspect_ratio;
                vec3 iu = vec3(0., 1., 0.);
                vec3 iz = normalize( g_campointsat - g_camorigin );
                vec3 ix = normalize( cross(iz, iu) );
                vec3 iy = cross(ix, iz);
                vec3 ray_look_direction = normalize( image_plane_uv.x * ix + image_plane_uv.y * iy + g_focus * iz );
                return CameraInfo(g_camorigin, ray_look_direction, mat3(ix, iy, iz), image_plane_uv);
            }

            vec2 mergeobjs(vec2 a, vec2 b) { return mix(b, a, step(a.x, b.x)); }
            float uniondf(float a, float b) { return min(a, b); }

            vec2 scene_df( vec3 p ) {
                vec3 gp = p * vec3(.2, 1., .2) + vec3(0., 10., 0.) * (.5*map4(.2 * p)-.5) + vec3(7.2, 3.3, -2.);
                vec2 ground_obj = vec2(sphere_df(gp, 2.9), ISLAND_SURFACE_ID);    
                
                vec3 bb = p; bb.x = mod(bb.x + 4., 8.); bb.x -= 4.; bb.z = abs(bb.z); bb.z -= .15; 
                float bdf = roundbox_df( bb, vec3(.1, 2.5, .03), .01);     
                bdf = uniondf(bdf, roundbox_df( bb, vec3(.35, .12, .15), .01)); 
                bdf = uniondf(bdf, roundbox_df( bb - vec3(0., 2.45, -0.1), vec3(.11, .1, .3), .01));     
                bdf = uniondf(bdf, roundbox_df( bb - vec3(0., .92, -0.1), vec3(8., .02, .2), .01)); 
                bdf = uniondf(bdf, roundbox_df( bb - vec3(0., 1.05, -0.1), vec3(8., .02, .2), .01)); 
                
                vec3 cb = bb; cb.y = mod(cb.y + .19, .38); cb.y = abs(cb.y - .19);
                float m = step(2.5, bb.y) + step(.95, bb.y) * step(bb.y, 1.3); 
                cb.y -= .15 + REALLY_BIG_NUMBER * m; cb.yz *= mat2(-.707, -.707, .707, -.707); 
                bdf = uniondf(bdf, roundbox_df( cb, vec3(.03, 1., .03), .01)); 
                
                vec3 sp = p; sp.x = mod(sp.x, 8.); sp.x -= 4.; sp.z = abs(sp.z); sp.z -= .15; sp.y -= .09 * sp.x*sp.x;
                bdf = uniondf(bdf, roundbox_df( sp - vec3(0., 1.1, 0.), vec3(8., .01, .01), .01)); 
                
                vec3 tp = p; tp.x = mod(tp.x + .05, .1); tp.x -= .05; tp.z -= .13;
                float sdf = roundbox_df(tp - vec3(0., 1.06, 0.), vec3(.0, .089 * sp.x*sp.x + .02, .0), .005);
                float wldf = sphere_df(bb - vec3(0.0, 2.64, -.15), .03);
                
                vec2 obj = ground_obj;
                obj = mergeobjs(obj, vec2(bdf, BRIDGE_SURFACE_ID));
                obj = mergeobjs(obj, vec2(sdf, SUSPENSION_STRUTS_SURFACE_ID));
                obj = mergeobjs(obj, vec2(wldf, BRIDGE_LIGHT_SURFACE_ID));
                return obj;
            }

            vec3 calc_normal( vec3 p ) {
                vec3 epsilon = vec3( 0.01, 0.0, 0.0 );
                vec3 n = vec3( scene_df(p + epsilon.xyy).x - scene_df(p - epsilon.xyy).x, scene_df(p + epsilon.yxy).x - scene_df(p - epsilon.yxy).x, scene_df(p + epsilon.yyx).x - scene_df(p - epsilon.yyx).x );
                return normalize( n );
            }

            vec2 intersect_water(vec3 ro, vec3 rd) { return intersect_plane(ro, rd, vec3(0., 1., 0.), vec3(0., 0., 0.)); }

            SurfaceInfo march_scene(vec3 ray_origin, vec3 ray_direction, float consider_water) {
                SurfaceInfo surface = INIT_SURFACE_INFO(ray_origin, ray_direction);
                vec2 water = consider_water * intersect_water(ray_origin, ray_direction);
                float epsilon = 0.001; float dist = 10. * epsilon; float total_t = 0.; float curr_t = 0.;
                vec3 ro = ray_origin; vec3 rd = ray_direction;
                
                for (int i=0; i < DIST_MARCH_STEPS; i++) {
                    if ( abs(dist) < epsilon || curr_t + total_t > DIST_MARCH_MAXDIST ) break;
                    vec3 p = ro + curr_t * rd;        
                    vec2 dfresult = scene_df( p );
                    vec2 sky_obj = vec2(-sphere_df(p, 35.), SKY_SURFACE_ID);
                    dfresult = mergeobjs(sky_obj, dfresult);
                    dist = dfresult.x; curr_t += dist; surface.surface_id = dfresult.y;
                    if ( water.x > .5 && curr_t > water.y ) { surface.surface_id = WATER_SURFACE_ID; curr_t = water.y; break; }                                        
                }
                
                surface.surface_point = ro + curr_t * rd; total_t += curr_t;
                if (MATCHES_SURFACE_ID(surface.surface_id, WATER_SURFACE_ID)) {
                    vec3 n = vec3(0., 1., 0.); vec3 u = normalize(-vec3(1., 0., 1.) * ray_origin); vec3 v = cross(n, u);
                    surface.surface_uv = vec2(100., 10.) * vec2( dot(surface.surface_point, u), dot(surface.surface_point, v) );
                    n += u * (.2 * flow_noise(surface.surface_uv.xxy) - .1); surface.surface_normal = normalize(n);
                } else if (MATCHES_SURFACE_ID(surface.surface_id, SKY_SURFACE_ID)) {
                    surface.surface_normal = -rd; surface.surface_uv = surface.surface_point.xz;
                } else {        
                    surface.surface_normal = calc_normal( surface.surface_point ); surface.surface_uv = surface.surface_point.xz;
                }
                surface.surface_depth = total_t;
                return surface;
            }

            vec3 light_from_point_light(SurfaceInfo surface, MaterialInfo material, vec3 light_position, vec3 light_color, float falloff_with_distance, float specular_sharpen) {
                vec3 light_direction = normalize(light_position - surface.surface_point);
                vec3 light_reflection_direction = reflect(light_direction, material.bump_normal);
                vec3 reflective_shading = material.specular_color * pow(max(0., dot(light_reflection_direction, surface.view_dir)), material.specular_exponent * specular_sharpen);
                float ldist = length(surface.surface_point - light_position); float dist_atten = 1./ldist;
                vec3 diffuse_shading = material.diffuse_color * max(0., dot(light_direction, material.bump_normal)) * mix(1., dist_atten, falloff_with_distance);   
                return light_color * (diffuse_shading + reflective_shading);
            }

            vec4 shade_clouds(vec3 ro, vec3 rd, float depth) {
                vec4 cloud_rgba = vec4(0.); float num_clouds = 0.;
                for (float i = 0.; i < 3.; i += 1.) {
                    vec3 ch = intersect_isphere(ro, rd, 3.1 * i + 4.5, ro);
                    if (ch.x > .5 && ch.z < depth ) {
                        vec3 hp = ro + rd * ch.z; vec3 hpo = nearest_point_on_line(ro, g_moonpos, hp); vec3 uvhp = hp - vec3(-28., 9., 9.);
                        uvhp *= 2.;
                        float cloud_alpha = (.06 + .02 * i) * (.2 + .8 * smoothstep(.1, .9 - .25 * (1.0 - smoothstep(5., 1., hp.y)), map4(vec3(1., .8, 0.) * uvhp.yxz + vec3(3. * i, 5. * i , .05 * g_time))));
                        cloud_alpha *= smoothstep(0.5, 1.5, hp.y) * smoothstep(2. + 1.8 * i, .0, hp.y);
                        
                        vec3 base_cloud_color = 2. * vec3(.6, .8, 1. + .1 * i);
                        vec3 cloud_color = mix(base_cloud_color, MOON_COLOR * 2.0, uImpact * 0.5); 
                        
                        vec3 halod = hp - hpo; vec3 halo_color = .8 * MOON_COLOR * max(0., 4. - length(2. * halod));
                        cloud_color += .6 * pow(halo_color, vec3(2.));
                        composite(cloud_rgba, vec4(cloud_color * cloud_alpha, cloud_alpha));            
                        num_clouds += 1.;
                    } else break;
                }
                return cloud_rgba;
            }

            vec3 shade_reflected_world(SurfaceInfo surface) {
                MaterialInfo material = INIT_MATERIAL_INFO(surface.surface_normal);
                if (MATCHES_SURFACE_ID(surface.surface_id, BRIDGE_SURFACE_ID)) {
                    material.diffuse_color = .02 * vec3(.65, .62, .68); material.specular_color = .5 * vec3(0.5, 0.6, 0.7);
                    material.specular_exponent = 30.; material.emissive_color = vec3(.04, .03, .035);
                } else if (MATCHES_SURFACE_ID(surface.surface_id, BRIDGE_LIGHT_SURFACE_ID)) {
                    material.diffuse_color = vec3(0.); material.specular_color = vec3(0.);
                    float i = abs(sin(g_time)); material.emissive_color = i*i * vec3(0.8, 0.9, 1.0); material.reflection_intensity = 10.;
                } else if (MATCHES_SURFACE_ID(surface.surface_id, SUSPENSION_STRUTS_SURFACE_ID)) {
                    material.diffuse_color = vec3(0.); material.specular_color = vec3(0.); material.specular_exponent = 1.;
                    vec3 dp = surface.surface_point.xyz; dp.x = mod(dp.x + 4., 8.); dp.x -= 4.;
                    float c = periodicmix(smoothstep(.3, 1., .5 * cos(6. * dp.y * pow(abs(dp.x), .5) - 4. * g_time ) + .5),
                                          smoothstep(.2, .8, .5 * cos(4. * dp.y * dp.x + mix(-1., 1., step(0., dp.x))* 5. * g_time ) + .5), 
                                          smoothstep(.2, .9, .5 * cos(2. * surface.surface_point.x - 2.* g_time + 5. * sin(3. * dp.y + 1. * g_time)) + .5), .2 * g_time + .3 * dp.y);
                    float l = mod(20. * dp.y, 1.);
                    c *= smoothstep(0.2, .5, l) * (1.0 - smoothstep(.5, .8, l));
                    vec3 strutLight = mix(vec3(.4, .6, .8), vec3(.6, .7, .8), uImpact * 0.5); 
                    material.emissive_color = 2. * c * strutLight; material.reflection_intensity = 8.;
                } else if (MATCHES_SURFACE_ID(surface.surface_id, ISLAND_SURFACE_ID)) {
                    vec3 surface_color = .05 * vec3(0.5, 0.7, 1.0);        
                    material.diffuse_color = surface_color; material.emissive_color = .1 * surface_color; material.specular_color = .1 * surface_color; material.specular_exponent = 1.;
                } else if (MATCHES_SURFACE_ID(surface.surface_id, SKY_SURFACE_ID)) {
                    vec3 sky_color = .6 * vec3(0.02, 0.05, 0.12) * smoothstep(3., 0., surface.surface_point.y);        
                    float l = smoothstep(2., 0., surface.surface_point.y);
                    sky_color += .5 * vec3(0.05, 0.10, 0.25) * l * l;
                    
                    vec3 cn = surface.surface_point; 
                    cn.z = floor(20. * cn.z) * .05; 
                    float city_noise = noise(8. * cn.xzz);
                    
                    float edge0 = -0.06;
                    float edge1 = 0.25 * city_noise - 0.05;
                    sky_color += 2. * vec3(0.4, 0.7, 1.0) * (1.0 - smoothstep(edge0, edge1, surface.surface_point.y));
                    
                    material.emissive_color = sky_color;
                }
                  
                vec4 scene_rgba = vec4(0.02, .03, .05, 0.1);
                vec3 em = material.emissive_color * mix(1., material.reflection_intensity, step(0.5, surface.shade_in_reflection));  
                scene_rgba.rgb += em; vec4 clouds_rgba = shade_clouds(surface.view_origin, surface.view_dir, surface.surface_depth);
                vec3 lit_color = light_from_point_light(surface, material, g_moonpos, MOON_COLOR, 0., 1.); lit_color *= g_exposure; clouds_rgba.rgb *= g_exposure;
                composite(scene_rgba, clouds_rgba); composite(scene_rgba, vec4(lit_color, 1.));
                return scene_rgba.rgb;
            }

            vec3 shade_world(SurfaceInfo surface) {
                vec4 scene_color = vec4(0.);
                if (MATCHES_SURFACE_ID(surface.surface_id, WATER_SURFACE_ID)) {
                    MaterialInfo material = INIT_MATERIAL_INFO(surface.surface_normal);
                    
                    vec3 surface_color = vec3(.02, .05, .15) + mix(vec3(.05, .1, .2), vec3(.1, .15, .25), flow_noise(surface.surface_uv.xxy));
                    surface_color = mix(surface_color, vec3(0.05, 0.08, 0.12), uImpact * 0.5);

                    material.diffuse_color = .6 * surface_color; material.emissive_color = .15 * surface_color; material.specular_color = .5 * MOON_COLOR; material.specular_exponent = 200.;
                    
                    SurfaceInfo refl_surface = march_scene( surface.surface_point, reflect(surface.view_dir, surface.surface_normal), 0. );
                    refl_surface.shade_in_reflection = 1.; vec3 refl_color = shade_reflected_world( refl_surface );
                    refl_color *= (.5 + .5 * smoothstep(0.3, 2.5, surface.surface_depth)); refl_color *= (.5 + .5 * (1.0 - smoothstep(1., 3., surface.surface_depth)));
                        
                    vec3 lit_color = light_from_point_light(surface, material, g_moonpos, MOON_COLOR, 0., 1.);
                    
                    vec3 ripple_n = surface.surface_normal;
                    ripple_n.x += 0.05 * sin(surface.surface_point.z * 5.0 - g_time * 3.0);
                    ripple_n.z += 0.05 * sin(surface.surface_point.x * 5.0 - g_time * 3.0);
                    ripple_n = normalize(ripple_n);
                    
                    vec3 moon_dir = normalize(g_moonpos - surface.surface_point);
                    vec3 refl_dir = reflect(surface.view_dir, ripple_n);
                    float spec = pow(max(0.0, dot(refl_dir, moon_dir)), 100.0);
                    
                    float coordScale = 25.0; 
                    vec2 rp_refl;
                    rp_refl.x = (refl_dir.z - moon_dir.z) * coordScale + 0.15;
                    rp_refl.y = (refl_dir.y - moon_dir.y) * coordScale + 0.20;
                    
                    float penumbraDist = length(rp_refl - uShadowPos);
                    float penumbraFactor = smoothstep(4.0, 7.5, penumbraDist);
                    float reflectionDimming = mix(0.1, 1.0, penumbraFactor);
                    vec3 moon_reflection = MOON_COLOR * spec * 4.0 * reflectionDimming * (1.0 + uImpact * 2.0);
                    
                    lit_color += moon_reflection;
                    lit_color += .2 * refl_color; lit_color *= g_exposure;               
                    composite(scene_color, vec4(lit_color, 1.));
                } else {
                    scene_color.rgb = shade_reflected_world(surface);
                }
                return scene_color.rgb;
            }

            void mainImage( out vec4 fragColor, in vec2 fragCoord ) {   
                setup_globals();
                
                vec2 uv_norm = fragCoord.xy / iResolution.xy;
                float distToCore = length(uv_norm - vec2(0.3, 0.4)) * 1.8;
                float pag_weight = exp(-distToCore * distToCore);
                float stretch = step(0.95 - pag_weight * 0.1, fract(sin(dot(vec2(floor(uv_norm.y * 32.0), iTime), vec2(12.9898, 78.233))) * 43758.5453));
                vec2 modifiedCoord = fragCoord;
                modifiedCoord.x -= stretch * uImpact * 120.0 * pag_weight;

                float denom = TWO_PI/max(1., NUM_AA_SAMPLES-1.);
                vec3 scene_color = vec3(0.);

                for (float aa = 0.; aa < NUM_AA_SAMPLES; aa += 1.) {
                    vec2 aaoffset = step(.5, aa) * .5 * vec2( cos((aa-1.) * denom ), sin((aa-1.) * denom ) );
                    CameraInfo camera = setup_camera( aaoffset, modifiedCoord );
                    SurfaceInfo surface = march_scene( camera.camera_origin, camera.ray_look_direction, 1. );
                    scene_color += shade_world( surface );
                }
                scene_color /= NUM_AA_SAMPLES;

                scene_color *= 1.5;
                scene_color = pow(max(vec3(0.), scene_color), vec3(.8));
                scene_color = mix( scene_color, vec3(dot(scene_color,vec3(0.333))), -.3 );
                
                scene_color *= vec3(0.85, 0.95, 1.05); 
                
                scene_color = mix(scene_color, vec3(0.4, 0.45, 0.5) * length(scene_color), uImpact * 0.8);

                vec2 uv = modifiedCoord.xy / iResolution.xy;
                scene_color *= 0.2 + 0.8*pow( 8.0*uv.x*(1.0-uv.x), 0.1 );
                
                fragColor = vec4(scene_color, 1.0);
            }
            void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
            `;

            const program = gl.createProgram();
            const vs = MoonApp.loadShader(gl, gl.VERTEX_SHADER, `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`);
            const fs = MoonApp.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
            if(!vs || !fs) return null;
            gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);

            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
            const aPos = gl.getAttribLocation(program, "position");
            gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            return {
                gl, program, canvas,
                locs: { res: gl.getUniformLocation(program, "iResolution"), time: gl.getUniformLocation(program, "iTime"), mouse: gl.getUniformLocation(program, "iMouse"), impact: gl.getUniformLocation(program, "uImpact"), shadow: gl.getUniformLocation(program, "uShadowPos") }
            };
        };

MoonApp.initPenumbralMoon = function() {
            const canvas = document.getElementById('penumbralMoonCanvas');
            const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
            if (!gl) return null;

            const fsSource = `#version 300 es
            precision highp float;
            out vec4 fragColor_out;
            
            uniform vec3 iResolution;
            uniform float iTime;
            uniform vec2 uShadowPos; 
            uniform float uImpact;   

            float roty = 0.; float time;
            mat2 rot(float t) { return mat2(cos(t), -sin(t), sin(t), cos(t)); }
            
            float sdSphere(vec3 p, float r) { return length(p) - r; }
            vec2 map(vec3 p) { return vec2(sdSphere(p, 1.7), 1.0); }

            vec3 hash33(vec3 p) {
                p = fract(p * vec3(17.16, 31.79, 47.11)); p += dot(p, p.yxz + 19.19); return fract((p.xxy + p.yxx) * p.zyx);
            }

            float getBump(vec3 p) {
                float h = 0.0; float freq = 0.8; float amp = 1.0;
                for(int layer = 0; layer < 4; layer++) {
                    vec3 ip = floor(p * freq); vec3 fp = fract(p * freq); float minDist = 2.0; float radius = 0.5; float craterShape = 0.0;
                    for(int i=-1; i<=1; i++) {
                        for(int j=-1; j<=1; j++) {
                            for(int k=-1; k<=1; k++) {
                                vec3 offset = vec3(float(i), float(j), float(k)); vec3 h3 = hash33(ip + offset); vec3 diff = offset + h3 - fp; float d = length(diff);
                                if (h3.z > 0.45) continue; 
                                if(d < minDist) { minDist = d; radius = 0.2 + 0.3 * h3.x; }
                            }
                        }
                    }
                    float x = minDist / radius;
                    if (x < 1.0) { float cavity = x * x - 1.0; float rim = smoothstep(0.5, 0.8, x) * smoothstep(1.0, 0.8, x) * 1.2; craterShape = cavity + rim; }
                    h += craterShape * amp; freq *= 2.3; amp *= 0.35;
                }
                h += fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 0.015; return h * 0.3; 
            }
            
            float worldBump(vec3 p) { vec3 localP = p; localP.xz *= rot(roty); localP.xy *= rot(time * 0.005); return getBump(localP); }

            vec3 getNormal(vec3 p) {
                vec3 n = normalize(p); vec2 e = vec2(0.015, 0.0); float b = worldBump(p);
                vec3 grad = vec3( worldBump(p + e.xyy) - b, worldBump(p + e.yxy) - b, worldBump(p + e.yyx) - b ) / e.x;
                return normalize(n - grad * 1.5); 
            }

            float hash(vec2 p) { return fract(sin(dot(p, vec2(49., 489.))) * 39284.); }

            vec4 raymarch(vec3 ro, vec3 rd, vec2 rp_xy_offset) {
                vec3 rp; float t = 0.0; vec2 hit; float iter; 
                vec3 col = vec3(0.0); float alpha = 0.0;
                
                for (int i = 0; i < 50; i++) {
                    iter = float(i); rp = ro + rd * t; rp.xy += rp_xy_offset; hit = map(rp);
                    if (hit.x < 0.01) break; else if (t > 30.) { hit = vec2(0.0); break; }
                    t += hit.x * 0.5;
                }

                vec3 ld = normalize(vec3(0.5, 0.2, 1.0)); 

                if (hit.y == 1.) {                                        
                    vec3 n = getNormal(rp); 
                    vec3 hv = normalize(ld - rd); float dif = clamp(dot(n, ld), 0.0, 1.0);
                    
                    float colorCycle = mod(iTime * 0.3, 3.0); 
                    vec3 brightGray = vec3(0.95, 0.95, 1.0); vec3 paleSilver = vec3(0.85, 0.85, 0.9); vec3 coldWhite = vec3(0.75, 0.8, 0.85); 
                    vec3 baseColor;
                    if (colorCycle < 1.0) { baseColor = mix(brightGray, paleSilver, smoothstep(0.0, 1.0, colorCycle)); }
                    else if (colorCycle < 2.0) { baseColor = mix(paleSilver, coldWhite, smoothstep(1.0, 2.0, colorCycle)); }
                    else { baseColor = mix(coldWhite, brightGray, smoothstep(2.0, 3.0, colorCycle)); }
                    
                    float spec = pow(clamp(dot(n, hv), 0.0, 1.0), 180.0) * 4.5; 
                    float fresnel = pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 3.0);
                    float sss = pow(clamp(dot(rd, -(n + ld)), 0.0, 1.0), 2.5) * 2.0;

                    vec3 sunlit = baseColor * (dif * 0.15 + 0.1); 
                    sunlit += baseColor * fresnel * 2.0;         
                    sunlit += spec;                              
                    sunlit += mix(vec3(0.8, 0.8, 0.9), baseColor, 0.4) * sss; 
                    
                    vec3 dimmedJelly = baseColor * 0.1; 
                    dimmedJelly += fresnel * baseColor * 0.1; 
                    dimmedJelly += spec * 0.05; 

                    float distToShadow = length(rp.xy - uShadowPos);
                    
                    float shadowFactor = smoothstep(4.0, 7.5, distToShadow); 
                    
                    col += mix(dimmedJelly, sunlit, shadowFactor);
                    
                    col = mix(col, vec3(0.7, 0.75, 0.8) * length(col), smoothstep(0.0, 1.0, uImpact) * 0.5);

                    alpha = mix(0.4, 0.95, fresnel); 
                    alpha *= smoothstep(-8.0, 1.5, rp.y); 
                }   
                return vec4(col, alpha);
            }

            vec3 getRayDirection(vec2 uv_p) { return normalize(vec3(uv_p, -1.0 - uImpact * 0.15 + 0.2 * pow(length(uv_p), 2.0))); }

            void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
                vec2 uv = fragCoord/max(iResolution.xy, vec2(1.0)); vec2 p = uv * 2. - 1.; p.x *= iResolution.x / iResolution.y;
                time = iTime; roty = time * 0.05; vec2 rp_offset = vec2(0.15, 0.2); p.y -= 0.45; 

                float stretchBand = step(0.95, hash(vec2(floor(p.y * 280.0), floor(time * 20.0))));
                float stretchIntensity = hash(vec2(floor(p.y * 280.0), 1.0)) * (0.5 + uImpact * 3.0); 
                p.x = mix(p.x, p.x * (1.0 - stretchIntensity), stretchBand);

                vec3 ro = vec3(0.0, 0.0, 5.0); vec3 rd = getRayDirection(p);
                vec4 c = raymarch(ro, rd, rp_offset);
                vec3 col = c.rgb; float alpha = c.a;

                vec3 flash = vec3(0.8, 0.85, 0.9) * uImpact * 0.2;
                col += flash;
                alpha = max(alpha, uImpact * 0.8);

                fragColor = vec4(col, clamp(alpha, 0.0, 1.0));
            }
            void main() { mainImage(fragColor_out, gl_FragCoord.xy); }
            `;

            const program = gl.createProgram();
            const vs = MoonApp.loadShader(gl, gl.VERTEX_SHADER, MoonApp.SHARED_VERTEX_SHADER_MOON); 
            const fs = MoonApp.loadShader(gl, gl.FRAGMENT_SHADER, fsSource); 
            if(!vs || !fs) return null;
            gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);

            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
            const aPos = gl.getAttribLocation(program, "aPosition");
            gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            return {
                gl, program, canvas,
                locs: { res: gl.getUniformLocation(program, "iResolution"), time: gl.getUniformLocation(program, "iTime"), shadow: gl.getUniformLocation(program, "uShadowPos"), impact: gl.getUniformLocation(program, "uImpact") }
            };
        };

// ====== shader-total.js ======
var MoonApp = MoonApp || {};

MoonApp.initTotalCityPipeline = function() {
            const canvas = document.getElementById('totalCityCanvas');
            const gl = canvas.getContext('webgl', { antialias: false }); 
            if (!gl) return null;
            if(!gl.getExtension('OES_texture_float')) {
                console.warn("No OES_texture_float extension");
            }

            const fsBufferA = `
            precision highp float;
            uniform vec3 iResolution;
            uniform float iTime;
            uniform vec2 uEclipse; 

            #define CARS
            #define I_MAX 70
            #define time (iTime+1024.0)

            float rand(vec2 n) { return fract(sin((n.x*1e2+n.y*1e4+1475.4526)*1e-4)*1e6); }
            float noise(vec2 p) { p = floor(p*200.0); return rand(p); }

            mat2 mm2(in float a){float c = cos(a), s = sin(a);return mat2(c,s,-s,c);}
            mat2 m2 = mat2(0.95534, 0.29552, -0.29552, 0.95534);
            float tri(in float x){return clamp(abs(fract(x)-.5),0.01,0.49);}
            vec2 tri2(in vec2 p){return vec2(tri(p.x)+tri(p.y),tri(p.y+tri(p.x)));}

            float triNoise2d(in vec2 p, float spd) {
                float z=1.8; float z2=2.5; float rz = 0.;
                p *= mm2(p.x*0.06); vec2 bp = p;
                for (float i=0.; i<5.; i++ ) {
                    vec2 dg = tri2(bp*1.85)*.75;
                    dg *= mm2(time*spd);
                    p -= dg/z2;
                    bp *= 1.3; z2 *= .45; z *= .42;
                    p *= 1.21 + (rz-1.0)*.02;
                    rz += tri(p.x+tri(p.y))*z;
                    p*= -m2;
                }
                return clamp(1./pow(rz*29., 1.3),0.,.55);
            }

            float hash21(in vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
            
            vec4 aurora(vec3 ro, vec3 rd) {
                vec4 col = vec4(0); vec4 avgCol = vec4(0);
                for(float i=0.;i<50.;i++) {
                    float of = 0.006*hash21(gl_FragCoord.xy)*smoothstep(0.,15., i);
                    float pt = ((.8+pow(i,1.4)*.002)-ro.y)/(rd.y*2.+0.4);
                    pt -= of;
                    vec3 bpos = ro + pt*rd; vec2 p = bpos.zx;
                    float rzt = triNoise2d(p, 0.06);
                    vec4 col2 = vec4(0,0,0, rzt);
                    col2.rgb = (sin(1.-vec3(2.15,-.5, 1.2)+i*0.043)*0.5+0.5)*rzt;
                    avgCol =  mix(avgCol, col2, .5);
                    col += avgCol*exp2(-i*0.065 - 2.5)*smoothstep(0.,5., i);
                }
                col *= (clamp(rd.y*15.+.4,0.,1.));
                return col*1.8;
            }

            vec3 hash33(vec3 p) {
                p = fract(p * vec3(443.8975,397.2973, 491.1871));
                p += dot(p.zxy, p.yxz+19.27);
                return fract(vec3(p.x * p.y, p.z*p.x, p.y*p.z));
            }

            vec3 stars(in vec3 p) {
                vec3 c = vec3(0.); float res = 800.0; 
                for (float i=0.;i<4.;i++) {
                    vec3 q = fract(p*(.15*res))-0.5;
                    vec3 id = floor(p*(.15*res));
                    vec2 rn = hash33(id).xy;
                    float c2 = 1.-smoothstep(0.,.6,length(q));
                    c2 *= step(rn.x,.0005+i*i*0.001);
                    c += c2*(mix(vec3(1.0,0.49,0.1),vec3(0.75,0.9,1.),rn.y)*0.1+0.9);
                    p *= 1.3;
                }
                return c*c*.8;
            }

            vec3 bg(in vec3 rd) {
                float sd = dot(normalize(vec3(-0.5, -0.6, 0.9)), rd)*0.5+0.5;
                sd = pow(sd, 5.);
                return mix(vec3(0.05,0.1,0.2), vec3(0.1,0.05,0.2), sd)*.63;
            }

            vec3 polygonXY(float z,vec2 vert1, vec2 vert2, vec3 camPos,vec3 rayDir){
                float t = -(camPos.z-z)/rayDir.z; vec2 crossP = camPos.xy + rayDir.xy*t;
                if (crossP.x>min(vert1.x,vert2.x) && crossP.x<max(vert1.x,vert2.x) && crossP.y>min(vert1.y,vert2.y) && crossP.y<max(vert1.y,vert2.y) && dot(rayDir,vec3(crossP,z)-camPos)>0.0){
                    return vec3(length(camPos-vec3(crossP,z)), crossP.x-min(vert1.x,vert2.x),crossP.y-min(vert1.y,vert2.y));
                }
                return vec3(101.0,0.0,0.0);
            }
            
            vec3 polygonYZ(float x,vec2 vert1, vec2 vert2, vec3 camPos,vec3 rayDir){
                float t = -(camPos.x-x)/rayDir.x; vec2 cross1 = camPos.yz + rayDir.yz*t;
                if (cross1.x>min(vert1.x,vert2.x) && cross1.x<max(vert1.x,vert2.x) && cross1.y>min(vert1.y,vert2.y) && cross1.y<max(vert1.y,vert2.y)&& dot(rayDir,vec3(x,cross1)-camPos)>0.0){
                    return vec3(length(camPos-vec3(x,cross1)), cross1.x-min(vert1.x,vert2.x),cross1.y-min(vert1.y,vert2.y));
                }
                return vec3(101.0,0.0,0.0);
            }

            vec3 polygonXZ(float y,vec2 vert1, vec2 vert2, vec3 camPos,vec3 rayDir){
                float t = -(camPos.y-y)/rayDir.y; vec2 cross1 = camPos.xz + rayDir.xz*t;
                if (cross1.x>min(vert1.x,vert2.x) && cross1.x<max(vert1.x,vert2.x) && cross1.y>min(vert1.y,vert2.y) && cross1.y<max(vert1.y,vert2.y)&& dot(rayDir,vec3(cross1.x,y,cross1.y)-camPos)>0.0){
                    return vec3(length(camPos-vec3(cross1.x,y,cross1.y)), cross1.x-min(vert1.x,vert2.x),cross1.y-min(vert1.y,vert2.y));
                }
                return vec3(101.0,0.0,0.0);
            }

            vec3 textureWall(vec2 pos, vec2 maxPos, vec2 squarer,float s,float height,float dist,vec3 rayDir,vec3 norm, out vec3 windowColor, float winBlink){
                float randB = rand(squarer*2.0);
                windowColor =(-0.4+randB*0.8)*vec3(0.3,0.3,0.0)+(-0.4+fract(randB*10.0)*0.8)*vec3(0.0,0.0,0.3)+(-0.4+fract(randB*10000.0)*0.8)*vec3(0.3,0.0,0.0);
                float floorFactor = 1.0; vec2 windowSize = vec2(0.65,0.35);
                vec3 wallColor = s*(0.3+1.4*fract(randB*100.0))*vec3(0.1,0.1,0.1)+(-0.7+1.4*fract(randB*1000.0))*vec3(0.02,0.,0.);
                wallColor*=1.3;
                
                if (height<0.51){ windowColor += vec3(0.3,0.3,0.0); windowSize = vec2(0.4,0.4); floorFactor = 0.0; }
                if (height<0.6){floorFactor = 0.0;}
                if (height>0.75){ windowColor += vec3(0.0,0.0,0.3); }
                windowColor*=1.5;
                float wsize = 0.02; wsize+=-0.007+0.014*fract(randB*75389.9365);
                windowSize+= vec2(0.34*fract(randB*45696.9365),0.50*fract(randB*853993.5783));
                
                vec2 contur=vec2(0.0)+(fract(maxPos/2.0/wsize))*wsize;
                if (contur.x<wsize){contur.x+=wsize;} if (contur.y<wsize){contur.y+=wsize;}
                
                vec2 winPos = (pos-contur)/wsize/2.0-floor((pos-contur)/wsize/2.0);
                float numWin = floor((maxPos-contur)/wsize/2.0).x;
                vec3 conturColor = wallColor/1.5;

                if ( (maxPos.x>0.5&&maxPos.x<0.6) && ( ((pos-contur).x>wsize*2.0*floor(numWin/2.0)) && ((pos-contur).x<wsize*2.0+wsize*2.0*floor(numWin/2.0)) )){ return (0.9+0.2*noise(pos))*conturColor; }
                if ( (maxPos.x>0.6&&maxPos.x<0.7) &&( ( ((pos-contur).x>wsize*2.0*floor(numWin/3.0)) && ((pos-contur).x<wsize*2.0+wsize*2.0*floor(numWin/3.0)) )|| ( ((pos-contur).x>wsize*2.0*floor(numWin*2.0/3.0)) && ((pos-contur).x<wsize*2.0+wsize*2.0*floor(numWin*2.0/3.0)) )) ){ return (0.9+0.2*noise(pos))*conturColor; }
                if ( (maxPos.x>0.7) &&( ( ((pos-contur).x>wsize*2.0*floor(numWin/4.0)) && ((pos-contur).x<wsize*2.0+wsize*2.0*floor(numWin/4.0)) )|| ( ((pos-contur).x>wsize*2.0*floor(numWin*2.0/4.0)) && ((pos-contur).x<wsize*2.0+wsize*2.0*floor(numWin*2.0/4.0)) )|| ( ((pos-contur).x>wsize*2.0*floor(numWin*3.0/4.0)) && ((pos-contur).x<wsize*2.0+wsize*2.0*floor(numWin*3.0/4.0)) )) ){ return (0.9+0.2*noise(pos))*conturColor; }
                
                if ((maxPos.x-pos.x<contur.x)||(maxPos.y-pos.y<contur.y+2.0*wsize)||(pos.x<contur.x)||(pos.y<contur.y)){ return (0.9+0.2*noise(pos))*conturColor; }
                if (maxPos.x<0.14) { return (0.9+0.2*noise(pos))*wallColor; }
                
                vec2 window = floor((pos-contur)/wsize/2.0);
                float random = rand(squarer*s*maxPos.y+window);
                float randomZ = rand(squarer*s*maxPos.y+floor(vec2((pos-contur).y,(pos-contur).y)/wsize/2.0));
                float windows = floorFactor*sin(randomZ*5342.475379+(fract(975.568*randomZ)*0.15+0.05)*window.x);
                
                float blH = 0.06*dist*600.0/iResolution.x/abs(dot(normalize(rayDir.xy),normalize(norm.xy)));
                float blV = 0.06*dist*600.0/iResolution.x/sqrt(abs(1.0-pow(abs(rayDir.z),2.0)));
                
                windowColor +=vec3(1.0,1.0,1.0);
                windowColor *= smoothstep(0.5-windowSize.x/2.0-blH,0.5-windowSize.x/2.0+blH,winPos.x);
                windowColor *= smoothstep(0.5+windowSize.x/2.0+blH,0.5+windowSize.x/2.0-blH,winPos.x);
                windowColor *= smoothstep(0.5-windowSize.y/2.0-blV,0.5-windowSize.y/2.0+blV,winPos.y);
                windowColor *= smoothstep(0.5+windowSize.y/2.0+blV,0.5+windowSize.y/2.0-blV,winPos.y);
                windowColor *= 1.5;
                
                if ((random <0.05*(3.5-2.5*floorFactor))||(windows>0.65)){
                        if (winPos.y<0.5) {windowColor*=(1.0-0.4*fract(random*100.0));}
                        if ((winPos.y>0.5)&&(winPos.x<0.5)) {windowColor*=(1.0-0.4*fract(random*10.0));}
                        return (0.9+0.2*noise(pos))*wallColor+(0.9+0.2*noise(pos))*windowColor;
                } else { windowColor*=0.08*fract(10.0*random); }
                
                return (0.9+0.2*noise(pos))*wallColor+windowColor;
            }

            vec3 textureRoof(vec2 pos, vec2 maxPos,vec2 squarer){
                float wsize = 0.025; float randB = rand(squarer*2.0);
                vec3 wallColor = (0.3+1.4*fract(randB*100.0))*vec3(0.1,0.1,0.1)+(-0.7+1.4*fract(randB*1000.0))*vec3(0.02,0.,0.);
                vec3 conturColor = wallColor*1.5/2.5; vec2 contur = vec2(0.02);
                if ((maxPos.x-pos.x<contur.x)||(maxPos.y-pos.y<contur.y)||(pos.x<contur.x)||(pos.y<contur.y)){ return (0.9+0.2*noise(pos))*conturColor; }
                float step1 = 0.06+0.12*fract(randB*562526.2865);
                pos -=step1; maxPos -=step1*2.0;
                if ((pos.x>0.0&&pos.y>0.0&&pos.x<maxPos.x&&pos.y<maxPos.y)&&((abs(maxPos.x-pos.x)<contur.x)||(abs(maxPos.y-pos.y)<contur.y)||(abs(pos.x)<contur.x)||(abs(pos.y)<contur.y))){ return (0.9+0.2*noise(pos))*conturColor; }
                pos -=step1; maxPos -=step1*2.0;
                if ((pos.x>0.0&&pos.y>0.0&&pos.x<maxPos.x&&pos.y<maxPos.y)&&((abs(maxPos.x-pos.x)<contur.x)||(abs(maxPos.y-pos.y)<contur.y)||(abs(pos.x)<contur.x)||(abs(pos.y)<contur.y))){ return (0.9+0.2*noise(pos))*conturColor; }
                pos -=step1; maxPos -=step1*2.0;
                if ((pos.x>0.0&&pos.y>0.0&&pos.x<maxPos.x&&pos.y<maxPos.y)&&((abs(maxPos.x-pos.x)<contur.x)||(abs(maxPos.y-pos.y)<contur.y)||(abs(pos.x)<contur.x)||(abs(pos.y)<contur.y))){ return (0.9+0.2*noise(pos))*conturColor; }
                return (0.9+0.2*noise(pos))*wallColor;
            }

            vec3 cars(vec2 squarer, vec2 pos, float dist,float level){
                vec3 color = vec3(0.0); 
                float carInten = 4.0/sqrt(dist); 
                float carRadis = 0.012; 
                if (dist>2.0) {carRadis *= sqrt(dist/2.0);}
                
                vec3 car1 = vec3(0.4, 0.8, 1.0); 
                vec3 car2 = vec3(1.0, 0.05, 0.0); 
                
                float carNumber = 0.8; 
                float random = noise((level+1.0)*squarer*1.24435824);
                
                float spd = iTime * 0.4; 
                float str = 0.25; 
                float wid = 1.2;
                
                for (int j=0;j<10; j++){
                    float i = 0.03+float(j)*0.094;
                    if(fract(random*5.0/i)>carNumber){
                        vec2 p = pos - vec2(fract(i+spd), 0.025);
                        color += car1*carInten*smoothstep(carRadis,0.0,length(vec2(p.x * str, p.y * wid)));
                    }
                    if(fract(random*10.0/i)>carNumber){
                        vec2 p = pos - vec2(fract(i-spd), 0.975);
                        color += car2*carInten*smoothstep(carRadis,0.0,length(vec2(p.x * str, p.y * wid)));
                    }
                    if(color.x>0.0) break;
                }
                for (int j=0;j<10; j++){
                    float i= 0.03+float(j)*0.094;
                    if(fract(random*5.0/i)>carNumber){
                        vec2 p = pos - vec2(0.025, fract(i+spd));
                        color += car2*carInten*smoothstep(carRadis,0.0,length(vec2(p.x * wid, p.y * str)));
                    }
                    if(fract(random*10.0/i)>carNumber){
                        vec2 p = pos - vec2(0.975, fract(i-spd));
                        color += car1*carInten*smoothstep(carRadis,0.0,length(vec2(p.x * wid, p.y * str)));
                    }
                    if(color.x>0.0) break;
                }
                for (int j=0;j<10; j++){
                    float i = 0.03+0.047+float(j)*0.094;
                    if(fract(random*100.0/i)>carNumber){
                        vec2 p = pos - vec2(fract(i+spd), 0.045);
                        color += car1*carInten*smoothstep(carRadis,0.0,length(vec2(p.x * str, p.y * wid)));
                    }
                    if(fract(random*1000.0/i)>carNumber){
                        vec2 p = pos - vec2(fract(i-spd), 0.955);
                        color += car2*carInten*smoothstep(carRadis,0.0,length(vec2(p.x * str, p.y * wid)));
                    }
                    if(color.x>0.0) break;
                }
                for (int j=0;j<10; j++){
                    float i = 0.03+0.047+float(j)*0.094;
                    if(fract(random*100.0/i)>carNumber){
                        vec2 p = pos - vec2(0.045, fract(i+spd));
                        color += car2*carInten*smoothstep(carRadis,0.0,length(vec2(p.x * wid, p.y * str)));
                    }
                    if(fract(random*1000.0/i)>carNumber){
                        vec2 p = pos - vec2(0.955, fract(i-spd));
                        color += car1*carInten*smoothstep(carRadis,0.0,length(vec2(p.x * wid, p.y * str)));
                    }
                    if(color.x>0.0) break;
                }
                return color;
            }

            vec3 textureGround(vec2 squarer, vec2 pos,vec2 vert1,vec2 vert2,float dist){
                vec3 color = (0.9+0.2*noise(pos))*vec3(0.1,0.15,0.1); float randB = rand(squarer*2.0);
                vec3 wallColor = (0.3+1.4*fract(randB*100.0))*vec3(0.1,0.1,0.1)+(-0.7+1.4*fract(randB*1000.0))*vec3(0.02,0.,0.);
                float fund = 0.03; float bl = 0.01;
                float f = smoothstep(vert1.x-fund-bl,vert1.x-fund,pos.x); f *= smoothstep(vert1.y-fund-bl,vert1.y-fund,pos.y); f *= smoothstep(vert2.y+fund+bl,vert2.y+fund,pos.y); f *= smoothstep(vert2.x+fund+bl,vert2.x+fund,pos.x);

                vec2 maxPos = vec2(1.,1.); vec2 contur = vec2(0.06,0.06);
                if ((pos.x>0.0&&pos.y>0.0&&pos.x<maxPos.x&&pos.y<maxPos.y)&&((abs(maxPos.x-pos.x)<contur.x)||(abs(maxPos.y-pos.y)<contur.y)||(abs(pos.x)<contur.x)||(abs(pos.y)<contur.y))){ color =  vec3(0.1,0.1,0.1)*(0.9+0.2*noise(pos)); }
                pos -= 0.06; maxPos = vec2(.88,0.88); contur = vec2(0.01,0.01);
                if ((pos.x>0.0&&pos.y>0.0&&pos.x<maxPos.x&&pos.y<maxPos.y)&&((abs(maxPos.x-pos.x)<contur.x)||(abs(maxPos.y-pos.y)<contur.y)||(abs(pos.x)<contur.x)||(abs(pos.y)<contur.y))){ color =  vec3(0.,0.,0.); }
                color = mix(color,(0.9+0.2*noise(pos))*wallColor*1.5/2.5,f);
                pos+=0.06;
                if (pos.x<0.07||pos.x>0.93||pos.y<0.07||pos.y>0.93){ color+=cars(squarer,pos,dist,0.0); }
                return color;
            }

            void main() {
                vec2 fragCoord = gl_FragCoord.xy;
                vec2 pos = (fragCoord.xy*2.0 - iResolution.xy) / iResolution.y;
                
                vec3 camPos = vec3(15.0, 10.0, 2.1);
                vec3 camTarget = vec3(15.0, 20.0, 1.7);
                
                vec3 camDir = normalize(camTarget-camPos); 
                vec3 camUp  = normalize(vec3(0.0, 0.0, -1.0)); 
                vec3 camSide = cross(camDir, camUp); 
                camUp  = cross(camDir, camSide);
                vec3 rayDir = normalize(camSide*pos.x + camUp*pos.y + camDir*1.6);
                
                vec3 color = vec3(0.0);
                vec2 square = floor(camPos.xy); square.x += 0.5-0.5*sign(rayDir.x); square.y += 0.5-0.5*sign(rayDir.y);
                float mind = 100.0; int k = 0; vec3 pol; vec2 maxPos; vec2 crossG;
                
                vec3 ro = camPos/256.0; 
                vec3 rd = normalize(vec3(rayDir.x, rayDir.z, rayDir.y)); 
                
                vec3 aurColor = bg(rd);
                if (rd.y > 0.0) { 
                    vec4 aur = smoothstep(0., 1.5, aurora(ro, rd)); 
                    aurColor += stars(rd); 
                    aurColor = aurColor * (1.0 - aur.a) + aur.rgb; 
                }
                
                for (int i=1; i<I_MAX; i++){
                    vec2 squarer = square-vec2(0.5,0.5)+0.5*sign(rayDir.xy);
                    
                    float random = rand(squarer); float height = 0.0; float quartalR = rand(floor(squarer/10.0));
                    if (floor(squarer/10.0) == vec2(0.0,0.0)) quartalR = 0.399;
                    if (quartalR<0.4) { height = -0.15+0.4*random+smoothstep(12.0,7.0,length(fract(squarer/10.0)*10.0-vec2(5.0,5.0)))*0.8*random+0.9*smoothstep(10.0,0.0,length(fract(squarer/10.0)*10.0-vec2(5.0,5.0))); height*=quartalR/0.4; }
                    float maxJ=2.0; float roof = 1.0;
                    if (height<0.3){ height = 0.3*(0.7+1.8*fract(random*100.543264));maxJ = 2.0; if (fract(height*1000.0)<0.04) height*=1.3; }
                    if (height>0.5) {maxJ=3.0;} if (height>0.85){maxJ = 4.0;}
                    if (fract(height*100.0)<0.15){height = pow(maxJ-1.0,0.3)*height; maxJ = 2.0; roof = 0.0;}

                    float maxheight = 1.5*pow((maxJ-1.0),0.3)*height+roof*0.07;
                    if (camPos.z+rayDir.z*(length(camPos.xy - square) +0.71 - sign(rayDir.z)*0.71)/length(rayDir.xy)<maxheight){
                        vec2 vert1r; vec2 vert2r; float zz = 0.0; float prevZZ = 0.0;
                        for(int nf=1;nf<8;nf++){
                            float j = float(nf); if(j>maxJ){break;} prevZZ = zz; zz = 1.5*pow(j,0.3)*height; float dia = 1.0/pow(j,0.3);
                            if(j==maxJ){ if (roof == 0.0) {break;} zz = 1.5*pow((j-1.0),0.3)*height+0.03+0.04*fract(random*1535.347); dia = 1.0/pow((j-1.0),0.3)-0.2-0.2*fract(random*10000.0); }
                            vec2 v1 = vec2(0.0); vec2 v2 = vec2(0.0); float randomF = fract(random*10.0);
                            if (randomF<0.25){ v1 = vec2(fract(random*1000.0),fract(random*100.0));}
                            if (randomF>0.25&&randomF<0.5){ v1 = vec2(fract(random*100.0),0.0);v2 = vec2(0.0,fract(random*1000.0));}
                            if (randomF>0.5&&randomF<0.75){ v2 = vec2(fract(random*1000.0),fract(random*100.0));}
                            if (randomF>0.75){ v1 = vec2(0.0,fract(random*1000.0)); v2 = vec2(fract(random*100.0),0.0);}
                            if (rayDir.y<0.0){ float y = v1.y; v1.y = v2.y; v2.y = y; } if (rayDir.x<0.0){ float x = v1.x; v1.x = v2.x; v2.x = x; }
                            
                            vec2 vert1 = square+sign(rayDir.xy)*(0.5-0.37*(dia*1.0-1.0*v1)); vec2 vert2 = square+sign(rayDir.xy)*(0.5+0.37*(dia*1.0-1.0*v2));
                            if (j==1.0){ vert1r = vec2(min(vert1.x, vert2.x),min(vert1.y,vert2.y)); vert2r = vec2(max(vert1.x, vert2.x),max(vert1.y,vert2.y)); }
                            
                            vec3 pxy = polygonXY(zz,vert1,vert2,camPos,rayDir); if (pxy.x<mind){mind = pxy.x; pol = pxy; k=1;maxPos = vec2(abs(vert1.x-vert2.x),abs(vert1.y-vert2.y));}
                            vec3 pyz = polygonYZ(vert1.x,vec2(vert1.y,prevZZ),vec2(vert2.y,zz),camPos,rayDir); if (pyz.x<mind){mind = pyz.x; pol = pyz; k=2;maxPos = vec2(abs(vert1.y-vert2.y),zz-prevZZ);}
                            vec3 pxz = polygonXZ(vert1.y,vec2(vert1.x,prevZZ),vec2(vert2.x,zz),camPos,rayDir); if (pxz.x<mind){mind = pxz.x; pol = pxz; k=3;maxPos = vec2(abs(vert1.x-vert2.x),zz-prevZZ);}
                        }
                        if ((mind<100.0)&&(k==1)){ color += textureRoof(vec2(pol.y,pol.z),maxPos,squarer); if (mind>3.0){color*=sqrt(3.0/mind);} break; } 
                        if ((mind<100.0)&&(k==2)){ vec3 wC=vec3(0.); color += textureWall(vec2(pol.y,pol.z),maxPos,squarer,1.2075624928,height,mind,rayDir,vec3(1.0,0.0,0.0), wC, 0.0); if (mind>3.0){color*=sqrt(3.0/mind);} break; } 
                        if ((mind<100.0)&&(k==3)){ vec3 wC=vec3(0.); color += textureWall(vec2(pol.y,pol.z),maxPos,squarer,0.8093856205,height,mind,rayDir,vec3(0.0,1.0,0.0), wC, 0.0); if (mind>3.0){color*=sqrt(3.0/mind);} break; }
                        
                        float t = -camPos.z/rayDir.z; crossG = camPos.xy + rayDir.xy*t;
                        if (floor(crossG) == squarer) { mind = length(vec3(crossG,0.0)-camPos); color += textureGround(squarer,fract(crossG),fract(vert1r),fract(vert2r),mind); if (mind>3.0){color*=sqrt(3.0/mind);} break; }
                    } 
                    if ((square.x+sign(rayDir.x)-camPos.x)/rayDir.x<(square.y+sign(rayDir.y)-camPos.y)/rayDir.y) { square.x += sign(rayDir.x)*1.0; } else { square.y += sign(rayDir.y)*1.0; }
                }

                if (mind < 100.0) {
                    float fogDensity = 0.032; 
                    float fogDistFactor = exp(-pow(mind * fogDensity, 2.0));
                    float hitZ = camPos.z + rayDir.z * mind;
                    float fogHeightFactor = exp(-max(0.0, hitZ - 0.5) * 0.7);
                    
                    float fogAmount = 1.0 - (fogDistFactor * mix(1.0, 0.4, fogHeightFactor));
                    fogAmount = clamp(fogAmount, 0.0, 1.0);
                    
                    vec3 fogColorGround = vec3(0.18, 0.02, 0.05); 
                    vec3 fogColorHigh = vec3(0.02, 0.02, 0.04);   
                    vec3 fogColor = mix(fogColorGround, fogColorHigh, clamp(hitZ * 0.25, 0.0, 1.0));
                    
                    float sunScatter = pow(max(0.0, dot(rayDir, normalize(vec3(-0.5, -0.6, 0.9)))), 4.0);
                    fogColor += vec3(0.25, 0.05, 0.0) * sunScatter * 0.6;

                    color = mix(color, fogColor, fogAmount);
                } else {
                    color = aurColor;
                    float horizonFog = exp(-pow(max(0.0, rayDir.z) * 6.0, 1.5));
                    vec3 horizonColor = vec3(0.12, 0.01, 0.03);
                    color = mix(color, horizonColor, horizonFog * 0.85);
                }

                const vec3 beaconColor = vec3(1.5, 0.2, 0.0);
                
                float lum = dot(color, vec3(0.299, 0.587, 0.114));
                vec3 darkColor = color * mix(1.0, 0.15, uEclipse.x); 
                darkColor = mix(darkColor, color, smoothstep(0.8, 1.0, lum)); 
                
                vec3 bloodColor = vec3(0.8, 0.15, 0.05) * lum * 2.5; 
                color = mix(darkColor, darkColor + bloodColor, uEclipse.y);

                gl_FragColor = vec4( color, mind );
            }
            `;

            const programBufferA = gl.createProgram();
            const vsA = MoonApp.loadShader(gl, gl.VERTEX_SHADER, MoonApp.SHARED_VERTEX_SHADER); gl.attachShader(programBufferA, vsA);
            const fsA = MoonApp.loadShader(gl, gl.FRAGMENT_SHADER, fsBufferA); gl.attachShader(programBufferA, fsA);
            gl.linkProgram(programBufferA);

            const fsImage = `
            precision highp float;
            uniform vec3 iResolution;
            uniform sampler2D iChannel0;

            vec4 GetBloom ( in vec2 uv, in vec4 inColor ) {
                float numSamples = 1.0;
                vec4 color = inColor;
                vec2 px = vec2(1.0) / iResolution.xy;
                for (float x = -8.0; x <= 8.0; x += 1.0) {
                    for (float y = -8.0; y <= 8.0; y += 1.0) {
                        vec4 addColor = texture2D(iChannel0, uv + (vec2(x, y) * px));
                        if (max(addColor.r, max(addColor.g, addColor.b)) > 0.3) {
                            float dist = length(vec2(x,y))+1.0;
                            vec4 glowColor = max((addColor * 128.0) / pow(dist, 2.0), vec4(0.0));
                            if (max(glowColor.r, max(glowColor.g, glowColor.b)) > 0.0) { color += glowColor; numSamples += 1.0; }
                        }
                    }
                }
                return color / numSamples;
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / iResolution.xy;
                vec4 color = texture2D(iChannel0, uv);
                gl_FragColor = mix(color, GetBloom(uv, color), 0.05);
                gl_FragColor.a = 1.0;
            }
            `;

            const programImage = gl.createProgram();
            const vsImg = MoonApp.loadShader(gl, gl.VERTEX_SHADER, MoonApp.SHARED_VERTEX_SHADER); gl.attachShader(programImage, vsImg);
            const fsImg = MoonApp.loadShader(gl, gl.FRAGMENT_SHADER, fsImage); gl.attachShader(programImage, fsImg);
            gl.linkProgram(programImage);

            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

            return {
                gl, canvas, programBufferA, programImage,
                locsA: { 
                    res: gl.getUniformLocation(programBufferA, "iResolution"), 
                    time: gl.getUniformLocation(programBufferA, "iTime"), 
                    pos: gl.getAttribLocation(programBufferA, "aPosition"),
                    eclipse: gl.getUniformLocation(programBufferA, "uEclipse") 
                },
                locsImg: { res: gl.getUniformLocation(programImage, "iResolution"), tex: gl.getUniformLocation(programImage, "iChannel0"), pos: gl.getAttribLocation(programImage, "aPosition") },
                fbo: null, texture: null 
            };
        };

MoonApp.initTotalMoonShader = function() {
            const canvas = document.getElementById('totalMoonCanvas');
            const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
            if (!gl) return null;

            const fsSource = `#version 300 es
            precision highp float;
            out vec4 fragColor_out;
            
            uniform vec3 iResolution;
            uniform float iTime;
            uniform vec2 uShadowPos; 
            uniform float uImpact;   

            float roty = 0.; float time;
            mat2 rot(float t) { return mat2(cos(t), -sin(t), sin(t), cos(t)); }
            float sdSphere(vec3 p, float r) { return length(p) - r; }
            vec2 map(vec3 p) { return vec2(sdSphere(p, 1.7), 1.0); }

            vec3 hash33(vec3 p) {
                p = fract(p * vec3(17.16, 31.79, 47.11)); p += dot(p, p.yxz + 19.19); return fract((p.xxy + p.yxx) * p.zyx);
            }

            float getBump(vec3 p) {
                float h = 0.0; float freq = 0.8; float amp = 1.0;
                for(int layer = 0; layer < 4; layer++) {
                    vec3 ip = floor(p * freq); vec3 fp = fract(p * freq); float minDist = 2.0; float radius = 0.5; float craterShape = 0.0;
                    for(int i=-1; i<=1; i++) {
                        for(int j=-1; j<=1; j++) {
                            for(int k=-1; k<=1; k++) {
                                vec3 offset = vec3(float(i), float(j), float(k)); vec3 h3 = hash33(ip + offset); vec3 diff = offset + h3 - fp; float d = length(diff);
                                if (h3.z > 0.35) continue; 
                                if(d < minDist) { minDist = d; radius = 0.2 + 0.4 * h3.x; }
                            }
                        }
                    }
                    float x = minDist / radius;
                    if (x < 1.0) { float cavity = x * x - 1.0; float rim = smoothstep(0.5, 0.8, x) * smoothstep(1.0, 0.8, x) * 1.2; craterShape = cavity + rim; }
                    h += craterShape * amp; freq *= 2.3; amp *= 0.35;
                }
                h += fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 0.015;
                return h * 0.3; 
            }
            
            float worldBump(vec3 p) { vec3 localP = p; localP.xz *= rot(roty); localP.xy *= rot(time * 0.005); return getBump(localP); }

            vec3 getNormal(vec3 p) {
                vec3 n = normalize(p); vec2 e = vec2(0.015, 0.0); float b = worldBump(p);
                vec3 grad = vec3( worldBump(p + e.xyy) - b, worldBump(p + e.yxy) - b, worldBump(p + e.yyx) - b ) / e.x;
                return normalize(n - grad * 1.5); 
            }

            float hash(vec2 p) { return fract(sin(dot(p, vec2(49., 489.))) * 39284.); }

            vec4 raymarch(vec3 ro, vec3 rd, vec2 rp_xy_offset) {
                vec3 rp; float t = 0.0; vec2 hit; float iter; vec3 col = vec3(0.0); float alpha = 0.0;
                for (int i = 0; i < 50; i++) {
                    iter = float(i); rp = ro + rd * t; rp.xy += rp_xy_offset; hit = map(rp);
                    if (hit.x < 0.01) break; else if (t > 30.) { hit = vec2(0.0); break; }
                    t += hit.x * 0.5;
                }

                vec3 ld = normalize(vec3(0.5, 0.2, 1.0)); 
                if (hit.y == 1.) {                                        
                    vec3 n = getNormal(rp); vec3 hv = normalize(ld - rd); float dif = clamp(dot(n, ld), 0.0, 1.0); float nv = clamp(dot(-rd, n), 0.0, 1.0); 
                    float colorCycle = mod(iTime * 0.3, 3.0); 
                    
                    vec3 brightGray = vec3(0.9, 0.9, 0.9); vec3 brightYellow = vec3(1.0, 0.95, 0.5); vec3 amberGold = vec3(1.0, 0.85, 0.2); vec3 baseColor;
                    if (colorCycle < 1.0) { baseColor = mix(brightGray, brightYellow, smoothstep(0.0, 1.0, colorCycle)); }
                    else if (colorCycle < 2.0) { baseColor = mix(brightYellow, amberGold, smoothstep(1.0, 2.0, colorCycle)); }
                    else { baseColor = mix(amberGold, brightGray, smoothstep(2.0, 3.0, colorCycle)); }
                    
                    float spec = pow(clamp(dot(n, hv), 0.0, 1.0), 256.0) * 5.0; 
                    float spec2 = pow(clamp(dot(n, normalize(ld - rd + vec3(0.1, 0.0, 0.0))), 0.0, 1.0), 128.0) * 2.0;
                    float thickness = max(0.0, 1.0 - nv); float fresnel = pow(thickness, 4.0) * 4.5;
                    vec3 refr; refr.r = pow(clamp(dot(normalize(ld - n * 0.10), -rd), 0.0, 1.0), 18.0); refr.g = pow(clamp(dot(normalize(ld - n * 0.15), -rd), 0.0, 1.0), 18.0); refr.b = pow(clamp(dot(normalize(ld - n * 0.20), -rd), 0.0, 1.0), 18.0);
                    float sss = pow(clamp(dot(rd, -(n + ld)), 0.0, 1.0), 2.0) * 3.5;

                    vec3 sunlit = baseColor * (dif * 0.15 + 0.1); sunlit += baseColor * fresnel; sunlit += spec * vec3(1.0) + spec2 * vec3(0.9, 0.9, 1.0); sunlit += refr * 2.5; 
                    sunlit += mix(vec3(1.0, 0.3, 0.0), baseColor, 0.4) * sss; 
                    
                    vec3 darkJelly = vec3(0.1, 0.02, 0.0); 
                    darkJelly += fresnel * vec3(0.6, 0.15, 0.0) * 0.8; 
                    darkJelly += spec * 0.4; 
                    darkJelly += sss * vec3(0.7, 0.15, 0.0); 

                    float shadowRadius = 1.7 * 2.6; float distToShadow = length(rp.xy - uShadowPos);
                    float inShadow = smoothstep(shadowRadius - 0.25, shadowRadius + 0.2, distToShadow); 
                    
                    col += mix(darkJelly, sunlit, inShadow);
                    col = mix(col, vec3(0.9, 0.1, 0.0) * length(col), smoothstep(0.0, 1.0, uImpact) * 0.85);

                    alpha = mix(0.15, 0.98, pow(thickness, 1.5)); alpha *= smoothstep(-8.0, 1.5, rp.y); 
                }   
                return vec4(col, alpha);
            }

            vec3 getRayDirection(vec2 uv_p) { float zoom = -1.0 - uImpact * 0.15; return normalize(vec3(uv_p, zoom + 0.2 * pow(length(uv_p), 2.0))); }

            void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
                vec2 uv = fragCoord/max(iResolution.xy, vec2(1.0)); vec2 p = uv * 2. - 1.; p.x *= iResolution.x / iResolution.y;
                time = iTime; roty = time * 0.05; vec2 rp_offset = vec2(0.15, 0.2); p.y -= 0.45; 

                float stretchBand = step(0.95, hash(vec2(floor(p.y * 280.0), floor(time * 20.0))));
                float stretchIntensity = hash(vec2(floor(p.y * 280.0), 1.0)) * (0.5 + uImpact * 3.0); 
                p.x = mix(p.x, p.x * (1.0 - stretchIntensity), stretchBand);

                vec3 ro = vec3(0.0, 0.0, 5.0); vec3 rd = getRayDirection(p);
                vec4 c = raymarch(ro, rd, rp_offset); vec3 col = c.rgb; float alpha = c.a;

                vec3 flash = vec3(1.0, 0.6, 0.2) * uImpact * 0.3; col += flash; alpha = max(alpha, uImpact * 0.8);
                fragColor = vec4(col, clamp(alpha, 0.0, 1.0));
            }
            void main() { mainImage(fragColor_out, gl_FragCoord.xy); }
            `;

            const program = gl.createProgram();
            const vs = MoonApp.loadShader(gl, gl.VERTEX_SHADER, MoonApp.SHARED_VERTEX_SHADER_MOON); 
            const fs = MoonApp.loadShader(gl, gl.FRAGMENT_SHADER, fsSource); 
            if(!vs || !fs) return null;
            gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);

            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
            const aPos = gl.getAttribLocation(program, "aPosition");
            gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            return {
                gl, program, canvas,
                locs: { res: gl.getUniformLocation(program, "iResolution"), time: gl.getUniformLocation(program, "iTime"), shadow: gl.getUniformLocation(program, "uShadowPos"), impact: gl.getUniformLocation(program, "uImpact") }
            };
        };

// ====== orbiter.js ======
var MoonApp = MoonApp || {};

MoonApp.initOrbiter = function() {
  var glCanvas = document.getElementById('glcanvas');
const glContext = glCanvas.getContext('webgl', { alpha: true, antialias: true, depth: false });
        if(!glContext) alert("WebGL init failed");

        const vsSourceMain = `
            attribute vec4 aVertexPosition;
            void main() { gl_Position = aVertexPosition; }
        `;

        const fsSourceMain = `
            #extension GL_OES_standard_derivatives : enable
            precision highp float;
            
            uniform vec3 iResolution;
            uniform vec3 uCamParams; 
            uniform float uProgress; 
            uniform float uTime;
            uniform float uThemeBlend;
            uniform float uCoursePhase;
            uniform float uCourse02Phase;
            uniform vec2 uScreenOffset;
            uniform float uCamZoom;
            uniform float uIdleRotation;

            #define MAX_DIST 150.
            #define PI 3.1415926535
            #define TAU 6.2831853

            const float SEED = 0.0;
            const vec3 SUN_DIR = normalize(vec3(-0.9, -0.1, 0.7)); 

            vec3 mixT(vec3 n, vec3 c) { return mix(n, c, uThemeBlend); }
            float mixT(float n, float c) { return mix(n, c, uThemeBlend); }

            #define SUN_COLOR mixT(vec3(1.0, 0.9, 0.7), vec3(1.0, 0.85, 0.6))
            #define LAND_COLOR mixT(vec3(0.2, 0.45, 0.35), vec3(0.25, 0.1, 0.2))
            #define JUNGLE_COLOR mixT(vec3(0.1, 0.35, 0.25), vec3(0.15, 0.05, 0.15))
            #define DESERT_COLOR mixT(vec3(0.85, 0.7, 0.55), vec3(0.6, 0.3, 0.3))
            #define SNOW_COLOR mixT(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.8, 0.9))
            #define OCEAN_COLOR mixT(vec3(0.05, 0.2, 0.5), vec3(0.1, 0.05, 0.2))
            #define CLOUD_COLOR mixT(vec3(0.95, 0.98, 1.0), vec3(1.0, 0.6, 0.7))
            const float OCEAN_SIZE = 0.57;

            struct SdfCtx { float k; vec3 col; float d; };
            float sdSphere(vec3 p, float r) { return length(p) - r; }

            mat3 rotateY(float a) {
                float c = cos(a), s = sin(a);
                return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
            }

            mat3 calcLookAtMatrix(vec3 camPos, vec3 at) {
                vec3 zAxis = normalize(at - camPos);
                vec3 xAxis = normalize(cross(zAxis, vec3(0.0, 1.0, 0.0)));
                vec3 yAxis = normalize(cross(xAxis, zAxis));
                return mat3(xAxis, yAxis, zAxis);
            }

            float hash12(vec2 p, float scale) {
                p = mod(p, scale); p.y += SEED;
                return fract(sin(dot(p, vec2(12.9898, 4.1414))) * 43758.5453);
            }

            float noise(vec2 p, float scale) {
                p *= scale; vec2 f = fract(p); p = floor(p);
                return mix(mix(hash12(p, scale), hash12(p + vec2(1.0, 0.0), scale), f.x),
                           mix(hash12(p + vec2(0.0, 1.0), scale), hash12(p + vec2(1.0, 1.0), scale), f.x), f.y);
            }

            float fbm4(vec2 p, float scale) {
                float s = 0.0, m = 0.0, a = 1.0;
                for(int i = 0; i < 4; i++) { s += a * noise(p, scale); m += a; a *= 0.6; scale *= 2.0; }
                return s / m;
            }

            float fbm7(vec2 p, float scale) {
                float s = 0.0, m = 0.0, a = 1.0;
                for(int i = 0; i < 7; i++) { s += a * noise(p, scale); m += a; a *= 0.6; scale *= 2.0; }
                return s / m;
            }

            float swirly_fbm6(vec2 p, float scale) {
                p -= uTime * 0.003; 
                float s = 0.0, m = 0.0, a = 1.0;
                for(int i = 0; i < 6; i++) {
                    s += a * noise(p + uTime * 0.003 * a, scale);
                    m += a; a *= 0.6; scale *= 2.0;
                    p += vec2(cos(s * TAU), sin(s * TAU)) / scale * 0.4;
                }
                return s / m;
            }

            vec2 hash22(vec2 p, float scale) {
                p = mod(p, scale); p.y += SEED;
                vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
                p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy);
            }

            float crater_noise(vec2 p, float scale) {
                p *= scale; vec2 f = fract(p); p = floor(p); float va = 0.0; float wt = 0.0;
                for (int i = -1; i <= 1; i++) {
                    for (int j = -1; j <= 1; j++) {
                        vec2 g = vec2(float(i), float(j)); vec2 o = hash22(p + g, scale); float d = distance(f - g, o);
                        float w = exp(-4.0 * d); va += w * sin(TAU * sqrt(max(d, 0.06))); wt += w;
                    }
                }
                return abs(va / wt);
            }

            float crater_fbm(vec2 x) {
                float craters = crater_noise(x, 7.0) * 0.6 + crater_noise(x, 20.0) * 0.2;
                return 1.0 - (craters + fbm4(x, 48.0) * 0.35) * 0.4;
            }

            SdfCtx mapSolids(vec3 p) {
                SdfCtx res = SdfCtx(0.0, vec3(0.0), MAX_DIST);
                float dEarth = sdSphere(p, 2.0);
                if(dEarth < res.d) res = SdfCtx(1.0, vec3(0.0), dEarth); 

                float curA = (uProgress + uIdleRotation) * 2.0 * PI;
                vec3 mPos = vec3(cos(curA) * 6.25, 0.0, -sin(curA) * 6.25);
                float dMoon = sdSphere(p - mPos, 0.35);
                if(dMoon < res.d) res = SdfCtx(3.0, vec3(0.0), dMoon);

                return res;
            }

            vec3 calcNormal(vec3 pos) {
                vec2 e = vec2(0.005, 0.0); 
                return normalize(vec3(
                    mapSolids(pos + e.xyy).d - mapSolids(pos - e.xyy).d,
                    mapSolids(pos + e.yxy).d - mapSolids(pos - e.yxy).d,
                    mapSolids(pos + e.yyx).d - mapSolids(pos - e.yyx).d
                ));
            }

            float getShadow(vec3 p, vec3 l) {
                float b = dot(p, l); float c = dot(p, p) - (2.0 * 2.0); float h = b*b - c;
                if(h > 0.0) { float t = -b - sqrt(h); if(t > 0.0) return 0.02; }
                return 1.0;
            }

            vec3 calcAtmosphere(vec3 ro, vec3 rd, vec3 sunDir) {
                float d = length(cross(ro, rd)); float atmoRadius = 2.45; float earthRadius = 2.0;
                if(d > atmoRadius) return vec3(0.0);
                
                float distToClosest = dot(-ro, rd); vec3 closestPoint = ro + rd * distToClosest; float lClosest = length(closestPoint);
                vec3 normCP = lClosest > 0.001 ? closestPoint / lClosest : vec3(0.0, 1.0, 0.0);
                float sunDot = dot(normCP, sunDir);
                float sunIllumination = smoothstep(-0.2, 0.5, sunDot); float density = smoothstep(atmoRadius, earthRadius, d); float powDensity = pow(density, 2.5);
                
                vec3 color = mixT(vec3(0.2, 0.45, 0.7), vec3(0.8, 0.2, 0.5)) * pow(density, 1.5) * sunIllumination * 1.5;
                color += mixT(vec3(0.5, 0.65, 0.85), vec3(1.0, 0.6, 0.8)) * pow(density, 8.0) * sunIllumination * 1.5;
                
                float terminatorGlow = smoothstep(-0.4, 0.2, sunDot) * smoothstep(0.4, -0.2, sunDot);
                vec3 twilightColor = mix(mixT(vec3(0.1, 0.25, 0.5), vec3(0.6, 0.1, 0.4)), vec3(1.0, 0.7, 0.1), smoothstep(-0.2, 0.2, sunDot));
                color += twilightColor * terminatorGlow * powDensity * 4.0;
                
                float nightGlow = smoothstep(0.0, -1.0, sunDot); 
                vec3 atmoDef = vec3(0.04, 0.08, 0.15); vec3 atmoPurple = vec3(0.04, 0.02, 0.10); vec3 atmoPink = vec3(0.12, 0.04, 0.10);
                vec3 atmoNormal = mix(atmoDef, atmoPurple, uCoursePhase);
                atmoNormal = mix(atmoNormal, atmoPink, uCourse02Phase);
                color += mix(atmoNormal, vec3(0.05, 0.01, 0.1), uThemeBlend) * powDensity * nightGlow * 0.8;
                return color;
            }

            vec4 calcOrbitalRing(vec3 ro, vec3 rd, float t_solid) {
                if (abs(rd.y) < 1e-4) return vec4(0.0);
                float t_ring = -ro.y / rd.y;
                
                if (t_ring > 0.0 && t_ring < t_solid) {
                    vec3 pRing = ro + rd * t_ring; float r = length(pRing.xz);
                    
                    if (r > 5.2 && r < 8.5) { 
                        float a = atan(-pRing.z, pRing.x); if(a < 0.0) a += 2.0 * PI; 
                        float targetAngle = uProgress * 2.0 * PI;

                        float edgeFade = smoothstep(5.2, 5.5, r) * (1.0 - smoothstep(7.2, 7.5, r));
                        float mainTrack = 1.0 - smoothstep(0.0, 0.03, abs(r - 6.25));
                        float innerRipple = smoothstep(0.95, 1.0, cos(a * 29.53)) * (1.0 - smoothstep(0.0, 0.1, abs(r - 5.6)));
                        float headDist = abs(a - targetAngle);

                        // --- NORMAL THEME ---
                        vec3 n_col = vec3(0.9, 0.95, 1.0) * edgeFade * 0.35;
                        float n_alpha = edgeFade * 0.35;
                        n_col += vec3(1.0) * mainTrack * 0.5; 
                        n_alpha = max(n_alpha, mainTrack * 0.5);
                        float n_markers = smoothstep(0.015, 0.0, abs(mod(a, PI/8.0)));
                        if (a > targetAngle) {
                            n_col = mix(n_col, vec3(0.0, 0.3, 0.9), n_markers * mainTrack); 
                            n_alpha = max(n_alpha, n_markers * mainTrack * 0.9);
                        }
                        n_col += vec3(0.8, 0.9, 1.0) * innerRipple * 1.5;
                        n_alpha = max(n_alpha, innerRipple * 0.5);
                        
                        if (a <= targetAngle && uProgress > 0.001) {
                            vec3 fillCol = mix(vec3(0.2, 0.45, 0.75), vec3(1.0, 0.7, 0.1), a / (2.0 * PI));
                            n_col = mix(n_col, fillCol, edgeFade); 
                            n_alpha = max(n_alpha, edgeFade * 0.9);
                            n_col += mix(vec3(0.3, 0.55, 0.8), vec3(1.0, 0.8, 0.3), a / (2.0 * PI)) * mainTrack * 3.0; 
                            n_alpha = max(n_alpha, mainTrack);
                            n_col += vec3(1.0, 0.9, 0.5) * exp(-10.0 * headDist) * exp(-12.0 * abs(r - 6.25)) * 15.0;
                            n_col += vec3(1.0, 0.7, 0.2) * exp(-25.0 * abs(r - 6.25)) * exp(-2.0 * headDist) * 5.0;
                            n_col += vec3(1.0, 0.8, 0.3) * innerRipple * (1.0 - headDist) * 3.0;
                        }

                        // --- CORE THEME ---
                        vec3 c_col = vec3(0.65, 0.05, 0.35) * edgeFade * 1.5;
                        float c_alpha = edgeFade;
                        c_col += vec3(0.3, 0.7, 1.0) * mainTrack * 1.5; 
                        float m1 = smoothstep(0.015, 0.0, abs(a - PI * 0.5));
                        float m2 = smoothstep(0.015, 0.0, abs(a - PI));
                        float m3 = smoothstep(0.015, 0.0, abs(a - PI * 1.5));
                        float m4 = smoothstep(0.015, 0.0, min(a, TAU - a)); 
                        float c_markers = m1 + m2 + m3 + m4;
                        c_col += vec3(1.0, 0.6, 0.2) * c_markers * mainTrack * 6.0;
                        c_col += vec3(1.0, 0.5, 0.1) * innerRipple * 2.0;

                        if (a <= targetAngle && uProgress > 0.001) {
                            vec3 fillCol = mix(vec3(0.5, 0.15, 0.3), vec3(1.0, 0.7, 0.1), a / (2.0 * PI));
                            c_col += fillCol * edgeFade * 2.5; 
                            vec3 trackCol = mix(vec3(0.5, 0.15, 0.3), vec3(1.0, 0.7, 0.1), a / (2.0 * PI));
                            c_col += trackCol * mainTrack * 3.0; 
                            float cometGlow = exp(-10.0 * headDist) * exp(-12.0 * abs(r - 6.25));
                            c_col += vec3(1.0, 0.98, 0.8) * cometGlow * 15.0;
                            float crossFlare = exp(-25.0 * abs(r - 6.25)) * exp(-2.0 * headDist);
                            c_col += vec3(1.0, 0.8, 0.3) * crossFlare * 5.0;
                            c_col += vec3(1.0, 0.95, 0.7) * innerRipple * (1.0 - headDist) * 3.0;
                        }
                        
                        vec3 finalCol = mixT(n_col, c_col);
                        float finalAlpha = mixT(n_alpha, max(c_alpha, mainTrack));
                        
                        float opticalDepth = clamp(0.22 / (abs(rd.y) + 0.01), 0.7, 4.5);
                        return vec4(finalCol * opticalDepth, clamp(finalAlpha, 0.0, 1.0));
                    }
                }
                return vec4(0.0);
            }

            void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                vec2 base_uv = (-iResolution.xy + 2.0 * fragCoord.xy) / iResolution.y;
                
                float theta = uCamParams.x, phi = uCamParams.y, radius = uCamParams.z;
                vec3 ro = vec3(radius * sin(phi) * cos(theta), radius * cos(phi), radius * sin(phi) * sin(theta));
                mat3 cam = calcLookAtMatrix(ro, vec3(0.0));
                
                vec2 bg_uv = base_uv - vec2(0.6, 0.0);
                vec3 rd_bg = cam * normalize(vec3(bg_uv, 2.2));

                vec3 skyTopDef = vec3(0.04, 0.08, 0.15); vec3 skyTopPurple = vec3(0.04, 0.02, 0.10); vec3 skyTopPink = vec3(0.08, 0.03, 0.10);
                vec3 skyTopNormal = mix(skyTopDef, skyTopPurple, uCoursePhase);
                skyTopNormal = mix(skyTopNormal, skyTopPink, uCourse02Phase);
                vec3 skyTop = mix(skyTopNormal, vec3(0.15, 0.02, 0.2), uThemeBlend);    
                vec3 skyBottomDef = vec3(0.92, 0.70, 0.18); vec3 skyBottomPurple = vec3(0.20, 0.06, 0.30); vec3 skyBottomPink = vec3(0.45, 0.18, 0.32);
                vec3 skyBottomNormal = mix(skyBottomDef, skyBottomPurple, uCoursePhase);
                skyBottomNormal = mix(skyBottomNormal, skyBottomPink, uCourse02Phase);
                vec3 skyBottom = mix(skyBottomNormal, vec3(0.8, 0.3, 0.2), uThemeBlend);  
                vec3 col = mix(skyBottom, skyTop, smoothstep(-0.4, mixT(0.15, 0.6), rd_bg.y));
                
                float stars = hash12(rd_bg.xy * 100.0, 1.0);
                col += mixT(vec3(1.0), vec3(1.0, 0.9, 0.8)) * smoothstep(0.99, 1.0, stars) * (1.0 - smoothstep(mixT(-0.3, -0.2), mixT(0.3, 0.5), rd_bg.y));

                float sunGlow = max(0.0, dot(rd_bg, SUN_DIR));
                col += mixT(vec3(1.0, 0.9, 0.6), vec3(1.0, 0.85, 0.6)) * pow(sunGlow, 800.0) * 3.0; 
                col += mixT(vec3(1.0, 0.7, 0.2), vec3(1.0, 0.5, 0.3)) * pow(sunGlow, 30.0) * 1.5;     
                col += mixT(vec3(0.8, 0.4, 0.0), vec3(0.8, 0.2, 0.4)) * pow(sunGlow, 10.0) * 0.5;

                float skyAlpha = 1.0 - smoothstep(1.0, 1.2, uCamZoom);
                vec4 scene = vec4(col * skyAlpha, skyAlpha);

                vec2 uv_obj = (base_uv - uScreenOffset) * uCamZoom;
                vec3 rd_obj = cam * normalize(vec3(uv_obj, 2.2));
                
                // ★ 遮罩过渡逻辑已彻底重写
                float pipProgress = clamp((uCamZoom - 1.0) / 5.3, 0.0, 1.0);
                float maskScale = mix(0.001, 8.7, pow(pipProgress, 2.0));      
                float pipDist = length(base_uv - uScreenOffset) * maskScale;   
                float pipMask = 1.0 - smoothstep(2.0, 2.05, pipDist);
                float blendMask = mix(pipMask, 1.0, 1.0 - pipProgress);

                if (pipMask > 0.0) {
                    vec3 atmo = calcAtmosphere(ro, rd_obj, SUN_DIR);
                    scene.rgb += atmo * blendMask;
                    scene.a = max(scene.a, min(1.0, length(atmo)) * blendMask);

                    float t_solid = MAX_DIST, t = 0.0;
                    SdfCtx ray;
                    for(int i=0; i<80; i++) {
                        ray = mapSolids(ro + rd_obj * t);
                        if(ray.d < 0.001) { t_solid = t; break; }
                        if(t > MAX_DIST) break;
                        t += ray.d;
                    }

                    if (t_solid < MAX_DIST) {
                        vec3 p = ro + rd_obj * t_solid, n = calcNormal(p), l = SUN_DIR;
                        float diff = max(dot(n, l), 0.0), shadow = getShadow(p, l);
                        vec3 objCol = vec3(0.0);
                        
                        if (ray.k == 1.0) { 
                            vec3 normLocal = rotateY((uProgress + uIdleRotation) * 29.53 * 2.0 * PI) * n;
                            vec2 muv = vec2(atan(normLocal.z, normLocal.x) * 0.5, acos(clamp(-normLocal.y, -1.0, 1.0))) / PI;
                            
                            float continent = fbm7(muv, 4.0);
                            float temp = fbm4(muv * 3.0 + vec2(31.33), 1.0);
                            float humid = fbm4(muv * 3.0 - vec2(54.1), 1.0);

                            float sqrt_continent = sqrt(continent);
                            float f = 0.01; 
                            float land = smoothstep(f, 0.0, OCEAN_SIZE - continent);
                            
                            vec3 earthCol = LAND_COLOR;
                            float desert = smoothstep(0.25, 0.1, humid);
                            earthCol = mix(earthCol, DESERT_COLOR, desert);
                            
                            float jungle = smoothstep(0.1, 0.3, humid) * smoothstep(0.3, 0.4, temp);
                            earthCol = mix(earthCol, JUNGLE_COLOR, jungle);
                            
                            float snow = smoothstep(0.3, 0.2, temp);
                            earthCol = mix(earthCol, SNOW_COLOR, snow);
                            
                            earthCol *= sqrt_continent * land * 1.2 * smoothstep(1.0, 0.99, abs(normLocal.y));
                            
                            float ocean = smoothstep(OCEAN_SIZE, OCEAN_SIZE - f, continent);
                            earthCol += (1.0 - continent) * ocean * OCEAN_COLOR;
                            
                            float texMix = sqrt(1.0 + 0.1 * cos(sqrt(continent) * 512.0));
                            earthCol.rgb *= texMix;

                            float clouds = swirly_fbm6(-muv, 11.0) * smoothstep(1.0, 0.99, abs(normLocal.y));
                            clouds = exp(-pow(clouds, 6.0) * 32.0);
                            float cloudSunDot = dot(n, l);
                            vec3 cloudColorTint = mix(CLOUD_COLOR, mixT(vec3(1.0, 0.8, 0.4), vec3(1.0, 0.5, 0.4)), smoothstep(-0.2, 0.2, cloudSunDot) * smoothstep(0.5, 0.1, cloudSunDot));
                            earthCol = mix(earthCol, cloudColorTint, clouds);

                            if (diff > 0.0) {
                                objCol = earthCol * pow(diff, 0.7) * 3.0 * SUN_COLOR; 
                            } else {
                                float backLight = max(0.0, dot(n, vec3(-l.x, -l.y, -l.z))); 
                                objCol = vec3(0.005, 0.01, 0.02) * earthCol * backLight;
                                
                                float cityLights = fbm4(normLocal.xy * 15.0 + 100.0, 10.0);
                                float cityThreshold = smoothstep(0.75, 0.95, cityLights) * land; 
                                vec3 nightLights = mix(mixT(vec3(0.4, 0.8, 1.0), vec3(0.2, 0.8, 1.0)), mixT(vec3(1.0, 0.7, 0.2), vec3(1.0, 0.4, 0.8)), hash12(normLocal.xy, 10.0));
                                objCol += nightLights * cityThreshold * 3.0; 
                            }

                            float fresnel = 1.0 - max(dot(n, -rd_obj), 0.0);
                            float innerSunDot = dot(n, l);
                            float innerIllum = smoothstep(-0.4, 0.3, innerSunDot);
                            float innerSunset = smoothstep(-0.5, 0.1, innerSunDot) * smoothstep(0.3, -0.2, innerSunDot);
                            
                            vec3 surfaceAtmo = mix(vec3(0.1, 0.5, 1.0), vec3(1.0, 0.6, 0.1), innerSunset * 1.5) * pow(fresnel, 3.0) * innerIllum;
                            float nightFresnel = pow(fresnel, 5.0) * smoothstep(0.0, -0.8, innerSunDot);
                            surfaceAtmo += vec3(0.02, 0.05, 0.2) * nightFresnel * 0.8;

                            objCol += surfaceAtmo;
                            
                        } else if (ray.k == 3.0) { 
                            float curPhase = mod(uProgress + uIdleRotation, 1.0);
                            mat3 rotMoon = rotateY(curPhase * 2.0 * PI); vec3 normLocal = rotMoon * n;
                            vec2 muv = vec2(atan(normLocal.z, normLocal.x) * 0.5, acos(clamp(-normLocal.y, -1.0, 1.0))) / PI;
                            
                            float eclipseFactor = smoothstep(0.48, 0.50, curPhase) * (1.0 - smoothstep(0.50, 0.52, curPhase));
                            
                            vec3 finalSunCol = mix(SUN_COLOR, mixT(vec3(1.0, 0.6, 0.2), vec3(1.0, 0.3, 0.6)), eclipseFactor * 0.9); 
                            float eclipseShadow = mix(shadow, 0.2, eclipseFactor * 0.8); 
                            
                            float craters_base = crater_fbm(muv) * 0.95; 
                            objCol = craters_base * vec3(0.85, 0.88, 0.9) * pow(diff, 0.7) * eclipseShadow * 3.0 * finalSunCol; 
                            objCol += craters_base * vec3(0.05, 0.08, 0.1) * max(0.0, dot(n, vec3(-l.x, -l.y, -l.z))) * 0.3 * (1.0 - shadow); 
                        }
                        scene.rgb = mix(scene.rgb, objCol, blendMask);
                        scene.a = max(scene.a, blendMask);
                    } 

                    vec4 ringData = calcOrbitalRing(ro, rd_obj, t_solid);
                    scene.rgb = mix(scene.rgb, ringData.rgb, ringData.a * blendMask);
                    scene.a = max(scene.a, ringData.a * blendMask);
                }

                scene.rgb = clamp(scene.rgb, 0.0, 1.0);
                scene.rgb = scene.rgb * (2.51 * scene.rgb + 0.03) / (scene.rgb * (2.43 * scene.rgb + 0.59) + 0.14);
                scene.rgb = mix(scene.rgb, scene.rgb * vec3(1.0, 0.95, 1.05), 0.3);
                
                scene.rgb += mix(-1.0/255.0, 1.0/255.0, fract(sin(dot(fragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453));
                float finalAlpha = mix(1.0, scene.a, smoothstep(1.0, 1.2, uCamZoom));
                fragColor = vec4(scene.rgb * finalAlpha, finalAlpha);
            }

            void main() { 
                vec4 c;
                mainImage(c, gl_FragCoord.xy); 
                gl_FragColor = c;
            }
        `;

        const shaderProgramMain = glContext.createProgram();
        const vsMain = MoonApp.loadShader(glContext, glContext.VERTEX_SHADER, vsSourceMain);
        const fsMain = MoonApp.loadShader(glContext, glContext.FRAGMENT_SHADER, fsSourceMain);
        glContext.attachShader(shaderProgramMain, vsMain);
        glContext.attachShader(shaderProgramMain, fsMain);
        glContext.linkProgram(shaderProgramMain);
        glContext.useProgram(shaderProgramMain);

        const positionBufferMain = glContext.createBuffer();
        glContext.bindBuffer(glContext.ARRAY_BUFFER, positionBufferMain);
        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array([-1,1, -1,-1, 1,1, 1,-1]), glContext.STATIC_DRAW);

        const vertexPositionMain = glContext.getAttribLocation(shaderProgramMain, 'aVertexPosition');
        glContext.enableVertexAttribArray(vertexPositionMain);
        glContext.vertexAttribPointer(vertexPositionMain, 2, glContext.FLOAT, false, 0, 0);

        const locRes = glContext.getUniformLocation(shaderProgramMain, "iResolution");
        const locCam = glContext.getUniformLocation(shaderProgramMain, "uCamParams");
        const locProgress = glContext.getUniformLocation(shaderProgramMain, "uProgress");
        const locTime = glContext.getUniformLocation(shaderProgramMain, "uTime");
        const locOffset = glContext.getUniformLocation(shaderProgramMain, "uScreenOffset");
        const locZoom = glContext.getUniformLocation(shaderProgramMain, "uCamZoom");
        const locIdleRotation = glContext.getUniformLocation(shaderProgramMain, "uIdleRotation");
        const locThemeBlend = glContext.getUniformLocation(shaderProgramMain, "uThemeBlend");
        const locCoursePhase = glContext.getUniformLocation(shaderProgramMain, "uCoursePhase");
        const locCourse02Phase = glContext.getUniformLocation(shaderProgramMain, "uCourse02Phase");
  return {
    gl: glContext,
    program: shaderProgramMain,
    canvas: glCanvas,
    locs: {
      res: locRes,
      cam: locCam,
      progress: locProgress,
      time: locTime,
      offset: locOffset,
      zoom: locZoom,
      idleRotation: locIdleRotation,
      themeBlend: locThemeBlend,
      coursePhase: locCoursePhase,
      course02Phase: locCourse02Phase
    },
    vertexPosition: vertexPositionMain
  };
};

// ====== main.js ======
var MoonApp = MoonApp || {};

MoonApp.ensureCourse03Scene = function(index) {
  var didInit = false;
  if (index === 0) {
    if (!MoonApp.cityCtx) { MoonApp.cityCtx = MoonApp.initCityShader(); didInit = true; }
    if (!MoonApp.moonCtx) { MoonApp.moonCtx = MoonApp.initMoonShader(); didInit = true; }
  } else if (index === 1) {
    if (!MoonApp.bridgeCtx) { MoonApp.bridgeCtx = MoonApp.initPenumbralBridge(); didInit = true; }
    if (!MoonApp.penumbralMoonCtx) { MoonApp.penumbralMoonCtx = MoonApp.initPenumbralMoon(); didInit = true; }
  } else if (index === 2) {
    if (!MoonApp.totalCityCtx) { MoonApp.totalCityCtx = MoonApp.initTotalCityPipeline(); didInit = true; }
    if (!MoonApp.totalMoonCtx) { MoonApp.totalMoonCtx = MoonApp.initTotalMoonShader(); didInit = true; }
  }
  if (didInit) MoonApp.resize();
};

MoonApp.resize = function() {
  if (!MoonApp.orbiter) return;
if (MoonApp.orbiter.canvas.width !== window.innerWidth || MoonApp.orbiter.canvas.height !== window.innerHeight) {
                MoonApp.orbiter.canvas.width = window.innerWidth; MoonApp.orbiter.canvas.height = window.innerHeight;
            }
            const quality = 0.8; 
            
            if (MoonApp.cityCtx) {
                MoonApp.cityCtx.canvas.width = Math.floor(window.innerWidth * quality);
                MoonApp.cityCtx.canvas.height = Math.floor(window.innerHeight * quality);
                MoonApp.cityCtx.gl.viewport(0, 0, MoonApp.cityCtx.canvas.width, MoonApp.cityCtx.canvas.height);
            }
            if (MoonApp.moonCtx) {
                const rect = MoonApp.moonCtx.canvas.parentElement.getBoundingClientRect();
                MoonApp.moonCtx.canvas.width = Math.floor(rect.width * quality); 
                MoonApp.moonCtx.canvas.height = Math.floor(rect.height * quality); 
                MoonApp.moonCtx.gl.viewport(0, 0, MoonApp.moonCtx.canvas.width, MoonApp.moonCtx.canvas.height);
            }
            
            if (MoonApp.bridgeCtx) {
                MoonApp.bridgeCtx.canvas.width = Math.floor(window.innerWidth * quality);
                MoonApp.bridgeCtx.canvas.height = Math.floor(window.innerHeight * quality);
                MoonApp.bridgeCtx.gl.viewport(0, 0, MoonApp.bridgeCtx.canvas.width, MoonApp.bridgeCtx.canvas.height);
            }
            if (MoonApp.penumbralMoonCtx) {
                const rect = MoonApp.penumbralMoonCtx.canvas.parentElement.getBoundingClientRect();
                MoonApp.penumbralMoonCtx.canvas.width = Math.floor(rect.width * quality); 
                MoonApp.penumbralMoonCtx.canvas.height = Math.floor(rect.height * quality); 
                MoonApp.penumbralMoonCtx.gl.viewport(0, 0, MoonApp.penumbralMoonCtx.canvas.width, MoonApp.penumbralMoonCtx.canvas.height);
            }

            if (MoonApp.totalCityCtx) {
                const parent = MoonApp.totalCityCtx.canvas.parentElement;
                const cw = parent.clientWidth; const ch = parent.clientHeight;
                MoonApp.totalCityCtx.canvas.width = cw; MoonApp.totalCityCtx.canvas.height = ch;
                
                if(MoonApp.totalCityCtx.fbo) MoonApp.totalCityCtx.gl.deleteFramebuffer(MoonApp.totalCityCtx.fbo);
                if(MoonApp.totalCityCtx.texture) MoonApp.totalCityCtx.gl.deleteTexture(MoonApp.totalCityCtx.texture);
                const rt = MoonApp.createFBO(MoonApp.totalCityCtx.gl, cw, ch);
                MoonApp.totalCityCtx.fbo = rt.fbo; MoonApp.totalCityCtx.texture = rt.tex;
            }
            if (MoonApp.totalMoonCtx) {
                const rect = MoonApp.totalMoonCtx.canvas.parentElement.getBoundingClientRect();
                MoonApp.totalMoonCtx.canvas.width = Math.floor(rect.width * quality); 
                MoonApp.totalMoonCtx.canvas.height = Math.floor(rect.height * quality); 
                MoonApp.totalMoonCtx.gl.viewport(0, 0, MoonApp.totalMoonCtx.canvas.width, MoonApp.totalMoonCtx.canvas.height);
            }
};

MoonApp.render = function(now) {
const percText = document.getElementById('perc-text');
let elapsed = (now - MoonApp.state.startTime) / 1000.0;
            MoonApp.state.currentProgress += (MoonApp.state.targetProgress - MoonApp.state.currentProgress) * 0.05;
            MoonApp.state.currentThemeBlend += (MoonApp.state.targetThemeBlend - MoonApp.state.currentThemeBlend) * 0.05;
            MoonApp.state.currentCoursePhase += (MoonApp.state.targetCoursePhase - MoonApp.state.currentCoursePhase) * 0.05;
            MoonApp.state.currentCourse02Phase += (MoonApp.state.targetCourse02Phase - MoonApp.state.currentCourse02Phase) * 0.05;
            if (Math.abs(MoonApp.state.targetProgress - MoonApp.state.currentProgress) < 0.001) MoonApp.state.currentProgress = MoonApp.state.targetProgress;

            // ★ Course 01: 自动触发 Prologue
            if (MoonApp.state.pendingPrologue && Math.abs(MoonApp.state.currentProgress - MoonApp.state.targetProgress) < 0.005) {
                MoonApp.state.pendingPrologue = false; MoonApp.state.isPrologueActive = true;
                document.getElementById('interaction-layer').style.pointerEvents = 'none';
                document.getElementById('prologue-layer').style.opacity = '1';
                document.getElementById('prologue-layer').style.pointerEvents = 'auto';
                document.getElementById('lab-ui-container').classList.add('ui-hidden');
                document.getElementById('text-svg-layer').style.opacity = '0';
                if (!MoonApp.state.isThumbnail) MoonApp.toggleMini();
                MoonApp.prologue.start();
            }

            let targetZoom = 1.0, targetOffsetX = 0.6, targetOffsetY = 0.0;

            // ★ Course 02: 等进度条到位 → 缩略图 → zoom稳定 → 弹视频
            if (MoonApp.state.pendingVideo && !MoonApp.state.isThumbnail && Math.abs(MoonApp.state.currentProgress - MoonApp.state.targetProgress) < 0.005) MoonApp.toggleMini();
            
            if (MoonApp.state.isThumbnail) {
                const hitbox = document.getElementById('thumbnail-hitbox');
                const rect = hitbox.getBoundingClientRect();
                const pipX = rect.left + rect.width / 2;
                const pipY = rect.top + rect.height / 2;
                targetOffsetX = (2.0 * pipX - MoonApp.orbiter.canvas.width) / MoonApp.orbiter.canvas.height;
                targetOffsetY = -(2.0 * pipY - MoonApp.orbiter.canvas.height) / MoonApp.orbiter.canvas.height;
                targetZoom = (2.0 * MoonApp.orbiter.canvas.height) / (rect.width * 1.38); 
                MoonApp.state.idleRotation += 0.0005; 
            } else {
                MoonApp.state.idleRotation += (0.0 - MoonApp.state.idleRotation) * 0.06; 
            }

            // ★ 缩略图到位后弹出视频
            if (MoonApp.state.pendingVideo && MoonApp.state.isThumbnail && Math.abs(MoonApp.state.currentZoom - targetZoom) < 0.03) {
                MoonApp.state.pendingVideo = false;
                MoonApp.openVideo();
            }
            
            MoonApp.state.currentZoom += (targetZoom - MoonApp.state.currentZoom) * 0.06;
            MoonApp.state.currentOffsetX += (targetOffsetX - MoonApp.state.currentOffsetX) * 0.06;
            MoonApp.state.currentOffsetY += (targetOffsetY - MoonApp.state.currentOffsetY) * 0.06;

            if (Math.abs(targetZoom - MoonApp.state.currentZoom) < 0.005) MoonApp.state.currentZoom = targetZoom;
            if (Math.abs(targetOffsetX - MoonApp.state.currentOffsetX) < 0.005) MoonApp.state.currentOffsetX = targetOffsetX;
            if (Math.abs(targetOffsetY - MoonApp.state.currentOffsetY) < 0.005) MoonApp.state.currentOffsetY = targetOffsetY;

            percText.innerHTML = (MoonApp.state.currentProgress*100).toFixed(1) + "<span>Phase</span>";
            percText.style.color = '';
            MoonApp.updateDynamicPanel(MoonApp.state.currentProgress);

            let pathLen = MoonApp.updateTextArc(MoonApp.state.currentProgress);
            const arcTextEl = document.querySelector('#text-svg-layer .arc-text');
            if (pathLen > 0 && !MoonApp.state.isThumbnail) {
                const textStr = document.getElementById('text-path-el').textContent;
                const charCount = textStr.length > 0 ? textStr.length : 20;
                let dynamicFontSize = Math.max(3, (pathLen / charCount) * 1.25); 
                arcTextEl.style.fontSize = dynamicFontSize + 'px';
                arcTextEl.style.letterSpacing = (dynamicFontSize * 0.15) + 'px';
                arcTextEl.style.strokeWidth = Math.max(1, dynamicFontSize * 0.2) + 'px';
                arcTextEl.style.opacity = pathLen < 120 ? (pathLen / 120) : 1;
            } else {
                arcTextEl.style.opacity = 0;
            }

            if (!MoonApp.state.isThumbnail && !MoonApp.state.autoMiniTriggered && Math.abs(MoonApp.state.currentProgress - MoonApp.state.targetProgress) < 0.005) {
                MoonApp.state.autoMiniTriggered = true; 
                setTimeout(() => { if (!MoonApp.state.isThumbnail && Math.abs(MoonApp.state.currentProgress - MoonApp.state.targetProgress) < 0.02) MoonApp.toggleMini(); }, 1200); 
            }

            MoonApp.orbiter.gl.viewport(0, 0, MoonApp.orbiter.gl.canvas.width, MoonApp.orbiter.gl.canvas.height);
            MoonApp.orbiter.gl.clearColor(0, 0, 0, 0); 
            MoonApp.orbiter.gl.clear(MoonApp.orbiter.gl.COLOR_BUFFER_BIT);

            MoonApp.orbiter.gl.uniform3f(MoonApp.orbiter.locs.res, MoonApp.orbiter.gl.canvas.width, MoonApp.orbiter.gl.canvas.height, 1.0);
            MoonApp.orbiter.gl.uniform3f(MoonApp.orbiter.locs.cam, MoonApp.state.camTheta, MoonApp.state.camPhi, MoonApp.state.camRadius);
            let safeShaderProgress = MoonApp.state.currentProgress > 0.0 ? Math.max(0.0, MoonApp.state.currentProgress - 0.001) : 0.0;
            MoonApp.orbiter.gl.uniform1f(MoonApp.orbiter.locs.progress, safeShaderProgress); 
            MoonApp.orbiter.gl.uniform1f(MoonApp.orbiter.locs.time, elapsed);
            MoonApp.orbiter.gl.uniform2f(MoonApp.orbiter.locs.offset, MoonApp.state.currentOffsetX, MoonApp.state.currentOffsetY);
            MoonApp.orbiter.gl.uniform1f(MoonApp.orbiter.locs.zoom, MoonApp.state.currentZoom);
            MoonApp.orbiter.gl.uniform1f(MoonApp.orbiter.locs.idleRotation, MoonApp.state.idleRotation);
            MoonApp.orbiter.gl.uniform1f(MoonApp.orbiter.locs.themeBlend, MoonApp.state.currentThemeBlend);
            MoonApp.orbiter.gl.uniform1f(MoonApp.orbiter.locs.coursePhase, MoonApp.state.currentCoursePhase);
            MoonApp.orbiter.gl.uniform1f(MoonApp.orbiter.locs.course02Phase, MoonApp.state.currentCourse02Phase);
            MoonApp.orbiter.gl.drawArrays(MoonApp.orbiter.gl.TRIANGLE_STRIP, 0, 4);

            const c3Scene = document.getElementById('course-03-scene');
            const penumbralScene = document.getElementById('subpage-penumbral-scene');
            const totalScene = document.getElementById('subpage-total-scene');

            let inCourse03 = (MoonApp.state.currentProgress > 0.62 && MoonApp.state.currentProgress < 0.88) && MoonApp.state.isThumbnail;
            
            let showC3 = inCourse03 && MoonApp.state.c3SubPage === 0;
            let showPenumbral = inCourse03 && MoonApp.state.c3SubPage === 1;
            let showTotal = inCourse03 && MoonApp.state.c3SubPage === 2;

            c3Scene.style.opacity = showC3 ? '1' : '0';
            penumbralScene.style.opacity = showPenumbral ? '1' : '0';
            totalScene.style.opacity = showTotal ? '1' : '0';

            if (inCourse03) {
                MoonApp.ensureCourse03Scene(MoonApp.state.c3SubPage);
            }

            if (showC3) {
                const cycle = elapsed % 32.0; 
                const Y_OFFSET = 3.3; 
                const X_FIRST_CONTACT = 6.0; 
                const X_MAX_ECLIPSE = 0.0;   
                const X_LAST_CONTACT = -6.0; 

                let cityX = 0.0; let cityImpact = 0.0; let activePhase3 = -1;
                if (cycle < 4.0) { cityX = MoonApp.lerp(8.5, X_FIRST_CONTACT, MoonApp.smoothstep(0, 4, cycle));
                } else if (cycle < 8.0) { cityX = X_FIRST_CONTACT; activePhase3 = 0; cityImpact = Math.exp(-4.0 * (cycle - 4.0)); 
                } else if (cycle < 12.0) { cityX = MoonApp.lerp(X_FIRST_CONTACT, X_MAX_ECLIPSE, MoonApp.smoothstep(8, 12, cycle));
                } else if (cycle < 16.0) { cityX = X_MAX_ECLIPSE; activePhase3 = 1; cityImpact = Math.exp(-4.0 * (cycle - 12.0)); 
                } else if (cycle < 20.0) { cityX = MoonApp.lerp(X_MAX_ECLIPSE, X_LAST_CONTACT, MoonApp.smoothstep(16, 20, cycle));
                } else if (cycle < 24.0) { cityX = X_LAST_CONTACT; activePhase3 = 2; cityImpact = Math.exp(-4.0 * (cycle - 20.0)); 
                } else { cityX = MoonApp.lerp(X_LAST_CONTACT, -8.5, MoonApp.smoothstep(24, 28, cycle)); }
                
                document.getElementById('phase-0').className = activePhase3 === 0 ? 'phase-label active' : 'phase-label';
                document.getElementById('phase-1').className = activePhase3 === 1 ? 'phase-label active' : 'phase-label';
                document.getElementById('phase-2').className = activePhase3 === 2 ? 'phase-label active' : 'phase-label';

                if (MoonApp.cityCtx) {
                    MoonApp.cityCtx.gl.useProgram(MoonApp.cityCtx.program);
                    MoonApp.cityCtx.gl.uniform3f(MoonApp.cityCtx.locs.res, MoonApp.cityCtx.canvas.width, MoonApp.cityCtx.canvas.height, 1.0);
                    MoonApp.cityCtx.gl.uniform1f(MoonApp.cityCtx.locs.time, elapsed);
                    MoonApp.cityCtx.gl.uniform4f(MoonApp.cityCtx.locs.mouse, MoonApp.state.mouseX, MoonApp.state.mouseY, 0.0, 0.0);
                    MoonApp.cityCtx.gl.drawArrays(MoonApp.cityCtx.gl.TRIANGLES, 0, 6);
                }

                if (MoonApp.moonCtx) {
                    MoonApp.moonCtx.gl.clearColor(0.0, 0.0, 0.0, 0.0);
                    MoonApp.moonCtx.gl.clear(MoonApp.moonCtx.gl.COLOR_BUFFER_BIT);
                    MoonApp.moonCtx.gl.useProgram(MoonApp.moonCtx.program);
                    MoonApp.moonCtx.gl.uniform3f(MoonApp.moonCtx.locs.res, MoonApp.moonCtx.canvas.width, MoonApp.moonCtx.canvas.height, 1.0);
                    MoonApp.moonCtx.gl.uniform1f(MoonApp.moonCtx.locs.time, elapsed);
                    MoonApp.moonCtx.gl.uniform2f(MoonApp.moonCtx.locs.shadow, cityX, Y_OFFSET);
                    MoonApp.moonCtx.gl.uniform1f(MoonApp.moonCtx.locs.impact, cityImpact);
                    MoonApp.moonCtx.gl.drawArrays(MoonApp.moonCtx.gl.TRIANGLES, 0, 6);
                }
            }

            if (showPenumbral) {
                const cycle = elapsed % 32.0; 
                const Y_OFFSET = -5.8; 
                
                const X_FIRST_CONTACT = 8.0; 
                const X_MAX_ECLIPSE = 0.0;   
                const X_LAST_CONTACT = -8.0; 

                let currentX = 0.0; let impact = 0.0; let activePhase = -1;

                if (cycle < 4.0) { currentX = MoonApp.lerp(10.5, X_FIRST_CONTACT, MoonApp.smoothstep(0, 4, cycle));
                } else if (cycle < 8.0) { currentX = X_FIRST_CONTACT; activePhase = 0; impact = Math.exp(-4.0 * (cycle - 4.0)); 
                } else if (cycle < 12.0) { currentX = MoonApp.lerp(X_FIRST_CONTACT, X_MAX_ECLIPSE, MoonApp.smoothstep(8, 12, cycle));
                } else if (cycle < 16.0) { currentX = X_MAX_ECLIPSE; activePhase = 1; impact = Math.exp(-4.0 * (cycle - 12.0)); 
                } else if (cycle < 20.0) { currentX = MoonApp.lerp(X_MAX_ECLIPSE, X_LAST_CONTACT, MoonApp.smoothstep(16, 20, cycle));
                } else if (cycle < 24.0) { currentX = X_LAST_CONTACT; activePhase = 2; impact = Math.exp(-4.0 * (cycle - 20.0)); 
                } else { currentX = MoonApp.lerp(X_LAST_CONTACT, -10.5, MoonApp.smoothstep(24, 28, cycle)); }

                document.getElementById('c4-phase-0').className = activePhase === 0 ? 'phase-label active' : 'phase-label';
                document.getElementById('c4-phase-1').className = activePhase === 1 ? 'phase-label active' : 'phase-label';
                document.getElementById('c4-phase-2').className = activePhase === 2 ? 'phase-label active' : 'phase-label';

                if (MoonApp.bridgeCtx) {
                    MoonApp.bridgeCtx.gl.useProgram(MoonApp.bridgeCtx.program);
                    MoonApp.bridgeCtx.gl.uniform3f(MoonApp.bridgeCtx.locs.res, MoonApp.bridgeCtx.canvas.width, MoonApp.bridgeCtx.canvas.height, 1.0);
                    MoonApp.bridgeCtx.gl.uniform1f(MoonApp.bridgeCtx.locs.time, elapsed);
                    MoonApp.bridgeCtx.gl.uniform4f(MoonApp.bridgeCtx.locs.mouse, MoonApp.state.mouseX, MoonApp.state.mouseY, 0.0, 0.0);
                    MoonApp.bridgeCtx.gl.uniform1f(MoonApp.bridgeCtx.locs.impact, impact); 
                    MoonApp.bridgeCtx.gl.uniform2f(MoonApp.bridgeCtx.locs.shadow, currentX, Y_OFFSET); 
                    MoonApp.bridgeCtx.gl.drawArrays(MoonApp.bridgeCtx.gl.TRIANGLES, 0, 6);
                }

                if (MoonApp.penumbralMoonCtx) {
                    MoonApp.penumbralMoonCtx.gl.clearColor(0.0, 0.0, 0.0, 0.0);
                    MoonApp.penumbralMoonCtx.gl.clear(MoonApp.penumbralMoonCtx.gl.COLOR_BUFFER_BIT);
                    MoonApp.penumbralMoonCtx.gl.useProgram(MoonApp.penumbralMoonCtx.program);
                    MoonApp.penumbralMoonCtx.gl.uniform3f(MoonApp.penumbralMoonCtx.locs.res, MoonApp.penumbralMoonCtx.canvas.width, MoonApp.penumbralMoonCtx.canvas.height, 1.0);
                    MoonApp.penumbralMoonCtx.gl.uniform1f(MoonApp.penumbralMoonCtx.locs.time, elapsed);
                    MoonApp.penumbralMoonCtx.gl.uniform2f(MoonApp.penumbralMoonCtx.locs.shadow, currentX, Y_OFFSET);
                    MoonApp.penumbralMoonCtx.gl.uniform1f(MoonApp.penumbralMoonCtx.locs.impact, impact);
                    MoonApp.penumbralMoonCtx.gl.drawArrays(MoonApp.penumbralMoonCtx.gl.TRIANGLES, 0, 6);
                }
            }

            if (showTotal) {
                const cycle = elapsed % 32.0; 
                const Y_OFFSET = 0.0; 
                const X_FIRST_CONTACT = 6.5; 
                const X_MAX_ECLIPSE = 0.0;   
                const X_LAST_CONTACT = -6.5; 

                let currentX = 0.0; let impact = 0.0; let activePhase = -1;
                let eclipseFactor = 0.0; let redShift = 0.0;

                if (cycle < 4.0) { currentX = MoonApp.lerp(8.5, X_FIRST_CONTACT, MoonApp.smoothstep(0, 4, cycle));
                } else if (cycle < 8.0) { currentX = X_FIRST_CONTACT; activePhase = 0; impact = Math.exp(-4.0 * (cycle - 4.0)); 
                } else if (cycle < 12.0) { currentX = MoonApp.lerp(X_FIRST_CONTACT, X_MAX_ECLIPSE, MoonApp.smoothstep(8, 12, cycle));
                } else if (cycle < 16.0) { currentX = X_MAX_ECLIPSE; activePhase = 1; impact = Math.exp(-4.0 * (cycle - 12.0)); 
                } else if (cycle < 20.0) { currentX = MoonApp.lerp(X_MAX_ECLIPSE, X_LAST_CONTACT, MoonApp.smoothstep(16, 20, cycle));
                } else if (cycle < 24.0) { currentX = X_LAST_CONTACT; activePhase = 2; impact = Math.exp(-4.0 * (cycle - 20.0)); 
                } else { currentX = MoonApp.lerp(X_LAST_CONTACT, -8.5, MoonApp.smoothstep(24, 28, cycle)); }

                if (cycle > 4.0 && cycle <= 10.0) eclipseFactor = MoonApp.smoothstep(4.0, 10.0, cycle);
                else if (cycle > 10.0 && cycle <= 20.0) eclipseFactor = 1.0;
                else if (cycle > 20.0 && cycle <= 24.0) eclipseFactor = 1.0 - MoonApp.smoothstep(20.0, 24.0, cycle);
                
                if (cycle > 10.0 && cycle <= 14.0) redShift = MoonApp.smoothstep(10.0, 14.0, cycle);
                else if (cycle > 14.0 && cycle <= 16.0) redShift = 1.0;
                else if (cycle > 16.0 && cycle <= 18.0) redShift = 1.0 - MoonApp.smoothstep(16.0, 18.0, cycle);

                document.getElementById('c3-3-phase-0').className = activePhase === 0 ? 'phase-label active' : 'phase-label';
                document.getElementById('c3-3-phase-1').className = activePhase === 1 ? 'phase-label active' : 'phase-label';
                document.getElementById('c3-3-phase-2').className = activePhase === 2 ? 'phase-label active' : 'phase-label';

                if (MoonApp.totalCityCtx && MoonApp.totalCityCtx.fbo) {
                    const gl = MoonApp.totalCityCtx.gl;
                    gl.bindFramebuffer(gl.FRAMEBUFFER, MoonApp.totalCityCtx.fbo);
                    gl.viewport(0, 0, MoonApp.totalCityCtx.canvas.width, MoonApp.totalCityCtx.canvas.height);
                    gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);

                    gl.useProgram(MoonApp.totalCityCtx.programBufferA);
                    gl.enableVertexAttribArray(MoonApp.totalCityCtx.locsA.pos);
                    gl.vertexAttribPointer(MoonApp.totalCityCtx.locsA.pos, 2, gl.FLOAT, false, 0, 0);
                    gl.uniform3f(MoonApp.totalCityCtx.locsA.res, MoonApp.totalCityCtx.canvas.width, MoonApp.totalCityCtx.canvas.height, 1.0);
                    gl.uniform1f(MoonApp.totalCityCtx.locsA.time, elapsed);
                    gl.uniform2f(MoonApp.totalCityCtx.locsA.eclipse, eclipseFactor, redShift);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);

                    gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
                    gl.viewport(0, 0, MoonApp.totalCityCtx.canvas.width, MoonApp.totalCityCtx.canvas.height);
                    gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);

                    gl.useProgram(MoonApp.totalCityCtx.programImage);
                    gl.enableVertexAttribArray(MoonApp.totalCityCtx.locsImg.pos);
                    gl.vertexAttribPointer(MoonApp.totalCityCtx.locsImg.pos, 2, gl.FLOAT, false, 0, 0);
                    gl.uniform3f(MoonApp.totalCityCtx.locsImg.res, MoonApp.totalCityCtx.canvas.width, MoonApp.totalCityCtx.canvas.height, 1.0);
                    
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, MoonApp.totalCityCtx.texture);
                    gl.uniform1i(MoonApp.totalCityCtx.locsImg.tex, 0);

                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                }

                if (MoonApp.totalMoonCtx) {
                    MoonApp.totalMoonCtx.gl.viewport(0, 0, MoonApp.totalMoonCtx.canvas.width, MoonApp.totalMoonCtx.canvas.height);
                    MoonApp.totalMoonCtx.gl.clearColor(0.0, 0.0, 0.0, 0.0);
                    MoonApp.totalMoonCtx.gl.clear(MoonApp.totalMoonCtx.gl.COLOR_BUFFER_BIT);
                    MoonApp.totalMoonCtx.gl.useProgram(MoonApp.totalMoonCtx.program);
                    MoonApp.totalMoonCtx.gl.enableVertexAttribArray(MoonApp.totalMoonCtx.locs.pos);
                    MoonApp.totalMoonCtx.gl.vertexAttribPointer(MoonApp.totalMoonCtx.locs.pos, 2, MoonApp.totalMoonCtx.gl.FLOAT, false, 0, 0); 
                    
                    MoonApp.totalMoonCtx.gl.uniform3f(MoonApp.totalMoonCtx.locs.res, MoonApp.totalMoonCtx.canvas.width, MoonApp.totalMoonCtx.canvas.height, 1.0);
                    MoonApp.totalMoonCtx.gl.uniform1f(MoonApp.totalMoonCtx.locs.time, elapsed);
                    MoonApp.totalMoonCtx.gl.uniform2f(MoonApp.totalMoonCtx.locs.shadow, currentX, Y_OFFSET);
                    MoonApp.totalMoonCtx.gl.uniform1f(MoonApp.totalMoonCtx.locs.impact, impact);
                    
                    MoonApp.totalMoonCtx.gl.drawArrays(MoonApp.totalMoonCtx.gl.TRIANGLES, 0, 6);
                }
            }

            let inCore = MoonApp.state.currentProgress >= 0.88 && MoonApp.state.isThumbnail;

            if (inCore && MoonApp.CoreSubpages) {
                MoonApp.CoreSubpages.activate(MoonApp.state.c4SubPage);
            } else if (!inCore && MoonApp.CoreSubpages) {
                MoonApp.CoreSubpages.pauseAll();
            }

            requestAnimationFrame(MoonApp.render);};

var _cross = function(a, b) { return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]]; };
var _dot = function(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; };
var _normalize = function(v) { var len = Math.sqrt(_dot(v,v)); return [v[0]/len, v[1]/len, v[2]/len]; };

MoonApp.project3Dto2D = function(px, py, pz) {
            const ro = [ MoonApp.state.camRadius*Math.sin(MoonApp.state.camPhi)*Math.cos(MoonApp.state.camTheta), MoonApp.state.camRadius*Math.cos(MoonApp.state.camPhi), MoonApp.state.camRadius*Math.sin(MoonApp.state.camPhi)*Math.sin(MoonApp.state.camTheta) ];
            const cw = _normalize([-ro[0], -ro[1], -ro[2]]);
            const cp = [0, 1, 0];
            const cu = _normalize(_cross(cw, cp));
            const cv = _normalize(_cross(cu, cw));
            const p = [px - ro[0], py - ro[1], pz - ro[2]];
            
            const camZ = _dot(p, cw);
            if (camZ <= 0.1) return null; 
            
            let uvX = _dot(p, cu) / camZ * 2.2;
            let uvY = _dot(p, cv) / camZ * 2.2;
            
            uvX = uvX / MoonApp.state.currentZoom + MoonApp.state.currentOffsetX;
            uvY = uvY / MoonApp.state.currentZoom + MoonApp.state.currentOffsetY;
            
            return { x: (uvX*MoonApp.orbiter.canvas.height + MoonApp.orbiter.canvas.width)/2.0, y: MoonApp.orbiter.canvas.height - ((uvY*MoonApp.orbiter.canvas.height + MoonApp.orbiter.canvas.height)/2.0) };
        };

MoonApp.updateTextArc = function(phase) {
            const svgPath = document.getElementById('invisible-arc');
            const textPath = document.getElementById('text-path-el');
            const textEl = document.querySelector('#text-svg-layer .arc-text');
            
            if (phase <= 0.002) { 
                svgPath.setAttribute('d', ''); textPath.textContent = ''; return 0;
            }

            const q = Math.max(0, Math.min(Math.floor((phase - 0.001) * 4.0), 3));
            const a_start = q * Math.PI * 0.5, a_end = (q + 1) * Math.PI * 0.5;
            
            let mTitle, mSub;
            if (MoonApp.state.currentLang === 'zh') {
                const zhArr = [ MoonApp.i18n.zh.mod1, MoonApp.i18n.zh.mod2, MoonApp.i18n.zh.mod3, MoonApp.i18n.zh.mod4 ];
                const parts = zhArr[q].split('] ');
                mTitle = parts[0] + ']'; mSub = parts[1];
            } else {
                const enArr = [ MoonApp.i18n.en.mod1, MoonApp.i18n.en.mod2, MoonApp.i18n.en.mod3, MoonApp.i18n.en.mod4 ];
                const parts = enArr[q].split('] ');
                mTitle = parts[0] + ']'; mSub = parts[1];
            }

            textPath.textContent = "✦ " + mTitle + " / " + mSub + " ✦"; 

            // ★ 轨道文字根据主题动态着色
            let isCore = document.body.classList.contains('theme-core');
            let isC01 = document.body.classList.contains('theme-course01');
            let isC02 = document.body.classList.contains('theme-course02');
            let glowColor = isCore ? 'rgba(255, 42, 75, 0.9)' : (isC01 ? 'rgba(168, 85, 247, 0.9)' : (isC02 ? 'rgba(255, 119, 170, 0.9)' : 'rgba(255, 170, 0, 0.9)'));
            let glowWhite = isCore ? 'rgba(255, 255, 255, 0.8)' : (isC01 ? 'rgba(255, 220, 255, 0.8)' : (isC02 ? 'rgba(255, 220, 240, 0.8)' : 'rgba(255, 255, 240, 0.8)'));
            let strokeColor = isCore ? '#4a0011' : (isC01 ? '#330044' : (isC02 ? '#880044' : '#554400'));
            if (MoonApp.courseModules[q].alert) {
                textEl.setAttribute('fill', '#ffffff');
                textEl.setAttribute('stroke', strokeColor); 
                textEl.style.textShadow = `0 0 12px ${glowColor}, 0 0 25px ${glowWhite}`;
            } else {
                textEl.setAttribute('fill', '#ffffff');
                textEl.setAttribute('stroke', '#334455'); 
                textEl.style.textShadow = `0 0 10px rgba(255, 255, 255, 0.5)`;
            }

            let points = [];
            const R_text = 8.25; 
            for (let i = 0; i <= 40; i++) {
                let a = a_start + (a_end - a_start) * (i / 40.0);
                let px = R_text * Math.cos(a);
                let pz = -R_text * Math.sin(a); 
                let p2d = MoonApp.project3Dto2D(px, 0.0, pz);
                if (p2d) points.push(p2d);
            }
            if (points.length < 2) { svgPath.setAttribute('d', ''); return 0; }
            if (points[0].x > points[points.length - 1].x) points.reverse();

            let d = `M ${points[0].x} ${points[0].y}`;
            let pathLen = 0;
            for (let i = 1; i < points.length; i++) {
                d += ` L ${points[i].x} ${points[i].y}`;
                let dx = points[i].x - points[i-1].x;
                let dy = points[i].y - points[i-1].y;
                pathLen += Math.sqrt(dx*dx + dy*dy);
            }
            svgPath.setAttribute('d', d);
            return pathLen;
        };

MoonApp.init = function() {
  var app = MoonApp;
  var s = app.state;

  app.updateLanguageUI();

  window.addEventListener('resize', app.resize);

  var interactionLayer = document.getElementById('interaction-layer');

  window.addEventListener('mousemove', function(e) { s.mouseX = e.clientX; s.mouseY = window.innerHeight - e.clientY; });

  interactionLayer.addEventListener('mousedown', function(e) { s.isDragging = true; s.lastX = e.clientX; s.lastY = e.clientY; });
  interactionLayer.addEventListener('mousemove', function(e) {
    if (s.isDragging) {
      s.camTheta -= (e.clientX - s.lastX) * 0.005;
      s.camPhi -= (e.clientY - s.lastY) * 0.005;
      s.camPhi = Math.max(0.05, Math.min(Math.PI / 2.0 - 0.05, s.camPhi));
      s.lastX = e.clientX; s.lastY = e.clientY;
    }
  });
  interactionLayer.addEventListener('mouseup', function() { s.isDragging = false; });
  interactionLayer.addEventListener('wheel', function(e) {
    s.camRadius = Math.max(12.0, Math.min(50.0, s.camRadius + e.deltaY * 0.02));
  });

  interactionLayer.addEventListener('touchstart', function(e) {
    s.isDragging = true;
    s.lastX = e.touches[0].clientX;
    s.lastY = e.touches[0].clientY;
  }, { passive: true });
  interactionLayer.addEventListener('touchmove', function(e) {
    if (s.isDragging) {
      s.camTheta -= (e.touches[0].clientX - s.lastX) * 0.005;
      s.camPhi -= (e.touches[0].clientY - s.lastY) * 0.005;
      s.camPhi = Math.max(0.05, Math.min(Math.PI / 2.0 - 0.05, s.camPhi));
      s.lastX = e.touches[0].clientX; s.lastY = e.touches[0].clientY;
    }
  }, { passive: true });
  interactionLayer.addEventListener('touchend', function() { s.isDragging = false; });

  s.startTime = performance.now();

  app.cityCtx = null;
  app.moonCtx = null;
  app.bridgeCtx = null;
  app.penumbralMoonCtx = null;
  app.totalCityCtx = null;
  app.totalMoonCtx = null;
  app.orbiter = app.initOrbiter();

  app.resize();
  if (app.prologue) app.prologue.init();
  requestAnimationFrame(app.render);
};

MoonApp.openVideo = function() {
  var state = MoonApp.state;
  state.isVideoOpen = true;
  var vc = document.getElementById('video-panel-container');
  vc.classList.add('active');
  document.getElementById('interaction-layer').style.pointerEvents = 'none';
  document.getElementById('lab-ui-container').classList.add('ui-hidden');
  document.getElementById('text-svg-layer').style.opacity = '0';
  var vid = document.getElementById('columbus-video');
  vid.currentTime = 0;
  vid.play();
};

MoonApp.closeVideo = function() {
  var state = MoonApp.state;
  state.isVideoOpen = false;
  var vc = document.getElementById('video-panel-container');
  vc.classList.remove('active');
  var vid = document.getElementById('columbus-video');
  vid.pause();
  document.getElementById('interaction-layer').style.pointerEvents = 'auto';
  document.getElementById('lab-ui-container').classList.remove('ui-hidden');
  if(state.menuVisible) document.getElementById('text-svg-layer').style.opacity = '1';
};

window.closeVideo = MoonApp.closeVideo;
window.openVideo = MoonApp.openVideo;

// ====== prologue.js ======
var MoonApp = MoonApp || {};

MoonApp.prologue = (function() {
  var proGl = null, proProgram = null;
  var proReqId = null;
  var startTimePrologue = 0;
  var proLocRes, proLocTime, proLocEcl, proLocFog, proLocGrid, proLocMoon;

  function setPanelState(panel, state) {
    if (state === 'hidden') { panel.classList.remove('active', 'docked'); } 
    else if (state === 'active') { panel.classList.add('active'); panel.classList.remove('docked'); } 
    else if (state === 'docked') { panel.classList.remove('active'); panel.classList.add('docked'); }
  }

  var proVsSource = '#version 300 es\nin vec4 a_position; void main() { gl_Position = a_position; }';
  var proFsSource = '#version 300 es\n' +
    'precision highp float;\n' +
    'uniform vec3 iResolution; uniform float iTime;\n' +
    'uniform vec2 uMoonPos; uniform float uEclipse; uniform float uFog; uniform float uGridPower;\n' +
    'out vec4 fragColor_out;\n' +
    '#define PI  3.141592653589793\n' +
    '#define C(x) clamp(x, 0., 1.)\n' +
    '#define S(a, b, x) smoothstep(a, b, x)\n' +
    '#define F(x, f) (floor(x * f) / f)\n' +
    'float hash12(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n' +
    'vec2 hash21(float p) { vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }\n' +
    'float hash11(float p) { uvec2 n = uint(int(p)) * uvec2(1597334673U, 3812015801U); uint q = (n.x ^ n.y) * 1597334673U; return float(q) * (1. / float(0xffffffffU)); }\n' +
    'float noise(in vec3 p) { vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f); float n = i.x + i.y * 157.0 + 113.0 * i.z; return mix( mix(mix(hash11(n + 0.0), hash11(n + 1.0), f.x), mix(hash11(n + 157.0), hash11(n + 158.0), f.x), f.y), mix(mix(hash11(n + 113.0), hash11(n + 114.0), f.x), mix(hash11(n + 270.0), hash11(n + 271.0), f.x), f.y), f.z); }\n' +
    'float fbm(in vec3 p) { return noise(p) + noise(p * 2.) / 2. + noise(p * 4.) / 4.; }\n' +
    'vec3 hash33(vec3 p) { p = fract(p * vec3(17.16, 31.79, 47.11)); p += dot(p, p.yxz + 19.19); return fract((p.xxy + p.yxx) * p.zyx); }\n' +
    'float getBump(vec3 p) { float h = 0.0; float freq = 0.8; float amp = 1.0; for(int layer = 0; layer < 4; layer++) { vec3 ip = floor(p * freq); vec3 fp = fract(p * freq); float minDist = 2.0; float radius = 0.5; float craterShape = 0.0; for(int i=-1; i<=1; i++) { for(int j=-1; j<=1; j++) { for(int k=-1; k<=1; k++) { vec3 offset = vec3(float(i), float(j), float(k)); vec3 h3 = hash33(ip + offset); vec3 diff = offset + h3 - fp; float d = length(diff); if (h3.z > 0.35) continue; if(d < minDist) { minDist = d; radius = 0.2 + 0.4 * h3.x; } } } } float x = minDist / radius; if (x < 1.0) { float cavity = x * x - 1.0; float rim = smoothstep(0.5, 0.8, x) * smoothstep(1.0, 0.8, x) * 1.2; craterShape = cavity + rim; } h += craterShape * amp; freq *= 2.3; amp *= 0.35; } h += fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 0.015; return h * 0.3; }\n' +
    'float worldBump(vec3 p, float time) { vec3 localP = p; float roty = time * 0.05; mat2 rY = mat2(cos(roty), -sin(roty), sin(roty), cos(roty)); mat2 rZ = mat2(cos(time*0.005), -sin(time*0.005), sin(time*0.005), cos(time*0.005)); localP.xz *= rY; localP.xy *= rZ; return getBump(localP); }\n' +
    'vec3 getMoonNormal(vec3 p, float time) { vec3 n = normalize(p); vec2 e = vec2(0.015, 0.0); float b = worldBump(p, time); vec3 grad = vec3( worldBump(p + e.xyy, time) - b, worldBump(p + e.yxy, time) - b, worldBump(p + e.yyx, time) - b ) / e.x; return normalize(n - grad * 1.5); }\n' +
    'vec3 cyberWindows(vec2 st, float offset, float scale) { vec2 p = vec2(st.x + offset, st.y); vec2 grid = vec2(60.0 * scale, 150.0); vec2 uv = p * grid; vec2 id = floor(uv); vec2 fractUV = fract(uv); float mask = step(0.3, fractUV.x) * step(0.4, fractUV.y); float buildingGap = step(0.15, fract(p.x * 12.0 * scale)); mask *= buildingGap; float h = hash12(id); vec3 col = vec3(0.0); if (h > 0.65) { col = vec3(0.85, 0.65, 0.35); if (h > 0.90) col = vec3(0.75, 0.8, 0.85); if (h > 0.98) col = vec3(0.95, 0.85, 0.6); col *= 0.85 + 0.15 * sin(iTime * 1.0 + h * 20.0); } float buildingID = floor(p.x * 12.0 * scale); if (fract(sin(buildingID * 77.7) * 43758.5) < 0.25) col *= 0.1; float turnOnOrder = hash12(id + 7.77); float windowState = smoothstep(turnOnOrder - 0.01, turnOnOrder + 0.01, uGridPower); return col * mask * windowState; }\n' +
    'float buildingLayer(vec2 st, float offset, float scale, float baseHeight) { float x = (st.x + offset) * scale; float b = .1 * F(cos(x*4.0 + 1.7), 1.0); b += (b + .3) * 0.3 * F(cos(x*4.-0.1), 2.0); b += (b-.01) * 0.1 * F(cos(x*12.0), 4.); b += (b-.05) * 0.3 * F(cos(x*24.0), 1.0); return C((st.y + b - baseHeight) * 100.); }\n' +
    'float mountainFBM(vec2 st, float offset, float scale, float height) { float x = (st.x + offset) * scale; float m = sin(x)*0.08 + sin(x*2.3+1.5)*0.04 + sin(x*4.7+0.2)*0.01; return C(S(-0.005, 0.005, st.y - (m + height))); }\n' +
    'float getMountainNear(vec2 st) { float m = sin(1.69 * st.x * 1.38 * cos(2.74 * st.x) + 4.87 * sin(1.17 * st.x)) * .08; return C(S(-0.005, 0.005, st.y - (m + 0.12))); }\n' +
    'float stars(vec2 st, vec2 fragCoord) { vec2 uv = (2. * fragCoord - iResolution.xy) / iResolution.y; uv.y += .3; uv.y = abs(uv.y); float t = iTime * .1; vec2 h = pow(hash21(uv.x * iResolution.y + uv.y), vec2(50.)); float twinkle = sin((st.x + t + cos(st.y * 50. + t)) * 25.); twinkle *= cos((st.y * .187 - t * 4.16 + sin(st.x * 11.8 + t * .347)) * 6.57); twinkle = twinkle * .5 + .5; return h.x * h.y * twinkle * 1.5; }\n' +
    'void mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n' +
    '  vec2 uv = (2. * fragCoord - iResolution.xy) / min(iResolution.y, iResolution.x); uv.y += .3; float reflection = 0.; if (uv.y < 0.) { reflection = 1.; uv.x += cos(uv.y * 192. - iTime * .6) * sin(uv.y * 96. + iTime * .75) * .042; }\n' +
    '  vec2 st = vec2(uv.x, abs(uv.y));\n' +
    '  vec3 deepSky = vec3(0.01, 0.02, 0.05); vec3 horizonGlow = vec3(0.3, 0.05, 0.25); float skyGrad = exp(-st.y * 2.5); vec3 baseSky = mix(deepSky, horizonGlow, skyGrad);\n' +
    '  vec3 skyCol = baseSky + vec3(stars(st, fragCoord)) * (1.0 - skyGrad * 0.5) * (0.3 + 0.7 * (1.0 - uFog));\n' +
    '  vec2 moonCenter = uMoonPos; float moonRadius = 0.28; float mDist = length(st - moonCenter); float eclipseDepth = clamp(1.0 - abs(uEclipse - 1.0), 0.0, 1.0);\n' +
    '  float haloDist = length(st - moonCenter); float glowShadowDist = length(st - (moonCenter + mix(vec2(1.2,0.4), vec2(-1.2,-0.4), uEclipse*0.5)));\n' +
    '  float glowOverlap = smoothstep(0.28 * 2.8 - 0.4, 0.28 * 2.8 + 0.4, glowShadowDist);\n' +
    '  float baseMoonGlow = exp(-max(0.0, haloDist - moonRadius) * 25.0) * mix(0.1, 1.0, glowOverlap); float redHalo = exp(-max(0.0, haloDist - moonRadius) * 12.0);\n' +
    '  float redPhase = smoothstep(0.6, 1.0, eclipseDepth); vec3 haloCol = mix(vec3(0.4, 0.45, 0.5) * baseMoonGlow, vec3(0.5, 0.05, 0.4) * redHalo, redPhase);\n' +
    '  vec3 backSky = skyCol + haloCol * (0.25 + 0.25 * eclipseDepth); skyCol = backSky;\n' +
    '  float moonMask = smoothstep(moonRadius + 0.005, moonRadius - 0.002, mDist);\n' +
    '  if (moonMask > 0.0) {\n' +
    '    vec2 p = (st - moonCenter) / moonRadius; float dotp = dot(p, p); float z = sqrt(max(0.0, 1.0 - dotp));\n' +
    '    vec3 pos3D = vec3(p, z); vec3 n_bump = getMoonNormal(pos3D, iTime); vec3 n = normalize(mix(vec3(p, z), n_bump, smoothstep(0.0, 0.4, z)));\n' +
    '    vec3 rd = vec3(0.0, 0.0, -1.0); vec3 ld = normalize(vec3(-0.4, 0.3, 1.0)); vec3 hv = normalize(ld - rd);\n' +
    '    float ndotl = dot(n, ld); float dif = smoothstep(-0.1, 1.0, ndotl); float nv = clamp(dot(-rd, n), 0.0, 1.0);\n' +
    '    vec3 baseColor = vec3(0.42, 0.38, 0.32); float spec = pow(clamp(dot(n, hv), 0.0, 1.0), 64.0) * 0.15; float spec2 = pow(clamp(dot(n, normalize(ld - rd + vec3(0.1,0.0,0.0))), 0.0, 1.0), 32.0) * 0.1;\n' +
    '    float thickness = max(0.0, 1.0 - nv); float fresnel = pow(thickness, 3.0) * 0.3; float sss = pow(clamp(dot(rd, -(n + ld)), 0.0, 1.0), 2.0);\n' +
    '    vec3 sunlitMoon = baseColor * (dif * 1.2) + baseSky * 1.5 * (1.0 - dif) + baseColor * fresnel + spec * vec3(0.9, 0.7, 0.5) + spec2 * vec3(0.8, 0.6, 0.5) + mix(vec3(0.8, 0.6, 0.4), baseColor, 0.5) * (sss * 0.15);\n' +
    '    vec3 normalShadow = baseColor * 0.02 + baseSky * 0.15;\n' +
    '    vec3 bloodJelly = vec3(0.08, 0.01, 0.08) + pow(thickness, 4.0) * 1.0 * vec3(0.5, 0.05, 0.4) + pow(clamp(dot(n, hv), 0.0, 1.0), 128.0) * 0.3 + (sss * 1.5) * vec3(0.5, 0.05, 0.4);\n' +
    '    float redTransition = smoothstep(0.6, 0.95, eclipseDepth); vec3 darkArea = mix(normalShadow, bloodJelly, redTransition);\n' +
    '    vec2 shadowPos = mix(moonCenter + vec2(1.2, 0.4), moonCenter - vec2(1.2, 0.4), uEclipse * 0.5);\n' +
    '    float shadowRadius = moonRadius * 2.8; float penumbra = smoothstep(shadowRadius - 0.35, shadowRadius + 0.15, length(st - shadowPos));\n' +
    '    vec3 finalMoon = mix(darkArea, sunlitMoon, penumbra) + vec3(1.0, 0.9, 0.7) * smoothstep(0.8, 1.0, 1.0 - z) * 0.05 * penumbra;\n' +
    '    skyCol = mix(skyCol, mix(backSky, finalMoon, smoothstep(0.0, 0.15, z)), moonMask);\n' +
    '  }\n' +
    '  vec3 col = skyCol;\n' +
    '  float mask_m3 = mountainFBM(st, 12.0, 1.0, 0.35); col = mix(mix(baseSky, vec3(0.12, 0.05, 0.08), 0.5), col, mask_m3);\n' +
    '  float mask_m2 = mountainFBM(st, 5.0, 1.5, 0.25); col = mix(mix(baseSky, vec3(0.08, 0.03, 0.06), 0.65), col, mask_m2);\n' +
    '  float mask_m1 = getMountainNear(st); col = mix(mix(baseSky, vec3(0.04, 0.02, 0.04), 0.85), col, mask_m1);\n' +
    '  float mask_b3 = buildingLayer(st, 8.0, 2.0, 0.22); col = mix(mix(baseSky, vec3(0.03, 0.02, 0.03), 0.7) + cyberWindows(st, 8.0, 2.0) * 0.1 * (1.0 - mask_b3), col, mask_b3);\n' +
    '  float mask_b2 = buildingLayer(st, 3.14, 1.3, 0.15); col = mix(mix(baseSky, vec3(0.02, 0.015, 0.02), 0.85) + cyberWindows(st, 3.14, 1.3) * 0.35 * (1.0 - mask_b2), col, mask_b2);\n' +
    '  float mask_b1 = buildingLayer(st, 0.0, 0.8, 0.08); col = mix(vec3(0.01, 0.01, 0.015) + cyberWindows(st, 0.0, 0.8) * (1.0 - mask_b1), col, mask_b1);\n' +
    '  float finalFog = exp(-st.y * 3.5) * mix(0.4, 1.2, fbm(vec3(st.x * 2.0, st.y * 3.0 - iTime * 0.05, iTime * 0.02))) * uFog;\n' +
    '  col = mix(col, mix(vec3(0.15, 0.12, 0.1), horizonGlow, 0.6 * eclipseDepth), clamp(finalFog * 0.9, 0.0, 1.0));\n' +
    '  col.r -= reflection * .03; col.gb += reflection * .015;\n' +
    '  fragColor = vec4(col - hash11(fragCoord.x * fragCoord.y * 0.2 * (iTime + 50.0)) * 0.008, 1.0);\n' +
    '}\n' +
    'void main() { mainImage(fragColor_out, gl_FragCoord.xy); }';

  function init() {
    var canvasPro = document.getElementById('prologue-canvas');
    proGl = canvasPro.getContext('webgl2');
    if (!proGl) return;
    var vs = proGl.createShader(proGl.VERTEX_SHADER); proGl.shaderSource(vs, proVsSource); proGl.compileShader(vs);
    var fs = proGl.createShader(proGl.FRAGMENT_SHADER); proGl.shaderSource(fs, proFsSource); proGl.compileShader(fs);
    proProgram = proGl.createProgram(); proGl.attachShader(proProgram, vs); proGl.attachShader(proProgram, fs); proGl.linkProgram(proProgram);

    var positionBuffer = proGl.createBuffer(); proGl.bindBuffer(proGl.ARRAY_BUFFER, positionBuffer);
    proGl.bufferData(proGl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), proGl.STATIC_DRAW);
    var posAttr = proGl.getAttribLocation(proProgram, "a_position"); proGl.enableVertexAttribArray(posAttr);
    proGl.vertexAttribPointer(posAttr, 2, proGl.FLOAT, false, 0, 0);

    proLocRes = proGl.getUniformLocation(proProgram, "iResolution"); proLocTime = proGl.getUniformLocation(proProgram, "iTime");
    proLocEcl = proGl.getUniformLocation(proProgram, "uEclipse"); proLocFog = proGl.getUniformLocation(proProgram, "uFog");
    proLocGrid = proGl.getUniformLocation(proProgram, "uGridPower"); proLocMoon = proGl.getUniformLocation(proProgram, "uMoonPos");

    window.addEventListener('resize', function() { canvasPro.width = window.innerWidth; canvasPro.height = window.innerHeight; if(MoonApp.state.isPrologueActive) proGl.viewport(0, 0, canvasPro.width, canvasPro.height); });
    canvasPro.width = window.innerWidth; canvasPro.height = window.innerHeight;
  }

  function start() {
    startTimePrologue = performance.now();
    if(proReqId) cancelAnimationFrame(proReqId);
    proReqId = requestAnimationFrame(render);
  }

  function stop() {
    if(proReqId) cancelAnimationFrame(proReqId);
    proReqId = null;
  }

  function render(now) {
    if (!MoonApp.state.isPrologueActive && performance.now() - startTimePrologue > 2000) return;
    var canvasPro = document.getElementById('prologue-canvas');
    if (canvasPro.width !== window.innerWidth || canvasPro.height !== window.innerHeight) { canvasPro.width = window.innerWidth; canvasPro.height = window.innerHeight; }
    proGl.viewport(0, 0, canvasPro.width, canvasPro.height); proGl.useProgram(proProgram);
    var t = (now - startTimePrologue) * 0.001;
    var curGrid = 0.0; if (t > 0.5 && t <= 5.0) curGrid = ((t - 0.5) / 4.5) * 1.05; else if (t > 5.0) curGrid = 1.05;
    var curFog = 0.8; if (t > 0.5 && t <= 4.0) curFog = 0.8 - 0.35 * ((t - 0.5) / 3.5); else if (t > 4.0) curFog = 0.45;
    var curMoonX = 1.3, curMoonY = -0.2; 
    if (t > 1.5 && t <= 6.0) { var p = (t - 1.5) / 4.5; var ease = 1 - Math.pow(1 - p, 3); curMoonX = 1.3 - 0.45 * ease; curMoonY = -0.2 + 0.85 * ease; } else if (t > 6.0) { curMoonX = 0.85; curMoonY = 0.65; }
    var curEclipse = 0.0;
    if (t > 6.5 && t <= 12.5) curEclipse = (t - 6.5) / 6.0; else if (t > 12.5 && t <= 49.5) curEclipse = 1.0; else if (t > 49.5 && t <= 55.5) curEclipse = 1.0 + (t - 49.5) / 6.0; else if (t > 55.5) curEclipse = 2.0;

    if (MoonApp.state.isPrologueActive) {
      setPanelState(document.getElementById('myth-panel-1'), t < 11.0 ? 'hidden' : (t < 18.0 ? 'active' : 'docked'));
      setPanelState(document.getElementById('myth-panel-2'), t < 19.0 ? 'hidden' : (t < 26.0 ? 'active' : 'docked'));
      setPanelState(document.getElementById('myth-panel-3'), t < 27.0 ? 'hidden' : (t < 34.0 ? 'active' : 'docked'));
      setPanelState(document.getElementById('myth-panel-4'), t < 35.0 ? 'hidden' : (t < 42.0 ? 'active' : 'docked'));
      setPanelState(document.getElementById('myth-panel-5'), t < 43.0 ? 'hidden' : (t < 51.0 ? 'active' : 'docked'));
    } else { [1,2,3,4,5].forEach(function(i) { setPanelState(document.getElementById('myth-panel-' + i), 'hidden'); }); }

    proGl.uniform3f(proLocRes, canvasPro.width, canvasPro.height, 1.0); proGl.uniform1f(proLocTime, t);
    proGl.uniform2f(proLocMoon, curMoonX, curMoonY); proGl.uniform1f(proLocEcl, curEclipse);
    proGl.uniform1f(proLocFog, curFog); proGl.uniform1f(proLocGrid, curGrid);

    proGl.drawArrays(proGl.TRIANGLES, 0, 6); proReqId = requestAnimationFrame(render);
  }

  return { init: init, start: start, stop: stop, render: render };
})();


// ====== core-subpages-manager.js ======
// CORE Subpages Manager
// 管理 CORE 章节 4 个子页面的可见性
// 各模块懒初始化：首次激活时才创建 WebGL 上下文
MoonApp.CoreSubpages = (function() {
  var modules = [null, null, null, null];
  var activeIndex = -1;

  function _register(id, mod) {
    modules[id] = mod;
    mod._container = document.getElementById('core-subpage-' + id);
    if (mod._container) {
      mod._container.classList.add('inactive');
    }
  }

  function activate(id) {
    if (activeIndex === id) {
      var activeMod = modules[id];
      if (activeMod && typeof activeMod.start === 'function') activeMod.start();
      if (typeof MoonApp.applyConsoleVisibility === 'function') MoonApp.applyConsoleVisibility();
      return;
    }
    
    if (activeIndex >= 0 && modules[activeIndex] && modules[activeIndex]._container) {
      if (typeof modules[activeIndex].pause === 'function') modules[activeIndex].pause();
      modules[activeIndex]._container.classList.remove('active');
      modules[activeIndex]._container.classList.add('inactive');
    }

    activeIndex = id;
    var mod = modules[id];
    if (!mod) return;

    if (typeof mod.init === 'function') mod.init();

    if (mod._container) {
      mod._container.classList.remove('inactive');
      mod._container.classList.add('active');
    }
    if (typeof mod.start === 'function') mod.start();
    if (typeof MoonApp.applyConsoleVisibility === 'function') MoonApp.applyConsoleVisibility();
  }

  function pauseAll() {
    for (var i = 0; i < modules.length; i++) {
      if (modules[i] && typeof modules[i].pause === 'function') {
        modules[i].pause();
      }
      if (modules[i] && modules[i]._container) {
        modules[i]._container.classList.remove('active');
        modules[i]._container.classList.add('inactive');
      }
    }
    activeIndex = -1;
    if (typeof MoonApp.applyConsoleVisibility === 'function') MoonApp.applyConsoleVisibility();
  }

  return {
    _register: _register,
    activate: activate,
    pauseAll: pauseAll,
    setProgress: function(val, btn) {
      if (modules[2] && typeof modules[2].setProgress === 'function') {
        modules[2].setProgress(val, btn);
      }
    },
    triggerEclipse: function() {
      if (modules[0] && typeof modules[0].triggerEclipse === 'function') {
        modules[0].triggerEclipse();
      }
    },
    setMode: function(mode) {
      if (modules[1] && typeof modules[1].setMode === 'function') {
        modules[1].setMode(mode);
      }
    }
  };
})();


// ====== core-01.js ======
// CORE Subpage 0
(function() {
  var _mod = { initialized: false, animFrameId: null };
  MoonApp.CoreSubpages._register(0, _mod);

  _mod.init = function() {
    if (_mod.initialized) return;
    _mod.initialized = true;
let menuVisible = true;
        let currentLang = 'zh';

        const i18n = {
            zh: {
                title: "多维观测站",
                desc: "在此终端中，您可以同时从「日心宏观视角」与右下角的「地球观测者视角」审视地月系的运转。<br>拖动时间流，观察带有等离子能量流苏尾迹的真·体积光轨道，以及精致的素描陨石坑地貌。",
                hideConsole: "隐藏控制台", showConsole: "显示控制台", references: "参考资料",
                tab1: "引言", tab2: "上一页", tab3: "下一页", tab4: "首页", langToggle: "ENGLISH",
                timeHeader: "系统全局时间流 (物理锁定)",
                autoMode: "自动推演 (0.1x 舒缓模式)",
                manualMode: "手动拖拽 (干预全局时间轴)",
                timeSub: "* 滑块代表地球公转的 0~365 天。",
                spaceHeader: "空间动力学参数",
                realTilt: "真实倾角 (5.14°) - 月球沿真实黄白交角运行",
                flatTilt: "理想共面 (0.00°) - 用于演示绝对食分现象",
                pipLabel: "● REC | 地球观测者视角",
                flyTip: "【观测视角：NASA Lucy 探测器】2022年5月，Lucy 探测器在距地球 1 亿公里（约日地距离的 70%）的深空独特视角，使用 L'LORRI 高分辨率相机，凝视并记录了地球阴影投射在月球上的月全食全过程。",
                btnEclipse: "[ 快速定位至月食发生点 ]"
            },
            en: {
                title: "MULTI-PERSPECTIVE LAB",
                desc: "Examine the Earth-Moon system simultaneously from a \"Heliocentric View\" and the \"Earth Observer View\".<br>Drag the timeline to observe the pure volumetric plasma orbit trails and sketch crater geography.",
                hideConsole: "HIDE CONSOLE", showConsole: "SHOW CONSOLE", references: "REFERENCES",
                tab1: "INTRO", tab2: "PREV", tab3: "NEXT", tab4: "HOME", langToggle: "中文",
                timeHeader: "GLOBAL TIME STREAM (PHYSICS LOCKED)",
                autoMode: "AUTO SIMULATION (0.1x)",
                manualMode: "MANUAL OVERRIDE",
                timeSub: "* Slider represents 0~365 days of Earth's revolution.",
                spaceHeader: "SPATIAL DYNAMICS PARAMETERS",
                realTilt: "REAL INCLINATION (5.14°) - ORBITAL REALITY",
                flatTilt: "COPLANAR (0.00°) - ECLIPSE DEMONSTRATION",
                pipLabel: "● REC | EARTH OBSERVER VIEW",
                flyTip: "[VANTAGE POINT: NASA Lucy Spacecraft] On May 15-16, 2022, from 64 million miles away (70% of Earth-Sun distance), Lucy observed the total lunar eclipse. Using its L'LORRI camera, it watched as Earth cast its shadow on the Moon.",
                btnEclipse: "[ JUMP TO NEXT LUNAR ECLIPSE ]"
            }
        };

        function updateLanguageUI() {
            const dict = i18n[currentLang];
            const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.innerHTML = txt; };
            setTxt('ui-title', dict.title); setTxt('ui-desc', dict.desc); setTxt('tab-1', dict.tab1);
            setTxt('tab-2', dict.tab2); setTxt('tab-3', dict.tab3); setTxt('tab-4', dict.tab4);
            setTxt('menu-toggle-text', menuVisible ? dict.hideConsole : dict.showConsole);
            setTxt('lbl-ref', dict.references); setTxt('lang-btn', dict.langToggle);
            setTxt('lbl-time-header', dict.timeHeader); setTxt('lbl-auto', dict.autoMode);
            setTxt('lbl-manual', dict.manualMode); setTxt('lbl-time-sub', dict.timeSub);
            setTxt('lbl-space-header', dict.spaceHeader); setTxt('lbl-real', dict.realTilt);
            setTxt('lbl-flat', dict.flatTilt); setTxt('pip-label', dict.pipLabel); setTxt('fly-tip', dict.flyTip);
            setTxt('btn-eclipse', dict.btnEclipse);
        }

        function toggleLanguage() { currentLang = currentLang === 'zh' ? 'en' : 'zh'; updateLanguageUI(); }
        function toggleMenuDrawer() {
            const labUi = document.getElementById('core0-lab-ui'); menuVisible = !menuVisible;
            if (menuVisible) labUi.classList.remove('ui-hidden'); else labUi.classList.add('ui-hidden');
            updateLanguageUI();
        }
        function switchTopTab(element) {
            document.querySelectorAll('.retro-tab').forEach(tab => tab.classList.remove('active-tab'));
            element.classList.add('active-tab');
        }

        _mod.triggerEclipse = function() {
            const modeManual = document.getElementById('core0-modeManual');
            if(modeManual) modeManual.checked = true;
            const tiltFlat = document.querySelector('input[name="tilt"][value="0.0"]');
            if(tiltFlat) { tiltFlat.checked = true; currentTilt = 0.0; }

            let currentDay = parseFloat(document.getElementById('core0-timeSlider').value);
            let diffPhase = (currentDay / 365.0) * 12.37; 
            let k = Math.floor(diffPhase - 0.5); 
            let targetDiffPhase = (k + 1) + 0.5; 
            
            let targetDay = (targetDiffPhase / 12.37) * 365.0;
            if (targetDay > 365.0) targetDay = targetDay % 365.0; 
            
            let slider = document.getElementById('core0-timeSlider');
            slider.value = targetDay.toFixed(2);
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        };

        const canvas = document.getElementById('glcanvas-core-01');
        const gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: false });
        if(!gl) alert("WebGL init failed");

        const vsSource = `attribute vec4 aVertexPosition; void main() { gl_Position = aVertexPosition; }`;
        const fsSource = `
            precision highp float;
            
            uniform vec3 iResolution; 
            uniform vec3 uCamParams; 
            uniform float uEarthAngle;
            uniform float uMoonAngle;
            uniform float uInclination;
            uniform float uTime;

            #define MAX_DIST 250.0
            #define PI 3.1415926535

            const vec3 SUN_POS = vec3(0.0);
            const float EARTH_ORBIT_R = 30.0;
            const float MOON_ORBIT_R = 4.0;
            
            struct SdfCtx { float k; vec3 col; float d; };
            
            float sdSphere(vec3 p, float r) { return length(p) - r; }
            mat3 rotateY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
            mat3 rotateZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0., -s, c, 0., 0., 0., 1.); }
            mat3 calcLookAt(vec3 cp, vec3 at) { vec3 z = normalize(at - cp); vec3 x = normalize(cross(z, vec3(0.0, 1.0, 0.0))); return mat3(x, normalize(cross(x, z)), z); }

            // ==========================================
            // 基础 FBM 噪波
            // ==========================================
            float hash_e(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
            float noise_e(vec2 p) {
                vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash_e(i), hash_e(i + vec2(1.0, 0.0)), f.x), mix(hash_e(i + vec2(0.0, 1.0)), hash_e(i + vec2(1.0, 1.0)), f.x), f.y);
            }
            float fbm_e(vec2 p) {
                float s = 0.0, m = 1.0;
                for(int i=0; i<5; i++) { s += noise_e(p * m) / m; m *= 2.0; }
                return s;
            }

            // ==========================================
            // 月球 3D 陨石坑 Voronoi 噪波
            // ==========================================
            vec3 hash33_m(vec3 p) {
                p = fract(p * vec3(17.16, 31.79, 47.11));
                p += dot(p, p.yxz + 19.19);
                return fract((p.xxy + p.yxx) * p.zyx);
            }
            float getLunarBump(vec3 p) {
                float h = 0.0, freq = 1.2, amp = 1.0;
                for(int layer = 0; layer < 3; layer++) {
                    vec3 ip = floor(p * freq), fp = fract(p * freq);
                    float minDist = 2.0, radius = 0.5, craterShape = 0.0;
                    for(int i=-1; i<=1; i++) {
                        for(int j=-1; j<=1; j++) {
                            for(int k=-1; k<=1; k++) {
                                vec3 offset = vec3(float(i), float(j), float(k));
                                vec3 h3 = hash33_m(ip + offset);
                                vec3 diff = offset + h3 - fp;
                                float d = length(diff);
                                if (h3.z > 0.55) continue; 
                                if(d < minDist) { minDist = d; radius = 0.15 + 0.35 * h3.x; }
                            }
                        }
                    }
                    float x = minDist / radius;
                    if (x < 1.0) {
                        float cavity = x * x - 1.0; 
                        float rim = smoothstep(0.5, 0.8, x) * smoothstep(1.0, 0.8, x) * 1.6; 
                        craterShape = cavity + rim;
                    }
                    h += craterShape * amp; freq *= 2.1; amp *= 0.4;
                }
                h += fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 0.01;
                return h * 0.5; 
            }

            // ==========================================
            // 体积大气层透射
            // ==========================================
            vec3 calcAtmosphere(vec3 ro, vec3 rd, vec3 pEarth, float t_solid, vec2 fragCoord) {
                vec3 sunDir = normalize(SUN_POS - pEarth);
                vec3 relRo = ro - pEarth;
                float b = dot(relRo, rd);
                float c = dot(relRo, relRo) - (1.95 * 1.95);
                float h = b*b - c;
                if(h < 0.0) return vec3(0.0);
                
                float t_in = max(0.0, -b - sqrt(h));
                float t_out = min(t_solid, -b + sqrt(h));
                if(t_in >= t_out) return vec3(0.0);
                
                int steps = 15;
                float dt = (t_out - t_in) / float(steps);
                vec3 atmoCol = vec3(0.0);
                float dither = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);
                
                for(int i=0; i<15; i++) {
                    vec3 p = relRo + rd * (t_in + (float(i)+dither) * dt);
                    float r = length(p);
                    if(r < 1.49) continue; 
                    vec3 n = p / r;
                    float sunDot = dot(n, sunDir);
                    
                    float density = smoothstep(1.95, 1.5, r);
                    float powDensity = pow(density, 2.5);
                    
                    float sunIllumination = smoothstep(-0.2, 0.5, sunDot);
                    
                    vec3 c_atmo = vec3(0.1, 0.6, 1.0) * pow(density, 1.5) * sunIllumination * 1.5;
                    c_atmo += vec3(0.6, 0.8, 1.0) * pow(density, 8.0) * sunIllumination * 1.5;
                    
                    float terminatorGlow = smoothstep(-0.4, 0.2, sunDot) * smoothstep(0.4, -0.2, sunDot);
                    vec3 twilightColor = mix(vec3(0.0, 0.3, 0.8), vec3(1.0, 0.7, 0.1), smoothstep(-0.2, 0.2, sunDot));
                    c_atmo += twilightColor * terminatorGlow * powDensity * 4.0;
                    
                    float nightGlow = smoothstep(0.0, -1.0, sunDot);
                    c_atmo += vec3(0.02, 0.05, 0.2) * powDensity * nightGlow * 0.8;
                    
                    atmoCol += c_atmo * dt * 0.5;
                }
                return atmoCol;
            }

            // ==========================================
            // Panteleymonov 顶级恒星噪波引擎
            // ==========================================
            vec4 hash4(vec4 n) { return fract(sin(n)*1399763.5453123); }
            float noise4q(vec4 x) {
                vec4 n3 = vec4(0.0, 0.25, 0.5, 0.75);
                vec4 p2 = floor(x.wwww+n3);
                vec4 b = floor(x.xxxx+n3) + floor(x.yyyy+n3)*157.0 + floor(x.zzzz+n3)*113.0;
                vec4 p1 = b + fract(p2*0.00390625)*vec4(164352.0, -164352.0, 163840.0, -163840.0);
                p2 = b + fract((p2+1.0)*0.00390625)*vec4(164352.0, -164352.0, 163840.0, -163840.0);
                vec4 f1 = fract(x.xxxx+n3), f2 = fract(x.yyyy+n3);
                f1=f1*f1*(3.0-2.0*f1); f2=f2*f2*(3.0-2.0*f2);
                vec4 n1 = vec4(0.0,1.0,157.0,158.0), n2 = vec4(113.0,114.0,270.0,271.0);
                vec4 vs1 = mix(hash4(p1), hash4(n1.yyyy+p1), f1);
                vec4 vs2 = mix(hash4(n1.zzzz+p1), hash4(n1.wwww+p1), f1);
                vec4 vs3 = mix(hash4(p2), hash4(n1.yyyy+p2), f1);
                vec4 vs4 = mix(hash4(n1.zzzz+p2), hash4(n1.wwww+p2), f1);  
                vs1 = mix(vs1, vs2, f2); vs3 = mix(vs3, vs4, f2);
                vs2 = mix(hash4(n2.xxxx+p1), hash4(n2.yyyy+p1), f1);
                vs4 = mix(hash4(n2.zzzz+p1), hash4(n2.wwww+p1), f1);
                vs2 = mix(vs2, vs4, f2);
                vs4 = mix(hash4(n2.xxxx+p2), hash4(n2.yyyy+p2), f1);
                vec4 vs5 = mix(hash4(n2.zzzz+p2), hash4(n2.wwww+p2), f1);
                vs4 = mix(vs4, vs5, f2);
                f1 = fract(x.zzzz+n3); f2 = fract(x.wwww+n3);
                f1=f1*f1*(3.0-2.0*f1); f2=f2*f2*(3.0-2.0*f2);
                vs1 = mix(vs1, vs2, f1); vs3 = mix(vs3, vs4, f1);
                vs1 = mix(vs1, vs3, f2);
                float r = dot(vs1, vec4(0.25));
                return r*r*(3.0-2.0*r);
            }

            float noiseSpere(vec3 ray, vec3 pos, float r, mat3 mr, float zoom, vec3 subnoise, float anim) {
                float b = dot(ray,pos); float c = dot(pos,pos) - b*b;
                vec3 r1=vec3(0.0); float s=0.0; float d=0.03125; float d2=zoom/(d*d); float ar=5.0;
                for (int i=0;i<3;i++) {
                    float rq=r*r;
                    if(c <rq) {
                        float l1=sqrt(rq-c); r1= ray*(b-l1)-pos; r1=r1*mr;
                        s+=abs(noise4q(vec4(r1*d2+subnoise*ar,anim*ar))*d);
                    }
                    ar-=2.0; d*=4.0; d2*=0.0625; r=r-r*0.02;
                }
                return s;
            }
            
            float ringRayNoise(vec3 ray, vec3 pos, float r, float size, mat3 mr, float anim) {
                float b = dot(ray,pos); vec3 pr=ray*b-pos; float c=length(pr); pr*=mr; pr=normalize(pr);
                float s=max(0.0,(1.0-size*abs(r-c)));
                float nd=noise4q(vec4(pr*1.0,-anim+c))*2.0; nd=pow(nd,2.0);
                float n=0.4; float ns=1.0;
                if (c>r) {
                    n=noise4q(vec4(pr*10.0,-anim+c));
                    ns=noise4q(vec4(pr*50.0,-anim*2.5+c*2.0))*2.0;
                }
                n=n*n*nd*ns;
                return pow(s,4.0)+s*s*n;
            }

            // ==========================================
            // 星体位置算法
            // ==========================================
            vec3 getEarthPos() {
                return vec3(cos(uEarthAngle) * EARTH_ORBIT_R, 0.0, -sin(uEarthAngle) * EARTH_ORBIT_R);
            }

            vec3 getMoonPos(vec3 pEarth) {
                vec3 toSun = normalize(SUN_POS - pEarth);
                vec3 xAxis = -toSun; 
                vec3 yAxis = vec3(0.0, 1.0, 0.0);
                vec3 zAxis = normalize(cross(xAxis, yAxis));
                vec3 localP = vec3(cos(uMoonAngle) * MOON_ORBIT_R, 0.0, -sin(uMoonAngle) * MOON_ORBIT_R);
                float c = cos(uInclination), s = sin(uInclination);
                vec3 tiltedP = vec3(localP.x * c - localP.y * s, localP.x * s + localP.y * c, localP.z);
                return pEarth + mat3(xAxis, yAxis, zAxis) * tiltedP;
            }

            // 剔除硬轨道，仅保留星体球心
            SdfCtx mapSolid(vec3 p, vec3 pEarth, vec3 pMoon) {
                SdfCtx res = SdfCtx(0.0, vec3(0.0), MAX_DIST);
                float dEarth = sdSphere(p - pEarth, 1.5); 
                if(dEarth < res.d) res = SdfCtx(2.0, vec3(0.0), dEarth); 
                float dMoon = sdSphere(p - pMoon, 0.4);
                if(dMoon < res.d) res = SdfCtx(3.0, vec3(0.6), dMoon);
                return res;
            }

            vec3 calcNormal(vec3 pos, vec3 pEarth, vec3 pMoon) {
                vec2 e = vec2(0.01, 0.0);
                return normalize(vec3(
                    mapSolid(pos+e.xyy, pEarth, pMoon).d - mapSolid(pos-e.xyy, pEarth, pMoon).d,
                    mapSolid(pos+e.yxy, pEarth, pMoon).d - mapSolid(pos-e.yxy, pEarth, pMoon).d,
                    mapSolid(pos+e.yyx, pEarth, pMoon).d - mapSolid(pos-e.yyx, pEarth, pMoon).d
                ));
            }

            float calcSoftshadow(vec3 ro, vec3 rd, vec3 targetPos, float targetRadius) {
                float res = 1.0, t = 0.05;
                for(int i=0; i<30; i++) {
                    float h = sdSphere(ro + rd*t - targetPos, targetRadius);
                    res = min(res, 8.0 * h / t); t += clamp(h, 0.05, 1.0);
                    if(res < 0.001 || t > 50.0) break;
                }
                return clamp(res, 0.0, 1.0);
            }

            void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                vec2 screenUv = fragCoord.xy / iResolution.xy;
                float margin = 30.0;
                float pipH = iResolution.y * 0.25; 
                float pipW = pipH * 1.5;            
                bool isPip = (fragCoord.x > iResolution.x - pipW - margin) && 
                             (fragCoord.x < iResolution.x - margin) && 
                             (fragCoord.y > margin) && 
                             (fragCoord.y < pipH + margin);
                
                vec3 pEarth = getEarthPos();
                vec3 pMoon = getMoonPos(pEarth);
                vec3 ro, rd;

                if (isPip) {
                    vec2 pipUv = (fragCoord.xy - vec2(iResolution.x - pipW - margin, margin)) / vec2(pipW, pipH);
                    vec2 p_uv = -1.0 + 2.0 * pipUv;
                    p_uv.x *= pipW / pipH; 
                    vec3 mDir = normalize(pMoon - pEarth);
                    ro = pEarth + mDir * 2.0; 
                    mat3 cam = calcLookAt(ro, pMoon);
                    rd = cam * normalize(vec3(p_uv, 2.5)); 
                } else {
                    vec2 p_uv = (-iResolution.xy + 2.0 * fragCoord.xy) / iResolution.y;
                    ro = vec3(uCamParams.z * sin(uCamParams.y) * cos(uCamParams.x), uCamParams.z * cos(uCamParams.y), uCamParams.z * sin(uCamParams.y) * sin(uCamParams.x));
                    mat3 cam = calcLookAt(ro, SUN_POS);
                    rd = cam * normalize(vec3(p_uv, 2.0));
                }

                float t = 0.0; 
                SdfCtx rRes = SdfCtx(0.0, vec3(0.0), 0.0);
                vec3 orbitGlowColor = vec3(0.0);

                for(int i=0; i<150; i++) { 
                    vec3 p = ro + rd*t;
                    rRes = mapSolid(p, pEarth, pMoon); 
                    float stepDist = rRes.d;

                    if (!isPip) {
                        float dE = length(vec2(length(p.xz) - EARTH_ORBIT_R, p.y));
                        vec3 toSun = normalize(SUN_POS - pEarth);
                        vec3 xAxis = -toSun, yAxis = vec3(0.0, 1.0, 0.0), zAxis = normalize(cross(xAxis, yAxis));
                        vec3 localP = p - pEarth;
                        vec3 pLocalProj = vec3(dot(localP, xAxis), dot(localP, yAxis), dot(localP, zAxis));
                        float c = cos(-uInclination), s = sin(-uInclination);
                        vec3 pUnTilted = vec3(pLocalProj.x * c - pLocalProj.y * s, pLocalProj.x * s + pLocalProj.y * c, pLocalProj.z);
                        float dM = length(vec2(length(pUnTilted.xz) - MOON_ORBIT_R, pUnTilted.y));
                        
                        float dOrbit = min(dE, dM);
                        stepDist = min(stepDist, dOrbit * 0.8 + 0.05);
                        stepDist = max(stepDist, 0.05);

                        if (dE < 4.0) {
                            float a = atan(-p.z, p.x);
                            float dAngle = mod(uEarthAngle - a, 2.0 * PI);
                            float tail = exp(-dAngle * 0.6);
                            float streamNoise = fbm_e(vec2(a * 15.0, uTime * 2.0));
                            float glowBase = 0.05 / (dE*dE + 0.02); 
                            float glowHalo = 0.02 / (dE + 0.05);
                            // ★ 地球轨迹保留少许蓝绿色，用于和红色系进行冷暖对比
                            vec3 colGlow = vec3(0.3, 0.7, 1.0) * tail * (0.6 + 1.4 * streamNoise);
                            colGlow += vec3(0.8, 0.9, 1.0) * exp(-dAngle * 10.0);
                            orbitGlowColor += colGlow * (glowBase + glowHalo) * stepDist * 0.3;
                        }

                        if (dM < 2.0) {
                            float a = atan(-pUnTilted.z, pUnTilted.x);
                            float dAngle = mod(uMoonAngle - a, 2.0 * PI);
                            float tail = exp(-dAngle * 0.8);
                            float streamNoise = fbm_e(vec2(a * 20.0, uTime * 3.0));
                            float glowBase = 0.05 / (dM*dM + 0.01);
                            float glowHalo = 0.02 / (dM + 0.05);
                            // ★ 月球轨迹变成极其强烈的绛红色 / 绯红
                            vec3 colGlow = vec3(1.0, 0.16, 0.29) * tail * (0.6 + 1.4 * streamNoise);
                            colGlow += vec3(1.0, 0.5, 0.5) * exp(-dAngle * 10.0);
                            orbitGlowColor += colGlow * (glowBase + glowHalo) * stepDist * 0.2;
                        }
                    }

                    if(rRes.d < 0.002 || t > MAX_DIST) break; 
                    t += stepDist * 0.9; 
                }

                // ==========================================
                // 恒星与日珥 (Solar Flares)
                // ==========================================
                vec3 l_sun = normalize(SUN_POS - ro);
                float sunForward = dot(rd, l_sun);
                vec3 sunBody = vec3(0.0);
                
                float sunVisE = calcSoftshadow(ro, l_sun, pEarth, 1.5);
                float sunVisM = calcSoftshadow(ro, l_sun, pMoon, 0.4);
                float sunVis = min(sunVisE, sunVisM);
                
                if (sunForward > 0.0) {
                    vec3 pos_sun_scaled = -ro / 4.0; 
                    mat3 sun_mr = rotateY(uTime * 0.1) * rotateZ(uTime * 0.05); 
                    
                    float s1 = noiseSpere(rd, pos_sun_scaled, 1.0, sun_mr, 0.5, vec3(0.0), uTime * 0.2);
                    s1 = pow(min(1.0, s1 * 2.4), 2.0);
                    float s2 = noiseSpere(rd, pos_sun_scaled, 1.0, sun_mr, 4.0, vec3(83.2, 34.3, 67.4), uTime * 0.2);
                    s2 = min(1.0, s2 * 2.2);
                    float s3 = ringRayNoise(rd, pos_sun_scaled, 0.96, 1.0, sun_mr, uTime * 0.2);
                    
                    sunBody = mix(vec3(1.0, 0.6, 0.1), vec3(1.0, 0.9, 0.6), pow(s1, 60.0)) * s1;
                    sunBody += mix(mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 0.8, 0.3), pow(s2, 2.0)), vec3(1.0, 0.9, 0.8), pow(s2, 10.0)) * s2;
                    
                    vec3 sunRays = mix(vec3(1.0, 0.5, 0.1), vec3(1.0, 0.9, 0.6), pow(s3, 3.0)) * s3;
                    
                    sunBody += sunRays * 1.5;
                    sunBody *= sunVis; 
                }

                // ==========================================
                // 实体着色 (地球 & 月球)
                // ==========================================
                vec3 col = vec3(0.0);
                if (t < MAX_DIST && rRes.k > 0.0) {
                    vec3 p = ro + rd*t;
                    vec3 n = calcNormal(p, pEarth, pMoon);
                    vec3 l = normalize(SUN_POS - p); 
                    vec3 hv = normalize(l - rd);
                    
                    if (rRes.k == 2.0) { 
                        vec3 pl = p - pEarth;
                        mat3 rotEarth = rotateY(uEarthAngle * 365.25) * rotateZ(0.41); 
                        vec3 n_local = normalize(rotEarth * pl);
                        vec2 sph_uv = vec2(atan(n_local.z, n_local.x), asin(n_local.y)) / PI;
                        
                        float continent = fbm_e(sph_uv * 5.0);

                        float dif = clamp(dot(n, l), 0.0, 1.0);
                        float spec = pow(clamp(dot(n, hv), 0.0, 1.0), 30.0) * 1.5;
                        float fresnel = pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 2.2);

                        vec3 lightBlue = vec3(0.392, 0.627, 0.862);
                        vec3 darkBlue = vec3(0.078, 0.156, 0.235);
                        vec3 landColor = vec3(0.15, 0.28, 0.35); 
                        vec3 gold = vec3(1.0, 0.745, 0.196);

                        vec3 baseColor = mix(darkBlue, lightBlue, dif);
                        baseColor = mix(baseColor, landColor, smoothstep(0.4, 0.55, continent));

                        vec3 sunlit = baseColor * (dif * 0.8 + 0.2);
                        sunlit += lightBlue * fresnel * 0.6;
                        sunlit += spec;

                        float shadow = calcSoftshadow(p + n * 0.05, l, pMoon, 0.4);
                        float shadowMask = clamp(1.0 - (dif * shadow * 10.0), 0.0, 1.0);
                        
                        vec2 screenP = fragCoord.xy / iResolution.y;
                        float planetSketch = clamp((sin((screenP.y - screenP.x + n.x * 0.015 + n.y * 0.015) * 400.0) + 0.8) * 200.0, 0.0, 1.0);

                        vec3 darkLineColor = darkBlue * 0.2;
                        darkLineColor += gold * fresnel * 0.6;

                        col = mix(sunlit, darkLineColor, shadowMask * planetSketch);
                    }
                    else if (rRes.k == 3.0) { 
                        vec3 pLocalM = p - pMoon;
                        mat3 worldToLocalM = rotateY(uTime * 0.2); 
                        mat3 localToWorldM = rotateY(-uTime * 0.2); 
                        vec3 pForTex = worldToLocalM * normalize(pLocalM) * 3.5;
                        
                        vec2 e_bump = vec2(0.01, 0.0);
                        float bCenter = getLunarBump(pForTex);
                        vec3 localGrad = vec3(
                            getLunarBump(pForTex + e_bump.xyy) - bCenter,
                            getLunarBump(pForTex + e_bump.yxy) - bCenter,
                            getLunarBump(pForTex + e_bump.yyx) - bCenter
                        ) / e_bump.x;
                        
                        vec3 worldGrad = localToWorldM * localGrad;
                        vec3 n_moon = normalize(n - worldGrad * 0.15); 
                        
                        float difM = pow(max(dot(n_moon, l), 0.0), 0.8) * 1.5; 
                        float macroDifM = max(dot(n, l), 0.0); 
                        
                        float shadowM = calcSoftshadow(p + n * 0.05, l, pEarth, 1.5);
                        shadowM = smoothstep(0.05, 0.8, shadowM); 
                        
                        vec3 lightSilver = vec3(0.95, 0.98, 1.0); 
                        vec3 darkGray = vec3(0.02, 0.03, 0.04);   
                        
                        vec3 moonAlbedo = mix(darkGray, lightSilver, bCenter * 0.8 + 0.2);
                        vec3 sunlitM = moonAlbedo * difM;
                        
                        float fresnelM = pow(1.0 - clamp(dot(-rd, n_moon), 0.0, 1.0), 2.2);
                        sunlitM += lightSilver * fresnelM * 0.15 * shadowM; 

                        float shadowMaskM = clamp(1.0 - (macroDifM * shadowM * 15.0), 0.0, 1.0);
                        vec2 screenP = fragCoord.xy / iResolution.y;
                        float planetSketchM = clamp((sin((screenP.y - screenP.x + n.x * 0.015 + n.y * 0.015) * 400.0) + 0.8) * 200.0, 0.0, 1.0);

                        vec3 darkLineColorM = darkGray * 0.1;
                        
                        float distToShadowAxis = length(cross(p - pEarth, l));
                        float umbraIntensity = smoothstep(1.8, 0.0, distToShadowAxis);
                        vec3 eclipseColor = mix(vec3(0.8, 0.2, 0.0), vec3(1.0, 0.0, 0.0), umbraIntensity);
                        
                        float inShadow = 1.0 - shadowM;
                        vec3 bloodGlow = eclipseColor * moonAlbedo * inShadow * pow(macroDifM, 0.5) * 18.0 * umbraIntensity;

                        vec3 dirToEarth = normalize(pEarth - p);
                        float earthShineDif = max(dot(n_moon, dirToEarth), 0.0); 
                        vec3 earthLightDir = normalize(pEarth - SUN_POS); 
                        float earthPhase = max(dot(earthLightDir, dirToEarth), 0.0); 
                        
                        vec3 earthShineColor = vec3(0.15, 0.4, 0.85); 
                        vec3 earthShine = earthShineColor * earthShineDif * pow(earthPhase, 2.0) * moonAlbedo * 3.5;
                        
                        vec3 ambientM = vec3(0.002, 0.004, 0.006) * moonAlbedo; 

                        col = mix(sunlitM, darkLineColorM, shadowMaskM * planetSketchM);
                        col = col * shadowM + bloodGlow + ambientM + earthShine;
                    }
                } else {
                    // ★ 星空背景渐变：还原深紫与绛红的 Twilight Violet 配色
                    vec3 gradTop = vec3(0.05, 0.01, 0.08); 
                    vec3 gradMid = vec3(0.12, 0.02, 0.16); 
                    vec3 gradBot = vec3(0.5, 0.1, 0.2); 
                    vec2 uv_norm = fragCoord.xy / iResolution.xy;
                    vec3 skyCol = mix(gradBot, gradMid, smoothstep(0.0, 0.4, uv_norm.y));
                    col = mix(skyCol, gradTop, smoothstep(0.4, 1.0, uv_norm.y));

                    if (sunForward > 0.0) col += sunBody;
                }

                if (!isPip) {
                    col += calcAtmosphere(ro, rd, pEarth, t, fragCoord) * 0.8;
                    col += orbitGlowColor; 
                }
                
                if (isPip) {
                    float edgeDist = min(min(fragCoord.x - (iResolution.x - pipW - margin), (iResolution.x - margin) - fragCoord.x),
                                         min(fragCoord.y - margin, (pipH + margin) - fragCoord.y));
                    // ★ PiP 边框与内部底色还原
                    if (edgeDist < 2.0) { 
                        col = vec3(1.0, 0.16, 0.29); 
                    } else {
                        col += vec3(0.05, 0.01, 0.08); 
                        col -= mod(fragCoord.y, 4.0) < 1.0 ? 0.04 : 0.0; 
                    }
                }
                
                fragColor = vec4(clamp(col, 0.0, 1.0), 1.0); 
            }
            void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
        `;

        const sProg = gl.createProgram();
        const vS = gl.createShader(gl.VERTEX_SHADER), fS = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(vS, vsSource); gl.compileShader(vS);
        gl.shaderSource(fS, fsSource); gl.compileShader(fS);
        if (!gl.getShaderParameter(fS, gl.COMPILE_STATUS)) { console.error('Shader ERROR:', gl.getShaderInfoLog(fS)); }
        gl.attachShader(sProg, vS); gl.attachShader(sProg, fS); gl.linkProgram(sProg); gl.useProgram(sProg);

        const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1, -1,-1, 1,1, 1,-1]), gl.STATIC_DRAW);
        const vPos = gl.getAttribLocation(sProg, 'aVertexPosition'); gl.enableVertexAttribArray(vPos); gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);

        const lRes = gl.getUniformLocation(sProg, "iResolution"), lCam = gl.getUniformLocation(sProg, "uCamParams"), lTime = gl.getUniformLocation(sProg, "uTime");
        const lEarthAngle = gl.getUniformLocation(sProg, "uEarthAngle"), lMoonAngle = gl.getUniformLocation(sProg, "uMoonAngle"), lInc = gl.getUniformLocation(sProg, "uInclination");

        let camTh = Math.PI / 4.0, camPh = Math.PI / 3.0, camR = 60.0, isD = false, lX = 0, lY = 0;
        const iL = document.getElementById('core0-interaction-layer');
        iL.onmousedown = e => { isD = true; lX = e.clientX; lY = e.clientY; };
        iL.onmousemove = e => { if(isD){ camTh -= (e.clientX-lX)*0.005; camPh = Math.max(0.01, Math.min(Math.PI-0.01, camPh - (e.clientY-lY)*0.005)); lX = e.clientX; lY = e.clientY; }};
        iL.onmouseup = iL.onmouseleave = () => isD = false;
        iL.onwheel = e => { camR = Math.max(15.0, Math.min(150.0, camR + e.deltaY * 0.05)); };

        const modeAuto = document.getElementById('core0-modeAuto');
        const modeManual = document.getElementById('core0-modeManual');
        const timeSlider = document.getElementById('core0-timeSlider');
        const tiltRadios = document.querySelectorAll('input[name="tilt"]');
        
        let globalSystemAngle = 0, currentTilt = 0.0897; 
        tiltRadios.forEach(radio => { radio.addEventListener('change', (e) => { currentTilt = parseFloat(e.target.value); }); });
        timeSlider.addEventListener('input', () => { modeAuto.checked = false; modeManual.checked = true; });

        const bgCanvas = document.createElement('canvas');
        bgCanvas.style.position = 'absolute'; bgCanvas.style.zIndex = '0'; bgCanvas.style.pointerEvents = 'none'; 
        document.getElementById('core-subpage-0').appendChild(bgCanvas, document.getElementById('core0-interaction-layer'));
        const bgCtx = bgCanvas.getContext('2d');
        const starsArray = Array.from({length: 300}, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5, a: Math.random() }));

        let lastT = performance.now();

        function render(now) {
            let dt = Math.min((now - lastT) / 1000.0, 0.1); lastT = now;
            let elapsed = now / 1000.0;

            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) { 
                canvas.width = window.innerWidth; canvas.height = window.innerHeight; 
                bgCanvas.width = canvas.width; bgCanvas.height = canvas.height;
            }

            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            bgCtx.fillStyle = '#ffffff';
            starsArray.forEach(star => {
                let twinkle = 0.4 + 0.6 * Math.sin(elapsed * 2.0 + star.x * 100);
                bgCtx.globalAlpha = star.a * twinkle;
                bgCtx.shadowBlur = star.r * 5; bgCtx.shadowColor = '#ffffff';
                bgCtx.beginPath(); bgCtx.arc(star.x * bgCanvas.width, star.y * bgCanvas.height, star.r, 0, Math.PI*2); bgCtx.fill();
            });
            bgCtx.shadowBlur = 0; bgCtx.globalAlpha = 1.0;

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); 
            gl.clearColor(0,0,0,0); 
            gl.clear(gl.COLOR_BUFFER_BIT);

            if (modeAuto.checked) {
                globalSystemAngle += dt * 0.1; 
                timeSlider.value = ((globalSystemAngle / (2 * Math.PI)) * 365) % 365;
            } else {
                globalSystemAngle = (timeSlider.value / 365.0) * 2 * Math.PI;
            }

            gl.uniform3f(lRes, gl.canvas.width, gl.canvas.height, 1.0); 
            gl.uniform3f(lCam, camTh, camPh, camR);
            gl.uniform1f(lTime, elapsed); 
            gl.uniform1f(lEarthAngle, globalSystemAngle); 
            gl.uniform1f(lMoonAngle, globalSystemAngle * 13.37); 
            gl.uniform1f(lInc, currentTilt);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(render);
        }
        
        updateLanguageUI();
        requestAnimationFrame(render);
  };
})();


// ====== core-02.js ======
// CORE Subpage 1
(function() {
  var _mod = { initialized: false, animFrameId: null };
  MoonApp.CoreSubpages._register(1, _mod);

  _mod.init = function() {
    if (_mod.initialized) return;
    _mod.initialized = true;
// ==========================================
        // Utilities & Math
        // ==========================================
        function smoothstep(min, max, value) {
            let x = Math.max(0, Math.min(1, (value - min) / (max - min)));
            return x * x * (3 - 2 * x);
        }

        // ==========================================
        // UI & i18n
        // ==========================================
        let currentLang = 'zh'; 
        let currentMode = 'eye';
        let menuVisible = true;

        const i18n = {
            zh: {
                title: "全食透镜与血月显影",
                desc: "<b>为什么月球会在全食阶段突然变成血红色？</b><br>当月球完全进入地球本影时，直射阳光被物理切断。但此时地球外围的<b>大气层就像一个巨大的透镜</b>：它将短波蓝光向外散射，同时将<b>波长较长的红光向内折射（弯曲）</b>进本影区，重新点亮月表。<br>拖动下方滑块观察：当大气中充满<b>火山灰等气溶胶</b>时，这道仅存的红光也会被绞杀，导致折射光锥坍塌，血月彻底变为死黑。",
                modeEye: "人眼视效 (OPTICAL EYE)", modePhys: "物理直出 (RAW PHYSICS)",
                lblPhase: "月食轨道进度 (ORBITAL PHASE)", lblAero: "大气火山灰浓度 (AEROSOL DENSITY)",
                langToggle: "ENGLISH",
                hideConsole: "隐藏面板 (HIDE)", references: "参考资料 (REFERENCES)",
                danjon0Title: "月食亮度评级：L=0 (极暗黑月)",
                danjon0Desc: "<i>*注：L为丹戎等级(Danjon Scale)，用于衡量月食亮度，L=0为最暗。</i><br>大气极度浑浊（如火山大爆发）。大气透镜被物理阻断，长波红光中途暴毙无法完成折射。月球呈纯黑/深灰色，几乎隐形。",
                danjon1Title: "月食亮度评级：L=1/L=2 (暗褐/深红)",
                danjon1Desc: "<i>*注：L为丹戎等级(Danjon Scale)，用于衡量月食亮度。</i><br>气溶胶浓厚。光流发生严重衰减，仅有极少数红光勉强完成弯曲折射，月球呈现生锈般的暗红或褐色。",
                danjon3Title: "月食亮度评级：L=3 (砖红光晕)",
                danjon3Desc: "<i>*注：L为丹戎等级(Danjon Scale)，用于衡量月食亮度。</i><br>常规大气条件。红光受轻度衰减，本影中心略暗，边缘透出极其明亮的橘红色透射光晕。",
                danjon4Title: "月食亮度评级：L=4 (明亮血月)",
                danjon4Desc: "<i>*注：L为丹戎等级(Danjon Scale)，用于衡量月食亮度，L=4为最亮。</i><br>大气极度纯净。长波红光穿透率极高，向内弯曲的深红折射光锥能量充沛，全食阶段极为耀眼。",
                statFullTitle: "当前状态：满月 (FULL MOON)", statFullDesc: "轨道未被遮挡，阳光直射无衰减的满月状态。",
                statPenTitle: "当前状态：偏食入界 (PENUMBRA)", statPenDesc: "进入半影区，极地散射场开始干涉。光度开始缓慢下降。",
                statWashTitle: "⚠️ 视觉预警：强光洗刷效应 (WASHOUT EFFECT)", statWashDesc: "高对比度导致微弱的红光跌出视网膜感光下限，视觉呈现<span class='highlight-w'>死黑缺口</span>。",
                statLostTitle: "❌ 物理阻断：信号丢失 (SIGNAL LOST)", statLostDesc: "由于<b>大气被火山灰完全封锁，红光光束在物理层面上已断裂。月面彻底失去光子来源，化为真正的死黑岩石。</b>",
                statRawTitle: "✅ 物理直出：上帝视角 (RAW PHYSICS)", statRawDesc: "洗刷效应关闭。当前大气条件允许红光折射穿透，<b>隐藏的血月客观显影。</b>",
                statBlackTitle: "当前状态：死寂黑月 (BLACK MOON)", statBlackDesc: "全食阶段。由于重度火山灰阻挡透镜，没有一丝红光折射弯曲成功，月球失去所有光源，仿佛从宇宙中抹除。",
                statBloodTitle: "当前状态：完美血月 (TOTALITY)", statBloodDesc: "全食阶段，白光彻底剥离！经过地球大气层折射弯曲的<b>长波红光</b>成为绝对主导光源，血月显影。",
                tab1: "引言", tab2: "上一页", tab3: "下一页", tab4: "首页"
            },
            en: {
                title: "TOTALITY LENS & BLOOD MOON",
                desc: "<b>Why does the Moon suddenly turn blood-red during a total eclipse?</b><br>When the Moon completely enters Earth's umbra, direct sunlight is blocked. But Earth's atmosphere acts like a giant lens—it scatters short-wave blue light outwards and <b>refracts (bends) long-wave red light inwards</b> into the darkness, relighting the Moon's surface.<br>Drag the sliders: Watch how <b>volcanic aerosols</b> choke this remaining red light, breaking the refraction cone and plunging the Blood Moon into pitch black.",
                modeEye: "OPTICAL EYE (人眼视效)", modePhys: "RAW PHYSICS (物理直出)",
                lblPhase: "ORBITAL PHASE (月食轨道进度)", lblAero: "AEROSOL DENSITY (大气火山灰浓度)",
                langToggle: "中文",
                hideConsole: "HIDE (隐藏面板)", references: "REFERENCES (参考资料)",
                danjon0Title: "DANJON SCALE: L=0 (DARK MOON)",
                danjon0Desc: "<i>*Note: Danjon Scale measures eclipse brightness, L=0 being the darkest.</i><br>Extremely turbid atmosphere. The atmospheric lens is blocked, red rays perish mid-transit and fail to refract. The Moon is pitch black.",
                danjon1Title: "DANJON SCALE: L=1/L=2 (DARK RED)",
                danjon1Desc: "<i>*Note: Danjon Scale measures eclipse brightness.</i><br>Dense aerosols. Severe attenuation of the light flow. Only a fraction of red light survives the bend. The Moon presents a rusty brownish hue.",
                danjon3Title: "DANJON SCALE: L=3 (BRICK RED)",
                danjon3Desc: "<i>*Note: Danjon Scale measures eclipse brightness.</i><br>Standard conditions. Red light suffers mild attenuation. The umbra center is slightly dark with bright red refractive edges.",
                danjon4Title: "DANJON SCALE: L=4 (BRIGHT BLOOD)",
                danjon4Desc: "<i>*Note: Danjon Scale measures eclipse brightness, L=4 being the brightest.</i><br>Extremely pure atmosphere. High penetration rate. The inward-bending deep red refraction cone is dazzling.",
                statFullTitle: "STATUS: FULL MOON (满月)", statFullDesc: "Orbit unobstructed. Direct sunlight, standard full moon.",
                statPenTitle: "STATUS: PENUMBRAL ECLIPSE (偏食入界)", statPenDesc: "Polar scattering field interfering. Luminosity begins to drop.",
                statWashTitle: "⚠️ SENSOR: WASHOUT EFFECT (强光洗刷)", statWashDesc: "Glare washout active. High contrast causes faint red light to drop below detection threshold, creating a <span class='highlight-w'>pitch-black void</span>.",
                statLostTitle: "❌ PHYSICS: SIGNAL LOST (信号丢失)", statLostDesc: "Due to <b>extreme aerosol blockage, the red light beam is physically broken. The lunar surface loses all photons. True pitch-black rock.</b>",
                statRawTitle: "✅ SENSOR: RAW PHYSICS (上帝视角)", statRawDesc: "Washout disabled. Current atmosphere allows red light refraction. <b>Blood moon is physically visible.</b>",
                statBlackTitle: "STATUS: BLACK MOON (死寂黑月)", statBlackDesc: "Heavy volcanic ash prevents any red light from successfully bending through the lens. The Moon loses all illumination.",
                statBloodTitle: "STATUS: TOTALITY (完美血月)", statBloodDesc: "Direct white light is stripped! <b>Long-wave red rays</b> refracted through Earth's atmosphere take absolute dominance.",
                tab1: "INTRO", tab2: "PREV", tab3: "NEXT", tab4: "HOME"
            }
        };

        const ui = {
            prog: document.getElementById('core1-ui-progress'),
            aerosol: document.getElementById('core1-ui-aerosol'),
            danjonTitle: document.getElementById('core1-danjon-title'),
            danjonDesc: document.getElementById('core1-danjon-desc'),
            statusTitle: document.getElementById('core1-term-status-title'),
            statusDesc: document.getElementById('core1-term-status-desc'),
            btnEye: document.getElementById('core1-btn-eye'),
            btnPhys: document.getElementById('core1-btn-phys'),
            moonSlider: document.getElementById('core1-moon-slider'),
            aerosolSlider: document.getElementById('core1-aerosol-slider')
        };

        function updateLanguageUI() {
            const dict = i18n[currentLang];
            document.getElementById('core1-ui-title').innerHTML = dict.title;
            document.getElementById('core1-ui-desc').innerHTML = dict.desc;
            document.getElementById('core1-lbl-phase').innerHTML = dict.lblPhase;
            document.getElementById('core1-lbl-aero').innerHTML = dict.lblAero;
            document.getElementById('lang-btn').innerText = dict.langToggle;
            document.getElementById('menu-toggle-text').innerText = dict.hideConsole;
            document.getElementById('lbl-ref').innerText = dict.references;
            document.getElementById('tab-1').innerText = dict.tab1;
            document.getElementById('tab-2').innerText = dict.tab2;
            document.getElementById('tab-3').innerText = dict.tab3;
            document.getElementById('tab-4').innerText = dict.tab4;
            ui.btnEye.innerText = dict.modeEye;
            ui.btnPhys.innerText = dict.modePhys;
        }

        function toggleLanguage() {
            currentLang = currentLang === 'zh' ? 'en' : 'zh';
            updateLanguageUI();
        }

        _mod.setMode = function(mode) {
            currentMode = mode;
            var eyeBtn = document.getElementById('core1-btn-eye');
            var physBtn = document.getElementById('core1-btn-phys');
            if (mode === 'eye') {
                eyeBtn.classList.add('active'); physBtn.classList.remove('active');
            } else {
                physBtn.classList.add('active'); eyeBtn.classList.remove('active');
            }
        }

        function toggleMenuDrawer() {
            const labUi = document.getElementById('core1-lab-ui');
            menuVisible = !menuVisible;
            if (menuVisible) {
                labUi.classList.remove('ui-hidden');
            } else {
                labUi.classList.add('ui-hidden');
            }
        }

        function switchTopTab(element) {
            document.querySelectorAll('.retro-tab').forEach(tab => tab.classList.remove('active-tab'));
            element.classList.add('active-tab');
        }

        // ==========================================
        // WebGL 3D 材质生成器
        // ==========================================
        const earthGLCanvas = document.createElement('canvas');
        earthGLCanvas.width = 256; earthGLCanvas.height = 256;
        const egl = earthGLCanvas.getContext('webgl2', { alpha: true, antialias: true });

        const moonGLCanvas = document.createElement('canvas');
        moonGLCanvas.width = 256; moonGLCanvas.height = 256;
        const mgl = moonGLCanvas.getContext('webgl2', { alpha: true, antialias: true });

        const mVs = `#version 300 es
        in vec4 aPos; void main() { gl_Position = aPos; }`;

        // ★ 核心回滚：完全使用原始版本的地球着色器，无额外亮度，无晚霞修改
        const eFs = `#version 300 es
        precision highp float;
        out vec4 FragColor;
        uniform float iTime;
        uniform float uClarity;
        
        #define PI 3.14159265
        mat2 r2d(float a) { return mat2(cos(a),-sin(a),sin(a),cos(a));}
        float hash12(vec2 p, float scale) {
            p = mod(p, scale);
            return fract(sin(dot(p, vec2(12.9898, 4.1414))) * 43758.5453);
        }
        float noise(vec2 p, float scale) {
            p *= scale; vec2 f = fract(p); p = floor(p);
            return mix(mix(hash12(p, scale), hash12(p + vec2(1.0, 0.0), scale), f.x),
                       mix(hash12(p + vec2(0.0, 1.0), scale), hash12(p + vec2(1.0, 1.0), scale), f.x), f.y);
        }
        float fbm4(vec2 p, float scale) {
            float s = 0.0, m = 0.0, a = 1.0;
            for(int i = 0; i < 4; i++) { s += a * noise(p, scale); m += a; a *= 0.6; scale *= 2.0; }
            return s / m;
        }
        float fbm7(vec2 p, float scale) {
            float s = 0.0, m = 0.0, a = 1.0;
            for(int i = 0; i < 7; i++) { s += a * noise(p, scale); m += a; a *= 0.6; scale *= 2.0; }
            return s / m;
        }
        float swirly_fbm6(vec2 p, float scale) {
            p -= iTime * 0.003; 
            float s = 0.0, m = 0.0, a = 1.0;
            for(int i = 0; i < 6; i++) {
                s += a * noise(p + iTime * 0.003 * a, scale); m += a; a *= 0.6; scale *= 2.0;
                p += vec2(cos(s * PI*2.0), sin(s * PI*2.0)) / scale * 0.4;
            }
            return s / m;
        }

        // 统一色系至 Celestial 色阶
        const vec3 SUN_COLOR = vec3(1.0, 0.85, 0.6);     
        const vec3 LAND_COLOR = vec3(0.25, 0.1, 0.2);   
        const vec3 JUNGLE_COLOR = vec3(0.15, 0.05, 0.15); 
        const vec3 DESERT_COLOR = vec3(0.6, 0.3, 0.3); 
        const vec3 SNOW_COLOR = vec3(1.0, 0.8, 0.9);  
        const vec3 OCEAN_COLOR = vec3(0.1, 0.05, 0.2);   
        const vec3 CLOUD_COLOR = vec3(1.0, 0.6, 0.7);

        void main() {
            vec2 uv = gl_FragCoord.xy / 256.0 * 2.0 - 1.0;
            float d2 = dot(uv, uv);
            if (d2 > 1.0) { FragColor = vec4(0.0); return; } 
            
            vec3 n = normalize(vec3(uv, sqrt(1.0 - d2)));
            vec3 normLocal = n;
            normLocal.xz *= r2d(-iTime * 0.08); 
            
            vec2 muv = vec2(atan(normLocal.z, normLocal.x) * 0.5, acos(clamp(-normLocal.y, -1.0, 1.0))) / PI;
            
            float continent = fbm7(muv, 4.0);
            float temp = fbm4(muv * 3.0 + vec2(31.33), 1.0);
            float humid = fbm4(muv * 3.0 - vec2(54.1), 1.0);

            float ocean_sz = 0.55;
            float land = smoothstep(0.01, 0.0, ocean_sz - continent);
            
            vec3 earthCol = LAND_COLOR;
            earthCol = mix(earthCol, DESERT_COLOR, smoothstep(0.25, 0.1, humid));
            earthCol = mix(earthCol, JUNGLE_COLOR, smoothstep(0.1, 0.3, humid) * smoothstep(0.3, 0.4, temp));
            earthCol = mix(earthCol, SNOW_COLOR, smoothstep(0.3, 0.2, temp));
            
            earthCol *= sqrt(continent) * land * 1.2 * smoothstep(1.0, 0.99, abs(normLocal.y));
            earthCol += (1.0 - continent) * smoothstep(ocean_sz, ocean_sz-0.01, continent) * OCEAN_COLOR;
            earthCol.rgb *= sqrt(1.0 + 0.1 * cos(sqrt(continent) * 512.0));

            float clouds = swirly_fbm6(-muv, 11.0) * smoothstep(1.0, 0.99, abs(normLocal.y));
            clouds = exp(-pow(clouds, 6.0) * 32.0);

            vec3 l = normalize(vec3(-1.0, 0.2, 0.5)); 
            float diff = max(dot(n, l), 0.0);
            
            vec3 cloudColorTint = mix(CLOUD_COLOR, vec3(1.0, 0.5, 0.4), smoothstep(-0.2, 0.2, dot(n, l)) * smoothstep(0.5, 0.1, dot(n, l)));
            earthCol = mix(earthCol, cloudColorTint, clouds);

            vec3 objCol = vec3(0.0);
            if (diff > 0.0) {
                // 完全恢复原有的地球反射光强参数
                objCol = earthCol * pow(diff, 0.7) * 3.0 * SUN_COLOR; 
            } else {
                float backLight = max(0.0, dot(n, vec3(-l.x, -l.y, -l.z))); 
                objCol = vec3(0.005, 0.01, 0.02) * earthCol * backLight;
                
                float cityLights = fbm4(normLocal.xy * 15.0 + 100.0, 10.0);
                float cityThreshold = smoothstep(0.75, 0.95, cityLights) * land; 
                vec3 cityCol = mix(vec3(1.0, 0.4, 0.8), vec3(0.2, 0.8, 1.0), hash12(normLocal.xy, 10.0));
                objCol += cityCol * cityThreshold * 3.0 * uClarity; 
            }

            float fresnel = 1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0);
            float innerSunDot = dot(n, l);
            float innerSunset = smoothstep(-0.5, 0.1, innerSunDot) * smoothstep(0.3, -0.2, innerSunDot);
            
            vec3 sunsetAtmo = mix(vec3(0.1, 0.5, 1.0), vec3(1.0, 0.6, 0.1), innerSunset * 1.5) * pow(fresnel, 3.0) * smoothstep(-0.4, 0.3, innerSunDot);
            vec3 nightAtmo = vec3(0.02, 0.05, 0.2) * pow(fresnel, 5.0) * smoothstep(0.0, -0.8, innerSunDot) * 0.8;
            
            objCol += (sunsetAtmo + nightAtmo) * (0.2 + 0.8 * uClarity);

            float alpha = smoothstep(1.0, 0.96, sqrt(d2));
            FragColor = vec4(objCol, alpha);
        }`;

        const mFs = `#version 300 es
        precision highp float;
        out vec4 FragColor;
        uniform float iTime;
        #define PI 3.14159265
        mat2 r2d(float a) { return mat2(cos(a),-sin(a),sin(a),cos(a));}
        vec3 hash33(vec3 p) {
            p = fract(p * vec3(17.16, 31.79, 47.11));
            p += dot(p, p.yxz + 19.19); return fract((p.xxy + p.yxx) * p.zyx);
        }
        float getBump(vec3 p) {
            float h = 0.0; float freq = 0.6; float amp = 1.0;
            for(int layer = 0; layer < 4; layer++) {
                vec3 ip = floor(p * freq); vec3 fp = fract(p * freq);
                float minDist = 2.0; float radius = 0.5; float craterShape = 0.0;
                for(int i=-1; i<=1; i++) {
                    for(int j=-1; j<=1; j++) {
                        for(int k=-1; k<=1; k++) {
                            vec3 offset = vec3(float(i), float(j), float(k));
                            vec3 h3 = hash33(ip + offset); vec3 diff = offset + h3 - fp; float d = length(diff);
                            if (h3.z > 0.45) continue; 
                            if(d < minDist) { minDist = d; radius = 0.2 + 0.3 * h3.x; }
                        }
                    }
                }
                float x = minDist / radius;
                if (x < 1.0) { craterShape = (x * x - 1.0) + smoothstep(0.5, 0.8, x) * smoothstep(1.0, 0.8, x) * 1.6; }
                h += craterShape * amp; freq *= 2.1; amp *= 0.4;
            }
            h += fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 0.02;
            return h * 0.8; 
        }
        float worldBump(vec3 p) { p.xz *= r2d(iTime * 0.2); p.xy *= r2d(iTime * 0.05); return getBump(p); }
        vec3 getNormalPlanet(vec3 p) {
            vec3 n = normalize(p); vec2 e = vec2(0.01, 0.0); float b = worldBump(p);
            vec3 grad = vec3(worldBump(p + e.xyy) - b, worldBump(p + e.yxy) - b, worldBump(p + e.yyx) - b) / e.x;
            return normalize(n - grad * 6.0); 
        }
        void main() {
            vec2 uv = gl_FragCoord.xy / 256.0 * 2.0 - 1.0;
            float r2 = 1.0; float d2 = dot(uv, uv);
            if (d2 > r2) { FragColor = vec4(0.0); return; } 
            float z = sqrt(r2 - d2);
            vec3 pUV = vec3(uv, z); vec3 pScaled = pUV * 14.0; 
            vec3 n = getNormalPlanet(pScaled);
            
            vec3 ld = normalize(vec3(-1.0, 0.2, 0.5)); vec3 rd = vec3(0.0, 0.0, -1.0); vec3 hv = normalize(ld - rd);
            float dif = clamp(dot(n, ld), 0.0, 1.0);
            float spec = pow(clamp(dot(n, hv), 0.0, 1.0), 30.0) * 2.0; 
            float fresnel = pow(1.0 - clamp(dot(vec3(0.0, 0.0, 1.0), n), 0.0, 1.0), 2.2); 
            
            // 贴合绯红的月球质感
            vec3 lightSilver = vec3(255.0, 255.0, 255.0)/255.0; 
            vec3 darkRock = vec3(120.0, 100.0, 120.0)/255.0;     
            vec3 cyberCyan = vec3(255.0, 42.0, 75.0)/255.0;        
            
            vec3 baseColor = mix(darkRock, lightSilver, dif);
            vec3 sunlit = baseColor * (dif * 1.5 + 0.6) + lightSilver * fresnel * 0.8 + spec;                              
            float planetSketch = clamp((sin((uv.y - uv.x + n.x * 0.015 + n.y * 0.015) * 200.0) + 0.8) * 200.0, 0.0, 1.0);
            vec3 darkLineColor = darkRock * 0.6 + cyberCyan * fresnel * 0.8; 
            
            vec3 col = mix(sunlit, darkLineColor, planetSketch);
            float alpha = smoothstep(1.0, 0.95, sqrt(d2));
            FragColor = vec4(col, alpha);
        }`;

        let eProg, eTimeLoc, eClarityLoc, mProg, mTimeLoc;
        
        const compileMGL = (gl, type, src) => { 
            const s = gl.createShader(type); 
            gl.shaderSource(s, src); 
            gl.compileShader(s); 
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.error('Shader Compile Error: ', gl.getShaderInfoLog(s));
                gl.deleteShader(s);
                return null;
            }
            return s; 
        };
        
        if (egl) {
            eProg = egl.createProgram();
            egl.attachShader(eProg, compileMGL(egl, egl.VERTEX_SHADER, mVs));
            egl.attachShader(eProg, compileMGL(egl, egl.FRAGMENT_SHADER, eFs));
            egl.linkProgram(eProg);
            const eBuf = egl.createBuffer();
            egl.bindBuffer(egl.ARRAY_BUFFER, eBuf);
            egl.bufferData(egl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), egl.STATIC_DRAW);
            const ePosLoc = egl.getAttribLocation(eProg, "aPos");
            egl.enableVertexAttribArray(ePosLoc);
            egl.vertexAttribPointer(ePosLoc, 2, egl.FLOAT, false, 0, 0);
            eTimeLoc = egl.getUniformLocation(eProg, "iTime");
            eClarityLoc = egl.getUniformLocation(eProg, "uClarity");
        }

        if (mgl) {
            mProg = mgl.createProgram();
            mgl.attachShader(mProg, compileMGL(mgl, mgl.VERTEX_SHADER, mVs));
            mgl.attachShader(mProg, compileMGL(mgl, mgl.FRAGMENT_SHADER, mFs));
            mgl.linkProgram(mProg);
            const mBuf = mgl.createBuffer();
            mgl.bindBuffer(mgl.ARRAY_BUFFER, mBuf);
            mgl.bufferData(mgl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), mgl.STATIC_DRAW);
            const mPosLoc = mgl.getAttribLocation(mProg, "aPos");
            mgl.enableVertexAttribArray(mPosLoc);
            mgl.vertexAttribPointer(mPosLoc, 2, mgl.FLOAT, false, 0, 0);
            mTimeLoc = mgl.getUniformLocation(mProg, "iTime");
        }

        // ==========================================
        // 2D 物理折射场渲染管线
        // ==========================================
        const canvas = document.getElementById('sim-canvas-core');
        const ctx = canvas.getContext('2d', { alpha: true }); 
        
        const rEarthGlobal = 60;
        
        let width, height;
        let globalTime = 0;
        let lastTime = performance.now();
        
        // ★ 核心修复：引入设备像素比 (DPR)，解决高分屏文字模糊问题
        let bgCanvas, bgCtx;
        function createBackground() {
            const dpr = window.devicePixelRatio || 1;
            width = Math.max(1, window.innerWidth);
            height = Math.max(1, window.innerHeight);

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);

            bgCanvas = document.createElement('canvas');
            bgCanvas.width = width * dpr;
            bgCanvas.height = height * dpr;
            bgCtx = bgCanvas.getContext('2d', { willReadFrequently: true });
            bgCtx.scale(dpr, dpr);

            let bgGrad = bgCtx.createLinearGradient(0, 0, 0, height);
            bgGrad.addColorStop(0, '#0d0214');
            bgGrad.addColorStop(0.5, '#1a0526'); 
            bgGrad.addColorStop(1, '#2a0a3a');
            bgCtx.fillStyle = bgGrad;
            bgCtx.fillRect(0, 0, width, height);

            let sunX = width * 0.1;
            let sunY = height * 0.5;
            let sunGrad = bgCtx.createRadialGradient(sunX, sunY, 0, sunX, sunY, width * 0.6);
            sunGrad.addColorStop(0, 'rgba(255, 200, 180, 0.5)');
            sunGrad.addColorStop(0.15, 'rgba(255, 42, 75, 0.2)');
            sunGrad.addColorStop(0.4, 'rgba(255, 42, 75, 0.05)');
            sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            bgCtx.globalCompositeOperation = 'screen';
            bgCtx.fillStyle = sunGrad;
            bgCtx.fillRect(0, 0, width, height);
            bgCtx.globalCompositeOperation = 'source-over';
            
            let imgData = bgCtx.getImageData(0, 0, bgCanvas.width, bgCanvas.height);
            let data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                let noise = (Math.random() - 0.5) * 6; 
                data[i] = Math.max(0, Math.min(255, data[i] + noise));
                data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
                data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
            }
            bgCtx.putImageData(imgData, 0, 0);
        }
        
        const starsArray = Array.from({length: 300}, () => ({
            x: Math.random() * 3000,
            y: Math.random() * 2000,
            r: Math.random() * 1.8,
            a: Math.random()
        }));

        function resize() {
            createBackground(); 
        }
        window.addEventListener('resize', resize);
        resize();

        class OpticalPhoton {
            constructor(rEarth) { 
                this.rEarth = rEarth;
                this.reset(); 
            }
            reset() {
                this.x = -width * 0.45 + (Math.random() * 50); 
                this.vx = 4 + Math.random() * 4;
                this.vy = 0;
                this.history = [];
                this.maxLength = 15 + Math.random() * 15; 
                this.life = 1.0;
                this.noiseSeed = Math.random() * 100;
                
                this.baseY = (Math.random() - 0.5) * (this.rEarth * 2.8);
                this.y = this.baseY;
                
                let typeRand = Math.random();
                if (Math.abs(this.baseY) < this.rEarth * 0.95) {
                    this.type = 'HitEarth'; 
                    this.rgb = '255, 230, 180'; 
                    this.targetX = -Math.sqrt(this.rEarth * this.rEarth - this.baseY * this.baseY);
                } else if (typeRand < 0.4) {
                    this.type = 'Red'; this.rgb = '255, 42, 75'; 
                } else if (typeRand < 0.7) {
                    this.type = 'Blue'; this.rgb = '142, 158, 223'; 
                } else {
                    this.type = 'Yellow'; this.rgb = '255, 180, 100';
                }
                
                this.state = 'travel'; 
                this.explosionTimer = 0;
            }
            update(aerosolFactor, orbitX, moonY, mRadius) {
                if (this.state === 'explode') {
                    this.explosionTimer++;
                    if (this.explosionTimer > 20) this.reset();
                    return;
                }
                
                this.history.push({x: this.x, y: this.y});
                if (this.history.length > this.maxLength) this.history.shift();

                this.x += this.vx;
                let n = Math.sin(globalTime * 0.1 + this.noiseSeed) * 0.5;

                let distToMoon = Math.hypot(this.x - orbitX, this.y - moonY);
                if (distToMoon <= mRadius && this.type !== 'HitEarth') {
                    if (this.type === 'Red' && Math.random() > aerosolFactor * 0.1) {
                        this.state = 'explode';
                        return;
                    }
                }

                if (this.type === 'HitEarth') {
                    if (this.x >= this.targetX) this.state = 'explode'; 
                } 
                else if (this.x > -this.rEarth && this.x < this.rEarth * 2) {
                    let isTop = this.y < 0;
                    let bendDir = isTop ? 1 : -1; 
                    
                    if (this.type === 'Blue' || this.type === 'Yellow') {
                        this.state = 'scatter';
                        this.vy -= bendDir * (0.3 + Math.random()*0.2); 
                        this.life -= 0.03; 
                    } else if (this.type === 'Red') {
                        this.state = 'refract';
                        if (Math.random() < aerosolFactor * 0.05) {
                            this.state = 'explode'; 
                        } else {
                            this.vy += bendDir * 0.12; 
                            this.life -= (0.002 + aerosolFactor * 0.01); 
                        }
                    }
                } else {
                    if (this.type === 'Red') this.life -= (0.005 + aerosolFactor * 0.02);
                    else if (this.state === 'scatter') this.life -= 0.05;
                }

                this.y += this.vy + n;
                if (this.life <= 0 || this.x > width * 0.6 || Math.abs(this.y) > height * 0.8) this.reset();
            }
            draw(ctx) {
                if (this.state === 'explode') {
                    let t = this.explosionTimer / 20.0; 
                    let r = 5 + t * 20; 
                    let a = 1.0 - t;
                    
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    
                    ctx.strokeStyle = `rgba(${this.rgb}, ${a})`;
                    ctx.lineWidth = 1.5 * a;
                    ctx.setLineDash([r * 0.6, r * 0.4]); 
                    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
                    ctx.setLineDash([]);
                    
                    let flareL = 35 * a * (1.0 - t); 
                    let flareW = 1.5 * a;            
                    ctx.fillStyle = `rgba(${this.rgb}, ${a * 0.9})`;
                    
                    ctx.beginPath(); 
                    ctx.moveTo(-flareL, 0); ctx.lineTo(0, -flareW); ctx.lineTo(flareL, 0); ctx.lineTo(0, flareW);
                    ctx.fill();
                    
                    let flareL2 = 15 * a * (1.0 - t); 
                    ctx.beginPath();
                    ctx.moveTo(-flareW, 0); ctx.lineTo(0, -flareL2); ctx.lineTo(flareW, 0); ctx.lineTo(0, flareL2);
                    ctx.fill();

                    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = `rgba(${this.rgb}, 1)`;
                    ctx.beginPath(); ctx.arc(0, 0, 2.5 * a, 0, Math.PI * 2); ctx.fill();
                    
                    ctx.restore();
                    return;
                }
                if (this.history.length < 2) return;
                
                ctx.beginPath(); ctx.moveTo(this.history[0].x, this.history[0].y);
                for (let i = 1; i < this.history.length; i++) ctx.lineTo(this.history[i].x, this.history[i].y);
                
                ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                
                let blur = (this.type === 'Red' && this.state === 'refract') ? 10 : 0;
                if (blur > 0) { ctx.shadowBlur = blur * this.life; ctx.shadowColor = `rgba(${this.rgb}, 1.0)`; }
                
                ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(${this.rgb}, ${this.life * 0.8})`; ctx.stroke(); 
                ctx.shadowBlur = 0; 
                ctx.fillStyle = `rgba(255,255,255,${this.life})`;
                ctx.beginPath(); ctx.arc(this.x, this.y, 1, 0, Math.PI*2); ctx.fill();
            }
        }

        const photons = Array.from({length: 200}, () => { 
            let p = new OpticalPhoton(rEarthGlobal);
            for(let i=0; i<150; i++) p.update(0, 9999, 0, 0); 
            return p;
        });

        function drawInfographics(clarity) {
            ctx.save();
            ctx.font = 'bold 10px "Inter", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '1px';
            
            ctx.fillStyle = '#8e9edf';
            let txtBlue = currentLang === 'en' ? "SHORT-WAVE SCATTERING" : "短波强散射区";
            let subBlue = currentLang === 'en' ? "(BLUE SPECTRUM LOST)"  : "(蓝光损耗逃逸)";
            ctx.fillText(txtBlue, 100, -180);
            ctx.fillText(subBlue, 100, -165);
            ctx.beginPath(); 
            ctx.moveTo(95, -180); 
            ctx.lineTo(70, -180); 
            ctx.lineTo(40, -120); 
            ctx.strokeStyle = 'rgba(142, 158, 223, 0.8)'; ctx.stroke();

            if (clarity > 0.2) {
                ctx.fillStyle = '#ff4d6d';
                let txtRed = currentLang === 'en' ? "LONG-WAVE REFRACTION" : "长波透镜折射";
                let subRed = currentLang === 'en' ? "(RED RAYS BENT INTO UMBRA)" : "(红光向内弯曲进入本影)";
                ctx.fillText(txtRed, 180, 100);
                ctx.fillText(subRed, 180, 115);
                ctx.beginPath(); 
                ctx.moveTo(175, 100); 
                ctx.lineTo(150, 100); 
                ctx.lineTo(80, 50); 
                ctx.strokeStyle = 'rgba(255, 77, 109, 0.8)'; ctx.stroke();
            }

            ctx.fillStyle = '#fff';
            let txtAtmo = currentLang === 'en' ? "ATMOSPHERIC LENS" : "地球大气层透镜";
            ctx.textAlign = 'right';
            ctx.fillText(txtAtmo, -90, -100);
            ctx.beginPath(); 
            ctx.moveTo(-85, -100); 
            ctx.lineTo(-40, -100); 
            ctx.lineTo(-20, -rEarthGlobal - 5); 
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.stroke();
            
            ctx.beginPath(); ctx.arc(-20, -rEarthGlobal - 5, 2, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.fill();
            
            ctx.beginPath(); ctx.arc(40, -120, 2, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(142, 158, 223, 0.8)'; ctx.fill();

            if (clarity > 0.2) {
                ctx.beginPath(); ctx.arc(80, 50, 2, 0, Math.PI*2);
                ctx.fillStyle = 'rgba(255, 77, 109, 0.8)'; ctx.fill();
            }

            ctx.restore();
        }

        function drawOpticalRays(sunX, rEarth, orbitX, clarity) {
            ctx.save();
            let rayCount = 20;
            let atmoHeight = 35;
            let dashSpeed = globalTime * 2.5;
            
            for (let i = 0; i <= rayCount; i++) {
                let y = -rEarth - atmoHeight + (i / rayCount) * (rEarth * 2 + atmoHeight * 2);
                let absY = Math.abs(y);
                let sign = y < 0 ? -1 : 1;
                
                if (absY < rEarth - 1) {
                    let hitX = -Math.sqrt(rEarth*rEarth - y*y);
                    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                    ctx.beginPath(); ctx.moveTo(sunX, y); ctx.lineTo(hitX, y);
                    ctx.setLineDash([]); ctx.stroke();
                    
                    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                    ctx.beginPath(); ctx.moveTo(sunX, y); ctx.lineTo(hitX, y);
                    ctx.setLineDash([4, 40]); ctx.lineDashOffset = -dashSpeed; ctx.stroke();
                } else {
                    let dist = absY - rEarth; 
                    let ratio = dist / atmoHeight; 
                    let startBendX = -rEarth; 
                    
                    let bluePath = new Path2D();
                    bluePath.moveTo(sunX, y);
                    bluePath.lineTo(startBendX, y);
                    bluePath.quadraticCurveTo(rEarth * 0.5, y, 180, y + sign * (120 + ratio * 150));
                    
                    ctx.lineWidth = 1.0; ctx.strokeStyle = `rgba(142, 158, 223, ${0.2 * (1 - ratio)})`;
                    ctx.setLineDash([]); ctx.stroke(bluePath);
                    ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(142, 158, 223, ${0.7 * (1 - ratio)})`;
                    ctx.setLineDash([8, 60]); ctx.lineDashOffset = -dashSpeed * 1.5; ctx.stroke(bluePath);
                    
                    if (clarity > 0.05) {
                        let redPath = new Path2D();
                        redPath.moveTo(sunX, y);
                        redPath.lineTo(startBendX, y);
                        
                        let targetY = sign * (dist * 0.5); 
                        let spreadY = targetY + (ratio - 0.5) * 80; 
                        
                        redPath.quadraticCurveTo(rEarth * 0.5, y, orbitX, spreadY);
                        redPath.lineTo(orbitX + 400, spreadY + (spreadY - y) * 0.5); 
                        
                        let redAlpha = (1 - ratio) * clarity;
                        
                        ctx.lineWidth = 1.0; ctx.strokeStyle = `rgba(255, 42, 75, ${0.3 * redAlpha})`;
                        ctx.setLineDash([]); ctx.stroke(redPath);
                        
                        ctx.lineWidth = 2.0; ctx.strokeStyle = `rgba(255, 42, 75, ${0.8 * redAlpha})`;
                        ctx.shadowBlur = 10 * redAlpha; ctx.shadowColor = 'rgba(255, 42, 75, 1)';
                        ctx.setLineDash([15, 80]); ctx.lineDashOffset = -dashSpeed * 1.1; ctx.stroke(redPath);
                        ctx.shadowBlur = 0;
                    }
                }
            }
            ctx.restore();
        }

        function drawVolumetricShadows(rEarth, orbitX, penumbraY, umbraY, clarity) {
            ctx.save();
            let extendX = orbitX + 2000; 
            
            let penSlope = (penumbraY - rEarth) / orbitX;
            let penExtendY = rEarth + penSlope * extendX;
            
            ctx.beginPath(); ctx.moveTo(0, rEarth); ctx.lineTo(extendX, penExtendY); ctx.lineTo(extendX, -penExtendY); ctx.lineTo(0, -rEarth);
            let penumbraGrad = ctx.createLinearGradient(0, 0, orbitX + 500, 0); 
            penumbraGrad.addColorStop(0, 'rgba(255, 42, 75, 0.12)'); 
            penumbraGrad.addColorStop(1, 'rgba(255, 42, 75, 0.0)');
            ctx.fillStyle = penumbraGrad; ctx.fill();

            let umbSlope = (umbraY - rEarth) / orbitX;
            let umbExtendY = rEarth + umbSlope * extendX;
            
            ctx.beginPath(); ctx.moveTo(0, rEarth); ctx.lineTo(extendX, umbExtendY); ctx.lineTo(extendX, -umbExtendY); ctx.lineTo(0, -rEarth);
            let umbraGrad = ctx.createLinearGradient(0, 0, orbitX + 200, 0);
            umbraGrad.addColorStop(0, `rgba(255, 42, 75, ${0.4 * clarity})`);
            umbraGrad.addColorStop(0.5, `rgba(180, 10, 30, ${0.5 * clarity + 0.1})`);
            umbraGrad.addColorStop(1, `rgba(15, 5, 10, 0.95)`); 
            ctx.fillStyle = umbraGrad; ctx.fill();

            ctx.beginPath(); ctx.moveTo(0, rEarth); ctx.lineTo(extendX, penExtendY); ctx.moveTo(0, -rEarth); ctx.lineTo(extendX, -penExtendY);
            ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
            
            ctx.restore();
        }

        function drawEarth(rEarth, clarity) {
            ctx.save();
            
            let atmoRadius = rEarth * 1.8;
            let atmoGrad = ctx.createRadialGradient(0, 0, rEarth * 0.9, 0, 0, atmoRadius);
            atmoGrad.addColorStop(0, `rgba(150, 200, 255, ${0.5 * clarity})`); 
            atmoGrad.addColorStop(0.3, `rgba(142, 158, 223, ${0.3 * clarity})`); 
            atmoGrad.addColorStop(0.6, `rgba(255, 77, 109, ${0.2 * clarity})`); 
            atmoGrad.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = atmoGrad;
            ctx.beginPath(); ctx.arc(0, 0, atmoRadius, 0, Math.PI*2); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';

            if (egl) {
                ctx.drawImage(earthGLCanvas, -rEarth, -rEarth, rEarth*2, rEarth*2);
            } else {
                ctx.beginPath(); ctx.arc(0, 0, rEarth, 0, Math.PI*2);
                ctx.fillStyle = '#020408'; ctx.fill();
            }

            let rimGrad = ctx.createLinearGradient(-rEarth, 0, rEarth, 0);
            rimGrad.addColorStop(0, `rgba(142, 158, 223, ${0.4 * clarity})`); 
            rimGrad.addColorStop(0.4, 'rgba(142, 158, 223, 0)');
            rimGrad.addColorStop(0.7, 'rgba(255, 77, 109, 0)');
            rimGrad.addColorStop(1, `rgba(255, 77, 109, ${0.9 * clarity})`); 
            
            ctx.fillStyle = rimGrad;
            ctx.beginPath(); ctx.arc(0, 0, rEarth, 0, Math.PI*2); ctx.fill();
            
            ctx.beginPath(); ctx.arc(0, 0, rEarth + 4, 0, Math.PI*2);
            ctx.lineWidth = 6;
            let lensRing = ctx.createLinearGradient(-rEarth, 0, rEarth, 0);
            lensRing.addColorStop(0, `rgba(200, 230, 255, ${0.4 * clarity})`); 
            lensRing.addColorStop(0.5, `rgba(255, 100, 120, ${0.6 * clarity})`); 
            lensRing.addColorStop(1, `rgba(255, 42, 75, ${0.8 * clarity})`); 
            ctx.strokeStyle = lensRing;
            ctx.globalCompositeOperation = 'screen';
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';

            ctx.restore(); 
        }

        function drawMoonBody(yPos, orbitX, mRadius, penumbraY, umbraY, alpha, isMain, clarity) {
            ctx.save();
            ctx.translate(orbitX, yPos);

            let absY = Math.abs(yPos);
            let shadowStrength = Math.max(0, Math.min(1, (penumbraY + mRadius - absY) / (penumbraY - umbraY + mRadius)));
            let redReveal = currentMode === 'eye' ? Math.pow(Math.max(0, Math.min(1, (umbraY + mRadius - absY) / (mRadius * 2))), 6) : 1.0; 

            ctx.beginPath(); ctx.arc(0, 0, mRadius, 0, Math.PI * 2); ctx.clip(); 

            if (mgl) {
                ctx.globalAlpha = alpha;
                ctx.drawImage(moonGLCanvas, -mRadius, -mRadius, mRadius*2, mRadius*2);
                ctx.globalAlpha = 1.0;
            } else {
                ctx.fillStyle = `rgba(220, 230, 245, ${alpha})`; ctx.fill();
            }

            if (shadowStrength > 0) {
                let shadowGrad = ctx.createRadialGradient(0, -yPos, 0, 0, -yPos, penumbraY);
                let umbraStop = umbraY / penumbraY; 

                // 阴影底色变更为更深的紫粉调
                let deadR = 15, deadG = 5, deadB = 15; 
                let r0 = deadR + (180 * redReveal * clarity), g0 = deadG + (20 * redReveal * clarity), b0 = deadB + (20 * redReveal * clarity);
                let r1 = deadR + 5 + (160 * redReveal * clarity), g1 = deadG + 12 + (10 * redReveal * clarity), b1 = deadB + 18 + (15 * redReveal * clarity);
                let r2 = deadR + 15 + (180 * redReveal * clarity), g2 = deadG + 20 + (50 * redReveal * clarity), b2 = deadB + 20 + (10 * redReveal * clarity);
                let r3 = deadR + 25 + (200 * redReveal * clarity), g3 = deadG + 30 + (100 * redReveal * clarity), b3 = deadB + 30 + (22 * redReveal * clarity);
                
                let effectiveAlpha = alpha * shadowStrength;

                shadowGrad.addColorStop(0, `rgba(${r0}, ${g0}, ${b0}, ${0.9 * effectiveAlpha})`); 
                shadowGrad.addColorStop(umbraStop * 0.85, `rgba(${r1}, ${g1}, ${b1}, ${0.9 * effectiveAlpha})`); 
                shadowGrad.addColorStop(umbraStop, `rgba(${r2}, ${g2}, ${b2}, ${0.85 * effectiveAlpha})`); 
                shadowGrad.addColorStop(umbraStop + 0.02, `rgba(${r3}, ${g3}, ${b3}, ${0.5 * effectiveAlpha})`); 
                shadowGrad.addColorStop(umbraStop + 0.15, `rgba(30, 10, 40, ${0.1 * effectiveAlpha})`); 
                shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');                    

                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = shadowGrad;
                ctx.fillRect(-mRadius-1, -mRadius-1, mRadius*2+2, mRadius*2+2);

                let sphereShadow = ctx.createLinearGradient(-mRadius, 0, mRadius, 0); 
                sphereShadow.addColorStop(0, 'rgba(0,0,0,0)');
                sphereShadow.addColorStop(0.5, `rgba(10, 2, 15, ${0.3 * alpha})`);
                sphereShadow.addColorStop(1, `rgba(5, 1, 10, ${0.9 * alpha})`);
                ctx.fillStyle = sphereShadow;
                ctx.fillRect(-mRadius-1, -mRadius-1, mRadius*2+2, mRadius*2+2);
                
                ctx.globalCompositeOperation = 'source-over'; 
            }
            
            ctx.restore(); 

            ctx.save();
            ctx.translate(orbitX, yPos);
            
            if (isMain) {
                ctx.beginPath(); ctx.arc(0, 0, mRadius, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(142, 158, 223, 0.6)';
                ctx.lineWidth = 1; ctx.stroke();
            }
            
            let immersionFull = (umbraY + mRadius - absY) / (mRadius * 2);
            immersionFull = Math.max(0, Math.min(1, immersionFull));
            let glowIntensity = currentMode === 'eye' ? Math.pow(immersionFull, 6) : immersionFull;
            if (glowIntensity > 0.1 && isMain && clarity > 0.1) {
                ctx.beginPath(); ctx.arc(0, 0, mRadius, 0, Math.PI * 2);
                ctx.shadowBlur = 35; 
                ctx.shadowColor = `rgba(255, 42, 75, ${0.7 * glowIntensity * clarity})`;
                ctx.strokeStyle = 'rgba(0,0,0,0)'; ctx.stroke(); ctx.shadowBlur = 0;
            }
            ctx.restore();
        }

        function render(now) {
            let dt = (now - lastTime) / 1000.0;
            if (dt > 0.1) dt = 0.1;
            lastTime = now;
            globalTime++;

            let aerosolVal = parseFloat(ui.aerosolSlider.value);
            let aerosolFactor = aerosolVal / 100;
            let clarity = 1.0 - aerosolFactor; 

            if (egl && mgl) {
                egl.viewport(0, 0, 256, 256); egl.useProgram(eProg);
                egl.uniform1f(eTimeLoc, globalTime * 0.016);
                egl.uniform1f(eClarityLoc, clarity);
                egl.drawArrays(egl.TRIANGLES, 0, 6);

                mgl.viewport(0, 0, 256, 256); mgl.useProgram(mProg);
                mgl.uniform1f(mTimeLoc, globalTime * 0.016); 
                mgl.drawArrays(mgl.TRIANGLES, 0, 6);
            }

            ctx.clearRect(0, 0, width, height);
            
            // ★ 修复模糊问题：使用物理像素大小绘制背景
            if(bgCanvas && bgCanvas.width > 0) {
                ctx.drawImage(bgCanvas, 0, 0, width, height);
            }
            
            ctx.fillStyle = '#ffffff';
            starsArray.forEach(star => {
                if (star.x < width && star.y < height) {
                    let twinkle = 0.5 + 0.5 * Math.sin(globalTime * 0.02 + star.x);
                    ctx.globalAlpha = star.a * twinkle;
                    ctx.shadowBlur = star.r * 5; 
                    ctx.shadowColor = '#ffffff';
                    ctx.beginPath(); ctx.arc(star.x, star.y, star.r * 1.5, 0, Math.PI*2); ctx.fill();
                }
            });
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;

            ctx.save();
            ctx.translate(width * 0.45, height * 0.5); 

            let orbitX = 450;        
            let sunX = -width * 0.45; 
            let mY = parseFloat(ui.moonSlider.value);

            let mRadius = 24;
            let penumbraY = 180;     
            let umbraY = 60;         

            let minVal = parseFloat(ui.moonSlider.min);
            let maxVal = parseFloat(ui.moonSlider.max);
            let progressPercent = Math.round(((mY - minVal) / (maxVal - minVal)) * 100);
            ui.prog.innerText = progressPercent + "%";
            ui.aerosol.innerText = aerosolVal + "%";

            const dict = i18n[currentLang];
            // 更新控制台的状态颜色使其符合绛红体系
            if (aerosolVal > 80) {
                ui.danjonTitle.innerHTML = dict.danjon0Title; ui.danjonTitle.style.color = "#665566";
                ui.danjonDesc.innerHTML = dict.danjon0Desc;
            } else if (aerosolVal > 50) {
                ui.danjonTitle.innerHTML = dict.danjon1Title; ui.danjonTitle.style.color = "#cc3344";
                ui.danjonDesc.innerHTML = dict.danjon1Desc;
            } else if (aerosolVal > 20) {
                ui.danjonTitle.innerHTML = dict.danjon3Title; ui.danjonTitle.style.color = "#ff4d6d";
                ui.danjonDesc.innerHTML = dict.danjon3Desc;
            } else {
                ui.danjonTitle.innerHTML = dict.danjon4Title; ui.danjonTitle.style.color = "#ff2a4b";
                ui.danjonDesc.innerHTML = dict.danjon4Desc;
            }

            drawVolumetricShadows(rEarthGlobal, orbitX, penumbraY, umbraY, clarity);
            drawOpticalRays(sunX, rEarthGlobal, orbitX, clarity);
            drawInfographics(clarity);
            drawEarth(rEarthGlobal, clarity);

            ctx.beginPath(); ctx.moveTo(orbitX, -350); ctx.lineTo(orbitX, 350);
            ctx.strokeStyle = 'rgba(142, 158, 223, 0.15)'; ctx.setLineDash([2,4]); ctx.stroke(); ctx.setLineDash([]);

            const snapshots = [-200, -140, -80, 0, 80, 140, 200];
            snapshots.forEach(y => {
                let dist = Math.abs(mY - y);
                let alpha = 0.35 * (dist < 35 ? smoothstep(15, 35, dist) : 1.0); 
                if(alpha > 0.01) drawMoonBody(y, orbitX, mRadius, penumbraY, umbraY, alpha, false, clarity);
            });
            drawMoonBody(mY, orbitX, mRadius, penumbraY, umbraY, 1.0, true, clarity);

            ctx.globalCompositeOperation = 'screen';
            photons.forEach(p => { p.update(aerosolFactor, orbitX, mY, mRadius); p.draw(ctx); });
            ctx.globalCompositeOperation = 'source-over';

            let absY = Math.abs(mY);
            let isTotal = absY <= umbraY + mRadius && absY > umbraY - mRadius;

            if (absY > penumbraY) {
                ui.statusTitle.innerHTML = dict.statFullTitle; ui.statusTitle.style.color = "#fff";
                ui.statusDesc.innerHTML = dict.statFullDesc;
            } else if (absY <= penumbraY && absY > umbraY + mRadius) {
                ui.statusTitle.innerHTML = dict.statPenTitle; ui.statusTitle.style.color = "#8e9edf";
                ui.statusDesc.innerHTML = dict.statPenDesc;
            } else if (isTotal) {
                if (currentMode === 'eye') {
                    ui.statusTitle.innerHTML = dict.statWashTitle; ui.statusTitle.style.color = "#a0b4cc";
                    ui.statusDesc.innerHTML = dict.statWashDesc;
                } else {
                    if (aerosolVal > 80) {
                        ui.statusTitle.innerHTML = dict.statLostTitle; ui.statusTitle.style.color = "#665566";
                        ui.statusDesc.innerHTML = dict.statLostDesc;
                    } else {
                        ui.statusTitle.innerHTML = dict.statRawTitle; ui.statusTitle.style.color = "#ff2a4b";
                        ui.statusDesc.innerHTML = dict.statRawDesc;
                    }
                }
            } else {
                if (aerosolVal > 80) {
                    ui.statusTitle.innerHTML = dict.statBlackTitle; ui.statusTitle.style.color = "#665566";
                    ui.statusDesc.innerHTML = dict.statBlackDesc;
                } else {
                    ui.statusTitle.innerHTML = dict.statBloodTitle; ui.statusTitle.style.color = "#ff2a4b";
                    ui.statusDesc.innerHTML = dict.statBloodDesc;
                }
            }

            ctx.restore();
            requestAnimationFrame(render);
        }

        updateLanguageUI(); 

        requestAnimationFrame(render);
  };
})();


// ====== core-03.js ======
// CORE Subpage 2
(function() {
  var _mod = { initialized: false, animFrameId: null };
  MoonApp.CoreSubpages._register(2, _mod);

  _mod.init = function() {
    if (_mod.initialized) return;
    _mod.initialized = true;
// ==========================================
        // UI 状态控制 & 国际化翻译 (i18n)
        // ==========================================
        let menuVisible = true;
        let targetProgress = 0.0;
        let currentLang = 'zh';

        const i18n = {
            zh: {
                title: "黄白交角与月食的捉迷藏",
                desc: "<b>为什么月食不是每个月都有？</b><br>这源于地球公转轨道面（黄道面）与月球公转轨道面（白道面）之间存在的夹角——<b>黄白交角</b>。<br>为直观展示，本系统将夹角视效放大至 15°，并实体化了地月阴影锥。转动视角你会发现，在大多数时候，月球会从巨大的深红阴影上方或下方“完美错过”（如阶段二）。只有当轨道交点恰好对齐时，月食才会真正降临。",
                physEcliptic: "黄道面 (基准):",
                physEclipticVal: "0.00° (归零)",
                physLunar: "白道面倾角:",
                physNode: "交点退行:",
                btn1: "[ 假设 ] 零度交角：每月必穿红影锥",
                btn2: "[ 现实 ] 轨道倾斜：月球完美错过阴影",
                btn3: "[ 交汇 ] 节点对齐：真实月食的触发带",
                btn4: "[ 退行 ] 轨道漂移：18.6年的进动周期",
                hideConsole: "隐藏控制台",
                showConsole: "显示控制台",
                references: "参考资料",
                tab1: "引言",
                tab2: "◀ 上一页",
                tab3: "下一页 ▶",
                tab4: "首页",
                arcEcliptic: "✦ 黄道面 (ECLIPTIC PLANE) / 绝对物理基准 0.00° ✦",
                arcLunar: [
                    "✦ 白道面 (LUNAR PLANE) / 倾角 0.00° (假设重合) ✦", 
                    "✦ 白道面 (LUNAR PLANE) / 倾角 5.14° (完美错开) ✦",
                    "✦ 白道面 (LUNAR PLANE) / 节点对齐 (触发食季) ✦", 
                    "✦ 白道面 (LUNAR PLANE) / 交点退行 (18.6年周期) ✦"
                ],
                stateNames: ["假设模型", "现实倾角", "黄白交汇", "交点退行"],
                days: "天",
                aligned: "° ALIGNED",
                langToggle: "ENGLISH"
            },
            en: {
                title: "LUNAR INCLINATION & ECLIPSES",
                desc: "<b>Why don't we have an eclipse every month?</b><br>It's due to the angle between Earth's orbital plane (Ecliptic) and the Moon's orbital plane (Lunar plane)—the <b>Orbital Inclination</b>.<br>For visual clarity, this system exaggerates the angle to 15° and solidifies the umbral cones. Rotate the camera and you'll observe how the Moon typically 'perfectly misses' the massive deep-red shadow by passing above or below it (Stage 2). Eclipses only trigger when the orbital nodes align.",
                physEcliptic: "ECLIPTIC (BASE):",
                physEclipticVal: "0.00° (ZERO)",
                physLunar: "LUNAR INCLIN.:",
                physNode: "NODE REGRESS.:",
                btn1: "[ HYPOTHESIS ] 0° ANGLE: MONTHLY ECLIPSES",
                btn2: "[ REALITY ] INCLINED: PERFECTLY MISSING",
                btn3: "[ ALIGNMENT ] NODES ALIGNED: ECLIPSE TRIGGER",
                btn4: "[ REGRESSION ] 18.6-YEAR PRECESSION DRIFT",
                hideConsole: "HIDE CONSOLE",
                showConsole: "SHOW CONSOLE",
                references: "REFERENCES",
                tab1: "INTRO",
                tab2: "◀ PREV",
                tab3: "NEXT ▶",
                tab4: "HOME",
                arcEcliptic: "✦ ECLIPTIC PLANE / ABSOLUTE BASELINE 0.00° ✦",
                arcLunar: [
                    "✦ LUNAR PLANE / 0.00° INCLINATION (COINCIDING) ✦", 
                    "✦ LUNAR PLANE / 5.14° INCLINATION (MISALIGNED) ✦",
                    "✦ LUNAR PLANE / NODES ALIGNED (ECLIPSE SEASON) ✦", 
                    "✦ LUNAR PLANE / NODE REGRESSION (18.6-YR CYCLE) ✦"
                ],
                stateNames: ["HYPOTHESIS", "REALITY INCL.", "NODE ALIGNMENT", "NODE REGRESS."],
                days: " DAYS",
                aligned: "° ALIGNED",
                langToggle: "中文"
            }
        };

        function updateLanguageUI() {
            const dict = i18n[currentLang];
            
            document.getElementById('core2-ui-title').innerHTML = dict.title;
            document.getElementById('core2-ui-desc').innerHTML = dict.desc;
            document.getElementById('core2-lbl-ecl').innerText = dict.physEcliptic;
            document.getElementById('core2-val-ecl-base').innerText = dict.physEclipticVal;
            document.getElementById('core2-lbl-lun').innerText = dict.physLunar;
            document.getElementById('core2-lbl-node').innerText = dict.physNode;
            
            document.getElementById('core2-btn-text-1').innerText = dict.btn1;
            document.getElementById('core2-btn-text-2').innerText = dict.btn2;
            document.getElementById('core2-btn-text-3').innerText = dict.btn3;
            document.getElementById('core2-btn-text-4').innerText = dict.btn4;
            
            const el1 = document.getElementById('tab-1'); if (el1) el1.innerText = dict.tab1;
            const el2 = document.getElementById('tab-2'); if (el2) el2.innerText = dict.tab2;
            const el3 = document.getElementById('tab-3'); if (el3) el3.innerText = dict.tab3;
            const el4 = document.getElementById('tab-4'); if (el4) el4.innerText = dict.tab4;
            
            const toggleText = document.getElementById('menu-toggle-text');
            if (toggleText) toggleText.innerText = menuVisible ? dict.hideConsole : dict.showConsole;
            
            const lblRef = document.getElementById('lbl-ref'); if (lblRef) lblRef.innerText = dict.references;
            const langBtn = document.getElementById('lang-btn'); if (langBtn) langBtn.innerText = dict.langToggle;
            
            updateTextArc(currentProgress);
        }

        function toggleLanguage() {
            currentLang = currentLang === 'zh' ? 'en' : 'zh';
            updateLanguageUI();
        }

        function toggleMenuDrawer() {
            const labUi = document.getElementById('core2-lab-ui');
            const toggleText = document.getElementById('menu-toggle-text');
            menuVisible = !menuVisible;
            if (menuVisible) {
                labUi.classList.remove('ui-hidden');
                toggleText.innerText = i18n[currentLang].hideConsole;
            } else {
                labUi.classList.add('ui-hidden');
                toggleText.innerText = i18n[currentLang].showConsole;
            }
        }

        function switchTopTab(element) {
            document.querySelectorAll('.retro-tab').forEach(tab => tab.classList.remove('active-tab'));
            element.classList.add('active-tab');
        }

        _mod.setProgress = function(val, btn) {
            targetProgress = val;
            if (!MoonApp.state.menuVisible && typeof MoonApp.toggleMenuDrawer === 'function') {
                MoonApp.toggleMenuDrawer();
            }
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            if(btn) btn.classList.add('active');
        }

        function smoothstep(min, max, value) {
            let x = Math.max(0, Math.min(1, (value - min) / (max - min)));
            return x * x * (3 - 2 * x);
        }

        // ==========================================
        // 核心 WebGL：三维残影逐年展开与体积光锥阴影
        // ==========================================
        const canvas = document.getElementById('glcanvas-core-03');
        const gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: false });
        if(!gl) alert("WebGL init failed");

        const vsSource = `
            attribute vec4 aVertexPosition;
            void main() { gl_Position = aVertexPosition; }
        `;

        const fsSource = `
            precision highp float;
            
            uniform vec3 iResolution;
            uniform vec3 uCamParams; 
            uniform float uProgress; 
            uniform float uTime;

            uniform vec2 uScreenOffset;
            uniform float uCamZoom;
            uniform float uPrecessionYear;

            #define MAX_DIST 150.
            #define PI 3.1415926535
            #define TAU 6.2831853

            const float SEED = 0.0;
            
            const vec3 SUN_POS = vec3(0.0, 0.0, 0.0);
            const vec3 EARTH_POS = vec3(22.0, 0.0, 0.0);
            
            const float SUN_RADIUS = 3.5;
            const float EARTH_RADIUS = 1.2;
            const float MOON_ORBIT_R = 4.5;
            const float MOON_RADIUS = 0.3;
            
            // ★ 还原至 Celestial / Crimson 星体色盘
            const vec3 SUN_COLOR = vec3(1.0, 0.85, 0.6);     
            const vec3 LAND_COLOR = vec3(0.25, 0.1, 0.2);   
            const vec3 JUNGLE_COLOR = vec3(0.15, 0.05, 0.15); 
            const vec3 DESERT_COLOR = vec3(0.6, 0.3, 0.3); 
            const vec3 SNOW_COLOR = vec3(1.0, 0.8, 0.9);  
            const float OCEAN_SIZE = 0.57;
            const vec3 OCEAN_COLOR = vec3(0.1, 0.05, 0.2);   
            
            struct SdfCtx { float k; vec3 col; float d; };
            float sdSphere(vec3 p, float r) { return length(p) - r; }

            mat3 rotateY(float a) {
                float c = cos(a), s = sin(a);
                return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
            }
            mat3 rotateZ(float a) {
                float c = cos(a), s = sin(a);
                return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
            }
            mat3 calcLookAtMatrix(vec3 camPos, vec3 at) {
                vec3 zAxis = normalize(at - camPos);
                vec3 xAxis = normalize(cross(zAxis, vec3(0.0, 1.0, 0.0)));
                vec3 yAxis = normalize(cross(xAxis, zAxis));
                return mat3(xAxis, yAxis, zAxis);
            }

            void getDynamicState(out float lunInc, out float nodeA) {
                lunInc = smoothstep(0.05, 0.30, uProgress) * 15.0 * PI / 180.0;
                float n1 = smoothstep(0.36, 0.63, uProgress) * (PI / 2.0);
                float n2 = (uPrecessionYear / 18.6) * TAU; 
                nodeA = n1 + n2;
            }

            vec3 getMoonPos() {
                float lunInc, nodeA;
                getDynamicState(lunInc, nodeA);
                float curA = (uTime * 0.4) * 2.0 * PI;
                vec3 mPosLocal = vec3(MOON_ORBIT_R * cos(curA), 0.0, -MOON_ORBIT_R * sin(curA));
                return EARTH_POS + rotateY(nodeA) * rotateZ(lunInc) * mPosLocal;
            }

            float hash12(vec2 p, float scale) {
                p = mod(p, scale); p.y += SEED;
                return fract(sin(dot(p, vec2(12.9898, 4.1414))) * 43758.5453);
            }
            float noise(vec2 p, float scale) {
                p *= scale; vec2 f = fract(p); p = floor(p);
                return mix(mix(hash12(p, scale), hash12(p + vec2(1.0, 0.0), scale), f.x),
                           mix(hash12(p + vec2(0.0, 1.0), scale), hash12(p + vec2(1.0, 1.0), scale), f.x), f.y);
            }
            float fbm4(vec2 p, float scale) {
                float s = 0.0, m = 0.0, a = 1.0;
                for(int i = 0; i < 4; i++) { s += a * noise(p, scale); m += a; a *= 0.6; scale *= 2.0; }
                return s / m;
            }
            float fbm7(vec2 p, float scale) {
                float s = 0.0, m = 0.0, a = 1.0;
                for(int i = 0; i < 7; i++) { s += a * noise(p, scale); m += a; a *= 0.6; scale *= 2.0; }
                return s / m;
            }

            vec2 hash22(vec2 p, float scale) {
                p = mod(p, scale); p.y += SEED;
                vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
                p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy);
            }

            float crater_noise(vec2 p, float scale) {
                p *= scale; vec2 f = fract(p); p = floor(p);
                float va = 0.0, wt = 0.0;
                for (int i = -1; i <= 1; i++) {
                    for (int j = -1; j <= 1; j++) {
                        vec2 g = vec2(float(i), float(j));
                        vec2 o = hash22(p + g, scale);
                        float d = distance(f - g, o);
                        float w = exp(-4.0 * d);
                        va += w * sin(TAU * sqrt(max(d, 0.06))); wt += w;
                    }
                }
                return abs(va / wt);
            }

            float crater_fbm(vec2 x) {
                float craters = crater_noise(x, 7.0) * 0.6 + crater_noise(x, 20.0) * 0.2;
                return 1.0 - (craters + fbm4(x, 48.0) * 0.35) * 0.4;
            }

            SdfCtx mapSolids(vec3 p) {
                SdfCtx res = SdfCtx(0.0, vec3(0.0), MAX_DIST);
                float dEarth = sdSphere(p - EARTH_POS, EARTH_RADIUS);
                if(dEarth < res.d) res = SdfCtx(1.0, vec3(0.0), dEarth); 

                vec3 mPos = getMoonPos();
                float dMoon = sdSphere(p - mPos, MOON_RADIUS) + 1e-4; 
                if(dMoon < res.d) res = SdfCtx(3.0, vec3(0.0), dMoon);

                float dSun = sdSphere(p - SUN_POS, SUN_RADIUS);
                if(dSun < res.d) res = SdfCtx(4.0, vec3(0.0), dSun);

                float axesAlpha = smoothstep(0.70, 0.95, uProgress);
                if (axesAlpha > 0.01) {
                    vec3 p_e = p - EARTH_POS;
                    float lunInc, nodeA;
                    getDynamicState(lunInc, nodeA);
                    
                    vec3 n_lun = rotateY(nodeA) * rotateZ(lunInc) * vec3(0.0, 1.0, 0.0);
                    float h_lun = dot(p_e, n_lun);
                    float d_lun_line = length(p_e - n_lun * h_lun) - 0.03; 
                    float d_lun_axis = max(d_lun_line, abs(h_lun) - 7.5);
                    if (d_lun_axis < res.d) res = SdfCtx(5.0, vec3(0.0), d_lun_axis);
                    
                    float h_ecl = p_e.y;
                    float d_ecl_line = length(p_e.xz) - 0.02;
                    float d_ecl_axis = max(d_ecl_line, abs(h_ecl) - 8.5);
                    if (d_ecl_axis < res.d) res = SdfCtx(6.0, vec3(0.0), d_ecl_axis);
                }

                return res;
            }

            vec3 calcNormal(vec3 pos) {
                vec2 e = vec2(0.005, 0.0); 
                return normalize(vec3(
                    mapSolids(pos + e.xyy).d - mapSolids(pos - e.xyy).d,
                    mapSolids(pos + e.yxy).d - mapSolids(pos - e.yxy).d,
                    mapSolids(pos + e.yyx).d - mapSolids(pos - e.yyx).d
                ));
            }

            float getShadow(vec3 p, vec3 l) {
                float res = 1.0;
                vec3 lightDir = -l; 
                vec3 pe = p - EARTH_POS;
                float t_earth = dot(pe, lightDir);
                if (t_earth > 0.0) { 
                    float d_earth = length(pe - t_earth * lightDir);
                    float r_earth = EARTH_RADIUS * max(0.0, 1.0 - t_earth / 15.0); 
                    if (d_earth < r_earth) res = 0.02; 
                }
                
                vec3 mPos = getMoonPos();
                vec3 pm = p - mPos;
                float t_moon = dot(pm, lightDir);
                if (t_moon > 0.0) {
                    float d_moon = length(pm - t_moon * lightDir);
                    float r_moon = MOON_RADIUS * max(0.0, 1.0 - t_moon / 5.0); 
                    if (d_moon < r_moon) res = 0.02; 
                }
                return res;
            }

            vec4 renderVolumetricShadows(vec3 ro, vec3 rd, float t_solid) {
                float b = dot(ro - EARTH_POS, rd);
                float c = dot(ro - EARTH_POS, ro - EARTH_POS) - 400.0; 
                float h = b*b - c;
                
                vec4 res = vec4(0.0);
                if (h > 0.0) {
                    float t_in = max(0.0, -b - sqrt(h));
                    float t_out = min(t_solid, -b + sqrt(h));
                    
                    if (t_in < t_out) {
                        int steps = 35;
                        float dt = (t_out - t_in) / float(steps);
                        float alpha = 0.0;
                        vec3 col = vec3(0.0);
                        
                        vec3 mPos = getMoonPos();
                        vec3 eDir = normalize(EARTH_POS - SUN_POS);
                        vec3 mDir = normalize(mPos - SUN_POS);
                        
                        float dither = fract(sin(dot(rd.xy, vec2(12.9898, 78.233))) * 43758.5453);
                        
                        for(int i=0; i<35; i++) {
                            float t = t_in + (float(i) + dither) * dt;
                            vec3 p = ro + rd * t; 
                            
                            vec3 pe = p - EARTH_POS;
                            float e_dist = dot(pe, eDir);
                            if (e_dist > 0.0 && e_dist < 15.0) {
                                float r = length(pe - e_dist * eDir);
                                float umbra_r = EARTH_RADIUS * max(0.0, 1.0 - e_dist / 15.0);
                                float pen_r = EARTH_RADIUS * (1.0 + e_dist / 30.0);
                                
                                if (r < pen_r) {
                                    float pen = smoothstep(pen_r, umbra_r, r); 
                                    float umb = smoothstep(umbra_r, 0.0, r);   
                                    
                                    float redGlow = smoothstep(0.3, 1.0, pen) * smoothstep(0.7, 0.0, umb);
                                    
                                    // ★ 体积光锥阴影绛红化
                                    vec3 glowColor = vec3(1.0, 0.16, 0.29) * redGlow * 2.0; 
                                    vec3 coreColor = vec3(0.1, 0.0, 0.05) * umb;            
                                    
                                    float distFade = (1.0 - e_dist / 15.0); 
                                    float blockDensity = (pen * 0.15 + umb * 0.4);
                                    
                                    col += (glowColor + coreColor) * distFade * dt * 0.8;
                                    alpha += blockDensity * distFade * dt * 0.5;
                                }
                            }
                            
                            vec3 pm = p - mPos;
                            float m_dist = dot(pm, mDir);
                            if (m_dist > 0.0 && m_dist < 6.0) {
                                float r = length(pm - m_dist * mDir);
                                float umbra_r = MOON_RADIUS * max(0.0, 1.0 - m_dist / 6.0);
                                float pen_r = MOON_RADIUS * (1.0 + m_dist / 12.0);
                                
                                if (r < pen_r) {
                                    float pen = smoothstep(pen_r, umbra_r, r);
                                    float distFade = (1.0 - m_dist / 6.0);
                                    alpha += pen * 0.5 * distFade * dt;
                                }
                            }
                        }
                        res = vec4(clamp(col, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
                    }
                }
                return res;
            }

            vec4 calcOrbitalPlanes(vec3 ro, vec3 rd, float t_solid) {
                vec4 finalCol = vec4(0.0);
                float lunInc, nodeA;
                getDynamicState(lunInc, nodeA);

                // 1. 黄道面 
                if (abs(rd.y) > 1e-4) {
                    float t_ecl = -ro.y / rd.y; 
                    if (t_ecl > 0.0 && t_ecl < t_solid) {
                        vec3 p = ro + rd * t_ecl;
                        float r_sun = length(p.xz);
                        
                        if (r_sun > 3.8 && r_sun < 35.0) {
                            float a_sun = atan(-p.z, p.x);
                            if(a_sun < 0.0) a_sun += 2.0 * PI; 
                            vec3 eclCol = vec3(0.0);
                            float planeMask = smoothstep(35.0, 25.0, r_sun) * smoothstep(3.8, 4.5, r_sun);
                            
                            float fillAlpha = planeMask * 0.12;
                            eclCol += vec3(0.4, 0.25, 0.05) * fillAlpha * 1.5;
                            
                            float sunRings = 1.0 - smoothstep(0.0, 0.03, abs(fract(r_sun * 0.5) - 0.5));
                            eclCol += vec3(0.8, 0.6, 0.2) * sunRings * planeMask * 0.25;

                            float radLines = 1.0 - smoothstep(0.0, 0.03, abs(fract(a_sun * 12.0 / PI) - 0.5));
                            eclCol += vec3(0.8, 0.6, 0.2) * radLines * planeMask * 0.15;
                            
                            float track_earth = 1.0 - smoothstep(0.0, 0.08, abs(r_sun - 22.0));
                            float ecl_targetAngle = mod(uTime * 0.4, TAU); 
                            float tailLen = PI * 1.5;
                            float angularDist = ecl_targetAngle - a_sun;
                            if (angularDist < 0.0) angularDist += TAU;
                            
                            float hlAlpha = 0.0;
                            if (angularDist < tailLen) {
                                float intensity = 1.0 - (angularDist / tailLen);
                                vec3 fillCol = mix(vec3(0.8, 0.1, 0.0), vec3(1.0, 0.9, 0.3), intensity);
                                float eclEdgeFade = smoothstep(18.0, 22.0, r_sun) * (1.0 - smoothstep(22.0, 26.0, r_sun));
                                eclCol += fillCol * eclEdgeFade * intensity * 2.5 * planeMask;
                                eclCol += fillCol * track_earth * intensity * 4.0;
                                hlAlpha += eclEdgeFade * intensity + track_earth * intensity;
                            }
                            
                            vec3 p_e = p - EARTH_POS;
                            float r_ecl_local = length(p_e.xz);
                            if (r_ecl_local > 8.0 && r_ecl_local < 15.0) {
                                float a_ecl_local = atan(-p_e.z, p_e.x);
                                if (a_ecl_local < 0.0) a_ecl_local += TAU;
                                
                                float safeA_loc = a_ecl_local;
                                if (safeA_loc > PI) safeA_loc -= TAU;
                                
                                if (abs(safeA_loc) < 0.7) {
                                    float distToMid = abs(safeA_loc);
                                    float distToEnds = 0.7 - abs(safeA_loc);
                                    
                                    float baseR = 9.5; 
                                    float bulge = exp(-15.0 * distToMid) * 0.3;
                                    float curl = exp(-25.0 * distToEnds) * 0.1;
                                    float bracketRadius = baseR + bulge - curl;
                                    float thickness = 0.02 + 0.01 * (bulge + curl);
                                    
                                    float viewComp = clamp(t_ecl / (abs(rd.y) * 800.0), 0.01, 0.5);
                                    float bracketLine = 1.0 - smoothstep(0.0, viewComp, abs(r_ecl_local - bracketRadius));
                                    
                                    eclCol += vec3(1.0, 0.8, 0.3) * bracketLine * 4.0; 
                                    
                                    float anchorGlow = exp(-20.0 * distToMid) * exp(-10.0 * abs(r_ecl_local - (baseR + 0.3)));
                                    eclCol += vec3(1.0, 0.9, 0.5) * anchorGlow * 8.0;
                                    hlAlpha += max(bracketLine, anchorGlow * 0.5);
                                }
                            }

                            float localMask = 0.0;
                            float hideNodes = 1.0 - smoothstep(0.7, 0.8, uProgress);
                            if (hideNodes > 0.0) {
                                vec3 p_earth = p - EARTH_POS;
                                float r_earth = length(p_earth.xz);
                                localMask = smoothstep(10.0, 7.0, r_earth);
                                if (localMask > 0.0) {
                                    vec3 p_node = rotateY(-nodeA) * p_earth;
                                    float zLine = (1.0 - smoothstep(0.0, 0.04, abs(p_node.x))) * localMask * step(r_earth, 6.0);
                                    eclCol += vec3(1.0, 0.9, 0.4) * zLine * 2.0 * hideNodes;
                                    float nodeDist = min(length(p_node - vec3(0.0, 0.0, 4.5)), length(p_node - vec3(0.0, 0.0, -4.5)));
                                    eclCol += vec3(1.0, 0.9, 0.2) * (1.0 - smoothstep(0.0, 0.25, nodeDist)) * 1.5 * hideNodes;
                                }
                            }

                            float optDepth = clamp(0.22 / (abs(rd.y) + 0.01), 0.7, 4.5);
                            float combinedAlpha = clamp(fillAlpha + sunRings*0.2 + radLines*0.1 + hlAlpha + localMask*0.3, 0.0, 1.0);
                            finalCol += vec4(eclCol * optDepth, combinedAlpha);
                        }
                    }
                }

                // 2. 白道面：当前实时主轨道 
                mat3 rotLun = rotateY(nodeA) * rotateZ(lunInc);
                vec3 n_lun = rotLun * vec3(0.0, 1.0, 0.0);
                float dotN_lun = dot(rd, n_lun);
                
                if (abs(dotN_lun) > 1e-4) {
                    float t_lun = dot(EARTH_POS - ro, n_lun) / dotN_lun;
                    if (t_lun > 0.0 && t_lun < t_solid) {
                        vec3 p = ro + rd * t_lun;
                        vec3 p_local = p - EARTH_POS;
                        vec3 p_flat = rotateZ(-lunInc) * rotateY(-nodeA) * p_local;
                        float r_earth = length(p_flat.xz);
                        
                        if (r_earth > EARTH_RADIUS && r_earth < 9.0) {
                            float a_earth = atan(-p_flat.z, p_flat.x);
                            if(a_earth < 0.0) a_earth += 2.0 * PI; 
                            
                            float targetAngle = mod(uTime * 0.4 * TAU, TAU);
                            vec3 ringCol = vec3(0.0);
                            float alpha = 0.0;
                            
                            float planeMaskLun = smoothstep(8.5, 7.5, r_earth) * smoothstep(EARTH_RADIUS, EARTH_RADIUS + 0.2, r_earth);
                            ringCol += vec3(0.1, 0.15, 0.2) * planeMaskLun * 0.15;
                            alpha += planeMaskLun * 0.1;

                            if (r_earth > 3.0 && r_earth < 8.5) {
                                float mainTrack = 1.0 - smoothstep(0.0, 0.04, abs(r_earth - MOON_ORBIT_R));
                                // ★ 白道面轨道基色绯红化
                                ringCol += vec3(1.0, 0.3, 0.4) * mainTrack * 1.0; 

                                float tailLen = PI * 1.2;
                                float angularDist = targetAngle - a_earth;
                                if (angularDist < 0.0) angularDist += TAU;
                                
                                if (angularDist < tailLen) {
                                    float intensity = 1.0 - (angularDist / tailLen);
                                    // ★ 白道面流苏绯红化
                                    vec3 fillCol = mix(vec3(1.0, 0.16, 0.29), vec3(1.0, 0.8, 0.9), intensity);
                                    float edgeFade = smoothstep(3.5, MOON_ORBIT_R, r_earth) * (1.0 - smoothstep(MOON_ORBIT_R, 6.0, r_earth));
                                    ringCol += fillCol * edgeFade * intensity * 2.5; 
                                    
                                    vec3 trackCol = mix(vec3(1.0, 0.3, 0.4), vec3(1.0, 1.0, 1.0), intensity);
                                    ringCol += trackCol * mainTrack * intensity * 3.0; 
                                    alpha += edgeFade * intensity * 0.8;
                                }

                                float headDist = min(abs(a_earth - targetAngle), TAU - abs(a_earth - targetAngle));
                                float cometGlow = exp(-10.0 * headDist) * exp(-12.0 * abs(r_earth - MOON_ORBIT_R));
                                ringCol += vec3(1.0, 0.8, 0.9) * cometGlow * 15.0;

                                float outerTrack = 1.0 - smoothstep(0.0, 0.04, abs(r_earth - 6.25));
                                ringCol += vec3(0.8, 0.3, 0.4) * outerTrack * 0.5;

                                float m1 = smoothstep(0.015, 0.0, abs(a_earth - PI * 0.5));
                                float m2 = smoothstep(0.015, 0.0, abs(a_earth - PI));
                                float m3 = smoothstep(0.015, 0.0, abs(a_earth - PI * 1.5));
                                float m4 = smoothstep(0.015, 0.0, min(a_earth, TAU - a_earth)); 
                                ringCol += vec3(1.0, 0.7, 0.8) * (m1+m2+m3+m4) * outerTrack * 6.0;

                                float q = clamp(floor(uProgress * 4.0), 0.0, 3.0);
                                float a_start = q * PI * 0.5, a_end = (q + 1.0) * PI * 0.5, a_mid = a_start + 0.785398;
                                if (step(a_start, a_earth) * step(a_earth, a_end) > 0.5) {
                                    float safeA = clamp(a_earth, 0.0, TAU);
                                    float distToMid = abs(safeA - a_mid);
                                    float distToEnds = min(abs(safeA - a_start), abs(safeA - a_end));
                                    
                                    float baseR = 7.6, bulge = exp(-15.0 * distToMid) * 0.15, curl = exp(-18.0 * distToEnds) * 0.05;
                                    
                                    float viewComp = clamp(t_lun / (abs(dotN_lun) * 800.0), 0.01, 0.5);
                                    float bracketLine = 1.0 - smoothstep(0.0, viewComp, abs(r_earth - (baseR + bulge - curl)));
                                    
                                    // ★ 大括号绛红化
                                    ringCol += vec3(1.0, 0.3, 0.4) * bracketLine * 5.0;
                                    
                                    float anchorGlow = exp(-20.0 * distToMid) * exp(-10.0 * abs(r_earth - (baseR + 0.5)));
                                    ringCol += vec3(1.0, 0.6, 0.7) * anchorGlow * 10.0;
                                    alpha += max(bracketLine, anchorGlow * 0.5);
                                }
                            }
                            float optDepth = clamp(0.22 / (abs(dotN_lun) + 0.01), 0.7, 4.5);
                            finalCol += vec4(ringCol * optDepth, clamp(alpha, 0.0, 1.0));
                        }
                    }
                }

                // 3. 延时残影 
                float ghostAlpha = smoothstep(0.75, 0.95, uProgress);
                if (ghostAlpha > 0.01) {
                    for(int i = 0; i < 19; i++) {
                        float f_i = float(i);
                        if (f_i > uPrecessionYear + 0.5) continue; 

                        float histNodeA = (PI / 2.0) + (f_i / 18.6) * TAU; 
                        float individualAlpha = clamp(uPrecessionYear - f_i + 0.5, 0.0, 1.0) * ghostAlpha;

                        mat3 rotHist = rotateY(histNodeA) * rotateZ(lunInc);
                        vec3 n_hist = rotHist * vec3(0.0, 1.0, 0.0);
                        float dotN_hist = dot(rd, n_hist);
                        if (abs(dotN_hist) > 1e-4) {
                            float t_hist = dot(EARTH_POS - ro, n_hist) / dotN_hist;
                            if (t_hist > 0.0 && t_hist < t_solid) {
                                vec3 p_hist = ro + rd * t_hist - EARTH_POS;
                                vec3 p_flat_hist = rotateZ(-lunInc) * rotateY(-histNodeA) * p_hist;
                                float r_flat = length(p_flat_hist.xz);
                                
                                float track_m = 1.0 - smoothstep(0.0, 0.04, abs(r_flat - MOON_ORBIT_R));
                                float track_out = 1.0 - smoothstep(0.0, 0.04, abs(r_flat - 6.25));
                                float trk = max(track_m, track_out * 0.4); 
                                
                                if (trk > 0.01) {
                                    float optD = clamp(0.22 / (abs(dotN_hist) + 0.01), 0.7, 4.5);
                                    // ★ 残影绯红化
                                    vec3 histCol = vec3(1.0, 0.3, 0.4) * trk * individualAlpha * 1.5;
                                    finalCol += vec4(histCol * optD, trk * individualAlpha * 0.2);
                                }
                            }
                        }
                    }
                }
                
                return clamp(finalCol, 0.0, 1.0);
            }

            void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                vec2 bg_uv = (-iResolution.xy + 2.0 * fragCoord.xy) / iResolution.y;
                
                float theta = uCamParams.x, phi = uCamParams.y, radius = uCamParams.z;
                vec3 ro = EARTH_POS + vec3(radius * sin(phi) * cos(theta), radius * cos(phi), radius * sin(phi) * sin(theta));
                mat3 cam = calcLookAtMatrix(ro, EARTH_POS);
                vec3 rd_bg = cam * normalize(vec3(bg_uv, 2.2));

                // ★ 深紫底色天空
                vec3 skyTop = vec3(0.05, 0.01, 0.08);    
                vec3 skyBottom = vec3(0.12, 0.02, 0.16);  
                vec3 col = mix(skyBottom, skyTop, smoothstep(-0.6, 0.6, rd_bg.y));
                
                float stars = hash12(rd_bg.xy * 100.0, 1.0);
                col += vec3(1.0) * smoothstep(0.99, 1.0, stars) * (1.0 - smoothstep(-0.2, 0.5, rd_bg.y));

                vec3 bgSunDir = normalize(SUN_POS - ro);
                float sunDot = max(0.0, dot(rd_bg, bgSunDir));
                // ★ 太阳偏红金
                col += vec3(1.0, 0.7, 0.4) * pow(sunDot, 400.0) * 2.0; 
                col += vec3(1.0, 0.4, 0.2) * pow(sunDot, 50.0) * 1.5;     
                col += vec3(0.8, 0.2, 0.1) * pow(sunDot, 10.0) * 0.5;

                vec2 uv_obj = (-iResolution.xy + 2.0 * fragCoord.xy) / iResolution.y;
                uv_obj = (uv_obj - uScreenOffset) * uCamZoom;
                vec3 rd_obj = cam * normalize(vec3(uv_obj, 2.2));
                
                float pipDist = length(uv_obj);
                float pipMask = mix(1.0, 1.0 - smoothstep(2.0, 2.1, pipDist), smoothstep(1.0, 2.0, uCamZoom));

                if (pipMask > 0.0) {
                    float t_solid = MAX_DIST, t = 0.0;
                    SdfCtx ray;
                    for(int i=0; i<80; i++) {
                        ray = mapSolids(ro + rd_obj * t);
                        if(ray.d < 0.001) { t_solid = t; break; }
                        if(t > MAX_DIST) break;
                        t += ray.d;
                    }

                    if (t_solid < MAX_DIST) {
                        vec3 p = ro + rd_obj * t_solid;
                        vec3 n = calcNormal(p);
                        vec3 l = normalize(SUN_POS - p);
                        
                        float diff = max(dot(n, l), 0.0);
                        float shadow = getShadow(p, l);
                        vec3 objCol = vec3(0.0);
                        
                        if (ray.k == 1.0) { 
                            vec3 normLocal = rotateY((uTime * 0.1) * TAU) * n;
                            vec2 muv = vec2(atan(normLocal.z, normLocal.x) * 0.5, acos(clamp(-normLocal.y, -1.0, 1.0))) / PI;
                            
                            float continent = fbm7(muv, 4.0);
                            float temp = fbm4(muv * 3.0 + vec2(31.33), 1.0);
                            vec3 earthCol = mix(LAND_COLOR, DESERT_COLOR, smoothstep(0.25, 0.1, fbm4(muv * 3.0 - vec2(54.1), 1.0)));
                            earthCol = mix(earthCol, JUNGLE_COLOR, smoothstep(0.1, 0.3, fbm4(muv * 3.0 - vec2(54.1), 1.0)) * smoothstep(0.3, 0.4, temp));
                            earthCol = mix(earthCol, SNOW_COLOR, smoothstep(0.3, 0.2, temp));
                            
                            float land = smoothstep(0.01, 0.0, 0.57 - continent);
                            earthCol *= sqrt(continent) * land * 1.2 * smoothstep(1.0, 0.99, abs(normLocal.y));
                            earthCol += (1.0 - continent) * smoothstep(0.57, 0.56, continent) * OCEAN_COLOR;
                            earthCol.rgb *= sqrt(1.0 + 0.1 * cos(sqrt(continent) * 512.0));

                            if (diff > 0.0) {
                                // ★ 将漫反射指数 0.7 降到 0.55，强度 3.0 升到 5.5，让地球向阳面更通透、更宽广
                                objCol = earthCol * pow(diff, 0.55) * shadow * 5.5 * SUN_COLOR; 
                            } else {
                                float backLight = max(0.0, dot(n, vec3(-l.x, -l.y, -l.z))); 
                                objCol = vec3(0.005, 0.01, 0.02) * earthCol * backLight;
                                float cityLights = fbm4(normLocal.xy * 15.0 + 100.0, 10.0);
                                col += mix(vec3(1.0, 0.4, 0.8), vec3(0.2, 0.8, 1.0), hash12(normLocal.xy, 10.0)) * smoothstep(0.75, 0.95, cityLights) * land * 3.0; 
                            }
                            
                            float fresnel = 1.0 - max(dot(n, -rd_obj), 0.0);
                            float innerSunDot = dot(n, l);
                            
                            // ★ 添加晚霞渐变边缘（Terminator Glow）
                            float terminator = smoothstep(-0.25, 0.05, innerSunDot) * smoothstep(0.25, -0.05, innerSunDot);
                            vec3 sunsetColor = mix(vec3(0.8, 0.1, 0.4), vec3(1.0, 0.5, 0.1), smoothstep(-0.1, 0.1, innerSunDot));
                            vec3 sunsetGlow = sunsetColor * terminator;

                            // 组合基础大气，同步增强白昼大气的厚度
                            vec3 dayAtmo = vec3(0.1, 0.4, 0.8) * pow(fresnel, 3.0) * smoothstep(-0.2, 0.5, innerSunDot) * 1.5;
                            vec3 nightAtmo = vec3(0.05, 0.01, 0.1) * pow(fresnel, 4.0) * smoothstep(0.1, -0.8, innerSunDot);
                            
                            objCol += dayAtmo + nightAtmo;
                            // 晚霞叠加至边缘与地表，与物理散射融合
                            objCol += sunsetGlow * pow(fresnel, 1.5) * 5.0;
                            objCol += sunsetGlow * earthCol * 2.5;
                            
                        } else if (ray.k == 3.0) { 
                            float lunInc, nodeA;
                            getDynamicState(lunInc, nodeA);
                            mat3 rotMoon = rotateY(nodeA) * rotateZ(lunInc) * rotateY(-(uTime * 0.4) * 2.0 * PI); 
                            vec3 normLocal = rotMoon * n;
                            vec2 muv = vec2(atan(normLocal.z, normLocal.x) * 0.5, acos(clamp(-normLocal.y, -1.0, 1.0))) / PI;
                            float craters_base = crater_fbm(muv) * 0.95; 
                            objCol = craters_base * vec3(0.85, 0.88, 0.9) * pow(diff, 0.7) * shadow * 3.0 * SUN_COLOR; 
                            objCol += craters_base * vec3(0.05, 0.08, 0.1) * max(0.0, dot(n, vec3(-l.x, -l.y, -l.z))) * 0.3 * (1.0 - shadow); 
                        } else if (ray.k == 4.0) {
                            float fresnel = 1.0 - max(dot(n, -rd_obj), 0.0);
                            objCol = vec3(1.0, 0.8, 0.4) * 2.5 + vec3(1.0, 0.3, 0.0) * pow(fresnel, 2.0) * 4.0 + vec3(1.0, 0.9, 0.2) * fbm4(n.xy * 15.0 + uTime*0.2, 2.0) * 1.5;
                        } else if (ray.k == 5.0) {
                            objCol = vec3(1.0, 0.3, 0.4) * 3.0; // 白道极绛红
                        } else if (ray.k == 6.0) {
                            objCol = vec3(1.0, 0.7, 0.1) * 2.5; // 黄道极暖金
                        }

                        col = mix(col, objCol, pipMask);
                    } 

                    vec4 shadowVol = renderVolumetricShadows(ro, rd_obj, t_solid);
                    col = col * (1.0 - shadowVol.a) + shadowVol.rgb * pipMask;

                    vec4 planesData = calcOrbitalPlanes(ro, rd_obj, t_solid);
                    col += planesData.rgb * planesData.a * pipMask; 
                }

                col = clamp(col, 0.0, 1.0);
                col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);
                col = mix(col, col * vec3(0.95, 1.05, 1.1), 0.3);
                col += mix(-1.0/255.0, 1.0/255.0, fract(sin(dot(fragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453));
                fragColor = vec4(col, 1.0);
            }

            void main() { 
                vec4 c;
                mainImage(c, gl_FragCoord.xy); 
                gl_FragColor = c;
            }
        `;

        function loadShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader Error:", gl.getShaderInfoLog(shader));
            }
            return shader;
        }

        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1, -1,-1, 1,1, 1,-1]), gl.STATIC_DRAW);

        const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        gl.enableVertexAttribArray(vertexPosition);
        gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);

        const locRes = gl.getUniformLocation(shaderProgram, "iResolution");
        const locCam = gl.getUniformLocation(shaderProgram, "uCamParams");
        const locProgress = gl.getUniformLocation(shaderProgram, "uProgress");
        const locTime = gl.getUniformLocation(shaderProgram, "uTime");
        const locOffset = gl.getUniformLocation(shaderProgram, "uScreenOffset");
        const locZoom = gl.getUniformLocation(shaderProgram, "uCamZoom");
        const locPrecessionYear = gl.getUniformLocation(shaderProgram, "uPrecessionYear");

        let camTheta = Math.PI / 5.0, camPhi = Math.PI / 2.3, camRadius = 22.0; 
        
        const interactionLayer = document.getElementById('core2-interaction-layer');
        let isDragging = false, lastX = 0, lastY = 0;
        interactionLayer.addEventListener('mousedown', (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
        interactionLayer.addEventListener('mousemove', (e) => {
            if (isDragging) {
                camTheta -= (e.clientX - lastX) * 0.005; camPhi -= (e.clientY - lastY) * 0.005;
                camPhi = Math.max(0.05, Math.min(Math.PI / 2.0 - 0.05, camPhi));
                lastX = e.clientX; lastY = e.clientY;
            }
        });
        interactionLayer.addEventListener('mouseup', () => isDragging = false);
        interactionLayer.addEventListener('wheel', (e) => {
            camRadius = Math.max(12.0, Math.min(50.0, camRadius + e.deltaY * 0.02));
        });

        let currentProgress = 0.0;
        const startTime = performance.now();
        let lastTime = startTime; 
        const percText = document.getElementById('core2-perc-text');
        const valLunEl = document.getElementById('core2-val-lun');
        const valNodeEl = document.getElementById('core2-val-node');

        let currentZoom = 1.0, currentOffsetX = 0.0, currentOffsetY = 0.0;
        let precessionYear = 0.0;

        const cross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
        const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
        const normalize = v => { const len = Math.sqrt(dot(v,v)); return [v[0]/len, v[1]/len, v[2]/len]; };

        function project3Dto2D(px, py, pz) {
            const ePos = [22.0, 0.0, 0.0];
            const ro = [ 
                ePos[0] + camRadius*Math.sin(camPhi)*Math.cos(camTheta), 
                ePos[1] + camRadius*Math.cos(camPhi), 
                ePos[2] + camRadius*Math.sin(camPhi)*Math.sin(camTheta) 
            ];
            const cw = normalize([ePos[0]-ro[0], ePos[1]-ro[1], ePos[2]-ro[2]]);
            const cp = [0, 1, 0];
            const cu = normalize(cross(cw, cp));
            const cv = normalize(cross(cu, cw));
            const p = [px - ro[0], py - ro[1], pz - ro[2]];
            
            const camZ = dot(p, cw);
            if (camZ <= 0.5) return null; 
            
            let uvX = dot(p, cu) / camZ * 2.2;
            let uvY = dot(p, cv) / camZ * 2.2;
            
            if (Math.abs(uvX) > 10.0 || Math.abs(uvY) > 10.0) return null;
            
            uvX = uvX / currentZoom + currentOffsetX;
            uvY = uvY / currentZoom + currentOffsetY;
            
            return { x: (uvX*canvas.height + canvas.width)/2.0, y: canvas.height - ((uvY*canvas.height + canvas.height)/2.0), z: camZ };
        }

        function buildArcPath(points, centerIndex, svgPath, textPath, textEl) {
            if (points.length < 2 || centerIndex < 0 || centerIndex >= points.length) { 
                svgPath.setAttribute('d', ''); 
                textEl.style.opacity = '0'; 
                return 0; 
            }
            
            let d = `M ${points[0].x} ${points[0].y}`;
            let cumLen = [0]; 
            
            for (let i = 1; i < points.length; i++) {
                let dist = Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y);
                cumLen.push(cumLen[i-1] + dist);
                d += ` L ${points[i].x} ${points[i].y}`;
            }
            
            svgPath.setAttribute('d', d);
            let totalLen = cumLen[cumLen.length - 1];
            let midLen = cumLen[centerIndex]; 
            let offsetPct = (midLen / totalLen) * 100;
            textPath.setAttribute('startOffset', offsetPct + '%');
            textEl.style.opacity = '1';
            
            return totalLen; 
        }

        function updateProtractor(phase, displayDeg) {
            const layer = document.getElementById('core2-protractor-layer');
            const lunInc = smoothstep(0.05, 0.30, phase) * 15.0 * Math.PI / 180.0;

            if (lunInc < 0.02) {
                layer.style.opacity = '0';
                return;
            } else {
                layer.style.opacity = '1';
            }

            const n1 = smoothstep(0.36, 0.63, phase) * (Math.PI / 2.0);
            const n2 = (precessionYear / 18.6) * (2.0 * Math.PI);
            const nodeA = n1 + n2;

            const cosNode = Math.cos(nodeA), sinNode = Math.sin(nodeA);
            const ePos = [22.0, 0.0, 0.0];

            const get3D = (alpha, r, k) => {
                let tx = k * r * Math.cos(alpha);
                let ty = k * r * Math.sin(alpha);
                return [
                    cosNode * tx + ePos[0],
                    ty + ePos[1],
                    sinNode * tx + ePos[2]
                ];
            };

            let pt1 = get3D(lunInc, 8.3, 1);
            let p2d1 = project3Dto2D(...pt1);
            let pt2 = get3D(lunInc, 8.3, -1);
            let p2d2 = project3Dto2D(...pt2);

            let k = 1;
            if (p2d1 && p2d2) {
                k = (p2d1.z < p2d2.z) ? 1 : -1;
            } else if (p2d2) {
                k = -1;
            } else if (!p2d1) {
                layer.style.opacity = '0';
                return; 
            }

            const R_outer = 8.3; 
            const R_ecl = 9.9;   
            const R_arc = 3.5;   
            const R_text = 4.8;  

            let pC = project3Dto2D(...ePos);
            let pE_outer = project3Dto2D(...get3D(0, R_ecl, k));
            let pL_outer = project3Dto2D(...get3D(lunInc, R_outer, k));

            if (!pC || !pE_outer || !pL_outer) {
                layer.style.opacity = '0';
                return;
            }

            let sectorPts = [`${pC.x},${pC.y}`];
            for (let i = 0; i <= 10; i++) {
                let a = (i / 10) * lunInc;
                let p = project3Dto2D(...get3D(a, R_outer, k));
                if (p) sectorPts.push(`${p.x},${p.y}`);
            }
            document.getElementById('core2-pro-sector').setAttribute('points', sectorPts.join(' '));

            let eLine = document.getElementById('core2-pro-line-e');
            eLine.setAttribute('x1', pC.x); eLine.setAttribute('y1', pC.y);
            eLine.setAttribute('x2', pE_outer.x); eLine.setAttribute('y2', pE_outer.y);

            let lLine = document.getElementById('core2-pro-line-l');
            lLine.setAttribute('x1', pC.x); lLine.setAttribute('y1', pC.y);
            lLine.setAttribute('x2', pL_outer.x); lLine.setAttribute('y2', pL_outer.y);

            let pDrop = project3Dto2D(...get3D(0, R_outer * Math.cos(lunInc), k));
            if (pDrop) {
                let dropLine = document.getElementById('core2-pro-line-drop');
                dropLine.setAttribute('x1', pL_outer.x); dropLine.setAttribute('y1', pL_outer.y);
                dropLine.setAttribute('x2', pDrop.x); dropLine.setAttribute('y2', pDrop.y);

                let dropDot = document.getElementById('core2-pro-drop-dot');
                dropDot.setAttribute('cx', pDrop.x); dropDot.setAttribute('cy', pDrop.y);
            }

            let arcD = "";
            let firstArc = true;
            for (let i = 0; i <= 10; i++) {
                let a = (i / 10) * lunInc;
                let p = project3Dto2D(...get3D(a, R_arc, k));
                if (p) {
                    arcD += (firstArc ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
                    firstArc = false;
                }
            }
            document.getElementById('core2-pro-arc-line').setAttribute('d', arcD);

            let centerDot = document.getElementById('core2-pro-center-dot');
            centerDot.setAttribute('cx', pC.x); centerDot.setAttribute('cy', pC.y);

            let pText = project3Dto2D(...get3D(lunInc / 2, R_text, k));
            if (pText) {
                let textEl = document.getElementById('core2-pro-angle-text');
                textEl.setAttribute('x', pText.x);
                textEl.setAttribute('y', pText.y);
                textEl.textContent = displayDeg.toFixed(2) + '°';
            }
        }

        function updateTextArc(phase) {
            const q = Math.max(0, Math.min(Math.floor((phase - 0.0001) * 4.0), 3));
            const a_center = (q + 0.5) * Math.PI * 0.5;
            const a_start = a_center - Math.PI * 0.7;
            const a_end = a_center + Math.PI * 0.7;
            
            const lunSvgPath = document.getElementById('core2-invisible-arc');
            const eclSvgPath = document.getElementById('core2-ecliptic-arc');
            
            // Dynamically recreate lunar text element (HTML-defined one is broken in integrated context)
            var lunTextEl = document.getElementById('core2-lunar-text-dyn');
            var lunTextPath;
            if (!lunTextEl) {
                lunTextEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                lunTextEl.id = 'core2-lunar-text-dyn';
                lunTextEl.classList.add('arc-text', 'lunar-text');
                lunTextPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
                lunTextPath.setAttribute('href', '#core2-invisible-arc');
                lunTextPath.setAttribute('startOffset', '50%');
                lunTextPath.setAttribute('text-anchor', 'middle');
                lunTextEl.appendChild(lunTextPath);
                document.getElementById('core2-text-svg-layer').appendChild(lunTextEl);
                // Hide the broken HTML-defined lunar text element
                var oldLun = document.getElementById('core2-text-path-el');
                if (oldLun && oldLun.parentNode) oldLun.parentNode.style.display = 'none';
            } else {
                lunTextPath = lunTextEl.querySelector('textPath');
            }
            
            lunTextPath.textContent = i18n[currentLang].arcLunar[q]; 

            lunTextEl.setAttribute('fill', '#0d0214');
            lunTextEl.setAttribute('stroke', '#ff4d6d'); 
            lunTextEl.style.textShadow = '0 0 12px rgba(255, 77, 109, 0.8), 0 0 25px rgba(255, 77, 109, 0.6)';

            const eclTextPath = document.getElementById('core2-ecliptic-text-path');
            const eclTextEl = document.querySelector('.ecliptic-text');

            eclTextPath.textContent = i18n[currentLang].arcEcliptic; 
            eclTextEl.setAttribute('fill', '#0d0214');
            eclTextEl.setAttribute('stroke', '#ffcc44'); 
            eclTextEl.style.textShadow = '0 0 12px rgba(255, 204, 68, 0.8), 0 0 25px rgba(255, 200, 50, 0.6)';

            const lunInc = smoothstep(0.05, 0.30, phase) * 15.0 * Math.PI / 180.0;
            const n1 = smoothstep(0.36, 0.63, phase) * (Math.PI / 2.0);
            const n2 = (precessionYear / 18.6) * (2.0 * Math.PI); 
            const nodeA = n1 + n2;

            const cosInc = Math.cos(lunInc), sinInc = Math.sin(lunInc);
            const cosNode = Math.cos(nodeA), sinNode = Math.sin(nodeA);

            let pointsLun = [];
            let pointsEcl = [];
            let centerIndexLun = -1;
            let centerIndexEcl = -1;
            const ePos = [22.0, 0.0, 0.0];
            
            const STEPS = 100;
            const HALF_STEPS = 50; 
            
            for (let i = 0; i <= STEPS; i++) {
                let a = a_start + (a_end - a_start) * (i / STEPS);
                
                let r_lun = 8.3; 
                let lx = r_lun * Math.cos(a), ly = 0, lz = -r_lun * Math.sin(a); 
                let tx = cosInc * lx - sinInc * ly;
                let ty = sinInc * lx + cosInc * ly;
                let tz = lz;

                let wx = cosNode * tx - sinNode * tz + ePos[0];
                let wy = ty + ePos[1];
                let wz = sinNode * tx + cosNode * tz + ePos[2];
                
                let p2dLun = project3Dto2D(wx, wy, wz);
                if (p2dLun) {
                    pointsLun.push(p2dLun);
                    if (i === HALF_STEPS) centerIndexLun = pointsLun.length - 1;
                }
            }

            const a_start_ecl = 0.75; 
            const a_end_ecl = -0.75;

            for (let i = 0; i <= STEPS; i++) {
                let a = a_start_ecl + (a_end_ecl - a_start_ecl) * (i / STEPS);
                
                let r_ecl = 10.2; 
                let ex = ePos[0] + r_ecl * Math.cos(a); 
                let ey = ePos[1] + 0.0;
                let ez = ePos[2] - r_ecl * Math.sin(a); 

                let p2dEcl = project3Dto2D(ex, ey, ez);
                if (p2dEcl) {
                    pointsEcl.push(p2dEcl);
                    if (i === HALF_STEPS) centerIndexEcl = pointsEcl.length - 1;
                }
            }
            
            let lenLun = buildArcPath(pointsLun, centerIndexLun, lunSvgPath, lunTextPath, lunTextEl);
            let lenEcl = buildArcPath(pointsEcl, centerIndexEcl, eclSvgPath, eclTextPath, eclTextEl);

            const defaultCamDist = 22.0;
            let scaleFactor = (defaultCamDist / camRadius) / currentZoom;
            let baseFontSize = Math.max(6, 14.0 * scaleFactor);

            if (lenLun > 0) {
                let textStr = lunTextPath.textContent;
                let charCount = textStr.length > 0 ? textStr.length : 20;
                let dynamicFontSize = Math.max(3, Math.min(baseFontSize, (lenLun / charCount) * 1.3)); 
                lunTextEl.style.fontSize = dynamicFontSize + 'px';
                lunTextEl.style.letterSpacing = (dynamicFontSize * 0.15) + 'px';
                lunTextEl.style.opacity = lenLun < 100 ? (lenLun / 100) : 1;
            }
            
            if (lenEcl > 0) {
                let textStr = eclTextPath.textContent;
                let charCount = textStr.length > 0 ? textStr.length : 20;
                let dynamicFontSize = Math.max(3, Math.min(baseFontSize, (lenEcl / charCount) * 1.3)); 
                eclTextEl.style.fontSize = dynamicFontSize + 'px';
                eclTextEl.style.letterSpacing = (dynamicFontSize * 0.15) + 'px';
                eclTextEl.style.opacity = lenEcl < 100 ? (lenEcl / 100) : 1;
            }
        }

        function render(now) {
            let dt = (now - lastTime) / 1000.0;
            if (dt > 0.1) dt = 0.1; 
            lastTime = now;

            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth; canvas.height = window.innerHeight;
            }
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            let elapsed = (now - startTime) / 1000.0;
            currentProgress += (targetProgress - currentProgress) * (4.0 * dt);
            
            let targetZoom = 1.0, targetOffsetX = 0.0, targetOffsetY = 0.0;
            
            currentZoom += (targetZoom - currentZoom) * (5.0 * dt);
            currentOffsetX += (targetOffsetX - currentOffsetX) * (5.0 * dt);
            currentOffsetY += (targetOffsetY - currentOffsetY) * (5.0 * dt);

            if (targetProgress > 0.9 && currentProgress > 0.8) {
                precessionYear += 2.0 * dt; 
                if (precessionYear > 18.6) precessionYear -= 18.6; 
            } else {
                precessionYear *= Math.exp(-8.0 * dt); 
            }

            let stateIdx = 0;
            if (currentProgress >= 0.15 && currentProgress < 0.5) stateIdx = 1;
            else if (currentProgress >= 0.5 && currentProgress < 0.85) stateIdx = 2;
            else if (currentProgress >= 0.85) stateIdx = 3;
            
            if (percText) percText.innerHTML = i18n[currentLang].stateNames[stateIdx];
            
            updateTextArc(currentProgress);
            let fluctuation = 0.155 * Math.cos(elapsed * 2.0); 
            let curLunDeg = smoothstep(0.05, 0.30, currentProgress) * (5.145 + fluctuation);
            
            if (valLunEl) valLunEl.innerText = curLunDeg.toFixed(2) + '°';

            if (valNodeEl) {
                if (currentProgress > 0.8) {
                    let driftDays = precessionYear * 19.35; 
                    valNodeEl.innerText = `${precessionYear.toFixed(1)} YRS (-${Math.floor(driftDays)}${i18n[currentLang].days})`;
                } else {
                    let n1 = smoothstep(0.36, 0.63, currentProgress) * 90.0;
                    valNodeEl.innerText = n1.toFixed(1) + i18n[currentLang].aligned;
                }
            }
            
            const baseFontSize = 14.0;
            const defaultCamDist = 22.0;
            let scaleFactor = (defaultCamDist / camRadius) / currentZoom;
            let dynamicFontSize = Math.max(6, baseFontSize * scaleFactor);
            
            document.getElementById('core2-pro-angle-text').style.fontSize = dynamicFontSize + 'px';

            updateTextArc(currentProgress);
            updateProtractor(currentProgress, curLunDeg);

            gl.uniform3f(locRes, gl.canvas.width, gl.canvas.height, 1.0);
            gl.uniform3f(locCam, camTheta, camPhi, camRadius);
            
            let safeShaderProgress = currentProgress > 0.0 ? Math.max(0.0, currentProgress - 0.0001) : 0.0;

            gl.uniform1f(locProgress, safeShaderProgress); 
            gl.uniform1f(locTime, elapsed);
            gl.uniform2f(locOffset, currentOffsetX, currentOffsetY);
            gl.uniform1f(locZoom, currentZoom);
            gl.uniform1f(locPrecessionYear, precessionYear);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(render);
        }

        // 直接初始化中文，不再调用 toggleLanguage() 反转
        updateLanguageUI();
        requestAnimationFrame(render);
  };
})();


// ====== core-04.js ======
// CORE Subpage 3
(function() {
  var _mod = { initialized: false, animFrameId: null };
  MoonApp.CoreSubpages._register(3, _mod);

  _mod.init = function() {
    if (_mod.initialized) return;
    _mod.initialized = true;
// ==========================================
        // UI 与 交互逻辑
        // ==========================================
        let currentLang = 'zh';

        const i18n = {
            zh: {
                tab1: "引言", tab2: "上一页", tab3: "下一页", tab4: "首页", langToggle: "ENGLISH",
                references: "References",
                flyTip: "【观测视角：NASA Lucy 探测器】2022年5月，Lucy 探测器在距地球 1 亿公里（约日地距离的 70%）的深空独特视角，使用 L'LORRI 高分辨率相机，凝视并记录了地球阴影投射在月球上的月全食全过程。"
            },
            en: {
                tab1: "INTRO", tab2: "PREV", tab3: "NEXT", tab4: "HOME", langToggle: "中文",
                references: "REFERENCES",
                flyTip: "[VANTAGE POINT: NASA Lucy Spacecraft] On May 15-16, 2022, from 64 million miles away (70% of Earth-Sun distance), Lucy observed the total lunar eclipse. Using its L'LORRI camera, it watched as Earth cast its shadow on the Moon."
            }
        };

        function updateLanguageUI() {
            const dict = i18n[currentLang];
            const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.innerHTML = txt; };
            setTxt('tab-1', dict.tab1); setTxt('tab-2', dict.tab2);
            setTxt('tab-3', dict.tab3); setTxt('tab-4', dict.tab4);
            setTxt('fly-tip', dict.flyTip);
            setTxt('lbl-ref', dict.references); setTxt('lang-btn', dict.langToggle);
        }

        function toggleLanguage() {
            currentLang = currentLang === 'zh' ? 'en' : 'zh';
            updateLanguageUI();
        }

        function switchTopTab(element) {
            document.querySelectorAll('.retro-tab').forEach(tab => tab.classList.remove('active-tab'));
            element.classList.add('active-tab');
        }

        // ==========================================
        // WebGL 动画背景
        // ==========================================
        const canvas = document.getElementById('glcanvas-core-04');
        const gl = canvas.getContext('webgl2', { antialias: false });
        if(!gl) alert("WebGL init failed");

        const vsSource = `#version 300 es
        in vec4 aPosition; void main() { gl_Position = aPosition; }`;

        const fsBufferA = `#version 300 es
        precision highp float;
        out vec4 FragColor;
        uniform vec3 iResolution;
        uniform vec3 uCamParams;
        uniform float uEarthAngle;
        uniform float uMoonAngle;
        uniform float uInclination;
        uniform float uTime;

        #define MAX_DIST 250.0
        #define PI 3.1415926535

        const vec3 SUN_POS = vec3(0.0);
        const float EARTH_ORBIT_R = 30.0;
        const float MOON_ORBIT_R = 4.0;
        struct SdfCtx { float k; vec3 col; float d; };
        float sdSphere(vec3 p, float r) { return length(p) - r; }
        mat3 rotateY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
        mat3 rotateZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0., -s, c, 0., 0., 0., 1.); }
        mat3 calcLookAt(vec3 cp, vec3 at) { vec3 z = normalize(at - cp); vec3 x = normalize(cross(z, vec3(0.0, 1.0, 0.0))); return mat3(x, normalize(cross(x, z)), z); }

        float hash_e(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        float noise_e(vec2 p) {
            vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash_e(i), hash_e(i + vec2(1.0, 0.0)), f.x), mix(hash_e(i + vec2(0.0, 1.0)), hash_e(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        float fbm_e(vec2 p) {
            float s = 0.0, m = 1.0;
            for(int i=0; i<5; i++) { s += noise_e(p * m) / m; m *= 2.0; }
            return s;
        }

        vec3 hash33_m(vec3 p) {
            p = fract(p * vec3(17.16, 31.79, 47.11));
            p += dot(p, p.yxz + 19.19);
            return fract((p.xxy + p.yxx) * p.zyx);
        }
        float getLunarBump(vec3 p) {
            float h = 0.0, freq = 1.2, amp = 1.0;
            for(int layer = 0; layer < 3; layer++) {
                vec3 ip = floor(p * freq), fp = fract(p * freq);
                float minDist = 2.0, radius = 0.5, craterShape = 0.0;
                for(int i=-1; i<=1; i++) {
                    for(int j=-1; j<=1; j++) {
                        for(int k=-1; k<=1; k++) {
                            vec3 offset = vec3(float(i), float(j), float(k));
                            vec3 h3 = hash33_m(ip + offset);
                            vec3 diff = offset + h3 - fp;
                            float d = length(diff);
                            if (h3.z > 0.55) continue;
                            if(d < minDist) { minDist = d; radius = 0.15 + 0.35 * h3.x; }
                        }
                    }
                }
                float x = minDist / radius;
                if (x < 1.0) {
                    float cavity = x * x - 1.0;
                    float rim = smoothstep(0.5, 0.8, x) * smoothstep(1.0, 0.8, x) * 1.6;
                    craterShape = cavity + rim;
                }
                h += craterShape * amp; freq *= 2.1; amp *= 0.4;
            }
            h += fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 0.01;
            return h * 0.5;
        }

        vec3 calcAtmosphere(vec3 ro, vec3 rd, vec3 pEarth, float t_solid, vec2 fragCoord) {
            vec3 sunDir = normalize(SUN_POS - pEarth);
            vec3 relRo = ro - pEarth;
            float b = dot(relRo, rd);
            float c = dot(relRo, relRo) - (1.95 * 1.95);
            float h = b*b - c;
            if(h < 0.0) return vec3(0.0);
            float t_in = max(0.0, -b - sqrt(h));
            float t_out = min(t_solid, -b + sqrt(h));
            if(t_in >= t_out) return vec3(0.0);
            int steps = 15;
            float dt = (t_out - t_in) / float(steps);
            vec3 atmoCol = vec3(0.0);
            float dither = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);
            for(int i=0; i<15; i++) {
                vec3 p = relRo + rd * (t_in + (float(i)+dither) * dt);
                float r = length(p);
                if(r < 1.49) continue;
                vec3 n = p / r;
                float sunDot = dot(n, sunDir);
                float density = smoothstep(1.95, 1.5, r);
                float powDensity = pow(density, 2.5);
                float sunIllumination = smoothstep(-0.2, 0.5, sunDot);
                vec3 c_atmo = vec3(0.1, 0.6, 1.0) * pow(density, 1.5) * sunIllumination * 1.5;
                c_atmo += vec3(0.6, 0.8, 1.0) * pow(density, 8.0) * sunIllumination * 1.5;
                float terminatorGlow = smoothstep(-0.4, 0.2, sunDot) * smoothstep(0.4, -0.2, sunDot);
                vec3 twilightColor = mix(vec3(0.0, 0.3, 0.8), vec3(1.0, 0.7, 0.1), smoothstep(-0.2, 0.2, sunDot));
                c_atmo += twilightColor * terminatorGlow * powDensity * 4.0;
                float nightGlow = smoothstep(0.0, -1.0, sunDot);
                c_atmo += vec3(0.02, 0.05, 0.2) * powDensity * nightGlow * 0.8;
                atmoCol += c_atmo * dt * 0.5;
            }
            return atmoCol;
        }

        vec4 hash4(vec4 n) { return fract(sin(n)*1399763.5453123); }
        float noise4q(vec4 x) {
            vec4 n3 = vec4(0.0, 0.25, 0.5, 0.75);
            vec4 p2 = floor(x.wwww+n3);
            vec4 b = floor(x.xxxx+n3) + floor(x.yyyy+n3)*157.0 + floor(x.zzzz+n3)*113.0;
            vec4 p1 = b + fract(p2*0.00390625)*vec4(164352.0, -164352.0, 163840.0, -163840.0);
            p2 = b + fract((p2+1.0)*0.00390625)*vec4(164352.0, -164352.0, 163840.0, -163840.0);
            vec4 f1 = fract(x.xxxx+n3), f2 = fract(x.yyyy+n3);
            f1=f1*f1*(3.0-2.0*f1); f2=f2*f2*(3.0-2.0*f2);
            vec4 n1 = vec4(0.0,1.0,157.0,158.0), n2 = vec4(113.0,114.0,270.0,271.0);
            vec4 vs1 = mix(hash4(p1), hash4(n1.yyyy+p1), f1);
            vec4 vs2 = mix(hash4(n1.zzzz+p1), hash4(n1.wwww+p1), f1);
            vec4 vs3 = mix(hash4(p2), hash4(n1.yyyy+p2), f1);
            vec4 vs4 = mix(hash4(n1.zzzz+p2), hash4(n1.wwww+p2), f1);
            vs1 = mix(vs1, vs2, f2); vs3 = mix(vs3, vs4, f2);
            vs2 = mix(hash4(n2.xxxx+p1), hash4(n2.yyyy+p1), f1);
            vs4 = mix(hash4(n2.zzzz+p1), hash4(n2.wwww+p1), f1);
            vs2 = mix(vs2, vs4, f2);
            vs4 = mix(hash4(n2.xxxx+p2), hash4(n2.yyyy+p2), f1);
            vec4 vs5 = mix(hash4(n2.zzzz+p2), hash4(n2.wwww+p2), f1);
            vs4 = mix(vs4, vs5, f2);
            f1 = fract(x.zzzz+n3); f2 = fract(x.wwww+n3);
            f1=f1*f1*(3.0-2.0*f1); f2=f2*f2*(3.0-2.0*f2);
            vs1 = mix(vs1, vs2, f1); vs3 = mix(vs3, vs4, f1);
            vs1 = mix(vs1, vs3, f2);
            float r = dot(vs1, vec4(0.25));
            return r*r*(3.0-2.0*r);
        }

        float noiseSpere(vec3 ray, vec3 pos, float r, mat3 mr, float zoom, vec3 subnoise, float anim) {
            float b = dot(ray,pos); float c = dot(pos,pos) - b*b;
            vec3 r1=vec3(0.0); float s=0.0; float d=0.03125; float d2=zoom/(d*d); float ar=5.0;
            for (int i=0;i<3;i++) {
                float rq=r*r;
                if(c <rq) {
                    float l1=sqrt(rq-c); r1= ray*(b-l1)-pos; r1=r1*mr;
                    s+=abs(noise4q(vec4(r1*d2+subnoise*ar,anim*ar))*d);
                }
                ar-=2.0; d*=4.0; d2*=0.0625; r=r-r*0.02;
            }
            return s;
        }
        float ringRayNoise(vec3 ray, vec3 pos, float r, float size, mat3 mr, float anim) {
            float b = dot(ray,pos); vec3 pr=ray*b-pos; float c=length(pr); pr*=mr; pr=normalize(pr);
            float s=max(0.0,(1.0-size*abs(r-c)));
            float nd=noise4q(vec4(pr*1.0,-anim+c))*2.0; nd=pow(nd,2.0);
            float n=0.4; float ns=1.0;
            if (c>r) {
                n=noise4q(vec4(pr*10.0,-anim+c));
                ns=noise4q(vec4(pr*50.0,-anim*2.5+c*2.0))*2.0;
            }
            n=n*n*nd*ns;
            return pow(s,4.0)+s*s*n;
        }

        vec3 getEarthPos() {
            return vec3(cos(uEarthAngle) * EARTH_ORBIT_R, 0.0, -sin(uEarthAngle) * EARTH_ORBIT_R);
        }

        vec3 getMoonPos(vec3 pEarth) {
            vec3 toSun = normalize(SUN_POS - pEarth);
            vec3 xAxis = -toSun;
            vec3 yAxis = vec3(0.0, 1.0, 0.0);
            vec3 zAxis = normalize(cross(xAxis, yAxis));
            vec3 localP = vec3(cos(uMoonAngle) * MOON_ORBIT_R, 0.0, -sin(uMoonAngle) * MOON_ORBIT_R);
            float c = cos(uInclination), s = sin(uInclination);
            vec3 tiltedP = vec3(localP.x * c - localP.y * s, localP.x * s + localP.y * c, localP.z);
            return pEarth + mat3(xAxis, yAxis, zAxis) * tiltedP;
        }

        SdfCtx mapSolid(vec3 p, vec3 pEarth, vec3 pMoon) {
            SdfCtx res = SdfCtx(0.0, vec3(0.0), MAX_DIST);
            float dEarth = sdSphere(p - pEarth, 1.5);
            if(dEarth < res.d) res = SdfCtx(2.0, vec3(0.0), dEarth);
            float dMoon = sdSphere(p - pMoon, 0.4);
            if(dMoon < res.d) res = SdfCtx(3.0, vec3(0.6), dMoon);
            return res;
        }

        vec3 calcNormal(vec3 pos, vec3 pEarth, vec3 pMoon) {
            vec2 e = vec2(0.01, 0.0);
            return normalize(vec3(
                mapSolid(pos+e.xyy, pEarth, pMoon).d - mapSolid(pos-e.xyy, pEarth, pMoon).d,
                mapSolid(pos+e.yxy, pEarth, pMoon).d - mapSolid(pos-e.yxy, pEarth, pMoon).d,
                mapSolid(pos+e.yyx, pEarth, pMoon).d - mapSolid(pos-e.yyx, pEarth, pMoon).d
            ));
        }

        float calcSoftshadow(vec3 ro, vec3 rd, vec3 targetPos, float targetRadius) {
            float res = 1.0, t = 0.05;
            for(int i=0; i<30; i++) {
                float h = sdSphere(ro + rd*t - targetPos, targetRadius);
                res = min(res, 8.0 * h / t); t += clamp(h, 0.05, 1.0);
                if(res < 0.001 || t > 50.0) break;
            }
            return clamp(res, 0.0, 1.0);
        }

        void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec3 pEarth = getEarthPos();
            vec3 pMoon = getMoonPos(pEarth);
            vec2 p_uv = (-iResolution.xy + 2.0 * fragCoord.xy) / iResolution.y;
            vec3 ro = vec3(uCamParams.z * sin(uCamParams.y) * cos(uCamParams.x), uCamParams.z * cos(uCamParams.y), uCamParams.z * sin(uCamParams.y) * sin(uCamParams.x));
            mat3 cam = calcLookAt(ro, SUN_POS);
            vec3 rd = cam * normalize(vec3(p_uv, 2.0));

            float t = 0.0;
            SdfCtx rRes = SdfCtx(0.0, vec3(0.0), 0.0);
            vec3 orbitGlowColor = vec3(0.0);

            for(int i=0; i<150; i++) {
                vec3 p = ro + rd*t;
                rRes = mapSolid(p, pEarth, pMoon);
                float stepDist = rRes.d;

                float dE = length(vec2(length(p.xz) - EARTH_ORBIT_R, p.y));
                vec3 toSun = normalize(SUN_POS - pEarth);
                vec3 xAxis = -toSun, yAxis = vec3(0.0, 1.0, 0.0), zAxis = normalize(cross(xAxis, yAxis));
                vec3 localP = p - pEarth;
                vec3 pLocalProj = vec3(dot(localP, xAxis), dot(localP, yAxis), dot(localP, zAxis));
                float c = cos(-uInclination), s = sin(-uInclination);
                vec3 pUnTilted = vec3(pLocalProj.x * c - pLocalProj.y * s, pLocalProj.x * s + pLocalProj.y * c, pLocalProj.z);
                float dM = length(vec2(length(pUnTilted.xz) - MOON_ORBIT_R, pUnTilted.y));
                float dOrbit = min(dE, dM);
                stepDist = min(stepDist, dOrbit * 0.8 + 0.05);
                stepDist = max(stepDist, 0.05);

                if (dE < 4.0) {
                    float a = atan(-p.z, p.x);
                    float dAngle = mod(uEarthAngle - a, 2.0 * PI);
                    float tail = exp(-dAngle * 0.6);
                    float streamNoise = fbm_e(vec2(a * 15.0, uTime * 2.0));
                    float glowBase = 0.05 / (dE*dE + 0.02);
                    float glowHalo = 0.02 / (dE + 0.05);
                    vec3 colGlow = vec3(0.3, 0.7, 1.0) * tail * (0.6 + 1.4 * streamNoise);
                    colGlow += vec3(0.8, 0.9, 1.0) * exp(-dAngle * 10.0);
                    orbitGlowColor += colGlow * (glowBase + glowHalo) * stepDist * 0.3;
                }

                if (dM < 2.0) {
                    float a = atan(-pUnTilted.z, pUnTilted.x);
                    float dAngle = mod(uMoonAngle - a, 2.0 * PI);
                    float tail = exp(-dAngle * 0.8);
                    float streamNoise = fbm_e(vec2(a * 20.0, uTime * 3.0));
                    float glowBase = 0.05 / (dM*dM + 0.01);
                    float glowHalo = 0.02 / (dM + 0.05);
                    vec3 colGlow = vec3(1.0, 0.16, 0.29) * tail * (0.6 + 1.4 * streamNoise);
                    colGlow += vec3(1.0, 0.5, 0.5) * exp(-dAngle * 10.0);
                    orbitGlowColor += colGlow * (glowBase + glowHalo) * stepDist * 0.2;
                }

                if(rRes.d < 0.002 || t > MAX_DIST) break;
                t += stepDist * 0.9;
            }

            vec3 l_sun = normalize(SUN_POS - ro);
            float sunForward = dot(rd, l_sun);
            vec3 sunBody = vec3(0.0);
            float sunVisE = calcSoftshadow(ro, l_sun, pEarth, 1.5);
            float sunVisM = calcSoftshadow(ro, l_sun, pMoon, 0.4);
            float sunVis = min(sunVisE, sunVisM);
            if (sunForward > 0.0) {
                vec3 pos_sun_scaled = -ro / 4.0;
                mat3 sun_mr = rotateY(uTime * 0.1) * rotateZ(uTime * 0.05);
                float s1 = noiseSpere(rd, pos_sun_scaled, 1.0, sun_mr, 0.5, vec3(0.0), uTime * 0.2);
                s1 = pow(min(1.0, s1 * 2.4), 2.0);
                float s2 = noiseSpere(rd, pos_sun_scaled, 1.0, sun_mr, 4.0, vec3(83.2, 34.3, 67.4), uTime * 0.2);
                s2 = min(1.0, s2 * 2.2);
                float s3 = ringRayNoise(rd, pos_sun_scaled, 0.96, 1.0, sun_mr, uTime * 0.2);
                sunBody = mix(vec3(1.0, 0.6, 0.1), vec3(1.0, 0.9, 0.6), pow(s1, 60.0)) * s1;
                sunBody += mix(mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 0.8, 0.3), pow(s2, 2.0)), vec3(1.0, 0.9, 0.8), pow(s2, 10.0)) * s2;
                vec3 sunRays = mix(vec3(1.0, 0.5, 0.1), vec3(1.0, 0.9, 0.6), pow(s3, 3.0)) * s3;
                sunBody += sunRays * 1.5;
                sunBody *= sunVis;
            }

            vec3 col = vec3(0.0);
            if (t < MAX_DIST && rRes.k > 0.0) {
                vec3 p = ro + rd*t;
                vec3 n = calcNormal(p, pEarth, pMoon);
                vec3 l = normalize(SUN_POS - p);
                vec3 hv = normalize(l - rd);
                if (rRes.k == 2.0) {
                    vec3 pl = p - pEarth;
                    mat3 rotEarth = rotateY(uEarthAngle * 365.25) * rotateZ(0.41);
                    vec3 n_local = normalize(rotEarth * pl);
                    vec2 sph_uv = vec2(atan(n_local.z, n_local.x), asin(n_local.y)) / PI;
                    float continent = fbm_e(sph_uv * 5.0);

                    float dif = clamp(dot(n, l), 0.0, 1.0);
                    float spec = pow(clamp(dot(n, hv), 0.0, 1.0), 30.0) * 1.5;
                    float fresnel = pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 2.2);

                    vec3 lightBlue = vec3(0.392, 0.627, 0.862);
                    vec3 darkBlue = vec3(0.078, 0.156, 0.235);
                    vec3 landColor = vec3(0.15, 0.28, 0.35);
                    vec3 gold = vec3(1.0, 0.745, 0.196);

                    vec3 baseColor = mix(darkBlue, lightBlue, dif);
                    baseColor = mix(baseColor, landColor, smoothstep(0.4, 0.55, continent));

                    vec3 sunlit = baseColor * (dif * 0.8 + 0.2);
                    sunlit += lightBlue * fresnel * 0.6;
                    sunlit += spec;

                    float shadow = calcSoftshadow(p + n * 0.05, l, pMoon, 0.4);
                    float shadowMask = clamp(1.0 - (dif * shadow * 10.0), 0.0, 1.0);
                    vec2 screenP = fragCoord.xy / iResolution.y;
                    float planetSketch = clamp((sin((screenP.y - screenP.x + n.x * 0.015 + n.y * 0.015) * 400.0) + 0.8) * 200.0, 0.0, 1.0);

                    vec3 darkLineColor = darkBlue * 0.2;
                    darkLineColor += gold * fresnel * 0.6;

                    col = mix(sunlit, darkLineColor, shadowMask * planetSketch);
                }
                else if (rRes.k == 3.0) {
                    vec3 pLocalM = p - pMoon;
                    mat3 worldToLocalM = rotateY(uTime * 0.2);
                    mat3 localToWorldM = rotateY(-uTime * 0.2);
                    vec3 pForTex = worldToLocalM * normalize(pLocalM) * 3.5;
                    vec2 e_bump = vec2(0.01, 0.0);
                    float bCenter = getLunarBump(pForTex);
                    vec3 localGrad = vec3(
                        getLunarBump(pForTex + e_bump.xyy) - bCenter,
                        getLunarBump(pForTex + e_bump.yxy) - bCenter,
                        getLunarBump(pForTex + e_bump.yyx) - bCenter
                    ) / e_bump.x;
                    vec3 worldGrad = localToWorldM * localGrad;
                    vec3 n_moon = normalize(n - worldGrad * 0.15);
                    float difM = pow(max(dot(n_moon, l), 0.0), 0.8) * 1.5;
                    float macroDifM = max(dot(n, l), 0.0);
                    float shadowM = calcSoftshadow(p + n * 0.05, l, pEarth, 1.5);
                    shadowM = smoothstep(0.05, 0.8, shadowM);
                    vec3 lightSilver = vec3(0.95, 0.98, 1.0);
                    vec3 darkGray = vec3(0.02, 0.03, 0.04);
                    vec3 moonAlbedo = mix(darkGray, lightSilver, bCenter * 0.8 + 0.2);
                    vec3 sunlitM = moonAlbedo * difM;
                    float fresnelM = pow(1.0 - clamp(dot(-rd, n_moon), 0.0, 1.0), 2.2);
                    sunlitM += lightSilver * fresnelM * 0.15 * shadowM;

                    float shadowMaskM = clamp(1.0 - (macroDifM * shadowM * 15.0), 0.0, 1.0);
                    vec2 screenP = fragCoord.xy / iResolution.y;
                    float planetSketchM = clamp((sin((screenP.y - screenP.x + n.x * 0.015 + n.y * 0.015) * 400.0) + 0.8) * 200.0, 0.0, 1.0);

                    vec3 darkLineColorM = darkGray * 0.1;
                    float distToShadowAxis = length(cross(p - pEarth, l));
                    float umbraIntensity = smoothstep(1.8, 0.0, distToShadowAxis);
                    vec3 eclipseColor = mix(vec3(0.8, 0.2, 0.0), vec3(1.0, 0.0, 0.0), umbraIntensity);
                    float inShadow = 1.0 - shadowM;
                    vec3 bloodGlow = eclipseColor * moonAlbedo * inShadow * pow(macroDifM, 0.5) * 18.0 * umbraIntensity;

                    vec3 dirToEarth = normalize(pEarth - p);
                    float earthShineDif = max(dot(n_moon, dirToEarth), 0.0);
                    vec3 earthLightDir = normalize(pEarth - SUN_POS);
                    float earthPhase = max(dot(earthLightDir, dirToEarth), 0.0);
                    vec3 earthShineColor = vec3(0.15, 0.4, 0.85);
                    vec3 earthShine = earthShineColor * earthShineDif * pow(earthPhase, 2.0) * moonAlbedo * 3.5;
                    vec3 ambientM = vec3(0.002, 0.004, 0.006) * moonAlbedo;

                    col = mix(sunlitM, darkLineColorM, shadowMaskM * planetSketchM);
                    col = col * shadowM + bloodGlow + ambientM + earthShine;
                }
            } else {
                vec3 gradTop = vec3(0.05, 0.01, 0.08); 
                vec3 gradMid = vec3(0.12, 0.02, 0.16); 
                vec3 gradBot = vec3(0.5, 0.1, 0.2); 
                vec2 uv_norm = fragCoord.xy / iResolution.xy;
                vec3 skyCol = mix(gradBot, gradMid, smoothstep(0.0, 0.4, uv_norm.y));
                col = mix(skyCol, gradTop, smoothstep(0.4, 1.0, uv_norm.y));

                if (sunForward > 0.0) col += sunBody;
            }

            col += calcAtmosphere(ro, rd, pEarth, t, fragCoord) * 0.8;
            col += orbitGlowColor;
            FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
        void main() { mainImage(FragColor, gl_FragCoord.xy); }`;

        const fsImage = `#version 300 es
        precision highp float;
        out vec4 FragColor;
        uniform vec2 iResolution; uniform sampler2D iChannel0;
        void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
            vec2 uv = fragCoord/iResolution.xy;
            vec3 col = texture(iChannel0, uv).rgb;
            col = pow(col, vec3(1.15));
            fragColor = vec4(col, 1.0);
        }
        void main() { mainImage(FragColor, gl_FragCoord.xy); }`;

        function compileShader(gl, type, source) {
            const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); return shader;
        }
        function createProgram(gl, vs, fs) {
            const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); return prog;
        }
        const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
        const progBufferA = createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, fsBufferA));
        const progImage = createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, fsImage));

        const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

        const aPosA = gl.getAttribLocation(progBufferA, "aPosition"); const aPosI = gl.getAttribLocation(progImage, "aPosition");
        const locResA = gl.getUniformLocation(progBufferA, "iResolution"); const locTimeA = gl.getUniformLocation(progBufferA, "iTime");
        const locCamA = gl.getUniformLocation(progBufferA, "uCamParams");
        const locEarthAngle = gl.getUniformLocation(progBufferA, "uEarthAngle");
        const locMoonAngle = gl.getUniformLocation(progBufferA, "uMoonAngle");
        const locInc = gl.getUniformLocation(progBufferA, "uInclination");
        const locResI = gl.getUniformLocation(progImage, "iResolution"); const locChan0 = gl.getUniformLocation(progImage, "iChannel0");
        const targetTexture = gl.createTexture(); const fb = gl.createFramebuffer();

        function resize() {
            canvas.width = window.innerWidth; canvas.height = window.innerHeight;
            gl.bindTexture(gl.TEXTURE_2D, targetTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        window.addEventListener('resize', resize); resize();

        let camTh = Math.PI / 4.0, camPh = Math.PI / 3.0, camR = 60.0, isD = false, lX = 0, lY = 0;
        const iL = document.getElementById('core3-interaction-layer');
        iL.onmousedown = e => { isD = true; lX = e.clientX; lY = e.clientY; };
        iL.onmousemove = e => { if(isD){ camTh -= (e.clientX-lX)*0.005; camPh = Math.max(0.01, Math.min(Math.PI-0.01, camPh - (e.clientY-lY)*0.005)); lX = e.clientX; lY = e.clientY; }};
        iL.onmouseup = iL.onmouseleave = () => isD = false;
        iL.onwheel = e => { camR = Math.max(15.0, Math.min(150.0, camR + e.deltaY * 0.05)); };
        let globalSystemAngle = 0, currentTilt = 0.0897;

        const bgCanvas = document.createElement('canvas');
        bgCanvas.style.position = 'absolute'; bgCanvas.style.zIndex = '0'; bgCanvas.style.pointerEvents = 'none';
        const iLayer = document.getElementById('core3-interaction-layer');
        iLayer.parentNode.insertBefore(bgCanvas, iLayer);
        const bgCtx = bgCanvas.getContext('2d');
        const starsArray = Array.from({length: 300}, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5, a: Math.random() }));

        let lastT = performance.now();
        const startTime = performance.now();

        function render() {
            const now = performance.now();
            let dt = Math.min((now - lastT) / 1000.0, 0.1); lastT = now;
            const time = (now - startTime) / 1000.0;

            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth; canvas.height = window.innerHeight;
                bgCanvas.width = canvas.width; bgCanvas.height = canvas.height;
            }

            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            bgCtx.fillStyle = '#ffffff';
            starsArray.forEach(star => {
                let twinkle = 0.4 + 0.6 * Math.sin(time * 2.0 + star.x * 100);
                bgCtx.globalAlpha = star.a * twinkle;
                bgCtx.shadowBlur = star.r * 5; bgCtx.shadowColor = '#ffffff';
                bgCtx.beginPath(); bgCtx.arc(star.x * bgCanvas.width, star.y * bgCanvas.height, star.r, 0, Math.PI*2); bgCtx.fill();
            });
            bgCtx.shadowBlur = 0; bgCtx.globalAlpha = 1.0;

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(0,0,0,0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // 自动推演动画
            globalSystemAngle += dt * 0.1;

            gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, canvas.width, canvas.height);
            gl.useProgram(progBufferA); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.enableVertexAttribArray(aPosA); gl.vertexAttribPointer(aPosA, 2, gl.FLOAT, false, 0, 0);
            gl.uniform3f(locResA, canvas.width, canvas.height, 1.0);
            gl.uniform1f(locTimeA, time);
            gl.uniform3f(locCamA, camTh, camPh, camR);
            gl.uniform1f(locEarthAngle, globalSystemAngle);
            gl.uniform1f(locMoonAngle, globalSystemAngle * 13.37);
            gl.uniform1f(locInc, currentTilt);

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
            gl.useProgram(progImage); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.enableVertexAttribArray(aPosI); gl.vertexAttribPointer(aPosI, 2, gl.FLOAT, false, 0, 0);
            gl.uniform2f(locResI, canvas.width, canvas.height); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, targetTexture); gl.uniform1i(locChan0, 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
            requestAnimationFrame(render);
        }
        updateLanguageUI();
        render();

        // 渲染月食图表
        const eclipseData = [
            { year: 1932, date: "Sep 14", type: "Partial", tot: 0, par: 204, umag: 0.9752, gamma: 0.4664 },
            { year: 1950, date: "Sep 26", type: "Total", tot: 44, par: 210, umag: 1.0783, gamma: 0.4101 },
            { year: 1968, date: "Oct 06", type: "Total", tot: 63, par: 214, umag: 1.1691, gamma: 0.3605 },
            { year: 1986, date: "Oct 17", type: "Total", tot: 74, par: 217, umag: 1.2455, gamma: 0.3188 },
            { year: 2004, date: "Oct 28", type: "Total", tot: 80, par: 219, umag: 1.3081, gamma: 0.2846 },
            { year: 2022, date: "Nov 08", type: "Total", tot: 85, par: 220, umag: 1.3589, gamma: 0.2570 }
        ];

        const gridContainer = document.getElementById('core3-grid');
        const lons = [220, 100, 340, 220, 100, 340];

        eclipseData.forEach((data, index) => {
            const umbraR = 25; const penumbraR = 45; const moonR = 6;
            const yOffset = data.gamma * 45;
            const pathCenterY = 50 - yOffset;
            const pathStartX = 5; const pathStartY = pathCenterY - 14;
            const pathEndX = 95; const pathEndY = pathCenterY + 14;
            const slope = (pathEndY - pathStartY) / (pathEndX - pathStartX);
            const intersectX = pathStartX + (50 - pathStartY) / slope;
            const m1X = 15; const m1Y = pathCenterY - 10.5;
            const m2X = 32.5; const m2Y = pathCenterY - 5.25;
            const m3X = 50; const m3Y = pathCenterY;
            const m4X = 67.5; const m4Y = pathCenterY + 5.25;
            const m5X = 85; const m5Y = pathCenterY + 10.5;

            const isTotal = data.type === 'Total';
            const mFill = isTotal ? 'var(--color-coral)' : 'transparent';
            const mStroke = isTotal ? 'var(--color-coral)' : 'var(--color-base)';
            const typeStr = isTotal ? '月全食' : '月偏食';
            const typeClass = isTotal ? 'type-total' : 'type-partial';

            let ghostShadowPaths = '';
            let histIntersects = [];
            for(let j=0; j<index; j++) {
                let ghostY = 50 - eclipseData[j].gamma * 45;
                let gStartX = 5; let gStartY = ghostY - 14;
                let gEndX = 95; let gEndY = ghostY + 14;
                let gIntersectX = 5 + (50 - gStartY) / slope;
                histIntersects.push(gIntersectX);

                let ageFade = (j + 1) / index;
                let gOpacity = 0.4 + 0.4 * ageFade;
                let gWidth = 0.6 + 0.6 * ageFade;
                ghostShadowPaths += `<line x1="${gStartX}" y1="${gStartY}" x2="${gEndX}" y2="${gEndY}" stroke="var(--color-twilight)" stroke-width="${gWidth}" stroke-dasharray="3,3" opacity="${gOpacity}"/>`;
                ghostShadowPaths += `<circle cx="${gIntersectX}" cy="50" r="1.2" fill="var(--color-twilight)" opacity="${gOpacity}"/>`;
            }

            if (histIntersects.length > 0) {
                let firstX = histIntersects[0];
                ghostShadowPaths += `<line x1="${firstX}" y1="50" x2="${intersectX}" y2="50" stroke="var(--color-coral)" stroke-width="1" stroke-dasharray="2,2" opacity="0.9"/>`;
                ghostShadowPaths += `<text x="${(firstX + intersectX)/2}" y="47" fill="var(--color-coral)" font-size="4" font-family="'Inter', sans-serif" text-anchor="middle" font-weight="600">交点退行 (滑动)</text>`;
            }

            let angleArcSvg = '';
            if (intersectX > 5 && intersectX < 90) {
                let arcR = 8; let arcY = 50 + arcR * slope;
                angleArcSvg = `
                    <path d="M ${intersectX + arcR} 50 Q ${intersectX + arcR} ${50 + arcR * slope / 2} ${intersectX + arcR * 0.95} ${arcY}" fill="none" stroke="var(--color-sand)" stroke-width="0.8"/>
                    <text x="${intersectX + arcR + 2}" y="51" fill="var(--color-sand)" font-size="4" font-family="'Inter', sans-serif" font-weight="600">5°夹角</text>
                    <circle cx="${intersectX}" cy="50" r="1.5" fill="var(--color-sand)"/>
                    <text x="${intersectX}" y="55" fill="var(--color-sand)" font-size="4" font-family="'Inter', sans-serif" text-anchor="middle" font-weight="600">黄白交点</text>
                `;
            }

            let cX = lons[index];
            let sX = (cX + 180) % 360;
            let gammaLatitudeY = 90 - (data.gamma * 60);
            let amplitude = 35;

            const getZonePath = (cx) => {
                const hw = 90;
                return `M ${cx - hw} 0 C ${cx - hw + 15} 60, ${cx - hw + 25} 120, ${cx - hw} 180 L ${cx + hw} 180 C ${cx + hw - 25} 120, ${cx + hw - 15} 60, ${cx + hw} 0 Z`;
            };

            let mapSvgContent = '';
            mapSvgContent += `
                <defs>
                    <radialGradient id="sunGrad${index}" cx="${sX/360}" cy="0.5" r="0.5">
                        <stop offset="0%" stop-color="rgba(255, 180, 100, 0.4)" />
                        <stop offset="100%" stop-color="rgba(255, 180, 100, 0.02)" />
                    </radialGradient>
                </defs>
                <rect width="360" height="180" fill="url(#sunGrad${index})" />
            `;
            // 将暗夜区的颜色加深偏紫
            let nightPaths = getZonePath(cX - 360) + " " + getZonePath(cX) + " " + getZonePath(cX + 360);
            mapSvgContent += `<path d="${nightPaths}" fill="rgba(15, 5, 15, 0.85)" />`;
            mapSvgContent += `<line x1="0" y1="90" x2="360" y2="90" stroke="var(--color-sand)" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6" />`;
            mapSvgContent += `<text x="5" y="86" fill="var(--color-sand)" font-size="5" font-family="'Inter', sans-serif" font-weight="600" opacity="0.9">黄道基准面 (Ecliptic)</text>`;
            for(let j=0; j<index; j++) {
                let gCX = lons[j];
                let gY = 90 - eclipseData[j].gamma * 60;
                let ghostTrack = '';
                for(let px = 0; px <= 360; px += 10) {
                    let py = gY - amplitude * Math.sin((px - gCX) * Math.PI / 180);
                    ghostTrack += `${px === 0 ? 'M ' : 'L '}${px} ${py} `;
                }
                let ageFade = (j + 1) / index;
                let gOpacity = 0.35 + 0.45 * ageFade;
                let gWidth = 0.8 + 0.6 * ageFade;
                mapSvgContent += `<path d="${ghostTrack}" fill="none" stroke="var(--color-twilight)" stroke-width="${gWidth}" stroke-dasharray="4,4" opacity="${gOpacity}"/>`;
            }

            let trackPath = '';
            for(let px = 0; px <= 360; px += 5) {
                let py = gammaLatitudeY - amplitude * Math.sin((px - cX) * Math.PI / 180);
                trackPath += `${px === 0 ? 'M ' : 'L '}${px} ${py} `;
            }
            mapSvgContent += `<path d="${trackPath}" fill="none" stroke="var(--color-base)" stroke-width="1.2" opacity="0.9"/>`;
            mapSvgContent += `<path d="${trackPath}" fill="none" stroke="var(--color-base)" stroke-width="3" opacity="0.2"/>`;
            mapSvgContent += `<text x="5" y="${gammaLatitudeY - amplitude * Math.sin((5 - cX) * Math.PI / 180) - 3}" fill="var(--color-base)" font-size="5" font-family="'Inter', sans-serif" font-weight="600" opacity="0.9">白道滑行面 (Lunar Path)</text>`;

            const drawPoint = (x, y, color, label1, label2, isTarget) => {
                let out = `<circle cx="${x}" cy="${y}" r="2.5" fill="${color}" />`;
                if (isTarget) {
                    out += `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${color}" stroke-width="0.5" style="transform-origin: ${x}px ${y}px;" class="pulse-anim" />`;
                    if (Math.abs(90 - y) > 5) {
                        out += `<line x1="${x}" y1="90" x2="${x}" y2="${y}" stroke="var(--color-coral)" stroke-dasharray="1,1" stroke-width="0.8"/>`;
                    }
                }
                out += `<text x="${x}" y="${y + 12}" fill="${color}" font-size="6" font-weight="700" text-anchor="middle" font-family="'Inter', sans-serif">${label1}</text>`;
                if (label2) {
                    out += `<text x="${x}" y="${y + 18}" fill="${color}" font-size="4" font-family="'Inter', sans-serif" text-anchor="middle" opacity="0.8">${label2}</text>`;
                }
                return out;
            };
            mapSvgContent += drawPoint(sX, 90, 'var(--color-sand)', '✧ 白昼区', '(不可见区域)', false);

            let col = index % 3;
            for (let c = 0; c <= col; c++) {
                let histIndex = index - (col - c);
                let hcX = lons[histIndex];
                let hcY = 90 - eclipseData[histIndex].gamma * 60;
                let ageRank = col - c;

                if (ageRank > 0) {
                    let pointOpacity = ageRank === 1 ? 0.9 : 0.6;
                    mapSvgContent += `<circle cx="${hcX}" cy="${hcY}" r="2" fill="var(--color-twilight)" opacity="${pointOpacity}"/>`;

                    if (ageRank === 1) {
                        let yearsAgo = ageRank * 18;
                        mapSvgContent += `<text x="${hcX}" y="${hcY + 12}" fill="var(--color-twilight)" font-size="5.5" font-family="'Inter', sans-serif" text-anchor="middle" font-weight="800" opacity="0.9">T-${yearsAgo}年</text>`;

                        let nextIndex = histIndex + 1;
                        let nX = lons[nextIndex];
                        let nY = 90 - eclipseData[nextIndex].gamma * 60;
                        let arrowText = `<text x="${(hcX > nX && (hcX - nX) < 180) ? (hcX+nX)/2 : (360+nX)/2}" y="${(hcY+nY)/2 - 5}" fill="var(--color-twilight)" font-size="5.5" font-weight="800" font-family="'Inter', sans-serif" text-anchor="middle">向西 120°</text>`;
                        if (hcX > nX && (hcX - nX) < 180) {
                            mapSvgContent += `<line x1="${hcX - 6}" y1="${hcY}" x2="${nX + 15}" y2="${nY}" stroke="var(--color-twilight)" stroke-dasharray="2,2" stroke-width="1.2" class="flow-anim" />`;
                            mapSvgContent += `<polygon points="${nX+15},${nY} ${nX+22},${nY-3.5} ${nX+22},${nY+3.5}" fill="var(--color-twilight)"/>`;
                            mapSvgContent += arrowText;
                        } else {
                            mapSvgContent += `<line x1="${hcX - 6}" y1="${hcY}" x2="0" y2="${(hcY+nY)/2}" stroke="var(--color-twilight)" stroke-dasharray="2,2" stroke-width="1.2" class="flow-anim" />`;
                            mapSvgContent += `<line x1="360" y1="${(hcY+nY)/2}" x2="${nX + 15}" y2="${nY}" stroke="var(--color-twilight)" stroke-dasharray="2,2" stroke-width="1.2" class="flow-anim" />`;
                            mapSvgContent += `<polygon points="${nX+15},${nY} ${nX+22},${nY-3.5} ${nX+22},${nY+3.5}" fill="var(--color-twilight)"/>`;
                            mapSvgContent += `<text x="${(360+nX)/2}" y="${nY - 5}" fill="var(--color-twilight)" font-size="5.5" font-weight="800" font-family="'Inter', sans-serif" text-anchor="middle">向西 120°</text>`;
                        }
                    }
                } else {
                    mapSvgContent += drawPoint(cX, gammaLatitudeY, 'var(--color-coral)', '⌖ 观测靶心', '', true);
                }
            }

            let gridLines = '';
            for(let i=0; i<=360; i+=30) gridLines += `<line x1="${i}" y1="0" x2="${i}" y2="180" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>`;
            for(let i=0; i<=180; i+=30) gridLines += `<line x1="0" y1="${i}" x2="360" y2="${i}" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>`;

            const cardHTML = `
                <div class="card ${typeClass}">
                    <div class="card-header">
                        <div class="type-info">
                            <div class="type">${typeStr}</div>
                            <div class="saros-label">Orbital Seq.</div>
                        </div>
                        <div class="time-info">
                            <div class="year">${data.year}</div>
                            <div class="exact">${data.date}</div>
                        </div>
                    </div>
                    <div class="shadow-viz">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                            <circle cx="50" cy="50" r="${penumbraR}" fill="none" stroke="var(--color-slate)" stroke-dasharray="1,2" stroke-width="0.5"/>
                            <circle cx="50" cy="50" r="${umbraR}" fill="var(--umbra-fill)" stroke="var(--color-slate)" stroke-width="0.5"/>
                            <line x1="5" y1="50" x2="95" y2="50" stroke="var(--color-sand)" stroke-dasharray="2,2" stroke-width="0.8"/>

                            ${ghostShadowPaths}

                            ${angleArcSvg}

                            <line x1="${pathStartX}" y1="${pathStartY}" x2="${pathEndX}" y2="${pathEndY}" stroke="var(--color-base)" opacity="0.9" stroke-width="1.2"/>

                            <circle cx="${m1X}" cy="${m1Y}" r="${moonR}" fill="#0d0214" stroke="var(--color-slate)" stroke-width="0.5"/>
                            <circle cx="${m2X}" cy="${m2Y}" r="${moonR}" fill="#0d0214" stroke="var(--color-slate)" stroke-width="0.5"/>
                            <circle cx="${m3X}" cy="${m3Y}" r="${moonR}" fill="${mFill}" stroke="${mStroke}" stroke-width="1"/>
                            <circle cx="${m4X}" cy="${m4Y}" r="${moonR}" fill="#0d0214" stroke="var(--color-slate)" stroke-width="0.5"/>
                            <circle cx="${m5X}" cy="${m5Y}" r="${moonR}" fill="#0d0214" stroke="var(--color-slate)" stroke-width="0.5"/>
                        </svg>
                    </div>

                    <div class="data-grid">
                        <div class="data-col">
                            <div class="phys-row"><span class="phys-key">全食时长 (Totality)</span> <span class="phys-val ${data.tot > 0 ? 'coral' : ''}">${data.tot > 0 ? data.tot + 'm' : '--'}</span></div>
                            <div class="phys-row"><span class="phys-key">偏食时长 (Partial)</span> <span class="phys-val twilight">${data.par}m</span></div>
                        </div>
                        <div class="data-col">
                            <div class="phys-row"><span class="phys-key">本影食分 (U.Mag)</span> <span class="phys-val ${isTotal ? 'coral' : ''}">${data.umag.toFixed(4)}</span></div>
                            <div class="phys-row"><span class="phys-key">靶心距 (Gamma)</span> <span class="phys-val">${data.gamma.toFixed(4)}</span></div>
                        </div>
                    </div>
                    <div class="map-header">
                        <span class="title"><span style="color:var(--color-twilight); margin-right:4px;">⊚</span>视界偏移与轨道下沉记录仪</span>
                        <span class="desc">虚线为历史退行轨迹 | 追踪白道面演化</span>
                    </div>

                    <div class="geo-map-viz">
                        <div class="world-map-bg"></div>
                        <svg viewBox="0 0 360 180" preserveAspectRatio="none">
                            ${gridLines}
                            ${mapSvgContent}
                        </svg>
                    </div>
                </div>
            `;
            gridContainer.insertAdjacentHTML('beforeend', cardHTML);
        });
  };
})();
