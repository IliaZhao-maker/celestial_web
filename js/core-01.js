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
