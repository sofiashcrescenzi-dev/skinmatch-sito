// Motore di raccomandazione del test "Trova il tuo SkinMatch".
//
// Non è un dispositivo medico né una diagnosi dermatologica: incrocia le
// risposte con i tag assegnati ai prodotti reali del catalogo (vedi
// products.ts) per suggerire una routine di partenza. In presenza di
// gravidanza/allattamento o di patologie cutanee dichiarate, applichiamo
// filtri prudenziali (pregnancySafe / sensitiveSafe) e mostriamo un invito
// a parlarne comunque con un medico o un dermatologo.

import {
  PRODUCTS,
  type Product,
  type Gender,
  type SkinType,
  type Concern,
  type HairConcern,
  type BeardConcern,
  type ScalpType,
  type Tier,
} from './products';

// Percorso scelto all'inizio del test: solo viso, solo capelli o entrambi.
export type QuizFocus = 'viso' | 'capelli' | 'completa';
export const focusIncludesSkin = (f: QuizFocus) => f !== 'capelli';
export const focusIncludesHair = (f: QuizFocus) => f !== 'viso';

export type SunExposure = 'bassa' | 'media' | 'alta';
export type OilySubtype = 'idratata' | 'acneica' | 'seborroica-secca';
export type DandruffSubtype = 'grassa' | 'secca';
export type ScalpAnswer = Exclude<ScalpType, 'sensibile'>; // la sensibilità è una domanda a parte
export type WashFrequency = 'quotidiano' | 'settimanale' | 'raro';
// acuta = caduta diffusa recente (es. dopo stress o parto); progressiva = diradamento lento;
// chiazze = zone circoscritte senza capelli (da far valutare a un dermatologo).
export type HairLossPattern = 'acuta' | 'progressiva' | 'chiazze';

// Le risposte del percorso non scelto restano ai valori predefiniti e vengono ignorate.
export type QuizAnswers = {
  focus: QuizFocus;
  gender: Extract<Gender, 'donna' | 'uomo'>;
  pregnant: boolean;
  menopause: boolean;
  skinType: SkinType;
  sensitiveSkin: boolean;
  oilySubtype: OilySubtype | null; // solo se skinType è grassa/mista
  goal: Concern;
  pigmentedSkin: boolean; // macchie/discromie — indipendente dal biotipo di base
  conditions: string[];
  sunExposure: SunExposure;
  lifestyle: string[];
  environment: string;
  hairConcern: HairConcern;
  dandruffSubtype: DandruffSubtype | null; // solo se hairConcern è forfora
  hairLossPattern: HairLossPattern | null; // solo se hairConcern è caduta
  scalpType: ScalpAnswer;
  scalpSensitive: boolean;
  scalpConditions: string[];
  hairTreated: string[]; // colore, calore
  washFrequency: WashFrequency;
  beardConcern: BeardConcern | null;
  pricePref: Tier | 'nessuna';
};

export type BiotypeKind = 'pelle' | 'cuoio-capelluto' | 'tratto' | 'tratto-capelli';
export type Biotype = {
  id: string;
  kind: BiotypeKind;
  title: string;
  description: string;
  characteristics: string[];
  lookFor: string[];
  avoid: string[];
  relatedConcern?: Concern;
  relatedHairConcern?: HairConcern;
};

// Una tappa della routine: il prodotto consigliato più alternative in altre fasce di prezzo.
export type RoutineStep = {
  key: string;
  label: string;
  main: Product;
  alternatives: Product[];
};

// I biotipi sono null quando il percorso scelto non riguarda quell'area.
export type QuizResult = {
  focus: QuizFocus;
  skinBiotype: Biotype | null;
  skinTraits: Biotype[];
  scalpBiotype: Biotype | null;
  scalpTraits: Biotype[];
  routine: RoutineStep[];
  hair: RoutineStep[];
  beard: Product[];
  integratori: Product[];
  integratoriEsclusiGravidanza: boolean;
  disclaimerCondizioni: boolean;
  // Caduta che merita una visita: progressiva (consigliata) o a chiazze (necessaria).
  hairLossWarning: Exclude<HairLossPattern, 'acuta'> | null;
};

