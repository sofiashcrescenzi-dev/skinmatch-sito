// LE SCHEDE PER ESTESO delle pagine prodotto (src/data/schede.json, da scripts/catalogo/al_sito.py):
// la pelle, l'INCI, le fonti, le misure, il confronto. Solo per le pagine generate nella build:
// mai da un componente 'use client', altrimenti 800 KB finiscono nel browser.

import DATI from '@/data/schede.json';

export type Formato = { misura: string; prezzo: number; al_10: number | null; link: string };
export type SchedaEstesa = {
  titolo: string;
  pelle: { sebo: ('basso' | 'medio' | 'alto')[]; idr: ('ok' | 'disidratata')[]; reattiva: 0 | 1 | 2 } | null;
  bisogni: string[];
  capelli: { cute: string[]; bisogni: string[] } | null;
  integrazione: string[] | null;
  gravidanza: boolean | null;
  alcol: boolean | null;
  oli_essenziali: boolean | null;
  inci: string[] | null;
  fonti: Record<string, string>;
  mancano: string[];
  prezzo_pieno: number | null;
  formati: Formato[];
  confronto: { ricco?: string; economico?: string };
};

const SCHEDE = (DATI as unknown as { schede: Record<string, SchedaEstesa> }).schede;

export const estesa = (id: string): SchedaEstesa | undefined => SCHEDE[id];
