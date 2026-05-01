import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Typography — Qi Brand Center',
  description: 'Qi type system: Inter Tight for display, Inter for body, JetBrains Mono for code.',
}

const SCALE = [
  { token: '--text-xs', size: '0.75rem / 12px', use: 'Labels, captions, legal micro-copy' },
  { token: '--text-sm', size: '0.875rem / 14px', use: 'Secondary body, UI labels' },
  { token: '--text-base', size: '1rem / 16px', use: 'Default body text' },
  { token: '--text-lg', size: '1.125rem / 18px', use: 'Lead paragraphs, intro text' },
  { token: '--text-xl', size: '1.25rem / 20px', use: 'Card headings, sub-section titles' },
  { token: '--text-2xl', size: '1.5rem / 24px', use: 'Section headings (H3)' },
  { token: '--text-3xl', size: '1.875rem / 30px', use: 'Page sub-headings (H2)' },
  { token: '--text-4xl', size: '2.25rem / 36px', use: 'Page titles (H1 — compact)' },
  { token: '--text-5xl', size: '3rem / 48px', use: 'Hero headings' },
  { token: '--text-6xl', size: '3.75rem / 60px', use: 'Campaign hero — max display' },
]

export default function TypographyPage() {
  return (
    <>
      <section className="page-head section">
        <div className="container">
          <div className="crumbs">Identity</div>
          <h1>Typography</h1>
          <p className="lead">
            Three typefaces. One job each. Inter Tight headlines with authority; Inter
            bodies with clarity; JetBrains Mono labels technical truth without pretense.
          </p>
        </div>
      </section>

      <section className="section" id="typefaces">
        <div className="container">
          <h2>Typefaces</h2>
          <div className="grid grid-3" style={{ gap: '1.5rem', marginTop: '2rem' }}>
            <div className="card reveal">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.1 }}>
                Inter Tight
              </div>
              <div style={{ marginTop: '1rem', fontSize: '.85rem', opacity: .7 }}>Display / Heading</div>
              <p style={{ fontSize: '.875rem' }}>
                Used for all headlines H1–H3. Weights 600–800. Never set body copy in Inter Tight.
              </p>
              <code style={{ fontSize: '.75rem' }}>--font-display</code>
            </div>
            <div className="card reveal">
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '1.5rem', fontWeight: 400 }}>
                Inter Regular
              </div>
              <div style={{ marginTop: '1rem', fontSize: '.85rem', opacity: .7 }}>Body / UI</div>
              <p style={{ fontSize: '.875rem' }}>
                Default for all body text, UI labels, and navigation. Weights 400–600.
              </p>
              <code style={{ fontSize: '.75rem' }}>--font-body</code>
            </div>
            <div className="card reveal">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 400 }}>
                JetBrains Mono
              </div>
              <div style={{ marginTop: '1rem', fontSize: '.85rem', opacity: .7 }}>Code / Data</div>
              <p style={{ fontSize: '.875rem' }}>
                Hex values, token names, code snippets, and numeric data tables.
              </p>
              <code style={{ fontSize: '.75rem' }}>--font-mono</code>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="scale">
        <div className="container">
          <h2>Type Scale</h2>
          <div className="reveal" style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: '.75rem 1rem .75rem 0', fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>Token</th>
                  <th style={{ textAlign: 'left', padding: '.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>Size</th>
                  <th style={{ textAlign: 'left', padding: '.75rem 0 .75rem 1rem', fontSize: '.8rem' }}>Usage</th>
                </tr>
              </thead>
              <tbody>
                {SCALE.map((row) => (
                  <tr key={row.token} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '.65rem 1rem .65rem 0', fontFamily: 'var(--font-mono)', fontSize: '.8rem', opacity: .75 }}>{row.token}</td>
                    <td style={{ padding: '.65rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}>{row.size}</td>
                    <td style={{ padding: '.65rem 0 .65rem 1rem', fontSize: '.875rem' }}>{row.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" id="rules">
        <div className="container">
          <h2>Rules</h2>
          <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1.5rem' }}>
            {[
              ['Line Length', 'Ideal measure: 60–80 characters. Use max-width or ch units to constrain reading columns.'],
              ['Line Height', 'Body: 1.6. Display: 1.1–1.25. Never below 1.0 for any running text.'],
              ['Tracking', 'Default 0 for body. Uppercase labels: +0.08em. Display at large sizes: −0.02em.'],
              ['Hierarchy', 'Maximum three type sizes per screen. If you need a fourth, reconsider the layout structure.'],
            ].map(([title, body]) => (
              <div key={title as string} className="card reveal">
                <h4>{title}</h4>
                <p style={{ fontSize: '.875rem', margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
