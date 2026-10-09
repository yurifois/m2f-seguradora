import { useEffect, useRef } from 'react';
import { reducedMotion, scene } from '../lib/motion';

// Fumaça turquesa fluida: a imagem das faixas de fumaça (organza) é usada como textura e
// escoa continuamente por um campo de fluxo (técnica de "flow map" com duas fases), com
// ondulação lenta, parallax na rolagem e o cursor afastando a fumaça. Por baixo, uma névoa
// procedural bem leve. Tudo num único shader, em resolução adaptativa.
const RIBBONS_SRC = '/img/editorial/fumaca.webp';
const RIBBONS_ASPECT = 1024 / 1536; // altura / largura da imagem

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;        // tamanho do canvas (px)
uniform vec2 uView;       // tamanho da janela (px CSS)
uniform float uTime;
uniform float uScroll;    // rolagem em px CSS
uniform vec2 uMouse;      // 0..1
uniform float uDensity;
uniform sampler2D uTex;
uniform float uReady;
uniform float uImgW;      // largura da faixa de fumaça na tela (px CSS)
uniform float uAspect;    // altura / largura da imagem

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
  for (int i = 0; i < 3; i++) {
    v += a * snoise(p);
    p = p * 2.0 + vec2(17.1, 9.7);
    a *= 0.5;
  }
  return v;
}

// a imagem se repete na vertical espelhada (sem emenda) e some nas bordas laterais
vec4 ribbon(vec2 uv) {
  uv.y = 1.0 - abs(mod(uv.y, 2.0) - 1.0);
  float edge = smoothstep(0.0, 0.03, uv.x) * smoothstep(1.0, 0.97, uv.x);
  return texture2D(uTex, vec2(clamp(uv.x, 0.0, 1.0), uv.y)) * edge;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 css = vec2(uv.x * uView.x, (1.0 - uv.y) * uView.y); // px CSS a partir do topo
  float t = mod(uTime, 3600.0);

  // ---- faixas de fumaça (textura) escoando
  vec4 rib = vec4(0.0);
  if (uReady > 0.5) {
    float ih = uImgW * uAspect;
    vec2 iuv = vec2((css.x - uView.x * 0.5) / uImgW + 0.5, (css.y + uScroll * 0.35) / ih);
    iuv.y += t * 0.006;                                   // sobe devagar
    iuv.x += sin(iuv.y * 5.0 + t * 0.32) * 0.014;         // ondulação ampla
    iuv.y += sin(iuv.x * 4.2 - t * 0.27) * 0.012;

    // campo de fluxo suave + o cursor empurrando
    vec2 pf = css / uView.y * 1.3;
    vec2 flow = vec2(snoise(pf + vec2(0.0, t * 0.06)), snoise(pf + vec2(7.3, 2.1) - vec2(t * 0.05, 0.0)));
    vec2 m = uMouse * uView;
    vec2 dm = (css - m) / uView.y;
    float md = length(dm);
    flow += normalize(dm + 1e-4) * 1.4 * exp(-md * md * 16.0);

    float speed = 0.034;
    float ph0 = fract(t * 0.09);
    float ph1 = fract(t * 0.09 + 0.5);
    vec4 c0 = ribbon(iuv + flow * speed * ph0);
    vec4 c1 = ribbon(iuv + flow * speed * ph1 + vec2(0.0, 0.003));
    rib = mix(c0, c1, abs((0.5 - ph0) / 0.5));
  }

  // ---- névoa turquesa macia por baixo
  vec2 ph = vec2((uv.x - 0.5) * uView.x / uView.y, uv.y - 0.5);
  ph.y -= uScroll / uView.y * 0.3;
  vec2 rise = vec2(0.0, t * 0.035);
  vec2 q = vec2(fbm(ph * 0.9 - rise), fbm(ph * 0.9 + vec2(3.1, 7.4) - rise * 0.7));
  float f = fbm(ph * 1.4 + q * 0.9 - rise * 1.2) * 0.5 + 0.5;
  float haze = smoothstep(0.4, 0.95, f) * uDensity * 0.22;
  vec3 hazeCol = mix(vec3(0.33, 0.76, 0.86), vec3(0.62, 0.9, 0.95), f);

  // faixas mais fortes no hero, um pouco mais suaves atrás do conteúdo
  float k = 0.5 + 0.48 * uDensity;
  float ra = rib.a * k;
  vec3 col = rib.rgb * k + hazeCol * haze * (1.0 - ra);
  float alpha = ra + haze * (1.0 - ra);
  gl_FragColor = vec4(col, alpha);
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
      view: gl.getUniformLocation(prog, 'uView'),
      time: gl.getUniformLocation(prog, 'uTime'),
      scroll: gl.getUniformLocation(prog, 'uScroll'),
      mouse: gl.getUniformLocation(prog, 'uMouse'),
      density: gl.getUniformLocation(prog, 'uDensity'),
      tex: gl.getUniformLocation(prog, 'uTex'),
      ready: gl.getUniformLocation(prog, 'uReady'),
      imgW: gl.getUniformLocation(prog, 'uImgW'),
      aspect: gl.getUniformLocation(prog, 'uAspect'),
    };
    gl.uniform1i(u.tex, 0);
    gl.uniform1f(u.ready, 0);
    gl.uniform1f(u.aspect, RIBBONS_ASPECT);

    // resolução adaptativa: até ~750 mil pixels — nítido para as bordas da fumaça e leve
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = Math.min(0.9, Math.sqrt(750_000 / (w * h)));
      canvas.width = Math.max(2, Math.round(w * scale));
      canvas.height = Math.max(2, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform2f(u.view, w, h);
      gl.uniform1f(u.imgW, Math.max(w * 1.15, 850));
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let running = true;
    let disposed = false;
    const t0 = performance.now();
    let density = scene.smokeDensity;
    let scroll = window.scrollY;
    let mx = 0.5;
    let my = 0.5;
    let last = 0;

    const draw = (now: number) => {
      density += (scene.smokeDensity - density) * 0.05;
      scroll += (window.scrollY - scroll) * 0.1;
      mx += (scene.mouseX - mx) * 0.05;
      my += (scene.mouseY - my) * 0.05;
      gl.uniform1f(u.time, (now - t0) / 1000);
      gl.uniform1f(u.scroll, scroll);
      gl.uniform2f(u.mouse, mx, my);
      gl.uniform1f(u.density, density);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (now - last < 28) return; // ~35 fps é suficiente para fumaça
      last = now;
      draw(now);
    };

    // textura das faixas de fumaça
    const tex = gl.createTexture();
    const img = new Image();
    img.decoding = 'async';
    img.src = RIBBONS_SRC;
    img
      .decode()
      .then(() => {
        if (disposed) return;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1f(u.ready, 1);
        document.documentElement.dataset.smoke = 'webgl'; // esconde a versão estática em CSS
        if (reducedMotion) draw(t0 + 12_000);
      })
      .catch(() => {
        /* sem a textura: fica só a névoa procedural (e a fumaça estática do CSS) */
      });

    if (reducedMotion) draw(t0 + 12_000);
    else raf = requestAnimationFrame(frame);

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
      disposed = true;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  return <canvas ref={ref} className="smoke" aria-hidden="true" />;
}
