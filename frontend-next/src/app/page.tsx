"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Activity, 
  Search, 
  MapPin, 
  HeartPulse, 
  Home as HomeIcon, 
  Users, 
  Compass, 
  Code, 
  ShieldAlert,
  ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/core/store/auth.store";
import seismologyService from "@/core/services/seismology.service";
import missingPeopleService from "@/core/services/missing-people.service";
import rescueZonesService from "@/core/services/rescue-zones.service";
import { SeismicStats } from "@/core/models/seismo.interface";
import { MissingStats } from "@/core/models/missing-person.interface";

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [seismoStats, setSeismoStats] = useState<SeismicStats | null>(null);
  const [missingStats, setMissingStats] = useState<MissingStats | null>(null);
  const [activeZonesCount, setActiveZonesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        const [seismoData, missingData, zonesData] = await Promise.all([
          seismologyService.getStats(),
          missingPeopleService.getStats(),
          rescueZonesService.getList('active', undefined, 1)
        ]);
        setSeismoStats(seismoData);
        setMissingStats(missingData);
        setActiveZonesCount(zonesData.count || 0);
      } catch (error) {
        console.error("Error loading home page stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const modules = [
    {
      id: "seismology",
      title: "Monitoreo Sísmico",
      desc: "Reporte de sismos en tiempo real en territorio venezolano y mapa de epicentros.",
      icon: Activity,
      path: "/seismology",
      color: "var(--color-blue)",
      badge: seismoStats?.events_today ? `${seismoStats.events_today} hoy` : null,
    },
    {
      id: "missing-people",
      title: "Búsqueda de Desaparecidos",
      desc: "Registro de personas perdidas, localización y control de duplicados automatizado.",
      icon: Search,
      path: "/missing-people",
      color: "var(--color-red)",
      badge: missingStats?.missing_count ? `${missingStats.missing_count} activos` : null,
    },
    {
      id: "rescue-zones",
      title: "Zonas de Rescate",
      desc: "Mapeo de derrumbes, maquinaria requerida y registro de voluntarios técnicos.",
      icon: MapPin,
      path: "/rescue-zones",
      color: "#F59E0B",
      badge: activeZonesCount ? `${activeZonesCount} zonas` : null,
    },
    {
      id: "health-network",
      title: "Red Hospitalaria",
      desc: "Semáforo de operatividad de hospitales, clínicas e insumos médicos críticos faltantes.",
      icon: HeartPulse,
      path: "/health-network",
      color: "#10B981",
    },
    {
      id: "shelters",
      title: "Refugios y Campamentos",
      desc: "Ubicaciones de refugios, capacidad actual y necesidades de insumos para acopio.",
      icon: HomeIcon,
      path: "/shelters",
      color: "#8B5CF6",
    },
    {
      id: "allies",
      title: "Aliados y Donaciones",
      desc: "Catálogo de empresas y marcas que ofrecen servicios, transporte o insumos.",
      icon: Users,
      path: "/allies",
      color: "#EC4899",
    },
    {
      id: "crisis-directory",
      title: "Directorio de Crisis",
      desc: "Tablón publicitario de aplicaciones y recursos solidarios de terceros.",
      icon: Compass,
      path: "/crisis-directory",
      color: "#06B6D4",
    },
    {
      id: "open-data",
      title: "API de Datos Abiertos",
      desc: "Endpoints públicos documentados para que otros desarrolladores alimenten el flujo.",
      icon: Code,
      path: "/open-data",
      color: "var(--color-gray-800)",
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 12px' : '0 1rem' }}>
      
      {/* Alert Banner for Recent Seismo */}
      {seismoStats?.latest_event && seismoStats.latest_event.magnitude >= 5.0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card card-glass" 
          style={{ 
            border: '2px solid var(--color-red)', 
            background: 'rgba(239,51,64,0.1)', 
            padding: isMobile ? '0.875rem' : '1.25rem', 
            marginBottom: isMobile ? '1rem' : '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: isMobile ? '0.625rem' : '1rem',
            borderRadius: '12px'
          }}
        >
          <ShieldAlert size={isMobile ? 24 : 36} color="var(--color-red)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: 'var(--color-red)', fontWeight: '700', marginBottom: '0.25rem', fontSize: isMobile ? '0.8rem' : '1rem' }}>
              ALERTA SÍSMICA RECIENTE
            </h4>
            <p style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', color: 'var(--color-gray-900)', lineHeight: 1.4 }}>
              Sismo de <strong>M{seismoStats.latest_event.magnitude}</strong> en <strong>{seismoStats.latest_event.epicenter_name}</strong>. Ver Sismología.
            </p>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        padding: isMobile ? '1.75rem 1.25rem' : '3.5rem 2rem', 
        background: 'linear-gradient(135deg, var(--color-blue) 0%, #002266 100%)', 
        borderRadius: isMobile ? '16px' : '24px', 
        color: "#fff",
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        marginBottom: isMobile ? '1.25rem' : '3rem'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '5px', display: 'flex'
        }}>
          <div style={{ flex: 1, background: 'var(--color-yellow)' }}></div>
          <div style={{ flex: 1, background: 'var(--color-blue)' }}></div>
          <div style={{ flex: 1, background: 'var(--color-red)' }}></div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px' }}>
          <span style={{ 
            background: 'var(--color-yellow)', color: 'var(--color-black)', fontWeight: 'bold', 
            padding: isMobile ? '0.25rem 0.625rem' : '0.4rem 0.8rem', borderRadius: '30px', 
            fontSize: isMobile ? '0.6rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', 
            marginBottom: isMobile ? '0.75rem' : '1.25rem', display: 'inline-block' 
          }}>
            Plataforma Nacional de Respuesta
          </span>
          <h1 style={{ 
            fontSize: isMobile ? '1.65rem' : 'clamp(2rem, 5vw, 3.25rem)', 
            fontWeight: '900', lineHeight: 1.1, marginBottom: '0.75rem', letterSpacing: '-1px' 
          }}>
            RESILIENCIA VZLA
          </h1>
          <p style={{ 
            fontSize: isMobile ? '0.825rem' : 'clamp(1rem, 2vw, 1.2rem)', 
            opacity: 0.9, marginBottom: isMobile ? '1.25rem' : '2rem', 
            fontWeight: 300, lineHeight: 1.5 
          }}>
            {isMobile 
              ? "Plataforma de emergencias: sismos, desaparecidos, refugios y ayuda humanitaria."
              : "Centralización y verificación de reportes de emergencia, personas desaparecidas y canalización de ayuda para superar el caos informativo ante desastres sísmicos."
            }
          </p>

          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {!isAuthenticated ? (
              <>
                <Link href="/auth/register" style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
                  background: 'var(--color-red)', color: '#fff', 
                  padding: isMobile ? '11px 16px' : '14px 28px', 
                  textDecoration: 'none', borderRadius: '8px', fontWeight: 700, 
                  fontSize: isMobile ? '0.85rem' : '1rem',
                  minHeight: '44px',
                }}>
                  Registrarse
                </Link>
                <Link href="/auth/login" style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
                  border: '2px solid rgba(255,255,255,0.6)', color: "#fff", 
                  padding: isMobile ? '9px 14px' : '12px 26px', 
                  textDecoration: 'none', borderRadius: '8px', fontWeight: 600, 
                  fontSize: isMobile ? '0.85rem' : '1rem', background: 'transparent',
                  minHeight: '44px',
                }}>
                  Iniciar Sesión
                </Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'rgba(255,255,255,0.1)', padding: '0.625rem 1rem', borderRadius: '50px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }}></div>
                <span style={{ fontSize: isMobile ? '0.8rem' : '0.95rem' }}>Hola, <strong>{user?.first_name}</strong></span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section style={{ marginBottom: isMobile ? '1.5rem' : '3.5rem' }}>
        <h3 style={{ 
          fontSize: isMobile ? '0.85rem' : '1.25rem', fontWeight: '700', 
          textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-blue)', 
          marginBottom: isMobile ? '0.875rem' : '1.5rem', 
          display: 'flex', alignItems: 'center', gap: '0.5rem' 
        }}>
          <span>📊</span> Estado de la Emergencia
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: isMobile ? '0.625rem' : '1.5rem' 
        }}>
          {[
            { label: 'Sismos Hoy', value: seismoStats?.events_today ?? 0, color: 'var(--color-blue)', sub: 'Últimas 24h' },
            { label: 'Desaparecidos', value: missingStats?.missing_count ?? 0, color: 'var(--color-red)', sub: 'Sin localizar' },
            { label: 'Localizados', value: missingStats?.found_count ?? 0, color: '#F59E0B', sub: 'Encontrados' },
            { label: 'Zonas Críticas', value: activeZonesCount, color: '#10B981', sub: 'Con rescate activo' },
          ].map((stat) => (
            <div key={stat.label} className="card card-glass" style={{ padding: isMobile ? '0.875rem' : '1.5rem', borderLeft: `4px solid ${stat.color}` }}>
              <span style={{ color: 'var(--color-gray-600)', fontSize: isMobile ? '0.65rem' : '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>{stat.label}</span>
              <h2 style={{ fontSize: isMobile ? '1.6rem' : '2.5rem', fontWeight: '800', marginTop: '0.2rem', color: stat.color }}>
                {loading ? "..." : stat.value}
              </h2>
              <p style={{ fontSize: isMobile ? '0.65rem' : '0.8rem', color: 'var(--color-gray-600)', marginTop: '0.1rem' }}>{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section style={{ marginBottom: isMobile ? '1.5rem' : '4rem' }}>
        <h3 style={{ 
          fontSize: isMobile ? '0.85rem' : '1.25rem', fontWeight: '700', 
          textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-blue)', 
          marginBottom: isMobile ? '0.875rem' : '1.5rem', 
          display: 'flex', alignItems: 'center', gap: '0.5rem' 
        }}>
          <span>🚀</span> Módulos del Sistema
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: isMobile ? '0.5rem' : '1.5rem' 
        }}>
          {modules.map((m) => {
            const IconComponent = m.icon;
            return (
              <Link href={m.path} key={m.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <motion.div 
                  whileHover={{ scale: isMobile ? 1 : 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="card card-glass" 
                  style={{ 
                    padding: isMobile ? '0.875rem 1rem' : '1.75rem', 
                    display: 'flex', 
                    flexDirection: isMobile ? 'row' : 'column',
                    alignItems: isMobile ? 'center' : 'flex-start',
                    gap: isMobile ? '0.875rem' : '0',
                    position: 'relative',
                    borderTop: isMobile ? 'none' : `4px solid ${m.color}`,
                    borderLeft: isMobile ? `4px solid ${m.color}` : 'none',
                    minHeight: isMobile ? '64px' : 'auto',
                  }}
                >
                  {m.badge && !isMobile && (
                    <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(239,51,64,0.1)', color: 'var(--color-red)', fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '20px' }}>
                      {m.badge}
                    </span>
                  )}
                  
                  <div style={{ 
                    background: `rgba(0, 61, 165, 0.08)`, 
                    color: m.color,
                    width: isMobile ? '38px' : '48px', 
                    height: isMobile ? '38px' : '48px', 
                    minWidth: isMobile ? '38px' : '48px',
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: isMobile ? '0' : '1.25rem',
                    flexShrink: 0,
                  }}>
                    <IconComponent size={isMobile ? 18 : 24} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: isMobile ? '0.15rem' : '0.5rem' }}>
                      <h4 style={{ fontSize: isMobile ? '0.875rem' : '1.15rem', fontWeight: '700', color: 'var(--color-gray-900)', margin: 0 }}>
                        {m.title}
                      </h4>
                      {m.badge && isMobile && (
                        <span style={{ background: 'rgba(239,51,64,0.1)', color: 'var(--color-red)', fontSize: '0.6rem', fontWeight: '700', padding: '0.1rem 0.4rem', borderRadius: '10px', flexShrink: 0 }}>
                          {m.badge}
                        </span>
                      )}
                    </div>
                    {!isMobile && (
                      <>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                          {m.desc}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--color-blue)', fontWeight: '600' }}>
                          <span>Acceder</span>
                          <ChevronRight size={16} />
                        </div>
                      </>
                    )}
                    {isMobile && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-gray-600)', lineHeight: 1.3, margin: 0 }}>
                        {m.desc.length > 65 ? m.desc.substring(0, 65) + '...' : m.desc}
                      </p>
                    )}
                  </div>
                  
                  {isMobile && <ChevronRight size={15} color="var(--color-gray-400)" style={{ flexShrink: 0 }} />}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </section>

    </div>
  );
}
