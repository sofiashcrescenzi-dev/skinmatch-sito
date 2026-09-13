// Modello dati del catalogo prodotti.
//
// Due tipi di prodotto in questa fase:
// - isPlaceholder: true  -> prodotto FITTIZIO, serve solo a testare l'interfaccia
//                           per categorie non ancora coperte da marche vere.
//                           Va rimosso appena c'è un prodotto reale al suo posto.
// - linkPending: true    -> prodotto REALE (marca e nome veri), ma il link di
//                           affiliazione non è ancora collegato (affiliateUrl è
//                           un segnaposto '#'). Anche i prezzi sono indicativi,
//                           trovati via ricerca web, da verificare sul rivenditore
//                           reale prima della pubblicazione.

export type Gender = 'donna' | 'uomo' | 'unisex';
export type Category =
  | 'detergenti'
  | 'creme'
  | 'sieri'
  | 'attivi'
  | 'shampoo'
  | 'barba'
  | 'capelli';
export type Tier = 'base' | 'top' | 'premium';

export const GENDER_LABELS: Record<Gender, string> = {
  donna: 'Donna',
  uomo: 'Uomo',
  unisex: 'Unisex',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  detergenti: 'Detergenti',
  creme: 'Creme',
  sieri: 'Sieri',
  attivi: 'Attivi',
  shampoo: 'Shampoo',
  barba: 'Prodotti Barba',
  capelli: 'Prodotti Capelli',
};

export const TIER_LABELS: Record<Tier, string> = {
  base: 'Base',
  top: 'Top',
  premium: 'Premium',
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  gender: Gender;
  category: Category;
  tier: Tier;
  korean: boolean;
  price: number; // prezzo indicativo in EUR
  description: string;
  affiliateUrl: string; // '#' finché non c'è un link di affiliazione reale
  isPlaceholder?: boolean;
  linkPending?: boolean;
};