const SKIN_BIOTYPES: Record<string, Biotype> = {
  atopica: {
    id: 'atopica',
    kind: 'pelle',
    title: 'Pelle atopica',
    description:
      'La tua pelle ha una barriera cutanea costituzionalmente più fragile, che fatica a trattenere acqua e a proteggersi dagli irritanti esterni. Tende a secchezza persistente, prurito e arrossamenti (dermatite atopica). Ha bisogno di prodotti molto delicati, senza profumo, pensati per rinforzare il film idrolipidico.',
    characteristics: [
      'Secchezza persistente, anche cronica',
      'Prurito frequente, soprattutto nelle pieghe (gomiti, ginocchia, collo)',
      'Arrossamenti e chiazze ruvide',
      'Barriera cutanea più permeabile su base costituzionale',
      'Riacutizzazioni con freddo, stress o alcuni tessuti',
    ],
    lookFor: ['Ceramidi e lipidi (colesterolo, acidi grassi)', 'Formule senza profumo', 'Emollienti ricchi (burri, oli vegetali)', 'Detergenti extra-delicati, senza tensioattivi aggressivi'],
    avoid: ['Profumi e oli essenziali', 'Alcol denaturato ad alte concentrazioni', 'Esfolianti fisici o chimici aggressivi', 'Detergenti schiumogeni con SLS'],
    relatedConcern: 'barriera-cutanea',
  },
  psoriasica: {
    id: 'psoriasica',
    kind: 'pelle',
    title: 'Pelle con psoriasi',
    description:
      'Condizione infiammatoria cronica su base autoimmune, con un ricambio cellulare accelerato che forma placche ispessite, arrossate e ricoperte da squame argentee. È diagnosticabile e va gestita con un dermatologo: la skincare può accompagnare la terapia, non sostituirla.',
    characteristics: [
      'Placche ispessite, arrossate, ben delimitate',
      'Squame argentee o biancastre in superficie',
      'Prurito, a volte bruciore o dolore',
      'Zone tipiche: gomiti, ginocchia, cuoio capelluto, ma anche viso',
      'Andamento a fasi, con remissioni e riacutizzazioni',
    ],
    lookFor: ['Emollienti ricchi, ceramidi', 'Formule senza profumo', 'Detergenti extra-delicati'],
    avoid: ['Esfolianti fisici o chimici sulle placche attive', 'Profumo e alcol', 'Interrompere la terapia dermatologica senza parlarne con lo specialista'],
    relatedConcern: 'barriera-cutanea',
  },
  'disidratata-sensibile': {
    id: 'disidratata-sensibile',
    kind: 'pelle',
    title: 'Pelle disidratata e sensibile, con barriera danneggiata',
    description:
      "Manca di acqua — non necessariamente di sebo — e la barriera che dovrebbe proteggerla è indebolita: capita con detergenti aggressivi, stress, freddo o esfolianti troppo frequenti. Si arrossa facilmente, tira, a volte brucia con prodotti nuovi. La priorità è riparare la barriera prima di tutto il resto.",
    characteristics: [
      'Sensazione di tirare, soprattutto dopo la detersione',
      'Arrossamenti reattivi a prodotti nuovi',
      'Bruciore o pizzicore occasionale',
      'Barriera cutanea indebolita (spesso da over-esfoliazione)',
      'Texture opaca, a volte desquamata a chiazze',
    ],
    lookFor: ['Ceramidi, niacinamide, pantenolo', 'Formule minimaliste, poche referenze attive alla volta', 'Texture in crema/balsamo, non gel astringenti'],
    avoid: ['Acidi esfolianti ad alta concentrazione', 'Detersione con acqua troppo calda', 'Profumo e alcol'],
    relatedConcern: 'barriera-cutanea',
  },
  acneica: {
    id: 'acneica',
    kind: 'pelle',
    title: 'Pelle acneica',
    description:
      "Produzione di sebo elevata associata a un'alterata cheratinizzazione dei follicoli: i pori si ostruiscono più facilmente, favorendo comedoni, punti neri e brufoli. Va trattata con delicatezza — detergenti troppo sgrassanti peggiorano la produzione di sebo per compenso.",
    characteristics: [
      'Punti neri e punti bianchi (comedoni)',
      'Papule e pustole infiammate',
      'Pelle spesso lucida/untuosa nella zona T',
      'Pori dilatati',
      'Possibili esiti post-infiammatori (macchie o cicatrici)',
    ],
    lookFor: ['Niacinamide', 'Acido salicilico (BHA) a basse percentuali', 'Formule oil-free, non comedogene'],
    avoid: ['Oli comedogeni pesanti', 'Detersione troppo aggressiva o frequente', 'Prodotti alcolici astringenti in eccesso'],
    relatedConcern: 'acne-sebo',
  },
  'seborroica-secca': {
    id: 'seborroica-secca',
    kind: 'pelle',
    title: 'Pelle seborroica-secca',
    description:
      'Una combinazione che confonde: le ghiandole sebacee sono iperattive in alcune zone (fronte, naso, mento) ma la superficie appare secca o desquamata, spesso per un’alterazione della barriera o una lieve dermatite seborroica del viso. Serve equilibrio: detergere senza seccare, idratare senza appesantire.',
    characteristics: [
      'Zona T lucida/grassa ma guance che tirano o desquamano',
      'Possibile prurito o arrossamento tra sopracciglia e lati del naso',
      'Texture irregolare, a chiazze',
      'Sensibilità ai detergenti sgrassanti',
    ],
    lookFor: ['Detergenti delicati non schiumogeni', 'Idratanti leggeri ma non occlusivi', 'Niacinamide, zinco PCA'],
    avoid: ['Detergenti troppo sgrassanti', 'Creme molto ricche e occlusive su tutto il viso'],
    relatedConcern: 'barriera-cutanea',
  },
  'seborroica-idratata': {
    id: 'seborroica-idratata',
    kind: 'pelle',
    title: 'Pelle seborroica idratata',
    description:
      'Sebo abbondante ma barriera cutanea integra e buona idratazione: la pelle è lucida, soprattutto nella zona T, con pori più visibili, ma raramente tira o si irrita. È il tipo di pelle grassa più semplice da gestire.',
    characteristics: ['Pelle lucida, soprattutto nella zona T', 'Pori dilatati ma texture uniforme', 'Nessuna reale secchezza o tensione', 'Rara sensibilità o irritazione'],
    lookFor: ['Formule leggere, gel-crema', 'Niacinamide per opacizzare senza seccare', 'Acidi esfolianti leggeri (PHA, mandelico) per la texture'],
    avoid: ['Creme troppo ricche o occlusive', 'Oli pesanti non necessari'],
    relatedConcern: 'pori-dilatati',
  },
  'idratata-mista': {
    id: 'idratata-mista',
    kind: 'pelle',
    title: 'Pelle idratata mista',
    description:
      'Zona T (fronte, naso, mento) più grassa, guance normali o quasi secche, ma senza reale disidratazione né irritazione. È il tipo di pelle più comune: la routine deve bilanciare le due zone senza esagerare in nessuna direzione.',
    characteristics: ['Zona T (fronte, naso, mento) più grassa', 'Guance normali o leggermente secche', 'Texture generalmente uniforme', 'Poche imperfezioni'],
    lookFor: ['Formule bilanciate, non troppo ricche né troppo leggere', 'Routine differenziata per zone, se necessario'],
    avoid: ['Prodotti pensati solo per pelli grasse (possono seccare le guance)', 'Prodotti molto ricchi pensati solo per pelli secche (appesantiscono la zona T)'],
    relatedConcern: 'idratazione',
  },
  secca: {
    id: 'secca',
    kind: 'pelle',
    title: 'Pelle secca',
    description:
      'Produzione di sebo ridotta: la pelle tende a tirare, può apparire opaca o con una texture ruvida, soprattutto in inverno o con aria secca. Ha bisogno di lipidi e umettanti per restare confortevole tutto il giorno.',
    characteristics: ['Sensazione di tensione, soprattutto dopo la detersione', 'Texture opaca o ruvida', 'Possibile desquamazione visibile', 'Pori poco visibili', 'Peggiora con freddo e aria secca'],
    lookFor: ['Acido ialuronico e glicerina (umettanti)', 'Burri e oli (emollienti)', 'Ceramidi per rinforzare la barriera'],
    avoid: ['Detergenti schiumogeni aggressivi', 'Alcol denaturato', 'Esfoliazione troppo frequente'],
    relatedConcern: 'idratazione',
  },
  normale: {
    id: 'normale',
    kind: 'pelle',
    title: 'Pelle normale-equilibrata',
    description:
      'Produzione di sebo e livello di idratazione ben bilanciati, poche imperfezioni. La routine serve soprattutto a mantenere questo equilibrio nel tempo, non a correggere un problema specifico.',
    characteristics: ['Sebo e idratazione bilanciati', 'Texture uniforme', 'Poche imperfezioni', 'Buona tolleranza a nuovi prodotti'],
    lookFor: ['Routine semplice di mantenimento: detergente delicato, siero antiossidante, crema idratante, protezione solare'],
    avoid: ['Routine eccessivamente complesse, non necessarie'],
    relatedConcern: 'idratazione',
  },
};

