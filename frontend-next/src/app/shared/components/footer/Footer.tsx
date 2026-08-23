'use client';

import Link from 'next/link';
import { ExternalLink, Phone, MessageCircle, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer
      style={{
        background: 'var(--color-blue)',
        color: "#fff",
        marginTop: 'auto',
      }}
    >
      {/* Venezuelan flag accent bar */}
      <div className="flag-bar" />

      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          padding: '48px 24px 32px',
        }}
      >
        {/* Main grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FCE300 33%, #003DA5 33% 66%, #EF3340 66%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '11px',
                  color: "#fff",
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  flexShrink: 0,
                }}
              >
                RVZ
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: "#fff" }}>RESILIENCIA</div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-yellow)', letterSpacing: '0.12em' }}>
                  VZLA
                </div>
              </div>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: '280px' }}>
              Plataforma integral de respuesta ante desastres naturales para Venezuela. Información en tiempo real, 
              coordinación de ayuda y apoyo a comunidades afectadas.
            </p>

            <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Código Abierto', 'Gratuito', 'Sin fines de lucro'].map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Modules column */}
          <div>
            <h3
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-yellow)',
                marginBottom: '16px',
              }}
            >
              Módulos
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { href: '/seismology', label: 'Sismología' },
                { href: '/missing-people', label: 'Personas Desaparecidas' },
                { href: '/rescue-zones', label: 'Zonas de Rescate' },
                { href: '/health-network', label: 'Red de Salud' },
                { href: '/shelters', label: 'Refugios' },
                { href: '/allies', label: 'Aliados' },
                { href: '/crisis-directory', label: 'Directorio de Crisis' },
                { href: '/open-data', label: 'API de Datos Abiertos' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      color: 'rgba(255,255,255,0.65)',
                      fontSize: '0.875rem',
                      transition: 'color 0.2s',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--color-white)')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer column */}
          <div>
            <h3
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-yellow)',
                marginBottom: '16px',
              }}
            >
              Desarrollador
            </h3>

            <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
              John Di Donna
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginBottom: '20px' }}>
              Desarrollador Full Stack
            </p>

            {/* Social links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a
                href="https://www.tiktok.com/@john.didonna"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.875rem',
                  transition: 'color 0.2s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-white)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)')}
              >
                {/* TikTok icon */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.36 6.36 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.95a8.29 8.29 0 0 0 4.83 1.55V7.05a4.85 4.85 0 0 1-1.06-.36z"/>
                  </svg>
                </div>
                @john.didonna
              </a>

              <a
                href="https://www.instagram.com/john.didonna/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.875rem',
                  transition: 'color 0.2s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-white)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)')}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Instagram size={16} />
                </div>
                @john.didonna
              </a>

              <a
                href="https://wa.me/584125072134"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.875rem',
                  transition: 'color 0.2s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#25D366')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)')}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(37, 211, 102, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MessageCircle size={16} style={{ color: '#25D366' }} />
                </div>
                +58 412-507-2134
              </a>
            </div>
          </div>

          {/* Emergency contacts */}
          <div>
            <h3
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-red)',
                marginBottom: '16px',
              }}
            >
              Números de Emergencia
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Emergencias (CORPOELEC)', number: '911' },
                { label: 'Bomberos', number: '105' },
                { label: 'Policía', number: '171' },
                { label: 'Ambulancias', number: '067' },
                { label: 'Protección Civil', number: '212-900-1111' },
              ].map((item) => (
                <li key={item.number} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} style={{ color: 'var(--color-red)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{item.label}</div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: '0.9rem' }}>{item.number}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            © {currentYear} RESILIENCIA VZLA. Desarrollado con ❤️ por{' '}
            <a
              href="https://www.instagram.com/john.didonna/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-yellow)', fontWeight: 600, textDecoration: 'none' }}
            >
              John Di Donna
            </a>{' '}
            para Venezuela.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'API Docs', href: '/open-data' },
              { label: 'Política de Privacidad', href: '#' },
              { label: 'Términos de Uso', href: '#' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.4)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)')}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
