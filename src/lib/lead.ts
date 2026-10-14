import { waLink, type ProductId } from '../data/content';
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

/** (61) 99999-9999 enquanto digita. */
export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

/**
 * Envia o contato: para o endpoint, se existir (VITE_LEAD_ENDPOINT), ou abre o WhatsApp da M2F com a
 * mensagem pronta. Sem endpoint, o WhatsApp abre ainda dentro do clique (antes de qualquer await),
 * para o navegador não bloquear a janela.
 */
export async function submitLead(data: Record<string, unknown>, message: string): Promise<'whatsapp' | 'sent' | 'error'> {
  const endpoint = import.meta.env.VITE_LEAD_ENDPOINT as string | undefined;
  if (!endpoint) {
    window.open(waLink(message), '_blank', 'noopener');
    return 'whatsapp';
  }
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, mensagemFormatada: message }),
    });
    if (!res.ok) throw new Error(String(res.status));
    return 'sent';
  } catch {
    return 'error';
  }
}