const SCALP_BIOTYPES: Record<string, Biotype> = {
  diradamento: {
    id: 'diradamento',
    kind: 'cuoio-capelluto',
    title: 'Cute con tendenza al diradamento',
    description:
      'Il cuoio capelluto può essere nella norma, ma la densità dei capelli si sta riducendo: può dipendere da fattori ormonali, stress, carenze nutrizionali o predisposizione genetica. Prodotti energizzanti aiutano, ma se il fenomeno persiste vale la pena farlo valutare da uno specialista.',
    characteristics: ['Capelli visibilmente più radi o sottili nel tempo', 'Maggiore evidenza del cuoio capelluto (vertice, attaccatura)', 'Possibile aumento della caduta quotidiana', 'Cuoio capelluto spesso nella norma'],
    lookFor: ['Aminexil, caffeina', 'Integratori con zinco/BioEquolo', 'Shampoo energizzanti, fiale anticaduta senza risciacquo'],
    avoid: ['Styling che tira il capello (trazione)', 'Aspettare troppo prima di intervenire se la caduta persiste'],
    relatedHairConcern: 'caduta',
  },
  'caduta-reattiva': {
    id: 'caduta-reattiva',
    kind: 'cuoio-capelluto',
    title: 'Caduta reattiva (temporanea)',
    description:
      'Perdi più capelli del solito da qualche settimana, in modo diffuso. Succede spesso 2–3 mesi dopo un evento che ha messo alla prova l’organismo — forte stress, febbre alta, una dieta drastica, il parto o il cambio di stagione (in medicina si parla di telogen effluvium). Di solito è temporanea: i capelli ricrescono quando la causa si risolve. Shampoo e fiale energizzanti possono sostenere la ricrescita; se la caduta dura più di 3–6 mesi, è bene fare una visita.',
    characteristics: [
      'Più capelli del solito su cuscino, spazzola o nella doccia',
      'Caduta diffusa su tutta la testa, non a chiazze',
      'Inizio piuttosto improvviso, spesso dopo un evento preciso (stress, malattia, parto, dieta)',
      'Cuoio capelluto di solito nella norma',
    ],
    lookFor: [
      'Shampoo energizzanti delicati',
      'Lozioni o fiale con caffeina, aminexil, peptidi',
      'Alimentazione equilibrata, con un buon apporto di ferro e proteine (eventuali carenze vanno verificate con il medico)',
    ],
    avoid: ['Diete drastiche', 'Acconciature che tirano e trattamenti chimici aggressivi mentre la caduta è in corso', 'Integratori ad alte dosi presi "a caso", senza aver verificato eventuali carenze'],
    relatedHairConcern: 'caduta',
  },
  'psoriasi-cuoio-capelluto': {
    id: 'psoriasi-cuoio-capelluto',
    kind: 'cuoio-capelluto',
    title: 'Cuoio capelluto con psoriasi',
    description:
      'La psoriasi colpisce spesso il cuoio capelluto: placche arrossate e ispessite, coperte da squame argentee spesse e aderenti, che possono oltrepassare l’attaccatura dei capelli (fronte, nuca, dietro le orecchie). È una condizione cronica da seguire con il dermatologo: shampoo specifici che ammorbidiscono e rimuovono le squame alleviano il prurito e accompagnano la terapia, senza sostituirla.',
    characteristics: [
      'Placche arrossate e ben delimitate',
      'Squame spesse, argentee e aderenti — diverse dalla forfora comune',
      'Lesioni che possono superare l’attaccatura dei capelli',
      'Prurito, a volte intenso',
      'Andamento a fasi, con riacutizzazioni',
    ],
    lookFor: ['Shampoo specifici che ammorbidiscono le squame (acido salicilico, urea, piroctone olamine)', 'Lasciare agire lo shampoo qualche minuto prima di risciacquare', 'Formule senza profumo'],
    avoid: ['Grattare o staccare le squame con forza', 'Acqua molto calda e phon troppo caldo', 'Sospendere la terapia prescritta senza parlarne con il dermatologo'],
    relatedHairConcern: 'forfora',
  },
  'cute-grassa': {
    id: 'cute-grassa',
    kind: 'cuoio-capelluto',
    title: 'Cuoio capelluto grasso',
    description:
      'Le ghiandole sebacee del cuoio capelluto producono più sebo della media: le radici si appesantiscono e si ungono in 1–2 giorni, ma senza forfora né irritazione. Serve uno shampoo che regoli il sebo senza aggredire — un lavaggio troppo sgrassante spinge il cuoio capelluto a produrne ancora di più.',
    characteristics: ['Radici grasse e appesantite dopo 1–2 giorni', 'Capelli che perdono volume in fretta', 'Nessuna forfora né prurito rilevante', 'Lunghezze spesso normali o secche'],
    lookFor: ['Shampoo sebo-regolatori delicati, adatti a lavaggi frequenti', 'Balsamo solo sulle lunghezze'],
    avoid: ['Shampoo troppo aggressivi (effetto rebound)', 'Acqua molto calda', 'Oli e maschere applicati sulla radice'],
    relatedHairConcern: 'mantenimento',
  },
  'cute-secca': {
    id: 'cute-secca',
    kind: 'cuoio-capelluto',
    title: 'Cuoio capelluto secco',
    description:
      'Il cuoio capelluto produce poco sebo: tira dopo il lavaggio, i capelli restano puliti a lungo ma appaiono spesso opachi. Senza le cure giuste possono comparire prurito e una forfora bianca e sottile. Bastano lavaggi delicati e prodotti idratanti, evitando tutto ciò che sgrassa.',
    characteristics: ['Sensazione di tensione dopo il lavaggio', 'Capelli che restano puliti a lungo', 'Lunghezze opache, a volte crespe', 'Prurito occasionale'],
    lookFor: ['Shampoo delicati e idratanti, senza solfati aggressivi', 'Balsamo e maschere nutrienti sulle lunghezze'],
    avoid: ['Shampoo anti-grasso o sgrassanti', 'Acqua molto calda', 'Phon troppo caldo vicino alla cute'],
    relatedHairConcern: 'mantenimento',
  },
  seborroico: {
    id: 'seborroico',
    kind: 'cuoio-capelluto',
    title: 'Cuoio capelluto seborroico',
    description:
      'Le ghiandole sebacee del cuoio capelluto sono iperattive: i capelli si ungono in fretta e può comparire una forfora giallastra e untuosa (dermatite seborroica del cuoio capelluto). Serve un lavaggio più frequente, con prodotti che regolano il sebo senza irritare.',
    characteristics: ['Capelli che si ungono in fretta (1-2 giorni dal lavaggio)', 'Forfora giallastra, a scaglie untuose', 'Possibile prurito lieve', 'Cuoio capelluto lucido'],
    lookFor: ['Shampoo sebo-regolatori', 'Zinco piritione, acido salicilico', 'Lavaggi più frequenti con prodotti delicati'],
    avoid: ['Balsami o maschere applicati direttamente sul cuoio capelluto', 'Diradare troppo i lavaggi "per abituare" il cuoio capelluto'],
    relatedHairConcern: 'forfora',
  },
  'secco-desquamante': {
    id: 'secco-desquamante',
    kind: 'cuoio-capelluto',
    title: 'Cuoio capelluto secco e desquamante',
    description:
      'Il cuoio capelluto produce poco sebo e tende a seccarsi, con prurito e una forfora bianca e sottile che si stacca facilmente. Ha bisogno di lavaggi delicati e nutrienti, mai troppo sgrassanti.',
    characteristics: ['Forfora bianca, sottile, a scagliette', 'Prurito frequente', 'Cuoio capelluto che tira o è sensibile', 'Capelli spesso opachi'],
    lookFor: ['Shampoo delicati, senza solfati aggressivi', 'Piroctone olamine, oli leggeri lenitivi'],
    avoid: ['Shampoo sgrassanti/anti-grasso', 'Acqua molto calda durante il lavaggio'],
    relatedHairConcern: 'forfora',
  },
  'capelli-secchi': {
    id: 'capelli-secchi',
    kind: 'cuoio-capelluto',
    title: 'Capelli secchi e disidratati',
    description:
      'Il cuoio capelluto è spesso nella norma, ma la fibra capillare in lunghezza è disidratata, opaca o crespa (calore, colorazioni, agenti atmosferici). Serve un trattamento nutriente sulle lunghezze, non necessariamente sulla cute.',
    characteristics: ['Lunghezze opache, ruvide al tatto', 'Doppie punte, effetto crespo', 'Cuoio capelluto spesso normale', 'Capelli che si spezzano facilmente'],
    lookFor: ['Sieri e maschere nutrienti sulle lunghezze', 'Trattamenti proteici occasionali', 'Protezione dal calore'],
    avoid: ['Calore eccessivo senza protezione', 'Acqua molto calda', 'Spazzolatura aggressiva da bagnati'],
    relatedHairConcern: 'secchi-crespi',
  },
  equilibrato: {
    id: 'equilibrato',
    kind: 'cuoio-capelluto',
    title: 'Cuoio capelluto equilibrato',
    description: 'Nessuna problematica particolare: l’obiettivo è mantenere questo equilibrio con una routine di manutenzione leggera.',
    characteristics: ['Nessuna problematica evidente', 'Capelli che mantengono volume e lucentezza tra un lavaggio e l’altro', 'Cuoio capelluto confortevole, senza prurito o untuosità eccessiva'],
    lookFor: ['Routine di mantenimento leggera', 'Shampoo delicato, trattamenti mirati solo all’occorrenza'],
    avoid: ['Cambiare prodotto troppo spesso senza un vero motivo'],
    relatedHairConcern: 'mantenimento',
  },
};

