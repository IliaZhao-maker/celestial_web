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
