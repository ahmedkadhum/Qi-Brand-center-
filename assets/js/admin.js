// Qi Brand Center — Admin (Brand Brain)
// Wires every control to a working draft and pushes through BrandEngine.
(function(){
  if(!document.getElementById('sec-colors')) return;
  if(!window.BrandEngine){ console.error('BrandEngine not loaded'); return; }
  const E = window.BrandEngine;

  const $  = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => Array.from(r.querySelectorAll(s));

  let draft = E.currentRules();
  let baseline = JSON.stringify(draft);

  // ---------- Toolbar ----------
  const brandSel    = $('#ad-brand');
  const versionSel  = $('#ad-version');
  const dirty       = $('#ad-dirty');
  const saveInplace = $('#ad-save-inplace');
  const saveVersion = $('#ad-save-version');
  const discard     = $('#ad-discard');

  function refreshToolbar(){
    brandSel.innerHTML = E.listBrands()
      .map(b => `<option value="${b.id}" ${b.id===E.activeBrand()?'selected':''}>${escape(b.name)}</option>`).join('');
    const versions = E.listVersions();
    versionSel.innerHTML = versions.map(v =>
      `<option value="${v.id}" ${v.active?'selected':''}>${escape(v.label)}${v.active?' · active':''}</option>`
    ).join('');
    renderVersionList(versions);
  }

  brandSel.addEventListener('change', () => {
    E.setActiveBrand(brandSel.value);
    draft = E.currentRules(); baseline = JSON.stringify(draft);
    syncAll();
  });
  $('#ad-rollback').addEventListener('click', () => {
    if(E.rollback(versionSel.value)){ draft = E.currentRules(); baseline = JSON.stringify(draft); syncAll(); toast(`Rolled back to ${versionSel.value}`); }
  });
  $('#ad-delete-version').addEventListener('click', () => {
    if(!confirm(`Delete version ${versionSel.value}?`)) return;
    if(E.deleteVersion(versionSel.value)){ refreshToolbar(); toast('Deleted'); } else toast('Cannot delete the active or last version');
  });
  $('#ad-new-brand').addEventListener('click', () => {
    promptModal('New brand', 'A short id will be derived from the name.', '', name => {
      if(!name) return;
      if(E.createBrand(slug(name), name)){ draft = E.currentRules(); baseline = JSON.stringify(draft); syncAll(); toast(`Created “${name}”`); }
      else toast('A brand with that id already exists');
    });
  });
  $('#ad-rename-brand').addEventListener('click', () => {
    const cur = E.listBrands().find(b => b.id === E.activeBrand());
    promptModal('Rename brand', '', cur.name, name => { if(name){ E.renameBrand(cur.id, name); refreshToolbar(); toast('Renamed'); } });
  });
  $('#ad-delete-brand').addEventListener('click', () => {
    const cur = E.listBrands().find(b => b.id === E.activeBrand());
    if(!confirm(`Delete brand “${cur.name}” and all its versions?`)) return;
    if(E.deleteBrand(cur.id)){ draft = E.currentRules(); baseline = JSON.stringify(draft); syncAll(); toast('Brand deleted'); }
    else toast('Cannot delete the only brand');
  });
  saveInplace.addEventListener('click', () => { E.updateActiveDraft(draft); baseline = JSON.stringify(draft); markDirty(); toast('Saved to active version'); });
  saveVersion.addEventListener('click', () => {
    promptModal('Save as new version', 'Add a short note. The brain uses this version for all future audits.', '', note => {
      const id = E.saveVersion(draft, note || '');
      baseline = JSON.stringify(draft); markDirty(); refreshToolbar(); toast(`Snapshotted as ${id}`);
    });
  });
  discard.addEventListener('click', () => { draft = JSON.parse(baseline); syncAll(); toast('Discarded'); });

  $('#ad-reset-all').addEventListener('click', () => {
    if(!confirm('Reset every brand and every version to factory defaults?')) return;
    E.resetDefaults(); draft = E.currentRules(); baseline = JSON.stringify(draft); syncAll(); toast('Reset');
  });
  $$('[data-reset]').forEach(btn => btn.addEventListener('click', () => {
    const k = btn.dataset.reset;
    const def = E.DEFAULTS();
    draft[k] = def[k];
    syncAll(); markDirty();
  }));

  // ---------- A. Colors ----------
  function renderSwatchList(target, list){
    const el = $(target); el.innerHTML = '';
    list.forEach((c, i) => {
      const row = document.createElement('div');
      row.className = 'swatch-row-edit';
      const idealField = ('idealSharePct' in c) ?
        `<input class="sw-ideal" type="number" min="0" max="100" value="${c.idealSharePct||0}" title="Ideal canvas share %" />` : '<span></span>';
      row.innerHTML = `
        <span class="sw" style="background:${escape(c.hex)}"></span>
        <input class="sw-name" type="text" value="${escape(c.name)}" />
        <input class="sw-hex" type="text" value="${escape(c.hex)}" maxlength="7" />
        <input class="sw-color" type="color" value="${escape(c.hex)}" />
        ${idealField}
        <button class="ci-btn danger sw-del">×</button>
      `;
      row.querySelector('.sw-name').addEventListener('input', e => { c.name = e.target.value; markDirty(); renderIdealTable(); });
      row.querySelector('.sw-hex').addEventListener('input', e => {
        let v = e.target.value.trim(); if(v && v[0] !== '#') v = '#' + v; c.hex = v.toUpperCase();
        row.querySelector('.sw').style.background = c.hex;
        const ci = row.querySelector('.sw-color');
        if(/^#[0-9A-F]{6}$/i.test(c.hex)) ci.value = c.hex;
        markDirty(); renderIdealTable(); renderCombos();
      });
      row.querySelector('.sw-color').addEventListener('input', e => {
        c.hex = e.target.value.toUpperCase();
        row.querySelector('.sw-hex').value = c.hex;
        row.querySelector('.sw').style.background = c.hex;
        markDirty(); renderIdealTable(); renderCombos();
      });
      const idealEl = row.querySelector('.sw-ideal');
      if(idealEl) idealEl.addEventListener('input', e => { c.idealSharePct = +e.target.value; markDirty(); renderIdealTable(); });
      row.querySelector('.sw-del').addEventListener('click', () => { list.splice(i,1); renderSwatchList(target, list); markDirty(); renderIdealTable(); });
      el.appendChild(row);
    });
  }
  $('#ad-color-add-primary').addEventListener('click', () => { draft.colors.primary.push({name:'New color', hex:'#888888', idealSharePct:0}); renderSwatchList('#ad-primary', draft.colors.primary); markDirty(); renderIdealTable(); });
  $('#ad-color-add-secondary').addEventListener('click', () => { draft.colors.secondary.push({name:'New cohort', hex:'#888888'}); renderSwatchList('#ad-secondary', draft.colors.secondary); markDirty(); });
  bindRange('#ad-tolerance', '#ad-tolerance-val', v => `ΔE ${v} (${v < 12 ? 'strict' : v < 22 ? 'balanced' : 'generous'})`, v => { draft.colors.tolerance = +v; });
  bindNumber('#ad-share-pass',   v => { draft.colors.onBrandSharePassPct = +v; });
  bindNumber('#ad-share-review', v => { draft.colors.onBrandShareReviewPct = +v; });
  bindNumber('#ad-primary-min',  v => { draft.colors.usage = draft.colors.usage || {}; draft.colors.usage.primaryMinPct = +v; });

  function renderIdealTable(){
    const el = $('#ad-ideal-table');
    if(!el) return;
    const total = (draft.colors.primary || []).reduce((a,p) => a + (+p.idealSharePct || 0), 0);
    el.innerHTML = `
      <div class="ideal-stack">
        ${(draft.colors.primary||[]).map(p => `<span title="${escape(p.name)} ${p.idealSharePct||0}%" style="flex:${p.idealSharePct||0};background:${escape(p.hex)}"></span>`).join('')}
      </div>
      <div class="ideal-meta"><span>Sum of ideal shares</span><b>${total}%</b></div>
    `;
  }

  function renderCombos(){
    const el = $('#ad-combos');
    if(!el) return;
    if(!draft.colors.usage) draft.colors.usage = { primaryMinPct: 0, forbiddenCombos: [] };
    if(!draft.colors.usage.forbiddenCombos) draft.colors.usage.forbiddenCombos = [];
    const all = (draft.colors.primary || []).concat(draft.colors.secondary || []);
    const opt = all.map(c => `<option value="${escape(c.hex)}">${escape(c.hex)} · ${escape(c.name)}</option>`).join('');
    el.innerHTML = draft.colors.usage.forbiddenCombos.map((c, i) => `
      <div class="combo-row" data-i="${i}">
        <span class="combo-sw" style="background:${escape(c.a)}"></span>
        <select data-k="a">${opt.replace(`value="${c.a}"`, `value="${c.a}" selected`)}</select>
        <span>+</span>
        <span class="combo-sw" style="background:${escape(c.b)}"></span>
        <select data-k="b">${opt.replace(`value="${c.b}"`, `value="${c.b}" selected`)}</select>
        <input type="number" min="0" max="100" data-k="max" value="${c.max||10}" /><span class="rs-suffix">% max</span>
        <input type="text" data-k="note" value="${escape(c.note||'')}" placeholder="why?" />
        <button class="ci-btn danger combo-del">×</button>
      </div>
    `).join('') || '<p class="muted" style="font-size:.84rem;margin:0">No forbidden combinations defined.</p>';
    $$('.combo-row', el).forEach(row => {
      const i = +row.dataset.i;
      $$('select, input', row).forEach(inp => {
        inp.addEventListener('input', e => {
          const k = inp.dataset.k;
          const v = inp.type === 'number' ? +inp.value : inp.value;
          draft.colors.usage.forbiddenCombos[i][k] = v;
          if(k === 'a' || k === 'b'){
            row.querySelectorAll('.combo-sw')[k==='a'?0:1].style.background = v;
          }
          markDirty();
        });
      });
      row.querySelector('.combo-del').addEventListener('click', () => {
        draft.colors.usage.forbiddenCombos.splice(i, 1); renderCombos(); markDirty();
      });
    });
  }
  $('#ad-combo-add').addEventListener('click', () => {
    const all = (draft.colors.primary||[]).concat(draft.colors.secondary||[]);
    if(all.length < 2){ toast('Add at least two colors first'); return; }
    draft.colors.usage = draft.colors.usage || {primaryMinPct:0, forbiddenCombos:[]};
    draft.colors.usage.forbiddenCombos.push({ a: all[0].hex, b: all[1].hex, max: 10, note: '' });
    renderCombos(); markDirty();
  });

  // ---------- B. Logo intelligence + zone editor ----------
  bindNumber('#ad-clearspace', v => { draft.logo.clearspaceRatio = +v; });
  bindNumber('#ad-min-size',   v => { draft.logo.minSizePx = +v; });
  bindNumber('#ad-detect',     v => { draft.logo.detectionDensityMin = +v; });
  bindRange('#ad-clear-pass', '#ad-clear-pass-val', v => `${v}%`, v => { draft.logo.clearspacePassPct = +v; });
  bindNumber('#ad-prominence', v => { draft.logo.minProminencePct = +v; });
  bindNumber('#ad-contrast',   v => { draft.logo.minContrastRatio = +v; });
  bindNumber('#ad-weak',       v => { draft.logo.weakConfidenceCap = +v; });

  $('#ad-logo-upload').addEventListener('change', e => {
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      draft.logo.files = draft.logo.files || [];
      draft.logo.files.push({ name: f.name, dataUrl: reader.result });
      renderLogoFiles(); markDirty();
    };
    reader.readAsDataURL(f);
  });
  function renderLogoFiles(){
    const el = $('#ad-logo-files');
    el.innerHTML = '';
    (draft.logo.files || []).forEach((f, i) => {
      const card = document.createElement('div');
      card.className = 'logo-file';
      card.innerHTML = `
        <div class="lf-thumb"><img src="${f.dataUrl}" alt="${escape(f.name)}" /></div>
        <div class="lf-meta"><b>${escape(f.name)}</b><span class="muted" style="font-size:.74rem">${(f.dataUrl.length/1024|0)} KB</span></div>
        <button class="ci-btn danger">×</button>
      `;
      card.querySelector('button').addEventListener('click', () => { draft.logo.files.splice(i,1); renderLogoFiles(); markDirty(); });
      el.appendChild(card);
    });
    if(!(draft.logo.files || []).length){ el.innerHTML = '<p class="muted" style="font-size:.84rem;margin:0">No logo files uploaded yet.</p>'; }
  }

  // Zone editor — drag/move/resize on a normalized 0..1 canvas
  function renderZones(){
    const canvas = $('#ad-zone-canvas');
    canvas.innerHTML = '';
    if(!draft.logo.zones) draft.logo.zones = [];
    draft.logo.zones.forEach((z, i) => {
      const el = document.createElement('div');
      el.className = 'zone-rect';
      el.style.left = (z.x*100) + '%';
      el.style.top = (z.y*100) + '%';
      el.style.width = (z.w*100) + '%';
      el.style.height = (z.h*100) + '%';
      el.innerHTML = `
        <span class="zone-label" contenteditable="true">${escape(z.name||'Zone')}</span>
        <span class="zone-handle"></span>
        <button class="zone-del" aria-label="delete">×</button>
      `;
      bindZoneEvents(el, i);
      canvas.appendChild(el);
    });
  }
  function bindZoneEvents(el, i){
    const zone = draft.logo.zones[i];
    const labelEl = $('.zone-label', el);
    labelEl.addEventListener('input', () => { zone.name = labelEl.textContent.trim(); markDirty(); });
    $('.zone-del', el).addEventListener('click', () => { draft.logo.zones.splice(i,1); renderZones(); markDirty(); });
    let mode = null, start = {};
    el.addEventListener('pointerdown', e => {
      if(e.target.classList.contains('zone-del') || e.target.classList.contains('zone-label')) return;
      const handle = e.target.classList.contains('zone-handle');
      mode = handle ? 'resize' : 'move';
      start = { x: e.clientX, y: e.clientY, zone: {...zone} };
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    el.addEventListener('pointermove', e => {
      if(!mode) return;
      const canvas = $('#ad-zone-canvas').getBoundingClientRect();
      const dx = (e.clientX - start.x) / canvas.width;
      const dy = (e.clientY - start.y) / canvas.height;
      if(mode === 'move'){
        zone.x = Math.max(0, Math.min(1 - zone.w, start.zone.x + dx));
        zone.y = Math.max(0, Math.min(1 - zone.h, start.zone.y + dy));
      } else {
        zone.w = Math.max(0.05, Math.min(1 - zone.x, start.zone.w + dx));
        zone.h = Math.max(0.05, Math.min(1 - zone.y, start.zone.h + dy));
      }
      el.style.left = (zone.x*100)+'%'; el.style.top = (zone.y*100)+'%';
      el.style.width = (zone.w*100)+'%'; el.style.height = (zone.h*100)+'%';
      markDirty();
    });
    el.addEventListener('pointerup', () => { mode = null; });
  }
  $('#ad-zone-add').addEventListener('click', () => {
    if(!draft.logo.zones) draft.logo.zones = [];
    draft.logo.zones.push({ name:'New zone', x:0.35, y:0.40, w:0.30, h:0.20 });
    renderZones(); markDirty();
  });

  // ---------- C. Grid ----------
  bindNumber('#ad-grid-unit',   v => { draft.grid.unit = +v; renderGridPreview(); });
  bindNumber('#ad-grid-cols',   v => { draft.grid.columns = +v; renderGridPreview(); });
  bindNumber('#ad-grid-gutter', v => { draft.grid.gutter = +v; renderGridPreview(); });
  function renderGridPreview(){
    const el = $('#ad-grid-preview'); if(!el) return;
    el.style.gridTemplateColumns = `repeat(${draft.grid.columns}, 1fr)`;
    el.style.gap = (draft.grid.gutter / 2) + 'px';
    el.innerHTML = Array.from({length: draft.grid.columns}, () => '<span></span>').join('');
  }

  // ---------- D. Typography ----------
  function renderChips(target, list, onRemove){
    const el = $(target); el.innerHTML = '';
    list.forEach((v, i) => {
      const c = document.createElement('span'); c.className = 'chip';
      c.innerHTML = `${escape(String(v))}<button aria-label="remove">×</button>`;
      c.querySelector('button').addEventListener('click', () => onRemove(i));
      el.appendChild(c);
    });
  }
  function bindChipAdder(inputSel, btnSel, list, target, parser){
    const input = $(inputSel);
    function add(){
      const raw = input.value.trim(); if(!raw) return;
      const v = parser ? parser(raw) : raw;
      if(v == null || v === '' || (typeof v === 'number' && isNaN(v))) return;
      if(list.includes(v)){ input.value=''; return; }
      list.push(v); input.value = '';
      renderChips(target, list, idx => { list.splice(idx,1); renderChips(target, list, arguments.callee); markDirty(); });
      markDirty();
    }
    $(btnSel).addEventListener('click', add);
    input.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); add(); } });
  }
  function syncTypoChips(){
    renderChips('#ad-fonts',   draft.typography.fonts,   i => { draft.typography.fonts.splice(i,1); syncTypoChips(); markDirty(); });
    renderChips('#ad-weights', draft.typography.weights, i => { draft.typography.weights.splice(i,1); syncTypoChips(); markDirty(); });
  }
  bindChipAdder('#ad-font-input', '#ad-font-add', draft.typography.fonts, '#ad-fonts');
  bindChipAdder('#ad-weight-input', '#ad-weight-add', draft.typography.weights, '#ad-weights', s => parseInt(s, 10));
  bindNumber('#ad-words-max',  v => { draft.typography.maxHeadlineWords = +v; });
  bindNumber('#ad-words-pref', v => { draft.typography.preferredHeadlineWords = +v; });
  bindNumber('#ad-line-height',v => { draft.typography.lineHeight = +v; });
  bindCheck ('#ad-no-allcaps', v => { draft.typography.forbidAllCapsHeadlines = v; });
  bindNumber('#ad-read-floor', v => { draft.typography.readabilityFloor = +v; });
  bindNumber('#ad-hier-floor', v => { draft.typography.hierarchyFloor = +v; });

  // ---------- E. Voice + multi-axis tone ----------
  bindText('#ad-voice-tone', v => { draft.voice.tone = v; });
  function syncVoiceChips(){
    renderChips('#ad-voice-good', draft.voice.good, i => { draft.voice.good.splice(i,1); syncVoiceChips(); markDirty(); });
    renderChips('#ad-voice-bad',  draft.voice.bad,  i => { draft.voice.bad.splice(i,1);  syncVoiceChips(); markDirty(); });
  }
  bindChipAdder('#ad-voice-good-input','#ad-voice-good-add', draft.voice.good, '#ad-voice-good');
  bindChipAdder('#ad-voice-bad-input', '#ad-voice-bad-add',  draft.voice.bad,  '#ad-voice-bad');

  // Tone axes: build a card per axis with chip lists
  function renderToneAxes(){
    const el = $('#ad-tone-axes'); if(!el) return;
    if(!draft.voice.tones) draft.voice.tones = E.DEFAULTS().voice.tones;
    const axes = Object.keys(draft.voice.tones);
    el.innerHTML = axes.map(k => `
      <div class="rs-card tone-axis" data-axis="${k}">
        <b>${cap(k)}</b>
        <div class="chip-list" data-list></div>
        <div class="row" style="gap:8px;margin-top:10px">
          <input type="text" data-add placeholder="add a keyword…" class="rs-inline-input" />
          <button class="ci-btn primary" data-btn>Add</button>
        </div>
      </div>
    `).join('');
    axes.forEach(k => {
      const card = el.querySelector(`[data-axis="${k}"]`);
      const list = draft.voice.tones[k];
      const target = $('[data-list]', card);
      function repaint(){
        target.innerHTML = '';
        list.forEach((kw, i) => {
          const chip = document.createElement('span'); chip.className = 'chip';
          chip.innerHTML = `${escape(kw)}<button>×</button>`;
          chip.querySelector('button').addEventListener('click', () => { list.splice(i,1); repaint(); markDirty(); });
          target.appendChild(chip);
        });
      }
      const input = $('[data-add]', card), btn = $('[data-btn]', card);
      function add(){
        const v = input.value.trim().toLowerCase(); if(!v) return;
        if(!list.includes(v)){ list.push(v); markDirty(); }
        input.value = ''; repaint();
      }
      btn.addEventListener('click', add);
      input.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); add(); }});
      repaint();
    });
  }
  function renderToneVector(){
    const el = $('#ad-tone-vector'); if(!el) return;
    if(!draft.voice.brandToneVector) draft.voice.brandToneVector = E.DEFAULTS().voice.brandToneVector;
    const v = draft.voice.brandToneVector;
    const keys = Object.keys(v);
    el.innerHTML = keys.map(k => `
      <label class="field">
        <span>${cap(k)} <b style="font-family:'JetBrains Mono',monospace">${Math.round((v[k]||0)*100)}%</b></span>
        <input type="range" min="0" max="100" value="${Math.round((v[k]||0)*100)}" data-axis="${k}" />
      </label>
    `).join('');
    $$('input[type="range"]', el).forEach(inp => {
      inp.addEventListener('input', () => {
        v[inp.dataset.axis] = (+inp.value) / 100;
        // normalise to sum 1
        const sum = keys.reduce((a,k) => a + (v[k]||0), 0);
        if(sum > 0) keys.forEach(k => v[k] = v[k] / sum);
        // refresh labels but DON'T rebuild full DOM — just update <b>%</b>
        $$('label.field', el).forEach((lbl, idx) => {
          const span = lbl.querySelector('b');
          span.textContent = Math.round((v[keys[idx]]||0)*100) + '%';
        });
        markDirty();
      });
    });
  }
  function renderRewrites(){
    const el = $('#ad-rewrites'); if(!el) return;
    if(!draft.voice.rewriteHints) draft.voice.rewriteHints = [];
    el.innerHTML = draft.voice.rewriteHints.map((h, i) => `
      <div class="rewrite-row">
        <input type="text" data-k="from" value="${escape(h.from||'')}" placeholder="from" />
        <span>→</span>
        <input type="text" data-k="to" value="${escape(h.to||'')}" placeholder="to" />
        <button class="ci-btn danger" data-i="${i}">×</button>
      </div>
    `).join('') || '<p class="muted" style="font-size:.78rem;margin:0">No hints — the brain will fall back to brand examples.</p>';
    $$('.rewrite-row', el).forEach((row, i) => {
      $$('input', row).forEach(inp => inp.addEventListener('input', e => { draft.voice.rewriteHints[i][inp.dataset.k] = inp.value; markDirty(); }));
      row.querySelector('button').addEventListener('click', () => { draft.voice.rewriteHints.splice(i,1); renderRewrites(); markDirty(); });
    });
  }
  $('#ad-rewrite-add').addEventListener('click', () => {
    const f = $('#ad-rewrite-from').value.trim(), t = $('#ad-rewrite-to').value.trim();
    if(!f || !t) return;
    if(!draft.voice.rewriteHints) draft.voice.rewriteHints = [];
    draft.voice.rewriteHints.push({ from: f, to: t });
    $('#ad-rewrite-from').value = ''; $('#ad-rewrite-to').value = '';
    renderRewrites(); markDirty();
  });
  bindRange('#ad-tone-pass', '#ad-tone-pass-val', v => `${v}% match required`, v => { draft.voice.toneMatchPassPct = +v; });

  // ---------- F. Platforms (existing) + visual builder ----------
  function renderPlatforms(){
    const el = $('#ad-platforms');
    el.innerHTML = `<div class="pt-row pt-head"><div>Label</div><div>Width</div><div>Height</div><div>Safe %</div><div></div></div>` +
      draft.platforms.map((p, i) => `
        <div class="pt-row" data-i="${i}">
          <div><input type="text" data-k="label" value="${escape(p.label)}" /></div>
          <div><input type="number" min="100" data-k="w" value="${p.w}" /></div>
          <div><input type="number" min="100" data-k="h" value="${p.h}" /></div>
          <div><input type="number" min="0" max="40" data-k="safeInsetPct" value="${p.safeInsetPct}" /></div>
          <div><button class="ci-btn danger pt-del">×</button></div>
        </div>
      `).join('');
    $$('.pt-row[data-i] input', el).forEach(inp => {
      inp.addEventListener('input', e => {
        const i = +inp.closest('.pt-row').dataset.i;
        const k = inp.dataset.k;
        const v = inp.type === 'number' ? +inp.value : inp.value;
        draft.platforms[i][k] = v;
        if(k === 'label' && !draft.platforms[i].id) draft.platforms[i].id = slug(inp.value);
        markDirty(); renderBuilderPicker();
        if(currentBuilderId === draft.platforms[i].id) drawBuilder();
      });
    });
    $$('.pt-del', el).forEach((btn, idx) => btn.addEventListener('click', () => { draft.platforms.splice(idx, 1); renderPlatforms(); renderBuilderPicker(); drawBuilder(); markDirty(); }));
  }
  $('#ad-platform-add').addEventListener('click', () => {
    const id = slug('Platform ' + (draft.platforms.length + 1));
    draft.platforms.push({ id, label:'New platform', w:1080, h:1080, safeInsetPct:8, uiZones:[] });
    renderPlatforms(); renderBuilderPicker(); markDirty();
  });

  let currentBuilderId = null;
  function renderBuilderPicker(){
    const sel = $('#ad-builder-pick');
    if(!draft.platforms.length){ sel.innerHTML = ''; return; }
    sel.innerHTML = draft.platforms.map(p => `<option value="${p.id || slug(p.label)}">${escape(p.label)}</option>`).join('');
    if(!currentBuilderId || !draft.platforms.find(p => (p.id||slug(p.label)) === currentBuilderId)){
      currentBuilderId = draft.platforms[0].id || slug(draft.platforms[0].label);
    }
    sel.value = currentBuilderId;
  }
  $('#ad-builder-pick').addEventListener('change', e => { currentBuilderId = e.target.value; drawBuilder(); });
  function getBuilderPlatform(){ return draft.platforms.find(p => (p.id||slug(p.label)) === currentBuilderId); }
  function drawBuilder(){
    const p = getBuilderPlatform(); if(!p) return;
    const stage = $('#ad-builder-canvas'), safe = $('#ad-builder-safe'), meta = $('#ad-builder-meta');
    const stageRect = $('#ad-builder-stage').getBoundingClientRect();
    const maxW = stageRect.width - 40, maxH = 320;
    const ar = p.w / p.h;
    let w = maxW, h = maxW / ar;
    if(h > maxH){ h = maxH; w = maxH * ar; }
    stage.style.width = w + 'px'; stage.style.height = h + 'px';
    const inset = (p.safeInsetPct || 0) / 100;
    safe.style.inset = (inset * 100) + '%';
    meta.innerHTML = `<b>${escape(p.label)}</b> · ${p.w}×${p.h} · safe ${p.safeInsetPct}%`;
    $('#ad-builder-inset').value = p.safeInsetPct || 0;
    $('#ad-builder-inset-val').textContent = (p.safeInsetPct || 0) + '%';
  }
  $('#ad-builder-inset').addEventListener('input', e => {
    const p = getBuilderPlatform(); if(!p) return;
    p.safeInsetPct = +e.target.value;
    $('#ad-builder-inset-val').textContent = p.safeInsetPct + '%';
    drawBuilder();
    $$('#ad-platforms .pt-row[data-i]').forEach((row, i) => {
      if((draft.platforms[i].id||slug(draft.platforms[i].label)) === currentBuilderId){
        row.querySelector('input[data-k="safeInsetPct"]').value = p.safeInsetPct;
      }
    });
    markDirty();
  });
  let dragging = false;
  const safeBox = $('#ad-builder-safe');
  safeBox.addEventListener('pointerdown', e => { dragging = true; safeBox.setPointerCapture(e.pointerId); });
  safeBox.addEventListener('pointerup',   () => { dragging = false; });
  safeBox.addEventListener('pointermove', e => {
    if(!dragging) return;
    const p = getBuilderPlatform(); if(!p) return;
    const rect = $('#ad-builder-canvas').getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const xPct = Math.min(x, rect.width - x) / rect.width;
    const yPct = Math.min(y, rect.height - y) / rect.height;
    const inset = Math.max(0, Math.min(0.3, Math.min(xPct, yPct)));
    p.safeInsetPct = Math.round(inset * 100);
    drawBuilder(); markDirty();
  });
  window.addEventListener('resize', () => drawBuilder());

  // ---------- G. Quality ----------
  bindNumber('#ad-min-score', v => { draft.quality.minScoreToSubmit = +v; });
  bindNumber('#ad-lock-conf', v => { draft.quality.lockOnFailConfidence = +v; });
  bindNumber('#ad-bpp',       v => { draft.quality.compressionMinBpp = +v; });
  bindCheck ('#ad-require-legal', v => { draft.legal.requireDisclaimer = v; });
  bindText  ('#ad-role-label', v => { draft.branding.reviewerRoleLabel = v; });

  // ---------- H. Scoring weights ----------
  function renderWeights(){
    const el = $('#ad-weights'); if(!el) return;
    if(!draft.quality.weights) draft.quality.weights = E.DEFAULTS().quality.weights;
    const w = draft.quality.weights;
    const keys = ['colors','logo','layout','typography','voice','platform'];
    el.innerHTML = keys.map(k => `
      <div class="weight-row">
        <span class="w-name">${cap(k)}</span>
        <input type="range" min="0" max="60" value="${w[k]||0}" data-cat="${k}" />
        <b class="w-val" data-vfor="${k}">${w[k]||0}%</b>
      </div>
    `).join('');
    const total = keys.reduce((a,k) => a + (w[k]||0), 0);
    $('#ad-weight-total').textContent = total;
    renderWeightBar();
    $$('input[type="range"]', el).forEach(inp => {
      inp.addEventListener('input', () => {
        const k = inp.dataset.cat;
        w[k] = +inp.value;
        // Normalise so sum = 100
        const sum = keys.reduce((a,kk) => a + (w[kk]||0), 0);
        if(sum > 0) keys.forEach(kk => w[kk] = Math.round((w[kk]||0) * 100 / sum));
        // Sync labels and other ranges
        keys.forEach(kk => {
          const r = el.querySelector(`input[data-cat="${kk}"]`);
          const v = el.querySelector(`b[data-vfor="${kk}"]`);
          r.value = w[kk]; v.textContent = w[kk] + '%';
        });
        $('#ad-weight-total').textContent = keys.reduce((a,kk) => a + w[kk], 0);
        renderWeightBar();
        markDirty();
      });
    });
  }
  function renderWeightBar(){
    const bar = $('#ad-weight-bar'); if(!bar) return;
    const w = draft.quality.weights;
    const colors = { colors:'#F2CD00', logo:'#0A0A0A', layout:'#00BFB3', typography:'#1E3A5F', voice:'#B5365A', platform:'#6C5CE7' };
    const keys = ['colors','logo','layout','typography','voice','platform'];
    bar.innerHTML = keys.map(k => `<span title="${cap(k)} ${w[k]||0}%" style="flex:${w[k]||0};background:${colors[k]}"></span>`).join('');
  }
  bindNumber('#ad-style-floor', v => { draft.quality.styleMatchFloor = +v; });

  // ---------- I. Relations ----------
  function renderRelations(){
    const el = $('#ad-relations'); if(!el) return;
    if(!draft.quality.relations) draft.quality.relations = E.DEFAULTS().quality.relations;
    const triggers = ['colors.fail','logo.fail','logo.weak','layout.fail','typography.fail','voice.fail','platform.fail'];
    const targets = ['global.severity','colors.severity','logo.severity','layout.severity','typography.severity','voice.severity','platform.severity'];
    el.innerHTML = `
      <div class="rel-row rel-head">
        <div>When</div><div>Then apply</div><div>Factor ×</div><div>Note</div><div></div>
      </div>` +
      draft.quality.relations.map((r, i) => `
        <div class="rel-row" data-i="${i}">
          <div><select data-k="when">${triggers.map(t => `<option value="${t}" ${t===r.when?'selected':''}>${t}</option>`).join('')}</select></div>
          <div><select data-k="then">${targets.map(t => `<option value="${t}" ${t===r.then?'selected':''}>${t}</option>`).join('')}</select></div>
          <div><input type="number" step="0.05" min="0.5" max="3" data-k="factor" value="${r.factor||1}" /></div>
          <div><input type="text" data-k="note" value="${escape(r.note||'')}" /></div>
          <div><button class="ci-btn danger rel-del">×</button></div>
        </div>
      `).join('');
    $$('.rel-row[data-i]', el).forEach(row => {
      const i = +row.dataset.i;
      $$('select, input', row).forEach(inp => inp.addEventListener('input', () => {
        const v = inp.type === 'number' ? +inp.value : inp.value;
        draft.quality.relations[i][inp.dataset.k] = v;
        markDirty();
      }));
      row.querySelector('.rel-del').addEventListener('click', () => { draft.quality.relations.splice(i,1); renderRelations(); markDirty(); });
    });
  }
  $('#ad-relation-add').addEventListener('click', () => {
    if(!draft.quality.relations) draft.quality.relations = [];
    draft.quality.relations.push({ when:'colors.fail', then:'global.severity', factor:1.1, note:'' });
    renderRelations(); markDirty();
  });

  // ---------- J. Learning ----------
  bindCheck('#ad-learning-auto', v => { draft.learning = draft.learning || E.DEFAULTS().learning; draft.learning.autoAdjust = v; });
  $('#ad-clear-learning').addEventListener('click', () => {
    if(!confirm('Clear learning history? Tolerances & weights will not be reset.')) return;
    E.clearLearning();
    draft = E.currentRules(); baseline = JSON.stringify(draft);
    renderLearningPanel();
  });
  function renderLearningPanel(){
    const stats = $('#ad-learning-stats');
    const rulesEl = $('#ad-learning-rules');
    const sugg = $('#ad-learning-suggestions');
    const insights = E.getInsights();
    if(!insights.runs){
      stats.innerHTML = '<p class="muted" style="font-size:.84rem;margin:0">No audits recorded yet — run one in the agent.</p>';
      rulesEl.innerHTML = ''; sugg.innerHTML = '';
      return;
    }
    stats.innerHTML = `
      <div class="learning-stat"><b>${insights.runs}</b><span>audits</span></div>
      <div class="learning-stat"><b>${insights.avgScore.toFixed(0)}</b><span>avg score</span></div>
      <div class="learning-stat"><b>${(insights.overrideRate*100).toFixed(0)}%</b><span>override rate</span></div>
    `;
    rulesEl.innerHTML = `
      <div class="rel-row rel-head"><div>Rule</div><div>Runs</div><div>AI verdicts</div><div>Human</div><div>Override rate</div></div>` +
      Object.entries(insights.perRule).map(([rule, c]) => {
        const rate = (c.overrides / c.runs * 100) | 0;
        return `<div class="rel-row">
          <div><b>${escape(rule)}</b></div>
          <div>${c.runs}</div>
          <div><span class="mini-pill pass">P${c.aiPass||0}</span> <span class="mini-pill review">R${c.aiReview||0}</span> <span class="mini-pill fail">F${c.aiFail||0}</span></div>
          <div><span class="mini-pill pass">P${c.humanPass||0}</span> <span class="mini-pill fail">F${c.humanFail||0}</span></div>
          <div><b style="color:${rate>40?'#B91C1C':rate>20?'#A16207':'var(--ink-2)'}">${rate}%</b></div>
        </div>`;
      }).join('');
    sugg.innerHTML = insights.suggestions.length
      ? insights.suggestions.map(s => `<div class="suggestion-card"><b>↗ Suggestion</b><p>${escape(s.text)}</p></div>`).join('')
      : '<p class="muted" style="font-size:.84rem;margin:0">No tuning suggestions yet — keep auditing.</p>';
  }

  // ---------- K. Brand DNA ----------
  bindCheck('#ad-dna-enabled', v => { draft.dna = draft.dna || {enabled:true, references:[]}; draft.dna.enabled = v; });
  function renderDnaPanel(){
    const summary = $('#ad-dna-summary');
    const list = $('#ad-dna-list');
    const dna = E.getDna();
    if(!dna){
      summary.innerHTML = '<p class="muted" style="font-size:.84rem;margin:0">No reference designs yet. In the agent, run an audit and press <i>+ Add as reference</i>.</p>';
      list.innerHTML = '';
      return;
    }
    summary.innerHTML = `
      <div class="dna-grid">
        <div class="dna-card"><span>References</span><b>${dna.refs}</b></div>
        <div class="dna-card"><span>Avg saturation</span><b>${(dna.avgSat*100|0)}%</b></div>
        <div class="dna-card"><span>Edge density</span><b>${(dna.edgeDensity*100|0)}%</b></div>
        <div class="dna-card"><span>Logo presence</span><b>${(dna.logoDensity*100).toFixed(2)}%</b></div>
      </div>
      <div class="dna-palette">
        ${Object.entries(dna.paletteShares).slice(0,8).map(([hex, share]) => `<span class="dna-sw" style="background:${escape(hex)};flex:${(share*100|0)+1}" title="${hex} · ${(share*100|0)}%"></span>`).join('')}
      </div>
    `;
    const refs = (E.currentRules().dna?.references || []);
    list.innerHTML = refs.map((r, i) => `
      <div class="dna-ref">
        <div>
          <b>${escape(r.note || 'reference '+(i+1))}</b>
          <span class="muted" style="font-size:.74rem;margin-left:8px">${new Date(r.when).toLocaleString()}</span>
        </div>
        <div class="dna-mini-pal">
          ${(r.fingerprint.palette||[]).slice(0,5).map(p => `<span style="background:${escape(p.hex)}" title="${p.hex}"></span>`).join('')}
        </div>
        <button class="ci-btn danger" data-rm="${i}">×</button>
      </div>
    `).join('');
    $$('[data-rm]', list).forEach(b => b.addEventListener('click', () => {
      E.removeDnaReference(+b.dataset.rm);
      draft = E.currentRules(); baseline = JSON.stringify(draft);
      renderDnaPanel();
    }));
  }

  // ---------- Versions list ----------
  function renderVersionList(versions){
    const el = $('#ad-version-list');
    el.innerHTML = versions.map(v => `
      <div class="version-row ${v.active?'active':''}">
        <div>
          <div><b>${escape(v.label)}</b>${v.active ? ' <span class="version-active">ACTIVE</span>' : ''}</div>
          <div class="muted" style="font-size:.78rem;margin-top:2px">${escape(v.id)} · saved ${escape(new Date(v.createdAt).toLocaleString())}</div>
          ${v.note ? `<div style="font-size:.84rem;margin-top:6px;color:var(--ink-2)">"${escape(v.note)}"</div>` : ''}
        </div>
        <div class="row" style="gap:6px">
          ${v.active ? '' : `<button class="ci-btn" data-vact="${v.id}">Use this version</button>`}
          ${v.active ? '' : `<button class="ci-btn danger" data-vdel="${v.id}">Delete</button>`}
        </div>
      </div>
    `).join('');
    $$('[data-vact]', el).forEach(b => b.addEventListener('click', () => { E.rollback(b.dataset.vact); draft = E.currentRules(); baseline = JSON.stringify(draft); syncAll(); toast(`Active version → ${b.dataset.vact}`); }));
    $$('[data-vdel]', el).forEach(b => b.addEventListener('click', () => { if(!confirm(`Delete version ${b.dataset.vdel}?`)) return; if(E.deleteVersion(b.dataset.vdel)){ refreshToolbar(); toast('Deleted'); } }));
  }

  // ---------- Sync ----------
  function syncAll(){
    refreshToolbar();
    renderSwatchList('#ad-primary',   draft.colors.primary);
    renderSwatchList('#ad-secondary', draft.colors.secondary);
    setVal('#ad-tolerance',   draft.colors.tolerance);
    $('#ad-tolerance-val').textContent = `ΔE ${draft.colors.tolerance}`;
    setVal('#ad-share-pass',   draft.colors.onBrandSharePassPct);
    setVal('#ad-share-review', draft.colors.onBrandShareReviewPct);
    setVal('#ad-primary-min',  draft.colors.usage?.primaryMinPct || 0);
    renderIdealTable(); renderCombos();

    setVal('#ad-clearspace', draft.logo.clearspaceRatio);
    setVal('#ad-min-size',   draft.logo.minSizePx);
    setVal('#ad-detect',     draft.logo.detectionDensityMin);
    setVal('#ad-clear-pass', draft.logo.clearspacePassPct);
    $('#ad-clear-pass-val').textContent = draft.logo.clearspacePassPct + '%';
    setVal('#ad-prominence', draft.logo.minProminencePct);
    setVal('#ad-contrast',   draft.logo.minContrastRatio);
    setVal('#ad-weak',       draft.logo.weakConfidenceCap);
    renderZones(); renderLogoFiles();

    setVal('#ad-grid-unit',   draft.grid.unit);
    setVal('#ad-grid-cols',   draft.grid.columns);
    setVal('#ad-grid-gutter', draft.grid.gutter);
    renderGridPreview();

    syncTypoChips();
    setVal('#ad-words-max',  draft.typography.maxHeadlineWords);
    setVal('#ad-words-pref', draft.typography.preferredHeadlineWords);
    setVal('#ad-line-height',draft.typography.lineHeight);
    $('#ad-no-allcaps').checked = !!draft.typography.forbidAllCapsHeadlines;
    setVal('#ad-read-floor', draft.typography.readabilityFloor || 60);
    setVal('#ad-hier-floor', draft.typography.hierarchyFloor || 55);

    setVal('#ad-voice-tone', draft.voice.tone);
    syncVoiceChips(); renderToneAxes(); renderToneVector(); renderRewrites();
    setVal('#ad-tone-pass', draft.voice.toneMatchPassPct || 65);
    $('#ad-tone-pass-val').textContent = `${draft.voice.toneMatchPassPct || 65}% match required`;

    renderPlatforms(); renderBuilderPicker(); setTimeout(drawBuilder, 30);

    setVal('#ad-min-score', draft.quality.minScoreToSubmit);
    setVal('#ad-lock-conf', draft.quality.lockOnFailConfidence);
    setVal('#ad-bpp',       draft.quality.compressionMinBpp);
    $('#ad-require-legal').checked = !!draft.legal.requireDisclaimer;
    setVal('#ad-role-label', draft.branding.reviewerRoleLabel);

    renderWeights();
    setVal('#ad-style-floor', draft.quality.styleMatchFloor || 70);
    renderRelations();

    $('#ad-learning-auto').checked = !!(draft.learning && draft.learning.autoAdjust);
    renderLearningPanel();

    $('#ad-dna-enabled').checked = !!(draft.dna && draft.dna.enabled);
    renderDnaPanel();

    renderBI();

    markDirty(true);
  }

  // ---------- helpers ----------
  function setVal(sel, v){ const el = $(sel); if(el) el.value = v; }
  function bindRange(sel, outSel, fmt, set){
    const el = $(sel), out = $(outSel);
    el.addEventListener('input', () => { set(el.value); out.textContent = fmt(el.value); markDirty(); });
  }
  function bindNumber(sel, set){ const el = $(sel); el && el.addEventListener('input', () => { set(el.value); markDirty(); }); }
  function bindText(sel, set){ const el = $(sel); el && el.addEventListener('input', () => { set(el.value); markDirty(); }); }
  function bindCheck(sel, set){ const el = $(sel); el && el.addEventListener('change', () => { set(el.checked); markDirty(); }); }
  function markDirty(silent){
    const isDirty = JSON.stringify(draft) !== baseline;
    dirty.hidden = !isDirty;
    saveInplace.disabled = !isDirty;
  }
  function escape(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  function cap(s){ return s ? s[0].toUpperCase() + s.slice(1) : ''; }
  function toast(msg){
    let t = document.querySelector('.copy-toast');
    if(!t){ t = document.createElement('div'); t.className = 'copy-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1500);
  }

  // Prompt modal
  const pm = $('#ad-prompt'), pmInput = $('#ad-prompt-input');
  let pmOk = null;
  function promptModal(title, help, value, ok){
    $('#ad-prompt-title').textContent = title;
    $('#ad-prompt-help').textContent = help || '';
    pmInput.value = value || '';
    pm.hidden = false;
    setTimeout(() => pmInput.focus(), 30);
    pmOk = ok;
  }
  function closePrompt(){ pm.hidden = true; pmOk = null; }
  $('#ad-prompt-close').addEventListener('click', closePrompt);
  $('#ad-prompt-cancel').addEventListener('click', closePrompt);
  pm.addEventListener('click', e => { if(e.target === pm) closePrompt(); });
  $('#ad-prompt-ok').addEventListener('click', () => { const fn = pmOk; closePrompt(); fn && fn(pmInput.value.trim()); });
  pmInput.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); $('#ad-prompt-ok').click(); }});

  // ---------- Business Intelligence ----------
  function renderBI(){
    const biEl = $('#ad-bi');
    if(!biEl) return;
    const insights = E.getInsights ? E.getInsights() : {};
    const history  = insights.history || [];
    if(!history.length){
      biEl.innerHTML = '<div class="bi-empty">Run audits in the Compliance Agent to generate intelligence data.</div>';
      return;
    }
    const totalRuns = history.length;
    const scores    = history.map(h => h.score || 0);
    const avgScore  = Math.round(scores.reduce((a,b)=>a+b,0)/totalRuns);
    const passRate  = Math.round(scores.filter(s=>s>=85).length/totalRuns*100);
    const ovrRate   = insights.overrideRate || 0;

    // Top failing rules
    const ruleTally = {};
    history.forEach(h => {
      (h.fails    || []).forEach(r => { ruleTally[r] = (ruleTally[r]||0)+1; });
      (h.reviews  || []).forEach(r => { ruleTally[r] = (ruleTally[r]||0)+0.5; });
    });
    const topFails = Object.entries(ruleTally).sort((a,b)=>b[1]-a[1]).slice(0,5);

    // Score trend (last 12 audits)
    const trend = scores.slice(-12);

    biEl.innerHTML = `
      <div class="bi-kpis">
        <div class="bi-kpi"><b>${totalRuns}</b><span>Total audits</span></div>
        <div class="bi-kpi"><b>${avgScore}</b><span>Avg score</span></div>
        <div class="bi-kpi ${passRate>=70?'pass':'fail'}"><b>${passRate}%</b><span>Pass rate</span></div>
        <div class="bi-kpi"><b>${ovrRate}%</b><span>Override rate</span></div>
      </div>
      <div class="bi-charts">
        <div class="bi-chart-sec">
          <div class="bi-chart-label">Score trend — last ${trend.length} audits</div>
          <div class="bi-spark">${buildSparkline(trend)}</div>
        </div>
        <div class="bi-chart-sec">
          <div class="bi-chart-label">Top failure points</div>
          ${topFails.length ? topFails.map(([rule,count])=>`
            <div class="bi-bar-row">
              <span class="bi-bar-label">${escape(rule)}</span>
              <div class="bi-bar-track"><span style="width:${Math.min(100,count/totalRuns*100*1.8).toFixed(0)}%"></span></div>
              <b>${Math.round(count)}</b>
            </div>
          `).join('') : '<p class="muted" style="font-size:.82rem">No failures on record.</p>'}
        </div>
      </div>
    `;
  }

  function buildSparkline(values){
    if(!values.length) return '<div class="bi-empty" style="padding:8px">No data</div>';
    const max = Math.max(...values, 1);
    const bw=8, gap=3, h=56;
    const svgW = values.length*(bw+gap);
    const rects = values.map((v,i)=>{
      const bh = Math.max(2, Math.round((v/100)*h));
      const cls = v>=85?'sp-pass':v>=60?'sp-review':'sp-fail';
      return `<rect x="${i*(bw+gap)}" y="${h-bh}" width="${bw}" height="${bh}" class="${cls}" rx="2"><title>${v}/100</title></rect>`;
    }).join('');
    return `<svg width="${svgW}" height="${h}" viewBox="0 0 ${svgW} ${h}" class="sparkline">${rects}</svg>`;
  }

  $('#ad-bi-refresh')?.addEventListener('click', renderBI);

  $('#ad-bi-export-csv')?.addEventListener('click', () => {
    const insights = E.getInsights ? E.getInsights() : {};
    const history  = insights.history || [];
    if(!history.length){ toast('No audit data yet'); return; }
    const rows = ['Score,Fails,Reviews,Overrides,Version,When'];
    history.forEach(h=>{
      rows.push([h.score||0,(h.fails||[]).join('|'),(h.reviews||[]).join('|'),h.overrides||0,h.ruleVersion||'',h.when||''].join(','));
    });
    const blob = new Blob([rows.join('\n')],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='qi-audit-history.csv'; a.click();
    toast('CSV exported');
  });

  $('#ad-bi-export-json')?.addEventListener('click', () => {
    const insights = E.getInsights ? E.getInsights() : {};
    const blob = new Blob([JSON.stringify(insights, null, 2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='qi-brand-intelligence.json'; a.click();
    toast('JSON exported');
  });

  // TOC
  const tocLinks = $$('.admin-toc a[href^="#"]');
  if(tocLinks.length){
    const map = new Map();
    tocLinks.forEach(a => { const id = a.getAttribute('href').slice(1); const sec = document.getElementById(id); if(sec) map.set(sec, a); });
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        const a = map.get(en.target); if(!a) return;
        if(en.isIntersecting){ tocLinks.forEach(l => l.classList.remove('active')); a.classList.add('active'); }
      });
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });
    map.forEach((_, sec) => io.observe(sec));
  }

  syncAll();
})();
