import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brandmark — Qi Brand Center',
  description: 'The Qi brandmark: construction, clear space, misuse, and downloadable assets.',
}

export default function IdentityPage() {
  return (
    <>
      <section className="page-head section">
        <div className="container">
          <div className="crumbs">Identity</div>
          <h1>Brandmark</h1>
          <p className="lead">
            The Qi mark is a bold, geometric symbol derived from the letter&nbsp;<em>Q</em>.
            It communicates protection, clarity, and forward momentum — always used with
            precision and respect.
          </p>
        </div>
      </section>

      <section className="section" id="construction">
        <div className="container">
          <h2>Construction</h2>
          <p>
            The primary mark is drawn on a 100 × 100 unit grid. The counter space (open
            interior) aligns to a circle of 62 units diameter. The descending stroke exits
            at 45 ° and terminates with a rounded cap. Never redraw or distort the vector.
          </p>
          <div className="grid grid-2" style={{ marginTop: '2rem' }}>
            <div className="card reveal">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  background: 'var(--bg-2)',
                  borderRadius: 'var(--r-lg)',
                }}
              >
                <svg viewBox="0 0 100 100" width="120" height="120">
                  <g fill="var(--ink)" transform="translate(0 -2) scale(.20887)">
                    <path d="M238.07,394.25c22.74,0.17,44.36-4.61,63.88-13.26l61.71,62.67c-36.77,22.41-80.01,35.24-126.24,34.87C105.26,477.52-1.02,369.55,0.01,237.41C1.04,105.25,108.99-1.03,241.14,0.01c132.14,1.02,238.43,108.97,237.41,241.13c-0.35,44.42-12.82,85.87-34.2,121.37l-62.21-63.18c7.63-18.11,11.94-37.97,12.1-58.84c0.66-85.6-68.19-155.5-153.76-156.17c-85.61-0.68-155.52,68.16-156.19,153.76C83.64,323.66,152.47,393.58,238.07,394.25 M193.2,239.27c0,25.46,20.62,46.08,46.07,46.08c25.46,0,46.09-20.62,46.09-46.08c0-25.44-20.63-46.07-46.09-46.07C213.82,193.21,193.2,213.83,193.2,239.27 M466.94,410.26L342.8,286.12c-15.76-15.76-41.3-15.76-57.06,0c-15.75,15.76-15.75,41.31,0,57.07l124.12,124.14c15.77,15.75,41.31,15.75,57.07,0C482.71,451.55,482.71,426.02,466.94,410.26" />
                  </g>
                </svg>
              </div>
              <h4 style={{ marginTop: '1rem' }}>Primary mark — on light</h4>
            </div>
            <div className="card reveal">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  background: 'var(--qi-black)',
                  borderRadius: 'var(--r-lg)',
                }}
              >
                <svg viewBox="0 0 100 100" width="120" height="120">
                  <g fill="var(--qi-yellow)" transform="translate(0 -2) scale(.20887)">
                    <path d="M238.07,394.25c22.74,0.17,44.36-4.61,63.88-13.26l61.71,62.67c-36.77,22.41-80.01,35.24-126.24,34.87C105.26,477.52-1.02,369.55,0.01,237.41C1.04,105.25,108.99-1.03,241.14,0.01c132.14,1.02,238.43,108.97,237.41,241.13c-0.35,44.42-12.82,85.87-34.2,121.37l-62.21-63.18c7.63-18.11,11.94-37.97,12.1-58.84c0.66-85.6-68.19-155.5-153.76-156.17c-85.61-0.68-155.52,68.16-156.19,153.76C83.64,323.66,152.47,393.58,238.07,394.25 M193.2,239.27c0,25.46,20.62,46.08,46.07,46.08c25.46,0,46.09-20.62,46.09-46.08c0-25.44-20.63-46.07-46.09-46.07C213.82,193.21,193.2,213.83,193.2,239.27 M466.94,410.26L342.8,286.12c-15.76-15.76-41.3-15.76-57.06,0c-15.75,15.76-15.75,41.31,0,57.07l124.12,124.14c15.77,15.75,41.31,15.75,57.07,0C482.71,451.55,482.71,426.02,466.94,410.26" />
                  </g>
                </svg>
              </div>
              <h4 style={{ marginTop: '1rem' }}>Primary mark — on dark</h4>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="clearspace">
        <div className="container">
          <h2>Clear Space</h2>
          <p>
            Always maintain a minimum clear zone equal to the cap-height of the wordmark
            (or the radius of the mark when used standalone) on all four sides. Never
            allow other graphic elements to intrude into this zone.
          </p>
        </div>
      </section>

      <section className="section" id="misuse">
        <div className="container">
          <h2>Misuse</h2>
          <div className="grid grid-3">
            {[
              'Do not rotate the mark',
              'Do not stretch or skew',
              'Do not change the brand colors',
              'Do not apply drop shadows',
              'Do not use on low-contrast backgrounds',
              'Do not recreate from type or clip art',
            ].map((rule) => (
              <div key={rule} className="card reveal" style={{ borderLeft: '3px solid var(--qi-teal)' }}>
                <p style={{ margin: 0, fontSize: '.9rem' }}>{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-yellow" id="downloads">
        <div className="container">
          <h2>Downloads</h2>
          <p>
            All official logo files are available on the{' '}
            <a href="/downloads" style={{ fontWeight: 600 }}>Downloads</a> page in SVG,
            PNG (transparent), and PDF formats for both light and dark backgrounds.
          </p>
        </div>
      </section>
    </>
  )
}
