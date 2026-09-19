'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type NavItem = { label: string; href: string };

const NAV_LINKS: NavItem[] = [
  { label: 'Catalogo', href: '/catalogo' },
  { label: 'K-beauty', href: '/catalogo?kbeauty=1' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: 'calc(100% - 32px)',
          maxWidth: '720px',
        }}
      >
        {/* Pill */}
        <nav
          aria-label="Navigazione principale"
          style={{
            background: 'rgba(253,252,251,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '50px',
            boxShadow: scrolled ? '0 6px 32px rgba(0,0,0,0.13)' : '0 4px 24px rgba(0,0,0,0.08)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            style={{ textDecoration: 'none', flexShrink: 0, marginRight: '8px' }}
          >
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
              SkinMatch
            </span>
          </Link>

          {/* Center links — desktop */}
          <div className="sm-nav-links">
            {NAV_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="sm-nav-link" onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto', flexShrink: 0 }}>
            {/* CTA — always visible */}
            <Link href="/test" className="sm-nav-cta-pill" onClick={() => setMenuOpen(false)}>
              Trova il tuo SkinMatch
            </Link>

            {/* Hamburger — mobile only */}
            <button
              className="sm-nav-burger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
              aria-expanded={menuOpen}
            >
              <span
                style={{
                  display: 'block',
                  width: '18px',
                  height: '1px',
                  background: 'var(--text)',
                  transition: 'transform 0.3s ease',
                  transform: menuOpen ? 'translateY(3px) rotate(45deg)' : 'none',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '18px',
                  height: '1px',
                  background: 'var(--text)',
                  transition: 'transform 0.3s ease',
                  transform: menuOpen ? 'translateY(-3px) rotate(-45deg)' : 'none',
                }}
              />
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            style={{
              marginTop: '8px',
              background: 'rgba(253,252,251,0.97)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: '20px',
                  fontWeight: 500,
                  color: 'var(--text)',
                  textDecoration: 'none',
                  padding: '12px 18px',
                  borderRadius: '14px',
                }}
              >
                {item.label}
              </Link>
            ))}
            <div style={{ padding: '10px 8px 4px' }}>
              <Link
                href="/test"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  color: '#fff',
                  background: 'var(--accent)',
                  borderRadius: '50px',
                  padding: '13px 20px',
                  textDecoration: 'none',
                }}
              >
                Trova il tuo SkinMatch
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Spacer to offset the fixed pill nav */}
      <div style={{ height: '84px' }} />
    </>
  );
}
