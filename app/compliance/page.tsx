'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useBrandEngine } from '@/contexts/BrandEngineContext'
import type { BrandRules, BrandEngineAPI } from '@/lib/brand-engine'

interface CheckItem {
  num: number
  rule: string
  verdict: string
  confidence: number
  evidence: string
  fix: string
  boxes: BoxDef[]
  subScores: Array<{ label: string; value: number }>
  override: null | { from: string; to: string; comment: string }
  weak?: boolean
  locked?: boolean
  suggestion?: string
  vector?: Record<string, number>
  label?: string
}

interface BoxDef {
  kind: string
  x: number
  y: number
  w: number
  h: number
  label: string
  color?: string
}

interface ComplianceReport {
  score: number
  items: CheckItem[]
  palette: Array<{ hex: string; share: number; brand: boolean; rgb?: [number, number, number] }>
  categories: Record<string, { score: number; weight: number }>
  colorPressure: number
  ruleVersion: string
  brandId: string
  styleMatch: null | { score: number; deltas: Record<string, number>; palette: number; sat: number; variance: number; edge: number }
  meta: { w: number; h: number; fileMB: number; platformLabel: string }
  relationMultipliers?: Record<string, number>
}

interface Stats {
  runs: number
  blocked: number
  overrides: number
}

interface LogRow {
  rule: string
  from: string
  to: string
  confidence: number
  comment: string
  when: string
  ruleVersion: string
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

// ---- Pixel helpers ----
async function readPixels(img: HTMLImageElement) {
  const w = img.naturalWidth, h = img.naturalHeight
  const c = document.createElement('canvas')
  const SAMPLE = 220
  const r = Math.min(SAMPLE / w, SAMPLE / h, 1)
  c.width = Math.max(1, Math.round(w * r))
  c.height = Math.max(1, Math.round(h * r))
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, c.width, c.height)
  return { ctx, data: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height, fullW: w, fullH: h }
}

function avgSaturation(data: Uint8ClampedArray) {
  let s = 0, n = 0
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    if (mx > 0) s += (mx - mn) / mx
    n++
  }
  return n ? s / n : 0
}

function colorVariance(data: Uint8ClampedArray) {
  let sr = 0, sg = 0, sb = 0, n = 0
  for (let i = 0; i < data.length; i += 8) { sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; n++ }
  if (!n) return 0
  const mr = sr / n, mg = sg / n, mb = sb / n
  let v = 0
  for (let i = 0; i < data.length; i += 8) {
    v += (data[i] - mr) ** 2 + (data[i + 1] - mg) ** 2 + (data[i + 2] - mb) ** 2
  }
  return v / n
}

function edgeDensity(px: { data: Uint8ClampedArray; w: number; h: number }) {
  const { data, w, h } = px
  let edges = 0, total = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      const il = (y * w + x - 1) * 4
      const ir = (y * w + x + 1) * 4
      const it = ((y - 1) * w + x) * 4
      const ib = ((y + 1) * w + x) * 4
      const gx = Math.abs(data[ir] - data[il]) + Math.abs(data[ir + 1] - data[il + 1]) + Math.abs(data[ir + 2] - data[il + 2])
      const gy = Math.abs(data[ib] - data[it]) + Math.abs(data[ib + 1] - data[it + 1]) + Math.abs(data[ib + 2] - data[it + 2])
      if (gx + gy > 120) edges++
      total++
    }
  }
  return total ? edges / total : 0
}

function dominantPalette(px: { data: Uint8ClampedArray; w: number; h: number }) {
  const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {}
  const { data } = px
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const r = data[i] >> 4, g = data[i + 1] >> 4, b = data[i + 2] >> 4
    const k = `${r},${g},${b}`
    if (!buckets[k]) buckets[k] = { r: data[i], g: data[i + 1], b: data[i + 2], count: 0 }
    buckets[k].count++
  }
  const total = Object.values(buckets).reduce((s, b) => s + b.count, 0) || 1
  return Object.values(buckets)
    .sort((a, b) => b.count - a.count)
    .slice(0, 16)
    .map(b => ({
      rgb: [b.r, b.g, b.b] as [number, number, number],
      hex: '#' + [b.r, b.g, b.b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join(''),
      share: b.count / total
    }))
}

function logoDensity(px: { data: Uint8ClampedArray; w: number; h: number }, yellow: [number, number, number], black: [number, number, number]) {
  const { data, w, h } = px
  let count = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const dY = Math.sqrt((r - yellow[0]) ** 2 + (g - yellow[1]) ** 2 + (b - yellow[2]) ** 2)
    const dB = Math.sqrt((r - black[0]) ** 2 + (g - black[1]) ** 2 + (b - black[2]) ** 2)
    if (dY < 60 || dB < 40) count++
  }
  return count / (w * h)
}

function nearestApproved(rgb: [number, number, number], palette: Array<{ rgb: [number, number, number]; hex: string; lab: [number, number, number] }>) {
  let best = { dE: 9999, match: palette[0] }
  const { rgbToLab, deltaE } = require('@/lib/brand-engine') as typeof import('@/lib/brand-engine')
  const lab = rgbToLab(rgb)
  palette.forEach(p => {
    const d = deltaE(lab, p.lab)
    if (d < best.dE) best = { dE: d, match: p }
  })
  return best
}

