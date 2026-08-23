'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Instagram } from 'lucide-react';

interface SocialFlyerData {
  name: string;
  description?: string;
  contact?: string;
  services?: string[];
  location?: string;
  phone?: string;
  whatsappLink?: string;
  type?: string;
  status?: string;
  photoUrl?: string;
}

interface SocialFlyerProps {
  isOpen: boolean;
  onClose: () => void;
  data: SocialFlyerData;
  title?: string;
}

export default function SocialFlyer({ isOpen, onClose, data, title = 'Compartir Información' }: SocialFlyerProps) {
  const flyerRef = React.useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);

  const generateFlyer = useCallback(async () => {
    if (!flyerRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0A0A0A',
        logging: false,
      });
      const url = canvas.toDataURL('image/png', 0.95);
      setImageUrl(url);
      setGenerated(true);
    } catch (err) {
      console.error('Error generating flyer:', err);
    } finally {
      setGenerating(false);
    }
  }, []);

  const downloadFlyer = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `resiliencia-vzla-${data.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  }, [imageUrl, data.name]);

  const handleClose = () => {
    setGenerated(false);
    setImageUrl(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gray-900)' }}>{title}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)', marginTop: '2px' }}>
                  Genera un flyer para Instagram / WhatsApp
                </p>
              </div>
              <button
                onClick={handleClose}
                style={{ background: 'var(--color-gray-100)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ paddingTop: '16px' }}>
              {/* Hidden flyer template (captured by html2canvas) */}
              <div
                ref={flyerRef}
                style={{
                  width: '400px',
                  height: '400px',
                  background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 100%)',
                  borderRadius: '16px',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'absolute',
                  left: '-9999px',
                  top: '-9999px',
                  fontFamily: 'Inter, sans-serif',
                  overflow: 'hidden',
                }}
              >
                {/* Flag bar */}
                <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '24px' }}>
                  <div style={{ flex: 1, background: '#FCE300' }} />
                  <div style={{ flex: 1, background: '#003DA5' }} />
                  <div style={{ flex: 1, background: '#EF3340' }} />
                </div>

                {/* Logo area */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #FCE300 33%, #003DA5 33% 66%, #EF3340 66%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '9px',
                      color: "#fff",
                    }}
                  >
                    RVZ
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 800, fontSize: '14px' }}>RESILIENCIA VZLA</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>resilienciavzla.com</div>
                  </div>
                </div>

                {/* Main content */}
                <div style={{ flex: 1 }}>
                  {data.type && (
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: 'rgba(252,227,0,0.15)',
                        color: '#FCE300',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '12px',
                      }}
                    >
                      {data.type}
                    </div>
                  )}

                  <h2
                    style={{
                      color: "#fff",
                      fontSize: '22px',
                      fontWeight: 900,
                      lineHeight: 1.2,
                      marginBottom: '10px',
                    }}
                  >
                    {data.name}
                  </h2>

                  {data.description && (
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
                      {data.description.slice(0, 120)}{data.description.length > 120 ? '...' : ''}
                    </p>
                  )}

                  {data.services && data.services.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                      {data.services.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '20px',
                            background: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {data.location && (
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '8px' }}>
                      📍 {data.location}
                    </div>
                  )}

                  {data.phone && (
                    <div style={{ color: '#FCE300', fontWeight: 700, fontSize: '14px' }}>
                      📞 {data.phone}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                    Información verificada por la comunidad
                  </div>
                  <div style={{ color: '#EF3340', fontWeight: 800, fontSize: '12px' }}>
                    #ResilienciaVZLA
                  </div>
                </div>
              </div>

              {/* Preview (visible) */}
              {!generated ? (
                <div>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {['#FCE300', '#003DA5', '#EF3340'].map((c) => (
                        <div key={c} style={{ flex: 1, height: '4px', background: c, borderRadius: '2px' }} />
                      ))}
                    </div>
                    <div style={{ color: '#FCE300', fontSize: '0.7rem', fontWeight: 700 }}>RESILIENCIA VZLA</div>
                    <div style={{ color: "#fff", fontWeight: 800, fontSize: '1rem' }}>{data.name}</div>
                    {data.description && (
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        {data.description.slice(0, 100)}{data.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                    {data.phone && (
                      <div style={{ color: '#FCE300', fontWeight: 700, fontSize: '0.85rem' }}>📞 {data.phone}</div>
                    )}
                    <div style={{ color: '#EF3340', fontWeight: 800, fontSize: '0.75rem', marginTop: '4px' }}>#ResilienciaVZLA</div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)', textAlign: 'center', marginBottom: '16px' }}>
                    Genera y descarga el flyer optimizado para Instagram Stories y WhatsApp.
                  </p>

                  <button
                    onClick={generateFlyer}
                    disabled={generating}
                    className="btn btn-primary btn-full btn-lg"
                    style={{ justifyContent: 'center' }}
                  >
                    {generating ? (
                      <>
                        <div className="spinner spinner-sm" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Share2 size={18} />
                        Generar Flyer
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Flyer generado"
                      style={{ width: '100%', borderRadius: '12px', marginBottom: '16px' }}
                    />
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={downloadFlyer}
                      className="btn btn-primary"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Download size={16} /> Descargar PNG
                    </button>
                    <button
                      onClick={() => { setGenerated(false); setImageUrl(null); }}
                      className="btn btn-ghost"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Regenerar
                    </button>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', textAlign: 'center', marginTop: '12px' }}>
                    <Instagram size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Tamaño 1:1 optimizado para Instagram y WhatsApp
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
