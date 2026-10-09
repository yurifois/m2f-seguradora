import { useEffect, useRef } from 'react';
import { reducedMotion, scene } from '../lib/motion';

// Névoa em shader de tela cheia: ruído simplex (sem blocos, estável até em GPU de celular
// com precisão média) + domain warping, renderizada em resolução adaptativa e esticada por CSS.
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform vec2 uMouse;
uniform float uDensity;

// simplex 2D (Ashima Arts / Stefan Gustavson, MIT)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.55;
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p = p * 2.0 + vec2(17.1, 9.7);
    a *= 0.48;
  }
  return v; // ~[-1, 1]
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  float t = mod(uTime, 3000.0) * 0.035;
  p.y -= uScroll * 0.3;              // acompanha a rolagem (parallax)

  // o cursor afasta a fumaça
  vec2 m = vec2((uMouse.x - 0.5) * aspect, 0.5 - uMouse.y);
  m.y -= uScroll * 0.3;
  vec2 dm = p - m;
  float md = length(dm);
  p += normalize(dm + 1e-4) * 0.08 * exp(-md * md * 14.0);

  // nuvens grandes e macias que sobem e se retorcem devagar
  vec2 rise = vec2(0.0, t);
  vec2 q = vec2(fbm(p * 0.9 - rise * 0.8), fbm(p * 0.9 + vec2(3.1, 7.4) - rise * 0.6));
  float f = fbm(p * 1.35 + q * 0.85 - rise * 1.2 + vec2(t * 0.12, 0.0)) * 0.5 + 0.5;
  float billow = smoothstep(0.36, 0.95, f);
  billow = pow(billow, 1.35);
  float haze = fbm(p * 0.45 - rise * 0.4 + vec2(9.0, 1.0)) * 0.5 + 0.5;

  float dens = (billow * 0.9 + haze * haze * 0.3) * uDensity;
  dens *= mix(1.2, 0.6, uv.y);       // mais densa embaixo, rarefeita no alto
  dens *= 1.0 - 0.45 * exp(-md * md * 12.0);

  vec3 cold = vec3(0.97, 0.99, 1.0);
  vec3 vio  = vec3(0.50, 0.78, 0.82);
  vec3 cy   = vec3(0.17, 0.64, 0.74);
  vec3 col = mix(vio, cold, smoothstep(0.45, 0.95, f));
  col = mix(col, cy, clamp(q.y * 0.6 + 0.3, 0.0, 1.0) * 0.3);

  float alpha = clamp(dens * 1.45, 0.0, 0.58);
  gl_FragColor = vec4(col * alpha, alpha);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

export function SmokeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) {
      canvas.dataset.fallback = 'true';
      return;
    }
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);
    } catch {
      canvas.dataset.fallback = 'true';
      return;
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      scroll: gl.getUniformLocation(prog, 'uScroll'),
      mouse: gl.getUniformLocation(prog, 'uMouse'),
      density: gl.getUniformLocation(prog, 'uDensity'),
    };

    // resolução adaptativa: ~300 mil pixels no máximo (celular fica perto de 60% da tela,
    // full HD perto de 38%) — nítido o bastante para fios finos e leve para qualquer GPU
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = Math.min(0.6, Math.sqrt(300_000 / (w * h)));
      canvas.width = Math.max(2, Math.round(w * scale));
      canvas.height = Math.max(2, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let running = true;
    const t0 = performance.now();
    let density = scene.smokeDensity;
    let scroll = window.scrollY / window.innerHeight;
    let mx = 0.5;
    let my = 0.5;
    let last = 0;

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (now - last < 28) return; // ~35 fps é suficiente para fumaça
      last = now;
      density += (scene.smokeDensity - density) * 0.05;
      scroll += (window.scrollY / window.innerHeight - scroll) * 0.08;
      mx += (scene.mouseX - mx) * 0.04;
      my += (scene.mouseY - my) * 0.04;
      gl.uniform1f(u.time, (now - t0) / 1000);
      gl.uniform1f(u.scroll, scroll);
      gl.uniform2f(u.mouse, mx, my);
      gl.uniform1f(u.density, density);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (reducedMotion) {
      gl.uniform1f(u.time, 12);
      gl.uniform1f(u.scroll, 0);
      gl.uniform2f(u.mouse, -5, -5);
      gl.uniform1f(u.density, 0.7);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      raf = requestAnimationFrame(frame);
    }

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reducedMotion && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  return <canvas ref={ref} className="smoke" aria-hidden="true" />;
}
