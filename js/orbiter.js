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