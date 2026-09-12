// Modello dati del catalogo prodotti + dati segnaposto.
// I prodotti qui sotto sono SEGNAPOSTO (isPlaceholder: true) — servono solo a far
// funzionare l'interfaccia del catalogo. Vanno sostituiti con prodotti reali
// (marca, prezzo, link di affiliazione) prima della pubblicazione del sito.

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
  affiliateUrl: string; // segnaposto finché non ci sono link reali
  /** Vero finché il prodotto non viene sostituito con uno reale verificato. */
  isPlaceholder: true;
};

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Detergente delicato viso',
    brand: 'Marca di esempio',
    gender: 'unisex',
    category: 'detergenti',
    tier: 'base',
    korean: false,
    price: 9.9,
    description: 'Detergente delicato per pelli sensibili, senza sapone, pH bilanciato.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p2',
    name: 'Gel detergente purificante',
    brand: 'Marca di esempio',
    gender: 'unisex',
    category: 'detergenti',
    tier: 'top',
    korean: false,
    price: 18.5,
    description: 'Gel detergente per pelli grasse e miste, con acido salicilico.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p3',
    name: 'Crema idratante quotidiana',
    brand: 'Marca di esempio',
    gender: 'donna',
    category: 'creme',
    tier: 'base',
    korean: false,
    price: 12.9,
    description: 'Crema leggera per idratazione quotidiana, adatta a pelle normale e secca.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p4',
    name: 'Crema barriera riparatrice',
    brand: 'Marca di esempio',
    gender: 'unisex',
    category: 'creme',
    tier: 'premium',
    korean: false,
    price: 48,
    description: 'Crema ad alta concentrazione di ceramidi per rinforzare la barriera cutanea.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p5',
    name: 'Siero vitamina C',
    brand: 'Marca di esempio',
    gender: 'donna',
    category: 'sieri',
    tier: 'top',
    korean: false,
    price: 29,
    description: 'Siero antiossidante illuminante con vitamina C stabilizzata.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p6',
    name: 'Siero snail mucin',
    brand: 'Marca coreana di esempio',
    gender: 'unisex',
    category: 'sieri',
    tier: 'base',
    korean: true,
    price: 14.5,
    description: 'Siero idratante e lenitivo alla mucina di lumaca, classico K-beauty.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p7',
    name: 'Essenza fermentata',
    brand: 'Marca coreana di esempio',
    gender: 'unisex',
    category: 'attivi',
    tier: 'premium',
    korean: true,
    price: 65,
    description: 'Essenza fermentata per luminosità e uniformità dell’incarnato.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
  {
    id: 'p8',
    name: 'Retinolo notte',
    brand: 'Marca di esempio',
    gender: 'donna',
    category: 'attivi',
    tier: 'top',
    korean: false,
    price: 32,
    description: 'Trattamento notturno al retinolo per texture e prevenzione rughe.',
    affiliateUrl: '#',
    isPlaceholder: true,
  },
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
