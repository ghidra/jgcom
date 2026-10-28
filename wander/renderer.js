"use strict";
// WebGL output for JSNES. Each emulated frame is uploaded as a 256x240 texture,
// run through a half-resolution glow chain, then composited by the CRT pass,
// which is sized to the display's real pixels.

const NES_WIDTH = 256;
const NES_HEIGHT = 240;
const GLOW_WIDTH = NES_WIDTH / 2;
const GLOW_HEIGHT = NES_HEIGHT / 2;

// One triangle covering the viewport. Texture row 0 is the top of the NES frame
// in every texture, but the canvas's row 0 is its bottom, so only the final
// (canvas) pass flips uv.y.
function vertexShader(flipY) {
  return `#version 300 es
out vec2 v_uv;
void main() {
  vec2 pos = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  v_uv = (pos + 1.0) * 0.5;
  ${flipY ? "v_uv.y = 1.0 - v_uv.y;" : ""}
  gl_Position = vec4(pos, 0.0, 1.0);
}`;
}

// Glow source: a per-channel power curve, so a pixel's strongest channels
// dominate its glow (at 2.5: 0.9 -> 0.77, 0.3 -> 0.05), averaged down to half size.
const GLOW_SOURCE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_frame;
uniform float u_curve;  // higher = only the brightest colors glow
out vec4 out_color;
vec3 curve(ivec2 texel) {
  return pow(texelFetch(u_frame, texel, 0).rgb, vec3(u_curve));
}
void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy) * 2;
  vec3 sum = curve(texel) + curve(texel + ivec2(1, 0))
           + curve(texel + ivec2(0, 1)) + curve(texel + ivec2(1, 1));
  out_color = vec4(sum * 0.25, 1.0);
}`;

// Separable 9-tap Gaussian, using linear filtering to cover it in 5 samples.
const BLUR_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_source;
uniform vec2 u_step;  // blur direction scaled to texels (times spread)
in vec2 v_uv;
out vec4 out_color;
void main() {
  vec3 color = texture(u_source, v_uv).rgb * 0.2270270270;
  color += (texture(u_source, v_uv + u_step * 1.3846153846).rgb
          + texture(u_source, v_uv - u_step * 1.3846153846).rgb) * 0.3162162162;
  color += (texture(u_source, v_uv + u_step * 3.2307692308).rgb
          + texture(u_source, v_uv - u_step * 3.2307692308).rgb) * 0.0702702703;
  out_color = vec4(color, 1.0);
}`;

