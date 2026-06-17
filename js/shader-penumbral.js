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