export const PRODUCTS: Product[] = [
  // ────────────────────────────────────────────────────────────
  // K-BEAUTY
  // ────────────────────────────────────────────────────────────
  {
    id: 'kb1',
    name: 'Relief Sun: Rice + Probiotics SPF50+ PA++++',
    brand: 'Beauty of Joseon',
    gender: 'unisex',
    category: 'creme',
    tier: 'base',
    korean: true,
    price: 17,
    description: 'Il solare coreano più virale al mondo: protezione SPF50+, finish naturale, non unge. Con estratto di riso e probiotici.',
    affiliateUrl: '#',
    linkPending: true,
  },
  {
    id: 'kb2',
    name: 'Glow Serum: Propolis + Niacinamide',
    brand: 'Beauty of Joseon',
    gender: 'unisex',
    category: 'sieri',
    tier: 'base',
    korean: true,
    price: 17,
    description: 'Siero illuminante con propoli e niacinamide, texture leggera, per un incarnato luminoso e uniforme.',
    affiliateUrl: '#',
    linkPending: true,
  },
  {
    id: 'kb3',
    name: 'Zero Pore Pad 2.0',
    brand: 'Medicube',
    gender: 'unisex',
    category: 'detergenti',
    tier: 'top',
    korean: true,
    price: 25,
    description: 'Dischetti esfolianti imbevuti di acidi (AHA/BHA/PHA) per minimizzare i pori e opacizzare la pelle mista/grassa.',
    affiliateUrl: '#',
    linkPending: true,
  },
  {
    id: 'kb4',
    name: 'Collagen Jelly Cream',
    brand: 'Medicube',
    gender: 'donna',
    category: 'creme',
    tier: 'top',
    korean: true,
    price: 35,
    description: 'Crema-gelatina rimpolpante al collagene, texture gel-cream, per elasticità e idratazione profonda.',
    affiliateUrl: '#',
    linkPending: true,
  },
  {
    id: 'kb5',
    name: '345 Relief Cream',
    brand: 'Dr. Althea',
    gender: 'unisex',
    category: 'creme',
    tier: 'top',
    korean: true,
    price: 28,
    description: 'Crema barriera lenitiva, formulata per pelli reattive e post-trattamento, con centella e ceramidi.',
    affiliateUrl: '#',
    linkPending: true,
  },

  // ────────────────────────────────────────────────────────────
  // FASCIA PREMIUM (alta cosmesi)
  // ────────────────────────────────────────────────────────────
  {
    id: 'pr1',
    name: "Sisleÿa L'Intégral Anti-Âge",
    brand: 'Sisley',
    gender: 'donna',
    category: 'creme',
    tier: 'premium',
    korean: false,
    price: 425,
    description: 'Il trattamento anti-età globale di punta di Sisley, formulato con estratti botanici, per rassodare e rigenerare in profondità.',
    affiliateUrl: '#',
    linkPending: true,
  },
  {
    id: 'pr2',
    name: 'Le Démaquillant Baume aux Trois Huiles',
    brand: 'Sisley',
    gender: 'unisex',
    category: 'detergenti',
    tier: 'premium',
    korean: false,
    price: 101,
    description: 'Balsamo struccante ai tre oli (mandorla dolce, girasole, papavero), scioglie il trucco senza aggredire la pelle.',
    affiliateUrl: '#',
    linkPending: true,
  },
  {
    id: 'pr3',
    name: 'Crème de la Mer (30ml)',
    brand: 'La Mer',
    gender: 'unisex',
    category: 'creme',
    tier: 'premium',
    korean: false,
    price: 190,
    description: 'La crema iconica al Miracle Broth™, per riparazione intensiva della barriera cutanea e idratazione profonda.',
    affiliateUrl: '#',
    linkPending: true,
  },
  {
    id: 'pr4',
    name: 'The Treatment Lotion',
    brand: 'La Mer',
    gender: 'unisex',
    category: 'sieri',
    tier: 'premium',
    korean: false,
    price: 145,
    description: 'Lozione preparatrice fermentata, prepara la pelle ad assorbire meglio i trattamenti successivi.',
    affiliateUrl: '#',
    linkPending: true,
  },

  // ────────────────────────────────────────────────────────────
  // FASCIA INTERMEDIA
  // ────────────────────────────────────────────────────────────
  {
    id: 'md1',
    name: 'Daily Microfoliant',
    brand: 'Dermalogica',
    gender: 'unisex',
    category: 'detergenti',
    tier: 'top',
    korean: false,
    price: 38,
    description: 'Esfoliante enzimatico in polvere, si attiva a contatto con l’acqua: uso quotidiano per una grana della pelle più fine.',
    affiliateUrl: '#',
    linkPending: true,
  },
  {
    id: 'md2',
    name: 'Special Cleansing Gel',
    brand: 'Dermalogica',
    gender: 'unisex',
    category: 'detergenti',
    tier: 'top',
    korean: false,
    price: 33,
    description: 'Detergente gel-schiuma delicato adatto a tutti i tipi di pelle, deterge senza seccare.',
    affiliateUrl: '#',
    linkPending: true,
  },
  {
    id: 'md3',
    name: 'UltraCalming Serum Concentrate',
    brand: 'Dermalogica',
    gender: 'unisex',
    category: 'sieri',
    tier: 'top',
    korean: false,
    price: 60,
    description: 'Siero lenitivo concentrato per pelli sensibili e reattive, riduce arrossamenti e irritazione.',
    affiliateUrl: '#',
    linkPending: true,
  },

  // ────────────────────────────────────────────────────────────
  // SEGNAPOSTO — categorie non ancora coperte da marche reali
  // ────────────────────────────────────────────────────────────
  {
    id: 'p9',
    name: 'Shampoo anticaduta',
    brand: 'Marca di esempio',
    gender: 'unisex',
    category: 'shampoo',
    tier: 'base',
    korean: false,
    price: 11,
    description: 'Shampoo delicato formulato per capelli soggetti a caduta.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p10',
    name: 'Shampoo antiforfora',
    brand: 'Marca di esempio',
    gender: 'uomo',
    category: 'shampoo',
    tier: 'top',
    korean: false,
    price: 16,
    description: 'Shampoo seboregolatore per cuoio capelluto con forfora.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p11',
    name: 'Olio da barba',
    brand: 'Marca di esempio',
    gender: 'uomo',
    category: 'barba',
    tier: 'top',
    korean: false,
    price: 19,
    description: 'Olio nutriente per ammorbidire la barba e lenire la pelle sottostante.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p12',
    name: 'Balsamo dopobarba lenitivo',
    brand: 'Marca di esempio',
    gender: 'uomo',
    category: 'barba',
    tier: 'base',
    korean: false,
    price: 10.5,
    description: 'Balsamo lenitivo post-rasatura per pelle sensibile e irritata.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p13',
    name: 'Siero capelli anti-caduta',
    brand: 'Marca di esempio',
    gender: 'unisex',
    category: 'capelli',
    tier: 'premium',
    korean: false,
    price: 42,
    description: 'Siero concentrato per stimolare la densità e ridurre la caduta.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p14',
    name: 'Maschera capelli riparatrice',
    brand: 'Marca coreana di esempio',
    gender: 'unisex',
    category: 'capelli',
    tier: 'base',
    korean: true,
    price: 13,
    description: 'Maschera nutriente per capelli sfibrati e stressati dal calore.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
];

export function filterProducts(filters: {
  gender?: Gender | 'tutti';
  category?: Category | 'tutti';
  tier?: Tier | 'tutti';
  koreanOnly?: boolean;
}): Product[] {
  return PRODUCTS.filter((p) => {
    if (filters.gender && filters.gender !== 'tutti' && p.gender !== filters.gender && p.gender !== 'unisex') return false;
    if (filters.category && filters.category !== 'tutti' && p.category !== filters.category) return false;
    if (filters.tier && filters.tier !== 'tutti' && p.tier !== filters.tier) return false;
    if (filters.koreanOnly && !p.korean) return false;
    return true;
  });
}
