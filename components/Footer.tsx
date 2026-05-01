import React from 'react'
import Link from 'next/link'

const QiLogoSvg = () => (
  <svg viewBox="0 0 100 100" width="28" height="28">
    <g fill="currentColor" transform="translate(0 -2) scale(.20887)">
      <path d="M238.07,394.25c22.74,0.17,44.36-4.61,63.88-13.26l61.71,62.67c-36.77,22.41-80.01,35.24-126.24,34.87C105.26,477.52-1.02,369.55,0.01,237.41C1.04,105.25,108.99-1.03,241.14,0.01c132.14,1.02,238.43,108.97,237.41,241.13c-0.35,44.42-12.82,85.87-34.2,121.37l-62.21-63.18c7.63-18.11,11.94-37.97,12.1-58.84c0.66-85.6-68.19-155.5-153.76-156.17c-85.61-0.68-155.52,68.16-156.19,153.76C83.64,323.66,152.47,393.58,238.07,394.25 M193.2,239.27c0,25.46,20.62,46.08,46.07,46.08c25.46,0,46.09-20.62,46.09-46.08c0-25.44-20.63-46.07-46.09-46.07C213.82,193.21,193.2,213.83,193.2,239.27 M466.94,410.26L342.8,286.12c-15.76-15.76-41.3-15.76-57.06,0c-15.75,15.76-15.75,41.31,0,57.07l124.12,124.14c15.77,15.75,41.31,15.75,57.07,0C482.71,451.55,482.71,426.02,466.94,410.26" />
    </g>
  </svg>
)

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link className="brand" href="/" style={{ color: '#fff' }}>
              <span className="qi-logo" style={{ color: 'var(--qi-yellow)' }}>
                <QiLogoSvg />
              </span>
              <span className="brand-text" style={{ color: '#fff' }}>Qi Brand Center</span>
            </Link>
            <p style={{ marginTop: '18px', color: 'rgba(255,255,255,.7)', maxWidth: '36ch', fontSize: '.92rem' }}>
              A simple, bold, human brand for modern banking. Built around protection, clarity, and a fresh outlook.
            </p>
          </div>
          <div>
            <h5>Identity</h5>
            <Link href="/identity">Brandmark</Link>
            <Link href="/color">Color</Link>
            <Link href="/typography">Typography</Link>
            <Link href="/iconography">Iconography</Link>
          </div>
          <div>
            <h5>System</h5>
            <Link href="/imagery">Imagery</Link>
            <Link href="/graphic-device">Graphic Device</Link>
            <Link href="/grids-layout">Grids &amp; Layout</Link>
            <Link href="/voice">Voice &amp; Tone</Link>
          </div>
          <div>
            <h5>Resources</h5>
            <Link href="/applications">Applications</Link>
            <Link href="/compliance">Compliance Agent</Link>
            <Link href="/admin">Brand Settings</Link>
            <Link href="/downloads">Downloads</Link>
            <Link href="/contact">Contact &amp; Trademarks</Link>
          </div>
        </div>
        <div className="legal">
          <div>© 2026 Qi. Brand Guidelines v0.2.</div>
          <div>Press <span className="kbd">⌘</span> <span className="kbd">K</span> to search</div>
        </div>
      </div>
    </footer>
  )
}
