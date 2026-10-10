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
//
// Tag per il test skin-match (skinTypes, concerns, hairConcerns, beardConcerns,
// pregnancySafe, sensitiveSafe): assegnati sulla base delle formulazioni reali e
// del posizionamento pubblico di ciascun prodotto. Non sostituiscono un consiglio
// medico/dermatologico — servono solo a orientare il consiglio d'acquisto.
// pregnancySafe: false è usato in modo prudenziale per referenti/attivi ad alta
// concentrazione (es. anti-age con retinoidi/complessi brevettati, esfolianti
// leave-on con acidi) — in assenza di certezza, meglio escludere che rischiare.

import { FEED_PRODUCTS } from './products-feed';

export type Gender = 'donna' | 'uomo' | 'unisex';
export type Category =
  | 'detergenti'
  | 'creme'
  | 'sieri'
  | 'attivi'
  | 'shampoo'
  | 'barba'
  | 'capelli'
  | 'integratori';
export type Tier = 'base' | 'top' | 'premium';

export type SkinType = 'secca' | 'grassa' | 'mista' | 'normale' | 'sensibile';
export type Concern =
  | 'idratazione'
  | 'anti-age'
  | 'acne-sebo'
  | 'macchie-luminosita'
  | 'rossori-sensibilita'
  | 'barriera-cutanea'
  | 'pori-dilatati'
  | 'protezione-solare';
export type HairConcern = 'caduta' | 'forfora' | 'secchi-crespi' | 'mantenimento';
export type BeardConcern = 'irritazione' | 'mantenimento';

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
  integratori: 'Integratori',
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
  affiliateUrl: string; // '#' se manca del tutto; con linkPending è la pagina del negozio senza tracciamento
  isPlaceholder?: boolean;
  linkPending?: boolean;
  image?: string;
  merchant?: string; // negozio di destinazione (es. Notino, Marionnaud) — Amazon dedotto dall'URL
  feedId?: string; // 'cj:<advertiserId>:<productId>' per riallineare il link quando il merchant approva
  // Tag per il test skin-match — opzionali (i prodotti barba/capelli/shampoo
  // usano hairConcerns/beardConcerns invece di skinTypes/concerns).
  skinTypes?: SkinType[];
  concerns?: Concern[];
  hairConcerns?: HairConcern[];
  beardConcerns?: BeardConcern[];
  pregnancySafe?: boolean;
  sensitiveSafe?: boolean;
};

