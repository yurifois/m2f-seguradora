import { useEffect, useRef } from 'react';
import { reducedMotion, scene } from '../lib/motion';

// Névoa em shader de tela cheia (fbm com domain warping), renderizada em baixa
// resolução e esticada por CSS — fumaça é macia por natureza, então 35% da
// resolução basta e custa quase nada de GPU.
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

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5) * 1.7;
  float t = uTime * 0.045;
  p.y -= uScroll * 0.55;             // a névoa acompanha a rolagem (parallax)
  p.y -= t * 0.9;                    // e sobe devagar, como fumaça

  // o cursor empurra a fumaça
  vec2 m = vec2((uMouse.x - 0.5) * aspect, 0.5 - uMouse.y) * 1.7;
  m.y -= uScroll * 0.55 + t * 0.9;
  vec2 dm = p - m;
  float md = length(dm);
  p += normalize(dm + 1e-4) * 0.22 * exp(-md * md * 5.0);

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t * 0.7));
  vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 1.15), fbm(p + 3.2 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 2.6 * r);

  float wisps = smoothstep(0.38, 0.92, f);
  float dens = wisps * uDensity;
  dens *= mix(1.15, 0.7, uv.y);      // mais densa embaixo
  dens *= 1.0 - 0.45 * exp(-md * md * 6.0);

  vec3 cold = vec3(0.70, 0.76, 1.0);
  vec3 vio  = vec3(0.40, 0.41, 0.93);
  vec3 cy   = vec3(0.0, 0.62, 0.96);
  vec3 col = mix(vio, cold, clamp(r.x * 1.2, 0.0, 1.0));
  col = mix(col, cy, clamp(q.y * q.y, 0.0, 1.0) * 0.55);

  float a = clamp(dens * 0.62, 0.0, 0.62);
  gl_FragColor = vec4(col * a, a);
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

    const resize = () => {
      const scale = window.innerWidth < 700 ? 0.3 : 0.36;
      canvas.width = Math.max(2, Math.round(window.innerWidth * scale));
      canvas.height = Math.max(2, Math.round(window.innerHeight * scale));
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
      gl.uniform1f(u.density, 0.5);
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
