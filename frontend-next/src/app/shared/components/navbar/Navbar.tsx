'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Activity,
  Users,
  MapPin,
  Heart,
  Home,
  Handshake,
  BookOpen,
  Database,
  LogIn,
  UserPlus,
  ChevronDown,
  LogOut,
  User,
  Shield,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';

import api from '@/core/services/api.service';

const NAV_LINKS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/seismology', label: 'Sismología', icon: Activity, slug: 'seismology' },
  { href: '/missing-people', label: 'Desaparecidos', icon: Users, slug: 'missing_people' },
  { href: '/rescue-zones', label: 'Zonas de Rescate', icon: MapPin, slug: 'rescue_zones' },
  { href: '/health-network', label: 'Red de Salud', icon: Heart, slug: 'health_network' },
  { href: '/shelters', label: 'Refugios', icon: Home, slug: 'shelters' },
  { href: '/allies', label: 'Aliados', icon: Handshake },
  { href: '/crisis-directory', label: 'Directorio', icon: BookOpen, slug: 'crisis_directory' },
  { href: '/open-data', label: 'API Datos', icon: Database },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Inject responsive styles dynamically on client-side to prevent Next.js SSR hydration mismatch
    const styleId = 'navbar-responsive-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .mobile-hamburger {
          display: none !important;
        }
        .desktop-nav {
          display: flex !important;
        }
        @media (max-width: 991px) {
          .mobile-hamburger {
            display: flex !important;
          }
          .desktop-nav {
            display: none !important;
          }
        }
      `;
      document.head.appendChild(styleEl);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      const styleEl = document.getElementById(styleId);
      if (styleEl) styleEl.remove();
    };
  }, []);

  useEffect(() => {
    if (mounted) {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        setIsDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.removeAttribute('data-theme');
      }
    }
  }, [mounted]);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Close menus when route changes
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setMoreMenuOpen(false);
  }, [pathname]);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    async function fetchModules() {
      try {
        const { data } = await api.get('/admin-panel/modules/');
        setActiveModules(data.filter((m: any) => m.is_active).map((m: any) => m.slug));
      } catch (err) {
        console.error('Failed to load modules config', err);
      }
    }
    fetchModules();
  }, [pathname]);

  const visibleLinks = NAV_LINKS.filter(link => {
    if (!link.slug) return true;
    return activeModules.includes(link.slug);
  });

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          height: 'var(--navbar-height)',
          background: scrolled
            ? 'rgba(0, 61, 165, 0.97)'
            : 'var(--color-blue)',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--max-width)',
            margin: '0 auto',
            padding: '0 20px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* LOGO */}
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
          >
            {/* Logo placeholder — place actual logo PNG at /public/logo.png */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #FCE300 33%, #003DA5 33% 66%, #EF3340 66%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontWeight: 900,
                fontSize: '10px',
                color: "#fff",
                letterSpacing: '-0.5px',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              RVZ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  letterSpacing: '-0.3px',
                }}
              >
                RESILIENCIA
              </span>
              <span
                style={{
                  color: 'var(--color-yellow)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                }}
              >
                VZLA
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <div
            style={{
              alignItems: 'center',
              gap: '4px',
              flex: 1,
              justifyContent: 'center',
            }}
            className="desktop-nav"
            aria-label="Navegación principal"
          >
            {visibleLinks.slice(0, 7).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive(link.href) ? 'var(--color-yellow)' : 'rgba(255,255,255,0.85)',
                  fontWeight: isActive(link.href) ? 700 : 500,
                  fontSize: '0.8rem',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: isActive(link.href) ? 'rgba(252,227,0,0.12)' : 'transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(link.href)) {
                    (e.target as HTMLElement).style.color = 'var(--color-white)';
                    (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(link.href)) {
                    (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                    (e.target as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* More dropdown for last 2 items */}
            <div style={{ position: 'relative' }} ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen((v) => !v)}
                style={{
                  color: visibleLinks.slice(7).some(l => isActive(l.href)) ? 'var(--color-yellow)' : 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: visibleLinks.slice(7).some(l => isActive(l.href)) ? 'rgba(252,227,0,0.12)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                }}
              >
                Más <ChevronDown size={14} style={{ transform: moreMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </button>

              <AnimatePresence>
                {moreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      background: "var(--color-white)",
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                      padding: '8px',
                      minWidth: '180px',
                      zIndex: 600,
                      border: '1px solid var(--color-gray-200)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {visibleLinks.slice(7).map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMoreMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            color: active ? 'var(--color-blue)' : 'var(--color-gray-800)',
                            background: active ? 'rgba(0,61,165,0.08)' : 'transparent',
                            fontWeight: active ? 700 : 500,
                            fontSize: '0.875rem',
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                          }}
                        >
                          <Icon size={16} style={{ color: active ? 'var(--color-blue)' : 'var(--color-gray-500)', flexShrink: 0 }} />
                          {link.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* AUTH BUTTONS (Desktop) */}
          <div
            style={{ alignItems: 'center', gap: '8px', flexShrink: 0 }}
            className="desktop-nav"
          >
            {mounted && (
              <button
                onClick={toggleTheme}
                title="Cambiar Modo Oscuro/Claro"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: "#fff",
                  cursor: 'pointer',
                  marginRight: '8px',
                }}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            {mounted && isAuthenticated && user ? (
              <div style={{ position: 'relative' }} ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: "#fff",
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <User size={16} />
                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.first_name}
                  </span>
                  <ChevronDown size={14} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        background: "var(--color-white)",
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '8px',
                        minWidth: '180px',
                        zIndex: 600,
                        border: '1px solid var(--color-gray-200)',
                      }}
                    >
                      <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--color-gray-100)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-gray-900)' }}>
                          {user.full_name || `${user.first_name} ${user.last_name}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginTop: '2px' }}>
                          {user.email}
                        </div>
                        {user.role === 'SUPERADMIN' && (
                          <div style={{ marginTop: '4px' }}>
                            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                              <Shield size={10} /> Admin
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          color: 'var(--color-gray-800)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          marginTop: '4px',
                          textDecoration: 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gray-50)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <User size={16} /> Mi Perfil
                      </Link>

                      <button
                        onClick={logout}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--color-red)',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          borderTop: '1px solid var(--color-gray-100)',
                          marginTop: '4px',
                          paddingTop: '10px',
                        }}
                      >
                        <LogOut size={16} /> Cerrar Sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  style={{
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid rgba(255,255,255,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                  }}
                >
                  <LogIn size={15} /> Iniciar Sesión
                </Link>
                <Link
                  href="/auth/register"
                  style={{
                    background: 'var(--color-red)',
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(239,51,64,0.4)',
                  }}
                >
                  <UserPlus size={15} /> Registrarse
                </Link>
              </>
            )}

            {/* Dark Mode Toggle (mobile) */}
            {mounted && (
              <button
                onClick={toggleTheme}
                aria-label="Cambiar Modo Oscuro/Claro"
                className="mobile-hamburger"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '8px',
                  color: "#fff",
                  cursor: 'pointer',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}

            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              className="mobile-hamburger"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '8px',
                color: "#fff",
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 600,
                backdropFilter: 'blur(4px)',
              }}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: '300px',
                maxWidth: '85vw',
                background: "var(--color-white)",
                zIndex: 700,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  background: 'var(--color-blue)',
                  padding: '20px 20px 24px',
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Cerrar menú"
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px',
                    color: "#fff",
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #FCE300 33%, #003DA5 33% 66%, #EF3340 66%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '11px',
                      color: "#fff",
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    RVZ
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 800, fontSize: '1rem' }}>RESILIENCIA</div>
                    <div style={{ color: 'var(--color-yellow)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                      VZLA
                    </div>
                  </div>
                </div>

                {mounted && isAuthenticated && user && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: '0.875rem' }}>{user.full_name || user.first_name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', marginTop: '2px' }}>{user.email}</div>
                  </div>
                )}
              </div>

              {/* Venezuelan flag bar */}
              <div className="flag-bar" />

              {/* Navigation Links */}
              <nav style={{ padding: '12px', flex: 1 }}>
                {visibleLinks.map((link, i) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          marginBottom: '4px',
                          color: active ? 'var(--color-blue)' : 'var(--color-gray-800)',
                          background: active ? 'rgba(0, 61, 165, 0.08)' : 'transparent',
                          fontWeight: active ? 700 : 500,
                          fontSize: '0.925rem',
                          transition: 'all 0.2s',
                          textDecoration: 'none',
                          borderLeft: active ? '3px solid var(--color-blue)' : '3px solid transparent',
                        }}
                      >
                        <Icon size={18} style={{ color: active ? 'var(--color-blue)' : 'var(--color-gray-600)', flexShrink: 0 }} />
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Auth Buttons in Drawer */}
              <div style={{ padding: '12px 16px 24px', borderTop: '1px solid var(--color-gray-100)' }}>
                {mounted && isAuthenticated ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="btn btn-secondary btn-full"
                      style={{ justifyContent: 'center', textDecoration: 'none' }}
                    >
                      <User size={16} /> Mi Perfil
                    </Link>
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="btn btn-primary btn-full"
                      style={{ justifyContent: 'center', background: 'var(--color-red)' }}
                    >
                      <LogOut size={16} /> Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="btn btn-secondary btn-full" style={{ justifyContent: 'center', textDecoration: 'none' }}>
                      <LogIn size={16} /> Iniciar Sesión
                    </Link>
                    <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="btn btn-primary btn-full" style={{ justifyContent: 'center', textDecoration: 'none' }}>
                      <UserPlus size={16} /> Registrarse
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
