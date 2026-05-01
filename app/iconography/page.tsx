import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iconography — Qi Brand Center',
  description: 'Qi icon system: style principles, grid, sizing, and usage guidelines.',
}

export default function IconographyPage() {
  return (
    <>
      <section className="page-head section">
        <div className="container">
          <div className="crumbs">Identity</div>
          <h1>Iconography</h1>
          <p className="lead">
            Icons in the Qi system are drawn on a 24 × 24 px grid with a 2 px stroke weight.
            They are geometric, open, and purposeful — never decorative.
          </p>
        </div>
      </section>

      <section className="section" id="style">
        <div className="container">
          <h2>Style Principles</h2>
          <div className="grid grid-3" style={{ gap: '1.25rem', marginTop: '1.5rem' }}>
            {[
              ['Outlined', 'All icons use a consistent 2 px stroke. Fill is reserved for solid/active states only.'],
              ['Geometric', 'Forms are built on circles, rectangles, and triangles. Avoid organic curves or hand-drawn aesthetics.'],
              ['Purposeful', 'Each icon represents one concept. If an icon needs a label to be understood, the metaphor must be reconsidered.'],
              ['Aligned', 'Icons sit on the pixel grid. Strokes align to full or half pixels — never sub-pixel.'],
              ['Consistent', 'Corner radius on rectangular forms: 2 px. Cap and join style: round.'],
              ['Scalable', 'Primary delivery is SVG. Provide 16, 24, 32, and 48 px rasterised PNGs for contexts that cannot render SVG.'],
            ].map(([title, body]) => (
              <div key={title as string} className="card reveal">
                <h4>{title}</h4>
                <p style={{ fontSize: '.875rem', margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="grid">
        <div className="container">
          <h2>Icon Grid</h2>
          <p>
            The construction grid is 24 × 24 px with a 2 px inner padding on all sides,
            yielding a 20 × 20 px live area. Key anchor points sit at the 4 px, 12 px, and
            20 px marks. Circular forms use a 20 px diameter with optical corrections applied
            where necessary.
          </p>
        </div>
      </section>

      <section className="section" id="sizing">
        <div className="container">
          <h2>Sizing</h2>
          <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: '.75rem 1rem .75rem 0' }}>Size</th>
                  <th style={{ textAlign: 'left', padding: '.75rem 1rem' }}>Usage context</th>
                  <th style={{ textAlign: 'left', padding: '.75rem 0 .75rem 1rem' }}>Stroke weight</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['16 px', 'Inline with body text, dense data tables', '1.5 px'],
                  ['24 px', 'Default UI, navigation, buttons', '2 px'],
                  ['32 px', 'Card icons, empty states (supporting)', '2 px'],
                  ['48 px', 'Feature illustrations, onboarding', '2.5 px'],
                ].map(([size, usage, stroke]) => (
                  <tr key={size as string} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '.65rem 1rem .65rem 0', fontFamily: 'var(--font-mono)' }}>{size}</td>
                    <td style={{ padding: '.65rem 1rem', fontSize: '.875rem' }}>{usage}</td>
                    <td style={{ padding: '.65rem 0 .65rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}>{stroke}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}
