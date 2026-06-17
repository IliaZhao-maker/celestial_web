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