// Casa + carro se desfazendo em poeira (WebGL2). Tudo é função do progresso t (0 → 1),
// então a rolagem para cima remonta a imagem grão a grão.
//
// A imagem é dividida numa grade; cada célula tem um "atraso" (varredura da esquerda para a
// direita + ruído). Enquanto a célula não chegou na vez dela, o quad desenha a imagem nítida;
// quando chega, o quad a descarta e a partícula daquela célula sai voando com o vento.

export type CarBox = { left: number; top: number; width: number };

const DELAY_GLSL = /* glsl */ `
uniform vec2 uGrid;
uniform float uT;
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
  vec2 uv = (cell + 0.5) / uGrid;
  float sweep = uv.x * 0.8 + (1.0 - uv.y) * 0.2;
  float d = sweep * 0.7 + vnoise(cell / 9.0) * 0.16 + vnoise(cell / 2.5) * 0.08 + hash(cell) * 0.06;
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
  if (s > 0.0) discard;
  // borda que está prestes a se desfazer brilha em ciano
  float edge = smoothstep(-0.05, 0.0, s);
  c.rgb = mix(c.rgb, vec3(0.6, 0.93, 1.0) * c.a, edge * 0.75);
  o = c;
}`;

const DUST_VS = /* glsl */ `#version 300 es
precision highp float;
${DELAY_GLSL}
in vec2 aCell;
in vec4 aColor;
in vec2 aRand;
uniform vec4 uRect;
uniform vec2 uView;
uniform float uDpr;
out vec4 vColor;
void main() {
  float s = since(aCell);
  float lt = clamp(s / 0.38, 0.0, 1.0);
  vec2 pos = uRect.xy + (aCell + 0.5) / uGrid * uRect.zw;
  float cellPx = uRect.z / uGrid.x;
  float e = lt * lt;
  // vento para a direita e para cima, com redemoinho
  pos += vec2(1.0, -0.4) * (0.16 + 0.42 * aRand.x) * uView.x * e;
  pos.y -= (24.0 + 110.0 * aRand.y) * lt;
  pos += vec2(sin(lt * 7.0 + aRand.y * 6.283), cos(lt * 5.0 + aRand.x * 6.283)) * 28.0 * lt;
  gl_Position = vec4(pos.x / uView.x * 2.0 - 1.0, 1.0 - pos.y / uView.y * 2.0, 0.0, 1.0);
  gl_PointSize = s > 0.0 ? cellPx * uDpr * (1.6 - 1.0 * lt) : 0.0;
  float a = pow(1.0 - lt, 1.3);
  vColor = vec4(mix(aColor.rgb, vec3(0.6, 0.93, 1.0) * aColor.a, 0.3 + 0.45 * lt), aColor.a) * a;
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

/** Imagem da casa com a mesma máscara do CSS (piso se dissolvendo) e o carro estacionado. */
function compose(casa: HTMLImageElement, carro: HTMLImageElement, car: CarBox) {
  const W = casa.naturalWidth;
  const H = casa.naturalHeight;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(casa, 0, 0, W, H);
  ctx.globalCompositeOperation = 'destination-in';
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0.68, '#000');
  g.addColorStop(0.97, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  const cw = W * car.width;
  ctx.drawImage(carro, W * car.left, H * car.top, cw, (cw * carro.naturalHeight) / carro.naturalWidth);
  return cv;
}

export function createDust(
  canvas: HTMLCanvasElement,
  house: HTMLElement,
  casa: HTMLImageElement,
  carro: HTMLImageElement,
  car: CarBox,
) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return null;

  let ready = false;
  let disposed = false;
  let lastT = -1;
  let count = 0;
  let grid: [number, number] = [1, 1];
  let quadProg: WebGLProgram | null = null;
  let dustProg: WebGLProgram | null = null;
  let quadVao: WebGLVertexArrayObject | null = null;
  let dustVao: WebGLVertexArrayObject | null = null;
  let tex: WebGLTexture | null = null;
  const buffers: WebGLBuffer[] = [];
  let view = { w: 1, h: 1, dpr: 1 };

  const resize = () => {
    view = { w: window.innerWidth, h: window.innerHeight, dpr: Math.min(window.devicePixelRatio || 1, 2) };
    canvas.width = Math.round(view.w * view.dpr);
    canvas.height = Math.round(view.h * view.dpr);
    if (ready && lastT >= 0) draw(lastT);
  };

  const build = (casaFull: HTMLImageElement, carroFull: HTMLImageElement) => {
    if (disposed) return;
    const src = compose(casaFull, carroFull, car);
    const W = src.width;
    const H = src.height;
    const cols = window.innerWidth < 700 ? 240 : 380;
    const rows = Math.round((cols * H) / W);
    grid = [cols, rows];
    const data = src.getContext('2d')!.getImageData(0, 0, W, H).data;
    const cells: number[] = [];
    const colors: number[] = [];
    const rands: number[] = [];
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const x = Math.min(W - 1, Math.floor(((cx + 0.5) * W) / cols));
        const y = Math.min(H - 1, Math.floor(((cy + 0.5) * H) / rows));
        const i = (y * W + x) * 4;
        const a = data[i + 3] / 255;
        if (a < 0.05) continue;
        cells.push(cx, cy);
        colors.push((data[i] / 255) * a, (data[i + 1] / 255) * a, (data[i + 2] / 255) * a, a);
        rands.push(Math.random(), Math.random());
      }
    }
    count = cells.length / 2;

    quadProg = compile(gl, QUAD_VS, QUAD_FS);
    dustProg = compile(gl, DUST_VS, DUST_FS);

    const attr = (prog: WebGLProgram, name: string, arr: Float32Array, size: number) => {
      const b = gl.createBuffer()!;
      buffers.push(b);
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    };
    quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);
    attr(quadProg, 'aPos', new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2);
    dustVao = gl.createVertexArray();
    gl.bindVertexArray(dustVao);
    attr(dustProg, 'aCell', new Float32Array(cells), 2);
    attr(dustProg, 'aColor', new Float32Array(colors), 4);
    attr(dustProg, 'aRand', new Float32Array(rands), 2);
    gl.bindVertexArray(null);

    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    ready = true;
    resize();
  };

  const uniforms = (prog: WebGLProgram, t: number) => {
    gl.useProgram(prog);
    // posição da casa sem transform (a entrada já terminou quando a poeira começa)
    gl.uniform4f(gl.getUniformLocation(prog, 'uRect'), house.offsetLeft, house.offsetTop, house.offsetWidth, house.offsetHeight);
    gl.uniform2f(gl.getUniformLocation(prog, 'uView'), view.w, view.h);
    gl.uniform2f(gl.getUniformLocation(prog, 'uGrid'), grid[0], grid[1]);
    gl.uniform1f(gl.getUniformLocation(prog, 'uT'), t);
  };

  const draw = (t: number) => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (t <= 0 || t >= 1) return;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    uniforms(quadProg!, t);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(quadProg!, 'uTex'), 0);
    gl.bindVertexArray(quadVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    uniforms(dustProg!, t);
    gl.uniform1f(gl.getUniformLocation(dustProg!, 'uDpr'), view.dpr);
    gl.bindVertexArray(dustVao);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.bindVertexArray(null);
  };

  // cópias soltas das imagens: com srcset, naturalWidth do <img> vem corrigido pela densidade
  const load = (src: string) => {
    const im = new Image();
    im.src = src;
    return im.decode().then(() => im);
  };
  Promise.all([load(casa.currentSrc || casa.src), load(carro.currentSrc || carro.src)])
    .then(([a, b]) => build(a, b))
    .catch(() => {
      /* sem poeira: o Hero cai no fade simples */
    });
  window.addEventListener('resize', resize);

  return {
    get ready() {
      return ready;
    },
    /** t: 0 = imagem inteira (desenhada pelo DOM), 1 = tudo virou poeira e sumiu */
    render(t: number) {
      if (!ready || t === lastT) return;
      lastT = t;
      canvas.style.visibility = t > 0 && t < 1 ? 'visible' : 'hidden';
      draw(t);
    },
    dispose() {
      disposed = true;
      window.removeEventListener('resize', resize);
      buffers.forEach((b) => gl.deleteBuffer(b));
      if (tex) gl.deleteTexture(tex);
      if (quadProg) gl.deleteProgram(quadProg);
      if (dustProg) gl.deleteProgram(dustProg);
      // sem loseContext: o mesmo canvas é reaproveitado se o efeito for recriado (StrictMode, HMR)
    },
  };
}

export type Dust = NonNullable<ReturnType<typeof createDust>>;
