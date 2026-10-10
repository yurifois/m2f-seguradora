// Desenhos do hero se desfazendo em poeira (WebGL2). Tudo é função do progresso t (0 → 1),
// então a rolagem para cima remonta os desenhos grão a grão.
//
// Cada camada (um SVG) vira uma textura e é dividida numa grade. Cada célula tem um "atraso"
// (varredura da esquerda para a direita na tela + ruído). Enquanto não chega a vez dela, o quad
// desenha a textura nítida; quando chega, o quad a descarta e a partícula da célula sai com o vento.

export type DustSource = { image: HTMLImageElement; pad: number };
export type DustLayer = { el: Element; source: () => Promise<DustSource> };

const DELAY_GLSL = /* glsl */ `
uniform vec4 uRect;
uniform vec2 uView;
uniform vec2 uGrid;
uniform float uT;
uniform float uSeed;
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
}
// > 0: a célula já virou poeira. Frente de varredura irregular (ruído suave) com poucos grãos soltos.
float since(vec2 cell) {
  vec2 home = uRect.xy + (cell + 0.5) / uGrid * uRect.zw;
  float sweep = home.x / uView.x * 0.8 + (1.0 - home.y / uView.y) * 0.2;
  vec2 c = cell + uSeed;
  float d = sweep * 0.7 + vnoise(c / 9.0) * 0.16 + vnoise(c / 2.5) * 0.08 + hash(c) * 0.06;
  return uT - d * 0.62;
}
`;

const QUAD_VS = /* glsl */ `#version 300 es
in vec2 aPos;
uniform vec4 uRect;
uniform vec2 uView;
out vec2 vUv;
void main() {
  vUv = aPos;
  vec2 px = uRect.xy + aPos * uRect.zw;
  gl_Position = vec4(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0, 0.0, 1.0);
}`;

const QUAD_FS = /* glsl */ `#version 300 es
precision highp float;
${DELAY_GLSL}
uniform sampler2D uTex;
in vec2 vUv;
out vec4 o;
void main() {
  vec4 c = texture(uTex, vUv);
  float s = since(floor(vUv * uGrid));
  // traço sólido sai célula a célula (a partícula leva); brilho e sombra só esmaecem com a varredura
  if (s > 0.0) {
    if (c.a > 0.15) discard;
    c *= 1.0 - smoothstep(0.0, 0.08, s);
  }
  // borda que está prestes a se desfazer brilha
  float edge = smoothstep(-0.05, 0.0, s);
  c.rgb = mix(c.rgb, vec3(0.7, 0.95, 1.0) * c.a, edge * 0.75);
  o = c;
}`;

const DUST_VS = /* glsl */ `#version 300 es
precision highp float;
${DELAY_GLSL}
in vec2 aCell;
in vec4 aColor;
in vec2 aRand;
uniform float uDpr;
out vec4 vColor;
void main() {
  float s = since(aCell);
  float lt = clamp(s / 0.38, 0.0, 1.0);
  vec2 pos = uRect.xy + (aCell + 0.5) / uGrid * uRect.zw;
  float cellPx = uRect.z / uGrid.x;
  float e = lt * lt;
  // vento para a direita e para cima, com redemoinho
  pos += vec2(1.0, -0.4) * (0.12 + 0.36 * aRand.x) * uView.x * e;
  pos.y -= (20.0 + 90.0 * aRand.y) * lt;
  pos += vec2(sin(lt * 7.0 + aRand.y * 6.283), cos(lt * 5.0 + aRand.x * 6.283)) * 24.0 * lt;
  gl_Position = vec4(pos.x / uView.x * 2.0 - 1.0, 1.0 - pos.y / uView.y * 2.0, 0.0, 1.0);
  gl_PointSize = s > 0.0 ? cellPx * uDpr * (1.7 - 1.0 * lt) : 0.0;
  float a = pow(1.0 - lt, 1.3);
  vColor = vec4(mix(aColor.rgb, vec3(0.62, 0.92, 1.0) * aColor.a, 0.2 + 0.4 * lt), aColor.a) * a;
}`;

