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