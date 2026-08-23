'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Phone, MessageCircle, ExternalLink } from 'lucide-react';

type CardStatus =
  | 'operational'
  | 'critical'
  | 'closed'
  | 'active'
  | 'missing'
  | 'found'
  | 'urgent'
  | 'at_capacity'
  | 'contained'
  | 'resolved';

interface MetadataItem {
  label: string;
  value: string;
}

interface DisasterCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  status?: CardStatus;
  badge?: string;
  imageUrl?: string;
  location?: string;
  state?: string;
  metadata?: MetadataItem[];
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  whatsappLink?: string;
  phone?: string;
  externalUrl?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'horizontal' | 'compact';
}

const STATUS_CONFIG: Record<
  CardStatus,
  { label: string; className: string; dotColor: string; pulse: boolean }
> = {
  operational: { label: 'Operativo', className: 'badge badge-green', dotColor: '#10B981', pulse: false },
  active:       { label: 'Activo',    className: 'badge badge-red',   dotColor: '#EF3340', pulse: true },
  critical:     { label: 'Crítico',   className: 'badge badge-red',   dotColor: '#EF3340', pulse: true },
  urgent:       { label: 'Urgente',   className: 'badge badge-red',   dotColor: '#EF3340', pulse: true },
  missing:      { label: 'Desaparecido', className: 'badge badge-red', dotColor: '#EF3340', pulse: true },
  closed:       { label: 'Cerrado',   className: 'badge badge-gray',  dotColor: '#6C757D', pulse: false },
  found:        { label: 'Localizado', className: 'badge badge-green', dotColor: '#10B981', pulse: false },
  at_capacity:  { label: 'Lleno',     className: 'badge badge-yellow', dotColor: '#F59E0B', pulse: false },
  contained:    { label: 'Contenida', className: 'badge badge-yellow', dotColor: '#F59E0B', pulse: false },
  resolved:     { label: 'Resuelta',  className: 'badge badge-green', dotColor: '#10B981', pulse: false },
};

export default function DisasterCard({
  title,
  subtitle,
  description,
  status,
  badge,
  imageUrl,
  location,
  state,
  metadata = [],
  onPrimaryAction,
  primaryActionLabel,
  onSecondaryAction,
  secondaryActionLabel,
  whatsappLink,
  phone,
  externalUrl,
  children,
  variant = 'default',
}: DisasterCardProps) {
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  if (variant === 'compact') {
    return (
      <div
        className="card-glass"
        style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
      >
        {statusConfig && (
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: statusConfig.dotColor,
              flexShrink: 0,
              marginTop: '6px',
              boxShadow: statusConfig.pulse ? `0 0 0 4px ${statusConfig.dotColor}30` : 'none',
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-gray-900)' }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)', marginTop: '2px' }}>{subtitle}</div>
          )}
          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--color-gray-500)', fontSize: '0.75rem' }}>
              <MapPin size={12} /> {location}
            </div>
          )}
        </div>
        {statusConfig && <span className={statusConfig.className}>{statusConfig.label}</span>}
      </div>
    );
  }

  return (
    <div
      className="card-glass"
      style={{ display: 'flex', flexDirection: variant === 'horizontal' ? 'row' : 'column', overflow: 'hidden' }}
    >
      {/* Image */}
      {imageUrl && (
        <div
          style={{
            width: variant === 'horizontal' ? '120px' : '100%',
            height: variant === 'horizontal' ? '100%' : '180px',
            flexShrink: 0,
            position: 'relative',
            background: 'var(--color-gray-100)',
            overflow: 'hidden',
          }}
        >
          <Image
            src={imageUrl}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--color-gray-900)',
                lineHeight: 1.3,
                marginBottom: subtitle ? '4px' : 0,
              }}
              className="line-clamp-2"
            >
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)', fontWeight: 500 }}>
                {subtitle}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
            {statusConfig && (
              <span
                className={statusConfig.className}
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: statusConfig.dotColor,
                    display: 'inline-block',
                    animation: statusConfig.pulse ? 'none' : 'none',
                  }}
                />
                {statusConfig.label}
              </span>
            )}
            {badge && <span className="badge badge-blue">{badge}</span>}
          </div>
        </div>

        {/* Location */}
        {(location || state) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--color-gray-600)',
              fontWeight: 500,
            }}
          >
            <MapPin size={14} style={{ flexShrink: 0, color: 'var(--color-blue)' }} />
            <span className="truncate">
              {[location, state].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-gray-700)',
              lineHeight: 1.6,
            }}
            className="line-clamp-3"
          >
            {description}
          </p>
        )}

        {/* Metadata grid */}
        {metadata.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              padding: '12px',
              background: 'var(--color-gray-50)',
              borderRadius: 'var(--border-radius)',
            }}
          >
            {metadata.map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-gray-900)', marginTop: '2px' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Children slot */}
        {children}

        {/* Action footer */}
        {(onPrimaryAction || whatsappLink || phone || externalUrl || onSecondaryAction) && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: 'auto',
              paddingTop: '4px',
            }}
          >
            {onPrimaryAction && primaryActionLabel && (
              <button onClick={onPrimaryAction} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                {primaryActionLabel}
              </button>
            )}
            {onSecondaryAction && secondaryActionLabel && (
              <button onClick={onSecondaryAction} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                {secondaryActionLabel}
              </button>
            )}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
            )}
            {phone && !whatsappLink && (
              <a
                href={`tel:${phone}`}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <Phone size={15} />
                {phone}
              </a>
            )}
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <ExternalLink size={15} />
                Ver más
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
