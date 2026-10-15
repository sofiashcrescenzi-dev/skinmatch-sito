// Piccoli aiuti di formato, senza dipendenze: li usano i componenti del sito senza tirarsi dietro il
// catalogo intero (che pesa 200 KB e serve solo al test e alla pagina del catalogo).
export const euro = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export function negozio(p: { merchant?: string; affiliateUrl: string }): string | null {
  if (p.merchant) return p.merchant;
  if (p.affiliateUrl.includes('amazon.')) return 'Amazon';
  return null;
}