// Tratti indipendenti: possono aggiungersi a QUALSIASI biotipo di pelle di
// base (es. "pelle acneica" + "con tendenza a macchie"). Non sostituiscono
// il biotipo primario, lo completano.
const SKIN_TRAITS: Record<string, Biotype> = {
  macchie: {
    id: 'macchie',
    kind: 'tratto',
    title: 'Con tendenza a macchie e discromie',
    description:
      'Oltre alle caratteristiche del tuo biotipo, la tua pelle tende a sviluppare macchie scure, segni post-infiammatori o discromie — comuni dopo acne, esposizione solare non protetta o semplicemente con il tempo.',
    characteristics: ['Macchie scure localizzate (macchie solari, post-acne)', 'Incarnato disomogeneo', 'Le macchie si accentuano con l’esposizione solare'],
    lookFor: ['Vitamina C, niacinamide, acido azelaico', 'Protezione solare quotidiana — senza, le macchie non schiariscono', 'Esfolianti delicati per uniformare la texture'],
    avoid: ['Esposizione solare senza protezione', 'Manipolare o schiacciare le imperfezioni (peggiora le macchie post-infiammatorie)'],
    relatedConcern: 'macchie-luminosita',
  },
  rosacea: {
    id: 'rosacea',
    kind: 'tratto',
    title: 'Con tendenza a rosacea/couperose',
    description:
      'Oltre alle caratteristiche del tuo biotipo, la tua pelle mostra arrossamenti persistenti, vampate o capillari visibili, tipici della rosacea. È una condizione diagnosticabile: se non l’hai già fatto, vale la pena parlarne con un dermatologo.',
    characteristics: ['Arrossamento persistente, soprattutto su guance e naso', 'Vampate improvvise (calore, alcol, cibi piccanti, sole)', 'Capillari visibili', 'Pelle spesso reattiva a nuovi prodotti'],
    lookFor: ['Formule lenitive (centella, niacinamide, azelaico)', 'Protezione solare rigorosa — il sole è un trigger frequente', 'Prodotti senza profumo, poche referenze attive alla volta'],
    avoid: ['Sbalzi di temperatura, alcol, cibi molto speziati (trigger comuni)', 'Esfolianti fisici o chimici aggressivi', 'Alcol denaturato e oli essenziali'],
    relatedConcern: 'rossori-sensibilita',
  },
  matura: {
    id: 'matura',
    kind: 'tratto',
    title: 'Con segni di invecchiamento cutaneo',
    description:
      'Oltre alle caratteristiche del tuo biotipo, la tua pelle mostra una minore elasticità, rughe o perdita di volume — normale con il tempo, e gestibile con gli attivi giusti.',
    characteristics: ['Minore elasticità e tono', 'Rughe sottili o più marcate', 'Perdita di volume nelle guance/contorno viso'],
    lookFor: ['Retinoidi (se non in gravidanza/allattamento)', 'Peptidi, vitamina C, acido ialuronico ad alto peso molecolare', 'Protezione solare quotidiana — il fotoinvecchiamento è la causa più prevenibile'],
    avoid: ['Aspettarsi risultati immediati (gli attivi anti-age richiedono settimane/mesi)', 'Saltare la protezione solare'],
    relatedConcern: 'anti-age',
  },
  menopausa: {
    id: 'menopausa',
    kind: 'tratto',
    title: 'In perimenopausa o menopausa',
    description:
      'Il calo di estrogeni tipico di questa fase riduce la produzione di collagene ed elastina, assottiglia la pelle e ne cambia l’equilibrio idro-lipidico: anche una pelle che è sempre stata grassa può diventare più secca e reattiva. Non è raro comparire acne ormonale proprio in questa fase, insieme a rughe più marcate.',
    characteristics: [
      'Pelle più sottile, meno elastica e tonica',
      'Produzione di sebo ridotta — anche chi ha sempre avuto pelle grassa può notare più secchezza',
      'Barriera cutanea più fragile, maggiore sensibilità e reattività',
      'Possibile acne ormonale, soprattutto su mento e mandibola',
      'Vampate che possono dare arrossamento transitorio',
    ],
    lookFor: [
      'Attivi che stimolano il collagene (peptidi, retinoidi a bassa concentrazione)',
      'Ceramidi e acido ialuronico per rinforzare la barriera',
      'Texture più ricche di quelle usate in passato, anche su pelli storicamente miste o grasse',
    ],
    avoid: ['Continuare la stessa routine "da pelle grassa" di prima senza adattarla', 'Esfolianti aggressivi — la pelle è più sottile e reattiva', 'Saltare la protezione solare (il fotoinvecchiamento si somma al calo ormonale)'],
    relatedConcern: 'barriera-cutanea',
  },
};

