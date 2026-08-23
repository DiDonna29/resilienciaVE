'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';

export interface MapMarker {
  lat: number;
  lng: number;
  popup?: string;
  color?: string;
}

export interface MapViewerProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: MapMarker[];
  height?: string;
  showClusters?: boolean;
  className?: string;
}

// Internal component that uses Leaflet (only rendered client-side)
function LeafletMapInner({
  latitude,
  longitude,
  zoom = 7,
  markers = [],
  height = '300px',
  showClusters = false,
  className,
}: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!isMounted || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Invalidate map size after rendering to ensure Leaflet calculates dimensions correctly
      setTimeout(() => {
        if (isMounted) {
          map.invalidateSize();
        }
      }, 250);

      mapInstanceRef.current = map;
    };

    initMap().catch(console.error);

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. React to center coordinate changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setView([latitude, longitude], map.getZoom());
    }
  }, [latitude, longitude]);

  // 3. React to marker changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let isMounted = true;

    import('leaflet').then((LModule) => {
      if (!isMounted) return;
      const L = LModule.default;

      // Clear previous marker group if exists
      if (markerGroupRef.current) {
        map.removeLayer(markerGroupRef.current);
        markerGroupRef.current = null;
      }

      const getColoredIcon = (color: string) =>
        L.divIcon({
          className: '',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50% 50% 50% 0;
              background: ${color};
              border: 2px solid var(--color-white);
              box-shadow: 0 2px 8px rgba(0,0,0,0.35);
              transform: rotate(-45deg);
            "></div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -24],
        });

      const allMarkers = markers.length > 0
        ? markers
        : [{ lat: latitude, lng: longitude, color: '#003DA5' }];

      const group = L.layerGroup();
      allMarkers.forEach((m) => {
        const icon = getColoredIcon(m.color ?? '#003DA5');
        const marker = L.marker([m.lat, m.lng], { icon });
        if (m.popup) marker.bindPopup(m.popup);
        group.addLayer(marker);
      });

      group.addTo(map);
      markerGroupRef.current = group;
    });

    return () => {
      isMounted = false;
    };
  }, [markers, latitude, longitude]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: 'var(--border-radius)', overflow: 'hidden', zIndex: 0 }}
      className={className}
    />
  );
}

// Export the dynamically imported version with SSR disabled
const MapViewer = dynamic(
  () => Promise.resolve(LeafletMapInner),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '300px',
          width: '100%',
          background: 'var(--color-gray-100)',
          borderRadius: 'var(--border-radius)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-gray-500)',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-sm" style={{ margin: '0 auto 8px' }} />
          Cargando mapa...
        </div>
      </div>
    ),
  },
);

export default MapViewer;
