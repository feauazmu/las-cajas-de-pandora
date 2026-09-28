// Shape of the player-facing content. Every string value is Spanish; keys are
// the English ids from game/defs.ts.

export interface NamedFlavor {
  readonly name: string;
  readonly flavor: string;
}

export interface Memo {
  readonly title: string;
  readonly paragraphs: readonly string[];
  /** Label of the single dismiss button. */
  readonly dismiss: string;
}

export interface StageContent {
  /** Shown as the Store group heading, e.g. "La Cocina". */
  readonly name: string;
  readonly tickerHeadlines: readonly string[];
  readonly quotes: readonly string[];
  /** Shown on arriving at this Stage (Stage 1: new-game intro). */
  readonly memo: Memo;
}

export interface InversionistaOutcomeContent {
  /** Toast text; `amount` is already formatted. */
  readonly toast: (amount: string) => string;
  readonly headlines: readonly string[];
}

export interface UiStrings {
  readonly title: string;
  readonly croquetasUnit: string; // "croquetas", after the counter
  readonly perSecond: (cps: string) => string; // "por segundo: 1,5"
  readonly store: string; // "Tienda"
  readonly upgradesHeading: string;
  readonly expansionHeading: string; // "Expansión"
  readonly owned: (n: number) => string; // "x12" style owned count label
  readonly cost: (amount: string) => string;
  readonly producerCps: (cps: string) => string; // CPS contribution of a Store row
  readonly upgradeEffectProducer: (producerName: string) => string; // "Duplica la producción de …"
  readonly upgradeEffectClick: string; // "Duplica las croquetas por clic"
  readonly upgradeEffectClickCps: string; // "+1 % de tu producción por segundo en cada clic"
  readonly buy: string;
  readonly close: string; // accessible label for the ✕ that closes an Upgrade's detail card
  readonly frenzyIndicator: (seconds: number) => string; // "¡Ronda de Financiación! ×7 — 23 s"
  readonly inversionistaAria: string; // accessible label for the clickable Inversionista
  readonly pandoraAria: string;
  readonly musicOn: string;
  readonly musicOff: string;
  readonly sfxOn: string;
  readonly sfxOff: string;
  readonly reset: string; // "Borrar partida"
  readonly resetConfirmTitle: string;
  readonly resetConfirmBody: string;
  readonly resetConfirmYes: string;
  readonly resetConfirmNo: string;
  readonly offlineTitle: string; // "Mientras no estabas…"
  readonly offlineBody: (elapsed: string, gain: string) => string;
  readonly offlineDismiss: string;
  /** Human duration, e.g. "2 h 5 min", "45 s". */
  readonly duration: (ms: number) => string;
  readonly memoHeader: string; // "MEMORANDO"
  readonly memoFrom: string; // "De: Pandora, Presidenta…"
  readonly memoTo: string;
}

export interface Content {
  readonly stages: Readonly<Record<string, StageContent>>;
  readonly producers: Readonly<Record<string, NamedFlavor>>;
  readonly upgrades: Readonly<Record<string, NamedFlavor>>;
  readonly expansions: Readonly<Record<string, NamedFlavor>>;
  readonly inversionista: {
    readonly frenzy: InversionistaOutcomeContent;
    readonly lump: InversionistaOutcomeContent;
  };
  readonly offlineLines: readonly string[];
  readonly ui: UiStrings;
}