// Tratti di cuoio capelluto e capelli: si sommano al biotipo del cuoio capelluto.
const SCALP_TRAITS: Record<string, Biotype> = {
  'cute-sensibile': {
    id: 'cute-sensibile',
    kind: 'tratto-capelli',
    title: 'Con cuoio capelluto sensibile',
    description:
      'Oltre alle caratteristiche del tuo biotipo, il cuoio capelluto è reattivo: prude, brucia o si arrossa facilmente, soprattutto con shampoo nuovi, colorazioni o phon caldo. Conviene scegliere sempre le formule più delicate, non solo per lo shampoo.',
    characteristics: ['Prurito o bruciore dopo il lavaggio o la piega', 'Arrossamento del cuoio capelluto', 'Reazioni a shampoo nuovi o profumati', 'Fastidio con tinte e trattamenti chimici'],
    lookFor: ['Shampoo lenitivi, senza profumo e senza solfati aggressivi', 'Pochi prodotti, introdotti uno alla volta'],
    avoid: ['Profumi e oli essenziali', 'Acqua e phon troppo caldi', 'Colorazioni troppo ravvicinate'],
  },
  'capelli-trattati': {
    id: 'capelli-trattati',
    kind: 'tratto-capelli',
    title: 'Con capelli colorati o stressati dal calore',
    description:
      'Oltre alle caratteristiche del tuo biotipo, le lunghezze sono messe alla prova da colorazioni, decolorazioni o dall’uso frequente di piastra, ferro e phon caldo: la fibra perde lipidi e proteine, diventa più porosa, fragile e crespa. Vale la pena aggiungere un trattamento riparatore sulle lunghezze.',
    characteristics: ['Lunghezze porose e fragili', 'Colore che sbiadisce in fretta', 'Doppie punte e rotture', 'Effetto crespo con l’umidità'],
    lookFor: ['Trattamenti riparatori e proteici sulle lunghezze', 'Termoprotettore prima di piastra e phon', 'Shampoo delicati per capelli colorati'],
    avoid: ['Calore senza protezione', 'Decolorazioni ravvicinate', 'Shampoo sgrassanti sulle lunghezze'],
    relatedHairConcern: 'secchi-crespi',
  },
};

