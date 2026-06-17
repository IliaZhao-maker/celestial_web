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