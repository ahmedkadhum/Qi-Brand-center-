import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact & Trademarks — Qi Brand Center',
  description: 'Contact the Qi brand team and learn about Qi trademark usage policies.',
}

const CONTACTS = [
  {
    role: 'Brand enquiries',
    desc: 'Questions about brand guidelines, asset usage, or co-branding requests.',
    email: 'brand@qi.com',
  },
  {
    role: 'Media & press',
    desc: 'Press releases, interview requests, and press asset access.',
    email: 'press@qi.com',
  },
  {
    role: 'Legal & trademarks',
    desc: 'Trademark licensing, infringement reports, and legal usage questions.',
    email: 'legal@qi.com',
  },
  {
    role: 'Agency partners',
    desc: 'Accredited agency access to extended asset libraries and brand training.',
    email: 'partners@qi.com',
  },
]

export default function ContactPage() {
  return (
    <>
      <section className="page-head section">
        <div className="container">
          <div className="crumbs">Resources</div>
          <h1>Contact &amp; Trademarks</h1>
          <p className="lead">
            The Qi brand team is the custodian of these guidelines. We are here to help
            partners, agencies, and internal teams apply the brand correctly.
          </p>
        </div>
      </section>

      <section className="section" id="contacts">
        <div className="container">
          <h2>Get in Touch</h2>
          <div className="grid grid-2" style={{ gap: '1.25rem', marginTop: '1.5rem' }}>
            {CONTACTS.map((c) => (
              <div key={c.role} className="card reveal">
                <h4 style={{ marginBottom: '.5rem' }}>{c.role}</h4>
                <p style={{ fontSize: '.875rem', marginBottom: '.75rem' }}>{c.desc}</p>
                <a href={`mailto:${c.email}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '.85rem', fontWeight: 600 }}>
                  {c.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="trademarks">
        <div className="container">
          <h2>Trademark Usage</h2>
          <p>
            The Qi name, the Qi brandmark, and associated product names (Qi Pay, Qi Card,
            Qi Savings) are registered trademarks of Qi Financial Technologies Ltd.
          </p>
          <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1.5rem' }}>
            <div className="card reveal" style={{ borderLeft: '3px solid var(--qi-teal)' }}>
              <h4>Permitted use</h4>
              <ul style={{ margin: 0, padding: '0 0 0 1.25rem', fontSize: '.875rem' }}>
                <li>Referring to Qi products or services in editorial, review, or comparative content</li>
                <li>Co-branding by accredited Qi partners under written licence</li>
                <li>Press and media usage consistent with press kit guidelines</li>
              </ul>
            </div>
            <div className="card reveal" style={{ borderLeft: '3px solid #e05' }}>
              <h4>Prohibited use</h4>
              <ul style={{ margin: 0, padding: '0 0 0 1.25rem', fontSize: '.875rem' }}>
                <li>Any use that implies official endorsement without written permission</li>
                <li>Incorporation into third-party product names, domain names, or app names</li>
                <li>Modification of the Qi mark in any form</li>
                <li>Use in materials that conflict with Qi values or applicable law</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="reporting">
        <div className="container">
          <h2>Reporting Infringement</h2>
          <p>
            If you believe you have found an unauthorised use of the Qi brand, please
            email <a href="mailto:legal@qi.com" style={{ fontWeight: 600 }}>legal@qi.com</a> with
            as much detail as possible, including URLs, screenshots, and the nature of the
            suspected infringement. We investigate all reports.
          </p>
        </div>
      </section>

      <section className="section" id="brand-approval">
        <div className="container">
          <div className="card" style={{ background: 'var(--qi-black)', color: '#fff', borderRadius: 'var(--r-xl)' }}>
            <h3 style={{ color: 'var(--qi-yellow)', marginTop: 0 }}>Brand approval</h3>
            <p style={{ opacity: .85, marginBottom: '1.5rem' }}>
              All external-facing materials that carry the Qi brand require approval from
              the brand team before publication. Use the{' '}
              <a href="/compliance" style={{ color: 'var(--qi-yellow)', fontWeight: 600 }}>Compliance Agent</a>{' '}
              for automated pre-checks, then submit for human review.
            </p>
            <a href="mailto:brand@qi.com" className="btn" style={{ display: 'inline-block' }}>
              Request approval
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