export const ALL_BIOTYPES: Biotype[] = [
  ...Object.values(SKIN_BIOTYPES),
  ...Object.values(SCALP_BIOTYPES),
  ...Object.values(SKIN_TRAITS),
  ...Object.values(SCALP_TRAITS),
];

export function getBiotypeById(id: string): Biotype | undefined {
  return ALL_BIOTYPES.find((b) => b.id === id);
}

export function getSkinBiotype(a: QuizAnswers): Biotype {
  if (a.conditions.includes('dermatite')) return SKIN_BIOTYPES.atopica;
  if (a.conditions.includes('psoriasi')) return SKIN_BIOTYPES.psoriasica;
  if (a.sensitiveSkin && a.skinType === 'secca') {
    return SKIN_BIOTYPES['disidratata-sensibile'];
  }
  if (a.skinType === 'grassa' || a.skinType === 'mista') {
    if (a.oilySubtype === 'acneica') return SKIN_BIOTYPES.acneica;
    if (a.oilySubtype === 'seborroica-secca') return SKIN_BIOTYPES['seborroica-secca'];
    return a.skinType === 'mista' ? SKIN_BIOTYPES['idratata-mista'] : SKIN_BIOTYPES['seborroica-idratata'];
  }
  if (a.skinType === 'secca') return SKIN_BIOTYPES.secca;
  return SKIN_BIOTYPES.normale;
}

// Tratti indipendenti: si sommano al biotipo primario, non lo sostituiscono
// (es. "pelle acneica" + "con tendenza a macchie" sono compatibili).
export function getSkinTraits(a: QuizAnswers): Biotype[] {
  const traits: Biotype[] = [];
  if (a.conditions.includes('rosacea')) traits.push(SKIN_TRAITS.rosacea);
  if (a.pigmentedSkin) traits.push(SKIN_TRAITS.macchie);
  if (a.goal === 'anti-age') traits.push(SKIN_TRAITS.matura);
  if (a.menopause) traits.push(SKIN_TRAITS.menopausa);
  return traits;
}

export function getScalpBiotype(a: QuizAnswers): Biotype {
  // Le condizioni diagnosticate prevalgono: orientano la scelta dello shampoo più di ogni altra risposta.
  if (a.scalpConditions.includes('psoriasi')) return SCALP_BIOTYPES['psoriasi-cuoio-capelluto'];
  if (a.scalpConditions.includes('dermatite-seborroica')) return SCALP_BIOTYPES.seborroico;
  if (a.hairConcern === 'caduta') {
    return a.hairLossPattern === 'acuta' ? SCALP_BIOTYPES['caduta-reattiva'] : SCALP_BIOTYPES.diradamento;
  }
  if (a.hairConcern === 'forfora') {
    const secca = a.dandruffSubtype ? a.dandruffSubtype === 'secca' : a.scalpType === 'secco';
    return secca ? SCALP_BIOTYPES['secco-desquamante'] : SCALP_BIOTYPES.seborroico;
  }
  if (a.hairConcern === 'secchi-crespi') return SCALP_BIOTYPES['capelli-secchi'];
  if (a.scalpType === 'grasso') return SCALP_BIOTYPES['cute-grassa'];
  if (a.scalpType === 'secco') return SCALP_BIOTYPES['cute-secca'];
  return SCALP_BIOTYPES.equilibrato;
}

export function getScalpTraits(a: QuizAnswers, scalpBiotype: Biotype): Biotype[] {
  const traits: Biotype[] = [];
  if (a.scalpSensitive) traits.push(SCALP_TRAITS['cute-sensibile']);
  const treated = a.hairTreated.some((t) => t !== 'nessuno');
  if (treated && scalpBiotype.id !== 'capelli-secchi') traits.push(SCALP_TRAITS['capelli-trattati']);
  return traits;
}

function passesHardFilters(p: Product, a: QuizAnswers): boolean {
  if (p.gender !== 'unisex' && p.gender !== a.gender) return false;
  // La rosacea, come la pelle sensibile, richiede prudenza sugli attivi aggressivi.
  if ((a.sensitiveSkin || a.conditions.includes('rosacea')) && p.sensitiveSafe === false) return false;
  if (a.pregnant && p.pregnancySafe === false) return false;
  return true;
}

// A parità di pertinenza vince un link già tracciato (commissione attiva).
function linkBonus(p: Product): number {
  return p.linkPending ? 0 : 0.5;
}