// 1. Chromatic aberration: red and blue are sampled pushed apart along the
//    line from the center, growing with distance squared (sharp center,
//    fringed corners). The glow gets the same fringe.
// 2. Aperture-grille mask: each NES pixel spans u_scale device columns, split
//    into thirds that pass only red, green, then blue.
// 3. Glow: added on top of the mask (light spreading in the glass isn't
//    striped), which also restores brightness the mask removes.
// 4. Vignette: rounded-rectangle falloff, darkest in the corners, to suggest
//    a tube's shape without warping the image.
const CRT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_frame;
uniform sampler2D u_glow;
uniform float u_scale;          // device pixels per NES pixel (integer)
uniform float u_mask_strength;  // 0 = plain pixels, 1 = pure RGB stripes
uniform float u_aberration;     // red/blue offset at the corners, in NES pixels
uniform float u_glow_strength;  // 0 = no glow
uniform float u_vignette;       // 0 = none, 1 = corners fully dark
uniform float u_vignette_start; // superellipse distance where darkening begins
uniform float u_vignette_end;   // distance where it reaches full strength
in vec2 v_uv;
out vec4 out_color;
void main() {
  vec2 p = v_uv * 2.0 - 1.0;        // -1..1, center is 0
  float r2 = dot(p, p) * 0.5;       // 0 at center, 1 at the corners

  // |p| is sqrt(2) at a corner, so this is u_aberration NES pixels there.
  vec2 shift = p * (r2 * u_aberration / 1.41421356) / vec2(256.0, 240.0);
  vec2 uv_r = v_uv - shift;
  vec2 uv_b = v_uv + shift;
  vec3 color = vec3(texture(u_frame, uv_r).r, texture(u_frame, v_uv).g, texture(u_frame, uv_b).b);
  vec3 glow = vec3(texture(u_glow, uv_r).r, texture(u_glow, v_uv).g, texture(u_glow, uv_b).b);

  float column = floor(mod(floor(gl_FragCoord.x), u_scale) * 3.0 / u_scale);
  vec3 stripe = vec3(column == 0.0, column == 1.0, column == 2.0);
  color *= mix(vec3(1.0), stripe, u_mask_strength);

  color += glow * u_glow_strength;

  // Superellipse distance: 1 at the edge midpoints, ~1.12 at the corners.
  vec2 a = abs(p);
  float d = pow(pow(a.x, 6.0) + pow(a.y, 6.0), 1.0 / 6.0);
  color *= 1.0 - u_vignette * smoothstep(u_vignette_start, max(u_vignette_end, u_vignette_start + 0.001), d);

  out_color = vec4(color, 1.0);
}`;

// Shader tuning defaults. maskStrength (0-1) sets the RGB stripe mask, which
// needs a 3x or larger scale since smaller scales have no room for three
// columns per pixel; aberration is the corner color fringe in NES pixels; glow
// is the glow intensity; glowSize scales the glow radius; glowCurve is the
// glow source's power curve; vignette (0-1) is how dark the corners get, from
// vignetteStart to vignetteEnd (superellipse distance, ~1.12 at the corners).
const GL_SCREEN_DEFAULTS = Object.freeze({
  maskStrength: 1, aberration: 1, glow: 0.5, glowSize: 1, glowCurve: 2.5,
  vignette: 0.6, vignetteStart: 0.55, vignetteEnd: 1.12
});

// Effects that can be switched off independently of their tuning values.
const GL_SCREEN_EFFECTS = Object.freeze(["mask", "aberration", "glow", "vignette"]);

// Creates a WebGL canvas inside `container` that draws `pixels` (a 256x240
// RGBA Uint8Array) on each draw() call. Returns null if WebGL2 is unavailable
// or the shaders fail to build, so the caller can keep the 2D canvas.
// `options` overrides GL_SCREEN_DEFAULTS; `options.enabled` maps effect names
// from GL_SCREEN_EFFECTS to booleans (all on by default). configure() takes
// the same shape at any time and redraws the last frame, so changes show
// while the emulator is paused.
function createGLScreen(container, pixels, options = {}) {
  const settings = { ...GL_SCREEN_DEFAULTS };
  const enabled = Object.fromEntries(GL_SCREEN_EFFECTS.map(name => [name, true]));

  function applyOptions({ enabled: enabledChanges, ...values } = {}) {
    for (const [name, value] of Object.entries(values)) {
      if (name in settings && Number.isFinite(value)) settings[name] = value;
    }
    for (const [name, value] of Object.entries(enabledChanges ?? {})) {
      if (name in enabled) enabled[name] = Boolean(value);
    }
  }
  applyOptions(options);
  const glowStrength = () => enabled.glow ? settings.glow : 0;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) {
    console.warn("WebGL2 unavailable; using the 2D canvas.");
    return null;
  }

  let crt = null;
  let glowSource = null;
  let blur = null;
  let frameTexture = null;
  let glowTargets = null;  // [result, scratch]
  let hasFrame = false;
  let scale = 1;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error("Shader compile failed: " + gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  function createProgram(fragmentSource, flipY, uniformNames) {
    const handle = gl.createProgram();
    gl.attachShader(handle, compile(gl.VERTEX_SHADER, vertexShader(flipY)));
    gl.attachShader(handle, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(handle);
    if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) {
      throw new Error("Shader link failed: " + gl.getProgramInfoLog(handle));
    }
    const uniforms = {};
    for (const name of uniformNames) uniforms[name] = gl.getUniformLocation(handle, name);
    return { handle, uniforms };
  }

  function createTexture(format, width, height, filter) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, format, width, height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  // Half-float avoids banding in the dim tail of the blur; 8-bit is the fallback.
  function createGlowTarget(formats) {
    for (const format of formats) {
      const texture = createTexture(format, GLOW_WIDTH, GLOW_HEIGHT, gl.LINEAR);
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (complete) return { texture, framebuffer };
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
    }
    throw new Error("Could not create a glow render target.");
  }

  // Builds all GL resources; also runs again after a lost context is restored.
  function init() {
    crt = createProgram(CRT_SHADER, true, ["u_frame", "u_glow", "u_scale", "u_mask_strength",
      "u_aberration", "u_glow_strength", "u_vignette", "u_vignette_start", "u_vignette_end"]);
    glowSource = createProgram(GLOW_SOURCE_SHADER, false, ["u_curve"]);
    blur = createProgram(BLUR_SHADER, false, ["u_step"]);
    gl.useProgram(crt.handle);
    gl.uniform1i(crt.uniforms.u_frame, 0);
    gl.uniform1i(crt.uniforms.u_glow, 1);

    // No vertex buffers: the vertex shader derives positions from gl_VertexID.
    gl.bindVertexArray(gl.createVertexArray());

    gl.activeTexture(gl.TEXTURE0);
    frameTexture = createTexture(gl.RGBA8, NES_WIDTH, NES_HEIGHT, gl.NEAREST);
    const formats = gl.getExtension("EXT_color_buffer_float") ? [gl.RGBA16F, gl.RGBA8] : [gl.RGBA8];
    glowTargets = [createGlowTarget(formats), createGlowTarget(formats)];
    hasFrame = false;
  }

  function drawInto(target, program, sourceTexture) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, GLOW_WIDTH, GLOW_HEIGHT);
    gl.useProgram(program.handle);
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  }

  // Leaves the finished glow in glowTargets[0].
  function updateGlow() {
    const [result, scratch] = glowTargets;
    gl.activeTexture(gl.TEXTURE0);
    drawInto(result, glowSource, frameTexture);
    gl.uniform1f(glowSource.uniforms.u_curve, settings.glowCurve);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Two blur rounds; the second is twice as wide for a soft tail.
    for (const spread of [settings.glowSize, settings.glowSize * 2]) {
      drawInto(scratch, blur, result.texture);
      gl.uniform2f(blur.uniforms.u_step, spread / GLOW_WIDTH, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      drawInto(result, blur, scratch.texture);
      gl.uniform2f(blur.uniforms.u_step, 0, spread / GLOW_HEIGHT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  function render() {
    if (gl.isContextLost()) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (!hasFrame) {
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    gl.useProgram(crt.handle);
    gl.uniform1f(crt.uniforms.u_scale, scale);
    gl.uniform1f(crt.uniforms.u_mask_strength, enabled.mask && scale >= 3 ? settings.maskStrength : 0);
    gl.uniform1f(crt.uniforms.u_aberration, enabled.aberration ? settings.aberration : 0);
    gl.uniform1f(crt.uniforms.u_glow_strength, glowStrength());
    gl.uniform1f(crt.uniforms.u_vignette, enabled.vignette ? settings.vignette : 0);
    gl.uniform1f(crt.uniforms.u_vignette_start, settings.vignetteStart);
    gl.uniform1f(crt.uniforms.u_vignette_end, settings.vignetteEnd);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, glowTargets[0].texture);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Unbind so the glow texture is never bound while it is being rendered into.
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
  }

  function draw() {
    if (gl.isContextLost()) return;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NES_WIDTH, NES_HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    if (glowStrength() > 0) updateGlow();
    hasFrame = true;
    render();
  }

  // The frame texture still holds the last frame, so rebuild its glow and
  // present it again with the new settings.
  function configure(changes) {
    applyOptions(changes);
    if (gl.isContextLost()) return;
    if (hasFrame && glowStrength() > 0) updateGlow();
    render();
  }

  try {
    init();
  } catch (error) {
    console.error(error);
    return null;
  }

  // The page redraws the last frame after a restore; until then it stays black.
  canvas.addEventListener("webglcontextlost", event => event.preventDefault());
  canvas.addEventListener("webglcontextrestored", () => {
    try { init(); render(); } catch (error) { console.error(error); }
  });

  // Size the canvas to the largest whole multiple of 256x240 that fits the
  // container in physical pixels, so every NES pixel covers an exact
  // scale x scale block of device pixels.
  const resizer = new ResizeObserver(([entry]) => {
    const box = entry.devicePixelContentBoxSize?.[0];
    const availableWidth = box ? box.inlineSize : Math.round(entry.contentRect.width * devicePixelRatio);
    const availableHeight = box ? box.blockSize : Math.round(entry.contentRect.height * devicePixelRatio);
    const newScale = Math.max(1, Math.floor(Math.min(availableWidth / NES_WIDTH, availableHeight / NES_HEIGHT)));
    if (newScale !== scale || canvas.width !== NES_WIDTH * newScale) {
      scale = newScale;
      canvas.width = NES_WIDTH * scale;
      canvas.height = NES_HEIGHT * scale;
      canvas.style.width = canvas.width / devicePixelRatio + "px";
      canvas.style.height = canvas.height / devicePixelRatio + "px";
      console.info(`Output scale ${scale}x: ${canvas.width}x${canvas.height} device px` +
        (scale >= 3 ? "" : " (RGB mask off; needs 3x)"));
    }
    render(); // Resizing clears the canvas; the textures still hold the last frame.
  });
  try {
    resizer.observe(container, { box: "device-pixel-content-box" });
  } catch {
    resizer.observe(container);
  }

  container.appendChild(canvas);
  return {
    canvas, draw, configure,
    get settings() { return { ...settings }; },
    get enabled() { return { ...enabled }; },
    get scale() { return scale; }
  };
}
