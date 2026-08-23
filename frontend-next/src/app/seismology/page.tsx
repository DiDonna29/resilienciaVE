"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Activity, Clock, Info } from "lucide-react";
import seismologyService from "@/core/services/seismology.service";
import { SeismicEvent, SeismicStats } from "@/core/models/seismo.interface";
import { formatVE, getVenezuelaDateString } from "@/core/utils/date";

// MapViewer must be loaded dynamically without SSR
const MapViewer = dynamic(
  () => import("@/shared/components/map-viewer/MapViewer"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "280px",
          background: "var(--color-gray-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
        }}
      >
        Cargando mapa interactivo...
      </div>
    ),
  }
);

export default function SeismologyPage() {
  const [events, setEvents] = useState<SeismicEvent[]>([]);
  const [stats, setStats] = useState<SeismicStats | null>(null);
  const [minMag, setMinMag] = useState<number>(0);
  const [filterDate, setFilterDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.0, -66.0]);
  const [selectedEvent, setSelectedEvent] = useState<SeismicEvent | null>(null);

  // Responsive breakpoint detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);

  useEffect(() => {
    const checkViewport = () => {
      const w = window.innerWidth;
      setIsMobile(w < 640);
      setIsTablet(w >= 640 && w < 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const convertToDMS = (lat: number, lng: number) => {
    const getDMS = (val: number, isLat: boolean) => {
      const absolute = Math.abs(val);
      const degrees = Math.floor(absolute);
      const minutesNotTruncated = (absolute - degrees) * 60;
      const minutes = Math.floor(minutesNotTruncated);
      const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
      const direction = isLat
        ? val >= 0 ? "N" : "S"
        : val >= 0 ? "E" : "W";
      return `${degrees}°${minutes}'${seconds}"${direction}`;
    };
    return `${getDMS(lat, true)} ${getDMS(lng, false)}`;
  };

  const formatFullDateVE = (dateStr: string) => {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "America/Caracas",
      day: "2-digit",
      month: "short",
      year: "numeric",
    };
    const datePart = d.toLocaleDateString("es-VE", options);
    const timePart = d.toLocaleTimeString("es-VE", {
      timeZone: "America/Caracas",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return `${datePart}, ${timePart}`;
  };

  const getWeekRangeLabel = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const formatDateShort = (d: Date) => {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };
    return `${formatDateShort(start)} al ${formatDateShort(end)}`;
  };

  const parseEpicenter = (fullName: string) => {
    const index = fullName.indexOf(") ");
    if (index !== -1) {
      return {
        title: fullName.substring(0, index + 1).toUpperCase(),
        subtitle: fullName.substring(index + 2),
      };
    }
    return {
      title: fullName.split(",")[0].toUpperCase(),
      subtitle: fullName.split(",")[1]?.trim() || "Venezuela",
    };
  };

  const getShortTime = (occurredAt: string) => {
    return new Date(occurredAt).toLocaleTimeString("es-VE", {
      timeZone: "America/Caracas",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getElapsedTime = (occurredAt: string) => {
    const diffMs = new Date().getTime() - new Date(occurredAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "hace unos segundos";
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    return `hace ${diffDays} días`;
  };

  const fetchSeismoData = async () => {
    try {
      const [listData, statsData] = await Promise.all([
        seismologyService.getRecent(1, 100, undefined, undefined, true),
        seismologyService.getStats(),
      ]);

      const parsedResults = (listData.results || []).map((e: any) => ({
        ...e,
        magnitude: Number(e.magnitude),
        depth_km: Number(e.depth_km),
        latitude: Number(e.latitude),
        longitude: Number(e.longitude),
      }));

      setEvents((prevEvents) => {
        if (prevEvents.length > 0 && parsedResults.length > 0) {
          const prevLatest = prevEvents[0];
          const incomingLatest = parsedResults[0];
          if (incomingLatest.id !== prevLatest.id) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("🚨 ¡NUEVO SISMO REGISTRADO!", {
                body: `${incomingLatest.epicenter_name} | Magnitud: ${incomingLatest.magnitude} ML | Profundidad: ${incomingLatest.depth_km} km`,
                icon: "/logo.png",
                tag: incomingLatest.id,
                requireInteraction: true,
              });
            }
          }
        }
        return parsedResults;
      });

      if (statsData) {
        if (statsData.latest_event) {
          statsData.latest_event = {
            ...statsData.latest_event,
            magnitude: Number(statsData.latest_event.magnitude),
            depth_km: Number(statsData.latest_event.depth_km),
            latitude: Number(statsData.latest_event.latitude),
            longitude: Number(statsData.latest_event.longitude),
          };
          setMapCenter([
            statsData.latest_event.latitude,
            statsData.latest_event.longitude,
          ]);
        }
        setStats(statsData);
      }
    } catch (err) {
      console.error("Error fetching seismology data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeismoData();
    const interval = setInterval(fetchSeismoData, 60000);

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

  const getMagnitudeColor = (mag: number) => {
    if (mag < 3.0) return "var(--color-blue)";
    if (mag < 5.0) return "var(--status-yellow)";
    return "var(--color-red)";
  };

  const filteredEvents = events.filter((e) => {
    const matchesMag = Number(e.magnitude) >= minMag;
    if (!filterDate) return matchesMag;
    const eventLocalDate = getVenezuelaDateString(new Date(e.occurred_at));
    return matchesMag && eventLocalDate === filterDate;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const latestEvent = stats?.latest_event;

  const todayStr = getVenezuelaDateString(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getVenezuelaDateString(yesterdayDate);

  const markers = filteredEvents.map((e) => {
    const { title, subtitle } = parseEpicenter(e.epicenter_name);
    return {
      lat: Number(e.latitude),
      lng: Number(e.longitude),
      popup: `<strong>${title}</strong><br/><span style="font-size:0.85rem;color:#666">${subtitle}</span><br/>Magnitud: <strong>${e.magnitude} ${e.magnitude_type}</strong><br/>Profundidad: <strong>${e.depth_km} km</strong><br/>Fecha: ${formatVE(e.occurred_at)}`,
      color: getMagnitudeColor(Number(e.magnitude)),
    };
  });

  // ─── Responsive derived values ─────────────────────────────────────────────
  const mapHeight = isMobile ? "290px" : isTablet ? "350px" : "100%";
  const containerPadding = isMobile ? "0 12px" : "0 1rem";
  const headerMb = isMobile ? "1.25rem" : "2rem";
  const h1FontSize = isMobile ? "1.35rem" : "2rem";
  const heroGridCols = isMobile || isTablet ? "1fr" : "2fr 1fr";
  const layoutGridCols = isMobile || isTablet ? "1fr" : "1fr 2fr";
  const heroPadding = isMobile ? "1.1rem" : "2rem";
  const heroTitleSize = isMobile ? "1.15rem" : "2rem";
  const heroMagSize = isMobile ? "2.25rem" : "3rem";
  const heroMagPadding = isMobile ? "0.85rem 1.1rem" : "1.5rem 2rem";
  const filterCardPosition = isMobile || isTablet ? "static" : "sticky";

  return (
    <div
      className="container"
      style={{ maxWidth: "1200px", margin: "0 auto", padding: containerPadding }}
    >
      {/* ── Header ── */}
      <header
        style={{
          marginBottom: headerMb,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: h1FontSize,
              fontWeight: "900",
              color: "var(--color-blue)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Activity size={isMobile ? 22 : 28} />
            <span>Sismología Nacional</span>
          </h1>
          <p
            style={{
              color: "var(--color-gray-600)",
              marginTop: "0.25rem",
              fontSize: isMobile ? "0.8rem" : "1rem",
              lineHeight: 1.5,
            }}
          >
            {isMobile
              ? "Monitoreo sísmico venezolano — datos USGS."
              : "Monitoreo de sismos registrados en territorio venezolano. Datos sincronizados con el USGS (Servicio Geológico de EE.UU.)."}
          </p>
        </div>

        {/* Live badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(16, 185, 129, 0.1)",
            padding: isMobile ? "5px 10px" : "6px 12px",
            borderRadius: "20px",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            alignSelf: "center",
            flexShrink: 0,
          }}
        >
          <motion.span
            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              width: "8px",
              height: "8px",
              backgroundColor: "#10B981",
              borderRadius: "50%",
              display: "inline-block",
              boxShadow: "0 0 8px #10B981",
            }}
          />
          <span
            style={{
              fontSize: isMobile ? "0.68rem" : "0.75rem",
              color: "#10B981",
              fontWeight: "700",
              whiteSpace: "nowrap",
            }}
          >
            {isMobile ? "En vivo · 60s" : "Monitoreo en Vivo (Auto-sincronizado 60s)"}
          </span>
        </div>
      </header>

      {/* ── Stats + Hero ── */}
      {latestEvent && (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: heroGridCols,
            gap: "1.25rem",
            marginBottom: "1.75rem",
          }}
        >
          {/* Hero Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card card-glass"
            style={{
              padding: heroPadding,
              borderLeft: `6px solid ${getMagnitudeColor(Number(latestEvent.magnitude))}`,
            }}
          >
            <span
              style={{
                fontSize: "0.73rem",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "var(--color-gray-600)",
              }}
            >
              Último Evento Sísmico
            </span>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginTop: "0.85rem",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: heroTitleSize,
                    fontWeight: "800",
                    color: "var(--color-gray-900)",
                    lineHeight: 1.25,
                    wordBreak: "break-word",
                  }}
                >
                  {latestEvent.epicenter_name}
                </h2>

                <div
                  style={{
                    display: "flex",
                    gap: isMobile ? "1rem" : "1.5rem",
                    marginTop: "0.85rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-gray-600)",
                      }}
                    >
                      Profundidad
                    </span>
                    <h3
                      style={{
                        fontSize: isMobile ? "1rem" : "1.25rem",
                        fontWeight: "700",
                        marginTop: "0.1rem",
                      }}
                    >
                      {latestEvent.depth_km} km
                    </h3>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-gray-600)",
                      }}
                    >
                      Fecha (HLV)
                    </span>
                    <h3
                      style={{
                        fontSize: isMobile ? "0.9rem" : "1.25rem",
                        fontWeight: "700",
                        marginTop: "0.1rem",
                      }}
                    >
                      {formatVE(latestEvent.occurred_at, false)}
                    </h3>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-gray-600)",
                      }}
                    >
                      Hora Local (HLV)
                    </span>
                    <h3
                      style={{
                        fontSize: isMobile ? "0.9rem" : "1rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.2rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <Clock size={14} />
                      <span>
                        {new Date(latestEvent.occurred_at).toLocaleTimeString(
                          "es-VE",
                          {
                            timeZone: "America/Caracas",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }
                        )}
                      </span>
                    </h3>
                  </div>
                </div>
              </div>

              {/* Magnitude bubble */}
              <div
                style={{
                  textAlign: "center",
                  background: getMagnitudeColor(Number(latestEvent.magnitude)),
                  color: "white",
                  padding: heroMagPadding,
                  borderRadius: "14px",
                  minWidth: isMobile ? "90px" : "120px",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                  Magnitud
                </span>
                <h1
                  style={{
                    fontSize: heroMagSize,
                    fontWeight: "900",
                    lineHeight: 1,
                  }}
                >
                  {latestEvent.magnitude}
                </h1>
                <span
                  style={{
                    fontSize: "0.7rem",
                    background: "rgba(255,255,255,0.25)",
                    padding: "2px 7px",
                    borderRadius: "20px",
                    display: "inline-block",
                    marginTop: "0.4rem",
                  }}
                >
                  {latestEvent.magnitude_type}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Mini Map */}
          <div
            id="sismo-map"
            className="card card-glass"
            style={{
              padding: "0.5rem",
              display: "flex",
              flexDirection: "column",
              minHeight: isMobile ? "290px" : "260px",
            }}
          >
            <MapViewer
              key={`${mapCenter[0]}-${mapCenter[1]}`}
              latitude={mapCenter[0]}
              longitude={mapCenter[1]}
              zoom={5.5}
              markers={markers}
              height={mapHeight}
            />
          </div>
        </section>
      )}

      {/* ── Filter + Events List ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: layoutGridCols,
          gap: isMobile ? "1.25rem" : "2rem",
          alignItems: "flex-start",
        }}
      >
        {/* Filter Panel */}
        <div
          className="card card-glass"
          style={{
            padding: isMobile ? "1rem" : "1.5rem",
            position: filterCardPosition as any,
            top: filterCardPosition === "sticky" ? "100px" : undefined,
          }}
        >
          <h4
            style={{
              fontWeight: "700",
              color: "var(--color-gray-900)",
              marginBottom: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: isMobile ? "0.95rem" : "1rem",
            }}
          >
            <Info size={16} />
            <span>Filtros sísmicos</span>
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: "600" }}>
              Magnitud mínima: {minMag}
            </label>
            <input
              type="range"
              min="0"
              max="9"
              step="0.5"
              value={minMag}
              onChange={(e) => {
                setMinMag(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                width: "100%",
                accentColor: "var(--color-blue)",
                height: "6px",
                cursor: "pointer",
              }}
            />
            <div
              style={{
                position: "relative",
                height: "15px",
                marginTop: "2px",
                color: "var(--color-gray-600)",
                fontSize: "0.7rem",
                marginBottom: "0.75rem",
              }}
            >
              <span style={{ position: "absolute", left: "0%" }}>0.0</span>
              <span style={{ position: "absolute", left: "33.3%", transform: "translateX(-50%)" }}>
                3.0
              </span>
              <span style={{ position: "absolute", left: "55.5%", transform: "translateX(-50%)" }}>
                5.0
              </span>
              <span style={{ position: "absolute", left: "77.7%", transform: "translateX(-50%)" }}>
                7.0
              </span>
              <span style={{ position: "absolute", right: "0%" }}>9.0</span>
            </div>
          </div>

          {/* Date filter */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.65rem",
              marginTop: "0.75rem",
              borderTop: "1px solid var(--color-gray-200)",
              paddingTop: "0.85rem",
            }}
          >
            <label style={{ fontSize: "0.82rem", fontWeight: "600" }}>
              Filtrar por fecha:
            </label>
            <input
              type="date"
              value={filterDate}
              min="2026-06-24"
              max={todayStr}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--border-radius)",
                border: "1px solid var(--color-gray-300)",
                fontSize: "0.88rem",
                fontFamily: "inherit",
                minHeight: "44px",
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => { setFilterDate(todayStr); setCurrentPage(1); }}
                style={{
                  flex: 1,
                  padding: "0",
                  height: "44px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-gray-200)",
                  background:
                    filterDate === todayStr
                      ? "var(--color-blue)"
                      : "var(--color-white)",
                  color:
                    filterDate === todayStr
                      ? "white"
                      : "var(--color-gray-800)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Hoy
              </button>
              <button
                onClick={() => { setFilterDate(yesterdayStr); setCurrentPage(1); }}
                style={{
                  flex: 1,
                  padding: "0",
                  height: "44px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-gray-200)",
                  background:
                    filterDate === yesterdayStr
                      ? "var(--color-blue)"
                      : "var(--color-white)",
                  color:
                    filterDate === yesterdayStr
                      ? "white"
                      : "var(--color-gray-800)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Ayer
              </button>
            </div>

            {filterDate && (
              <button
                onClick={() => { setFilterDate(""); setCurrentPage(1); }}
                style={{
                  alignSelf: "flex-end",
                  background: "transparent",
                  border: "none",
                  color: "var(--color-red)",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Ver todos los días
              </button>
            )}
          </div>

          {/* Legend */}
          <div
            style={{
              marginTop: "1.5rem",
              borderTop: "1px solid var(--color-gray-200)",
              paddingTop: "0.85rem",
              fontSize: "0.77rem",
              color: "var(--color-gray-600)",
            }}
          >
            <p>
              <strong>Clasificación sísmica:</strong>
            </p>
            <ul
              style={{
                paddingLeft: "1.1rem",
                marginTop: "0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
              <li>
                <span style={{ color: "#6C757D", fontWeight: "700" }}>
                  Sismo (&lt; 3.0)
                </span>
                : No percibido, registrado instrumentalmente.
              </li>
              <li>
                <span style={{ color: "#F59E0B", fontWeight: "700" }}>
                  Temblor (3.0 – 4.9)
                </span>
                : Perceptible, pocos o ningún daño.
              </li>
              <li>
                <span style={{ color: "var(--color-red)", fontWeight: "700" }}>
                  Terremoto (&gt;= 5.0)
                </span>
                : Moderado a grave, daños estructurales.
              </li>
            </ul>
          </div>
        </div>

        {/* Chronological Events List */}
        <div>
          <h3
            style={{
              fontSize: isMobile ? "0.95rem" : "1.15rem",
              fontWeight: "700",
              color: "var(--color-gray-800)",
              marginBottom: "0.85rem",
            }}
          >
            Listado de Eventos ({filteredEvents.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              Cargando listado de sismos...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2.5rem 1rem",
                background: "var(--color-white)",
                borderRadius: "12px",
                border: "1px solid var(--color-gray-300)",
                fontSize: "0.88rem",
              }}
            >
              No se encontraron sismos
              {filterDate ? ` para la fecha ${filterDate}` : ""} con
              magnitud superior a {minMag}.
              {filterDate && (
                <button
                  onClick={() => { setFilterDate(""); setCurrentPage(1); }}
                  style={{
                    display: "block",
                    margin: "1rem auto 0",
                    padding: "10px 16px",
                    background: "var(--color-blue)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    minHeight: "44px",
                  }}
                >
                  Ver todos los días
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                className="card card-glass"
                style={{
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "12px",
                  border: "1px solid var(--color-gray-300)",
                }}
              >
                {paginatedEvents.map((e) => {
                  const { title, subtitle } = parseEpicenter(e.epicenter_name);
                  const magnitudeColor = getMagnitudeColor(e.magnitude);
                  const formattedTime = getShortTime(e.occurred_at);
                  const elapsedText = getElapsedTime(e.occurred_at);

                  return (
                    <div
                      key={e.id}
                      onClick={() => {
                        setMapCenter([
                          Number(e.latitude),
                          Number(e.longitude),
                        ]);
                        setSelectedEvent(e);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: isMobile ? "0.75rem 0.85rem" : "1rem 1.25rem",
                        borderBottom: "1px solid var(--color-gray-200)",
                        gap: isMobile ? "0.6rem" : "1rem",
                        background: "transparent",
                        cursor: "pointer",
                        transition: "background var(--transition)",
                        minHeight: "64px",
                      }}
                      onMouseEnter={(evt) =>
                        (evt.currentTarget.style.background =
                          "var(--color-gray-100)")
                      }
                      onMouseLeave={(evt) =>
                        (evt.currentTarget.style.background = "transparent")
                      }
                    >
                      {/* Venezuela flag */}
                      {!isMobile && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            width: "18px",
                            height: "12px",
                            borderRadius: "2px",
                            overflow: "hidden",
                            flexShrink: 0,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                          }}
                        >
                          <div style={{ height: "4px", backgroundColor: "#FCE300" }} />
                          <div style={{ height: "4px", backgroundColor: "#003DA5" }} />
                          <div style={{ height: "4px", backgroundColor: "#EF3340" }} />
                        </div>
                      )}

                      {/* Title + Subtitle */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 0,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: isMobile ? "0.82rem" : "0.95rem",
                            fontWeight: "700",
                            color: "var(--color-gray-900)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {title}
                        </h4>
                        <p
                          style={{
                            fontSize: isMobile ? "0.72rem" : "0.8rem",
                            color: "var(--color-gray-600)",
                            marginTop: "0.1rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {subtitle}
                        </p>
                        {!isMobile && (
                          <p
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--color-gray-600)",
                              marginTop: "0.2rem",
                              opacity: 0.8,
                            }}
                          >
                            Prof: <strong>{e.depth_km} km</strong> |{" "}
                            {Number(e.latitude).toFixed(3)}°,{" "}
                            {Number(e.longitude).toFixed(3)}°
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div
                        style={{
                          textAlign: "right",
                          flexShrink: 0,
                          fontSize: isMobile ? "0.7rem" : "0.8rem",
                          color: "var(--color-gray-800)",
                        }}
                      >
                        <span style={{ fontWeight: "600", display: "block" }}>
                          {formattedTime}
                        </span>
                        <span
                          style={{
                            fontSize: "0.66rem",
                            color: "var(--color-gray-600)",
                            display: "block",
                            marginTop: "0.1rem",
                          }}
                        >
                          ({elapsedText})
                        </span>
                      </div>

                      {/* Magnitude */}
                      <div
                        style={{
                          fontSize: isMobile ? "1.35rem" : "1.75rem",
                          fontWeight: "800",
                          color: magnitudeColor,
                          width: isMobile ? "46px" : "60px",
                          textAlign: "right",
                          flexShrink: 0,
                          fontFamily: "monospace",
                        }}
                      >
                        {Number(e.magnitude).toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginTop: "1.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    style={{
                      padding: "0 16px",
                      height: "44px",
                      fontSize: "0.85rem",
                      borderRadius: "8px",
                      background: "var(--color-blue)",
                      color: "white",
                      border: "none",
                      opacity: currentPage === 1 ? 0.5 : 1,
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Anterior
                  </button>
                  <span
                    style={{
                      fontSize: "0.88rem",
                      color: "var(--color-gray-800)",
                      fontWeight: "600",
                    }}
                  >
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages)
                      )
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "0 16px",
                      height: "44px",
                      fontSize: "0.85rem",
                      borderRadius: "8px",
                      background: "var(--color-blue)",
                      color: "white",
                      border: "none",
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      cursor:
                        currentPage === totalPages
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: isMobile ? "0.75rem" : "1rem",
            overflowY: "auto",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="card card-glass"
            style={{
              width: "100%",
              maxWidth: "500px",
              borderRadius: "16px",
              overflow: "hidden",
              backgroundColor: "#1e1e2e",
              color: "white",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: isMobile ? "1rem 1.1rem" : "1.25rem 1.5rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "22px",
                    height: "15px",
                    borderRadius: "2px",
                    overflow: "hidden",
                    flexShrink: 0,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}
                >
                  <div style={{ height: "5px", backgroundColor: "#FCE300" }} />
                  <div style={{ height: "5px", backgroundColor: "#003DA5" }} />
                  <div style={{ height: "5px", backgroundColor: "#EF3340" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: isMobile ? "0.92rem" : "1.05rem",
                      fontWeight: "800",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {parseEpicenter(selectedEvent.epicenter_name).title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-gray-300)",
                      margin: "0.1rem 0 0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {parseEpicenter(selectedEvent.epicenter_name).subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  padding: "0 0.25rem",
                  lineHeight: 1,
                  minWidth: "44px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div
              style={{
                padding: isMobile ? "1rem 1.1rem" : "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {[
                {
                  label: "magnitud:",
                  value: (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: "800",
                          color: getMagnitudeColor(
                            Number(selectedEvent.magnitude)
                          ),
                        }}
                      >
                        {Number(selectedEvent.magnitude).toFixed(1)}{" "}
                        {selectedEvent.magnitude_type}
                      </span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: "700",
                          backgroundColor: "rgba(255,255,255,0.15)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {selectedEvent.source}
                      </span>
                    </div>
                  ),
                },
                {
                  label: "profundidad:",
                  value: (
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: "600" }}>
                        {selectedEvent.depth_km} km
                      </span>
                      <span
                        style={{
                          fontSize: "0.73rem",
                          color: "var(--color-gray-300)",
                          marginLeft: "0.35rem",
                        }}
                      >
                        ({(selectedEvent.depth_km * 0.621371).toFixed(1)} mi)
                      </span>
                    </div>
                  ),
                },
                {
                  label: "fecha/hora:",
                  value: (
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "0.83rem",
                          fontWeight: "600",
                          display: "block",
                        }}
                      >
                        {formatFullDateVE(selectedEvent.occurred_at)}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--color-gray-300)",
                        }}
                      >
                        ({getElapsedTime(selectedEvent.occurred_at)})
                      </span>
                    </div>
                  ),
                },
                {
                  label: "coordenadas:",
                  value: (
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "0.83rem",
                          fontWeight: "600",
                          display: "block",
                          fontFamily: "monospace",
                        }}
                      >
                        {convertToDMS(
                          Number(selectedEvent.latitude),
                          Number(selectedEvent.longitude)
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--color-gray-300)",
                        }}
                      >
                        Lat: {Number(selectedEvent.latitude).toFixed(4)}°, Lon:{" "}
                        {Number(selectedEvent.longitude).toFixed(4)}°
                      </span>
                    </div>
                  ),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    paddingBottom: "0.5rem",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--color-gray-300)",
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </span>
                  {value}
                </div>
              ))}

              {/* Mini map inside modal */}
              <div
                style={{
                  height: isMobile ? "170px" : "200px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  marginTop: "0.25rem",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <MapViewer
                  key={selectedEvent.id}
                  latitude={Number(selectedEvent.latitude)}
                  longitude={Number(selectedEvent.longitude)}
                  zoom={10}
                  markers={[
                    {
                      lat: Number(selectedEvent.latitude),
                      lng: Number(selectedEvent.longitude),
                      color: getMagnitudeColor(Number(selectedEvent.magnitude)),
                    },
                  ]}
                  height={isMobile ? "170px" : "200px"}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
