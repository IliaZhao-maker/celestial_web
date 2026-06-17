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
