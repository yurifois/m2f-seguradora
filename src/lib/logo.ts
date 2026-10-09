import raw from '../assets/m2f-logo.svg?raw';

// Logo vetorizada a partir do logobrand.jpg (3 contornos: M, 2, F).
export const LOGO_SVG = raw;
export const LOGO_PATH = /\sd="([^"]+)"/.exec(raw)?.[1] ?? '';
const vb = /viewBox="([^"]+)"/.exec(raw)?.[1].split(/\s+/).map(Number) ?? [0, 0, 694, 441];
export const LOGO_W = vb[2];
export const LOGO_H = vb[3];
export const LOGO_ASPECT = LOGO_W / LOGO_H;
