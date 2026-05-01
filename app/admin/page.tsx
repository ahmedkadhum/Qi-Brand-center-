'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useBrandEngine } from '@/contexts/BrandEngineContext'
import type { BrandRules, PaletteColor } from '@/lib/brand-engine'

export default function AdminPage() {
  const { engine, rules: liveRules } = useBrandEngine()
  const [draft, setDraft] = useState<BrandRules | null>(null)
  const [baseline, setBaseline] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([])
  const [activeBrandId, setActiveBrandId] = useState('')
  const [versions, setVersions] = useState<Array<{ id: string; label: string; note: string; active?: boolean }>>([])
  const [activeVersionId, setActiveVersionId] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const [activeSection, setActiveSection] = useState('sec-colors')

  useEffect(() => {
    if (!engine || !liveRules) return
    const r = engine.currentRules()
    setDraft(r)
    setBaseline(JSON.stringify(r))
    setBrands(engine.listBrands())
    setActiveBrandId(engine.activeBrand())
    setVersions(engine.listVersions())
    const cur = engine.currentVersion()
    setActiveVersionId(cur.id)
  }, [engine, liveRules])

  function toast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2000)
  }

  function markDirty() {
    setIsDirty(JSON.stringify(draft) !== baseline)
  }

  function updateDraft(updater: (d: BrandRules) => BrandRules) {
    setDraft(prev => {
      if (!prev) return prev
      const next = updater(JSON.parse(JSON.stringify(prev)))
      setIsDirty(JSON.stringify(next) !== baseline)
      return next
    })
  }

  function saveChanges() {
    if (!draft || !engine) return
    engine.updateActiveDraft(draft)
    setBaseline(JSON.stringify(draft))
    setIsDirty(false)
    toast('Saved to active version')
  }

  function discard() {
    if (!engine) return
    const r = engine.currentRules()
    setDraft(r)
    setBaseline(JSON.stringify(r))
    setIsDirty(false)
    toast('Discarded')
  }

  function resetSection(key: keyof BrandRules) {
    if (!engine) return
    const def = engine.DEFAULTS()
    updateDraft(d => { (d as unknown as Record<string, unknown>)[key] = (def as unknown as Record<string, unknown>)[key]; return d })
    toast(`Reset ${key} to defaults`)
  }

  if (!draft || !engine) {
    return (
      <section className="container" style={{ padding: '80px 0' }}>
        <p className="muted">Loading brand engine…</p>
      </section>
    )
  }

  return (
    <>
      {/* ADMIN HEADER */}
      <section className="container page-head reveal" style={{ gridTemplateColumns: '1fr', paddingBottom: '24px' }}>
        <div>
          <div className="crumbs"><Link href="/">Brand Center</Link> / <Link href="/compliance">Compliance Agent</Link> / Brand Settings</div>
          <div className="row" style={{ gap: '8px', marginTop: '8px' }}>
            <span className="eyebrow">Section 13 — Rule Engine</span>
            <span className="ai-badge"><span className="ai-pulse"></span> Admin · multi-brand · versioned</span>
          </div>
          <h1 className="h-display mt-12" style={{ fontSize: 'clamp(2.2rem,5vw,4.4rem)' }}>Brand brain.</h1>
          <p className="lead mt-12" style={{ maxWidth: '60ch' }}>Every rule the AI Guardian enforces lives here as data — colors, logo geometry, type, voice, platforms, scoring thresholds. Edit them and the next audit reacts immediately.</p>
        </div>
      </section>

      {/* TOOLBAR */}
      <section className="container" style={{ paddingTop: '0' }}>
        <div className="admin-toolbar">
          <div className="atb-group">
            <label className="atb-field">
              <span>Active brand</span>
              <select value={activeBrandId} onChange={e => {
                engine.setActiveBrand(e.target.value)
                setActiveBrandId(e.target.value)
                const r = engine.currentRules()
                setDraft(r); setBaseline(JSON.stringify(r)); setIsDirty(false)
                setBrands(engine.listBrands()); setVersions(engine.listVersions())
              }}>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <button className="ci-btn" onClick={() => {
              const name = prompt('New brand name:')
              if (!name) return
              const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
              if (engine.createBrand(id, name)) { setBrands(engine.listBrands()); setActiveBrandId(id); const r = engine.currentRules(); setDraft(r); setBaseline(JSON.stringify(r)); toast(`Created "${name}"`) }
              else toast('Brand already exists')
            }}>+ New brand</button>
            <button className="ci-btn" onClick={() => {
              const cur = brands.find(b => b.id === activeBrandId)
              const name = prompt('Rename to:', cur?.name || '')
              if (name) { engine.renameBrand(activeBrandId, name); setBrands(engine.listBrands()); toast('Renamed') }
            }}>Rename</button>
            <button className="ci-btn danger" onClick={() => {
              if (!confirm('Delete this brand and all its versions?')) return
              if (engine.deleteBrand(activeBrandId)) {
                const newActive = engine.activeBrand()
                setActiveBrandId(newActive); setBrands(engine.listBrands())
                const r = engine.currentRules(); setDraft(r); setBaseline(JSON.stringify(r))
                toast('Brand deleted')
              } else toast('Cannot delete the only brand')
            }}>Delete</button>
          </div>

          <div className="atb-group">
            <label className="atb-field">
              <span>Active version</span>
              <select value={activeVersionId} onChange={e => setActiveVersionId(e.target.value)}>
                {versions.map(v => <option key={v.id} value={v.id}>{v.label}{v.active ? ' · active' : ''}</option>)}
              </select>
            </label>
            <button className="ci-btn" onClick={() => {
              if (engine.rollback(activeVersionId)) { const r = engine.currentRules(); setDraft(r); setBaseline(JSON.stringify(r)); setIsDirty(false); setVersions(engine.listVersions()); toast(`Rolled back to ${activeVersionId}`) }
            }}>Use version</button>
            <button className="ci-btn danger" onClick={() => {
              if (!confirm(`Delete version ${activeVersionId}?`)) return
              if (engine.deleteVersion(activeVersionId)) { setVersions(engine.listVersions()); toast('Deleted') }
              else toast('Cannot delete active or last version')
            }}>Delete</button>
          </div>

          <div className="atb-group" style={{ marginLeft: 'auto' }}>
            {isDirty && <span className="dirty-pill">● Unsaved changes</span>}
            <button className="ci-btn" onClick={discard}>Discard</button>
            <button className="ci-btn" onClick={saveChanges}>Save changes</button>
            <button className="ci-btn primary" onClick={() => {
              const note = prompt('Version note:') || ''
              const id = engine.saveVersion(draft, note)
              setBaseline(JSON.stringify(draft)); setIsDirty(false); setVersions(engine.listVersions()); setActiveVersionId(id); toast(`Saved as ${id}`)
            }}>Save as new version ↗</button>
          </div>
        </div>
      </section>

      {/* ADMIN LAYOUT */}
      <section className="container" style={{ padding: '24px 0 48px' }}>
        <div className="admin-shell">
          {/* TOC */}
          <aside className="admin-toc">
            <h4>Sections</h4>
            <ol>
              {[
                ['sec-colors', 'A. Color palette'],
                ['sec-logo', 'B. Logo intelligence'],
                ['sec-grid', 'C. Grid & layout'],
                ['sec-type', 'D. Typography'],
                ['sec-voice', 'E. Tone of voice'],
                ['sec-platforms', 'F. Platforms & safe zones'],
                ['sec-quality', 'G. Scoring & legal'],
                ['sec-weights', 'H. Scoring weights'],
                ['sec-relations', 'I. Rule relations'],
                ['sec-learning', 'J. Learning insights'],
                ['sec-dna', 'K. Brand DNA'],
                ['sec-bi', 'M. Business intelligence'],
                ['sec-versions', 'L. Version history'],
              ].map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className={activeSection === id ? 'active' : ''} onClick={() => setActiveSection(id)}>{label}</a>
                </li>
              ))}
            </ol>
            <Link href="/compliance" className="ci-btn" style={{ marginTop: '24px', justifyContent: 'center' }}>Test in agent →</Link>
          </aside>

          <main className="admin-main">
            {/* A. Colors */}
            <section className="rule-section" id="sec-colors">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">A — Color palette</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Approved swatches.</h2>
                  <p className="muted" style={{ marginTop: '6px', fontSize: '.92rem', maxWidth: '60ch' }}>The AI matches every dominant color in a design against this list. Tolerance controls how generous the match is (ΔE76).</p>
                </div>
                <button className="ci-btn" onClick={() => resetSection('colors')}>Reset to defaults</button>
              </div>

              <div className="grid grid-2" style={{ marginTop: '18px' }}>
                <div className="rs-card">
                  <div className="between"><b>Primary palette</b>
                    <button className="ci-btn primary" onClick={() => updateDraft(d => { d.colors.primary.push({ name: 'New color', hex: '#CCCCCC', idealSharePct: 0 }); return d })}>+ Add color</button>
                  </div>
                  <div className="swatch-list">
                    {draft.colors.primary.map((c, i) => (
                      <div key={i} className="swatch-row-edit">
                        <span className="sw" style={{ background: c.hex }}></span>
                        <input className="sw-name" type="text" value={c.name} onChange={e => updateDraft(d => { d.colors.primary[i].name = e.target.value; return d })} />
                        <input className="sw-hex" type="text" value={c.hex} maxLength={7} onChange={e => updateDraft(d => { d.colors.primary[i].hex = e.target.value.toUpperCase(); return d })} />
                        <input className="sw-color" type="color" value={c.hex} onChange={e => updateDraft(d => { d.colors.primary[i].hex = e.target.value.toUpperCase(); return d })} />
                        <input className="sw-ideal" type="number" min="0" max="100" value={c.idealSharePct || 0} onChange={e => updateDraft(d => { d.colors.primary[i].idealSharePct = +e.target.value; return d })} />
                        <button className="ci-btn danger" onClick={() => updateDraft(d => { d.colors.primary.splice(i, 1); return d })}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rs-card">
                  <div className="between"><b>Secondary / cohort palette</b>
                    <button className="ci-btn primary" onClick={() => updateDraft(d => { d.colors.secondary.push({ name: 'New color', hex: '#AAAAAA' }); return d })}>+ Add color</button>
                  </div>
                  <div className="swatch-list">
                    {draft.colors.secondary.map((c, i) => (
                      <div key={i} className="swatch-row-edit">
                        <span className="sw" style={{ background: c.hex }}></span>
                        <input className="sw-name" type="text" value={c.name} onChange={e => updateDraft(d => { d.colors.secondary[i].name = e.target.value; return d })} />
                        <input className="sw-hex" type="text" value={c.hex} maxLength={7} onChange={e => updateDraft(d => { d.colors.secondary[i].hex = e.target.value.toUpperCase(); return d })} />
                        <input className="sw-color" type="color" value={c.hex} onChange={e => updateDraft(d => { d.colors.secondary[i].hex = e.target.value.toUpperCase(); return d })} />
                        <button className="ci-btn danger" onClick={() => updateDraft(d => { d.colors.secondary.splice(i, 1); return d })}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rs-card" style={{ marginTop: '14px' }}>
                <div className="grid grid-3" style={{ gap: '18px' }}>
                  <label className="field">
                    <span>Tolerance (ΔE)</span>
                    <input type="range" min="4" max="40" step="1" value={draft.colors.tolerance} onChange={e => updateDraft(d => { d.colors.tolerance = +e.target.value; return d })} />
                    <output className="rs-output">{draft.colors.tolerance}</output>
                  </label>
                  <label className="field">
                    <span>On-brand share to PASS</span>
                    <input type="number" min="50" max="100" value={draft.colors.onBrandSharePassPct} onChange={e => updateDraft(d => { d.colors.onBrandSharePassPct = +e.target.value; return d })} />
                    <span className="rs-suffix">% of canvas</span>
                  </label>
                  <label className="field">
                    <span>On-brand share to REVIEW</span>
                    <input type="number" min="20" max="95" value={draft.colors.onBrandShareReviewPct} onChange={e => updateDraft(d => { d.colors.onBrandShareReviewPct = +e.target.value; return d })} />
                    <span className="rs-suffix">% of canvas</span>
                  </label>
                </div>
              </div>
            </section>

            {/* B. Logo */}
            <section className="rule-section" id="sec-logo">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">B — Logo intelligence</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Brandmark, smarter.</h2>
                </div>
                <button className="ci-btn" onClick={() => resetSection('logo')}>Reset to defaults</button>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                <div className="grid grid-3" style={{ gap: '18px' }}>
                  <label className="field">
                    <span>Clearspace ratio</span>
                    <input type="number" step="0.1" min="0.5" max="3" value={draft.logo.clearspaceRatio} onChange={e => updateDraft(d => { d.logo.clearspaceRatio = +e.target.value; return d })} />
                  </label>
                  <label className="field">
                    <span>Min size (px)</span>
                    <input type="number" min="16" max="400" value={draft.logo.minSizePx} onChange={e => updateDraft(d => { d.logo.minSizePx = +e.target.value; return d })} />
                  </label>
                  <label className="field">
                    <span>Min contrast ratio (WCAG)</span>
                    <input type="number" step="0.1" min="1" max="21" value={draft.logo.minContrastRatio} onChange={e => updateDraft(d => { d.logo.minContrastRatio = +e.target.value; return d })} />
                  </label>
                  <label className="field">
                    <span>Min prominence (%)</span>
                    <input type="number" step="0.1" min="0.1" max="20" value={draft.logo.minProminencePct} onChange={e => updateDraft(d => { d.logo.minProminencePct = +e.target.value; return d })} />
                  </label>
                  <label className="field">
                    <span>Detection density min</span>
                    <input type="number" step="0.001" min="0.001" max="0.5" value={draft.logo.detectionDensityMin} onChange={e => updateDraft(d => { d.logo.detectionDensityMin = +e.target.value; return d })} />
                  </label>
                  <label className="field">
                    <span>Clearspace pass %</span>
                    <input type="number" min="50" max="100" value={draft.logo.clearspacePassPct} onChange={e => updateDraft(d => { d.logo.clearspacePassPct = +e.target.value; return d })} />
                  </label>
                </div>
                <div style={{ marginTop: '14px' }}>
                  <b>Logo zones</b>
                  <p className="muted" style={{ fontSize: '.84rem', margin: '6px 0 10px' }}>Free-form rectangles where the logo may sit (normalized 0–1).</p>
                  {draft.logo.zones.map((z, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px 30px', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <input type="text" value={z.name} onChange={e => updateDraft(d => { d.logo.zones[i].name = e.target.value; return d })} style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)', font: 'inherit', fontSize: '.84rem' }} />
                      {(['x', 'y', 'w', 'h'] as const).map(k => (
                        <input key={k} type="number" step="0.01" min="0" max="1" value={z[k]} onChange={e => updateDraft(d => { (d.logo.zones[i] as unknown as Record<string, unknown>)[k] = +e.target.value; return d })} style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)', font: 'inherit', fontSize: '.84rem' }} />
                      ))}
                      <button className="ci-btn danger" onClick={() => updateDraft(d => { d.logo.zones.splice(i, 1); return d })}>×</button>
                    </div>
                  ))}
                  <button className="ci-btn primary" style={{ marginTop: '8px' }} onClick={() => updateDraft(d => { d.logo.zones.push({ name: 'New zone', x: 0.1, y: 0.1, w: 0.2, h: 0.15 }); return d })}>+ Add zone</button>
                </div>
              </div>
            </section>

            {/* C. Grid */}
            <section className="rule-section" id="sec-grid">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">C — Grid &amp; layout</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Rhythm rules.</h2>
                </div>
                <button className="ci-btn" onClick={() => resetSection('grid')}>Reset to defaults</button>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                <div className="grid grid-3" style={{ gap: '18px' }}>
                  {([['unit', 'Base unit (pt)'], ['columns', 'Columns'], ['gutter', 'Gutter (pt)'], ['alignmentTolerancePx', 'Alignment tolerance (px)'], ['rhythmTargetVarPct', 'Rhythm variance target (%)']] as [keyof typeof draft.grid, string][]).map(([k, label]) => (
                    <label key={k} className="field">
                      <span>{label}</span>
                      <input type="number" value={draft.grid[k] as number} onChange={e => updateDraft(d => { (d.grid as Record<string, unknown>)[k] = +e.target.value; return d })} />
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* D. Typography */}
            <section className="rule-section" id="sec-type">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">D — Typography</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Type rules.</h2>
                </div>
                <button className="ci-btn" onClick={() => resetSection('typography')}>Reset to defaults</button>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                <div className="grid grid-2" style={{ gap: '18px' }}>
                  <label className="field">
                    <span>Approved fonts (comma-separated)</span>
                    <input type="text" value={draft.typography.fonts.join(', ')} onChange={e => updateDraft(d => { d.typography.fonts = e.target.value.split(',').map(s => s.trim()).filter(Boolean); return d })} />
                  </label>
                  <label className="field">
                    <span>Max headline words</span>
                    <input type="number" min="1" max="50" value={draft.typography.maxHeadlineWords} onChange={e => updateDraft(d => { d.typography.maxHeadlineWords = +e.target.value; return d })} />
                  </label>
                  <label className="field">
                    <span>Preferred headline words</span>
                    <input type="number" min="1" max="30" value={draft.typography.preferredHeadlineWords} onChange={e => updateDraft(d => { d.typography.preferredHeadlineWords = +e.target.value; return d })} />
                  </label>
                  <label className="field">
                    <span>Readability floor</span>
                    <input type="number" min="0" max="100" value={draft.typography.readabilityFloor} onChange={e => updateDraft(d => { d.typography.readabilityFloor = +e.target.value; return d })} />
                  </label>
                </div>
                <label className="role-toggle" style={{ marginTop: '14px' }}>
                  <input type="checkbox" checked={draft.typography.forbidAllCapsHeadlines} onChange={e => updateDraft(d => { d.typography.forbidAllCapsHeadlines = e.target.checked; return d })} />
                  <span>Forbid all-caps headlines</span>
                </label>
              </div>
            </section>

            {/* E. Voice */}
            <section className="rule-section" id="sec-voice">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">E — Tone of voice</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Brand voice.</h2>
                </div>
                <button className="ci-btn" onClick={() => resetSection('voice')}>Reset to defaults</button>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                <label className="field">
                  <span>Brand tone descriptor</span>
                  <input type="text" value={draft.voice.tone} onChange={e => updateDraft(d => { d.voice.tone = e.target.value; return d })} />
                </label>
                <div className="grid grid-2" style={{ gap: '14px', marginTop: '14px' }}>
                  <div>
                    <b style={{ fontSize: '.86rem' }}>Good words (comma-separated)</b>
                    <textarea style={{ marginTop: '8px', padding: '8px', borderRadius: '8px', border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)', width: '100%', font: 'inherit', fontSize: '.84rem', resize: 'vertical' }} rows={3} value={draft.voice.good.join(', ')} onChange={e => updateDraft(d => { d.voice.good = e.target.value.split(',').map(s => s.trim()).filter(Boolean); return d })} />
                  </div>
                  <div>
                    <b style={{ fontSize: '.86rem' }}>Banned words (comma-separated)</b>
                    <textarea style={{ marginTop: '8px', padding: '8px', borderRadius: '8px', border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)', width: '100%', font: 'inherit', fontSize: '.84rem', resize: 'vertical' }} rows={3} value={draft.voice.bad.join(', ')} onChange={e => updateDraft(d => { d.voice.bad = e.target.value.split(',').map(s => s.trim()).filter(Boolean); return d })} />
                  </div>
                </div>
              </div>
            </section>

            {/* F. Platforms */}
            <section className="rule-section" id="sec-platforms">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">F — Platforms &amp; safe zones</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Platform specs.</h2>
                </div>
                <button className="ci-btn" onClick={() => resetSection('platforms')}>Reset to defaults</button>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                <div className="platforms-table">
                  <div className="pt-row pt-head">
                    <span>Label</span><span>Width</span><span>Height</span><span>Safe %</span><span></span>
                  </div>
                  {draft.platforms.map((p, i) => (
                    <div key={i} className="pt-row">
                      <input type="text" value={p.label} onChange={e => updateDraft(d => { d.platforms[i].label = e.target.value; return d })} />
                      <input type="number" value={p.w} onChange={e => updateDraft(d => { d.platforms[i].w = +e.target.value; return d })} />
                      <input type="number" value={p.h} onChange={e => updateDraft(d => { d.platforms[i].h = +e.target.value; return d })} />
                      <input type="number" value={p.safeInsetPct} onChange={e => updateDraft(d => { d.platforms[i].safeInsetPct = +e.target.value; return d })} />
                      <button className="ci-btn danger" onClick={() => updateDraft(d => { d.platforms.splice(i, 1); return d })}>×</button>
                    </div>
                  ))}
                </div>
                <button className="ci-btn primary" style={{ marginTop: '10px' }} onClick={() => updateDraft(d => { d.platforms.push({ id: 'custom-' + Date.now(), label: 'Custom platform', w: 1080, h: 1080, safeInsetPct: 5, uiZones: [] }); return d })}>+ Add platform</button>
              </div>
            </section>

            {/* G. Quality */}
            <section className="rule-section" id="sec-quality">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">G — Scoring &amp; legal</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Pass thresholds.</h2>
                </div>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                <div className="grid grid-3" style={{ gap: '18px' }}>
                  <label className="field">
                    <span>Min score to submit</span>
                    <input type="number" min="0" max="100" value={draft.quality.minScoreToSubmit} onChange={e => updateDraft(d => { d.quality.minScoreToSubmit = +e.target.value; return d })} />
                  </label>
                  <label className="field">
                    <span>Lock on FAIL confidence (%)</span>
                    <input type="number" min="0" max="100" value={draft.quality.lockOnFailConfidence} onChange={e => updateDraft(d => { d.quality.lockOnFailConfidence = +e.target.value; return d })} />
                  </label>
                  <label className="field">
                    <span>Reviewer role label</span>
                    <input type="text" value={draft.branding.reviewerRoleLabel} onChange={e => updateDraft(d => { d.branding.reviewerRoleLabel = e.target.value; return d })} />
                  </label>
                </div>
                <label className="role-toggle" style={{ marginTop: '14px' }}>
                  <input type="checkbox" checked={draft.legal.requireDisclaimer} onChange={e => updateDraft(d => { d.legal.requireDisclaimer = e.target.checked; return d })} />
                  <span>Require disclaimer on all assets</span>
                </label>
              </div>
            </section>

            {/* H. Weights */}
            <section className="rule-section" id="sec-weights">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">H — Scoring weights</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Category weights.</h2>
                  <p className="muted" style={{ fontSize: '.84rem', marginTop: '6px' }}>Must sum to 100. Adjust to reflect brand priorities.</p>
                </div>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                <div className="weight-grid">
                  {Object.entries(draft.quality.weights).map(([cat, val]) => (
                    <div key={cat} className="weight-row">
                      <span className="w-name" style={{ textTransform: 'capitalize' }}>{cat}</span>
                      <input type="range" min="0" max="50" value={val} onChange={e => updateDraft(d => { d.quality.weights[cat] = +e.target.value; return d })} />
                      <span className="w-val">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="weight-meta">
                  <span>Total</span>
                  <b>{Object.values(draft.quality.weights).reduce((a, b) => a + b, 0)}</b>
                </div>
              </div>
            </section>

            {/* I. Relations */}
            <section className="rule-section" id="sec-relations">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">I — Rule relations</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Score multipliers.</h2>
                </div>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                <div className="rel-table">
                  <div className="rel-row rel-head">
                    <span>When</span><span>Then</span><span>Factor</span><span>Note</span><span></span>
                  </div>
                  {draft.quality.relations.map((r, i) => (
                    <div key={i} className="rel-row">
                      <input type="text" value={r.when} onChange={e => updateDraft(d => { d.quality.relations[i].when = e.target.value; return d })} />
                      <input type="text" value={r.then} onChange={e => updateDraft(d => { d.quality.relations[i].then = e.target.value; return d })} />
                      <input type="number" step="0.01" min="0.5" max="3" value={r.factor} onChange={e => updateDraft(d => { d.quality.relations[i].factor = +e.target.value; return d })} />
                      <input type="text" value={r.note} onChange={e => updateDraft(d => { d.quality.relations[i].note = e.target.value; return d })} />
                      <button className="ci-btn danger" onClick={() => updateDraft(d => { d.quality.relations.splice(i, 1); return d })}>×</button>
                    </div>
                  ))}
                </div>
                <button className="ci-btn primary" style={{ marginTop: '10px' }} onClick={() => updateDraft(d => { d.quality.relations.push({ when: 'colors.fail', then: 'global.severity', factor: 1.1, note: '' }); return d })}>+ Add relation</button>
              </div>
            </section>

            {/* J. Learning */}
            <section className="rule-section" id="sec-learning">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">J — Learning insights</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Audit history.</h2>
                </div>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                {(() => {
                  const insights = engine.getInsights()
                  return (
                    <>
                      <div className="learning-stats">
                        <div className="learning-stat"><b>{insights.runs}</b><span>audits</span></div>
                        <div className="learning-stat"><b>{Math.round(insights.avgScore)}</b><span>avg score</span></div>
                        <div className="learning-stat"><b>{Math.round(insights.overrideRate * 100)}%</b><span>override rate</span></div>
                      </div>
                      {insights.suggestions.length > 0 && (
                        <div style={{ marginTop: '14px' }}>
                          {insights.suggestions.map((s, i) => (
                            <div key={i} className="suggestion-card">
                              <b>{s.rule}</b>
                              <p>{s.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {insights.runs === 0 && <p className="muted" style={{ fontSize: '.86rem', marginTop: '10px' }}>No audit history yet. Run some audits in the Compliance Agent to see insights here.</p>}
                    </>
                  )
                })()}
              </div>
            </section>

            {/* K. DNA */}
            <section className="rule-section" id="sec-dna">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">K — Brand DNA</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Style fingerprints.</h2>
                </div>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                {(() => {
                  const dna = engine.getDna()
                  const refs = draft.dna?.references || []
                  return (
                    <>
                      {dna ? (
                        <div className="dna-grid">
                          <div className="dna-card"><span>Avg saturation</span><b>{(dna.avgSat * 100).toFixed(0)}%</b></div>
                          <div className="dna-card"><span>Edge density</span><b>{(dna.edgeDensity * 100).toFixed(0)}%</b></div>
                          <div className="dna-card"><span>Logo density</span><b>{(dna.logoDensity * 100).toFixed(2)}%</b></div>
                          <div className="dna-card"><span>References</span><b>{dna.refs}</b></div>
                        </div>
                      ) : (
                        <p className="muted" style={{ fontSize: '.86rem' }}>No DNA references yet. Upload designs in the Compliance Agent and click &quot;Add as reference&quot; to train the DNA model.</p>
                      )}
                      {refs.length > 0 && (
                        <div className="dna-list" style={{ marginTop: '14px' }}>
                          {refs.map((ref, i) => (
                            <div key={i} className="dna-ref">
                              <div>
                                <div style={{ fontSize: '.86rem', fontWeight: 600 }}>{ref.note || 'Reference ' + (i + 1)}</div>
                                <div style={{ fontSize: '.74rem', color: 'var(--ink-3)' }}>{ref.when}</div>
                              </div>
                              <div className="dna-mini-pal">
                                {(ref.fingerprint.palette || []).slice(0, 5).map((p, j) => (
                                  <span key={j} style={{ background: p.hex, width: '18px', display: 'block' }}></span>
                                ))}
                              </div>
                              <button className="ci-btn danger" onClick={() => { engine.removeDnaReference(i); toast('Removed') }}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </section>

            {/* L. Version history */}
            <section className="rule-section" id="sec-versions">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">L — Version history</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>All snapshots.</h2>
                </div>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                <div className="version-list">
                  {versions.map(v => (
                    <div key={v.id} className={`version-row${v.active ? ' active' : ''}`}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.92rem' }}>
                          {v.label}
                          {v.active && <span className="version-active">active</span>}
                        </div>
                        {v.note && <div style={{ fontSize: '.8rem', color: 'var(--ink-3)', marginTop: '2px' }}>{v.note}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!v.active && <button className="ci-btn" onClick={() => { if (engine.rollback(v.id)) { const r = engine.currentRules(); setDraft(r); setBaseline(JSON.stringify(r)); setVersions(engine.listVersions()); setActiveVersionId(v.id); toast(`Rolled back to ${v.id}`) } }}>Use</button>}
                        {!v.active && <button className="ci-btn danger" onClick={() => { if (confirm('Delete?') && engine.deleteVersion(v.id)) { setVersions(engine.listVersions()); toast('Deleted') } }}>×</button>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
                  <button className="ci-btn danger" onClick={() => { if (confirm('Reset ALL brands and versions to factory defaults?')) { engine.resetDefaults(); const r = engine.currentRules(); setDraft(r); setBaseline(JSON.stringify(r)); setBrands(engine.listBrands()); setVersions(engine.listVersions()); toast('Reset to defaults') } }}>Reset everything to factory defaults</button>
                </div>
              </div>
            </section>

            {/* M. Business Intelligence */}
            <section className="rule-section" id="sec-bi">
              <div className="rs-head">
                <div>
                  <span className="eyebrow">M — Business intelligence</span>
                  <h2 className="h-2" style={{ marginTop: '8px' }}>Brand performance.</h2>
                </div>
              </div>
              <div className="rs-card" style={{ marginTop: '18px' }}>
                {(() => {
                  const insights = engine.getInsights()
                  return (
                    <>
                      <div className="bi-kpis">
                        <div className={`bi-kpi${insights.avgScore >= 85 ? ' pass' : ' fail'}`}>
                          <b>{Math.round(insights.avgScore) || '—'}</b>
                          <span>Avg brand score</span>
                        </div>
                        <div className="bi-kpi">
                          <b>{insights.runs}</b>
                          <span>Total audits</span>
                        </div>
                        <div className="bi-kpi">
                          <b>{Math.round(insights.overrideRate * 100)}%</b>
                          <span>Override rate</span>
                        </div>
                        <div className="bi-kpi">
                          <b>{insights.suggestions.length}</b>
                          <span>Suggestions</span>
                        </div>
                      </div>
                      {insights.runs === 0 && <p className="muted" style={{ fontSize: '.86rem', marginTop: '14px' }}>Run audits in the Compliance Agent to populate business intelligence data.</p>}
                    </>
                  )
                })()}
              </div>
            </section>
          </main>
        </div>
      </section>

      {/* Toast */}
      {toastMsg && (
        <div className="copy-toast show">{toastMsg}</div>
      )}
    </>
  )
}
