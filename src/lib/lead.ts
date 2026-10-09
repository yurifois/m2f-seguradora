import type { ProductId } from '../data/content';
import { scrollToSection } from './motion';

export type LeadDraft = { products: ProductId[]; details: string };

const EVENT = 'm2f:lead';

/** Leva o que foi simulado para o formulário e rola até ele. */
export function sendToForm(draft: LeadDraft) {
  window.dispatchEvent(new CustomEvent<LeadDraft>(EVENT, { detail: draft }));
  scrollToSection('contato');
}

export function onLeadDraft(fn: (d: LeadDraft) => void) {
  const handler = (e: Event) => fn((e as CustomEvent<LeadDraft>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export const brl = (v: number, digits = 2) =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const compactBrl = (v: number) =>
  v >= 1_000_000
    ? `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`
    : `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`;