const DUST_FS = /* glsl */ `#version 300 es
precision highp float;
in vec4 vColor;
out vec4 o;
void main() {
  float d = length(gl_PointCoord - 0.5);
  o = vColor * smoothstep(0.5, 0.12, d);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
  return prog;
}

/**
 * Retrato de um SVG já no estado final, com margem e o brilho do CSS (drop-shadow) refeito
 * como filtro SVG — a imagem da poeira precisa bater com o que estava na tela.
 */
export function snapshotSvg(svg: SVGSVGElement, finalize: (clone: SVGSVGElement) => void, padPx = 64): Promise<DustSource> {
  const w = svg.clientWidth;
  const h = svg.clientHeight;
  const vb = svg.viewBox.baseVal;
  const unit = vb.width / w; // unidades do viewBox por pixel CSS
  const pad = padPx * unit;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const clone = svg.cloneNode(true) as SVGSVGElement;
  finalize(clone);
  clone.removeAttribute('style');
  clone.removeAttribute('class');
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `${vb.x - pad} ${vb.y - pad} ${vb.width + 2 * pad} ${vb.height + 2 * pad}`);
  clone.setAttribute('width', String(Math.round((w + 2 * padPx) * dpr)));
  clone.setAttribute('height', String(Math.round((h + 2 * padPx) * dpr)));
  const ns = 'http://www.w3.org/2000/svg';
  const filter = document.createElementNS(ns, 'filter');
  filter.id = 'dust-glow';
  filter.setAttribute('filterUnits', 'userSpaceOnUse');
  filter.setAttribute('x', String(vb.x - pad));
  filter.setAttribute('y', String(vb.y - pad));
  filter.setAttribute('width', String(vb.width + 2 * pad));
  filter.setAttribute('height', String(vb.height + 2 * pad));
  filter.innerHTML =
    `<feDropShadow dx="0" dy="0" stdDeviation="${4 * unit}" flood-color="#00b0e4" flood-opacity=".55"/>` +
    `<feDropShadow dx="0" dy="${22 * unit}" stdDeviation="${13 * unit}" flood-color="#004669" flood-opacity=".2"/>`;
  clone.querySelector('defs')?.appendChild(filter);
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('filter', 'url(#dust-glow)');
  [...clone.childNodes].forEach((n) => {
    if (n.nodeName !== 'defs') g.appendChild(n);
  });
  clone.appendChild(g);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  const image = new Image();
  image.src = url;
  return image
    .decode()
    .then(() => ({ image, pad: padPx }))
    .finally(() => URL.revokeObjectURL(url));
}

type Built = {
  el: Element;
  pad: number;
  grid: [number, number];
  tex: WebGLTexture;
  dustVao: WebGLVertexArrayObject;
  count: number;
  seed: number;
  buffers: WebGLBuffer[];
};

export function createDust(canvas: HTMLCanvasElement, layers: DustLayer[], cellPx: number) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return null;

  let ready = false;
  let disposed = false;
  let lastT = -1;
  let quadProg: WebGLProgram | null = null;
  let dustProg: WebGLProgram | null = null;
  let quadVao: WebGLVertexArrayObject | null = null;
  const quadBuffers: WebGLBuffer[] = [];
  const built: Built[] = [];
  let view = { w: 1, h: 1, dpr: 1 };

  const resize = () => {
    view = { w: window.innerWidth, h: window.innerHeight, dpr: Math.min(window.devicePixelRatio || 1, 2) };
    canvas.width = Math.round(view.w * view.dpr);
    canvas.height = Math.round(view.h * view.dpr);
    if (ready && lastT >= 0) draw(lastT);
  };

  const attr = (prog: WebGLProgram, name: string, arr: Float32Array, size: number, into: WebGLBuffer[]) => {
    const b = gl.createBuffer()!;
    into.push(b);
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };

  const buildLayer = (el: Element, src: DustSource, seed: number): Built => {
    const { image, pad } = src;
    const W = image.naturalWidth;
    const H = image.naturalHeight;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(image, 0, 0, W, H);
    const r = el.getBoundingClientRect();
    const cols = Math.max(40, Math.round((r.width + 2 * pad) / cellPx));
    const rows = Math.max(40, Math.round((cols * H) / W));
    const data = ctx.getImageData(0, 0, W, H).data;
    const cells: number[] = [];
    const colors: number[] = [];
    const rands: number[] = [];
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const x = Math.min(W - 1, Math.floor(((cx + 0.5) * W) / cols));
        const y = Math.min(H - 1, Math.floor(((cy + 0.5) * H) / rows));
        const i = (y * W + x) * 4;
        const a = data[i + 3] / 255;
        if (a < 0.15) continue; // sombra fraca não vira grão: só some com a dissolução
        cells.push(cx, cy);
        colors.push((data[i] / 255) * a, (data[i + 1] / 255) * a, (data[i + 2] / 255) * a, a);
        rands.push(Math.random(), Math.random());
      }
    }
    const buffers: WebGLBuffer[] = [];
    const dustVao = gl.createVertexArray()!;
    gl.bindVertexArray(dustVao);
    attr(dustProg!, 'aCell', new Float32Array(cells), 2, buffers);
    attr(dustProg!, 'aColor', new Float32Array(colors), 4, buffers);
    attr(dustProg!, 'aRand', new Float32Array(rands), 2, buffers);
    gl.bindVertexArray(null);

    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { el, pad, grid: [cols, rows], tex, dustVao, count: cells.length / 2, seed, buffers };
  };

  const build = (sources: DustSource[]) => {
    if (disposed) return;
    quadProg = compile(gl, QUAD_VS, QUAD_FS);
    dustProg = compile(gl, DUST_VS, DUST_FS);
    quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);
    attr(quadProg, 'aPos', new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2, quadBuffers);
    gl.bindVertexArray(null);
    sources.forEach((src, i) => built.push(buildLayer(layers[i].el, src, i * 37.0)));
    ready = true;
    resize();
  };

  const uniforms = (prog: WebGLProgram, layer: Built, t: number) => {
    gl.useProgram(prog);
    // posição do SVG na tela (a entrada já terminou quando a poeira começa) + a margem do retrato
    const r = layer.el.getBoundingClientRect();
    gl.uniform4f(gl.getUniformLocation(prog, 'uRect'), r.left - layer.pad, r.top - layer.pad, r.width + 2 * layer.pad, r.height + 2 * layer.pad);
    gl.uniform2f(gl.getUniformLocation(prog, 'uView'), view.w, view.h);
    gl.uniform2f(gl.getUniformLocation(prog, 'uGrid'), layer.grid[0], layer.grid[1]);
    gl.uniform1f(gl.getUniformLocation(prog, 'uT'), t);
    gl.uniform1f(gl.getUniformLocation(prog, 'uSeed'), layer.seed);
  };

  const draw = (t: number) => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (t <= 0 || t >= 1) return;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    for (const layer of built) {
      uniforms(quadProg!, layer, t);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, layer.tex);
      gl.uniform1i(gl.getUniformLocation(quadProg!, 'uTex'), 0);
      gl.bindVertexArray(quadVao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      uniforms(dustProg!, layer, t);
      gl.uniform1f(gl.getUniformLocation(dustProg!, 'uDpr'), view.dpr);
      gl.bindVertexArray(layer.dustVao);
      gl.drawArrays(gl.POINTS, 0, layer.count);
    }
    gl.bindVertexArray(null);
  };

  Promise.all(layers.map((l) => l.source()))
    .then(build)
    .catch(() => {
      /* sem poeira: o Hero cai no fade simples */
    });
  window.addEventListener('resize', resize);

  return {
    get ready() {
      return ready;
    },
    /** t: 0 = desenhos inteiros (no DOM), 1 = tudo virou poeira e sumiu */
    render(t: number) {
      if (!ready || t === lastT) return;
      lastT = t;
      canvas.style.visibility = t > 0 && t < 1 ? 'visible' : 'hidden';
      draw(t);
    },
    dispose() {
      disposed = true;
      window.removeEventListener('resize', resize);
      for (const l of built) {
        l.buffers.forEach((b) => gl.deleteBuffer(b));
        gl.deleteTexture(l.tex);
        gl.deleteVertexArray(l.dustVao);
      }
      quadBuffers.forEach((b) => gl.deleteBuffer(b));
      if (quadProg) gl.deleteProgram(quadProg);
      if (dustProg) gl.deleteProgram(dustProg);
      // sem loseContext: o mesmo canvas é reaproveitado se o efeito for recriado (StrictMode, HMR)
    },
  };
}

export type Dust = NonNullable<ReturnType<typeof createDust>>;