// Ambiente e stile di vita: piccoli bonus verso le esigenze che comportano.
const ENVIRONMENT_NEEDS: Record<string, Concern[]> = {
  citta: ['macchie-luminosita', 'anti-age'],
  'clima-secco': ['barriera-cutanea', 'idratazione'],
  'clima-umido': ['acne-sebo', 'pori-dilatati'],
};
const LIFESTYLE_NEEDS: Record<string, Concern[]> = {
  fumo: ['anti-age', 'macchie-luminosita'],
  stress: ['barriera-cutanea', 'rossori-sensibilita'],
  'poco-sonno': ['barriera-cutanea', 'idratazione'],
};

function skincareScore(p: Product, a: QuizAnswers, biotype: Biotype): number {
  let score = 0;
  // "Sensibile" nel test è una domanda a parte, non un tipo di pelle: un prodotto
  // specifico per pelle sensibile corrisponde a chi l'ha dichiarata, qualunque sia il tipo.
  const fitsSkin = p.skinTypes?.includes(a.skinType) || (a.sensitiveSkin && p.skinTypes?.includes('sensibile'));
  if (fitsSkin) {
    score += 3;
    // Un prodotto pensato per una o due tipologie batte un generico "per tutte".
    if (p.skinTypes!.length <= 2) score += 1;
  }
  if (a.sensitiveSkin && p.skinTypes?.includes('sensibile')) score += 2;
  if (p.concerns?.includes(a.goal)) {
    score += 3;
    if (p.concerns[0] === a.goal) score += 1; // obiettivo principale del prodotto
  }
  const needs = [...(ENVIRONMENT_NEEDS[a.environment] ?? []), ...a.lifestyle.flatMap((l) => LIFESTYLE_NEEDS[l] ?? [])];
  if (needs.some((n) => p.concerns?.includes(n))) score += 1;
  // Il biotipo identificato orienta la scelta (es. atopica → barriera, acneica → sebo).
  if (biotype.relatedConcern && p.concerns?.includes(biotype.relatedConcern)) score += 2;
  // Tratti aggiuntivi (indipendenti dal biotipo primario): danno un bonus
  // ai prodotti pertinenti, senza escludere gli altri.
  if (a.conditions.includes('rosacea') && p.concerns?.includes('rossori-sensibilita')) score += 2;
  if (a.pigmentedSkin && p.concerns?.includes('macchie-luminosita')) score += 2;
  // In menopausa la pelle ha bisogno di più barriera/idratazione anche se il
  // biotipo di base è ancora "grasso" — piccolo bonus, non un filtro rigido.
  if (a.menopause && (p.concerns?.includes('barriera-cutanea') || p.concerns?.includes('idratazione') || p.concerns?.includes('anti-age'))) score += 1;
  // Linee pensate per l'uomo: piccola preferenza nel ramo uomo.
  if (a.gender === 'uomo' && p.gender === 'uomo') score += 1;
  return score + linkBonus(p);
}

function hairScore(p: Product, a: QuizAnswers): number {
  // Condizioni diagnosticate: lo shampoo specifico prevale su ogni altra risposta.
  if (a.scalpConditions.includes('psoriasi') && /\bpso/i.test(p.name)) return 10 + linkBonus(p);
  if (a.scalpConditions.includes('dermatite-seborroica') && /\bDS\b/.test(p.name)) return 10 + linkBonus(p);
  let score = 0;
  if (p.hairConcerns?.includes(a.hairConcern)) {
    score += 3;
    if (p.hairConcerns[0] === a.hairConcern) score += 1; // obiettivo principale del prodotto
  } else if (p.hairConcerns && !p.hairConcerns.includes('mantenimento')) {
    score -= 3; // prodotto specifico per un problema che l'utente non ha (es. antiforfora per capelli secchi)
  }
  // Tipo di cuoio capelluto: piccolo bonus se coincide, penalità se il prodotto è pensato
  // per il tipo opposto (es. shampoo anti-grasso su cute secca). Senza tag: neutro.
  if (p.scalpTypes) {
    const dandruffType = a.hairConcern === 'forfora' && a.dandruffSubtype ? (a.dandruffSubtype === 'secca' ? 'secco' : 'grasso') : null;
    if (p.scalpTypes.includes(dandruffType ?? a.scalpType)) score += dandruffType ? 2 : 1;
    else if (p.scalpTypes.some((t) => t !== 'sensibile')) score -= 2;
    if (a.scalpSensitive && p.scalpTypes.includes('sensibile')) score += 2;
  }
  // Capelli colorati o stressati dal calore: preferenza per i trattamenti riparatori.
  if (a.hairTreated.some((t) => t !== 'nessuno') && p.hairConcerns?.includes('secchi-crespi')) score += 1;
  // Lavaggi frequenti o capelli secchi: meglio uno shampoo delicato da uso quotidiano.
  if ((a.washFrequency === 'quotidiano' || a.hairConcern === 'secchi-crespi') && p.hairConcerns?.includes('mantenimento')) score += 1;
  return score + linkBonus(p);
}

const TIER_ORDER: Tier[] = ['base', 'top', 'premium'];

