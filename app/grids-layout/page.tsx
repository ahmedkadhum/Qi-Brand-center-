import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Grids & Layout — Qi Brand Center',
  description: 'Qi layout system: the 12-column bento grid, breakpoints, and spacing scale.',
}

const SPACING = [
  ['4px', '0.25rem', 'Micro: icon padding, tight gaps'],
  ['8px', '0.5rem', 'XS: list item spacing'],
  ['12px', '0.75rem', 'SM: compact card padding'],
  ['16px', '1rem', 'Base: default gap'],
  ['24px', '1.5rem', 'MD: section element spacing'],
  ['32px', '2rem', 'LG: card padding, component breathing room'],
  ['48px', '3rem', 'XL: section top/bottom padding (mobile)'],
  ['64px', '4rem', 'XXL: section padding (desktop)'],
  ['96px', '6rem', 'Hero padding, major section breaks'],
  ['128px', '8rem', 'Maximum hero vertical padding'],
]

export default function GridsLayoutPage() {
  return (
    <>
      <section className="page-head section">
        <div className="container">
          <div className="crumbs">System</div>
          <h1>Grids &amp; Layout</h1>
          <p className="lead">
            The Qi layout system is built on a 12-column bento grid with an 8-point
            base unit. Every dimension in the system is a multiple of 8 — no exceptions.
          </p>
        </div>
      </section>

      <section className="section" id="bento">
        <div className="container">
          <h2>Bento Grid</h2>
          <p>
            The bento system divides the page into 12 equal columns. Content tiles span
            3, 6, 9, or 12 columns and optionally span 2 rows. This creates the dense,
            editorial card layouts seen throughout the brand.
          </p>
          <div className="bento reveal" style={{ marginTop: '2rem' }}>
            <div className="b-6 bg-yellow" style={{ minHeight: 120, borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>b-6</div>
            <div className="b-3 bg-ink" style={{ minHeight: 120, borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>b-3</div>
            <div className="b-3 bg-teal" style={{ minHeight: 120, borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>b-3</div>
            <div className="b-3" style={{ minHeight: 100, borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>b-3</div>
            <div className="b-9" style={{ minHeight: 100, borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>b-9</div>
            <div className="b-12" style={{ minHeight: 80, borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>b-12</div>
          </div>
        </div>
      </section>

      <section className="section" id="breakpoints">
        <div className="container">
          <h2>Breakpoints</h2>
          <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: '.75rem 1rem .75rem 0' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '.75rem 1rem' }}>Min width</th>
                  <th style={{ textAlign: 'left', padding: '.75rem 1rem' }}>Columns</th>
                  <th style={{ textAlign: 'left', padding: '.75rem 0 .75rem 1rem' }}>Gutter</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['xs', '0', '4', '12px'],
                  ['sm', '480px', '4', '16px'],
                  ['md', '768px', '8', '20px'],
                  ['lg', '1024px', '12', '24px'],
                  ['xl', '1280px', '12', '32px'],
                  ['2xl', '1536px', '12', '40px'],
                ].map(([name, min, cols, gutter]) => (
                  <tr key={name as string} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '.65rem 1rem .65rem 0', fontFamily: 'var(--font-mono)', fontSize: '.875rem' }}>{name}</td>
                    <td style={{ padding: '.65rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '.875rem' }}>{min}</td>
                    <td style={{ padding: '.65rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '.875rem' }}>{cols}</td>
                    <td style={{ padding: '.65rem 0 .65rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '.875rem' }}>{gutter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" id="spacing">
        <div className="container">
          <h2>Spacing Scale</h2>
          <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: '.75rem 1rem .75rem 0' }}>px</th>
                  <th style={{ textAlign: 'left', padding: '.75rem 1rem' }}>rem</th>
                  <th style={{ textAlign: 'left', padding: '.75rem 0 .75rem 1rem' }}>Usage</th>
                </tr>
              </thead>
              <tbody>
                {SPACING.map(([px, rem, use]) => (
                  <tr key={px} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '.65rem 1rem .65rem 0', fontFamily: 'var(--font-mono)', fontSize: '.875rem' }}>{px}</td>
                    <td style={{ padding: '.65rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '.875rem' }}>{rem}</td>
                    <td style={{ padding: '.65rem 0 .65rem 1rem', fontSize: '.875rem' }}>{use}</td>
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