const MANUAL_PRODUCTS: Product[] = [
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
    affiliateUrl: 'https://www.amazon.it/Beauty-Joseon-Relief-50ml-1-69fl-oz/dp/B09JVNZVH3?tag=skinmatch21-21',
    skinTypes: ['secca', 'grassa', 'mista', 'normale'],
    concerns: ['protezione-solare', 'idratazione'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'kb2',
    name: 'Glow Serum: Propolis + Niacinamide',
    brand: 'Beauty of Joseon',
    gender: 'unisex',
    category: 'sieri',
    tier: 'base',
    korean: true,
    price: 11.5,
    description: 'Siero illuminante con propoli e niacinamide, texture leggera, per un incarnato luminoso e uniforme.',
    affiliateUrl: "https://www.notino.it/beauty-of-joseon/glow-serum-propolis-niacinamide-siero-rigenerante-e-illuminante/p-16116934/",
    image: "https://cdn.notinoimg.com/google/beauty_of_joseon/8809657114960_01-o.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:BEJGLSW_KFSR01',
    linkPending: true,
    skinTypes: ['mista', 'normale', 'grassa'],
    concerns: ['macchie-luminosita', 'pori-dilatati'],
    pregnancySafe: true,
    sensitiveSafe: true,
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
    skinTypes: ['grassa', 'mista'],
    concerns: ['pori-dilatati', 'acne-sebo'],
    pregnancySafe: false,
    sensitiveSafe: false,
  },
  {
    id: 'kb4',
    name: 'Collagen Jelly Cream',
    brand: 'Medicube',
    gender: 'donna',
    category: 'creme',
    tier: 'top',
    korean: true,
    price: 26,
    description: 'Crema-gelatina rimpolpante al collagene, texture gel-cream, per elasticità e idratazione profonda.',
    affiliateUrl: 'https://www.amazon.it/medicube-Collagen-Gelatina-Cream-invecchiamento/dp/B0D5W5Y9CL?tag=skinmatch21-21',
    skinTypes: ['secca', 'normale', 'mista'],
    concerns: ['anti-age', 'idratazione'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'kb5',
    name: '345 Relief Cream',
    brand: 'Dr. Althea',
    gender: 'unisex',
    category: 'creme',
    tier: 'top',
    korean: true,
    price: 18.27,
    description: 'Crema barriera lenitiva, formulata per pelli reattive e post-trattamento, con centella e ceramidi.',
    affiliateUrl: "https://www.notino.it/dr-althea/345-relief-cream-crema-lenitiva-e-rigenerante-per-pelli-sensibili/p-16315837/",
    image: "https://cdn.notinoimg.com/google/dr_althea/8809447251394_01-o.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:DTE345W_KFCR01',
    linkPending: true,
    skinTypes: ['sensibile', 'secca', 'normale'],
    concerns: ['rossori-sensibilita', 'barriera-cutanea'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'kb6',
    name: 'Heartleaf 77% Soothing Toner',
    brand: 'Anua',
    gender: 'unisex',
    category: 'sieri',
    tier: 'base',
    korean: true,
    price: 21.16,
    description: 'Tonico lenitivo al 77% di houttuynia cordata (heartleaf): virale su TikTok per calmare rossori e sensibilità in pochi giorni.',
    affiliateUrl: "https://www.notino.it/anua/heartleaf-77-soothing-toner-lozione-detergente-e-calmante-per-ripristinare-la-barriera-cutanea/p-16241059/",
    image: "https://cdn.notinoimg.com/google/anua/8809640736025_01-o.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:AUAHRTW_KTON02',
    linkPending: true,
    skinTypes: ['sensibile', 'grassa', 'mista'],
    concerns: ['rossori-sensibilita', 'acne-sebo'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'kb7',
    name: 'Madagascar Centella Ampoule',
    brand: 'SKIN1004',
    gender: 'unisex',
    category: 'sieri',
    tier: 'base',
    korean: true,
    price: 14.02,
    description: 'Ampolla lenitiva al 100% di estratto di centella asiatica del Madagascar, virale per l’effetto "calm & glow".',
    affiliateUrl: "https://www.notino.it/skin1004/madagascar-centella-ampoule-siero-idratante-per-lenire-e-rinforzare-le-pelli-sensibili/p-16136221/",
    image: "https://cdn.notinoimg.com/google/skin1004/8809576260601_01-o.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:S04MDCW_KFSR01',
    linkPending: true,
    skinTypes: ['sensibile', 'secca', 'normale'],
    concerns: ['rossori-sensibilita', 'barriera-cutanea'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'kb8',
    name: 'Advanced Snail 96 Mucin Power Essence',
    brand: 'COSRX',
    gender: 'unisex',
    category: 'sieri',
    tier: 'base',
    korean: true,
    price: 20.31,
    description: 'L’essenza alla mucina di lumaca più ricomprata del K-beauty: idrata, ripara e leviga la texture della pelle.',
    affiliateUrl: "https://www.notino.it/cosrx/advanced-snail-96-mucin-fluido-viso-con-estratto-di-bava-di-lumaca/p-15811222/",
    image: "https://cdn.notinoimg.com/google/cosrx/8809416470009_01-o__3.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:CSXAS9W_KFSR30',
    linkPending: true,
    skinTypes: ['secca', 'normale', 'mista'],
    concerns: ['idratazione', 'barriera-cutanea'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'kb9',
    name: '1025 Dokdo Toner',
    brand: 'Round Lab',
    gender: 'unisex',
    category: 'sieri',
    tier: 'base',
    korean: true,
    price: 10.11,
    description: 'Tonico con acqua minerale di profondità marina, adatto a tutti i tipi di pelle, molto amato per la semplicità della formula.',
    affiliateUrl: "https://www.notino.it/round-lab/1025-dokdo-toner-lozione-tonica-esfoliante-delicata-effetto-idratante/p-16359646/",
    image: "https://cdn.notinoimg.com/google/round_lab/8809657114731_01-o.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:ROLEEMJ_CCWO12',
    linkPending: true,
    skinTypes: ['secca', 'grassa', 'mista', 'normale'],
    concerns: ['idratazione'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'kb10',
    name: 'Dive-In Low Molecular Hyaluronic Acid Serum',
    brand: 'Torriden',
    gender: 'unisex',
    category: 'sieri',
    tier: 'top',
    korean: true,
    price: 22,
    description: 'Siero con 5 pesi molecolari di acido ialuronico per un’idratazione multi-livello: tra i prodotti più venduti su Olive Young.',
    affiliateUrl: '#',
    linkPending: true,
    skinTypes: ['secca', 'normale', 'mista'],
    concerns: ['idratazione'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },

  // ────────────────────────────────────────────────────────────
  // DERMOCOSMESI (farmacia) — brand più diffusi e virali
  // ────────────────────────────────────────────────────────────
  {
    id: 'dc1',
    name: 'Moisturizing Cream',
    brand: 'CeraVe',
    gender: 'unisex',
    category: 'creme',
    tier: 'base',
    korean: false,
    price: 7.2,
    description: 'La crema idratante da farmacia diventata virale su TikTok: 3 ceramidi essenziali e acido ialuronico, per pelle secca e normale.',
    affiliateUrl: "https://www.notino.it/cerave/moisturizers-crema-idratante-viso-e-corpo-per-pelli-secche-e-molto-secche/p-15738747/",
    image: "https://cdn.notinoimg.com/google/cerave/3337875597371_01-o__4.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:CEVMOIW_KBOC05',
    linkPending: true,
    skinTypes: ['secca', 'normale'],
    concerns: ['idratazione', 'barriera-cutanea'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'dc2',
    name: 'Foaming Facial Cleanser',
    brand: 'CeraVe',
    gender: 'unisex',
    category: 'detergenti',
    tier: 'base',
    korean: false,
    price: 14.5,
    description: 'Detergente schiuma con ceramidi e niacinamide per pelle grassa e mista, non altera la barriera cutanea.',
    affiliateUrl: "https://www.notino.it/cerave/cleansers-gel-detergente-in-schiuma-per-pelli-normali-e-grasse/p-16298666/",
    image: "https://cdn.notinoimg.com/google/cerave/3337875905596_01-o.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:CEVYODW_KBOL01',
    linkPending: true,
    skinTypes: ['grassa', 'mista'],
    concerns: ['acne-sebo', 'barriera-cutanea'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'dc3',
    name: 'Sensibio H2O',
    brand: 'Bioderma',
    gender: 'unisex',
    category: 'detergenti',
    tier: 'base',
    korean: false,
    price: 15.3,
    description: 'L’acqua micellare più iconica della dermocosmesi: struccante e detergente per pelli sensibili, senza risciacquo.',
    affiliateUrl: "https://www.notino.it/bioderma/sensibio-h2o-acqua-micellare-per-pelli-sensibili-con-dosatore/p-607473/",
    image: "https://cdn.notinoimg.com/google/bioderma/3401396991779_01-o__19.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:BIRSSBW_KMUR23',
    linkPending: true,
    skinTypes: ['sensibile', 'secca', 'normale', 'grassa', 'mista'],
    concerns: ['rossori-sensibilita'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'dc4',
    name: 'Cicaplast Baume B5',
    brand: 'La Roche-Posay',
    gender: 'unisex',
    category: 'creme',
    tier: 'base',
    korean: false,
    price: 11,
    description: 'Balsamo lenitivo e riparatore multiuso, per pelle irritata, screpolata o post-trattamento estetico.',
    affiliateUrl: 'https://www.amazon.it/La-Roche-Posay-Cicaplast-Baume-B5/dp/B0BJFLYK3S?tag=skinmatch21-21',
    skinTypes: ['sensibile', 'secca'],
    concerns: ['barriera-cutanea', 'rossori-sensibilita'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'dc5',
    name: 'Anthelios UVMune 400',
    brand: 'La Roche-Posay',
    gender: 'unisex',
    category: 'creme',
    tier: 'top',
    korean: false,
    price: 17.76,
    description: 'Protezione solare avanzata ad ampio spettro, tra i solari da farmacia più consigliati dai dermatologi.',
    affiliateUrl: "https://www.notino.it/la-roche-posay/anthelios-crema-protettiva-giorno-spf-50/p-16123059/",
    image: "https://cdn.notinoimg.com/google/la-roche-posay/3337875797719_01-o.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:LRPXEEW_KPCR10',
    linkPending: true,
    skinTypes: ['secca', 'grassa', 'mista', 'normale', 'sensibile'],
    concerns: ['protezione-solare'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'dc6',
    name: 'Cicalfate+',
    brand: 'Avène',
    gender: 'unisex',
    category: 'creme',
    tier: 'base',
    korean: false,
    price: 14,
    description: 'Crema riparatrice antibatterica per pelle lesa o post-procedura, con Acqua Termale di Avène.',
    affiliateUrl: 'https://www.amazon.it/Avene-Cicalfate-crema-ristrutturante-protettiva/dp/B07XG1PLJF?tag=skinmatch21-21',
    skinTypes: ['sensibile', 'secca'],
    concerns: ['barriera-cutanea', 'rossori-sensibilita'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },

  // ────────────────────────────────────────────────────────────
  // DERMOCOSMESI FRANCESE — Caudalie, SVR
  // ────────────────────────────────────────────────────────────
  {
    id: 'cd1',
    name: 'Vinoperfect Siero Illuminante Anti-Macchie',
    brand: 'Caudalie',
    gender: 'unisex',
    category: 'sieri',
    tier: 'top',
    korean: false,
    price: 42,
    description: 'Il siero anti-macchie più venduto in farmacia: viniferina (brevetto Caudalie), un\'alternativa alla vitamina C adatta anche a pelle sensibile, per uniformare l\'incarnato.',
    affiliateUrl: 'https://www.amazon.it/Caudalie-Vinoperfect-Siero-Bagliore-Macchie/dp/B0CX5B5VTX?tag=skinmatch21-21',
    skinTypes: ['normale', 'mista', 'grassa', 'secca'],
    concerns: ['macchie-luminosita'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'sv1',
    name: 'Sebiaclear Gel Moussant',
    brand: 'SVR',
    gender: 'unisex',
    category: 'detergenti',
    tier: 'top',
    korean: false,
    price: 15,
    description: 'Detergente purificante anti-imperfezioni con acido gluconolattone e acido salicilico, per pelle grassa, mista e con tendenza acneica.',
    affiliateUrl: 'https://www.amazon.it/SVR-Sebiaclear-Detergente-Purificante-Anti-Imperfezioni/dp/B0CH1SSCK9?tag=skinmatch21-21',
    skinTypes: ['grassa', 'mista'],
    concerns: ['acne-sebo'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'sv2',
    name: 'Topialyse Baume Lavant',
    brand: 'SVR',
    gender: 'unisex',
    category: 'detergenti',
    tier: 'base',
    korean: false,
    price: 12,
    description: 'Balsamo detergente extra-delicato per pelle secca, molto secca e atopica: deterge senza alterare il film idrolipidico.',
    affiliateUrl: 'https://www.amazon.it/Svr-Topialyse-Baume-Lavant-200ml/dp/B01MSDPCD9?tag=skinmatch21-21',
    skinTypes: ['secca', 'sensibile'],
    concerns: ['barriera-cutanea'],
    pregnancySafe: true,
    sensitiveSafe: true,
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
    price: 496,
    description: 'Il trattamento anti-età globale di punta di Sisley, formulato con estratti botanici, per rassodare e rigenerare in profondità.',
    affiliateUrl: "https://www.marionnaud.it/sisley/sisleya/lintegral-anti-age/p/BP_112225?channable=092674756e697175655f696400313132323235cd&varSel=112225",
    merchant: 'Marionnaud',
    feedId: 'cj:6585019:112225',
    linkPending: true,
    skinTypes: ['normale', 'secca', 'mista'],
    concerns: ['anti-age'],
    pregnancySafe: false,
    sensitiveSafe: true,
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
    skinTypes: ['secca', 'normale', 'sensibile'],
    concerns: ['idratazione'],
    pregnancySafe: true,
    sensitiveSafe: true,
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
    skinTypes: ['secca', 'normale'],
    concerns: ['idratazione', 'barriera-cutanea'],
    pregnancySafe: true,
    sensitiveSafe: true,
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
    skinTypes: ['secca', 'normale', 'mista'],
    concerns: ['idratazione'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'pr5',
    name: 'The Cream',
    brand: 'Augustinus Bader',
    gender: 'unisex',
    category: 'creme',
    tier: 'premium',
    korean: false,
    price: 260,
    description: 'Crema con tecnologia brevettata TFC8®, tra le più virali del lusso skincare: bestseller assoluto del brand.',
    affiliateUrl: '#',
    linkPending: true,
    skinTypes: ['secca', 'normale', 'mista'],
    concerns: ['anti-age', 'idratazione'],
    pregnancySafe: false,
    sensitiveSafe: true,
  },
  {
    id: 'pr6',
    name: 'C E Ferulic',
    brand: 'SkinCeuticals',
    gender: 'unisex',
    category: 'sieri',
    tier: 'premium',
    korean: false,
    price: 169,
    description: 'Il siero antiossidante alla vitamina C più noto della dermocosmesi prestige: protegge da stress ossidativo e fotoinvecchiamento.',
    affiliateUrl: '#',
    linkPending: true,
    skinTypes: ['normale', 'mista', 'grassa'],
    concerns: ['anti-age', 'macchie-luminosita'],
    pregnancySafe: true,
    sensitiveSafe: false,
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
    price: 51.76,
    description: 'Esfoliante enzimatico in polvere, si attiva a contatto con l’acqua: uso quotidiano per una grana della pelle più fine.',
    affiliateUrl: "https://www.notino.it/dermalogica/daily-skin-health-polvere-esfoliante/p-489112/",
    image: "https://cdn.notinoimg.com/google/dermalogica/666151020467x_01-o__18.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:DLODSHW_KPEE20',
    linkPending: true,
    skinTypes: ['normale', 'mista', 'grassa'],
    concerns: ['pori-dilatati', 'macchie-luminosita'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },
  {
    id: 'md2',
    name: 'Special Cleansing Gel',
    brand: 'Dermalogica',
    gender: 'unisex',
    category: 'detergenti',
    tier: 'top',
    korean: false,
    price: 53.97,
    description: 'Detergente gel-schiuma delicato adatto a tutti i tipi di pelle, deterge senza seccare.',
    affiliateUrl: "https://www.notino.it/dermalogica/daily-skin-health-gel-detergente-in-schiuma-per-tutti-i-tipi-di-pelle/p-508841/",
    image: "https://cdn.notinoimg.com/google/dermalogica/666151010024_01-o__17.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:DLODSHW_KECL37',
    linkPending: true,
    skinTypes: ['secca', 'grassa', 'mista', 'normale'],
    concerns: ['idratazione'],
    pregnancySafe: true,
    sensitiveSafe: true,
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
    skinTypes: ['sensibile', 'secca', 'normale'],
    concerns: ['rossori-sensibilita', 'barriera-cutanea'],
    pregnancySafe: true,
    sensitiveSafe: true,
  },

  // ────────────────────────────────────────────────────────────
  // SHAMPOO — brand da farmacia più noti/virali
  // ────────────────────────────────────────────────────────────
  {
    id: 'sh1',
    name: 'Dercos Shampoo Energizzante con Aminexil',
    brand: 'Vichy',
    gender: 'unisex',
    category: 'shampoo',
    tier: 'top',
    korean: false,
    price: 13.85,
    description: 'Shampoo energizzante da farmacia, con aminexil, per capelli deboli e soggetti a caduta.',
    affiliateUrl: "https://www.notino.it/vichy/dercos-energising-shampoo-rinforzante-anti-caduta-dei-capelli/p-401343/",
    image: "https://cdn.notinoimg.com/google/vichy/3337871311292_01-o__24.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:VCHDENW_KSHA50',
    linkPending: true,
    hairConcerns: ['caduta'],
  },
  {
    id: 'sh2',
    name: 'Anaphase Shampoo Complemento Anticaduta',
    brand: 'Ducray',
    gender: 'unisex',
    category: 'shampoo',
    tier: 'top',
    korean: false,
    price: 14.02,
    description: 'Shampoo-crema che rinforza la fibra capillare, in complemento a trattamenti anticaduta.',
    affiliateUrl: "https://www.notino.it/ducray/anaphase-anti-hair-loss-growth-shampoo-shampoo-anti-caduta-dei-capelli/p-16310587/",
    image: "https://cdn.notinoimg.com/google/ducray/3282770398168_01-o.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:DURFCHW_KSHA04',
    linkPending: true,
    hairConcerns: ['caduta'],
  },
  {
    id: 'sh3',
    name: 'Nova Genina Shampoo Energizzante',
    brand: 'Bioscalin',
    gender: 'unisex',
    category: 'shampoo',
    tier: 'base',
    korean: false,
    price: 15,
    description: 'Shampoo energizzante quotidiano, uno dei prodotti da farmacia più discussi su TikTok per la cura dei capelli deboli.',
    affiliateUrl: '#',
    linkPending: true,
    hairConcerns: ['caduta', 'mantenimento'],
  },
  {
    id: 'sh4',
    name: 'Psorisdin Shampoo Antidesquamazione',
    brand: 'ISDIN',
    gender: 'unisex',
    category: 'shampoo',
    tier: 'base',
    korean: false,
    price: 14,
    description: 'Shampoo con acido salicilico e Ichtyol pale per cuoio capelluto desquamante, arrossato o pruriginoso.',
    affiliateUrl: '#',
    linkPending: true,
    hairConcerns: ['forfora'],
  },

  // ────────────────────────────────────────────────────────────
  // PRODOTTI CAPELLI — K-beauty virali + farmacia
  // ────────────────────────────────────────────────────────────
  {
    id: 'ca1',
    name: 'Damage Care & Nourishing Shampoo',
    brand: 'Ryo',
    gender: 'unisex',
    category: 'capelli',
    tier: 'top',
    korean: true,
    price: 22,
    description: 'Shampoo nutriente Hanbang (erboristeria tradizionale coreana), per capelli danneggiati e sfibrati.',
    affiliateUrl: '#',
    linkPending: true,
    hairConcerns: ['secchi-crespi'],
  },
  {
    id: 'ca2',
    name: 'CER-100 Collagen Coating Hair Protein Treatment',
    brand: 'Elizavecca',
    gender: 'unisex',
    category: 'capelli',
    tier: 'base',
    korean: true,
    price: 10,
    description: 'Trattamento proteico "effetto salone" virale sui social: rende i capelli visibilmente più lisci e forti dopo un solo utilizzo.',
    affiliateUrl: '#',
    linkPending: true,
    hairConcerns: ['secchi-crespi'],
  },
  {
    id: 'ca3',
    name: 'Perfect Serum',
    brand: 'Mise en Scène',
    gender: 'unisex',
    category: 'capelli',
    tier: 'base',
    korean: true,
    price: 9,
    description: 'Siero lucidante e districante, uno dei sieri per capelli coreani più venduti.',
    affiliateUrl: '#',
    linkPending: true,
    hairConcerns: ['secchi-crespi', 'mantenimento'],
  },
  {
    id: 'ca4',
    name: 'Attivatore Capillare',
    brand: 'Bioscalin',
    gender: 'unisex',
    category: 'capelli',
    tier: 'premium',
    korean: false,
    price: 38,
    description: 'Trattamento settimanale in fiale contro la caduta, da applicare senza risciacquo.',
    affiliateUrl: '#',
    linkPending: true,
    hairConcerns: ['caduta'],
  },

  // ────────────────────────────────────────────────────────────
  // PRODOTTI BARBA
  // ────────────────────────────────────────────────────────────
  {
    id: 'ba1',
    name: 'Beard Balm',
    brand: 'King C. Gillette',
    gender: 'uomo',
    category: 'barba',
    tier: 'base',
    korean: false,
    price: 13,
    description: 'Balsamo per barba al burro di cacao, ammorbidisce e dona definizione senza appesantire.',
    affiliateUrl: '#',
    linkPending: true,
    beardConcerns: ['mantenimento'],
  },
  {
    id: 'ba2',
    name: 'Homme Sensi Baume Dopobarba',
    brand: 'Vichy',
    gender: 'uomo',
    category: 'barba',
    tier: 'base',
    korean: false,
    price: 24.9,
    description: 'Dopobarba lenitivo da farmacia per pelli sensibili, riduce bruciore e rossore post-rasatura.',
    affiliateUrl: "https://www.notino.it/vichy/homme-sensi-baume-balsamo-after-shave-per-pelli-sensibili/p-89643/",
    image: "https://cdn.notinoimg.com/google/vichy/3337871318888_01-o__22.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:VCHHOSM_KASB20',
    linkPending: true,
    beardConcerns: ['irritazione'],
  },
  {
    id: 'ba3',
    name: 'Dopobarba Lenitivo Uomo',
    brand: 'Collistar',
    gender: 'uomo',
    category: 'barba',
    tier: 'top',
    korean: false,
    price: 21.67,
    description: 'Dopobarba riparatore con aloe vera, acido ialuronico e camomilla, azione lenitiva intensiva.',
    affiliateUrl: "https://www.notino.it/collistar/after-shave-lozione-after-shave/p-16221949/",
    image: "https://cdn.notinoimg.com/google/collistar/8015150285537_01-o.jpg",
    merchant: 'Notino',
    feedId: 'cj:4917850:COLFOAM_DASW06',
    linkPending: true,
    beardConcerns: ['irritazione'],
  },

  // ────────────────────────────────────────────────────────────
  // INTEGRATORI — brand da farmacia più noti/virali
  // ────────────────────────────────────────────────────────────
  {
    id: 'in1',
    name: 'TricoAge 50+ Integratore Anticaduta (60 compresse)',
    brand: 'Bioscalin',
    gender: 'donna',
    category: 'integratori',
    tier: 'top',
    korean: false,
    price: 42.5,
    description: 'Integratore in compresse per capelli assottigliati e indeboliti da stress, sbalzi ormonali o menopausa. Con BioEquolo, zinco e rame.',
    affiliateUrl: 'https://www.amazon.it/GIULIANI-Bioscalin-TricoAge-Compresse-Convenienza/dp/B0D3J7KXFX?tag=skinmatch21-21',
    hairConcerns: ['caduta'],
  },
  {
    id: 'in2',
    name: 'Time Perfection',
    brand: 'Imedeen',
    gender: 'donna',
    category: 'integratori',
    tier: 'premium',
    korean: false,
    price: 45,
    description: 'Complemento alimentare anti-age (dai 35-40 anni) con Marine Complex e LycoPhence GS Forte, per idratazione, elasticità e riduzione delle rughe.',
    affiliateUrl: 'https://www.amazon.it/Imedeen-Time-Perfection/dp/B005OJF3MW?tag=skinmatch21-21',
    concerns: ['anti-age'],
  },
  {
    id: 'in3',
    name: 'Perfectil Original',
    brand: 'Vitabiotics',
    gender: 'unisex',
    category: 'integratori',
    tier: 'top',
    korean: false,
    price: 20,
    description: "L'integratore per pelle, capelli e unghie più noto in farmacia: L-cisteina, zinco e iodio a supporto della struttura di pelle e capelli.",
    affiliateUrl: 'https://www.amazon.it/Vitabiotics-Perfectil-Nuova-Formula-30s/dp/B019A5288C?tag=skinmatch21-21',
    hairConcerns: ['mantenimento'],
    concerns: ['barriera-cutanea'],
  },
  {
    id: 'in4',
    name: 'Gold Collagen Forte Plus',
    brand: 'Gold Collagen',
    gender: 'unisex',
    category: 'integratori',
    tier: 'premium',
    korean: false,
    price: 55,
    description: 'Collagene da bere in flaconcini, con 23 ingredienti attivi per pelle, unghie e capelli: uno degli integratori di collagene più noti in farmacia.',
    affiliateUrl: 'https://www.amazon.it/Gold-Collagen-Forte-10-Flaconi/dp/B08NL2C2L4?tag=skinmatch21-21',
    concerns: ['anti-age'],
  },
];

export const PRODUCTS: Product[] = [...MANUAL_PRODUCTS, ...FEED_PRODUCTS];

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
