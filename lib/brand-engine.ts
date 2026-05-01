// Qi Brand Center — Brand Brain (Rule Engine + Learning + DNA)
// TypeScript conversion of brand-engine.js
// All localStorage access is guarded: if (typeof window !== 'undefined')

export interface PaletteColor {
  name: string;
  hex: string;
  idealSharePct?: number;
  rgb?: [number, number, number];
  lab?: [number, number, number];
}

export interface LogoZone {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlatformDef {
  id: string;
  label: string;
  w: number;
  h: number;
  safeInsetPct: number;
  uiZones: Array<{ name: string; x: number; y: number; w: number; h: number }>;
}

export interface ForbiddenCombo {
  a: string;
  b: string;
  max: number;
  note: string;
}

export interface Relation {
  when: string;
  then: string;
  factor: number;
  note: string;
}

export interface RewriteHint {
  from: string;
  to: string;
}

export interface BrandRules {
  colors: {
    primary: PaletteColor[];
    secondary: PaletteColor[];
    tolerance: number;
    onBrandSharePassPct: number;
    onBrandShareReviewPct: number;
    usage: {
      primaryMinPct: number;
      forbiddenCombos: ForbiddenCombo[];
    };
  };
  logo: {
    clearspaceRatio: number;
    minSizePx: number;
    zones: LogoZone[];
    files: unknown[];
    detectionDensityMin: number;
    clearspacePassPct: number;
    minProminencePct: number;
    minContrastRatio: number;
    weakConfidenceCap: number;
  };
  grid: {
    unit: number;
    columns: number;
    gutter: number;
    overlay: unknown;
    alignmentTolerancePx: number;
    rhythmTargetVarPct: number;
  };
  typography: {
    fonts: string[];
    weights: number[];
    maxHeadlineWords: number;
    preferredHeadlineWords: number;
    lineHeight: number;
    forbidAllCapsHeadlines: boolean;
    readabilityFloor: number;
    hierarchyFloor: number;
  };
  voice: {
    good: string[];
    bad: string[];
    examples: Array<{ do: string; dont: string }>;
    tone: string;
    tones: Record<string, string[]>;
    brandToneVector: Record<string, number>;
    toneMatchPassPct: number;
    rewriteHints: RewriteHint[];
  };
  platforms: PlatformDef[];
  quality: {
    minScoreToSubmit: number;
    lockOnFailConfidence: number;
    compressionMinBpp: number;
    weights: Record<string, number>;
    styleMatchFloor: number;
    relations: Relation[];
  };
  legal: {
    requireDisclaimer: boolean;
    maxHeadlineCharsForDisclaimer: number;
  };
  branding: {
    strictMode: boolean;
    reviewerRoleLabel: string;
  };
  learning: {
    autoAdjust: boolean;
    history: unknown[];
    historyCap: number;
  };
  dna: {
    enabled: boolean;
    references: Array<{ when: string; note: string; fingerprint: Fingerprint }>;
  };
}

export interface Fingerprint {
  palette?: Array<{ hex: string; share: number }>;
  avgSat?: number;
  variance?: number;
  logoDensity?: number;
  edgeDensity?: number;
  copyWords?: number;
}

export interface BrandVersion {
  id: string;
  label: string;
  createdAt: string;
  note: string;
  rules: BrandRules;
}

export interface Brand {
  id: string;
  name: string;
  activeVersionId: string;
  versions: BrandVersion[];
}

export interface BrandStore {
  version: number;
  activeBrand: string;
  brands: Record<string, Brand>;
}

export interface AuditReport {
  score: number;
  ruleVersion?: string;
  categories?: Record<string, { score: number }>;
  items: Array<{
    rule: string;
    verdict: string;
    confidence?: number;
    override?: { to: string };
    weak?: boolean;
  }>;
  styleMatch?: ReturnType<BrandEngineAPI['compareToDna']>;
  relationMultipliers?: Record<string, number>;
}

export interface InsightResult {
  runs: number;
  avgScore: number;
  overrideRate: number;
  perRule: Record<string, unknown>;
  suggestions: Array<{ rule: string; severity: string; text: string }>;
}

export interface BrandInfo {
  id: string;
  name: string;
}

export interface VersionInfo {
  id: string;
  label: string;
  createdAt: string;
  note: string;
  active?: boolean;
}

export interface DnaResult {
  avgSat: number;
  variance: number;
  logoDensity: number;
  edgeDensity: number;
  copyWords: number;
  paletteShares: Record<string, number>;
  refs: number;
}

export interface DnaComparison {
  score: number;
  deltas: {
    avgSat: number;
    variance: number;
    logoDensity: number;
    edgeDensity: number;
  };
  palette: number;
  sat: number;
  variance: number;
  edge: number;
}

const STORE_KEY = 'qi-brand-engine-v2';

// ---------- Color helpers ----------
export function hexToRgb(hex: string): [number, number, number] {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return [0, 0, 0];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToLab(rgb: [number, number, number]): [number, number, number] {
  let [r, g, b] = rgb;
  r /= 255; g /= 255; b /= 255;
  [r, g, b] = [r, g, b].map(v => v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92) as [number, number, number];
  let X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let Y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  let Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  [X, Y, Z] = [X, Y, Z].map(v => v > 0.008856 ? Math.cbrt(v) : (7.787 * v + 16 / 116)) as [number, number, number];
  return [(116 * Y) - 16, 500 * (X - Y), 200 * (Y - Z)];
}

export function deltaE(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

export function relativeLuminance(rgb: [number, number, number]): number {
  const c = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrastRatio(rgbA: [number, number, number], rgbB: [number, number, number]): number {
  const l1 = relativeLuminance(rgbA), l2 = relativeLuminance(rgbB);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- Default rule set ----------
function QI_DEFAULTS(): BrandRules {
  return {
    colors: {
      primary: [
        { name: 'Qi Yellow', hex: '#F2CD00', idealSharePct: 45 },
        { name: 'Qi Black', hex: '#0A0A0A', idealSharePct: 25 },
        { name: 'Qi Teal', hex: '#00BFB3', idealSharePct: 8 },
        { name: 'Qi White', hex: '#FFFFFF', idealSharePct: 22 },
      ],
      secondary: [
        { name: 'Yellow soft', hex: '#FFE76A' },
        { name: 'Bone', hex: '#FAF9F6' },
        { name: 'Audience · Male', hex: '#1E3A5F' },
        { name: 'Audience · Female', hex: '#B5365A' },
        { name: 'Audience · Kids', hex: '#FF6B35' },
        { name: 'Audience · Youth', hex: '#6C5CE7' },
      ],
      tolerance: 18,
      onBrandSharePassPct: 85,
      onBrandShareReviewPct: 60,
      usage: {
        primaryMinPct: 40,
        forbiddenCombos: [
          { a: '#F2CD00', b: '#FF6B35', max: 8, note: 'Yellow + Kids orange clashes' }
        ]
      }
    },
    logo: {
      clearspaceRatio: 1.0,
      minSizePx: 64,
      zones: [
        { name: 'Top-left safe', x: 0.02, y: 0.02, w: 0.30, h: 0.20 },
        { name: 'Bottom-right safe', x: 0.68, y: 0.78, w: 0.30, h: 0.20 },
      ],
      files: [],
      detectionDensityMin: 0.04,
      clearspacePassPct: 85,
      minProminencePct: 1.5,
      minContrastRatio: 4.5,
      weakConfidenceCap: 78,
    },
    grid: {
      unit: 8,
      columns: 12,
      gutter: 16,
      overlay: null,
      alignmentTolerancePx: 12,
      rhythmTargetVarPct: 18,
    },
    typography: {
      fonts: ['FF Mark Pro', '29LT Bukra', 'Inter', 'Inter Tight', 'Helvetica', 'Arial'],
      weights: [400, 500, 600, 700, 800],
      maxHeadlineWords: 14,
      preferredHeadlineWords: 10,
      lineHeight: 1.2,
      forbidAllCapsHeadlines: true,
      readabilityFloor: 60,
      hierarchyFloor: 55,
    },
    voice: {
      good: ['easy', 'simple', 'protect', 'your', 'get', 'send', 'save', 'clear', 'free', 'today', 'now', 'open'],
      bad: ['leverage', 'utilise', 'utilize', 'synergy', 'seamless', 'herein', 'aforementioned', 'onboard', 'best-in-class', 'disrupt'],
      examples: [
        { do: 'Easy mobile banking for all.', dont: 'Leverage seamless payment infrastructures.' },
      ],
      tone: 'Clear, confident, warm — fintech for everyone.',
      tones: {
        friendly: ['easy', 'simple', 'your', 'for all', 'everyone', 'today', 'warm', 'help', 'we'],
        formal: ['herein', 'pursuant', 'utilise', 'utilize', 'aforementioned', 'official', 'regulator', 'compliance'],
        salesy: ['save', '% off', 'free', 'limited', 'exclusive', 'today only', "don't miss", 'now', 'offer', 'deal'],
        aggressive: ['must', 'required', 'only', "don't", 'never', 'last chance', 'final', 'urgent', 'warning'],
      },
      brandToneVector: { friendly: 0.65, formal: 0.20, salesy: 0.10, aggressive: 0.05 },
      toneMatchPassPct: 65,
      rewriteHints: [
        { from: 'leverage', to: 'use' },
        { from: 'utilise', to: 'use' },
        { from: 'utilize', to: 'use' },
        { from: 'seamless', to: 'easy' },
        { from: 'synergy', to: 'work together' },
        { from: 'disrupt', to: 'change' },
      ]
    },
    platforms: [
      { id: 'ig-feed', label: 'Instagram · Feed (1080×1080)', w: 1080, h: 1080, safeInsetPct: 6, uiZones: [{ name: 'IG actions bar', x: 0, y: 0.92, w: 1, h: 0.08 }] },
      { id: 'ig-portrait', label: 'Instagram · Portrait (1080×1350)', w: 1080, h: 1350, safeInsetPct: 8, uiZones: [{ name: 'IG actions bar', x: 0, y: 0.93, w: 1, h: 0.07 }] },
      { id: 'ig-story', label: 'Instagram · Story (1080×1920)', w: 1080, h: 1920, safeInsetPct: 14, uiZones: [{ name: 'IG profile chip', x: 0, y: 0, w: 0.55, h: 0.07 }, { name: 'IG message bar', x: 0, y: 0.91, w: 1, h: 0.09 }] },
      { id: 'fb-feed', label: 'Facebook · Feed (1200×630)', w: 1200, h: 630, safeInsetPct: 5, uiZones: [] },
      { id: 'x-post', label: 'X / Twitter · Post (1600×900)', w: 1600, h: 900, safeInsetPct: 5, uiZones: [] },
      { id: 'li-post', label: 'LinkedIn · Square (1200×1200)', w: 1200, h: 1200, safeInsetPct: 6, uiZones: [] },
      { id: 'bb-square', label: 'Billboard · Square (2160×2160)', w: 2160, h: 2160, safeInsetPct: 5, uiZones: [] },
      { id: 'card-3-2', label: 'Print · 3:2 card (1350×900)', w: 1350, h: 900, safeInsetPct: 6, uiZones: [] },
    ],
    quality: {
      minScoreToSubmit: 85,
      lockOnFailConfidence: 85,
      compressionMinBpp: 0.4,
      weights: { colors: 25, logo: 20, layout: 15, typography: 15, voice: 15, platform: 10 },
      styleMatchFloor: 70,
      relations: [
        { when: 'colors.fail', then: 'global.severity', factor: 1.20, note: 'Color FAIL is a brand-defining signal' },
        { when: 'logo.weak', then: 'platform.severity', factor: 1.30, note: 'A weak logo is worse on platforms with UI overlays' },
        { when: 'voice.fail', then: 'global.severity', factor: 1.10, note: 'Off-tone copy ripples into hierarchy scores' },
      ],
    },
    legal: {
      requireDisclaimer: true,
      maxHeadlineCharsForDisclaimer: 12,
    },
    branding: {
      strictMode: true,
      reviewerRoleLabel: 'Brand Manager',
    },
    learning: {
      autoAdjust: true,
      history: [],
      historyCap: 50,
    },
    dna: {
      enabled: true,
      references: [],
    },
  };
}

export const RULE_TO_CATEGORY: Record<string, string> = {
  'Color palette': 'colors',
  'Logo & clear-space': 'logo',
  'Layout & rhythm': 'layout',
  'Typography': 'typography',
  'Tone of voice': 'voice',
  'Imagery style': 'imagery',
  'Legal compliance': 'legal',
  'Resolution & quality': 'quality',
  'Platform & safe area': 'platform',
};

const CATEGORY_TO_RULE: Record<string, string> = {
  colors: 'Color palette', logo: 'Logo & clear-space', layout: 'Layout & rhythm',
  typography: 'Typography', voice: 'Tone of voice', platform: 'Platform & safe area',
};

// ---------- Persistence ----------
function nowIso() { return new Date().toISOString(); }

function freshStore(): BrandStore {
  const v1: BrandVersion = {
    id: 'v1', label: 'v1 — initial', createdAt: nowIso(),
    note: 'Seeded from Qi guidelines', rules: QI_DEFAULTS(),
  };
  return {
    version: 2,
    activeBrand: 'qi',
    brands: { qi: { id: 'qi', name: 'Qi', activeVersionId: 'v1', versions: [v1] } }
  };
}

function deepMergeDefaults(into: unknown, from: unknown): unknown {
  if (Array.isArray(from)) return into || from;
  if (typeof from !== 'object' || from === null) return into === undefined ? from : into;
  const out: Record<string, unknown> = (into && typeof into === 'object') ? { ...(into as Record<string, unknown>) } : {};
  Object.keys(from as Record<string, unknown>).forEach(k => {
    out[k] = deepMergeDefaults(out[k], (from as Record<string, unknown>)[k]);
  });
  return out;
}

function migrate(parsed: BrandStore): BrandStore {
  if (parsed.version === 2) return parsed;
  const def = QI_DEFAULTS();
  Object.values(parsed.brands || {}).forEach(b => {
    (b.versions || []).forEach(v => {
      v.rules = deepMergeDefaults(v.rules || {}, def) as BrandRules;
    });
  });
  parsed.version = 2;
  return parsed;
}

function loadStore(): BrandStore {
  if (typeof window === 'undefined') return freshStore();
  try {
    const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem('qi-brand-engine-v1');
    if (!raw) return freshStore();
    const parsed = JSON.parse(raw) as BrandStore;
    if (!parsed || !parsed.brands) return freshStore();
    return migrate(parsed);
  } catch { return freshStore(); }
}

function clone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

// ---------- Engine class ----------
class BrandEngineImpl {
  private store: BrandStore;
  private listeners = new Set<(rules: BrandRules) => void>();

  constructor() {
    this.store = loadStore();
    this.saveStore(this.store);
  }

  private saveStore(s: BrandStore) {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
    }
    this.listeners.forEach(fn => { try { fn(this.currentRules()); } catch { /* ignore */ } });
  }

  private activeBrandObj(): Brand {
    return this.store.brands[this.store.activeBrand];
  }

  private activeVersion(): BrandVersion {
    const b = this.activeBrandObj();
    return b.versions.find(v => v.id === b.activeVersionId) || b.versions[b.versions.length - 1];
  }

  approvedPalette(): Array<PaletteColor & { rgb: [number, number, number]; lab: [number, number, number] }> {
    const r = this.activeVersion().rules;
    const all = (r.colors.primary || []).concat(r.colors.secondary || []);
    return all.map(c => ({ ...c, rgb: hexToRgb(c.hex), lab: rgbToLab(hexToRgb(c.hex)) }));
  }

  recordAudit(report: AuditReport) {
    const r = this.activeVersion().rules;
    if (!r.learning) r.learning = QI_DEFAULTS().learning;
    const summary = {
      at: nowIso(),
      ruleVersion: report.ruleVersion,
      score: report.score,
      categories: report.categories ? Object.fromEntries(
        Object.entries(report.categories).map(([k, v]) => [k, v.score])
      ) : {},
      verdicts: report.items.map(it => ({
        rule: it.rule,
        ai: it.verdict,
        human: it.override ? it.override.to : null,
        confidence: it.confidence,
      })),
    };
    r.learning.history = (r.learning.history || []);
    r.learning.history.push(summary);
    while (r.learning.history.length > (r.learning.historyCap || 50)) {
      r.learning.history.shift();
    }
    if (r.learning.autoAdjust !== false) this.autoAdjust(r);
    this.saveStore(this.store);
  }

  clearLearning() {
    const r = this.activeVersion().rules;
    if (r.learning) r.learning.history = [];
    this.saveStore(this.store);
  }

  private autoAdjust(r: BrandRules) {
    const hist = (r.learning?.history || []) as Array<{ verdicts: Array<{ rule: string; ai: string | null; human: string | null }> }>;
    if (hist.length < 5) return;
    const counts: Record<string, Record<string, number>> = {};
    hist.forEach(h => {
      h.verdicts.forEach(v => {
        if (!v.human) return;
        counts[v.rule] = counts[v.rule] || { aiPass: 0, aiFail: 0, aiReview: 0, humanPass: 0, humanFail: 0 };
        if (v.ai) counts[v.rule]['ai' + cap(v.ai)]++;
        if (v.human) counts[v.rule]['human' + cap(v.human)]++;
      });
    });
    function cap(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
    const cstats = counts['Color palette'];
    if (cstats && cstats.aiFail >= 3 && cstats.humanPass >= 3) {
      r.colors.tolerance = Math.min(40, r.colors.tolerance + 1);
      r.colors.onBrandSharePassPct = Math.max(50, r.colors.onBrandSharePassPct - 1);
    }
    if (cstats && cstats.aiPass >= 3 && cstats.humanFail >= 3) {
      r.colors.tolerance = Math.max(4, r.colors.tolerance - 1);
      r.colors.onBrandSharePassPct = Math.min(95, r.colors.onBrandSharePassPct + 1);
    }
    const total = hist.length;
    Object.keys(r.quality.weights).forEach(catKey => {
      const ruleName = CATEGORY_TO_RULE[catKey];
      const c = counts[ruleName];
      if (!c) return;
      const hits = (c.humanPass || 0) + (c.humanFail || 0);
      if (hits / total > 0.4 && r.quality.weights[catKey] > 4) {
        r.quality.weights[catKey] = Math.max(4, r.quality.weights[catKey] - 1);
        r.quality.weights.colors += 1;
      }
    });
  }

  getInsights(): InsightResult {
    const r = this.activeVersion().rules;
    const hist = (r.learning?.history || []) as Array<{ score: number; verdicts: Array<{ rule: string; ai: string | null; human: string | null }> }>;
    if (!hist.length) return { runs: 0, avgScore: 0, overrideRate: 0, perRule: {}, suggestions: [] };
    const avgScore = hist.reduce((a, h) => a + h.score, 0) / hist.length;
    const perRule: Record<string, Record<string, number>> = {};
    let totalVerdicts = 0, totalOverrides = 0;
    function cap(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
    hist.forEach(h => h.verdicts.forEach(v => {
      perRule[v.rule] = perRule[v.rule] || { runs: 0, overrides: 0 };
      perRule[v.rule].runs++;
      totalVerdicts++;
      if (v.ai) perRule[v.rule]['ai' + cap(v.ai)] = (perRule[v.rule]['ai' + cap(v.ai)] || 0) + 1;
      if (v.human) { perRule[v.rule].overrides++; totalOverrides++; perRule[v.rule]['human' + cap(v.human)] = (perRule[v.rule]['human' + cap(v.human)] || 0) + 1; }
    }));
    const suggestions: InsightResult['suggestions'] = [];
    Object.entries(perRule).forEach(([rule, c]) => {
      if (!c.overrides) return;
      const rate = c.overrides / c.runs;
      if (rate > 0.4) {
        suggestions.push({ rule, severity: 'high', text: `"${rule}" has been overridden in ${(rate * 100) | 0}% of audits — consider relaxing the rule or lowering its weight.` });
      }
    });
    return { runs: hist.length, avgScore, overrideRate: totalVerdicts ? totalOverrides / totalVerdicts : 0, perRule, suggestions };
  }

  addDnaReference(fingerprint: Fingerprint, note?: string) {
    const r = this.activeVersion().rules;
    if (!r.dna) r.dna = { enabled: true, references: [] };
    r.dna.references.push({ when: nowIso(), note: note || '', fingerprint });
    this.saveStore(this.store);
  }

  removeDnaReference(idx: number) {
    const r = this.activeVersion().rules;
    r.dna.references.splice(idx, 1);
    this.saveStore(this.store);
  }

  getDna(): DnaResult | null {
    const r = this.activeVersion().rules;
    if (!r.dna || !r.dna.references || !r.dna.references.length) return null;
    const refs = r.dna.references.map(x => x.fingerprint);
    const avg: DnaResult = { avgSat: 0, variance: 0, logoDensity: 0, edgeDensity: 0, copyWords: 0, paletteShares: {}, refs: 0 };
    refs.forEach(f => {
      avg.avgSat += f.avgSat || 0;
      avg.variance += f.variance || 0;
      avg.logoDensity += f.logoDensity || 0;
      avg.edgeDensity += f.edgeDensity || 0;
      avg.copyWords += f.copyWords || 0;
      (f.palette || []).forEach(p => { avg.paletteShares[p.hex] = (avg.paletteShares[p.hex] || 0) + p.share; });
    });
    const n = refs.length;
    avg.avgSat /= n; avg.variance /= n; avg.logoDensity /= n; avg.edgeDensity /= n; avg.copyWords /= n;
    Object.keys(avg.paletteShares).forEach(k => avg.paletteShares[k] /= n);
    avg.refs = n;
    return avg;
  }

  compareToDna(fp: Fingerprint): DnaComparison | null {
    const dna = this.getDna();
    if (!dna) return null;
    const deltas = {
      avgSat: Math.abs((fp.avgSat || 0) - dna.avgSat),
      variance: Math.abs((fp.variance || 0) - dna.variance) / Math.max(1, dna.variance),
      logoDensity: Math.abs((fp.logoDensity || 0) - dna.logoDensity),
      edgeDensity: Math.abs((fp.edgeDensity || 0) - dna.edgeDensity),
    };
    let overlap = 0;
    (fp.palette || []).forEach(p => {
      const dnaShare = dna.paletteShares[p.hex] || 0;
      overlap += Math.min(p.share, dnaShare);
    });
    const palette = Math.max(0, Math.min(1, overlap));
    const sat = Math.max(0, 1 - deltas.avgSat * 4);
    const varScr = Math.max(0, 1 - deltas.variance);
    const edge = Math.max(0, 1 - deltas.edgeDensity * 6);
    const score = Math.round((palette * 0.5 + sat * 0.2 + varScr * 0.15 + edge * 0.15) * 100);
    return { score, deltas, palette: Math.round(palette * 100), sat: Math.round(sat * 100), variance: Math.round(varScr * 100), edge: Math.round(edge * 100) };
  }

  evalRelations(report: AuditReport): AuditReport {
    const r = this.activeVersion().rules;
    if (!r.quality.relations) return report;
    const fails = new Set<string>();
    report.items.forEach(it => {
      const v = it.override?.to || it.verdict;
      const cat = (RULE_TO_CATEGORY[it.rule] || '').toLowerCase();
      if (cat && v === 'fail') fails.add(cat + '.fail');
      if (it.weak) fails.add(cat + '.weak');
    });
    const multipliers: Record<string, number> = { global: 1, color: 1, logo: 1, layout: 1, typography: 1, voice: 1, platform: 1 };
    r.quality.relations.forEach(rel => {
      if (fails.has(rel.when)) {
        const tgt = rel.then.split('.')[0];
        multipliers[tgt] = (multipliers[tgt] || 1) * (rel.factor || 1);
      }
    });
    report.relationMultipliers = multipliers;
    return report;
  }

  // Brand management
  listBrands(): BrandInfo[] { return Object.values(this.store.brands).map(b => ({ id: b.id, name: b.name })); }
  activeBrand(): string { return this.store.activeBrand; }
  setActiveBrand(id: string): boolean {
    if (!this.store.brands[id]) return false;
    this.store.activeBrand = id;
    this.saveStore(this.store);
    return true;
  }
  createBrand(id: string, name: string): boolean {
    if (this.store.brands[id]) return false;
    const v: BrandVersion = { id: 'v1', label: 'v1 — initial', createdAt: nowIso(), note: `Seeded for ${name}`, rules: QI_DEFAULTS() };
    this.store.brands[id] = { id, name, activeVersionId: v.id, versions: [v] };
    this.store.activeBrand = id;
    this.saveStore(this.store);
    return true;
  }
  renameBrand(id: string, name: string): boolean {
    if (!this.store.brands[id]) return false;
    this.store.brands[id].name = name;
    this.saveStore(this.store);
    return true;
  }
  deleteBrand(id: string): boolean {
    if (Object.keys(this.store.brands).length <= 1) return false;
    delete this.store.brands[id];
    if (this.store.activeBrand === id) this.store.activeBrand = Object.keys(this.store.brands)[0];
    this.saveStore(this.store);
    return true;
  }

  currentRules(): BrandRules { return clone(this.activeVersion().rules); }
  currentVersion(): VersionInfo {
    const v = this.activeVersion();
    return { id: v.id, label: v.label, createdAt: v.createdAt, note: v.note };
  }
  listVersions(brandId?: string): VersionInfo[] {
    const b = brandId ? this.store.brands[brandId] : this.activeBrandObj();
    return b ? b.versions.map(v => ({ id: v.id, label: v.label, createdAt: v.createdAt, note: v.note, active: v.id === b.activeVersionId })) : [];
  }
  saveVersion(rules: BrandRules, note?: string): string {
    const b = this.activeBrandObj();
    const idx = b.versions.length + 1;
    const v: BrandVersion = { id: 'v' + idx, label: 'v' + idx + (note ? ' — ' + note.slice(0, 40) : ''), createdAt: nowIso(), note: note || '', rules: clone(rules) };
    b.versions.push(v);
    b.activeVersionId = v.id;
    this.saveStore(this.store);
    return v.id;
  }
  updateActiveDraft(rules: BrandRules) {
    const b = this.activeBrandObj();
    const v = b.versions.find(x => x.id === b.activeVersionId);
    if (v) { v.rules = clone(rules); this.saveStore(this.store); }
  }
  rollback(id: string): boolean {
    const b = this.activeBrandObj();
    if (!b.versions.find(v => v.id === id)) return false;
    b.activeVersionId = id;
    this.saveStore(this.store);
    return true;
  }
  deleteVersion(id: string): boolean {
    const b = this.activeBrandObj();
    if (b.versions.length <= 1) return false;
    if (b.activeVersionId === id) return false;
    b.versions = b.versions.filter(v => v.id !== id);
    this.saveStore(this.store);
    return true;
  }
  resetDefaults() {
    if (typeof window !== 'undefined') localStorage.removeItem(STORE_KEY);
    this.store = loadStore();
    this.saveStore(this.store);
  }
  subscribe(fn: (rules: BrandRules) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // Color helpers exposed
  hexToRgb = hexToRgb;
  rgbToHex = rgbToHex;
  rgbToLab = rgbToLab;
  deltaE = deltaE;
  contrastRatio = contrastRatio;
  relativeLuminance = relativeLuminance;
  DEFAULTS = QI_DEFAULTS;
  RULE_TO_CATEGORY = RULE_TO_CATEGORY;
}

export type BrandEngineAPI = BrandEngineImpl;

// Singleton lazy-init
let _instance: BrandEngineImpl | null = null;

export function getBrandEngine(): BrandEngineImpl {
  if (!_instance) {
    _instance = new BrandEngineImpl();
  }
  return _instance;
}