// Spareggio tra prodotti ugualmente adatti: deterministico (stesse risposte → stesso
// risultato) ma diverso da un profilo all'altro, così l'intero catalogo viene proposto.
function tieBreak(seed: string, id: string): number {
  let h = 2166136261;
  for (const c of seed + id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 2500; // 0 – 0.4: non supera mai una differenza reale di punteggio
}

// Sceglie il prodotto principale di una tappa e fino a 2 alternative in altre fasce di prezzo.
// Se l'utente ha una fascia preferita, il principale viene da lì quando è quasi altrettanto adatto.
// minScore: sotto questa soglia la tappa viene saltata (meglio nessun prodotto che uno non pertinente).
function pickStep(
  pool: Product[],
  score: (p: Product) => number,
  a: QuizAnswers,
  used: Set<string>,
  minScore = -Infinity
): { main: Product; alternatives: Product[] } | null {
  const seed = JSON.stringify(a);
  const scored = pool
    .filter((p) => !used.has(p.id))
    .map((p) => ({ p, s: score(p) + tieBreak(seed, p.id) }))
    .filter((x) => x.s >= minScore)
    .sort((x, y) => y.s - x.s);
  if (scored.length === 0) return null;
  let main = scored[0];
  if (a.pricePref !== 'nessuna') {
    const inTier = scored.find((x) => x.p.tier === a.pricePref);
    if (inTier && inTier.s >= scored[0].s - 2) main = inTier;
  }
  const alternatives = TIER_ORDER.filter((t) => t !== main.p.tier)
    .map((t) => scored.find((x) => x.p.tier === t))
    .filter((x): x is { p: Product; s: number } => !!x && x.s >= Math.max(1, main.s - 2))
    .map((x) => x.p);
  used.add(main.p.id);
  alternatives.forEach((p) => used.add(p.id));
  return { main: main.p, alternatives };
}

export function getRecommendation(a: QuizAnswers): QuizResult {
  const wantsSkin = focusIncludesSkin(a.focus);
  const wantsHair = focusIncludesHair(a.focus);
  // Il test consiglia solo prodotti acquistabili: quelli senza link restano nel catalogo.
  const safe = PRODUCTS.filter((p) => p.affiliateUrl !== '#' && passesHardFilters(p, a));
  const used = new Set<string>();

  // Viso: detergente, siero, crema (+ protezione solare se si sta al sole)
  const skinBiotype = wantsSkin ? getSkinBiotype(a) : null;
  const routine: RoutineStep[] = [];
  if (skinBiotype) {
    const skin = (p: Product) => skincareScore(p, a, skinBiotype);
    const isSpf = (p: Product) => !!p.concerns?.includes('protezione-solare');
    const steps: { key: string; label: string; pool: Product[] }[] = [
      { key: 'detergente', label: 'Detergente', pool: safe.filter((p) => p.category === 'detergenti') },
      { key: 'siero', label: 'Siero', pool: safe.filter((p) => p.category === 'sieri') },
      { key: 'crema', label: 'Crema', pool: safe.filter((p) => p.category === 'creme' && !isSpf(p)) },
    ];
    if (a.sunExposure !== 'bassa') {
      steps.push({ key: 'spf', label: 'Protezione solare', pool: safe.filter((p) => p.category === 'creme' && isSpf(p)) });
    }
    for (const step of steps) {
      const picked = pickStep(step.pool, skin, a, used);
      if (picked) routine.push({ key: step.key, label: step.label, ...picked });
    }
  }

  // Capelli: uno shampoo + un trattamento specifico
  const scalpBiotype = wantsHair ? getScalpBiotype(a) : null;
  const hair: RoutineStep[] = [];
  if (scalpBiotype) {
    // Lo shampoo serve a tutti; il trattamento solo se ce n'è uno davvero pertinente.
    const hairSteps = [
      { key: 'shampoo', label: 'Shampoo', category: 'shampoo', minScore: -Infinity },
      { key: 'trattamento-capelli', label: 'Trattamento', category: 'capelli', minScore: 3 },
    ];
    for (const step of hairSteps) {
      const pool = safe.filter((p) => p.category === step.category);
      const picked = pickStep(pool, (p) => hairScore(p, a), a, used, step.minScore);
      if (picked) hair.push({ key: step.key, label: step.label, ...picked });
    }
  }

  // Barba: solo per il ramo uomo, nel percorso viso
  const beard: Product[] = [];
  if (wantsSkin && a.gender === 'uomo' && a.beardConcern) {
    const beardScore = (p: Product) => (p.beardConcerns?.includes(a.beardConcern!) ? 3 : 0) + linkBonus(p);
    const picked = pickStep(safe.filter((p) => p.category === 'barba'), beardScore, a, used);
    if (picked) beard.push(picked.main);
  }

  // Integratore: uno solo e solo se davvero pertinente all'obiettivo del percorso scelto.
  // In gravidanza/allattamento non ne proponiamo: vanno valutati con il medico.
  // Le formule "50+" sono pensate per la menopausa: non le proponiamo prima.
  const integratori: Product[] = [];
  if (!a.pregnant) {
    const integratoriScore = (p: Product) =>
      (wantsSkin && p.concerns?.includes(a.goal) ? 3 : 0) +
      (wantsHair && p.hairConcerns?.includes(a.hairConcern) ? 3 : 0) +
      linkBonus(p);
    const pool = safe.filter(
      (p) => p.category === 'integratori' && (a.menopause || !/50\+/.test(p.name)) && integratoriScore(p) >= 3
    );
    const picked = pickStep(pool, integratoriScore, a, used);
    if (picked) integratori.push(picked.main);
  }

  const hairLossWarning =
    wantsHair && a.hairConcern === 'caduta' && (a.hairLossPattern === 'progressiva' || a.hairLossPattern === 'chiazze')
      ? a.hairLossPattern
      : null;

  return {
    focus: a.focus,
    skinBiotype,
    skinTraits: skinBiotype ? getSkinTraits(a) : [],
    scalpBiotype,
    scalpTraits: scalpBiotype ? getScalpTraits(a, scalpBiotype) : [],
    routine,
    hair,
    beard,
    integratori,
    integratoriEsclusiGravidanza: a.pregnant,
    disclaimerCondizioni:
      (wantsSkin && a.conditions.some((c) => c !== 'nessuna')) ||
      (wantsHair && a.scalpConditions.some((c) => c !== 'nessuna')),
    hairLossWarning,
  };
}