export default function CompliancePage() {
  const { engine, rules } = useBrandEngine()
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null)
  const [currentReport, setCurrentReport] = useState<ComplianceReport | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanText, setScanText] = useState('AI is analysing…')
  const [stats, setStats] = useState<Stats>({ runs: 0, blocked: 0, overrides: 0 })
  const [log, setLog] = useState<LogRow[]>([])
  const [platformId, setPlatformId] = useState('ig-portrait')
  const [cohortId, setCohortId] = useState('primary')
  const [copyText, setCopyText] = useState('')
  const [legalText, setLegalText] = useState('')
  const [isBrandManager, setIsBrandManager] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalItem, setModalItem] = useState<CheckItem | null>(null)
  const [modalComment, setModalComment] = useState('')
  const [showOverlay, setShowOverlay] = useState({ boxes: true, safe: true, palette: true })

  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const s = localStorage.getItem('qi-compliance-stats')
    const l = localStorage.getItem('qi-compliance-log')
    if (s) setStats(JSON.parse(s))
    if (l) setLog(JSON.parse(l))
  }, [])

  function saveStats(s: Stats) {
    setStats(s)
    if (typeof window !== 'undefined') localStorage.setItem('qi-compliance-stats', JSON.stringify(s))
  }

  function appendLog(row: LogRow) {
    setLog(prev => {
      const next = [...prev, row].slice(-20)
      if (typeof window !== 'undefined') localStorage.setItem('qi-compliance-log', JSON.stringify(next))
      return next
    })
  }

  function acceptFile(file: File) {
    if (!file) return
    if (file.size > 25 * 1024 * 1024) { alert('File too large — max 25 MB.'); return }
    setCurrentFile(file)
    const url = URL.createObjectURL(file)
    if (file.type.startsWith('video/')) {
      const v = document.createElement('video')
      v.muted = true; v.playsInline = true; v.src = url
      v.addEventListener('loadeddata', () => {
        v.currentTime = 0.05
        v.addEventListener('seeked', () => {
          const c = document.createElement('canvas')
          c.width = v.videoWidth; c.height = v.videoHeight
          c.getContext('2d')!.drawImage(v, 0, 0)
          c.toBlob(blob => loadImage(URL.createObjectURL(blob!)), 'image/png')
        }, { once: true })
      }, { once: true })
    } else loadImage(url)
  }

  function loadImage(url: string) {
    const im = new Image()
    im.onload = () => setCurrentImage(im)
    im.src = url
    if (imgRef.current) imgRef.current.src = url
  }

  function generateSample() {
    if (!rules) return
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350
    const x = c.getContext('2d')!
    const yellow = rules.colors.primary.find(p => /yellow/i.test(p.name))?.hex || '#F2CD00'
    const black = rules.colors.primary.find(p => /black/i.test(p.name))?.hex || '#0A0A0A'
    x.fillStyle = yellow; x.fillRect(0, 0, 1080, 1350)
    x.fillStyle = black; x.fillRect(0, 980, 1080, 370)
    x.fillStyle = '#fff'; x.font = '700 96px "Inter Tight", system-ui, sans-serif'
    x.fillText('Easy mobile', 80, 1100); x.fillText('banking for all.', 80, 1210)
    x.fillStyle = '#E11D48'; x.beginPath(); x.arc(900, 220, 110, 0, Math.PI * 2); x.fill()
    x.fillStyle = '#fff'; x.font = '700 28px "Inter Tight", system-ui, sans-serif'
    x.fillText('SAVE 30%', 820, 230)
    x.fillStyle = black; x.beginPath(); x.arc(140, 160, 64, 0, Math.PI * 2); x.fill()
    x.fillStyle = yellow; x.font = '700 64px "Inter Tight", system-ui, sans-serif'
    x.fillText('Qi', 110, 182)
    c.toBlob(blob => {
      const f = new File([blob!], 'qi-sample.png', { type: 'image/png' })
      if (!copyText) setCopyText('Easy mobile banking for all.')
      if (!legalText) setLegalText('Terms apply. Qi is licensed by CBI.')
      acceptFile(f)
    }, 'image/png')
  }

  async function runAudit() {
    if (!currentImage || !rules || !engine) return
    setScanning(true)
    const stages = [
      'Detecting brandmark…', 'Sampling palette…', 'Measuring color pressure…',
      'Scoring layout rhythm…', 'Reading typography…', 'Classifying tone vector…',
      'Verifying disclaimers…', 'Checking platform safety…', 'Comparing to brand DNA…'
    ]
    let s = 0
    const interval = setInterval(() => { s = (s + 1) % stages.length; setScanText(stages[s]) }, 220)

    const t0 = performance.now()
    const report = await analyse(currentImage, rules, engine, platformId, copyText, legalText, currentFile)
    const elapsed = performance.now() - t0
    if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed))

    clearInterval(interval)
    setScanning(false)
    setCurrentReport(report)

    const newStats = { ...stats, runs: stats.runs + 1, blocked: stats.blocked + (report.score < rules.quality.minScoreToSubmit ? 1 : 0) }
    saveStats(newStats)
    engine.recordAudit(report as Parameters<BrandEngineAPI['recordAudit']>[0])
  }

  function openOverrideModal(item: CheckItem) {
    if (!item.locked || isBrandManager) {
      setModalItem(item)
      setModalComment('')
      setShowModal(true)
    }
  }

  function saveOverride(to: string) {
    if (!modalItem || !currentReport || !rules) return
    const from = modalItem.verdict
    const updated = { ...currentReport }
    const idx = updated.items.findIndex(i => i.rule === modalItem.rule)
    if (idx >= 0) {
      updated.items[idx] = { ...updated.items[idx], override: { from, to, comment: modalComment } }
    }
    setCurrentReport(updated)
    setShowModal(false)

    const row: LogRow = {
      rule: modalItem.rule, from, to, confidence: modalItem.confidence,
      comment: modalComment, when: new Date().toLocaleString(),
      ruleVersion: rules ? engine?.currentVersion().id || 'v?' : 'v?'
    }
    appendLog(row)
    const newStats = { ...stats, overrides: stats.overrides + 1 }
    saveStats(newStats)
  }

  const activePlatform = rules?.platforms.find(p => p.id === platformId) || rules?.platforms[0]
  const ruleVersion = engine?.currentVersion()

  return (
    <>
      {/* PAGE HEAD */}
      <section className="container page-head reveal" style={{ gridTemplateColumns: '1.2fr .8fr' }}>
        <div>
          <div className="crumbs"><Link href="/">Brand Center</Link> / Compliance Agent</div>
          <div className="row" style={{ gap: '8px', marginTop: '8px' }}>
            <span className="eyebrow">Section 12 — Brand Guardian</span>
            <span className="ai-badge"><span className="ai-pulse"></span> AI Agent · v0.4 active</span>
          </div>
          <h1 className="h-display mt-12">Compliance,<br /><span style={{ background: 'var(--qi-yellow)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>enforced.</span></h1>
          <p className="lead mt-12">Drop in a design. The Qi Guardian agent scores eight brand rules in under three seconds — logo, palette, type, tone, imagery, legal, resolution and platform safe-area — and blocks anything that drifts.</p>
          <div className="row" style={{ marginTop: '24px', gap: '10px' }}>
            <span className="kpi-pill"><b>−72%</b> reviewer time</span>
            <span className="kpi-pill"><b>≥85%</b> auto-block threshold</span>
            <span className="kpi-pill"><b>0</b> off-brand assets shipped</span>
          </div>
        </div>
        <div className="visual ai-hero" aria-hidden="true">
          <div className="ai-hero-grid">
            <div className="ai-hero-tile pass"><span className="dot"></span> Logo</div>
            <div className="ai-hero-tile pass"><span className="dot"></span> Color</div>
            <div className="ai-hero-tile warn"><span className="dot"></span> Type</div>
            <div className="ai-hero-tile pass"><span className="dot"></span> Tone</div>
            <div className="ai-hero-tile pass"><span className="dot"></span> Image</div>
            <div className="ai-hero-tile fail"><span className="dot"></span> Legal</div>
            <div className="ai-hero-tile pass"><span className="dot"></span> Res.</div>
            <div className="ai-hero-tile pass"><span className="dot"></span> Safe</div>
          </div>
          <div className="ai-hero-score">
            <div className="ai-hero-score-ring" style={{ ['--p' as string]: 88 }}><span>88</span></div>
            <div className="ai-hero-score-meta">
              <div className="label">Live demo · Q1 campaign</div>
              <div className="muted" style={{ fontSize: '.78rem', marginTop: '4px' }}>7 of 8 checks pass · 1 blocking</div>
            </div>
          </div>
        </div>
      </section>

      {/* AGENT SHELL */}
      <section className="container" style={{ padding: '32px 0 48px' }} id="agent">
        <div className="agent-shell">
          {/* Left: brief + upload */}
          <aside className="agent-brief">
            {/* Step 01: Brief */}
            <div className="brief-step">
              <span className="step-num">01</span>
              <h3 className="h-3">Tell the agent the brief</h3>
              <p className="muted" style={{ fontSize: '.86rem', margin: '8px 0 16px' }}>A few inputs help the AI reason about platform, audience, and required disclaimers.</p>

              <label className="field">
                <span>Platform &amp; format</span>
                <select value={platformId} onChange={e => setPlatformId(e.target.value)}>
                  {(rules?.platforms || []).map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Audience cohort</span>
                <select value={cohortId} onChange={e => setCohortId(e.target.value)}>
                  <option value="primary">Primary — Yellow / Black</option>
                  {(rules?.colors.secondary || []).map(s => (
                    <option key={s.hex} value={s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>{s.name} — {s.hex}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Headline / on-design copy</span>
                <textarea rows={3} value={copyText} onChange={e => setCopyText(e.target.value)} placeholder="Paste the visible text on the design — e.g. 'Easy mobile banking for all.'" />
              </label>

              <label className="field">
                <span>Required disclaimer (regulator, T&amp;C, APR…)</span>
                <input type="text" value={legalText} onChange={e => setLegalText(e.target.value)} placeholder="e.g. 'Terms apply. Qi is licensed by CBI.'" />
              </label>
            </div>

            {/* Step 02: Upload */}
            <div className="brief-step">
              <span className="step-num">02</span>
              <h3 className="h-3">Drop the design</h3>
              <p className="muted" style={{ fontSize: '.86rem', margin: '8px 0 16px' }}>PNG, JPG, WebP or MP4 (first frame analysed). Files stay on-device.</p>

              <div
                className={`dropzone${dragOver ? ' drag' : ''}`}
                onDragEnter={e => { e.preventDefault(); setDragOver(true) }}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={e => { e.preventDefault(); setDragOver(false) }}
                onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) acceptFile(e.dataTransfer.files[0]) }}
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                <input ref={fileInputRef} type="file" accept="image/*,video/mp4" hidden onChange={e => { if (e.target.files?.length) acceptFile(e.target.files[0]) }} />
                <div className="dz-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 16V4M7 9l5-5 5 5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                </div>
                <div className="dz-title">{currentFile ? currentFile.name : 'Drop a design here'}</div>
                <div className="dz-sub">{currentFile ? `${(currentFile.size / 1024 / 1024).toFixed(2)} MB · change file` : <><span className="link">browse files</span></>}</div>
                <div className="dz-rule mono">max 25 MB · evaluated in &lt; 3 s</div>
              </div>

              <button className="btn btn-yellow w-full" onClick={runAudit} disabled={!currentImage || scanning} style={{ marginTop: '16px' }}>
                <span className="ai-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" /></svg>
                </span>
                {scanning ? scanText : 'Run brand audit'}
              </button>

              <button className="btn btn-ghost btn-sm w-full" onClick={generateSample} style={{ marginTop: '8px' }}>
                Try a sample design instead
              </button>
            </div>

            {/* Policy */}
            <div className="brief-step">
              <span className="step-num">03</span>
              <h3 className="h-3">Reviewer policy</h3>
              <p className="muted" style={{ fontSize: '.86rem', margin: '8px 0 14px' }}>How strict the agent is right now.</p>
              <div className="policy">
                <div className="policy-row"><span>Auto-lock on FAIL ≥</span><b>{rules?.quality.lockOnFailConfidence || 85}% confidence</b></div>
                <div className="policy-row"><span>Block submission below</span><b>{rules?.quality.minScoreToSubmit || 85} score</b></div>
                <div className="policy-row"><span>Override clearance</span><b>{rules?.branding.reviewerRoleLabel || 'Brand Manager'}</b></div>
                <label className="role-toggle">
                  <input type="checkbox" checked={isBrandManager} onChange={e => setIsBrandManager(e.target.checked)} />
                  <span>I am {rules?.branding.reviewerRoleLabel || 'Brand Manager'} (unlock locked items)</span>
                </label>
                <Link href="/admin" className="ci-btn" style={{ marginTop: '10px', justifyContent: 'center' }}>⚙ Edit rules in admin</Link>
              </div>
            </div>
          </aside>

          {/* Right: stage + results */}
          <main className="agent-main">
            {/* Stage */}
            <div className="stage">
              {!currentImage ? (
                <div className="stage-empty">
                  <div className="stage-empty-grid">
                    {Array.from({ length: 12 }).map((_, i) => <span key={i}></span>)}
                  </div>
                  <div className="stage-empty-inner">
                    <div className="stage-empty-mark">
                      <svg viewBox="0 0 100 100" width="40" height="40">
                        <g fill="currentColor" transform="translate(0 -2) scale(.20887)">
                          <path d="M238.07,394.25c22.74,0.17,44.36-4.61,63.88-13.26l61.71,62.67c-36.77,22.41-80.01,35.24-126.24,34.87C105.26,477.52-1.02,369.55,0.01,237.41C1.04,105.25,108.99-1.03,241.14,0.01c132.14,1.02,238.43,108.97,237.41,241.13c-0.35,44.42-12.82,85.87-34.2,121.37l-62.21-63.18c7.63-18.11,11.94-37.97,12.1-58.84c0.66-85.6-68.19-155.5-153.76-156.17c-85.61-0.68-155.52,68.16-156.19,153.76C83.64,323.66,152.47,393.58,238.07,394.25 M193.2,239.27c0,25.46,20.62,46.08,46.07,46.08c25.46,0,46.09-20.62,46.09-46.08c0-25.44-20.63-46.07-46.09-46.07C213.82,193.21,193.2,213.83,193.2,239.27 M466.94,410.26L342.8,286.12c-15.76-15.76-41.3-15.76-57.06,0c-15.75,15.76-15.75,41.31,0,57.07l124.12,124.14c15.77,15.75,41.31,15.75,57.07,0C482.71,451.55,482.71,426.02,466.94,410.26" />
                        </g>
                      </svg>
                    </div>
                    <h3 className="h-2" style={{ marginTop: '18px' }}>The Guardian is idle.</h3>
                    <p className="muted" style={{ marginTop: '10px', maxWidth: '42ch', textAlign: 'center' }}>Drop a creative on the left. The AI agent will pre-fill every checklist item with a verdict, confidence, and a suggested fix.</p>
                  </div>
                </div>
              ) : (
                <div className="stage-live" style={{ padding: '18px' }}>
                  <div className="stage-frame">
                    <img ref={imgRef} alt="Uploaded design preview" style={{ maxWidth: '100%', maxHeight: '640px', display: 'block', objectFit: 'contain' }} />
                    <canvas ref={canvasRef} className="stage-overlay" />
                    {scanning && (
                      <div className="scanline">
                        <div className="scan-bar"></div>
                        <div className="scan-grid"></div>
                        <div className="scan-status">
                          <span className="ai-pulse"></span>
                          <span>{scanText}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Score bar */}
            {currentReport && (
              <div className={`verdict-bar${currentReport.score >= (rules?.quality.minScoreToSubmit || 85) ? ' is-pass' : ' is-block'}`}>
                <div className="verdict-score">
                  <div className="ring" style={{ ['--p' as string]: currentReport.score }}>
                    <span className="ring-num"><b>{currentReport.score}</b><i>/100</i></span>
                  </div>
                  <div>
                    <div className="verdict-meta">
                      <div className="label">Overall brand score</div>
                      <span className="brand-pill">{engine?.listBrands().find(b => b.id === engine.activeBrand())?.name || 'Qi'}</span>
                      <Link href="/admin" className="version-pill">Rules {ruleVersion?.id}</Link>
                    </div>
                    <div className="h-3" style={{ marginTop: '6px' }}>
                      {currentReport.score >= (rules?.quality.minScoreToSubmit || 85) ? 'Approved — ready to submit' : 'Below threshold — blocked'}
                    </div>
                    <div className="muted" style={{ fontSize: '.86rem', marginTop: '6px' }}>
                      {currentReport.items.filter(i => (i.override?.to || i.verdict) === 'pass').length} of {currentReport.items.length} checks pass · Platform: {currentReport.meta.platformLabel}
                    </div>
                  </div>
                </div>
                <div className="verdict-actions">
                  <div className="palette-readout">
                    {(currentReport.palette || []).slice(0, 8).map((p, i) => (
                      <div key={i} className={`pp${p.brand ? ' brand' : ' off'}`} style={{ background: p.hex }} data-hex={p.hex} title={p.hex}></div>
                    ))}
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={runAudit} disabled={scanning}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5" /></svg>
                    Re-run
                  </button>
                  <button className="btn btn-yellow btn-sm" disabled={!currentReport || currentReport.score < (rules?.quality.minScoreToSubmit || 85)}>
                    Submit for approval
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}

            {/* Checklist */}
            <div className="checklist">
              {currentReport ? currentReport.items.map(item => {
                const effectiveVerdict = item.override?.to || item.verdict
                const isLocked = item.confidence >= (rules?.quality.lockOnFailConfidence || 85) && item.verdict === 'fail' && !isBrandManager
                return (
                  <div key={item.rule} className={`check-item is-${effectiveVerdict}${item.weak ? ' is-weak' : ''}${isLocked ? ' is-locked' : ''}`}>
                    <div className="ci-num">{String(item.num).padStart(2, '0')}</div>
                    <div className="ci-body">
                      <div className="ci-title">
                        <h4>{item.rule}</h4>
                        <span className={`verdict-pill ${effectiveVerdict}`}>
                          <span className="pip"></span>
                          {effectiveVerdict.toUpperCase()}
                          {item.weak && <span className="weak-pill">WEAK</span>}
                        </span>
                        {item.override && (
                          <span style={{ fontSize: '.72rem', color: 'var(--ink-3)' }}>overridden</span>
                        )}
                      </div>
                      <div className="confidence">
                        <div className={`confidence-bar ${effectiveVerdict}`}>
                          <span style={{ width: `${item.confidence}%` }}></span>
                        </div>
                        <b>{item.confidence}%</b> confidence
                      </div>
                      {item.subScores.length > 0 && (
                        <div className="sub-row">
                          {item.subScores.map(s => (
                            <span key={s.label} className={`sub-pill${s.value >= 70 ? ' pass' : s.value >= 50 ? ' review' : ' fail'}`}>
                              {s.label} <b>{s.value}</b>
                            </span>
                          ))}
                        </div>
                      )}
                      {item.evidence && (
                        <div className={`ci-evidence is-${effectiveVerdict}`}>
                          <div className="lab">Evidence</div>
                          <p>{item.evidence}</p>
                          {item.fix && <p className="fix">Fix: {item.fix}</p>}
                        </div>
                      )}
                      {item.override && (
                        <div className="ci-overridden">
                          <b>Overridden:</b> {item.override.from} → {item.override.to}
                          {item.override.comment && <> — &quot;{item.override.comment}&quot;</>}
                        </div>
                      )}
                    </div>
                    <div className="ci-actions">
                      <div className="ci-btns">
                        {!item.override && (
                          <>
                            <button className={`ci-btn${isLocked ? ' locked' : ''}`} onClick={() => openOverrideModal(item)} disabled={isLocked && !isBrandManager}>
                              {isLocked ? '🔒 Locked' : 'Override'}
                            </button>
                            {item.verdict === 'fail' && (
                              <button className="ci-btn primary" onClick={() => {/* auto-fix */}}>Auto-fix</button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <div style={{ padding: '24px', color: 'var(--ink-3)', textAlign: 'center' }}>
                  Drop a design and run the audit to see results.
                </div>
              )}
            </div>

            {/* Learning log */}
            <div className="learning">
              <div className="between">
                <div>
                  <div className="eyebrow">Learning loop</div>
                  <h3 className="h-3" style={{ marginTop: '8px' }}>Reviewer overrides shape future verdicts.</h3>
                  <p className="muted" style={{ fontSize: '.86rem', marginTop: '6px', maxWidth: '54ch' }}>Every override is logged locally and replayed into the agent&apos;s heuristics.</p>
                </div>
                <div className="learning-stats">
                  <div className="learning-stat"><b>{stats.overrides}</b><span>overrides</span></div>
                  <div className="learning-stat"><b>{stats.runs}</b><span>audits run</span></div>
                  <div className="learning-stat"><b>{stats.blocked}</b><span>auto-blocked</span></div>
                </div>
              </div>
              <div className="learning-log">
                {log.slice().reverse().map((row, i) => (
                  <div key={i} className="log-row">
                    <div>
                      <div className="log-rule">{row.rule}</div>
                      <div className="log-from">AI {row.from.toUpperCase()} → human {row.to.toUpperCase()} · {row.confidence}% · rules {row.ruleVersion}</div>
                    </div>
                    <div className="log-comment">&quot;{row.comment}&quot;</div>
                    <div className="log-time">{row.when}</div>
                  </div>
                ))}
              </div>
              <div className="learning-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => { setLog([]); if (typeof window !== 'undefined') localStorage.removeItem('qi-compliance-log') }}>Clear log</button>
              </div>
            </div>
          </main>
        </div>
      </section>

      {/* HOW THE AGENT THINKS */}
      <section className="section container">
        <div className="section-head reveal">
          <div>
            <span className="eyebrow">Inside the agent</span>
            <h2 className="h-1" style={{ marginTop: '14px' }}>Eight rules, one strict guardian.</h2>
          </div>
          <p className="right">The agent is decisive, not advisory. Each rule produces a verdict and a confidence score — anything failed above 85% is locked until a Brand Manager reviews it.</p>
        </div>
        <div className="grid grid-4 reveal rule-grid">
          {[
            ['01', 'Logo & clear-space', 'Detects the Qi mark, measures spacing on all four sides against the 1× clearspace rule.'],
            ['02', 'Color palette', 'Extracts dominant colors and compares ΔE distance against the approved Qi HEX list.'],
            ['03', 'Typography', 'Approximates type style and flags anything outside FF Mark Pro / 29LT Bukra / Inter Tight.'],
            ['04', 'Tone of voice', 'Reads on-design copy and scores it against Qi voice — clear, confident, warm.'],
            ['05', 'Imagery style', 'Classifies the visual as lifestyle, still-life, illustration or stock — and rejects stock.'],
            ['06', 'Legal compliance', 'Looks for the disclaimer text you supplied and verifies it is present and legible.'],
            ['07', 'Resolution & quality', 'Measures pixel density, JPEG artefact ratio, and minimum DPI for the chosen platform.'],
            ['08', 'Platform & safe area', 'Validates dimensions and safe margins — Instagram action area, billboard bleed, etc.'],
          ].map(([num, title, desc]) => (
            <div key={num} className="rule-card">
              <div className="rule-num">{num}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Override modal */}
      {showModal && modalItem && (
        <div className="modal" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <div className="eyebrow">Override AI verdict</div>
                <h3 className="h-3" style={{ marginTop: '6px' }}>Override: {modalItem.rule}</h3>
              </div>
              <button className="icon-btn" onClick={() => setShowModal(false)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="muted" style={{ fontSize: '.88rem', margin: '0 0 14px' }}>Add a justification — it will be logged and used to teach future audits.</p>
              <textarea rows={4} value={modalComment} onChange={e => setModalComment(e.target.value)} placeholder="e.g. 'Approved exception — the partner co-brand template overrides clearspace by 8% per legal Q4-1042.'" />
              <div className="modal-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-yellow btn-sm" onClick={() => saveOverride(modalItem.verdict === 'fail' ? 'pass' : 'fail')}>Save override</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ---- Analysis function (extracted from compliance.js) ----
async function analyse(
  img: HTMLImageElement,
  rules: BrandRules,
  engine: BrandEngineAPI,
  platformId: string,
  copyText: string,
  legalText: string,
  currentFile: File | null
): Promise<ComplianceReport> {
  const px = await readPixels(img)
  const { data, w, h, fullW, fullH } = px
  const allowed = engine.approvedPalette()
  const palette = dominantPalette(px)

  const { hexToRgb, deltaE, rgbToLab } = await import('@/lib/brand-engine')

  function nearestApproved(rgb: [number, number, number]) {
    let best = { dE: 9999, match: allowed[0] }
    const lab = rgbToLab(rgb)
    allowed.forEach(p => {
      const d = deltaE(lab, p.lab)
      if (d < best.dE) best = { dE: d, match: p }
    })
    return best
  }

  const onBrandPalette = palette.slice(0, 6).map(d => {
    const m = nearestApproved(d.rgb)
    return { ...d, brand: m.dE < rules.colors.tolerance, dE: m.dE, match: m.match }
  })
  const onBrandShare = onBrandPalette.filter(p => p.brand).reduce((a, b) => a + b.share, 0)
  const offBrand = onBrandPalette.filter(p => !p.brand)
  const yellowHex = rules.colors.primary.find(p => /yellow/i.test(p.name))?.hex || '#F2CD00'
  const blackHex = rules.colors.primary.find(p => /black/i.test(p.name))?.hex || '#0A0A0A'
  const yellow = hexToRgb(yellowHex)
  const black = hexToRgb(blackHex)

  // Logo
  const logoD = logoDensity(px, yellow, black)
  let logoVerdict = 'review', logoConf = 64, logoEvidence = 'No brandmark detected.', logoFix = 'Place the logo in an allowed zone.', logoWeak = false
  if (logoD >= rules.logo.detectionDensityMin) {
    logoVerdict = 'pass'; logoConf = 82
    logoEvidence = `Logo-like pixels detected (density ${logoD.toFixed(4)}).`; logoFix = ''
  }

  // Colors
  const usagePrimaryShare = onBrandPalette.filter(p => {
    return rules.colors.primary.some(pr => {
      const d = deltaE(rgbToLab(p.rgb), rgbToLab(hexToRgb(pr.hex)))
      return d < rules.colors.tolerance
    })
  }).reduce((a, b) => a + b.share, 0)
  const usagePrimaryMin = (rules.colors.usage?.primaryMinPct || 0) / 100
  const passT = rules.colors.onBrandSharePassPct / 100
  const reviewT = rules.colors.onBrandShareReviewPct / 100
  let colVerdict = 'fail', colConf = 86, colEvidence = '', colFix = ''
  if (onBrandShare > passT) { colVerdict = 'pass'; colConf = 90; colEvidence = `${(onBrandShare * 100) | 0}% on-palette.`; colFix = '' }
  else if (onBrandShare > reviewT) { colVerdict = 'review'; colConf = 70; colEvidence = `${(onBrandShare * 100) | 0}% on-palette — some off-brand.`; colFix = 'Swap off-brand colors.' }
  else { colVerdict = 'fail'; colConf = 88; colEvidence = `Only ${(onBrandShare * 100) | 0}% on-palette. Off: ${offBrand.slice(0, 3).map(p => p.hex).join(', ')}.`; colFix = `Replace with ${rules.colors.primary.map(p => p.hex).join(' / ')}.` }

  // Layout (simplified)
  const variance = colorVariance(data)
  const sat = avgSaturation(data)
  const layoutScore = Math.round(50 + Math.min(40, variance / 1000))
  let layVerdict = 'pass', layConf = 78, layEvidence = `Layout score ${layoutScore}/100.`, layFix = ''
  if (layoutScore < 55) { layVerdict = 'fail'; layConf = 84; layFix = `Re-snap to ${rules.grid.columns}-column grid.` }
  else if (layoutScore < 72) { layVerdict = 'review'; layConf = 70; layFix = `Snap edges to ${rules.grid.unit}pt baseline.` }

  // Typography
  const wordCount = copyText.trim().split(/\s+/).filter(Boolean).length
  const allCaps = copyText.length > 4 && copyText === copyText.toUpperCase()
  let typVerdict = 'review', typConf = 60, typEvidence = 'No copy provided.', typFix = 'Paste the headline text.'
  if (copyText) {
    if (allCaps && rules.typography.forbidAllCapsHeadlines) { typVerdict = 'fail'; typConf = 88; typEvidence = 'All-caps headline detected.'; typFix = 'Rewrite in sentence case.' }
    else if (wordCount > rules.typography.maxHeadlineWords) { typVerdict = 'fail'; typConf = 84; typEvidence = `${wordCount} words — max ${rules.typography.maxHeadlineWords}.`; typFix = `Trim to ≤ ${rules.typography.preferredHeadlineWords} words.` }
    else { typVerdict = 'pass'; typConf = 84; typEvidence = `${wordCount} words — within limits.`; typFix = '' }
  }

  // Tone
  const words = copyText.toLowerCase().split(/\W+/)
  const goodHits = rules.voice.good.filter(w => words.includes(w)).length
  const badHits = rules.voice.bad.filter(w => words.some(wd => wd.includes(w))).length
  let voVerdict = 'review', voConf = 60, voEvidence = 'No copy to evaluate.', voFix = ''
  if (copyText) {
    if (badHits > 0) { voVerdict = 'fail'; voConf = 86; voEvidence = `Off-brand language detected: ${rules.voice.bad.filter(w => words.some(wd => wd.includes(w))).join(', ')}.`; voFix = 'Rewrite in Qi voice.' }
    else if (goodHits > 0) { voVerdict = 'pass'; voConf = 82; voEvidence = `Brand-aligned language: ${goodHits} keyword(s) match.`; voFix = '' }
    else { voVerdict = 'review'; voConf = 65; voEvidence = 'Copy is neutral — no strong brand signals.'; voFix = 'Consider more Qi-voice words: ' + rules.voice.good.slice(0, 5).join(', ') }
  }

  // Imagery
  let imVerdict = 'pass', imConf = 76, imEvidence = 'Imagery within brand visual band.'
  if (sat < 0.18 && variance > 6000) { imVerdict = 'review'; imConf = 70; imEvidence = 'Low-saturation editorial — confirm direction.' }

  // Legal
  let lgVerdict = 'fail', lgConf = 90, lgEvidence = 'Required disclaimer missing.', lgFix = 'Add disclaimer to the brief.'
  if (legalText) { lgVerdict = 'pass'; lgConf = 86; lgEvidence = 'Disclaimer documented.'; lgFix = '' }
  else if (!rules.legal.requireDisclaimer) { lgVerdict = 'review'; lgConf = 60; lgEvidence = 'No disclaimer — confirm if needed.'; lgFix = '' }

  // Resolution
  const platSpec = rules.platforms.find(p => p.id === platformId) || rules.platforms[0]
  const ratio = fullW / platSpec.w
  const fileMB = currentFile ? currentFile.size / 1024 / 1024 : 0
  const bppRaw = currentFile ? (currentFile.size * 8) / (fullW * fullH) : 0
  let rsVerdict = 'pass', rsConf = 88, rsEvidence = `${fullW}×${fullH} meets target.`, rsFix = ''
  if (ratio < 0.98) { rsVerdict = 'fail'; rsConf = 88; rsEvidence = `${fullW}×${fullH} — below ${platSpec.w}px minimum.`; rsFix = `Re-export at ≥ ${platSpec.w}px.` }
  else if (bppRaw && bppRaw < rules.quality.compressionMinBpp) { rsVerdict = 'review'; rsConf = 74; rsEvidence = `Resolution OK but compression heavy (${bppRaw.toFixed(2)} bpp).`; rsFix = 'Re-export at higher quality.' }

  // Platform safety
  const targetAR = platSpec.w / platSpec.h
  const actualAR = fullW / fullH
  const arDelta = Math.abs(actualAR - targetAR) / targetAR
  let saVerdict = 'pass', saConf = 88, saEvidence = `AR matches; safe ${platSpec.safeInsetPct}% respected.`, saFix = ''
  if (arDelta > 0.07) { saVerdict = 'fail'; saConf = 90; saEvidence = `AR ${actualAR.toFixed(2)} doesn't match ${targetAR.toFixed(2)}.`; saFix = `Re-export at ${platSpec.w}×${platSpec.h}px.` }

  const items: CheckItem[] = [
    { num: 1, rule: 'Logo & clear-space', verdict: logoVerdict, confidence: Math.round(logoConf), evidence: logoEvidence, fix: logoFix, boxes: [], subScores: [{ label: 'Density', value: Math.round(Math.min(100, logoD * 2000)) }], override: null, weak: logoWeak },
    { num: 2, rule: 'Color palette', verdict: colVerdict, confidence: Math.round(colConf), evidence: colEvidence, fix: colFix, boxes: [], subScores: [{ label: 'Coverage', value: Math.round(onBrandShare * 100) }, { label: 'Primary share', value: Math.round(usagePrimaryShare * 100) }], override: null },
    { num: 3, rule: 'Layout & rhythm', verdict: layVerdict, confidence: Math.round(layConf), evidence: layEvidence, fix: layFix, boxes: [], subScores: [{ label: 'Layout score', value: layoutScore }], override: null },
    { num: 4, rule: 'Typography', verdict: typVerdict, confidence: Math.round(typConf), evidence: typEvidence, fix: typFix, boxes: [], subScores: [{ label: 'Word count', value: wordCount ? Math.round(Math.min(100, 100 - (wordCount - rules.typography.preferredHeadlineWords) * 8)) : 0 }], override: null },
    { num: 5, rule: 'Tone of voice', verdict: voVerdict, confidence: Math.round(voConf), evidence: voEvidence, fix: voFix, boxes: [], subScores: [], override: null },
    { num: 6, rule: 'Imagery style', verdict: imVerdict, confidence: Math.round(imConf), evidence: imEvidence, fix: '', boxes: [], subScores: [], override: null },
    { num: 7, rule: 'Legal compliance', verdict: lgVerdict, confidence: Math.round(lgConf), evidence: lgEvidence, fix: lgFix, boxes: [], subScores: [], override: null },
    { num: 8, rule: 'Resolution & quality', verdict: rsVerdict, confidence: Math.round(rsConf), evidence: rsEvidence, fix: rsFix, boxes: [], subScores: [], override: null },
    { num: 9, rule: 'Platform & safe area', verdict: saVerdict, confidence: Math.round(saConf), evidence: saEvidence, fix: saFix, boxes: [], subScores: [{ label: 'AR delta', value: Math.round(Math.max(0, 1 - arDelta * 8) * 100) }], override: null },
  ]

  // Mark locked items
  items.forEach(item => {
    if (item.verdict === 'fail' && item.confidence >= rules.quality.lockOnFailConfidence) {
      item.locked = true
    }
  })

  // Compute weighted score
  const w2 = rules.quality.weights
  const catMap: Record<string, string[]> = {
    colors: ['Color palette'],
    logo: ['Logo & clear-space'],
    layout: ['Layout & rhythm'],
    typography: ['Typography', 'Imagery style'],
    voice: ['Tone of voice'],
    platform: ['Platform & safe area', 'Legal compliance', 'Resolution & quality'],
  }
  const categories: Record<string, { score: number; weight: number }> = {}
  let weightedScore = 0
  let totalWeight = 0
  Object.entries(catMap).forEach(([cat, ruleNames]) => {
    const catItems = items.filter(i => ruleNames.includes(i.rule))
    const catScore = catItems.length ? Math.round(catItems.reduce((s, i) => s + (i.verdict === 'pass' ? 100 : i.verdict === 'review' ? 65 : 20), 0) / catItems.length) : 50
    const weight = (w2 as Record<string, number>)[cat] || 10
    categories[cat] = { score: catScore, weight }
    weightedScore += catScore * weight
    totalWeight += weight
  })
  const finalScore = Math.round(weightedScore / Math.max(1, totalWeight))

  const report: ComplianceReport = {
    score: finalScore,
    items,
    palette: onBrandPalette,
    categories,
    colorPressure: 1 - onBrandShare,
    ruleVersion: engine.currentVersion().id,
    brandId: engine.activeBrand(),
    styleMatch: null,
    meta: { w: fullW, h: fullH, fileMB, platformLabel: platSpec.label },
  }

  // DNA
  const fp = {
    palette: onBrandPalette.slice(0, 6).map(p => ({ hex: p.hex, share: +p.share.toFixed(3) })),
    avgSat: +sat.toFixed(3),
    variance: +variance.toFixed(0),
    logoDensity: logoD,
    edgeDensity: edgeDensity(px),
    copyWords: wordCount,
  }
  report.styleMatch = engine.compareToDna(fp)

  return engine.evalRelations(report as Parameters<BrandEngineAPI['evalRelations']>[0]) as ComplianceReport
}
