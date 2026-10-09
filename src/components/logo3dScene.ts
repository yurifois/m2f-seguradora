// Cena Three.js da logo M2F extrudada em 3D. Carregada sob demanda (import
// dinâmico) para não pesar no primeiro carregamento.
import {
  NeutralToneMapping,
  Color,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  PointLight,
  DirectionalLight,
  SRGBColorSpace,
  Scene,
  Shape,
  WebGLRenderer,
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LOGO_H, LOGO_SVG, LOGO_W } from '../lib/logo';
import { scene as shared } from '../lib/motion';

type Options = { anchor: HTMLElement; onReady: () => void };

const FOV = 30;
const DIST = 10;
const VIS_H = 2 * DIST * Math.tan((FOV * Math.PI) / 360);
const TAU = Math.PI * 2;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createLogoScene(canvas: HTMLCanvasElement, { anchor, onReady }: Options) {
  const mobile = window.innerWidth < 700;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, DIST);

  // --- geometria: SVG -> shapes -> extrusão com bisel
  const data = new SVGLoader().parse(LOGO_SVG);
  const shapes: Shape[] = [];
  for (const path of data.paths) shapes.push(...SVGLoader.createShapes(path));
  const depth = 62;
  const geo = new ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: 9,
    bevelSize: 3.4,
    bevelSegments: 6,
    curveSegments: 8,
  });

  // degradê da paleta clara: petróleo no topo, turquesa embaixo (y do SVG cresce para baixo)
  const top = new Color('#1B7184');
  const mid = new Color('#3FA5B4');
  const bot = new Color('#66CED6');
  const pos = geo.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(1, Math.max(0, pos.getY(i) / LOGO_H));
    if (t < 0.5) c.copy(top).lerp(mid, t * 2);
    else c.copy(mid).lerp(bot, (t - 0.5) * 2);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geo.translate(-LOGO_W / 2, -LOGO_H / 2, -depth / 2);

  const uniforms = { uWhite: { value: 0 }, uGlow: { value: 0.3 } };
  const material = new MeshPhysicalMaterial({
    vertexColors: true,
    metalness: 0.35,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.1,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWhite = uniforms.uWhite;
    shader.uniforms.uGlow = uniforms.uGlow;
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float uWhite;\nuniform float uGlow;\nvoid main() {')
      .replace(
        '#include <color_fragment>',
        '#if defined( USE_COLOR )\n  diffuseColor.rgb *= mix(vColor.rgb, vec3(1.0), uWhite);\n#endif',
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * uGlow * (1.0 - uWhite);',
      );
  };

  const mesh = new Mesh(geo, material);
  const pivot = new Group();
  pivot.add(mesh);
  scene.add(pivot);

  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 8);
  scene.add(key);
  const rimV = new PointLight(0x1b7184, 60, 30);
  rimV.position.set(-5, 3, -3);
  scene.add(rimV);
  const rimC = new PointLight(0x09a9bf, 60, 30);
  rimC.position.set(5, -3, -2);
  scene.add(rimC);

  // --- encaixe na âncora CSS (mesma posição que o hero usa para o nome)
  let fitScale = 1;
  const fit = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const r = anchor.getBoundingClientRect();
    const unit = VIS_H / h; // unidades de mundo por pixel no plano z=0
    fitScale = (r.width * unit) / LOGO_W;
    pivot.position.set((r.left + r.width / 2 - w / 2) * unit, -(r.top + r.height / 2 - h / 2) * unit, 0);
  };
  fit();
  window.addEventListener('resize', fit);

  // --- animação
  let raf = 0;
  let running = true;
  let rotY = -Math.PI * 1.4;
  let spin = 5.5; // entrada: gira rápido e desacelera até a velocidade de cruzeiro
  let intro = 0;
  let tiltX = 0;
  let tiltZ = 0;
  let prev = performance.now();
  let readyFired = false;

  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const exit = shared.heroExit;
    if (exit >= 0.999 && readyFired) {
      // fora do hero: some e para de renderizar
      if (canvas.style.opacity !== '0') canvas.style.opacity = '0';
      return;
    }

    intro = Math.min(1, intro + dt / 1.8);
    const ei = 1 - Math.pow(1 - intro, 4);
    const cruise = 0.62;
    spin += (cruise - spin) * Math.min(1, dt * 1.6);

    const slow = 1 - smooth(0, 0.55, exit);
    if (slow > 0.02) {
      rotY += spin * dt * slow + shared.scrollVelocity * 0.0009 * slow;
    }
    // na saída, a logo para de frente
    if (exit > 0) {
      const front = Math.round(rotY / TAU) * TAU;
      rotY += (front - rotY) * Math.min(1, dt * 3.2 * smooth(0, 0.6, exit) + 0.002);
    }
    tiltX += ((shared.mouseY - 0.5) * 0.35 - tiltX) * 0.05;
    tiltZ += ((shared.mouseX - 0.5) * -0.12 - tiltZ) * 0.05;
    const bob = Math.sin(now / 1400) * 0.05 * slow;

    const s = fitScale * (0.55 + 0.45 * ei) * (1 - 0.06 * shared.heroProgress) * (1 + 0.08 * exit);
    mesh.scale.set(s, -s, s);
    pivot.rotation.set(tiltX * slow + bob, rotY, tiltZ * slow);

    uniforms.uWhite.value = smooth(0.05, 0.7, exit);
    material.metalness = 0.35 - 0.27 * uniforms.uWhite.value;
    material.roughness = 0.24 + 0.04 * uniforms.uWhite.value;
    canvas.style.opacity = String((1 - smooth(0.55, 1, exit)) * ei);

    renderer.render(scene, camera);
    if (!readyFired) {
      readyFired = true;
      onReady();
    }
  };
  raf = requestAnimationFrame(frame);

  const onVis = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener('visibilitychange', onVis);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', fit);
    document.removeEventListener('visibilitychange', onVis);
    geo.dispose();
    material.dispose();
    envRT.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
}
