'use client';

import React from 'react';

type BadgeStatus =
  | 'operational'
  | 'critical'
  | 'closed'
  | 'active'
  | 'missing'
  | 'found'
  | 'urgent'
  | 'at_capacity'
  | 'contained'
  | 'resolved'
  | 'minor'
  | 'moderate'
  | 'strong';

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  animated?: boolean;
}

const STATUS_MAP: Record<BadgeStatus, { defaultLabel: string; bg: string; color: string; urgent: boolean }> = {
  operational: { defaultLabel: 'Operativo',    bg: '#D1FAE5', color: '#065F46', urgent: false },
  found:        { defaultLabel: 'Localizado',   bg: '#D1FAE5', color: '#065F46', urgent: false },
  resolved:     { defaultLabel: 'Resuelta',     bg: '#D1FAE5', color: '#065F46', urgent: false },
  minor:        { defaultLabel: 'Menor',        bg: '#D1FAE5', color: '#065F46', urgent: false },
  contained:    { defaultLabel: 'Contenida',    bg: '#FEF3C7', color: '#92400E', urgent: false },
  at_capacity:  { defaultLabel: 'Lleno',        bg: '#FEF3C7', color: '#92400E', urgent: false },
  moderate:     { defaultLabel: 'Moderado',     bg: '#FEF3C7', color: '#92400E', urgent: false },
  active:       { defaultLabel: 'Activo',       bg: '#FEE2E2', color: '#991B1B', urgent: true },
  critical:     { defaultLabel: 'Crítico',      bg: '#FEE2E2', color: '#991B1B', urgent: true },
  urgent:       { defaultLabel: 'Urgente',      bg: '#FEE2E2', color: '#991B1B', urgent: true },
  missing:      { defaultLabel: 'Desaparecido', bg: '#FEE2E2', color: '#991B1B', urgent: true },
  strong:       { defaultLabel: 'Fuerte',       bg: '#FEE2E2', color: '#991B1B', urgent: true },
  closed:       { defaultLabel: 'Cerrado',      bg: '#F1F3F5', color: '#495057', urgent: false },
};

const SIZE_STYLES: Record<'sm' | 'md' | 'lg', { fontSize: string; padding: string; dotSize: string }> = {
  sm: { fontSize: '0.65rem', padding: '3px 8px',  dotSize: '6px'  },
  md: { fontSize: '0.72rem', padding: '4px 12px', dotSize: '7px'  },
  lg: { fontSize: '0.8rem',  padding: '6px 16px', dotSize: '9px'  },
};

export default function StatusBadge({
  status,
  label,
  size = 'md',
  showDot = true,
  animated = true,
}: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.closed;
  const sizeStyle = SIZE_STYLES[size];
  const displayLabel = label ?? config.defaultLabel;
  const shouldPulse = animated && config.urgent;

  const dotStyle: React.CSSProperties = {
    width: sizeStyle.dotSize,
    height: sizeStyle.dotSize,
    borderRadius: '50%',
    background: config.color,
    flexShrink: 0,
    display: 'inline-block',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: sizeStyle.padding,
        borderRadius: '9999px',
        background: config.bg,
        color: config.color,
        fontWeight: 700,
        fontSize: sizeStyle.fontSize,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {showDot && (
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          {shouldPulse && (
            <span
              style={{
                position: 'absolute',
                inset: '-3px',
                borderRadius: '50%',
                background: config.color,
                opacity: 0.3,
                animation: 'pulse-ring 2s ease-out infinite',
              }}
            />
          )}
          <span style={dotStyle} />
        </span>
      )}
      {displayLabel}
    </span>
  );
}
