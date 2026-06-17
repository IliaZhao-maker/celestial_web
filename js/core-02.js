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
