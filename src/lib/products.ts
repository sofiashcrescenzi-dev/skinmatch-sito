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
  affiliateUrl: string; // '#' finché non c'è un link di affiliazione reale
  isPlaceholder?: boolean;
  linkPending?: boolean;
  // Tag per il test skin-match — opzionali (i prodotti barba/capelli/shampoo
  // usano hairConcerns/beardConcerns invece di skinTypes/concerns).
  skinTypes?: SkinType[];
  concerns?: Concern[];
  hairConcerns?: HairConcern[];
  beardConcerns?: BeardConcern[];
  pregnancySafe?: boolean;
  sensitiveSafe?: boolean;
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
    skinTypes: ['secca', 'grassa', 'mista', 'normale'],
    concerns: ['protezione-solare'],
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
    price: 17,
    description: 'Siero illuminante con propoli e niacinamide, texture leggera, per un incarnato luminoso e uniforme.',
    affiliateUrl: '#',
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
    price: 35,
    description: 'Crema-gelatina rimpolpante al collagene, texture gel-cream, per elasticità e idratazione profonda.',
    affiliateUrl: '#',
    linkPending: true,
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
    price: 28,
    description: 'Crema barriera lenitiva, formulata per pelli reattive e post-trattamento, con centella e ceramidi.',
    affiliateUrl: '#',
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
    price: 20,
    description: 'Tonico lenitivo al 77% di houttuynia cordata (heartleaf): virale su TikTok per calmare rossori e sensibilità in pochi giorni.',
    affiliateUrl: '#',
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
    price: 18,
    description: 'Ampolla lenitiva al 100% di estratto di centella asiatica del Madagascar, virale per l’effetto "calm & glow".',
    affiliateUrl: '#',
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
    price: 17,
    description: 'L’essenza alla mucina di lumaca più ricomprata del K-beauty: idrata, ripara e leviga la texture della pelle.',
    affiliateUrl: '#',
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
    price: 16,
    description: 'Tonico con acqua minerale di profondità marina, adatto a tutti i tipi di pelle, molto amato per la semplicità della formula.',
    affiliateUrl: '#',
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
    price: 15,
    description: 'La crema idratante da farmacia diventata virale su TikTok: 3 ceramidi essenziali e acido ialuronico, per pelle secca e normale.',
    affiliateUrl: '#',
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
    price: 12,
    description: 'Detergente schiuma con ceramidi e niacinamide per pelle grassa e mista, non altera la barriera cutanea.',
    affiliateUrl: '#',
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
    price: 15,
    description: 'L’acqua micellare più iconica della dermocosmesi: struccante e detergente per pelli sensibili, senza risciacquo.',
    affiliateUrl: '#',
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
    affiliateUrl: '#',
    linkPending: true,
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
    price: 19,
    description: 'Protezione solare avanzata ad ampio spettro, tra i solari da farmacia più consigliati dai dermatologi.',
    affiliateUrl: '#',
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
    affiliateUrl: '#',
    linkPending: true,
    skinTypes: ['sensibile', 'secca'],
    concerns: ['barriera-cutanea', 'rossori-sensibilita'],
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
    price: 425,
    description: 'Il trattamento anti-età globale di punta di Sisley, formulato con estratti botanici, per rassodare e rigenerare in profondità.',
    affiliateUrl: '#',
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
    price: 38,
    description: 'Esfoliante enzimatico in polvere, si attiva a contatto con l’acqua: uso quotidiano per una grana della pelle più fine.',
    affiliateUrl: '#',
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
    price: 33,
    description: 'Detergente gel-schiuma delicato adatto a tutti i tipi di pelle, deterge senza seccare.',
    affiliateUrl: '#',
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
    price: 18,
    description: 'Shampoo energizzante da farmacia, con aminexil, per capelli deboli e soggetti a caduta.',
    affiliateUrl: '#',
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
    price: 17,
    description: 'Shampoo-crema che rinforza la fibra capillare, in complemento a trattamenti anticaduta.',
    affiliateUrl: '#',
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
    price: 14,
    description: 'Dopobarba lenitivo da farmacia per pelli sensibili, riduce bruciore e rossore post-rasatura.',
    affiliateUrl: '#',
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
    price: 22,
    description: 'Dopobarba riparatore con aloe vera, acido ialuronico e camomilla, azione lenitiva intensiva.',
    affiliateUrl: '#',
    linkPending: true,
    beardConcerns: ['irritazione'],
  },

  // ────────────────────────────────────────────────────────────
  // INTEGRATORI — brand da farmacia più noti/virali
  // ────────────────────────────────────────────────────────────
  {
    id: 'in1',
    name: 'TricoAge 50+ Integratore Anticaduta',
    brand: 'Bioscalin',
    gender: 'donna',
    category: 'integratori',
    tier: 'top',
    korean: false,
    price: 27,
    description: 'Integratore in compresse per capelli assottigliati e indeboliti da stress, sbalzi ormonali o menopausa. Con BioEquolo, zinco e rame.',
    affiliateUrl: '#',
    linkPending: true,
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
    affiliateUrl: '#',
    linkPending: true,
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
    affiliateUrl: '#',
    linkPending: true,
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
    affiliateUrl: '#',
    linkPending: true,
    concerns: ['anti-age'],
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
