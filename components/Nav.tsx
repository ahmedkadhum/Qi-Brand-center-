'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const QiLogoSvg = () => (
  <svg viewBox="0 0 100 100" width="28" height="28">
    <g fill="currentColor" transform="translate(0 -2) scale(.20887)">
      <path d="M238.07,394.25c22.74,0.17,44.36-4.61,63.88-13.26l61.71,62.67c-36.77,22.41-80.01,35.24-126.24,34.87C105.26,477.52-1.02,369.55,0.01,237.41C1.04,105.25,108.99-1.03,241.14,0.01c132.14,1.02,238.43,108.97,237.41,241.13c-0.35,44.42-12.82,85.87-34.2,121.37l-62.21-63.18c7.63-18.11,11.94-37.97,12.1-58.84c0.66-85.6-68.19-155.5-153.76-156.17c-85.61-0.68-155.52,68.16-156.19,153.76C83.64,323.66,152.47,393.58,238.07,394.25 M193.2,239.27c0,25.46,20.62,46.08,46.07,46.08c25.46,0,46.09-20.62,46.09-46.08c0-25.44-20.63-46.07-46.09-46.07C213.82,193.21,193.2,213.83,193.2,239.27 M466.94,410.26L342.8,286.12c-15.76-15.76-41.3-15.76-57.06,0c-15.75,15.76-15.75,41.31,0,57.07l124.12,124.14c15.77,15.75,41.31,15.75,57.07,0C482.71,451.55,482.71,426.02,466.94,410.26" />
    </g>
  </svg>
)

export default function Nav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [theme, setTheme] = useState<string>('')

  useEffect(() => {
    const stored = localStorage.getItem('qi-theme')
    if (stored) {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  function toggleTheme() {
    const cur = theme === 'dark' ? '' : 'dark'
    setTheme(cur)
    if (cur) {
      document.documentElement.setAttribute('data-theme', cur)
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem('qi-theme', cur)
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/" aria-label="Qi Brand Center home">
            <span className="qi-logo" style={{ color: 'var(--qi-yellow)' }}>
              <QiLogoSvg />
            </span>
            <span className="brand-text">Qi Brand</span>
          </Link>

          <nav className={`nav-links${menuOpen ? ' open' : ''}`} aria-label="Primary">
            <Link className={`nav-link${isActive('/') && pathname === '/' ? ' active' : ''}`} href="/">Home</Link>

            <div className="has-dropdown">
              <Link className={`nav-link${isActive('/identity') ? ' active' : ''}`} href="/identity">
                Identity <span className="chev">▾</span>
              </Link>
              <div className="dropdown" role="menu">
                <Link href="/identity">
                  <span className="swatch" style={{ background: '#000' }}></span> Brandmark
                </Link>
                <Link href="/color">
                  <span className="swatch" style={{ background: '#F2CD00' }}></span> Color
                </Link>
                <Link href="/typography">
                  <span className="swatch" style={{ background: '#0A0A0A' }}></span> Typography
                </Link>
                <Link href="/iconography">
                  <span className="swatch" style={{ background: '#00BFB3' }}></span> Iconography
                </Link>
                <Link href="/imagery">
                  <span className="swatch" style={{ background: '#0891B2' }}></span> Imagery
                </Link>
                <Link href="/graphic-device">
                  <span className="swatch" style={{ background: '#FFE76A' }}></span> Graphic Device
                </Link>
                <Link href="/grids-layout">
                  <span className="swatch" style={{ background: '#EDEAE0' }}></span> Grids &amp; Layout
                </Link>
              </div>
            </div>

            <Link className={`nav-link${isActive('/voice') ? ' active' : ''}`} href="/voice">Voice</Link>
            <Link className={`nav-link${isActive('/applications') ? ' active' : ''}`} href="/applications">Apps</Link>
            <Link className={`nav-link${isActive('/compliance') ? ' active' : ''}`} href="/compliance">Compliance</Link>
            <Link className={`nav-link${isActive('/admin') ? ' active' : ''}`} href="/admin">Brand&nbsp;Settings</Link>
            <Link className={`nav-link${isActive('/downloads') ? ' active' : ''}`} href="/downloads">Downloads</Link>
          </nav>

          <div className="nav-tools">
            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search (⌘K)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </svg>
            </button>
            <Link className="nav-cta" href="/downloads">
              Get assets
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <button className="icon-btn menu-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div
          className="search-overlay open"
          role="dialog"
          aria-label="Search"
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false) }}
        >
          <div className="search-box">
            <input
              autoFocus
              placeholder="Search the brand center… (e.g. 'Yellow hex', 'clearspace', 'Spectrum')"
              onChange={(e) => {
                const q = e.target.value.toLowerCase()
                const results = document.querySelectorAll<HTMLAnchorElement>('.search-box .results a')
                results.forEach(a => {
                  a.style.display = !q || a.textContent?.toLowerCase().includes(q) ? '' : 'none'
                })
              }}
            />
            <div className="results">
              <Link href="/identity" onClick={() => setSearchOpen(false)}><span>Brandmark, clearspace, sizing</span><span className="kbd">Identity</span></Link>
              <Link href="/color" onClick={() => setSearchOpen(false)}><span>Cool palette — Yellow, Black, Teal, White</span><span className="kbd">Color</span></Link>
              <Link href="/color#spectrum" onClick={() => setSearchOpen(false)}><span>Spectrum — Spark, Pulse, Path, Hearth, Grace, Legacy</span><span className="kbd">Color</span></Link>
              <Link href="/typography" onClick={() => setSearchOpen(false)}><span>FF Mark Pro &amp; 29LT Bukra</span><span className="kbd">Type</span></Link>
              <Link href="/iconography" onClick={() => setSearchOpen(false)}><span>14 named icons + 3D environment</span><span className="kbd">Icons</span></Link>
              <Link href="/imagery" onClick={() => setSearchOpen(false)}><span>Lifestyle imagery rules</span><span className="kbd">Image</span></Link>
              <Link href="/graphic-device" onClick={() => setSearchOpen(false)}><span>Extended circle device</span><span className="kbd">Device</span></Link>
              <Link href="/grids-layout" onClick={() => setSearchOpen(false)}><span>Vertical &amp; horizontal grid</span><span className="kbd">Layout</span></Link>
              <Link href="/voice" onClick={() => setSearchOpen(false)}><span>Voice &amp; tone — clear, confident, warm</span><span className="kbd">Voice</span></Link>
              <Link href="/applications" onClick={() => setSearchOpen(false)}><span>Qi cards, signage, social</span><span className="kbd">Apps</span></Link>
              <Link href="/compliance" onClick={() => setSearchOpen(false)}><span>Compliance Agent — auto-audit a creative</span><span className="kbd">Agent</span></Link>
              <Link href="/downloads" onClick={() => setSearchOpen(false)}><span>Download the brand kit</span><span className="kbd">Files</span></Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
