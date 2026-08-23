"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import rescueZonesService from "@/core/services/rescue-zones.service";
import { RescueZone, RiskType } from "@/core/models/rescue-zone.interface";
import DisasterCard from "@/shared/components/disaster-card/DisasterCard";
import { useAuthStore } from "@/core/store/auth.store";

// MapViewer loaded dynamically
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
        Cargando mapa interactivo de rescate...
      </div>
    ),
  }
);

export default function RescueZonesPage() {
  const { isAuthenticated } = useAuthStore();
  const [zones, setZones] = useState<RescueZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [riskFilter, setRiskFilter] = useState<string>("");

  // Modals / forms
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newZone, setNewZone] = useState({
    name: "",
    description: "",
    risk_type: "collapse",
    state_ve: "Distrito Capital",
    latitude: 10.4806,
    longitude: -66.9036,
    volunteers_needed: "0",
    technical_needs: "",
  });

  const [volunteerMsg, setVolunteerMsg] = useState("");
  const [activeVolunteerZone, setActiveVolunteerZone] = useState<string | null>(null);

  // Mobile filter panel collapse
  const [filtersOpen, setFiltersOpen] = useState<boolean>(true);

  // Responsive breakpoint
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);

  useEffect(() => {
    const checkViewport = () => {
      const w = window.innerWidth;
      setIsMobile(w < 640);
      setIsTablet(w >= 640 && w < 1024);
      // auto-collapse filters on mobile to save space
      if (w < 640) setFiltersOpen(false);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const states = [
    "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar",
    "Carabobo", "Cojedes", "Delta Amacuro", "Distrito Capital", "Falcón",
    "Guárico", "Lara", "Mérida", "Miranda", "Monagas", "Nueva Esparta",
    "Portuguesa", "Sucre", "Táchira", "Trujillo", "Vargas", "Yaracuy", "Zulia",
  ];

  const loadZones = async () => {
    setLoading(true);
    try {
      const data = await rescueZonesService.getList(
        (statusFilter || undefined) as any,
        (riskFilter || undefined) as any,
        1
      );
      setZones(data.results || []);
    } catch (err) {
      console.error("Error loading rescue zones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, [statusFilter, riskFilter]);

  const handleRegisterZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const techList = newZone.technical_needs
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      await rescueZonesService.create({
        name: newZone.name,
        description: newZone.description,
        risk_type: newZone.risk_type as RiskType,
        state_ve: newZone.state_ve,
        latitude: newZone.latitude,
        longitude: newZone.longitude,
        volunteers_needed: parseInt(newZone.volunteers_needed) || 0,
        technical_needs: techList,
      });

      setShowAddForm(false);
      setNewZone({
        name: "",
        description: "",
        risk_type: "collapse",
        state_ve: "Distrito Capital",
        latitude: 10.4806,
        longitude: -66.9036,
        volunteers_needed: "0",
        technical_needs: "",
      });
      loadZones();
    } catch (err) {
      console.error("Error registering rescue zone:", err);
      alert("Error al registrar la zona. Verifique los datos.");
    }
  };

  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVolunteerZone) return;
    try {
      await rescueZonesService.registerVolunteer(activeVolunteerZone, {
        message: volunteerMsg,
      });
      alert(
        "¡Ofrecimiento de voluntariado enviado con éxito! El reportante te contactará."
      );
      setActiveVolunteerZone(null);
      setVolunteerMsg("");
      loadZones();
    } catch (err: any) {
      console.error("Error volunteering:", err);
      alert(err.response?.data?.detail || "Error al registrar voluntariado.");
    }
  };

  const getRiskLabel = (type: string) => {
    switch (type) {
      case "collapse": return "Derrumbe / Colapso Estructural";
      case "landslide": return "Deslizamiento de Tierra";
      case "flood": return "Inundación";
      case "fire": return "Incendio";
      default: return "Otro Riesgo";
    }
  };

  const getRiskColor = (type: string) => {
    switch (type) {
      case "collapse": return "var(--color-red)";
      case "landslide": return "#F59E0B";
      case "flood": return "var(--color-blue)";
      case "fire": return "#EF4444";
      default: return "#6B7280";
    }
  };

  // Map markers
  const markers = zones.map((z) => ({
    lat: Number(z.latitude),
    lng: Number(z.longitude),
    popup: `<strong>${z.name}</strong><br/>Riesgo: ${getRiskLabel(z.risk_type)}<br/>Necesidades: ${z.technical_needs.join(", ")}`,
    color: getRiskColor(z.risk_type),
  }));

  // ─── Responsive values ─────────────────────────────────────────────────────
  const containerPadding = isMobile ? "0 12px" : "0 1rem";
  const mainGridCols = isMobile || isTablet ? "1fr" : "1.2fr 1fr";
  const mapHeight = isMobile ? "280px" : isTablet ? "340px" : "400px";
  const h1FontSize = isMobile ? "1.35rem" : "2rem";
  const sectionMb = isMobile ? "1.75rem" : "3rem";

  // Shared input styles
  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--color-gray-300)",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    minHeight: "44px",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div
      className="container"
      style={{ maxWidth: "1200px", margin: "0 auto", padding: containerPadding }}
    >
      {/* ── Header ── */}
      <header
        style={{
          marginBottom: isMobile ? "1.25rem" : "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.85rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
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
            <MapPin size={isMobile ? 22 : 28} />
            <span style={{ wordBreak: "break-word" }}>
              Zonas de Rescate Críticas
            </span>
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
              ? "Puntos críticos que requieren apoyo, despeje o maquinaria pesada."
              : "Ubicación de puntos críticos que requieren despeje de escombros, maquinaria pesada o apoyo voluntario."}
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              window.location.href = "/auth/login";
            } else {
              setShowAddForm(true);
            }
          }}
          className="btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            minHeight: "48px",
            padding: "0 16px",
            flexShrink: 0,
            fontSize: isMobile ? "0.85rem" : "1rem",
          }}
        >
          <Plus size={18} />
          <span>{isMobile ? "Solicitar Apoyo" : "Solicitar Apoyo en Zona"}</span>
        </button>
      </header>

      {/* ── Main Grid: Map + List ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: mainGridCols,
          gap: isMobile ? "1.25rem" : "2rem",
          marginBottom: sectionMb,
        }}
      >
        {/* Interactive Map column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3
            style={{
              fontSize: isMobile ? "0.95rem" : "1.15rem",
              fontWeight: "700",
            }}
          >
            Mapa de Zonas Críticas
          </h3>

          <div className="card card-glass" style={{ padding: isMobile ? "0.5rem" : "1rem" }}>
            <MapViewer
              latitude={8.0}
              longitude={-66.0}
              zoom={6}
              markers={markers}
              height={mapHeight}
            />
          </div>

          {/* Volunteer note */}
          <div
            className="card card-glass"
            style={{
              padding: isMobile ? "1rem" : "1.25rem",
              fontSize: isMobile ? "0.8rem" : "0.85rem",
              color: "var(--color-gray-700)",
              borderLeft: "4px solid var(--color-blue)",
              lineHeight: 1.55,
            }}
          >
            <p>
              <strong>💡 Nota para voluntarios:</strong>
            </p>
            <p style={{ marginTop: "0.25rem" }}>
              Si tienes maquinaria (retroexcavadora, apuntaladores) o conocimientos
              técnicos, haz clic en{" "}
              <strong>Ofrecerme como Voluntario</strong> en la zona requerida
              para contactar al coordinador directamente.
            </p>
          </div>
        </div>

        {/* Zones List + Filters column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Filters card — collapsible on mobile */}
          <div className="card card-glass" style={{ padding: isMobile ? "0.9rem" : "1.25rem" }}>
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                minHeight: "44px",
              }}
            >
              <h4
                style={{
                  fontWeight: "700",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  margin: 0,
                }}
              >
                Filtros
              </h4>
              {isMobile ? (
                filtersOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />
              ) : null}
            </button>

            {(filtersOpen || !isMobile) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "0.85rem",
                  marginTop: "0.75rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: "600" }}>
                    Estado de la zona
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="active">Activas (Pendientes)</option>
                    <option value="attended">Atendidas</option>
                    <option value="closed">Resueltas / Cerradas</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: "600" }}>
                    Tipo de Riesgo
                  </label>
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Todos</option>
                    <option value="collapse">Derrumbe</option>
                    <option value="landslide">Deslizamiento</option>
                    <option value="flood">Inundación</option>
                    <option value="fire">Incendio</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Zones list */}
          <div>
            <h3
              style={{
                fontSize: isMobile ? "0.95rem" : "1.15rem",
                fontWeight: "700",
                marginBottom: "0.85rem",
              }}
            >
              Zonas Registradas ({zones.length})
            </h3>

            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "3rem",
                }}
              >
                <Loader2 size={32} className="animate-spin" color="var(--color-blue)" />
              </div>
            ) : zones.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2.5rem 1rem",
                  background: "var(--color-white)",
                  borderRadius: "12px",
                  border: "1px solid var(--color-gray-200)",
                  fontSize: "0.88rem",
                }}
              >
                No hay zonas registradas bajo los filtros seleccionados.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? "0.85rem" : "1rem",
                }}
              >
                {zones.map((z) => {
                  const metadata = [
                    {
                      label: "Necesidad técnica",
                      value:
                        z.technical_needs.join(", ") || "Ninguna especificada",
                    },
                    {
                      label: "Voluntarios necesitados",
                      value: z.volunteers_needed.toString(),
                    },
                    {
                      label: "Reportante",
                      value: z.reported_by
                        ? `${z.reported_by.first_name} ${z.reported_by.last_name}`
                        : "Ciudadano Anónimo",
                    },
                  ];

                  return (
                    <DisasterCard
                      key={z.id}
                      title={z.name}
                      subtitle={getRiskLabel(z.risk_type)}
                      description={z.description}
                      status={z.status === "active" ? "urgent" : "operational"}
                      badge={z.status.toUpperCase()}
                      location={`${z.state_ve} — Lat: ${z.latitude}, Lon: ${z.longitude}`}
                      metadata={metadata}
                      primaryActionLabel={
                        z.status === "active"
                          ? "Ofrecerme como Voluntario"
                          : undefined
                      }
                      onPrimaryAction={() => {
                        if (!isAuthenticated) {
                          window.location.href = "/auth/login";
                        } else {
                          setActiveVolunteerZone(z.id);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Add Zone Modal ── */}
      {showAddForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: isMobile ? "0.75rem" : "1rem",
            overflowY: "auto",
          }}
        >
          <div
            className="card card-glass"
            style={{
              width: "100%",
              maxWidth: "550px",
              padding: isMobile ? "1.25rem" : "2rem",
              maxHeight: "92vh",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                fontSize: isMobile ? "1.2rem" : "1.5rem",
                fontWeight: "800",
                color: "var(--color-blue)",
                marginBottom: "1.1rem",
              }}
            >
              Solicitar Apoyo en Zona de Riesgo
            </h3>

            <form
              onSubmit={handleRegisterZone}
              style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}
            >
              {/* Zone name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  Nombre de la Zona / Punto Crítico
                </label>
                <input
                  type="text"
                  placeholder="Ej. Entrada del sector El Limón, Calle Principal"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>

              {/* Risk type + State — 2 cols on tablet+, 1 on mobile */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "0.9rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                    Tipo de Riesgo
                  </label>
                  <select
                    value={newZone.risk_type}
                    onChange={(e) =>
                      setNewZone({ ...newZone, risk_type: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="collapse">Derrumbe</option>
                    <option value="landslide">Deslizamiento</option>
                    <option value="flood">Inundación</option>
                    <option value="fire">Incendio</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                    Estado
                  </label>
                  <select
                    value={newZone.state_ve}
                    onChange={(e) =>
                      setNewZone({ ...newZone, state_ve: e.target.value })
                    }
                    style={inputStyle}
                  >
                    {states.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  Descripción de la situación
                </label>
                <textarea
                  placeholder="Explique el tipo de obstrucción, riesgos adicionales y si hay personas incomunicadas."
                  value={newZone.description}
                  onChange={(e) =>
                    setNewZone({ ...newZone, description: e.target.value })
                  }
                  required
                  rows={isMobile ? 3 : 3}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    height: "auto",
                    minHeight: "80px",
                  }}
                />
              </div>

              {/* Volunteers + Technical needs — 2 cols on tablet+, 1 on mobile */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "0.9rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                    Voluntarios Requeridos
                  </label>
                  <input
                    type="number"
                    placeholder="Cantidad aprox."
                    value={newZone.volunteers_needed}
                    onChange={(e) =>
                      setNewZone({ ...newZone, volunteers_needed: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                    Maquinaria / Insumos
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Retroexcavadora, Pala (separados por coma)"
                    value={newZone.technical_needs}
                    onChange={(e) =>
                      setNewZone({ ...newZone, technical_needs: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Map picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  Geolocalización (Haz clic para mover el pin)
                </label>
                <div
                  style={{
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid var(--color-gray-300)",
                  }}
                >
                  <MapViewer
                    latitude={newZone.latitude}
                    longitude={newZone.longitude}
                    zoom={12}
                    markers={[
                      {
                        lat: newZone.latitude,
                        lng: newZone.longitude,
                        popup: "Punto crítico",
                      },
                    ]}
                    height={isMobile ? "160px" : "180px"}
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "0.85rem",
                  marginTop: "0.5rem",
                  flexDirection: isMobile ? "column-reverse" : "row",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: 1,
                    minHeight: "48px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-gray-600)",
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, minHeight: "48px", border: "none", cursor: "pointer" }}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Volunteer offer modal ── */}
      {activeVolunteerZone && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: isMobile ? "0.75rem" : "1rem",
          }}
        >
          <div
            className="card card-glass"
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: isMobile ? "1.25rem" : "2rem",
            }}
          >
            <h3
              style={{
                fontWeight: "800",
                color: "var(--color-blue)",
                marginBottom: "1rem",
                fontSize: isMobile ? "1.1rem" : "1.25rem",
              }}
            >
              Ofrecerme como Voluntario
            </h3>

            <form
              onSubmit={handleVolunteerSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  Mensaje para el Coordinador
                </label>
                <textarea
                  placeholder="Detalla qué tipo de ayuda o equipos técnicos posees para aportar a este punto crítico."
                  value={volunteerMsg}
                  onChange={(e) => setVolunteerMsg(e.target.value)}
                  required
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    height: "auto",
                    minHeight: "100px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.85rem",
                  flexDirection: isMobile ? "column-reverse" : "row",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveVolunteerZone(null)}
                  style={{
                    flex: 1,
                    minHeight: "48px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-gray-600)",
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, minHeight: "48px", border: "none", cursor: "pointer" }}
                >
                  Enviar Ofrecimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
