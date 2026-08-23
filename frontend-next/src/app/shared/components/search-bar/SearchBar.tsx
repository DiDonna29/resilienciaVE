'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder = 'Buscar...',
  value: externalValue,
  onChange,
  debounceMs = 350,
  className,
  autoFocus = false,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(externalValue ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalValue(externalValue);
    }
  }, [externalValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInternalValue(val);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(val);
      }, debounceMs);
    },
    [onChange, debounceMs],
  );

  const handleClear = useCallback(() => {
    setInternalValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange('');
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      className={className}
    >
      <Search
        size={18}
        style={{
          position: 'absolute',
          left: '14px',
          color: 'var(--color-gray-500)',
          pointerEvents: 'none',
          flexShrink: 0,
        }}
      />
      <input
        type="search"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="form-input"
        style={{
          paddingLeft: '44px',
          paddingRight: internalValue ? '44px' : '16px',
          background: "var(--color-white)",
        }}
        autoComplete="off"
        aria-label={placeholder}
      />
      {internalValue && (
        <button
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          style={{
            position: 'absolute',
            right: '10px',
            background: 'var(--color-gray-200)',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-gray-600)',
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
