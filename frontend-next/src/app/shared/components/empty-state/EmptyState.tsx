'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, AlertTriangle, RefreshCw, Plus } from 'lucide-react';

type EmptyStateType = 'search' | 'empty' | 'error' | 'loading';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  icon?: React.ReactNode;
}

const DEFAULT_CONTENT: Record<EmptyStateType, { emoji: string; title: string; description: string }> = {
  search: {
    emoji: '🔍',
    title: 'Sin resultados',
    description: 'No encontramos coincidencias para tu búsqueda. Intenta con otros términos.',
  },
  empty: {
    emoji: '📋',
    title: 'Sin registros',
    description: 'Todavía no hay información disponible en este módulo.',
  },
  error: {
    emoji: '⚠️',
    title: 'Error al cargar',
    description: 'No pudimos obtener la información. Verifica tu conexión e intenta de nuevo.',
  },
  loading: {
    emoji: '⏳',
    title: 'Cargando...',
    description: 'Por favor espera mientras obtenemos la información.',
  },
};

export default function EmptyState({
  type = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon,
}: EmptyStateProps) {
  const defaults = DEFAULT_CONTENT[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
        gap: '12px',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background:
            type === 'error'
              ? '#FEE2E2'
              : type === 'search'
              ? '#DBEAFE'
              : 'var(--color-gray-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.2rem',
          marginBottom: '8px',
        }}
      >
        {icon ?? defaults.emoji}
      </div>

      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: 800,
          color: 'var(--color-gray-900)',
          margin: 0,
        }}
      >
        {title ?? defaults.title}
      </h3>

      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--color-gray-600)',
          lineHeight: 1.6,
          maxWidth: '320px',
          margin: 0,
        }}
      >
        {description ?? defaults.description}
      </p>

      {(onAction || onSecondaryAction) && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className={`btn ${type === 'error' ? 'btn-ghost' : 'btn-primary'}`}
            >
              {type === 'error' ? <RefreshCw size={16} /> : <Plus size={16} />}
              {actionLabel}
            </button>
          )}
          {onSecondaryAction && secondaryActionLabel && (
            <button onClick={onSecondaryAction} className="btn btn-ghost">
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
