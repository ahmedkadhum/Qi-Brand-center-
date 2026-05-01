import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Color — Qi Brand Center',
  description: 'The Qi color system: primary palette, audience colors, Spectrum, and usage rules.',
}

const PRIMARY_COLORS = [
  { name: 'Qi Yellow', hex: '#F5C800', role: 'Brand primary — energy, optimism, clarity' },
  { name: 'Qi Black', hex: '#0D0D0D', role: 'Brand anchor — depth, authority, sophistication' },
  { name: 'Qi Teal', hex: '#00B0A0', role: 'Brand accent — trust, technology, calm' },
  { name: 'Qi White', hex: '#FFFFFF', role: 'Brand foundation — openness, space, cleanliness' },
]

const AUDIENCE_COLORS = [
  { name: 'Male', hex: '#1A3C6E', label: '--qi-male' },
  { name: 'Female', hex: '#B5477A', label: '--qi-female' },
  { name: 'Kids', hex: '#FF6B35', label: '--qi-kids' },
  { name: 'Youth', hex: '#6B4FBB', label: '--qi-youth' },
]

export default function ColorPage() {
  return (
    <>
      <section className="page-head section">
        <div className="container">
          <div className="crumbs">Identity</div>
          <h1>Color</h1>
          <p className="lead">
            Color is the fastest signal of brand recognition. The Qi palette is intentionally
            restrained — three core colors plus white — allowing each to carry maximum weight.
          </p>
        </div>
      </section>

      <section className="section" id="primary">
        <div className="container">
          <h2>Primary Palette</h2>
          <div className="grid grid-2" style={{ gap: '1.5rem', marginTop: '2rem' }}>
            {PRIMARY_COLORS.map((c) => (
              <div key={c.hex} className="card reveal" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 'var(--r-md)',
                    background: c.hex,
                    flexShrink: 0,
                    border: c.hex === '#FFFFFF' ? '1px solid var(--line)' : undefined,
                  }}
                />
                <div>
                  <strong>{c.name}</strong>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', marginTop: '.25rem', opacity: .7 }}>
                    {c.hex}
                  </div>
                  <p style={{ margin: '.5rem 0 0', fontSize: '.85rem' }}>{c.role}</p>
                </div>
                <button
                  className="btn-ghost"
                  data-copy={c.hex}
                  style={{ marginLeft: 'auto', fontSize: '.75rem' }}
                  aria-label={`Copy ${c.hex}`}
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="audience">
        <div className="container">
          <h2>Audience Colors</h2>
          <p>
            Audience colors are secondary signals — used in product sub-brands and targeted
            communications. They never override the primary palette in brand-level contexts.
          </p>
          <div className="grid grid-2" style={{ gap: '1rem', marginTop: '2rem' }}>
            {AUDIENCE_COLORS.map((c) => (
              <div key={c.hex} className="card reveal" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 'var(--r-md)', background: c.hex, flexShrink: 0 }} />
                <div>
                  <strong>{c.name}</strong>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.78rem', opacity: .65 }}>{c.hex}</div>
                  <code style={{ fontSize: '.75rem' }}>{c.label}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="usage">
        <div className="container">
          <h2>Usage Rules</h2>
          <div className="grid grid-3" style={{ gap: '1rem', marginTop: '1.5rem' }}>
            <div className="card reveal">
              <h4>60 / 30 / 10</h4>
              <p style={{ fontSize: '.875rem' }}>
                White (60 %) anchors the layout. Black (30 %) provides structure and hierarchy.
                Yellow or Teal (10 %) draws the eye to the single most important element.
              </p>
            </div>
            <div className="card reveal">
              <h4>Contrast</h4>
              <p style={{ fontSize: '.875rem' }}>
                All text must meet WCAG AA (4.5 : 1 for body, 3 : 1 for large text).
                Yellow on white fails — always pair yellow with black or dark ink.
              </p>
            </div>
            <div className="card reveal">
              <h4>Dark Theme</h4>
              <p style={{ fontSize: '.875rem' }}>
                In dark contexts, swap surface and ink tokens via the{' '}
                <code>[data-theme=&quot;dark&quot;]</code> selector override.
                Never hard-code hex values on themed surfaces.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
