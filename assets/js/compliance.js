// Qi Brand Center — Compliance Agent (Brand Brain edition)
// All thresholds, palette, fonts, weights, learning, relations and DNA come from
// window.BrandEngine. Heavy heuristics live here (color pressure, logo intelligence,
// layout rhythm, readability/hierarchy, semantic tone vector, platform safety, DNA match).
(function(){
  if(!document.getElementById('agent')) return;
  if(!window.BrandEngine){ console.error('BrandEngine not loaded'); return; }
  const E = window.BrandEngine;

  // -------------------- DOM --------------------
  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => Array.from(r.querySelectorAll(s));

  const dz = $('#ag-dropzone'), fileIn = $('#ag-file');
  const runBtn = $('#ag-run'), sampleBtn = $('#ag-sample'), rerun = $('#ag-rerun');
  const platform = $('#ag-platform'), cohort = $('#ag-cohort');
  const copyIn = $('#ag-copy'), legalIn = $('#ag-legal'), roleIn = $('#ag-role'), roleLbl = $('#ag-role-label');
  const empty = $('#ag-empty'), live = $('#ag-live'), frame = $('#ag-frame');
  const imgEl = $('#ag-img'), overlay = $('#ag-overlay');
  const scan = $('#ag-scan'), scanText = $('#ag-scan-text');
  const verdict = $('#ag-verdict');
  const ring = $('#ag-ring'), scoreEl = $('#ag-score');
  const headline = $('#ag-headline'), summary = $('#ag-summary');
  const palDiv = $('#ag-palette'), submit = $('#ag-submit');
  const versionPill = $('#ag-version-pill'), brandPill = $('#ag-brand-pill');
  const checklistEl = $('#ag-checklist');
  const logEl = $('#ag-log');
  const overridesC = $('#ag-overrides-count'), runsC = $('#ag-runs-count'), blockedC = $('#ag-blocked-count');
  const clearLogBtn = $('#ag-clear-log');
  const policyMinScore = $('#ag-policy-min'), policyLockConf = $('#ag-policy-lock'), policyRoleLabel = $('#ag-policy-role');
  const modal = $('#ag-modal'), modalTitle = $('#ag-modal-title'), modalText = $('#ag-modal-comment');
  const modalSave = $('#ag-modal-save'), modalCancel = $('#ag-modal-cancel'), modalClose = $('#ag-modal-close');
  // New brain UI
  const categoriesEl = $('#ag-categories');
  const pressureEl   = $('#ag-pressure');
  const styleEl      = $('#ag-style-match');
  const dnaTrainBtn  = $('#ag-dna-train');

  // -------------------- State --------------------
  let currentFile = null;
  let currentImage = null;
  let currentReport = null;
  let rules = E.currentRules();
  let ruleVersion = E.currentVersion();
  const toggles = { boxes:true, safe:true, palette:true };

  E.subscribe(r => {
    rules = r; ruleVersion = E.currentVersion();
    syncFromRules();
  });

  // -------------------- Storage / log --------------------
  const STORE_KEY = 'qi-compliance-log';
  const STAT_KEY  = 'qi-compliance-stats';
  const stats = JSON.parse(localStorage.getItem(STAT_KEY) || '{"runs":0,"blocked":0,"overrides":0}');
  const log   = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  function saveStats(){ localStorage.setItem(STAT_KEY, JSON.stringify(stats)); renderStats(); }
  function saveLog(){ localStorage.setItem(STORE_KEY, JSON.stringify(log)); renderLog(); }
  function renderStats(){
    overridesC.textContent = stats.overrides;
    runsC.textContent      = stats.runs;
    blockedC.textContent   = stats.blocked;
  }
  function renderLog(){
    logEl.innerHTML = '';
    log.slice(-20).reverse().forEach(row => {
      const el = document.createElement('div');
      el.className = 'log-row';
      el.innerHTML =
        `<div><div class="log-rule">${escape(row.rule)}</div>` +
        `<div class="log-from">AI ${row.from.toUpperCase()} → human ${row.to.toUpperCase()} · ${row.confidence}% · rules ${row.ruleVersion || 'v?'}</div></div>` +
        `<div class="log-comment">"${escape(row.comment || '')}"</div>` +
        `<div class="log-time">${row.when}</div>`;
      logEl.appendChild(el);
    });
  }
  function escape(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  renderStats(); renderLog();

  // -------------------- Sync UI from rules --------------------
  function syncFromRules(){
    if(platform){
      const prevSel = platform.value;
      platform.innerHTML = rules.platforms.map(p =>
        `<option value="${p.id}" data-w="${p.w}" data-h="${p.h}" data-safe="${p.safeInsetPct}">${escape(p.label)}</option>`
      ).join('');
      if(rules.platforms.find(p => p.id === prevSel)) platform.value = prevSel;
    }
    if(cohort){
      const prevSel = cohort.value;
      const items = [{id:'primary', label:'Primary — Yellow / Black', hex:''}].concat(
        rules.colors.secondary.map(s => ({id: slug(s.name), label: s.name + ' — ' + s.hex, hex: s.hex}))
      );
      cohort.innerHTML = items.map(c => `<option value="${c.id}" data-hex="${c.hex}">${escape(c.label)}</option>`).join('');
      if(items.find(c => c.id === prevSel)) cohort.value = prevSel;
    }
    if(policyMinScore) policyMinScore.textContent = rules.quality.minScoreToSubmit + ' score';
    if(policyLockConf) policyLockConf.textContent = rules.quality.lockOnFailConfidence + '% confidence';
    if(policyRoleLabel) policyRoleLabel.textContent = rules.branding.reviewerRoleLabel;
    if(roleLbl) roleLbl.textContent = `I am ${rules.branding.reviewerRoleLabel} (unlock locked items)`;
    if(versionPill) versionPill.textContent = 'Rules ' + ruleVersion.id;
    if(brandPill) brandPill.textContent = currentBrandName();
    if(currentReport){
      currentReport = recomputeReport(currentReport);
      renderReport(currentReport);
    } else {
      renderChecklist(idleReport());
      renderCategories(null);
      renderColorPressure(null);
      renderStyleMatch(null);
    }
  }
  function currentBrandName(){
    const id = E.activeBrand();
    return (E.listBrands().find(b => b.id === id) || {name:id}).name;
  }
  function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

  // -------------------- Upload --------------------
  ['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', e => { if(e.dataTransfer.files.length) acceptFile(e.dataTransfer.files[0]); });
  fileIn.addEventListener('change', e => { if(e.target.files.length) acceptFile(e.target.files[0]); });
  dz.addEventListener('click', e => { if(e.target.tagName !== 'INPUT'){ fileIn.click(); } });

  sampleBtn.addEventListener('click', () => {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
    const x = c.getContext('2d');
    const yellow = pickPrimary(/yellow/i, '#F2CD00');
    const black  = pickPrimary(/black/i,  '#0A0A0A');
    x.fillStyle = yellow; x.fillRect(0,0,c.width,c.height);
    x.fillStyle = black;  x.fillRect(0, 980, c.width, 370);
    x.fillStyle = '#fff'; x.font = '700 96px "Inter Tight", system-ui, sans-serif';
    x.fillText('Easy mobile', 80, 1100);
    x.fillText('banking for all.', 80, 1210);
    x.fillStyle = '#E11D48'; x.beginPath(); x.arc(900, 220, 110, 0, Math.PI*2); x.fill();
    x.fillStyle = '#fff'; x.font = '700 28px "Inter Tight", system-ui, sans-serif';
    x.fillText('SAVE 30%', 820, 230);
    x.fillStyle = black; x.beginPath(); x.arc(140, 160, 64, 0, Math.PI*2); x.fill();
    x.fillStyle = yellow; x.font = '700 64px "Inter Tight", system-ui, sans-serif';
    x.fillText('Qi', 110, 182);
    c.toBlob(blob => {
      const f = new File([blob], 'qi-sample.png', {type:'image/png'});
      copyIn.value = copyIn.value || 'Easy mobile banking for all.';
      legalIn.value = legalIn.value || 'Terms apply. Qi is licensed by CBI.';
      acceptFile(f);
    }, 'image/png');
  });
  function pickPrimary(re, fallback){
    const p = (rules.colors.primary || []).find(c => re.test(c.name) || re.test(c.hex));
    return p ? p.hex : fallback;
  }

  function acceptFile(file){
    if(!file) return;
    if(file.size > 25*1024*1024){ alert('File too large — max 25 MB.'); return; }
    currentFile = file;
    const url = URL.createObjectURL(file);
    if(file.type.startsWith('video/')){
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.src = url;
      v.addEventListener('loadeddata', () => {
        v.currentTime = 0.05;
        v.addEventListener('seeked', () => {
          const c = document.createElement('canvas');
          c.width = v.videoWidth; c.height = v.videoHeight;
          c.getContext('2d').drawImage(v, 0, 0);
          c.toBlob(blob => loadImage(URL.createObjectURL(blob)), 'image/png');
        }, {once:true});
      }, {once:true});
    } else loadImage(url);
    $('.dz-title', dz).textContent = file.name;
    $('.dz-sub', dz).innerHTML = `${(file.size/1024/1024).toFixed(2)} MB · <span class="link">change file</span>`;
    runBtn.disabled = false;
    if(dnaTrainBtn) dnaTrainBtn.hidden = false;
  }

  function loadImage(url){
    const im = new Image();
    im.onload = () => {
      currentImage = im;
      imgEl.src = url;
      empty.hidden = true; live.hidden = false;
      renderChecklist(idleReport());
      verdict.hidden = false;
      headline.textContent = 'Ready to audit';
      summary.textContent = `Press “Run brand audit” — the brain will analyse using rules ${ruleVersion.id}.`;
    };
    im.src = url;
  }

  // -------------------- Run --------------------
  runBtn.addEventListener('click', runAudit);
  rerun.addEventListener('click', runAudit);
  if(dnaTrainBtn) dnaTrainBtn.addEventListener('click', async () => {
    if(!currentImage){ showToast('Upload a design first'); return; }
    const fp = await fingerprint();
    E.addDnaReference(fp, currentFile?.name || 'reference');
    showToast('Added to Brand DNA training set ✓');
    if(currentReport){ currentReport.styleMatch = E.compareToDna(fp); renderReport(currentReport); }
  });

  async function runAudit(){
    if(!currentImage) return;
    rules = E.currentRules(); ruleVersion = E.currentVersion();
    scan.hidden = false; runBtn.disabled = true; rerun.hidden = true;
    const stages = [
      'Detecting brandmark…','Sampling palette…','Measuring color pressure…',
      'Scoring layout rhythm…','Reading typography…','Classifying tone vector…',
      'Verifying disclaimers…','Checking platform safety…','Comparing to brand DNA…'
    ];
    let s = 0; scanText.textContent = stages[0];
    const stageT = setInterval(() => { s = (s+1) % stages.length; scanText.textContent = stages[s]; }, 220);

    const t0 = performance.now();
    const report = await analyse();
    const elapsed = performance.now() - t0;
    if(elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
    clearInterval(stageT); scan.hidden = true;
    currentReport = report;
    renderReport(report);
    drawOverlays(report);
    runBtn.disabled = false; rerun.hidden = false;

    stats.runs += 1;
    if(report.score < rules.quality.minScoreToSubmit) stats.blocked += 1;
    saveStats();

    // Feed the engine for learning
    E.recordAudit(report);
  }

  // -------------------- Pixel pipeline (shared) --------------------
  async function readPixels(){
    const img = currentImage;
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = document.createElement('canvas');
    const SAMPLE = 220;
    const r = Math.min(SAMPLE/w, SAMPLE/h, 1);
    c.width = Math.max(1, Math.round(w*r));
    c.height = Math.max(1, Math.round(h*r));
    const ctx = c.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return { ctx, data: ctx.getImageData(0,0,c.width,c.height).data, w: c.width, h: c.height, fullW: w, fullH: h };
  }

  // -------------------- Fingerprint (used for DNA + analysis) --------------------
  async function fingerprint(){
    const px = await readPixels();
    const palette = dominantPalette(px);
    const sat = avgSaturation(px.data);
    const variance = colorVariance(px.data);
    const edge = edgeDensity(px);
    const yellow = E.hexToRgb(pickPrimary(/yellow/i, '#F2CD00'));
    const black  = E.hexToRgb(pickPrimary(/black/i,  '#0A0A0A'));
    const logoD = logoDensity(px, yellow, black);
    return {
      palette: palette.slice(0,6).map(p => ({hex: p.hex, share: +p.share.toFixed(3)})),
      avgSat: +sat.toFixed(3),
      variance: +variance.toFixed(0),
      logoDensity: +logoD.toFixed(4),
      edgeDensity: +edge.toFixed(3),
      copyWords: ((copyIn.value||'').trim().split(/\s+/).filter(Boolean).length),
    };
  }

  // -------------------- Analysis pipeline --------------------
  async function analyse(){
    const px = await readPixels();
    const { data, w, h, fullW, fullH } = px;
    const allowed = E.approvedPalette();
    // Active cohort lookup
    const cohortHex = (cohort.selectedOptions[0]?.dataset.hex || '').toUpperCase();
    const cohortMatch = (rules.colors.secondary || []).find(s => s.hex.toUpperCase() === cohortHex);
    const palette = dominantPalette(px);
    const onBrandPalette = palette.slice(0, 6).map(d => {
      const m = nearestApproved(d.rgb, allowed);
      return { ...d, brand: m.dE < rules.colors.tolerance, dE: m.dE, match: m.match };
    });
    const onBrandShare = onBrandPalette.filter(p => p.brand).reduce((a,b)=>a+b.share, 0);
    const offBrand = onBrandPalette.filter(p => !p.brand);

    const yellow = E.hexToRgb(pickPrimary(/yellow/i, '#F2CD00'));
    const black  = E.hexToRgb(pickPrimary(/black/i,  '#0A0A0A'));

    // ---- 1. LOGO INTELLIGENCE ----
    const logoMetrics = analyseLogo(px, yellow, black);
    let logoVerdict, logoConf, logoEvidence, logoFix, logoWeak = false;
    if(logoMetrics.density < rules.logo.detectionDensityMin){
      logoVerdict = 'review'; logoConf = 64;
      logoEvidence = 'No brandmark detected in any allowed zone.';
      const zNames = (rules.logo.zones || []).map(z => z.name).join(' or ') || 'an allowed zone';
      logoFix = `Place the logo in ${zNames} with full clearspace (${rules.logo.clearspaceRatio}×).`;
    } else {
      const inZone = logoMetrics.inAllowedZone;
      const prom = logoMetrics.prominence;
      const vis  = logoMetrics.visibility;
      const bal  = logoMetrics.balance;
      const passT = rules.logo.clearspacePassPct / 100;
      const clearOk = logoMetrics.clearspace >= passT;
      const promOk  = prom >= rules.logo.minProminencePct;
      const visOk   = vis >= rules.logo.minContrastRatio;
      if(inZone && clearOk && promOk && visOk){
        logoVerdict = 'pass';
        logoConf = clamp(74 + (prom-rules.logo.minProminencePct)*4 + (vis-rules.logo.minContrastRatio)*2, 70, 96);
        logoEvidence = `Logo present in “${logoMetrics.zoneName}”, prominence ${prom.toFixed(1)}% of canvas, contrast ${vis.toFixed(1)}:1, visual balance ${bal}/100.`;
        logoFix = '';
        if(logoConf < rules.logo.weakConfidenceCap) { logoWeak = true; }
      } else if(!inZone){
        logoVerdict = 'fail'; logoConf = 88;
        logoEvidence = `Logo detected outside the allowed zones — sits at (${(logoMetrics.cx*100|0)}%, ${(logoMetrics.cy*100|0)}%).`;
        logoFix = `Move the logo into a defined zone in admin → Logo rules.`;
      } else if(!clearOk){
        logoVerdict = 'fail'; logoConf = clamp(80 + (1-logoMetrics.clearspace)*15, 78, 96);
        logoEvidence = `Clearspace ${(logoMetrics.clearspace*100|0)}% — below the ${rules.logo.clearspacePassPct}% threshold.`;
        logoFix = `Push surrounding content out by at least ${rules.logo.clearspaceRatio}× the mark height.`;
      } else if(!promOk){
        logoVerdict = 'fail'; logoConf = 86; logoWeak = true;
        logoEvidence = `Logo is present but weak — only ${prom.toFixed(2)}% of the canvas (rule: ≥${rules.logo.minProminencePct}%).`;
        logoFix = `Increase logo size to at least ${rules.logo.minProminencePct}% of canvas area.`;
      } else if(!visOk){
        logoVerdict = 'fail'; logoConf = 84; logoWeak = true;
        logoEvidence = `Logo contrast against background is ${vis.toFixed(1)}:1 — below the ${rules.logo.minContrastRatio}:1 minimum.`;
        logoFix = `Move the logo onto a background that gives ≥ ${rules.logo.minContrastRatio}:1 contrast.`;
      } else {
        logoVerdict = 'review'; logoConf = 70;
        logoEvidence = 'Logo is technically present but visual balance is off-centre.';
        logoFix = 'Re-balance — try mirroring or moving the logo to the opposite quadrant.';
      }
    }
    const logoSubs = [
      { label:'Prominence',  value: Math.round(Math.min(100, (logoMetrics.prominence / Math.max(0.1, rules.logo.minProminencePct)) * 70)) },
      { label:'Visibility',  value: Math.round(Math.min(100, (logoMetrics.visibility / Math.max(0.1, rules.logo.minContrastRatio)) * 70)) },
      { label:'Balance',     value: logoMetrics.balance },
      { label:'Clearspace',  value: Math.round(logoMetrics.clearspace * 100) },
    ];

    // ---- 2. SMART COLOR + USAGE + PRESSURE ----
    const colorMetrics = analyseColors(px, allowed, onBrandPalette);
    let colVerdict, colConf, colEvidence, colFix;
    const passT = rules.colors.onBrandSharePassPct / 100;
    const reviewT = rules.colors.onBrandShareReviewPct / 100;
    const usagePrimaryShare = colorMetrics.primaryShare;
    const usagePrimaryMin = (rules.colors.usage?.primaryMinPct || 0) / 100;
    const usageOk = usagePrimaryShare >= usagePrimaryMin;
    const forbiddenHit = colorMetrics.forbiddenHit;

    if(forbiddenHit){
      colVerdict = 'fail'; colConf = 92;
      colEvidence = `Forbidden combination detected: ${forbiddenHit.a} + ${forbiddenHit.b} (${(forbiddenHit.share*100|0)}% of canvas, max ${forbiddenHit.max}%). ${forbiddenHit.note || ''}`;
      colFix = `Remove one of the colors or reduce its share below ${forbiddenHit.max}%.`;
    } else if(!usageOk){
      colVerdict = 'fail'; colConf = 88;
      colEvidence = `Primary palette covers only ${(usagePrimaryShare*100|0)}% — below the ${(usagePrimaryMin*100|0)}% minimum usage rule.`;
      colFix = `Increase the share of primary swatches (${(rules.colors.primary||[]).map(p=>p.hex).join(', ')}).`;
    } else if(onBrandShare > passT){
      colVerdict = 'pass'; colConf = clamp(70 + onBrandShare*25, 70, 97);
      colEvidence = `${(onBrandShare*100|0)}% of the canvas uses approved colors (rule: ≥${rules.colors.onBrandSharePassPct}%). Primary share: ${(usagePrimaryShare*100|0)}%.`;
      colFix = '';
    } else if(onBrandShare > reviewT){
      colVerdict = 'review'; colConf = 62 + Math.round(onBrandShare*20);
      colEvidence = `${(onBrandShare*100|0)}% on-palette. Off-brand: ${offBrand.slice(0,2).map(p=>p.hex).join(', ')}.`;
      colFix = 'Swap the off-brand swatches to the closest approved Qi color.';
    } else {
      colVerdict = 'fail'; colConf = clamp(86 + (1-onBrandShare)*10, 86, 98);
      colEvidence = `Only ${(onBrandShare*100|0)}% matches the palette. Off-brand: ${offBrand.slice(0,3).map(p=>p.hex).join(', ')}.`;
      colFix = `Replace off-brand colors with ${(rules.colors.primary||[]).map(p=>p.hex).join(' / ')}.`;
    }
    const colorSubs = [
      { label:'Coverage',      value: Math.round(onBrandShare*100) },
      { label:'Primary share', value: Math.round(usagePrimaryShare*100) },
      { label:'Pressure',      value: 100 - Math.round(colorMetrics.pressure * 100) },
    ];

    // ---- 3. ADAPTIVE LAYOUT ----
    const layoutMetrics = analyseLayout(px);
    let layVerdict, layConf, layEvidence, layFix;
    const layoutScore = Math.round((layoutMetrics.alignment * 0.55 + layoutMetrics.rhythm * 0.45));
    if(layoutScore >= 75){
      layVerdict = 'pass'; layConf = clamp(74 + (layoutScore-75)/2, 72, 95);
      layEvidence = `Layout score ${layoutScore}/100 — strong alignment & visual rhythm.`;
      layFix = '';
    } else if(layoutScore >= 55){
      layVerdict = 'review'; layConf = 70;
      layEvidence = `Layout score ${layoutScore}/100 — alignment ${layoutMetrics.alignment}, rhythm ${layoutMetrics.rhythm}. Some clusters drift.`;
      layFix = `Snap edges to the ${rules.grid.unit}pt baseline; even out vertical gaps.`;
    } else {
      layVerdict = 'fail'; layConf = 84;
      layEvidence = `Layout score ${layoutScore}/100 — broken alignment (${layoutMetrics.alignment}) and uneven spacing (${layoutMetrics.rhythm}).`;
      layFix = `Re-snap content to the ${rules.grid.columns}-column grid; tighten or distribute gaps.`;
    }
    const layoutSubs = [
      { label:'Alignment', value: layoutMetrics.alignment },
      { label:'Rhythm',    value: layoutMetrics.rhythm },
      { label:'Layout score', value: layoutScore },
    ];

    // ---- 4. TYPOGRAPHY INTELLIGENCE (readability + hierarchy) ----
    const copy = (copyIn.value || '').trim();
    const typoMetrics = analyseTypography(copy);
    let typVerdict, typConf, typEvidence, typFix;
    const fontList = (rules.typography.fonts || []).join(' / ');
    if(!copy){
      typVerdict = 'review'; typConf = 60;
      typEvidence = 'No on-design copy provided to the brain — type cannot be evaluated.';
      typFix = `Paste the headline so the brain can audit it against ${fontList}.`;
    } else {
      const readOk  = typoMetrics.readability >= rules.typography.readabilityFloor;
      const hierOk  = typoMetrics.hierarchy   >= rules.typography.hierarchyFloor;
      const allCapsBad = typoMetrics.allCaps && rules.typography.forbidAllCapsHeadlines;
      if(allCapsBad){
        typVerdict = 'fail'; typConf = 88;
        typEvidence = 'Long all-caps copy detected — brand rules forbid all-caps headlines.';
        typFix = 'Rewrite in sentence case.';
      } else if(typoMetrics.words > rules.typography.maxHeadlineWords){
        typVerdict = 'fail'; typConf = 84;
        typEvidence = `Headline is ${typoMetrics.words} words — exceeds the ${rules.typography.maxHeadlineWords}-word maximum (readability ${typoMetrics.readability}/100, hierarchy ${typoMetrics.hierarchy}/100).`;
        typFix = `Trim to ≤ ${rules.typography.preferredHeadlineWords} words.`;
      } else if(!readOk || !hierOk){
        typVerdict = 'review'; typConf = 70;
        typEvidence = `Readability ${typoMetrics.readability}/100, hierarchy ${typoMetrics.hierarchy}/100 — below floors (${rules.typography.readabilityFloor}/${rules.typography.hierarchyFloor}).`;
        typFix = readOk ? 'Add a subhead / supporting line for stronger hierarchy.' : 'Shorter words and shorter sentences.';
      } else {
        typVerdict = 'pass'; typConf = clamp(78 + (typoMetrics.readability-60)/2, 76, 96);
        typEvidence = `${typoMetrics.words} words · readability ${typoMetrics.readability}/100 · hierarchy ${typoMetrics.hierarchy}/100 · aligns with ${fontList}.`;
        typFix = '';
      }
    }
    const typoSubs = [
      { label:'Readability', value: typoMetrics.readability },
      { label:'Hierarchy',   value: typoMetrics.hierarchy },
      { label:'Length',      value: typoMetrics.words ? Math.round(Math.min(100, 100 - Math.max(0, typoMetrics.words - rules.typography.preferredHeadlineWords) * 8)) : 0 },
    ];

    // ---- 5. SEMANTIC TONE VECTOR + REWRITE ----
    const toneMetrics = analyseTone(copy);
    let voVerdict, voConf, voEvidence, voFix;
    if(!copy){
      voVerdict = 'review'; voConf = 55;
      voEvidence = 'No copy supplied — tone cannot be evaluated.';
      voFix = 'Add the on-design copy in the brief.';
    } else {
      const matchPct = toneMetrics.matchPct;
      const passT = rules.voice.toneMatchPassPct || 65;
      if(matchPct >= passT && !toneMetrics.dominantBad){
        voVerdict = 'pass'; voConf = clamp(76 + (matchPct - passT)/2, 74, 96);
        voEvidence = `Tone match ${matchPct}% with brand vector. Detected: ${toneMetrics.label}.`;
        voFix = '';
      } else if(matchPct >= passT - 15){
        voVerdict = 'review'; voConf = 70;
        voEvidence = `Tone match ${matchPct}% — close to brand (${toneMetrics.label}) but the agent is unsure.`;
        voFix = toneMetrics.suggestion || 'Lean closer to: ' + (rules.voice.tone || 'brand voice');
      } else {
        voVerdict = 'fail'; voConf = 86;
        voEvidence = `Tone match only ${matchPct}% — detected as ${toneMetrics.label}, not "${rules.voice.tone || 'brand voice'}".`;
        voFix = toneMetrics.suggestion || 'Rewrite in everyday Qi voice — clear, confident, warm.';
      }
    }
    const toneSubs = [
      { label:'Match',     value: toneMetrics.matchPct || 0 },
      { label:'Friendly',  value: toneMetrics.vector ? Math.round(toneMetrics.vector.friendly*100) : 0 },
      { label:'Salesy',    value: toneMetrics.vector ? Math.round(toneMetrics.vector.salesy*100) : 0 },
      { label:'Aggressive',value: toneMetrics.vector ? Math.round(toneMetrics.vector.aggressive*100) : 0 },
    ];

    // ---- 6. IMAGERY (kept simple — heuristic class) ----
    const variance = colorVariance(data);
    const sat = avgSaturation(data);
    let imVerdict, imConf, imEvidence;
    if(sat < 0.18 && variance > 6000){ imVerdict='review'; imConf=70; imEvidence='Low-saturation editorial — confirm it matches brand direction.'; }
    else if(sat > 0.35 && variance < 4500){ imVerdict='pass'; imConf=82; imEvidence='Bold, high-saturation flat composition — on-brand.'; }
    else { imVerdict='pass'; imConf=76; imEvidence='Imagery falls within brand visual band.'; }

    // ---- 7. LEGAL ----
    const legalText = (legalIn.value || '').trim();
    let lgVerdict, lgConf, lgEvidence, lgFix;
    if(!legalText){
      if(rules.legal.requireDisclaimer){
        lgVerdict='fail'; lgConf=90;
        lgEvidence='Required disclaimer missing — brand rules mandate a disclaimer for all assets.';
        lgFix='Add the regulator / T&C disclaimer in the brief, then ensure it is rendered on-design.';
      } else { lgVerdict='review'; lgConf=60; lgEvidence='No disclaimer supplied — manual review needed.'; lgFix='Confirm whether this asset needs a disclaimer.'; }
    } else {
      const inCopy = (copy||'').toLowerCase().includes(legalText.toLowerCase().slice(0, rules.legal.maxHeadlineCharsForDisclaimer));
      lgVerdict = inCopy ? 'review' : 'pass';
      lgConf   = inCopy ? 70 : 86;
      lgEvidence = inCopy ? 'Disclaimer detected inside the headline — usually belongs in fine print.' : 'Disclaimer documented and assumed rendered in the legal footer.';
      lgFix = inCopy ? 'Move the disclaimer to a 10–12pt footer area.' : '';
    }

    // ---- 8. RESOLUTION ----
    const platSpec = rules.platforms.find(p => p.id === platform.value) || rules.platforms[0];
    const dpiTarget = platSpec.w;
    const ratio = fullW / dpiTarget;
    const fileMB = currentFile ? currentFile.size/1024/1024 : 0;
    const bppRaw = currentFile ? (currentFile.size*8)/(fullW*fullH) : 0;
    let rsVerdict, rsConf, rsEvidence, rsFix;
    if(ratio >= 0.98){
      if(bppRaw && bppRaw < rules.quality.compressionMinBpp && fileMB > 0){
        rsVerdict='review'; rsConf=74;
        rsEvidence=`Resolution fine (${fullW}×${fullH}) but compression heavy (${bppRaw.toFixed(2)} bpp).`;
        rsFix='Re-export at higher quality.';
      } else {
        rsVerdict='pass'; rsConf=clamp(82+Math.min(ratio,2)*4, 82, 96);
        rsEvidence=`Source ${fullW}×${fullH} — meets the ${dpiTarget}px target.`;
        rsFix='';
      }
    } else {
      rsVerdict='fail'; rsConf=clamp(86+(1-ratio)*10, 84, 96);
      rsEvidence=`Source only ${fullW}×${fullH} — under the ${dpiTarget}px minimum.`;
      rsFix=`Re-export at ≥ ${dpiTarget}px on the long edge.`;
    }

    // ---- 9. PLATFORM SAFETY (smart UI overlay) ----
    const platMetrics = analysePlatformSafety(px, platSpec);
    const safeInset = (platSpec.safeInsetPct || 8) / 100;
    let saVerdict, saConf, saEvidence, saFix;
    const targetAR = platSpec.w / platSpec.h;
    const actualAR = fullW / fullH;
    const arDelta = Math.abs(actualAR - targetAR) / targetAR;
    if(arDelta > 0.07){
      saVerdict='fail'; saConf=clamp(88+arDelta*10, 86, 97);
      saEvidence=`Aspect ratio ${actualAR.toFixed(2)} doesn't match the platform's ${targetAR.toFixed(2)}.`;
      saFix=`Re-export at exactly ${platSpec.w}×${platSpec.h}px or its multiples.`;
    } else if(platMetrics.uiCollision > 0.20){
      saVerdict='fail'; saConf=86;
      saEvidence=`Content collides with platform UI (${(platMetrics.uiCollision*100|0)}% of UI zone hidden) — “${platMetrics.collidingZone}”.`;
      saFix=`Move key copy outside the UI overlay zones for ${platSpec.label}.`;
    } else if(platMetrics.cornerLoad < 0.0035){
      saVerdict='review'; saConf=70;
      saEvidence=`Aspect ratio matches but content sits close to corners (rule: ${platSpec.safeInsetPct}% safe inset).`;
      saFix=`Pull key copy ${platSpec.safeInsetPct}% inside the safe area.`;
    } else {
      saVerdict='pass'; saConf=88;
      saEvidence=`AR matches; safe ${platSpec.safeInsetPct}% respected; UI overlay safety ${platMetrics.platformSafetyScore}/100.`;
      saFix='';
    }
    const platformSubs = [
      { label:'Safe area', value: Math.round((1 - platMetrics.cornerLoadNorm)*100) },
      { label:'UI safety', value: platMetrics.platformSafetyScore },
      { label:'AR delta',  value: Math.round(Math.max(0, 1-arDelta*8)*100) },
    ];

    // ---- Build items + boxes ----
    const items = [
      pack(1,'Logo & clear-space', logoVerdict, logoConf, logoEvidence, logoFix,
        boxFromZones(rules.logo.zones).concat([{ kind:'logo', x: logoMetrics.bbox.x, y: logoMetrics.bbox.y, w: logoMetrics.bbox.w, h: logoMetrics.bbox.h, label:'Logo' }]),
        logoSubs, { weak: logoWeak }),
      pack(2,'Color palette', colVerdict, colConf, colEvidence, colFix, [], colorSubs),
      pack(3,'Layout & rhythm', layVerdict, layConf, layEvidence, layFix, layoutMetrics.brokenBoxes, layoutSubs),
      pack(4,'Typography', typVerdict, typConf, typEvidence, typFix, [], typoSubs),
      pack(5,'Tone of voice', voVerdict, voConf, voEvidence, voFix, [], toneSubs, { suggestion: toneMetrics.suggestion, vector: toneMetrics.vector, label: toneMetrics.label }),
      pack(6,'Imagery style', imVerdict, imConf, imEvidence, '', [], []),
      pack(7,'Legal compliance', lgVerdict, lgConf, lgEvidence, lgFix, [], []),
      pack(8,'Resolution & quality', rsVerdict, rsConf, rsEvidence, rsFix, [], []),
      pack(9,'Platform & safe area', saVerdict, saConf, saEvidence, saFix,
        [{ kind:'safe', x:safeInset, y:safeInset, w:1-safeInset*2, h:1-safeInset*2, label:`Safe area (${platSpec.safeInsetPct}%)` }]
        .concat((platSpec.uiZones || []).map(z => ({ kind:'ui', x:z.x, y:z.y, w:z.w, h:z.h, label:`UI: ${z.name}` }))),
        platformSubs),
    ];
    if(colVerdict !== 'pass' && offBrand.length){
      offBrand.slice(0,3).forEach((p, k) => {
        items[1].boxes.push({ kind:'color', x:0.55+(k*0.05), y:0.10+(k*0.18), w:0.18, h:0.18, label:`Off-brand ${p.hex}`, color:p.hex });
      });
    }

    // ---- Categories + weighted score ----
    const categoriesScore = computeCategoryScores(items);
    let report = {
      score: 0,
      items, palette: onBrandPalette,
      categories: categoriesScore,
      colorPressure: colorMetrics.pressure,
      ruleVersion: ruleVersion.id,
      brandId: E.activeBrand(),
      meta: { w: fullW, h: fullH, fileMB, platformLabel: platSpec.label }
    };
    // Brand DNA comparison (if trained)
    const fp = {
      palette: onBrandPalette.slice(0,6).map(p => ({hex: p.hex, share: +p.share.toFixed(3)})),
      avgSat: +sat.toFixed(3),
      variance: +variance.toFixed(0),
      logoDensity: logoMetrics.density,
      edgeDensity: edgeDensity(px),
      copyWords: typoMetrics.words || 0,
    };
    report.fingerprint = fp;
    report.styleMatch = E.compareToDna(fp); // null if no references

    report = E.evalRelations(report);
    report.score = computeWeightedScore(report);
    return report;
  }

  function pack(num, rule, verdict, confidence, evidence, fix, boxes, subScores, extra){
    return Object.assign({ num, rule, verdict, confidence:Math.round(confidence), evidence, fix, boxes, subScores: subScores||[], override:null }, extra || {});
  }

  function idleReport(){
    const labels = ['Logo & clear-space','Color palette','Layout & rhythm','Typography','Tone of voice','Imagery style','Legal compliance','Resolution & quality','Platform & safe area'];
    return {
      score: 0,
      items: labels.map((l,i) => ({num:i+1, rule:l, verdict:'idle', confidence:0, evidence:'Awaiting analysis…', fix:'', boxes:[], subScores:[]})),
      palette: [], categories: null, colorPressure: 0, styleMatch: null,
      ruleVersion: ruleVersion.id, meta:{}
    };
  }

  function recomputeReport(report){
    report.categories = computeCategoryScores(report.items);
    report.score = computeWeightedScore(E.evalRelations(report));
    report.ruleVersion = ruleVersion.id;
    return report;
  }

  function computeCategoryScores(items){
    // Map rule → category, then average of sub-score "primary" (or verdict→pass=100, review=60, fail=20)
    const verdictScore = v => v === 'pass' ? 100 : v === 'review' ? 60 : v === 'fail' ? 20 : 0;
    const catBuckets = {};
    items.forEach(it => {
      const cat = E.RULE_TO_CATEGORY[it.rule];
      if(!cat) return;
      const v = it.override?.to || it.verdict;
      const base = verdictScore(v);
      // For brain categories with sub-scores, blend the sub-score average in:
      const subAvg = (it.subScores && it.subScores.length)
        ? it.subScores.reduce((a,b)=>a+(b.value||0),0) / it.subScores.length
        : base;
      const blended = Math.round(base * 0.6 + subAvg * 0.4);
      catBuckets[cat] = catBuckets[cat] || { sum:0, n:0, items:[] };
      catBuckets[cat].sum += blended;
      catBuckets[cat].n += 1;
      catBuckets[cat].items.push(it.rule);
    });
    const out = {};
    Object.entries(catBuckets).forEach(([k,v]) => {
      out[k] = { score: Math.round(v.sum / v.n), items: v.items };
    });
    return out;
  }
  function computeWeightedScore(report){
    const weights = rules.quality.weights || {};
    const m = report.relationMultipliers || {};
    let totalW = 0, totalScore = 0;
    Object.entries(weights).forEach(([k, w]) => {
      const cat = report.categories?.[k];
      if(!cat) return;
      // Apply category-specific multiplier (severity > 1 means deeper penalty for misses → reduce raw score)
      const raw = cat.score;
      const mult = (m[k] || 1) * (m.global || 1);
      const adjusted = mult > 1 ? (raw - (100 - raw) * (mult - 1)) : raw;
      totalScore += Math.max(0, adjusted) * w;
      totalW += w;
    });
    if(!totalW) return 0;
    let score = Math.round(totalScore / totalW);
    // DNA penalty if style match is bad while rules pass
    if(report.styleMatch && report.styleMatch.score < (rules.quality.styleMatchFloor || 0)){
      score = Math.round(score * 0.95);
    }
    return Math.max(0, Math.min(100, score));
  }

  // -------------------- Heuristic analyzers --------------------
  function dominantPalette({data, w, h}){
    const bins = new Map();
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const i = (y*w+x)*4;
        if(data[i+3] < 20) continue;
        const r = data[i], g = data[i+1], b = data[i+2];
        const key = ((r>>3)<<10) | ((g>>3)<<5) | (b>>3);
        bins.set(key, (bins.get(key)||0)+1);
      }
    }
    const total = w*h;
    return Array.from(bins.entries()).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([key,count]) => {
      const r = ((key>>10)&31)<<3, g = ((key>>5)&31)<<3, b = (key&31)<<3;
      return { rgb:[r,g,b], hex: E.rgbToHex(r,g,b), share: count/total };
    });
  }
  function nearestApproved(rgb, paletteLab){
    const lab = E.rgbToLab(rgb);
    let best = null, bestD = Infinity;
    paletteLab.forEach(p => {
      const dE = Math.hypot(lab[0]-p.lab[0], lab[1]-p.lab[1], lab[2]-p.lab[2]);
      if(dE < bestD){ bestD = dE; best = p; }
    });
    return { match:best, dE:bestD };
  }
  function colorVariance(data){
    let r=0,g=0,b=0,n=0;
    for(let i=0;i<data.length;i+=4){ r+=data[i]; g+=data[i+1]; b+=data[i+2]; n++; }
    r/=n; g/=n; b/=n;
    let v=0;
    for(let i=0;i<data.length;i+=4){
      v += (data[i]-r)**2 + (data[i+1]-g)**2 + (data[i+2]-b)**2;
    }
    return v/n;
  }
  function avgSaturation(data){
    let s=0,n=0;
    for(let i=0;i<data.length;i+=4){
      const r=data[i]/255, g=data[i+1]/255, b=data[i+2]/255;
      const max=Math.max(r,g,b), min=Math.min(r,g,b);
      s += max === 0 ? 0 : (max-min)/max;
      n++;
    }
    return s/n;
  }
  function close(r,g,b,[R,G,B], tol){ return Math.abs(r-R)<tol && Math.abs(g-G)<tol && Math.abs(b-B)<tol; }

  // ---- Color analysis (usage, pressure, forbidden combos) ----
  function analyseColors(px, allowed, palette){
    const primaries = (rules.colors.primary || []).map(p => ({...p, rgb: E.hexToRgb(p.hex)}));
    let primaryShare = 0;
    palette.forEach(p => {
      // is this dominant near a primary?
      const m = nearestApproved(p.rgb, primaries.map(q => ({lab: E.rgbToLab(q.rgb)})));
      if(m.dE < rules.colors.tolerance) primaryShare += p.share;
    });
    // Pressure: distance from each primary's idealShare → 0 (perfect) … 1 (very off)
    let pressure = 0;
    primaries.forEach(p => {
      const ideal = (p.idealSharePct || 0) / 100;
      // sum the canvas share matched to this exact primary
      let actual = 0;
      palette.forEach(d => {
        const dE = Math.hypot.apply(null, E.rgbToLab(d.rgb).map((v,i) => v - E.rgbToLab(p.rgb)[i]));
        if(dE < rules.colors.tolerance) actual += d.share;
      });
      pressure += Math.abs(actual - ideal);
    });
    pressure = Math.min(1, pressure / 2);  // normalize
    // Forbidden combos
    let forbiddenHit = null;
    const combos = rules.colors.usage?.forbiddenCombos || [];
    combos.forEach(c => {
      const aShare = paletteShareOf(palette, c.a);
      const bShare = paletteShareOf(palette, c.b);
      const both = aShare + bShare;
      if(aShare > 0.03 && bShare > 0.03 && both * 100 > c.max){
        if(!forbiddenHit) forbiddenHit = { ...c, share: both };
      }
    });
    return { primaryShare, pressure, forbiddenHit };
  }
  function paletteShareOf(palette, hex){
    const target = E.rgbToLab(E.hexToRgb(hex));
    let s = 0;
    palette.forEach(p => {
      const lab = E.rgbToLab(p.rgb);
      if(Math.hypot(lab[0]-target[0], lab[1]-target[1], lab[2]-target[2]) < 18) s += p.share;
    });
    return s;
  }

  // ---- Logo intelligence ----
  function logoDensity(px, yellow, black){
    const { data, w, h } = px;
    let hits = 0, samples = 0;
    const tol = 50;
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        if(x > w*0.4) continue; // mostly look upper / left half for typical placement
        const i = (y*w+x)*4;
        if(close(data[i],data[i+1],data[i+2],yellow,tol) || close(data[i],data[i+1],data[i+2],black,tol)) hits++;
        samples++;
      }
    }
    return hits / Math.max(1, samples);
  }
  function analyseLogo(px, yellow, black){
    const { data, w, h } = px;
    const tol = 50;
    // Find logo blob: contiguous yellow+black pixels in any allowed zone (or anywhere)
    let count=0, sumX=0, sumY=0, minX=w, minY=h, maxX=0, maxY=0;
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const i = (y*w+x)*4;
        if(close(data[i],data[i+1],data[i+2],yellow,tol) || close(data[i],data[i+1],data[i+2],black,tol)){
          count++; sumX+=x; sumY+=y;
          if(x<minX) minX=x; if(y<minY) minY=y; if(x>maxX) maxX=x; if(y>maxY) maxY=y;
        }
      }
    }
    if(!count){
      return {
        density:0, prominence:0, visibility:0, balance:50, clearspace:1,
        cx:0.5, cy:0.5, bbox:{x:0,y:0,w:0,h:0}, inAllowedZone:false, zoneName:'',
      };
    }
    const cx = (sumX/count)/w, cy = (sumY/count)/h;
    const bbox = { x: minX/w, y: minY/h, w: (maxX-minX)/w, h: (maxY-minY)/h };
    const prominence = (bbox.w * bbox.h) * 100;  // % of canvas
    // Visibility: contrast between average logo color vs ring around it
    const ring = sampleRing(px, bbox);
    const innerAvg = sampleAverage(px, bbox.x*w, bbox.y*h, bbox.w*w, bbox.h*h);
    const visibility = E.contrastRatio(innerAvg, ring);
    // Balance: distance from canvas center, scaled (0 = perfectly centered, 100 = corner)
    // We invert and present: closeness to ideal axis (a great logo usually sits on a third)
    const dx = Math.abs(cx - 0.5), dy = Math.abs(cy - 0.5);
    const dist = Math.hypot(dx, dy);  // 0..0.7
    // Best balance when on a third: cx≈1/6 or 5/6 (left/right safe corner)
    const targetX = cx < 0.5 ? 1/6 : 5/6;
    const targetY = cy < 0.5 ? 1/6 : 5/6;
    const tDist = Math.hypot(cx - targetX, cy - targetY);
    const balance = Math.round(Math.max(0, Math.min(100, 100 - tDist * 180)));
    // Clearspace estimate
    const clearspace = estimateClearspace(px.data, w, h, yellow, black, tol);
    // Allowed zone hit?
    let inAllowedZone = false, zoneName = '';
    (rules.logo.zones || []).forEach(z => {
      if(cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h){
        inAllowedZone = true; zoneName = z.name;
      }
    });
    return { density: count / (w*h), prominence, visibility, balance, clearspace, cx, cy, bbox, inAllowedZone, zoneName };
  }
  function sampleRing(px, bbox){
    const { data, w, h } = px;
    const x0 = Math.max(0, Math.floor((bbox.x - bbox.w*0.3) * w));
    const y0 = Math.max(0, Math.floor((bbox.y - bbox.h*0.3) * h));
    const x1 = Math.min(w-1, Math.floor((bbox.x + bbox.w*1.3) * w));
    const y1 = Math.min(h-1, Math.floor((bbox.y + bbox.h*1.3) * h));
    let r=0, g=0, b=0, n=0;
    for(let y=y0; y<=y1; y++){
      for(let x=x0; x<=x1; x++){
        const inside = (x >= bbox.x*w && x <= (bbox.x+bbox.w)*w && y >= bbox.y*h && y <= (bbox.y+bbox.h)*h);
        if(inside) continue;
        const i = (y*w+x)*4;
        r += data[i]; g += data[i+1]; b += data[i+2]; n++;
      }
    }
    return n ? [r/n, g/n, b/n] : [128,128,128];
  }
  function sampleAverage(px, x0, y0, ww, hh){
    const { data, w, h } = px;
    let r=0, g=0, b=0, n=0;
    for(let y=Math.floor(y0); y<Math.min(h, y0+hh); y++){
      for(let x=Math.floor(x0); x<Math.min(w, x0+ww); x++){
        const i = (y*w+x)*4;
        r += data[i]; g += data[i+1]; b += data[i+2]; n++;
      }
    }
    return n ? [r/n, g/n, b/n] : [0,0,0];
  }
  function estimateClearspace(data, w, h, yellow, black, tol){
    let total=0, clean=0;
    const inner=0.28, outer=0.36;
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const fx=x/w, fy=y/h;
        if(!((fx<outer&&fy<outer) && !(fx<inner&&fy<inner))) continue;
        const i=(y*w+x)*4; total++;
        const r=data[i],g=data[i+1],b=data[i+2];
        if(close(r,g,b,yellow,tol) || close(r,g,b,black,tol) || (r>235 && g>235 && b>235)) clean++;
      }
    }
    return total ? clean/total : 1;
  }

  // ---- Layout analysis (alignment + rhythm + broken boxes) ----
  function analyseLayout(px){
    const { data, w, h } = px;
    // Fast luminance + simple horizontal-edge detection
    const lum = new Uint8Array(w*h);
    for(let i=0, j=0; i<data.length; i+=4, j++){
      lum[j] = (0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]) | 0;
    }
    // Vertical edges via column-wise threshold
    const colEdges = new Array(w).fill(0);
    for(let x=1; x<w-1; x++){
      let count = 0;
      for(let y=0; y<h; y++){
        const a = lum[y*w + x - 1], b = lum[y*w + x + 1];
        if(Math.abs(a - b) > 50) count++;
      }
      colEdges[x] = count / h;
    }
    // Find peaks → vertical alignment lines
    const peaks = [];
    for(let x=2; x<w-2; x++){
      if(colEdges[x] > 0.18 && colEdges[x] >= colEdges[x-1] && colEdges[x] >= colEdges[x+1]) peaks.push(x);
    }
    // Alignment score: how many distinct columns vs total content cluster
    const tolerancePx = Math.max(2, Math.round((rules.grid.alignmentTolerancePx || 12) / (px.fullW / w)));
    const buckets = clusterPositions(peaks, tolerancePx);
    const alignment = peaks.length
      ? Math.round(Math.max(0, Math.min(100, 100 - (buckets.length / peaks.length) * 50 * 1.5)))
      : 70;
    // Rhythm: inter-bucket gap variance
    let rhythm = 70;
    if(buckets.length >= 3){
      const gaps = [];
      for(let i=1; i<buckets.length; i++) gaps.push(buckets[i] - buckets[i-1]);
      const mean = gaps.reduce((a,b)=>a+b,0)/gaps.length;
      const variance = gaps.reduce((a,b)=>a+(b-mean)**2,0)/gaps.length;
      const cv = Math.sqrt(variance) / Math.max(1, mean);  // coefficient of variation
      rhythm = Math.round(Math.max(0, Math.min(100, 100 - cv * 100)));
    }
    // Broken boxes — visualize misaligned clusters as red overlays
    const brokenBoxes = [];
    if(alignment < 75 && buckets.length){
      // Show offending columns: any bucket that's not on the grid divisions
      const cols = rules.grid.columns || 12;
      const colW = 1 / cols;
      buckets.slice(0, 4).forEach((bx, idx) => {
        const fx = bx / w;
        const nearest = Math.round(fx / colW) * colW;
        if(Math.abs(fx - nearest) > 0.02){
          brokenBoxes.push({ kind:'layout', x: fx - 0.02, y: 0.05 + idx*0.18, w: 0.04, h: 0.20, label: `Off-grid (Δ ${(Math.abs(fx-nearest)*100).toFixed(1)}%)` });
        }
      });
    }
    return { alignment, rhythm, brokenBoxes };
  }
  function clusterPositions(arr, tol){
    if(!arr.length) return [];
    const sorted = arr.slice().sort((a,b)=>a-b);
    const out = [sorted[0]];
    for(let i=1; i<sorted.length; i++){
      if(sorted[i] - out[out.length-1] > tol) out.push(sorted[i]);
    }
    return out;
  }
  function edgeDensity(px){
    const { data, w, h } = px;
    let edges=0, total=0;
    for(let y=1; y<h-1; y++){
      for(let x=1; x<w-1; x++){
        const i = (y*w+x)*4;
        const lum = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
        const i2 = ((y)*w+(x+1))*4;
        const lum2 = 0.299*data[i2] + 0.587*data[i2+1] + 0.114*data[i2+2];
        if(Math.abs(lum-lum2) > 40) edges++;
        total++;
      }
    }
    return edges / Math.max(1, total);
  }

  // ---- Typography intelligence ----
  function analyseTypography(copy){
    if(!copy) return { words:0, readability:0, hierarchy:0, allCaps:false };
    const words = copy.split(/\s+/).filter(Boolean);
    const wc = words.length;
    const allCaps = copy === copy.toUpperCase() && /[A-Z]/.test(copy) && wc > 5;
    const longWords = words.filter(w => w.length > 9).length;
    const longRatio = longWords / Math.max(1, wc);
    const sentences = copy.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSent = wc / Math.max(1, sentences.length);
    // Readability: penalize long words and long sentences and excessive length
    let readability = 100 - longRatio * 50 - Math.max(0, avgSent - 12) * 4 - Math.max(0, wc - rules.typography.preferredHeadlineWords) * 3;
    readability = Math.max(0, Math.min(100, Math.round(readability)));
    // Hierarchy: rewards short headline + presence of both long and short words (variance)
    const wordLens = words.map(w => w.length);
    const meanLen = wordLens.reduce((a,b)=>a+b,0)/wordLens.length;
    const varLen = wordLens.reduce((a,b)=>a+(b-meanLen)**2,0)/wordLens.length;
    let hierarchy = 60 + Math.min(30, Math.sqrt(varLen) * 8) - Math.max(0, wc - rules.typography.preferredHeadlineWords) * 2;
    if(sentences.length >= 2) hierarchy += 8;
    hierarchy = Math.max(0, Math.min(100, Math.round(hierarchy)));
    return { words: wc, readability, hierarchy, allCaps };
  }

  // ---- Semantic tone (multi-axis) ----
  function analyseTone(copy){
    if(!copy) return { vector:null, label:'unknown', matchPct:0, suggestion:null, dominantBad:false };
    const lower = copy.toLowerCase();
    const tones = rules.voice.tones || {};
    const raw = {};
    Object.keys(tones).forEach(k => {
      raw[k] = (tones[k] || []).reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    });
    const total = Object.values(raw).reduce((a,b)=>a+b, 0) || 1;
    const vector = {};
    Object.keys(tones).forEach(k => vector[k] = raw[k] / total);
    // Label = max axis
    let label = 'neutral', maxV = 0;
    Object.entries(vector).forEach(([k,v]) => { if(v > maxV){ maxV = v; label = k; } });
    // Brand vector match (cosine similarity)
    const target = rules.voice.brandToneVector || {};
    const keys = Object.keys(tones);
    let dot = 0, magA = 0, magB = 0;
    keys.forEach(k => {
      const a = vector[k] || 0, b = target[k] || 0;
      dot += a*b; magA += a*a; magB += b*b;
    });
    const cos = (magA && magB) ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
    const matchPct = Math.round(Math.max(0, Math.min(1, cos)) * 100);
    // Rewrite suggestion: substitute the first matched bad word, or mirror an example
    let suggestion = null;
    const hints = rules.voice.rewriteHints || [];
    let suggested = copy;
    let didReplace = false;
    hints.forEach(h => {
      const re = new RegExp('\\b' + h.from + '\\b', 'gi');
      if(re.test(suggested)){ suggested = suggested.replace(re, h.to); didReplace = true; }
    });
    const examples = rules.voice.examples || [];
    if(didReplace) suggestion = `Try: "${suggested}"`;
    else if(matchPct < 65 && examples[0]) suggestion = `Closer to brand: "${examples[0].do}"`;
    const dominantBad = label === 'formal' || label === 'aggressive';
    return { vector, label, matchPct, suggestion, dominantBad };
  }

  // ---- Platform safety ----
  function analysePlatformSafety(px, platSpec){
    const { data, w, h } = px;
    let cornerLoad = 0, cornerN = 0;
    const m = 0.08;
    for(let y=0; y<h; y++){
      for(let x=0; x<w; x++){
        const fx = x/w, fy = y/h;
        if((fx < m || fx > 1-m) && (fy < m || fy > 1-m)){
          const i = (y*w+x)*4;
          if(data[i+3] > 20) cornerLoad++;
          cornerN++;
        }
      }
    }
    const cornerLoadNorm = cornerLoad / Math.max(1, cornerN);
    // UI overlay collision: count contentful pixels inside each UI zone
    let collision = 0, collidingZone = '';
    (platSpec.uiZones || []).forEach(z => {
      let inside=0, total=0;
      const x0 = Math.floor(z.x*w), y0 = Math.floor(z.y*h);
      const x1 = Math.floor((z.x+z.w)*w), y1 = Math.floor((z.y+z.h)*h);
      for(let y=y0; y<y1; y++){
        for(let x=x0; x<x1; x++){
          const i=(y*w+x)*4;
          if(data[i+3] > 20){
            // is it "content" — i.e. not background? heuristic: deviation from frame mean
            inside++;
          }
          total++;
        }
      }
      const ratio = total ? inside/total : 0;
      if(ratio > collision){ collision = ratio; collidingZone = z.name; }
    });
    // Platform safety score
    const platformSafetyScore = Math.round(Math.max(0, Math.min(100,
      100 - cornerLoadNorm * 40 - collision * 60
    )));
    return { cornerLoad, cornerLoadNorm: Math.min(1, cornerLoadNorm * 5), uiCollision: collision, collidingZone, platformSafetyScore };
  }

  function boxFromZones(zones){
    return (zones || []).map(z => ({ kind:'logo', x:z.x, y:z.y, w:z.w, h:z.h, label:`Zone: ${z.name}` }));
  }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  // -------------------- Render --------------------
  function renderReport(report){
    const score = report.score;
    const minScore = rules.quality.minScoreToSubmit;
    ring.style.setProperty('--p', score);
    ring.classList.toggle('pass', score >= minScore);
    ring.classList.toggle('fail', score < 60);
    animateNumber(scoreEl, parseInt(scoreEl.textContent || '0', 10), score, 700);

    const fails = report.items.filter(i => (i.override?.to || i.verdict) === 'fail');
    const reviews = report.items.filter(i => (i.override?.to || i.verdict) === 'review');
    if(score >= minScore && fails.length === 0){
      headline.textContent = 'Cleared by the Brain';
      summary.textContent = `${report.items.length}/${report.items.length} checks pass · rules ${report.ruleVersion} · ready for review.`;
      verdict.classList.add('is-pass'); verdict.classList.remove('is-block');
    } else if(score < 60){
      headline.textContent = 'Blocked — significant brand drift';
      summary.textContent = `${fails.length} hard failure${fails.length>1?'s':''} · ${reviews.length} need review · rules ${report.ruleVersion}.`;
      verdict.classList.add('is-block'); verdict.classList.remove('is-pass');
    } else {
      headline.textContent = score < minScore ? 'Needs work before it ships' : 'Almost there';
      summary.textContent = `${fails.length} fail · ${reviews.length} review · ${report.items.length-fails.length-reviews.length} pass · rules ${report.ruleVersion}.`;
      verdict.classList.remove('is-pass','is-block');
    }
    submit.disabled = score < minScore || fails.some(f => f.confidence > rules.quality.lockOnFailConfidence && !canOverrideLock(f));

    palDiv.innerHTML = '';
    (report.palette || []).slice(0,6).forEach(p => {
      const el = document.createElement('span');
      el.className = 'pp ' + (p.brand ? 'brand' : 'off');
      el.style.background = p.hex;
      el.dataset.hex = p.hex;
      palDiv.appendChild(el);
    });

    if(versionPill) versionPill.textContent = 'Rules ' + report.ruleVersion;

    renderCategories(report.categories);
    renderColorPressure(report.colorPressure);
    renderStyleMatch(report.styleMatch);
    renderChecklist(report);
  }

  function renderCategories(cats){
    if(!categoriesEl) return;
    if(!cats){ categoriesEl.innerHTML = '<div class="cats-empty">Run an audit to see the category breakdown.</div>'; return; }
    const weights = rules.quality.weights || {};
    const ordered = ['colors','logo','layout','typography','voice','platform'];
    categoriesEl.innerHTML = ordered.map(k => {
      const c = cats[k]; const w = weights[k] || 0;
      const score = c ? c.score : 0;
      const klass = score >= 75 ? 'pass' : score >= 55 ? 'review' : 'fail';
      return `
        <div class="cat-row ${klass}">
          <div class="cat-head">
            <span class="cat-name">${capLabel(k)}</span>
            <span class="cat-weight">w ${w}%</span>
            <b class="cat-score">${score}</b>
          </div>
          <div class="cat-bar"><span style="width:${score}%"></span></div>
        </div>
      `;
    }).join('');
  }
  function capLabel(k){ return ({colors:'Colors',logo:'Logo',layout:'Layout',typography:'Typography',voice:'Tone',platform:'Platform'}[k] || k); }

  function renderColorPressure(p){
    if(!pressureEl) return;
    if(p == null){ pressureEl.innerHTML = ''; return; }
    const pct = Math.round(p * 100);
    const lvl = pct < 20 ? 'low' : pct < 50 ? 'med' : 'high';
    pressureEl.innerHTML = `
      <div class="press-label">Color pressure <b>${pct}%</b></div>
      <div class="press-track ${lvl}"><span style="width:${pct}%"></span></div>
      <div class="press-help">${pct < 20 ? 'On-target ratios.' : pct < 50 ? 'Some drift from ideal palette ratios.' : 'Far from ideal — palette balance is off.'}</div>
    `;
  }

  function renderStyleMatch(sm){
    if(!styleEl) return;
    if(!sm){
      styleEl.innerHTML = `<div class="style-empty">Brand DNA not trained yet. <button class="ci-btn" id="ag-dna-train-inline">Add this design as a reference</button></div>`;
      $('#ag-dna-train-inline')?.addEventListener('click', () => $('#ag-dna-train')?.click());
      return;
    }
    const klass = sm.score >= (rules.quality.styleMatchFloor || 70) ? 'pass' : 'fail';
    styleEl.innerHTML = `
      <div class="style-head"><b>Brand DNA match</b><span class="style-score ${klass}">${sm.score}/100</span></div>
      <div class="style-grid">
        <span>Palette overlap <b>${sm.palette}</b></span>
        <span>Saturation match <b>${sm.sat}</b></span>
        <span>Variance match <b>${sm.variance}</b></span>
        <span>Edge density <b>${sm.edge}</b></span>
      </div>
      ${klass === 'fail' ? '<div class="style-warn">⚠ Technically passes the rules — but diverges from trained Qi style.</div>' : ''}
    `;
  }

  function renderChecklist(report){
    const lockConf = rules.quality.lockOnFailConfidence;
    checklistEl.innerHTML = '';
    report.items.forEach((item, idx) => {
      const div = document.createElement('div');
      const verdict = item.override?.to || item.verdict;
      const locked = verdict === 'fail' && item.confidence > lockConf && !item.override;
      const overridden = !!item.override;
      const cls = ['check-item','is-' + verdict];
      if(locked && !canOverrideLock(item) && !overridden) cls.push('is-locked');
      if(item.weak) cls.push('is-weak');
      div.className = cls.join(' ');
      div.dataset.idx = idx;

      const pill = pillFor(verdict);
      const conf = verdict === 'idle'
        ? '<span class="confidence"><span class="confidence-bar"><span style="width:0"></span></span><b>—</b></span>'
        : `<span class="confidence">Confidence <span class="confidence-bar ${verdict}"><span style="width:${item.confidence}%"></span></span><b>${item.confidence}%</b></span>`;
      const showFix = verdict !== 'pass' && verdict !== 'idle' && item.fix;
      const evidenceClass = verdict === 'fail' ? 'is-fail' : verdict === 'review' ? 'is-review' : '';

      const subs = (item.subScores || []).map(s => `
        <span class="sub-pill ${s.value >= 75 ? 'pass' : s.value >= 55 ? 'review' : 'fail'}">
          ${escape(s.label)} <b>${s.value || 0}</b>
        </span>
      `).join('');

      const toneVec = (item.rule === 'Tone of voice' && item.vector) ? `
        <div class="tone-vec">
          ${Object.entries(item.vector).map(([k,v]) => `<span class="tv"><i style="--p:${(v*100)|0}"></i>${k} <b>${(v*100)|0}%</b></span>`).join('')}
        </div>
      ` : '';

      const suggestion = (item.rule === 'Tone of voice' && item.suggestion) ? `
        <div class="suggestion">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/></svg>
          <span>${escape(item.suggestion)}</span>
        </div>
      ` : '';

      div.innerHTML = `
        <div class="ci-num">${String(item.num).padStart(2,'0')}</div>
        <div class="ci-body">
          <div class="ci-title">
            <h4>${escape(item.rule)}${item.weak ? ' <span class="weak-pill">Present but weak</span>' : ''}</h4>
            ${pill}
            ${conf}
          </div>
          ${subs ? `<div class="sub-row">${subs}</div>` : ''}
          ${toneVec}
          ${item.evidence ? `<div class="ci-evidence ${evidenceClass}">
            <span class="lab">Why ${verdict === 'pass' ? 'this passed' : verdict === 'fail' ? 'this failed' : 'this needs review'}</span>
            <p>${escape(item.evidence)}</p>
            ${showFix ? `<p class="fix">↳ ${escape(item.fix)}</p>` : ''}
          </div>`:''}
          ${suggestion}
          ${overridden ? `<div class="ci-overridden">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 12l-4-4-4 4M12 16V8"/></svg>
            <span>Reviewer override → <b>${item.override.to.toUpperCase()}</b> · "${escape(item.override.comment)}"</span>
          </div>`:''}
        </div>
        <div class="ci-actions">
          ${actionsFor(item, verdict, locked, overridden)}
        </div>
      `;
      checklistEl.appendChild(div);
    });
    checklistEl.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => onAction(btn)));
  }

  function actionsFor(item, v, locked, overridden){
    if(v === 'idle') return '<button class="ci-btn" disabled>—</button>';
    if(overridden) return `<button class="ci-btn" data-action="undo">Undo override</button>`;
    if(locked && !canOverrideLock(item)){
      return `<div class="ci-btns"><button class="ci-btn locked" disabled title="Locked — ${escape(rules.branding.reviewerRoleLabel)} only">🔒 Locked (≥${rules.quality.lockOnFailConfidence}% FAIL)</button></div>`;
    }
    if(v === 'pass'){
      return `<div class="ci-btns">
        <button class="ci-btn primary" data-action="accept">Accept ✓</button>
        <button class="ci-btn" data-action="override">Override</button>
      </div>`;
    }
    return `<div class="ci-btns">
      <button class="ci-btn" data-action="accept">Accept AI</button>
      <button class="ci-btn primary" data-action="override">Override…</button>
    </div>`;
  }
  function pillFor(v){
    const map = { pass:['pass','PASS'], fail:['fail','FAIL'], review:['review','NEEDS REVIEW'], idle:['idle','IDLE'] };
    const [cls, lbl] = map[v] || map.idle;
    return `<span class="verdict-pill ${cls}"><span class="pip"></span>${lbl}</span>`;
  }
  function canOverrideLock(item){ return roleIn.checked === true; }
  roleIn.addEventListener('change', () => { if(currentReport) renderReport(currentReport); });

  // -------------------- Actions --------------------
  let pendingOverrideIdx = null;
  function onAction(btn){
    const idx = parseInt(btn.closest('.check-item').dataset.idx, 10);
    const action = btn.dataset.action;
    if(!currentReport) return;
    const item = currentReport.items[idx];
    if(action === 'accept'){
      const row = btn.closest('.check-item');
      const prev = row.style.background;
      row.style.background = 'color-mix(in oklab, #22C55E 12%, var(--surface))';
      setTimeout(() => { row.style.background = prev; }, 380);
      return;
    }
    if(action === 'override'){
      pendingOverrideIdx = idx;
      modalTitle.textContent = `Override "${item.rule}"`;
      modalText.value = '';
      modal.hidden = false;
      setTimeout(() => modalText.focus(), 50);
      return;
    }
    if(action === 'undo'){
      item.override = null;
      currentReport = recomputeReport(currentReport);
      renderReport(currentReport);
      return;
    }
  }
  modalCancel.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });
  function closeModal(){ modal.hidden = true; pendingOverrideIdx = null; }
  modalSave.addEventListener('click', () => {
    if(pendingOverrideIdx === null) return;
    const comment = modalText.value.trim();
    if(comment.length < 8){ modalText.style.borderColor = '#F87171'; modalText.focus(); return; }
    const item = currentReport.items[pendingOverrideIdx];
    const next = (item.override?.to || item.verdict) === 'pass' ? 'fail' : 'pass';
    item.override = { from: item.verdict, to: next, comment, when: nowStamp() };
    log.push({ rule: item.rule, from: item.verdict, to: next, confidence: item.confidence, comment, ruleVersion: ruleVersion.id, when: nowStamp() });
    if(log.length > 50) log.shift();
    saveLog();
    stats.overrides += 1; saveStats();
    closeModal();
    currentReport = recomputeReport(currentReport);
    renderReport(currentReport);
    // Feed engine again — overrides influence learning on the next audit
    E.recordAudit(currentReport);
  });
  function nowStamp(){ const d = new Date(); return d.toLocaleDateString('en-CA') + ' ' + d.toTimeString().slice(0,5); }

  function animateNumber(el, from, to, ms){
    const t0 = performance.now();
    function tick(t){ const k = Math.min(1, (t - t0) / ms); const v = Math.round(from + (to - from) * easeOut(k)); el.textContent = v; if(k < 1) requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  }
  function easeOut(t){ return 1 - Math.pow(1-t, 3); }

  // -------------------- Overlay drawing --------------------
  function drawOverlays(report){
    requestAnimationFrame(() => {
      const r = imgEl.getBoundingClientRect();
      const fr = frame.getBoundingClientRect();
      overlay.width = r.width; overlay.height = r.height;
      overlay.style.width = r.width + 'px'; overlay.style.height = r.height + 'px';
      overlay.style.left = (r.left - fr.left) + 'px'; overlay.style.top = (r.top - fr.top) + 'px';
      overlay.style.position = 'absolute';
      const ctx = overlay.getContext('2d');
      ctx.clearRect(0,0,overlay.width, overlay.height);
      report.items.forEach(item => {
        const v = item.override?.to || item.verdict;
        item.boxes.forEach(b => {
          if(b.kind === 'safe' && !toggles.safe) return;
          if((b.kind === 'logo' || b.kind === 'ui' || b.kind === 'layout') && !toggles.boxes) return;
          if(b.kind === 'color' && !toggles.palette) return;
          const x=b.x*overlay.width, y=b.y*overlay.height, w=b.w*overlay.width, h=b.h*overlay.height;
          ctx.lineWidth = 2;
          if(b.kind === 'safe'){ ctx.setLineDash([6,6]); ctx.strokeStyle = v==='pass'?'rgba(34,197,94,.85)':'rgba(248,113,113,.9)'; }
          else if(b.kind === 'ui'){ ctx.setLineDash([4,4]); ctx.strokeStyle = 'rgba(108,92,231,.9)'; ctx.fillStyle='rgba(108,92,231,.10)'; ctx.fillRect(x,y,w,h); }
          else if(b.kind === 'color'){ ctx.setLineDash([]); ctx.strokeStyle = '#F87171'; ctx.fillStyle = 'rgba(248,113,113,.12)'; ctx.fillRect(x,y,w,h); }
          else if(b.kind === 'layout'){ ctx.setLineDash([]); ctx.strokeStyle = 'rgba(245,158,11,.95)'; ctx.fillStyle = 'rgba(245,158,11,.15)'; ctx.fillRect(x,y,w,h); }
          else { ctx.setLineDash([]); ctx.strokeStyle = v==='pass'?'rgba(34,197,94,.95)':'rgba(245,158,11,.95)'; }
          ctx.strokeRect(x,y,w,h);
          ctx.setLineDash([]);
          ctx.font = '600 11px "Inter Tight", system-ui, sans-serif';
          const m = ctx.measureText(b.label); const lh = 18;
          ctx.fillStyle = 'rgba(0,0,0,.78)'; ctx.fillRect(x, y - lh, m.width + 12, lh);
          ctx.fillStyle = '#fff'; ctx.fillText(b.label, x+6, y-5);
        });
      });
    });
  }
  $$('.chip-btn[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.toggle;
      toggles[k] = !toggles[k];
      btn.setAttribute('aria-pressed', String(toggles[k]));
      if(currentReport) drawOverlays(currentReport);
    });
  });
  window.addEventListener('resize', () => { if(currentReport) drawOverlays(currentReport); });

  submit.addEventListener('click', () => {
    if(submit.disabled) return;
    showToast(`Submitted (rules ${ruleVersion.id}) ✓`);
  });
  function showToast(msg){
    let t = document.querySelector('.copy-toast');
    if(!t){ t = document.createElement('div'); t.className = 'copy-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(showToast._t); showToast._t = setTimeout(() => t.classList.remove('show'), 1600);
  }
  clearLogBtn.addEventListener('click', () => {
    if(!log.length) return;
    if(!confirm('Clear the override log? This cannot be undone.')) return;
    log.length = 0; saveLog();
    stats.overrides = 0; saveStats();
  });

  syncFromRules();

  // ==================== FEATURE 1: AUTO-FIX ENGINE ====================

  const fixModal  = $('#ag-fix-modal');
  const fixCanvas = $('#ag-fix-canvas');
  const fixTitle  = $('#ag-fix-title');
  const fixCaption= $('#ag-fix-caption');
  const fixBody   = $('#ag-fix-body');
  const fixDl     = $('#ag-fix-download');

  $('#ag-fix-close')?.addEventListener('click', () => { fixModal.hidden = true; });
  $('#ag-fix-cancel')?.addEventListener('click', () => { fixModal.hidden = true; });
  fixModal?.addEventListener('click', e => { if(e.target === fixModal) fixModal.hidden = true; });

  async function applyFix(item){
    if(!currentImage){ showToast('No design loaded'); return; }
    fixTitle.textContent = `Auto-fix: ${item.rule}`;
    fixCaption.textContent = '';
    fixDl.hidden = true;
    fixModal.hidden = false;
    fixBody.classList.add('is-loading');

    try {
      const cat = E.RULE_TO_CATEGORY[item.rule];
      let fixedCanvas = null;

      if(cat === 'colors') {
        fixedCanvas = await fixColors();
        fixCaption.textContent = 'Off-brand pixels replaced with the nearest approved palette color (80% blend for a natural result).';
      } else if(cat === 'logo') {
        fixedCanvas = await fixLogoGuide(item);
        fixCaption.textContent = 'Allowed logo zones highlighted. Move the mark into the green area.';
      } else if(item.rule === 'Layout & rhythm') {
        fixedCanvas = await fixLayout();
        fixCaption.textContent = `${rules.grid.columns}-column grid and baseline guide overlaid. Snap elements to the purple lines.`;
      } else if(item.rule === 'Platform & safe area') {
        fixedCanvas = await fixPlatform();
        fixCaption.textContent = `Safe-area (${(rules.platforms.find(p=>p.id===platform.value)||rules.platforms[0]).safeInsetPct}%) and UI overlay zones annotated.`;
      } else {
        // Text-based fix — show the suggestion in-modal
        fixBody.classList.remove('is-loading');
        fixCanvas.hidden = true;
        fixBody.innerHTML = `
          <div class="fix-text-only">
            <div class="eyebrow" style="margin-bottom:8px">Suggested fix</div>
            <h4 class="h-3">${escape(item.rule)}</h4>
            <div class="fix-suggestion">${escape(item.fix || 'No automated fix available for this rule.')}</div>
            ${item.suggestion ? `<div class="fix-rewrite">
              <span>Rewrite</span>
              <p>"${escape(item.suggestion)}"</p>
              <button class="ci-btn" id="ag-fix-copy-btn">Copy</button>
            </div>` : ''}
          </div>
          <div class="modal-actions" style="margin-top:16px">
            <button class="btn btn-ghost btn-sm" id="ag-fix-cancel2">Close</button>
          </div>
        `;
        $('#ag-fix-copy-btn')?.addEventListener('click', () => {
          navigator.clipboard?.writeText(item.suggestion).then(() => showToast('Copied!')).catch(() => showToast(item.suggestion));
        });
        $('#ag-fix-cancel2')?.addEventListener('click', () => { fixModal.hidden = true; });
        return;
      }

      if(fixedCanvas) {
        fixCanvas.hidden = false;
        const maxW = 560, maxH = 340;
        const scale = Math.min(maxW / fixedCanvas.width, maxH / fixedCanvas.height, 1);
        fixCanvas.width  = Math.round(fixedCanvas.width  * scale);
        fixCanvas.height = Math.round(fixedCanvas.height * scale);
        fixCanvas.getContext('2d').drawImage(fixedCanvas, 0, 0, fixCanvas.width, fixCanvas.height);
        fixedCanvas.toBlob(blob => {
          fixDl.href = URL.createObjectURL(blob);
          fixDl.hidden = false;
          fixBody.classList.remove('is-loading');
        }, 'image/png');
      }
    } catch(err) {
      fixBody.classList.remove('is-loading');
      fixBody.innerHTML = `<div class="fix-error">Fix failed: ${escape(String(err.message || err))}</div><div class="modal-actions"><button class="btn btn-ghost btn-sm" onclick="this.closest('.modal').hidden=true">Close</button></div>`;
    }
  }

  async function fixColors(){
    const c = document.createElement('canvas');
    c.width = currentImage.naturalWidth; c.height = currentImage.naturalHeight;
    const ctx = c.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(currentImage, 0, 0);
    const idata = ctx.getImageData(0,0,c.width,c.height);
    const d = idata.data;
    const allowed = E.approvedPalette();
    const tol = rules.colors.tolerance;
    for(let i = 0; i < d.length; i += 4){
      if(d[i+3] < 20) continue;
      const nr = nearestApproved([d[i], d[i+1], d[i+2]], allowed);
      if(nr.dE > tol && nr.match) {
        const rgb = E.hexToRgb(nr.match.hex);
        d[i]   = Math.round(rgb[0] * 0.82 + d[i]   * 0.18);
        d[i+1] = Math.round(rgb[1] * 0.82 + d[i+1] * 0.18);
        d[i+2] = Math.round(rgb[2] * 0.82 + d[i+2] * 0.18);
      }
    }
    ctx.putImageData(idata, 0, 0);
    const fs = Math.max(14, c.width / 80);
    ctx.font = `600 ${fs}px "Inter Tight", sans-serif`;
    ctx.fillStyle = 'rgba(242,205,0,.9)';
    ctx.fillText('✓ Color-corrected · Qi Guardian', c.width * 0.03, c.height * 0.975);
    return c;
  }

  async function fixLogoGuide(item){
    const c = document.createElement('canvas');
    c.width = currentImage.naturalWidth; c.height = currentImage.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(currentImage, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(currentImage, 0, 0);
    (rules.logo.zones || []).forEach(zone => {
      const x = zone.x*c.width, y = zone.y*c.height, w = zone.w*c.width, h = zone.h*c.height;
      ctx.fillStyle = 'rgba(34,197,94,.12)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(34,197,94,.9)';
      ctx.lineWidth = Math.max(3, c.width / 360);
      ctx.setLineDash([12, 6]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(34,197,94,.95)';
      const fs = Math.max(16, c.width / 60);
      ctx.font = `700 ${fs}px "Inter Tight", sans-serif`;
      ctx.fillText(`✓ Move logo here — ${zone.name}`, x + 12, y + fs + 8);
    });
    const fs = Math.max(14, c.width / 85);
    ctx.font = `600 ${fs}px "Inter Tight", sans-serif`;
    ctx.fillStyle = 'rgba(242,205,0,.9)';
    ctx.fillText('Logo placement guide · Qi Guardian', c.width * 0.03, c.height * 0.975);
    return c;
  }

  async function fixLayout(){
    const c = document.createElement('canvas');
    c.width = currentImage.naturalWidth; c.height = currentImage.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(currentImage, 0, 0);
    const cols = rules.grid.columns || 12;
    const marginPct = rules.grid.margin || 0.06;
    const mx = c.width * marginPct, my = c.height * marginPct;
    const innerW = c.width - mx * 2, innerH = c.height - my * 2;
    const unit = (rules.grid.unit || 8);
    const baseline = (rules.grid.baselineGrid || 4) * unit;

    ctx.strokeStyle = 'rgba(0,191,179,.18)';
    ctx.lineWidth = 1;
    for(let y = 0; y < c.height; y += baseline){
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
    }
    for(let i = 0; i <= cols; i++){
      const x = mx + (innerW / cols) * i;
      ctx.strokeStyle = 'rgba(108,92,231,.35)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(248,113,113,.7)';
    ctx.lineWidth = Math.max(2, c.width / 500);
    ctx.strokeRect(mx, my, innerW, innerH);

    const fs = Math.max(14, c.width / 85);
    ctx.font = `600 ${fs}px "Inter Tight", sans-serif`;
    ctx.fillStyle = 'rgba(108,92,231,.9)';
    ctx.fillText(`${cols}-col grid · ${Math.round(mx)}px margin · ${baseline}px baseline`, c.width * 0.03, c.height * 0.975);
    return c;
  }

  async function fixPlatform(){
    const c = document.createElement('canvas');
    c.width = currentImage.naturalWidth; c.height = currentImage.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(currentImage, 0, 0);
    const platSpec = rules.platforms.find(p => p.id === platform.value) || rules.platforms[0];
    const si = (platSpec.safeInsetPct || 8) / 100;
    const sx = si*c.width, sy = si*c.height;
    ctx.strokeStyle = 'rgba(34,197,94,.85)';
    ctx.lineWidth = Math.max(3, c.width / 360);
    ctx.setLineDash([14, 7]);
    ctx.strokeRect(sx, sy, c.width - sx*2, c.height - sy*2);
    ctx.setLineDash([]);
    const fs = Math.max(14, c.width / 80);
    ctx.font = `700 ${fs}px "Inter Tight", sans-serif`;
    ctx.fillStyle = 'rgba(34,197,94,.95)';
    ctx.fillText(`Safe area (${platSpec.safeInsetPct}%)`, sx+12, sy+fs+8);
    (platSpec.uiZones || []).forEach(z => {
      const x=z.x*c.width, y=z.y*c.height, w=z.w*c.width, h=z.h*c.height;
      ctx.fillStyle = 'rgba(108,92,231,.18)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(108,92,231,.75)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(108,92,231,.9)';
      ctx.font = `${Math.max(12,c.width/90)}px "Inter Tight",sans-serif`;
      ctx.fillText(`UI: ${z.name}`, x+6, y+14);
    });
    const fs2 = Math.max(14, c.width / 85);
    ctx.font = `600 ${fs2}px "Inter Tight", sans-serif`;
    ctx.fillStyle = 'rgba(242,205,0,.9)';
    ctx.fillText('Platform safety guide · Qi Guardian', c.width*0.03, c.height*0.975);
    return c;
  }

  // ==================== FEATURE 2: AI DESIGN GENERATOR ====================

  const genToggle  = $('#ag-gen-toggle');
  const genBody    = $('#ag-gen-body');
  const genRunBtn  = $('#ag-gen-run');
  const genPreview = $('#ag-gen-preview');
  const genActions = $('#ag-gen-actions');
  const genDl      = $('#ag-gen-download');
  const genLoad    = $('#ag-gen-load');
  let lastGenCanvas = null;

  genToggle?.addEventListener('click', () => {
    const open = genBody.hidden;
    genBody.hidden = !open;
    genToggle.setAttribute('aria-expanded', String(open));
  });

  genRunBtn?.addEventListener('click', () => {
    const goal = $('#ag-gen-goal')?.value || 'awareness';
    const headline = ($('#ag-gen-headline')?.value||'').trim() || 'Easy mobile banking for all.';
    const legal    = ($('#ag-gen-legal')?.value||'').trim();
    lastGenCanvas = generateDesign(goal, headline, legal);
    genPreview.innerHTML = '';
    lastGenCanvas.style.maxWidth = '100%';
    lastGenCanvas.style.maxHeight = '340px';
    lastGenCanvas.style.borderRadius = '8px';
    lastGenCanvas.style.display = 'block';
    genPreview.appendChild(lastGenCanvas);
    genActions.hidden = false;
    lastGenCanvas.toBlob(blob => {
      genDl.href = URL.createObjectURL(blob);
      genDl.download = `qi-generated-${goal}.png`;
    }, 'image/png');
  });

  genLoad?.addEventListener('click', () => {
    if(!lastGenCanvas) return;
    lastGenCanvas.toBlob(blob => {
      const file = new File([blob], 'qi-generated.png', {type:'image/png'});
      acceptFile(file);
      // scroll to agent
      document.getElementById('agent')?.scrollIntoView({behavior:'smooth'});
      showToast('Generated design loaded into the agent ✓');
    }, 'image/png');
  });

  function generateDesign(goal, headline, legal){
    const platSpec = rules.platforms.find(p=>p.id===platform.value) || rules.platforms[0];
    const c = document.createElement('canvas');
    c.width = platSpec.w; c.height = platSpec.h;
    const ctx = c.getContext('2d');
    const yellow = pickPrimary(/yellow/i, '#F2CD00');
    const black  = pickPrimary(/black/i,  '#0A0A0A');
    const tealHex = (rules.colors.secondary||[]).find(s=>/teal/i.test(s.name))?.hex || '#00BFB3';
    const si = (platSpec.safeInsetPct||8)/100;
    const sx = c.width*si, sy = c.height*si;

    if(goal === 'awareness'){
      ctx.fillStyle=yellow; ctx.fillRect(0,0,c.width,c.height);
      ctx.fillStyle=black;  ctx.fillRect(0,c.height*.70,c.width,c.height*.30);
    } else if(goal === 'conversion'){
      ctx.fillStyle=black; ctx.fillRect(0,0,c.width,c.height);
      ctx.fillStyle=yellow; ctx.fillRect(0,c.height*.73,c.width,c.height*.27);
    } else {
      ctx.fillStyle=tealHex; ctx.fillRect(0,0,c.width,c.height*.44);
      ctx.fillStyle=black;   ctx.fillRect(0,c.height*.44,c.width,c.height*.56);
    }

    // Logo in first allowed zone
    const zone = (rules.logo.zones||[])[0] || {x:.04,y:.04,w:.2,h:.14};
    const logR = Math.min(c.width*.055, c.height*.055);
    const lx = zone.x*c.width + logR + c.width*.02;
    const ly = zone.y*c.height + logR + c.height*.02;
    ctx.fillStyle = (goal==='awareness') ? black : yellow;
    ctx.beginPath(); ctx.arc(lx, ly, logR, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = (goal==='awareness') ? yellow : black;
    ctx.font = `700 ${Math.round(logR*1.1)}px "Inter Tight",sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Qi', lx, ly);
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';

    // Headline
    const headColor = (goal==='awareness') ? black : (goal==='conversion' ? yellow : '#fff');
    const textX = sx + c.width*.03;
    const textY = c.height*(goal==='awareness'?.42:goal==='conversion'?.34:.56);
    const textMaxW = c.width*(1-si*2) - c.width*.06;
    const fs = Math.max(28, Math.round(c.width/9));
    ctx.fillStyle = headColor;
    drawWrapped(ctx, headline, textX, textY, textMaxW, fs, `700 ${fs}px "Inter Tight",sans-serif`);

    // Conversion badge
    if(goal==='conversion'){
      const bx=c.width*.78, by=c.height*.22, br=Math.min(c.width,c.height)*.09;
      ctx.fillStyle='#E11D48';
      ctx.beginPath(); ctx.arc(bx,by,br,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; const bfs=Math.round(br*.3);
      ctx.font=`700 ${bfs}px "Inter Tight",sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('OFFER', bx, by);
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    }

    // Divider
    const divY = c.height*(goal==='awareness'?.68:.71);
    ctx.fillStyle = (goal==='awareness') ? 'rgba(0,0,0,.15)' : 'rgba(242,205,0,.25)';
    ctx.fillRect(sx, divY, c.width-sx*2, 2);

    // Legal
    if(legal){
      const lfs = Math.max(16, Math.round(c.width/80));
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.font = `${lfs}px "Inter",sans-serif`;
      ctx.fillText(legal, sx, c.height*(1-si*.5));
    }
    return c;
  }

  function drawWrapped(ctx, text, x, y, maxW, lineH, font){
    ctx.font = font;
    const words = text.split(' ');
    let line = '', curY = y;
    for(let n=0; n<words.length; n++){
      const test = line + words[n] + ' ';
      if(ctx.measureText(test).width > maxW && n > 0){
        ctx.fillText(line.trim(), x, curY); line = words[n]+' '; curY += lineH*1.15;
      } else line = test;
    }
    ctx.fillText(line.trim(), x, curY);
  }

  // ==================== FEATURE 3: PRE-DESIGN ASSISTANT ====================

  function renderPreDesign(){
    const el = $('#ag-predesign');
    if(!el) return;
    const platSpec = rules.platforms.find(p=>p.id===(platform?.value||'')) || (rules.platforms||[])[0];
    if(!platSpec){ el.innerHTML=''; return; }
    const primaries = rules.colors.primary || [];
    const zone = (rules.logo.zones||[])[0];
    const recs = [
      {
        icon:'📐',
        title:'Canvas size',
        body:`${platSpec.w}×${platSpec.h}px · ${platSpec.safeInsetPct}% safe inset`
      },
      {
        icon:'🎨',
        title:'Brand palette',
        html:`<div class="pd-pal">${primaries.map(p=>`<span class="pd-sw" style="background:${p.hex}" title="${escape(p.name)} · ${p.hex}"></span>`).join('')}</div>`
      },
      {
        icon:'📌',
        title:'Logo zone',
        body: zone ? `${zone.name} — top:${(zone.y*100|0)}% left:${(zone.x*100|0)}% w:${(zone.w*100|0)}%` : 'Set zones in Brand Settings'
      },
      {
        icon:'✍️',
        title:'Headline',
        body:`≤${rules.typography.maxHeadlineWords} words · ${rules.voice.tone||'clear, warm, confident'}`
      },
    ];
    el.innerHTML = recs.map(r=>`
      <div class="pd-rec">
        <span class="pd-icon">${r.icon}</span>
        <div>
          <b>${escape(r.title)}</b>
          ${r.body ? `<p class="pd-body">${escape(r.body)}</p>` : (r.html||'')}
        </div>
      </div>
    `).join('');
  }

  // Real-time guard: watch copy field for live tone feedback
  let rtGuardTimer = null;
  const rtBadge = $('#ag-rt-guard');
  const rtHint  = $('#ag-rt-hint');

  copyIn?.addEventListener('input', () => {
    clearTimeout(rtGuardTimer);
    rtBadge?.classList.remove('active','warn');
    rtBadge && (rtBadge.textContent = '');
    rtBadge?.insertAdjacentHTML('afterbegin','<span class="ai-pulse"></span>');
    rtBadge?.append(' Analysing…');
    rtGuardTimer = setTimeout(() => {
      const copy = (copyIn.value||'').trim();
      if(!copy){ rtBadge.textContent=''; rtBadge.insertAdjacentHTML('afterbegin','<span class="ai-pulse"></span>'); rtBadge.append(' Real-time guard: idle'); rtHint.hidden=true; return; }
      const tone = analyseTone(copy);
      const typo = analyseTypography(copy);
      const passT = rules.voice.toneMatchPassPct || 65;
      const ok = tone.matchPct >= passT && !tone.dominantBad && typo.words <= rules.typography.maxHeadlineWords;
      rtBadge.textContent='';
      rtBadge.insertAdjacentHTML('afterbegin','<span class="ai-pulse"></span>');
      rtBadge.append(ok ? ` Tone OK — ${tone.matchPct}% match` : ` Tone issue — ${tone.matchPct}% match`);
      rtBadge.classList.toggle('active', ok);
      rtBadge.classList.toggle('warn', !ok);
      if(!ok && tone.suggestion){ rtHint.textContent = '↳ ' + tone.suggestion; rtHint.hidden = false; }
      else { rtHint.hidden = true; }
    }, 600);
  });

  // Platform change → refresh pre-design
  platform?.addEventListener('change', () => { renderPreDesign(); });

  // ==================== FEATURE 4: CAMPAIGN CONSISTENCY ====================

  const CAMPAIGN_KEY = 'qi-campaigns';
  let campaigns = {};
  try { campaigns = JSON.parse(localStorage.getItem(CAMPAIGN_KEY)||'{}'); } catch(e){ campaigns={}; }
  let currentCampaignId = null;

  function saveCampaigns(){ try{ localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaigns)); }catch(e){} }

  $('#ag-camp-start')?.addEventListener('click', startCampaign);

  function startCampaign(){
    const name = prompt('Campaign name:', 'Q' + new Date().getFullYear() + ' Campaign');
    if(!name) return;
    currentCampaignId = 'camp-' + Date.now();
    campaigns[currentCampaignId] = { name: name.trim(), audits: [] };
    saveCampaigns();
    renderCampaignPanel();
  }

  function addToCampaign(report){
    if(!currentCampaignId || !campaigns[currentCampaignId]) return;
    campaigns[currentCampaignId].audits.push({
      score: report.score,
      fingerprint: report.fingerprint,
      platformLabel: report.meta?.platformLabel || 'Design ' + (campaigns[currentCampaignId].audits.length+1),
      when: new Date().toISOString().slice(0,16).replace('T',' '),
    });
    saveCampaigns();
    renderCampaignPanel();
  }

  function computeConsistency(campaign){
    const audits = (campaign.audits||[]);
    if(audits.length < 2) return { score:100, note:'—' };
    // Pairwise score variance
    const scores = audits.map(a=>a.score);
    const mean = scores.reduce((a,b)=>a+b,0)/scores.length;
    const variance = scores.reduce((a,b)=>a+(b-mean)**2,0)/scores.length;
    const cv = Math.sqrt(variance)/Math.max(1,mean);
    const consistency = Math.round(Math.max(0, Math.min(100, 100 - cv*90)));
    return { score:consistency, note:`±${Math.round(Math.sqrt(variance))} pts spread` };
  }

  function renderCampaignPanel(){
    const el = $('#ag-campaign');
    if(!el) return;
    if(!currentCampaignId || !campaigns[currentCampaignId]){
      el.innerHTML = `<div class="camp-empty">Start a campaign to group audits and track cross-platform consistency.</div>`;
      return;
    }
    const camp = campaigns[currentCampaignId];
    const audits = camp.audits || [];
    const avgScore = audits.length ? Math.round(audits.reduce((a,b)=>a+b.score,0)/audits.length) : 0;
    const cons = computeConsistency(camp);
    const consKlass = cons.score>=80?'pass':cons.score>=60?'review':'fail';
    el.innerHTML = `
      <div class="camp-head">
        <b class="camp-name">${escape(camp.name)}</b>
        <span class="muted" style="font-size:.78rem">${audits.length} design${audits.length!==1?'s':''}</span>
        <div class="camp-scores">
          <span class="camp-kpi"><b>${avgScore}</b><i>avg score</i></span>
          <span class="camp-kpi ${consKlass}"><b>${cons.score}%</b><i>consistency</i></span>
        </div>
        <div class="camp-btns">
          <button class="ci-btn" id="ag-camp-add-btn" ${!currentReport?'disabled':''}>+ Add this audit</button>
          <button class="ci-btn danger" id="ag-camp-end-btn">End campaign</button>
        </div>
      </div>
      <div class="camp-consistency-bar">
        <span style="width:${cons.score}%;background:${cons.score>=80?'#22C55E':cons.score>=60?'#F59E0B':'#F87171'}"></span>
      </div>
      <div class="camp-list" style="margin-top:10px">
        ${audits.length ? audits.map(a=>`
          <div class="camp-row">
            <span class="camp-platform">${escape(a.platformLabel)}</span>
            <span class="camp-when">${escape(a.when)}</span>
            <span class="camp-score ${a.score>=85?'pass':a.score>=60?'review':'fail'}">${a.score}</span>
          </div>
        `).join('') : '<div class="camp-empty">No audits yet. Run an audit and click "+ Add this audit".</div>'}
      </div>
    `;
    $('#ag-camp-add-btn')?.addEventListener('click', () => { if(currentReport) addToCampaign(currentReport); });
    $('#ag-camp-end-btn')?.addEventListener('click', () => {
      if(!confirm(`End campaign "${camp.name}"?`)) return;
      currentCampaignId = null;
      renderCampaignPanel();
    });
  }

  // ==================== FEATURE 7: AUTO PUBLISHING FLOW ====================

  const pubModal   = $('#ag-publish-modal');
  const pubBody    = $('#ag-pub-body');
  const pubPlatEl  = $('#ag-pub-platforms');
  const pubInfo    = $('#ag-pub-info');
  const pubBtn     = $('#ag-publish-btn');

  pubBtn?.addEventListener('click', () => {
    if(!currentReport) return;
    renderPubPlatforms();
    pubModal.hidden = false;
  });
  $('#ag-pub-close')?.addEventListener('click', () => { pubModal.hidden = true; });
  $('#ag-pub-cancel')?.addEventListener('click', () => { pubModal.hidden = true; });
  pubModal?.addEventListener('click', e => { if(e.target===pubModal) pubModal.hidden=true; });

  function renderPubPlatforms(){
    if(!pubPlatEl) return;
    pubPlatEl.innerHTML = (rules.platforms||[]).map(p=>`
      <button class="pub-plat" data-platid="${p.id}">${escape(p.label)}</button>
    `).join('');
    pubPlatEl.querySelectorAll('.pub-plat').forEach(btn => {
      btn.addEventListener('click', () => {
        pubPlatEl.querySelectorAll('.pub-plat').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        const p = rules.platforms.find(pl=>pl.id===btn.dataset.platid);
        if(p && pubInfo) pubInfo.innerHTML = `<b>${escape(p.label)}</b> · ${p.w}×${p.h}px · safe inset ${p.safeInsetPct}%<br><span class="muted" style="font-size:.78rem">Design will be locked after scheduling. Rules v${ruleVersion.id} applied.</span>`;
      });
    });
  }

  $('#ag-pub-confirm')?.addEventListener('click', () => {
    const selPlat = pubPlatEl?.querySelector('.pub-plat.selected');
    const whenVal = $('#ag-pub-when')?.value;
    const acct    = ($('#ag-pub-account')?.value||'').trim();
    if(!selPlat){ showToast('Select a platform first'); return; }
    if(!whenVal){ showToast('Set a date and time first'); return; }
    const platName = selPlat.textContent;
    const when = new Date(whenVal).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    pubBody.innerHTML = `
      <div class="pub-success">
        <div class="pub-success-icon">🗓️</div>
        <h4>Scheduled!</h4>
        <p>${escape(platName)}${acct?' · '+escape(acct):''}<br>${escape(when)} · Score ${currentReport?.score||'—'}/100 · Rules ${ruleVersion.id}</p>
        <div class="modal-actions" style="margin-top:18px;justify-content:center">
          <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal').hidden=true">Close</button>
        </div>
      </div>
    `;
    showToast('Design scheduled ✓');
    stats.runs = (stats.runs||0); saveStats();
  });

  // Enable publish button when score is good enough
  function updatePublishBtn(){
    if(pubBtn) pubBtn.disabled = !currentReport || currentReport.score < rules.quality.minScoreToSubmit;
  }

  // ==================== FEATURE 8: FEEDBACK LEARNING LOOP ====================

  function classifyFeedback(from, to){
    if(from==='pass' && to==='fail') return 'rejection';
    if(from==='fail' && to==='pass') return 'exception';
    return 'correction';
  }

  // ==================== FEATURE 9: INTEGRATIONS LAYER ====================

  $('#ag-export-figma')?.addEventListener('click', exportFigmaSpec);
  $('#ag-export-tokens')?.addEventListener('click', exportDesignTokens);
  $('#ag-export-report')?.addEventListener('click', exportAuditReport);

  function exportFigmaSpec(){
    const r = rules;
    const spec = {
      source: 'Qi Brand Center — Figma Spec Export',
      version: ruleVersion.id,
      generated: new Date().toISOString(),
      colors: {
        primary: (r.colors.primary||[]).map(c=>({name:c.name,hex:c.hex})),
        secondary: (r.colors.secondary||[]).map(c=>({name:c.name,hex:c.hex})),
      },
      typography: {
        fonts: r.typography.fonts,
        maxHeadlineWords: r.typography.maxHeadlineWords,
        preferredHeadlineWords: r.typography.preferredHeadlineWords,
      },
      logo: {
        clearspaceRatio: r.logo.clearspaceRatio,
        minSizePx: r.logo.minSizePx,
        zones: (r.logo.zones||[]).map(z=>({name:z.name,x:z.x,y:z.y,w:z.w,h:z.h})),
      },
      platforms: (r.platforms||[]).map(p=>({id:p.id,label:p.label,w:p.w,h:p.h,safeInsetPct:p.safeInsetPct})),
      grid: r.grid,
    };
    downloadJSON(spec, 'qi-figma-spec.json');
    showToast('Figma spec exported ✓');
  }

  function exportDesignTokens(){
    const r = rules;
    const tokens = { $schema:'https://design-tokens.github.io/community-group/format/', 'qi-brand':{ } };
    (r.colors.primary||[]).forEach(c=>{ tokens['qi-brand'][slug2(c.name)]={$value:c.hex,$type:'color'}; });
    (r.colors.secondary||[]).forEach(c=>{ tokens['qi-brand'][slug2(c.name)]={$value:c.hex,$type:'color'}; });
    tokens['qi-brand']['font-family']={$value:(r.typography.fonts||[]).join(','),$type:'fontFamily'};
    tokens['qi-brand']['grid-columns']={$value:r.grid.columns,$type:'number'};
    tokens['qi-brand']['grid-unit']={$value:`${r.grid.unit}px`,$type:'dimension'};
    downloadJSON(tokens, 'qi-design-tokens.json');
    showToast('Design tokens exported ✓');
  }

  function exportAuditReport(){
    if(!currentReport){ showToast('Run an audit first'); return; }
    const rpt = {
      source: 'Qi Brand Guardian — Audit Report',
      version: currentReport.ruleVersion,
      brand: currentBrandName(),
      date: new Date().toISOString(),
      score: currentReport.score,
      meta: currentReport.meta,
      categories: currentReport.categories,
      items: (currentReport.items||[]).map(i=>({
        num: i.num, rule: i.rule, verdict: i.override?.to||i.verdict,
        confidence: i.confidence, evidence: i.evidence, fix: i.fix,
        override: i.override||null,
      })),
    };
    downloadJSON(rpt, 'qi-audit-report.json');
    showToast('Audit report exported ✓');
  }

  function downloadJSON(obj, filename){
    const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }
  function slug2(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

  // ==================== WIRE UP NEW FEATURES ====================

  // Patch actionsFor to add Fix button
  const _origActionsFor = actionsFor;  // actionsFor is already declared above; we'll extend onAction instead

  // Patch onAction to handle 'fix'
  const _origOnAction = onAction;
  // Override onAction by re-wiring (it reads from data-action on delegation)
  checklistEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="fix"]');
    if(!btn) return;
    const idx = parseInt(btn.closest('.check-item').dataset.idx, 10);
    if(currentReport) applyFix(currentReport.items[idx]);
  });

  // Patch renderChecklist to inject Fix buttons — done by extending actionsFor inline
  // We patch the module-level `actionsFor` reference used inside renderChecklist
  // The cleanest way is to shadow the function:
  function actionsForV2(item, v, locked, overridden){
    if(v === 'idle') return '<button class="ci-btn" disabled>—</button>';
    const hasFix = item.fix && item.fix.length > 0;
    if(overridden) return `
      <div class="ci-btns">
        <button class="ci-btn" data-action="undo">Undo override</button>
        ${hasFix ? '<button class="ci-btn" data-action="fix">Auto-fix ↓</button>' : ''}
      </div>`;
    if(locked && !canOverrideLock(item)){
      return `<div class="ci-btns"><button class="ci-btn locked" disabled title="Locked — ${escape(rules.branding.reviewerRoleLabel)} only">🔒 Locked (≥${rules.quality.lockOnFailConfidence}% FAIL)</button></div>`;
    }
    if(v === 'pass'){
      return `<div class="ci-btns">
        <button class="ci-btn primary" data-action="accept">Accept ✓</button>
        <button class="ci-btn" data-action="override">Override</button>
      </div>`;
    }
    return `<div class="ci-btns">
      <button class="ci-btn" data-action="accept">Accept AI</button>
      ${hasFix ? '<button class="ci-btn" data-action="fix">Auto-fix ↓</button>' : ''}
      <button class="ci-btn primary" data-action="override">Override…</button>
    </div>`;
  }

  // Monkey-patch renderChecklist to use actionsForV2
  const _origRenderChecklist = renderChecklist;
  function renderChecklistV2(report){
    const lockConf = rules.quality.lockOnFailConfidence;
    checklistEl.innerHTML = '';
    report.items.forEach((item, idx) => {
      const div = document.createElement('div');
      const verdict = item.override?.to || item.verdict;
      const locked = verdict === 'fail' && item.confidence > lockConf && !item.override;
      const overridden = !!item.override;
      const cls = ['check-item','is-' + verdict];
      if(locked && !canOverrideLock(item) && !overridden) cls.push('is-locked');
      if(item.weak) cls.push('is-weak');
      div.className = cls.join(' ');
      div.dataset.idx = idx;

      const pill = pillFor(verdict);
      const conf = verdict === 'idle'
        ? '<span class="confidence"><span class="confidence-bar"><span style="width:0"></span></span><b>—</b></span>'
        : `<span class="confidence">Confidence <span class="confidence-bar ${verdict}"><span style="width:${item.confidence}%"></span></span><b>${item.confidence}%</b></span>`;
      const showFix = verdict !== 'pass' && verdict !== 'idle' && item.fix;
      const evidenceClass = verdict === 'fail' ? 'is-fail' : verdict === 'review' ? 'is-review' : '';

      const subs = (item.subScores || []).map(s => `
        <span class="sub-pill ${s.value >= 75 ? 'pass' : s.value >= 55 ? 'review' : 'fail'}">
          ${escape(s.label)} <b>${s.value || 0}</b>
        </span>
      `).join('');

      const toneVec = (item.rule === 'Tone of voice' && item.vector) ? `
        <div class="tone-vec">
          ${Object.entries(item.vector).map(([k,v]) => `<span class="tv"><i style="--p:${(v*100)|0}"></i>${k} <b>${(v*100)|0}%</b></span>`).join('')}
        </div>
      ` : '';

      const suggestion = (item.rule === 'Tone of voice' && item.suggestion) ? `
        <div class="suggestion">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/></svg>
          <span>${escape(item.suggestion)}</span>
        </div>
      ` : '';

      // Feedback tag from log
      const logEntry = log.slice().reverse().find(l=>l.rule===item.rule);
      const fbTag = logEntry ? `<span class="feedback-tag ${classifyFeedback(logEntry.from,logEntry.to)}">${classifyFeedback(logEntry.from,logEntry.to)}</span>` : '';

      div.innerHTML = `
        <div class="ci-num">${String(item.num).padStart(2,'0')}</div>
        <div class="ci-body">
          <div class="ci-title">
            <h4>${escape(item.rule)}${item.weak ? ' <span class="weak-pill">Present but weak</span>' : ''}${fbTag}</h4>
            ${pill}
            ${conf}
          </div>
          ${subs ? `<div class="sub-row">${subs}</div>` : ''}
          ${toneVec}
          ${item.evidence ? `<div class="ci-evidence ${evidenceClass}">
            <span class="lab">Why ${verdict === 'pass' ? 'this passed' : verdict === 'fail' ? 'this failed' : 'this needs review'}</span>
            <p>${escape(item.evidence)}</p>
            ${showFix ? `<p class="fix">↳ ${escape(item.fix)}</p>` : ''}
          </div>`:''}
          ${suggestion}
          ${overridden ? `<div class="ci-overridden">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 12l-4-4-4 4M12 16V8"/></svg>
            <span>Reviewer override → <b>${item.override.to.toUpperCase()}</b> · "${escape(item.override.comment)}"</span>
          </div>`:''}
        </div>
        <div class="ci-actions">
          ${actionsForV2(item, verdict, locked, overridden)}
        </div>
      `;
      checklistEl.appendChild(div);
    });
    checklistEl.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => onAction(btn)));
  }

  // Override renderChecklist globally within this scope
  // We patch it by reassigning — in JS IIFE context, we can't rebind the closure, so
  // we patch the call site: renderReport calls renderChecklist. We override renderReport:
  const _origRenderReport = renderReport;
  function renderReportV2(report){
    // Same as original but calls renderChecklistV2
    const score = report.score;
    const minScore = rules.quality.minScoreToSubmit;
    ring.style.setProperty('--p', score);
    ring.classList.toggle('pass', score >= minScore);
    ring.classList.toggle('fail', score < 60);
    animateNumber(scoreEl, parseInt(scoreEl.textContent || '0', 10), score, 700);

    const fails    = report.items.filter(i => (i.override?.to || i.verdict) === 'fail');
    const reviews  = report.items.filter(i => (i.override?.to || i.verdict) === 'review');
    if(score >= minScore && fails.length === 0){
      headline.textContent = 'Cleared by the Brain';
      summary.textContent = `${report.items.length}/${report.items.length} checks pass · rules ${report.ruleVersion} · ready for review.`;
      verdict.classList.add('is-pass'); verdict.classList.remove('is-block');
    } else if(score < 60){
      headline.textContent = 'Blocked — significant brand drift';
      summary.textContent = `${fails.length} hard failure${fails.length>1?'s':''} · ${reviews.length} need review · rules ${report.ruleVersion}.`;
      verdict.classList.add('is-block'); verdict.classList.remove('is-pass');
    } else {
      headline.textContent = score < minScore ? 'Needs work before it ships' : 'Almost there';
      summary.textContent = `${fails.length} fail · ${reviews.length} review · ${report.items.length-fails.length-reviews.length} pass · rules ${report.ruleVersion}.`;
      verdict.classList.remove('is-pass','is-block');
    }
    submit.disabled = score < minScore || fails.some(f => f.confidence > rules.quality.lockOnFailConfidence && !canOverrideLock(f));

    palDiv.innerHTML = '';
    (report.palette || []).slice(0,6).forEach(p => {
      const el = document.createElement('span');
      el.className = 'pp ' + (p.brand ? 'brand' : 'off');
      el.style.background = p.hex;
      el.dataset.hex = p.hex;
      palDiv.appendChild(el);
    });

    if(versionPill) versionPill.textContent = 'Rules ' + report.ruleVersion;

    renderCategories(report.categories);
    renderColorPressure(report.colorPressure);
    renderStyleMatch(report.styleMatch);
    renderChecklistV2(report);
    updatePublishBtn();
  }

  // Wire run-audit to use V2 render + add-to-campaign
  runBtn.removeEventListener('click', runAudit);
  rerun.removeEventListener('click', runAudit);

  async function runAuditV2(){
    if(!currentImage) return;
    rules = E.currentRules(); ruleVersion = E.currentVersion();
    scan.hidden = false; runBtn.disabled = true; rerun.hidden = true;
    const stages = [
      'Detecting brandmark…','Sampling palette…','Measuring color pressure…',
      'Scoring layout rhythm…','Reading typography…','Classifying tone vector…',
      'Verifying disclaimers…','Checking platform safety…','Comparing to brand DNA…',
      'Running Auto-Fix analysis…'
    ];
    let s = 0; scanText.textContent = stages[0];
    const stageT = setInterval(() => { s = (s+1) % stages.length; scanText.textContent = stages[s]; }, 220);
    const t0 = performance.now();
    const report = await analyse();
    const elapsed = performance.now() - t0;
    if(elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
    clearInterval(stageT); scan.hidden = true;
    currentReport = report;
    renderReportV2(report);
    drawOverlays(report);
    runBtn.disabled = false; rerun.hidden = false;
    stats.runs += 1;
    if(report.score < rules.quality.minScoreToSubmit) stats.blocked += 1;
    saveStats();
    E.recordAudit(report);
  }

  runBtn.addEventListener('click', () => runAuditV2());
  rerun.addEventListener('click', () => runAuditV2());

  // Also patch syncFromRules to call renderChecklistV2
  const _origSyncFromRules = syncFromRules;
  function syncFromRulesV2(){
    if(platform){
      const prevSel = platform.value;
      platform.innerHTML = rules.platforms.map(p =>
        `<option value="${p.id}" data-w="${p.w}" data-h="${p.h}" data-safe="${p.safeInsetPct}">${escape(p.label)}</option>`
      ).join('');
      if(rules.platforms.find(p => p.id === prevSel)) platform.value = prevSel;
    }
    if(cohort){
      const prevSel = cohort.value;
      const items = [{id:'primary', label:'Primary — Yellow / Black', hex:''}].concat(
        rules.colors.secondary.map(s => ({id: slug(s.name), label: s.name + ' — ' + s.hex, hex: s.hex}))
      );
      cohort.innerHTML = items.map(c => `<option value="${c.id}" data-hex="${c.hex}">${escape(c.label)}</option>`).join('');
      if(items.find(c => c.id === prevSel)) cohort.value = prevSel;
    }
    if(policyMinScore) policyMinScore.textContent = rules.quality.minScoreToSubmit + ' score';
    if(policyLockConf) policyLockConf.textContent = rules.quality.lockOnFailConfidence + '% confidence';
    if(policyRoleLabel) policyRoleLabel.textContent = rules.branding.reviewerRoleLabel;
    if(roleLbl) roleLbl.textContent = `I am ${rules.branding.reviewerRoleLabel} (unlock locked items)`;
    if(versionPill) versionPill.textContent = 'Rules ' + ruleVersion.id;
    if(brandPill) brandPill.textContent = currentBrandName();
    renderPreDesign();
    renderCampaignPanel();
    if(currentReport){
      currentReport = recomputeReport(currentReport);
      renderReportV2(currentReport);
    } else {
      renderChecklistV2(idleReport());
      renderCategories(null);
      renderColorPressure(null);
      renderStyleMatch(null);
    }
  }
  E.subscribe(r => { rules = r; ruleVersion = E.currentVersion(); syncFromRulesV2(); });
  // Re-call with V2 to replace the initial syncFromRules call
  syncFromRulesV2();
  renderPreDesign();
  renderCampaignPanel();
})();
