// Qi Brand Center — Brand Brain (Rule Engine + Learning + DNA)
// All brand intelligence lives here as data and adaptive signals.
// Multi-brand · versioned · learning · DNA-aware.
//
// API: window.BrandEngine
//   listBrands / activeBrand / setActiveBrand / createBrand / renameBrand / deleteBrand
//   currentRules / currentVersion / listVersions / saveVersion / updateActiveDraft
//   rollback / deleteVersion / resetDefaults / subscribe
//
//   recordAudit(report)        → push an audit into learning history (auto-adjusts thresholds)
//   getInsights()              → aggregated stats: avg score, override-rate per category, suggestions
//   clearLearning()            → wipe history (does not touch versions)
//
//   addDnaReference(fingerprint, note)  → push a reference fingerprint
//   removeDnaReference(idx)    → remove a reference
//   getDna()                   → averaged "Brand DNA" fingerprint (or null)
//   compareToDna(fingerprint)  → {score:0-100, deltas:{...}}
//
//   labOf(hex) / hexToRgb / rgbToLab            → color helpers
//   approvedPalette()          → primary + secondary with precomputed Lab
//   evalRelations(report)      → apply weight modifiers from rules.relations
(function(global){
  const STORE_KEY = 'qi-brand-engine-v2';

  // ---------- Color helpers (used both by engine and analyzer) ----------
  function hexToRgb(hex){
    const h = String(hex||'').replace('#','');
    if(h.length !== 6) return [0,0,0];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  function rgbToLab([r,g,b]){
    r/=255; g/=255; b/=255;
    [r,g,b] = [r,g,b].map(v => v > 0.04045 ? Math.pow((v+0.055)/1.055, 2.4) : v/12.92);
    let X = (r*0.4124 + g*0.3576 + b*0.1805) / 0.95047;
    let Y = (r*0.2126 + g*0.7152 + b*0.0722) / 1.00000;
    let Z = (r*0.0193 + g*0.1192 + b*0.9505) / 1.08883;
    [X,Y,Z] = [X,Y,Z].map(v => v > 0.008856 ? Math.cbrt(v) : (7.787*v + 16/116));
    return [(116*Y)-16, 500*(X-Y), 200*(Y-Z)];
  }
  function deltaE(a, b){ return Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]); }
  function rgbToHex(r,g,b){ return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0').toUpperCase()).join(''); }
  function relativeLuminance([r,g,b]){
    const c = [r,g,b].map(v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
  }
  function contrastRatio(rgbA, rgbB){
    const l1 = relativeLuminance(rgbA), l2 = relativeLuminance(rgbB);
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  }

  // ---------- Default rule set (Qi) ----------
  function QI_DEFAULTS(){
    return {
      colors: {
        primary: [
          { name:'Qi Yellow', hex:'#F2CD00', idealSharePct: 45 },
          { name:'Qi Black',  hex:'#0A0A0A', idealSharePct: 25 },
          { name:'Qi Teal',   hex:'#00BFB3', idealSharePct: 8  },
          { name:'Qi White',  hex:'#FFFFFF', idealSharePct: 22 },
        ],
        secondary: [
          { name:'Yellow soft', hex:'#FFE76A' },
          { name:'Bone',        hex:'#FAF9F6' },
          { name:'Audience · Male',   hex:'#1E3A5F' },
          { name:'Audience · Female', hex:'#B5365A' },
          { name:'Audience · Kids',   hex:'#FF6B35' },
          { name:'Audience · Youth',  hex:'#6C5CE7' },
        ],
        tolerance: 18,
        onBrandSharePassPct: 85,
        onBrandShareReviewPct: 60,
        usage: {
          primaryMinPct: 40,                   // primary swatches must cover ≥40% combined
          forbiddenCombos: [                   // pair of hexes that cannot co-exist > thresholdPct
            { a: '#F2CD00', b: '#FF6B35', max: 8, note: 'Yellow + Kids orange clashes' }
          ]
        }
      },
      logo: {
        clearspaceRatio: 1.0,
        minSizePx: 64,
        // Replaces fixed positions: free-form zones (normalized 0–1).
        // Allowed zones the brandmark can sit in. Visual builder edits these.
        zones: [
          { name:'Top-left safe',     x:0.02, y:0.02, w:0.30, h:0.20 },
          { name:'Bottom-right safe', x:0.68, y:0.78, w:0.30, h:0.20 },
        ],
        files: [],
        detectionDensityMin: 0.04,
        clearspacePassPct: 85,
        minProminencePct: 1.5,                 // logo area / canvas area must be ≥ this
        minContrastRatio: 4.5,                 // logo vs surrounding background (WCAG AA)
        weakConfidenceCap: 78,                 // score above which a logo can be flagged "present but weak"
      },
      grid: {
        unit: 8,
        columns: 12,
        gutter: 16,
        overlay: null,
        alignmentTolerancePx: 12,              // edge-snap tolerance for alignment scoring
        rhythmTargetVarPct: 18,                // gap variance below = good rhythm
      },
      typography: {
        fonts: ['FF Mark Pro', '29LT Bukra', 'Inter', 'Inter Tight', 'Helvetica', 'Arial'],
        weights: [400, 500, 600, 700, 800],
        maxHeadlineWords: 14,
        preferredHeadlineWords: 10,
        lineHeight: 1.2,
        forbidAllCapsHeadlines: true,
        readabilityFloor: 60,                  // sub-score below = REVIEW; below 40 = FAIL
        hierarchyFloor: 55,
      },
      voice: {
        good: ['easy','simple','protect','your','get','send','save','clear','free','today','now','open'],
        bad:  ['leverage','utilise','utilize','synergy','seamless','herein','aforementioned','onboard','best-in-class','disrupt'],
        examples: [
          { do: 'Easy mobile banking for all.', dont: 'Leverage seamless payment infrastructures.' },
        ],
        tone: 'Clear, confident, warm — fintech for everyone.',
        // Multi-tone classifier: keyword vectors per axis
        tones: {
          friendly: ['easy','simple','your','for all','everyone','today','warm','help','we'],
          formal:   ['herein','pursuant','utilise','utilize','aforementioned','official','regulator','compliance'],
          salesy:   ['save','% off','free','limited','exclusive','today only','don\'t miss','now','offer','deal'],
          aggressive:['must','required','only','don\'t','never','last chance','final','urgent','warning'],
        },
        // Brand's target tone vector (must sum to 1)
        brandToneVector: { friendly: 0.65, formal: 0.20, salesy: 0.10, aggressive: 0.05 },
        toneMatchPassPct: 65,
        // Curated rewrite hints: "if X then suggest Y"
        rewriteHints: [
          { from: 'leverage', to: 'use' },
          { from: 'utilise',  to: 'use' },
          { from: 'utilize',  to: 'use' },
          { from: 'seamless', to: 'easy' },
          { from: 'synergy',  to: 'work together' },
          { from: 'disrupt',  to: 'change' },
        ]
      },
      platforms: [
        { id:'ig-feed',     label:'Instagram · Feed (1080×1080)',     w:1080, h:1080, safeInsetPct:6,
          uiZones:[{name:'IG actions bar', x:0,y:0.92,w:1,h:0.08}] },
        { id:'ig-portrait', label:'Instagram · Portrait (1080×1350)', w:1080, h:1350, safeInsetPct:8,
          uiZones:[{name:'IG actions bar', x:0,y:0.93,w:1,h:0.07}] },
        { id:'ig-story',    label:'Instagram · Story (1080×1920)',    w:1080, h:1920, safeInsetPct:14,
          uiZones:[
            {name:'IG profile chip', x:0,y:0,    w:0.55,h:0.07},
            {name:'IG message bar',  x:0,y:0.91, w:1,    h:0.09}
          ] },
        { id:'fb-feed',     label:'Facebook · Feed (1200×630)',       w:1200, h:630,  safeInsetPct:5, uiZones:[] },
        { id:'x-post',      label:'X / Twitter · Post (1600×900)',    w:1600, h:900,  safeInsetPct:5, uiZones:[] },
        { id:'li-post',     label:'LinkedIn · Square (1200×1200)',    w:1200, h:1200, safeInsetPct:6, uiZones:[] },
        { id:'bb-square',   label:'Billboard · Square (2160×2160)',   w:2160, h:2160, safeInsetPct:5, uiZones:[] },
        { id:'card-3-2',    label:'Print · 3:2 card (1350×900)',      w:1350, h:900,  safeInsetPct:6, uiZones:[] },
      ],
      quality: {
        minScoreToSubmit: 85,
        lockOnFailConfidence: 85,
        compressionMinBpp: 0.4,
        // Weighted scoring — admin can adjust. Must sum to 100.
        weights: { colors: 25, logo: 20, layout: 15, typography: 15, voice: 15, platform: 10 },
        // DNA style-match floor: below this → "technically correct but not Qi style"
        styleMatchFloor: 70,
        // Rule relation engine — multipliers applied during final scoring
        relations: [
          { when: 'colors.fail', then: 'global.severity', factor: 1.20,
            note: 'Color FAIL is a brand-defining signal — penalise other categories more.' },
          { when: 'logo.weak',   then: 'platform.severity', factor: 1.30,
            note: 'A weak logo is worse on platforms with UI overlays (IG actions, etc.).' },
          { when: 'voice.fail',  then: 'global.severity', factor: 1.10,
            note: 'Off-tone copy ripples into perceived hierarchy and tone-of-voice scores.' },
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
        autoAdjust: true,                       // re-tune tolerance + weights from history
        history: [],                            // last N audit summaries
        historyCap: 50,
      },
      dna: {
        enabled: true,
        references: [],                         // [{when, note, fingerprint}]
        // a fingerprint = {
        //   palette: [{hex, share}], avgSat, variance, logoDensity, edgeDensity, copyWords
        // }
      },
    };
  }

  // ---------- Persistence ----------
  function nowIso(){ return new Date().toISOString(); }
  function freshStore(){
    const v1 = {
      id:'v1', label:'v1 — initial', createdAt: nowIso(),
      note:'Seeded from Qi guidelines', rules: QI_DEFAULTS(),
    };
    return {
      version: 2,
      activeBrand: 'qi',
      brands: { qi: { id:'qi', name:'Qi', activeVersionId:'v1', versions:[v1] } }
    };
  }
  function migrate(parsed){
    // Migrate older v1 stores by deep-merging defaults into every version's rules
    if(parsed.version === 2) return parsed;
    const def = QI_DEFAULTS();
    Object.values(parsed.brands || {}).forEach(b => {
      (b.versions || []).forEach(v => {
        v.rules = deepMergeDefaults(v.rules || {}, def);
      });
    });
    parsed.version = 2;
    return parsed;
  }
  function deepMergeDefaults(into, from){
    if(Array.isArray(from)) return into || from;
    if(typeof from !== 'object' || from === null) return into === undefined ? from : into;
    const out = into && typeof into === 'object' ? into : {};
    Object.keys(from).forEach(k => {
      out[k] = deepMergeDefaults(out[k], from[k]);
    });
    return out;
  }
  function loadStore(){
    try {
      const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem('qi-brand-engine-v1');
      if(!raw) return freshStore();
      const parsed = JSON.parse(raw);
      if(!parsed || !parsed.brands) return freshStore();
      return migrate(parsed);
    } catch(e){ return freshStore(); }
  }
  function saveStore(s){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch(e){}
    listeners.forEach(fn => { try { fn(api.currentRules()); } catch(_){} });
  }

  const listeners = new Set();
  let store = loadStore();
  saveStore(store);  // ensure migrated copy is written

  function activeBrandObj(){ return store.brands[store.activeBrand]; }
  function activeVersion(){
    const b = activeBrandObj();
    return b.versions.find(v => v.id === b.activeVersionId) || b.versions[b.versions.length-1];
  }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }

  // ---------- Approved palette with precomputed Lab ----------
  function approvedPalette(){
    const r = activeVersion().rules;
    const all = (r.colors.primary || []).concat(r.colors.secondary || []);
    return all.map(c => ({ ...c, rgb: hexToRgb(c.hex), lab: rgbToLab(hexToRgb(c.hex)) }));
  }

  // ---------- Learning ----------
  function recordAudit(report){
    const r = activeVersion().rules;
    if(!r.learning) r.learning = QI_DEFAULTS().learning;
    const summary = {
      at: nowIso(),
      ruleVersion: report.ruleVersion,
      score: report.score,
      categories: report.categories ? Object.fromEntries(
        Object.entries(report.categories).map(([k,v]) => [k, v.score])
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
    while(r.learning.history.length > (r.learning.historyCap || 50)){
      r.learning.history.shift();
    }
    if(r.learning.autoAdjust !== false) autoAdjust(r);
    saveStore(store);
  }
  function clearLearning(){
    const r = activeVersion().rules;
    if(r.learning) r.learning.history = [];
    saveStore(store);
  }
  function autoAdjust(r){
    const hist = r.learning.history || [];
    if(hist.length < 5) return;  // not enough signal yet
    // Count overrides by rule
    const counts = {};
    let overrideCount = 0;
    hist.forEach(h => {
      h.verdicts.forEach(v => {
        if(!v.human) return;
        overrideCount++;
        counts[v.rule] = counts[v.rule] || { aiPass:0, aiFail:0, aiReview:0, humanPass:0, humanFail:0 };
        if(v.ai)    counts[v.rule]['ai'+cap(v.ai)]++;
        if(v.human) counts[v.rule]['human'+cap(v.human)]++;
      });
    });
    function cap(s){ return s ? s[0].toUpperCase() + s.slice(1) : ''; }
    // If colour rule is repeatedly overridden FAIL → PASS, slowly relax tolerance
    const cstats = counts['Color palette'];
    if(cstats && cstats.aiFail >= 3 && cstats.humanPass >= 3){
      r.colors.tolerance = Math.min(40, r.colors.tolerance + 1);
      r.colors.onBrandSharePassPct = Math.max(50, r.colors.onBrandSharePassPct - 1);
    }
    // If colour rule is overridden PASS → FAIL repeatedly, tighten
    if(cstats && cstats.aiPass >= 3 && cstats.humanFail >= 3){
      r.colors.tolerance = Math.max(4, r.colors.tolerance - 1);
      r.colors.onBrandSharePassPct = Math.min(95, r.colors.onBrandSharePassPct + 1);
    }
    // Categories with high override rate (>40%) → reduce their weight, redistribute to siblings
    const total = hist.length;
    Object.keys(r.quality.weights).forEach(catKey => {
      const ruleName = CATEGORY_TO_RULE[catKey];
      const c = counts[ruleName];
      if(!c) return;
      const hits = (c.humanPass || 0) + (c.humanFail || 0);
      if(hits / total > 0.4 && r.quality.weights[catKey] > 4){
        r.quality.weights[catKey] = Math.max(4, r.quality.weights[catKey] - 1);
        // distribute +1 to colors (brand defining)
        r.quality.weights.colors += 1;
      }
    });
  }
  const CATEGORY_TO_RULE = {
    colors:'Color palette', logo:'Logo & clear-space', layout:'Layout & rhythm',
    typography:'Typography', voice:'Tone of voice', platform:'Platform & safe area',
  };

  function getInsights(){
    const r = activeVersion().rules;
    const hist = (r.learning && r.learning.history) || [];
    if(!hist.length) return { runs:0, avgScore:0, overrideRate:0, perRule:{}, suggestions:[] };
    const avgScore = hist.reduce((a,h)=>a+h.score, 0) / hist.length;
    const perRule = {};
    let totalVerdicts = 0, totalOverrides = 0;
    hist.forEach(h => h.verdicts.forEach(v => {
      perRule[v.rule] = perRule[v.rule] || { runs:0, overrides:0, aiPass:0, aiFail:0, aiReview:0, humanPass:0, humanFail:0 };
      perRule[v.rule].runs++;
      totalVerdicts++;
      if(v.ai)    perRule[v.rule]['ai'+cap(v.ai)]++;
      if(v.human){ perRule[v.rule].overrides++; totalOverrides++; perRule[v.rule]['human'+cap(v.human)]++; }
    }));
    function cap(s){ return s ? s[0].toUpperCase() + s.slice(1) : ''; }
    const suggestions = [];
    Object.entries(perRule).forEach(([rule, c]) => {
      if(!c.overrides) return;
      const rate = c.overrides / c.runs;
      if(rate > 0.4){
        suggestions.push({
          rule,
          severity: 'high',
          text: `“${rule}” has been overridden in ${(rate*100|0)}% of audits — consider relaxing the rule or lowering its weight.`
        });
      }
    });
    return { runs: hist.length, avgScore, overrideRate: totalVerdicts ? totalOverrides/totalVerdicts : 0, perRule, suggestions };
  }

  // ---------- Brand DNA ----------
  function addDnaReference(fingerprint, note){
    const r = activeVersion().rules;
    if(!r.dna) r.dna = { enabled:true, references:[] };
    r.dna.references.push({ when: nowIso(), note: note || '', fingerprint });
    saveStore(store);
  }
  function removeDnaReference(idx){
    const r = activeVersion().rules;
    r.dna.references.splice(idx, 1);
    saveStore(store);
  }
  function getDna(){
    const r = activeVersion().rules;
    if(!r.dna || !r.dna.references || !r.dna.references.length) return null;
    const refs = r.dna.references.map(x => x.fingerprint);
    // Average numeric fingerprint
    const avg = {
      avgSat: 0, variance: 0, logoDensity: 0, edgeDensity: 0, copyWords: 0,
      paletteShares: {},
    };
    refs.forEach(f => {
      avg.avgSat += f.avgSat || 0;
      avg.variance += f.variance || 0;
      avg.logoDensity += f.logoDensity || 0;
      avg.edgeDensity += f.edgeDensity || 0;
      avg.copyWords += f.copyWords || 0;
      (f.palette || []).forEach(p => {
        avg.paletteShares[p.hex] = (avg.paletteShares[p.hex] || 0) + p.share;
      });
    });
    const n = refs.length;
    ['avgSat','variance','logoDensity','edgeDensity','copyWords'].forEach(k => avg[k] /= n);
    Object.keys(avg.paletteShares).forEach(k => avg.paletteShares[k] /= n);
    avg.refs = n;
    return avg;
  }
  function compareToDna(fp){
    const dna = getDna();
    if(!dna) return null;
    const deltas = {
      avgSat:      Math.abs((fp.avgSat||0) - dna.avgSat),
      variance:    Math.abs((fp.variance||0) - dna.variance) / Math.max(1, dna.variance),
      logoDensity: Math.abs((fp.logoDensity||0) - dna.logoDensity),
      edgeDensity: Math.abs((fp.edgeDensity||0) - dna.edgeDensity),
    };
    // Palette overlap: sum of min(actualShare, dnaShare) → 0..1
    let overlap = 0;
    (fp.palette || []).forEach(p => {
      const dnaShare = dna.paletteShares[p.hex] || 0;
      overlap += Math.min(p.share, dnaShare);
    });
    // Convert deltas to score 0..100
    const palette = Math.max(0, Math.min(1, overlap));
    const sat     = Math.max(0, 1 - deltas.avgSat * 4);
    const varScr  = Math.max(0, 1 - deltas.variance);
    const edge    = Math.max(0, 1 - deltas.edgeDensity * 6);
    const score = Math.round((palette * 0.5 + sat * 0.2 + varScr * 0.15 + edge * 0.15) * 100);
    return { score, deltas, palette: Math.round(palette*100), sat: Math.round(sat*100), variance: Math.round(varScr*100), edge: Math.round(edge*100) };
  }

  // ---------- Rule relations: applied to the report at scoring time ----------
  function evalRelations(report){
    const r = activeVersion().rules;
    if(!r.quality.relations) return report;
    const fails = new Set();
    report.items.forEach(it => {
      const v = it.override?.to || it.verdict;
      const cat = (RULE_TO_CATEGORY[it.rule] || '').toLowerCase();
      if(cat && v === 'fail') fails.add(cat + '.fail');
      if(it.weak) fails.add(cat + '.weak');
    });
    let multipliers = { global:1, color:1, logo:1, layout:1, typography:1, voice:1, platform:1 };
    r.quality.relations.forEach(rel => {
      if(fails.has(rel.when)){
        const tgt = rel.then.split('.')[0];
        multipliers[tgt] = (multipliers[tgt] || 1) * (rel.factor || 1);
      }
    });
    report.relationMultipliers = multipliers;
    return report;
  }
  const RULE_TO_CATEGORY = {
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

  // ---------- Public API ----------
  const api = {
    listBrands(){ return Object.values(store.brands).map(b => ({id:b.id,name:b.name})); },
    activeBrand(){ return store.activeBrand; },
    setActiveBrand(id){ if(!store.brands[id]) return false; store.activeBrand = id; saveStore(store); return true; },
    createBrand(id, name){
      if(store.brands[id]) return false;
      const v = { id:'v1', label:'v1 — initial', createdAt: nowIso(), note:`Seeded for ${name}`, rules: QI_DEFAULTS() };
      store.brands[id] = { id, name, activeVersionId:v.id, versions:[v] };
      store.activeBrand = id; saveStore(store); return true;
    },
    renameBrand(id, name){ if(!store.brands[id]) return false; store.brands[id].name = name; saveStore(store); return true; },
    deleteBrand(id){
      if(Object.keys(store.brands).length <= 1) return false;
      delete store.brands[id];
      if(store.activeBrand === id) store.activeBrand = Object.keys(store.brands)[0];
      saveStore(store); return true;
    },
    currentRules(){ return clone(activeVersion().rules); },
    currentVersion(){
      const v = activeVersion();
      return { id:v.id, label:v.label, createdAt:v.createdAt, note:v.note };
    },
    listVersions(brandId){
      const b = brandId ? store.brands[brandId] : activeBrandObj();
      return b ? b.versions.map(v => ({ id:v.id, label:v.label, createdAt:v.createdAt, note:v.note, active:v.id===b.activeVersionId })) : [];
    },
    saveVersion(rules, note){
      const b = activeBrandObj();
      const idx = b.versions.length + 1;
      const v = { id:'v'+idx, label:'v'+idx + (note ? ' — ' + note.slice(0,40) : ''), createdAt: nowIso(), note: note || '', rules: clone(rules) };
      b.versions.push(v); b.activeVersionId = v.id; saveStore(store); return v.id;
    },
    updateActiveDraft(rules){
      const b = activeBrandObj();
      const v = b.versions.find(x => x.id === b.activeVersionId);
      v.rules = clone(rules); saveStore(store);
    },
    rollback(id){
      const b = activeBrandObj();
      if(!b.versions.find(v => v.id === id)) return false;
      b.activeVersionId = id; saveStore(store); return true;
    },
    deleteVersion(id){
      const b = activeBrandObj();
      if(b.versions.length <= 1) return false;
      if(b.activeVersionId === id) return false;
      b.versions = b.versions.filter(v => v.id !== id); saveStore(store); return true;
    },
    resetDefaults(){ localStorage.removeItem(STORE_KEY); store = loadStore(); saveStore(store); },
    subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); },

    recordAudit, clearLearning, getInsights,
    addDnaReference, removeDnaReference, getDna, compareToDna,
    approvedPalette, evalRelations,

    // helpers exposed for analyzer
    hexToRgb, rgbToHex, rgbToLab, deltaE, contrastRatio, relativeLuminance,

    DEFAULTS: QI_DEFAULTS,
    RULE_TO_CATEGORY,
  };

  global.BrandEngine = api;
})(window);
