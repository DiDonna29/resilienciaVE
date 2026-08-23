"use client";

import React, { useEffect, useState } from "react";
import { Home as HomeIcon, Plus, Loader2, Edit3, ShieldCheck } from "lucide-react";
import sheltersService from "@/core/services/shelters.service";
import { Shelter, ShelterType, ShelterStatus } from "@/core/models/shelter.interface";
import DisasterCard from "@/shared/components/disaster-card/DisasterCard";
import { useAuthStore } from "@/core/store/auth.store";

/* ─── Responsive hook ─── */
function useViewport() {
  const [width, setWidth] = useState<number>(360);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

export default function SheltersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { isMobile, isTablet } = useViewport();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");

  // Modals
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newShelter, setNewShelter] = useState({
    name: "",
    type: "community_center",
    latitude: 10.4806,
    longitude: -66.9036,
    address: "",
    state_ve: "Distrito Capital",
    status: "open",
    current_capacity: 0,
    max_capacity: 100,
    missing_supplies: "",
  });

  // Edit supplies / capacity
  const [activeEditShelter, setActiveEditShelter] = useState<Shelter | null>(null);
  const [editData, setEditData] = useState({
    status: "open",
    current_capacity: 0,
    max_capacity: 100,
    missing_supplies: "",
  });

  const states = [
    "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar",
    "Carabobo", "Cojedes", "Delta Amacuro", "Distrito Capital", "Falcón",
    "Guárico", "Lara", "Mérida", "Miranda", "Monagas", "Nueva Esparta",
    "Portuguesa", "Sucre", "Táchira", "Trujillo", "Vargas", "Yaracuy", "Zulia",
  ];

  const loadShelters = async () => {
    setLoading(true);
    try {
      const data = await sheltersService.getList(
        (statusFilter || undefined) as any,
        (typeFilter || undefined) as any,
        stateFilter || undefined,
        1
      );
      setShelters(data.results || []);
    } catch (err) {
      console.error("Error loading shelters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelters();
  }, [statusFilter, typeFilter, stateFilter]);

  const handleRegisterShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const suppliesList = newShelter.missing_supplies
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await sheltersService.create({
        name: newShelter.name,
        type: newShelter.type as ShelterType,
        latitude: newShelter.latitude,
        longitude: newShelter.longitude,
        address: newShelter.address,
        state_ve: newShelter.state_ve,
        status: newShelter.status as ShelterStatus,
        current_capacity: newShelter.current_capacity,
        max_capacity: newShelter.max_capacity,
        missing_supplies: suppliesList,
      });

      setShowAddForm(false);
      setNewShelter({
        name: "",
        type: "community_center",
        latitude: 10.4806,
        longitude: -66.9036,
        address: "",
        state_ve: "Distrito Capital",
        status: "open",
        current_capacity: 0,
        max_capacity: 100,
        missing_supplies: "",
      });
      loadShelters();
    } catch (err) {
      console.error("Error registering shelter:", err);
      alert("Error al registrar el refugio. Verifique los datos.");
    }
  };

  const handleUpdateShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditShelter) return;
    try {
      const suppliesList = editData.missing_supplies
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await sheltersService.update(activeEditShelter.id, {
        status: editData.status as ShelterStatus,
        current_capacity: editData.current_capacity,
        max_capacity: editData.max_capacity,
      });

      await sheltersService.updateSupplies(activeEditShelter.id, {
        missing_supplies: suppliesList,
      });

      setActiveEditShelter(null);
      loadShelters();
    } catch (err) {
      console.error("Error updating shelter details:", err);
      alert("Error al actualizar los datos del refugio. Verifique los límites de capacidad.");
    }
  };

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case "open": return "operational";
      case "full": return "critical";
      case "closed": return "closed";
      default: return "operational";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return "Abierto (Cupos disponibles)";
      case "full": return "Lleno (Capacidad Máxima)";
      case "closed": return "Cerrado / No Disponible";
      default: return status;
    }
  };

  const getShelterTypeLabel = (type: string) => {
    switch (type) {
      case "hotel": return "Hotel / Hospedaje";
      case "camp": return "Campamento Temporal";
      case "open_area": return "Zona Abierta / Polideportivo";
      case "community_center": return "Centro Comunitario";
      case "other":
      default: return "Otro";
    }
  };

  /* ─── Layout derived values ─── */
  const pagePadding = isMobile ? "0 12px" : "0 1rem";
  const titleSize   = isMobile ? "1.35rem" : "2rem";

  // Cards: 1 col mobile, 2 tablet, auto-fill desktop
  const cardsGridCols = isMobile
    ? "1fr"
    : isTablet
    ? "repeat(2, 1fr)"
    : "repeat(auto-fill, minmax(320px, 1fr))";

  // Shared input style
  const inputStyle: React.CSSProperties = {
    padding: "12px 10px",
    borderRadius: "8px",
    border: "1px solid var(--color-gray-300)",
    fontSize: "0.9rem",
    width: "100%",
    boxSizing: "border-box",
    minHeight: "48px",
  };

  return (
    <div
      className="container"
      style={{ maxWidth: "1200px", margin: "0 auto", padding: pagePadding }}
    >
      {/* ── Header ── */}
      <header
        style={{
          marginBottom: isMobile ? "1.25rem" : "2.5rem",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "0.75rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: titleSize,
              fontWeight: "900",
              color: "var(--color-blue)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              lineHeight: 1.2,
            }}
          >
            <HomeIcon size={isMobile ? 22 : 28} />
            <span>Refugios, Hoteles y Campamentos</span>
          </h1>
          <p
            style={{
              color: "var(--color-gray-600)",
              marginTop: "0.25rem",
              fontSize: isMobile ? "0.82rem" : "1rem",
              lineHeight: 1.4,
            }}
          >
            Centros comunitarios, hoteles solidarios y campamentos de asistencia temporal disponibles en el país.
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
            gap: "0.5rem",
            minHeight: "48px",
            padding: "0 1.25rem",
            fontSize: isMobile ? "0.85rem" : "1rem",
            whiteSpace: "nowrap",
            alignSelf: isMobile ? "stretch" : "auto",
            justifyContent: "center",
          }}
        >
          <Plus size={18} />
          <span>Registrar Refugio</span>
        </button>
      </header>

      {/* ── Verification Claim Info ── */}
      <div
        className="card card-glass"
        style={{
          padding: isMobile ? "0.875rem" : "1.25rem",
          background: "rgba(139, 92, 246, 0.05)",
          borderLeft: "4px solid #8B5CF6",
          marginBottom: isMobile ? "1.25rem" : "2rem",
          display: "flex",
          gap: "0.65rem",
          alignItems: "flex-start",
        }}
      >
        <ShieldCheck size={isMobile ? 20 : 24} color="#8B5CF6" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <h4 style={{ fontWeight: "700", color: "#8B5CF6", fontSize: isMobile ? "0.85rem" : "0.95rem" }}>
            Gestión de Capacidad y Refugios
          </h4>
          <p
            style={{
              fontSize: isMobile ? "0.78rem" : "0.85rem",
              color: "var(--color-gray-700)",
              marginTop: "0.25rem",
              lineHeight: "1.4",
            }}
          >
            Los usuarios registrados que tengan la insignia de{" "}
            <strong>Gestor de Refugios Verificado</strong> (otorgada por SuperAdmin) pueden
            editar el cupo actual, capacidad total y los insumos críticos requeridos de
            cualquier refugio del listado.
          </p>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <section
        className="card card-glass"
        style={{ padding: isMobile ? "0.875rem" : "1.25rem", marginBottom: isMobile ? "1.25rem" : "2rem" }}
      >
        <h4 style={{ fontWeight: "700", marginBottom: "0.75rem", fontSize: isMobile ? "0.9rem" : "1rem" }}>
          Filtrar Refugios
        </h4>

        {/* Filters: 1-col on mobile (stacked selects), 3-cols on tablet+ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? "0.65rem" : "1rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "600" }}>Disponibilidad</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="">Todas</option>
              <option value="open">🟢 Abierto</option>
              <option value="full">🟡 Lleno</option>
              <option value="closed">🔴 Cerrado</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "600" }}>Tipo de Espacio</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="">Todos los Tipos</option>
              <option value="community_center">Centro Comunitario</option>
              <option value="hotel">Hotel</option>
              <option value="camp">Campamento</option>
              <option value="open_area">Polideportivo / Zona Abierta</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "600" }}>Estado de Venezuela</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="">Todos los Estados</option>
              {states.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Grid listing ── */}
      <section style={{ marginBottom: "3rem" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: "1rem",
              padding: isMobile ? "2.5rem 1rem" : "4rem",
            }}
          >
            <Loader2 size={40} className="animate-spin" color="var(--color-blue)" />
            <span style={{ color: "var(--color-gray-600)", fontSize: "0.9rem" }}>
              Cargando refugios...
            </span>
          </div>
        ) : shelters.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: isMobile ? "3rem 1rem" : "4rem 2rem",
              background: "var(--color-white)",
              borderRadius: "16px",
              border: "1px solid var(--color-gray-200)",
              fontSize: isMobile ? "0.9rem" : "1rem",
            }}
          >
            No se encontraron refugios registrados bajo los filtros seleccionados.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: cardsGridCols,
              gap: isMobile ? "0.875rem" : "1.5rem",
            }}
          >
            {shelters.map((s) => {
              const canEdit =
                isAuthenticated &&
                (s.registered_by?.id === user?.id ||
                  user?.role === "SUPERADMIN" ||
                  user?.is_verified_shelter_manager);

              const pct =
                s.max_capacity > 0
                  ? Math.min(100, Math.round((s.current_capacity / s.max_capacity) * 100))
                  : 0;
              const barColor =
                pct >= 90
                  ? "var(--color-red)"
                  : pct >= 70
                  ? "#F59E0B"
                  : "#10B981";

              const metadata = [
                {
                  label: "Capacidad registrada",
                  value: `${s.current_capacity} / ${s.max_capacity} personas`,
                },
                { label: "Dirección", value: s.address },
                {
                  label: "Última actualización",
                  value: new Date(s.updated_at).toLocaleString(),
                },
              ];

              return (
                <DisasterCard
                  key={s.id}
                  title={s.name}
                  subtitle={getShelterTypeLabel(s.type).toUpperCase()}
                  status={getStatusBadgeType(s.status)}
                  badge={getStatusLabel(s.status)}
                  location={s.state_ve}
                  metadata={metadata}
                >
                  {/* Capacity Bar */}
                  <div style={{ marginTop: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span>Porcentaje de Ocupación:</span>
                      <span style={{ color: barColor }}>{pct}%</span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "var(--color-gray-200)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: barColor,
                          transition: "width 0.5s ease-out",
                        }}
                      />
                    </div>
                  </div>

                  {/* Supplies segment */}
                  <div
                    style={{
                      marginTop: "1rem",
                      borderTop: "1px solid var(--color-gray-200)",
                      paddingTop: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: "700",
                          color: "var(--color-gray-800)",
                        }}
                      >
                        Insumos críticos requeridos:
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => {
                            setActiveEditShelter(s);
                            setEditData({
                              status: s.status,
                              current_capacity: s.current_capacity,
                              max_capacity: s.max_capacity,
                              missing_supplies: s.missing_supplies.join(", "),
                            });
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.75rem",
                            color: "var(--color-blue)",
                            fontWeight: "600",
                            minHeight: "44px",
                            padding: "0 4px",
                          }}
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>
                      )}
                    </div>

                    {s.missing_supplies.length === 0 ? (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#10B981",
                          marginTop: "0.25rem",
                          fontWeight: "600",
                        }}
                      >
                        ✓ Cuenta con insumos y alimentos suficientes
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.4rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        {s.missing_supplies.map((item, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "rgba(139, 92, 246, 0.08)",
                              color: "#8B5CF6",
                              fontSize: "0.75rem",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: "600",
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </DisasterCard>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Add Shelter Modal ── */}
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
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            padding: isMobile ? "0" : "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddForm(false);
          }}
        >
          <div
            className="card card-glass"
            style={{
              width: "100%",
              maxWidth: isMobile ? "100%" : "550px",
              padding: isMobile ? "1.25rem 1rem 2rem" : "2rem",
              maxHeight: isMobile ? "95vh" : "90vh",
              overflowY: "auto",
              borderRadius: isMobile ? "20px 20px 0 0" : "16px",
            }}
          >
            {/* Drag handle for mobile */}
            {isMobile && (
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  background: "var(--color-gray-300)",
                  borderRadius: "2px",
                  margin: "0 auto 1rem",
                }}
              />
            )}

            <h3
              style={{
                fontSize: isMobile ? "1.2rem" : "1.5rem",
                fontWeight: "800",
                color: "var(--color-blue)",
                marginBottom: "1.25rem",
              }}
            >
              Registrar Nuevo Refugio
            </h3>

            <form
              onSubmit={handleRegisterShelter}
              style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  Nombre del Refugio / Centro
                </label>
                <input
                  type="text"
                  placeholder="Ej. Gimnasio Papa Carrillo - Refugio Afectados"
                  value={newShelter.name}
                  onChange={(e) => setNewShelter({ ...newShelter, name: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>

              {/* Tipo + Estado: 1-col mobile, 2-cols otherwise */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "0.875rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Tipo de Refugio</label>
                  <select
                    value={newShelter.type}
                    onChange={(e) => setNewShelter({ ...newShelter, type: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="community_center">Centro Comunitario</option>
                    <option value="hotel">Hotel</option>
                    <option value="camp">Campamento Temporal</option>
                    <option value="open_area">Polideportivo / Zona Abierta</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Estado</label>
                  <select
                    value={newShelter.state_ve}
                    onChange={(e) => setNewShelter({ ...newShelter, state_ve: e.target.value })}
                    style={inputStyle}
                  >
                    {states.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  Dirección Física Detallada
                </label>
                <textarea
                  placeholder="Detalles sobre calles, accesibilidad y puntos de referencia."
                  value={newShelter.address}
                  onChange={(e) => setNewShelter({ ...newShelter, address: e.target.value })}
                  required
                  rows={2}
                  style={{
                    ...inputStyle,
                    minHeight: "unset",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Capacidad: 1-col mobile, 2-cols otherwise */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "0.875rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                    Capacidad Actual (Ocupantes)
                  </label>
                  <input
                    type="number"
                    value={newShelter.current_capacity}
                    onChange={(e) =>
                      setNewShelter({
                        ...newShelter,
                        current_capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                    Capacidad Máxima (Límite)
                  </label>
                  <input
                    type="number"
                    value={newShelter.max_capacity}
                    onChange={(e) =>
                      setNewShelter({
                        ...newShelter,
                        max_capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  Alimentos/Mantas/Insumos requeridos (Separados por coma)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mantas térmicas, Agua potable en bidones, Pañales"
                  value={newShelter.missing_supplies}
                  onChange={(e) =>
                    setNewShelter({ ...newShelter, missing_supplies: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    minHeight: "48px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-gray-600)",
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: "14px",
                    minHeight: "48px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                  }}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Capacity and Supplies Modal ── */}
      {activeEditShelter && (
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
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            padding: isMobile ? "0" : "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveEditShelter(null);
          }}
        >
          <div
            className="card card-glass"
            style={{
              width: "100%",
              maxWidth: isMobile ? "100%" : "450px",
              padding: isMobile ? "1.25rem 1rem 2rem" : "2rem",
              maxHeight: isMobile ? "95vh" : "90vh",
              overflowY: "auto",
              borderRadius: isMobile ? "20px 20px 0 0" : "16px",
            }}
          >
            {/* Drag handle */}
            {isMobile && (
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  background: "var(--color-gray-300)",
                  borderRadius: "2px",
                  margin: "0 auto 1rem",
                }}
              />
            )}

            <h3
              style={{
                fontWeight: "800",
                color: "var(--color-blue)",
                marginBottom: "1rem",
                fontSize: isMobile ? "1.1rem" : "1.25rem",
              }}
            >
              Editar Datos de Refugio
            </h3>

            <form
              onSubmit={handleUpdateShelter}
              style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Disponibilidad</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="open">Abierto (Cupos disponibles)</option>
                  <option value="full">Lleno (Capacidad Máxima)</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>

              {/* Capacidad: 1-col mobile, 2-cols otherwise */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "0.875rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                    Ocupantes actuales
                  </label>
                  <input
                    type="number"
                    value={editData.current_capacity}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        current_capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                    Capacidad máxima
                  </label>
                  <input
                    type="number"
                    value={editData.max_capacity}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        max_capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  Insumos/Alimentos requeridos (Separados por coma)
                </label>
                <textarea
                  value={editData.missing_supplies}
                  onChange={(e) =>
                    setEditData({ ...editData, missing_supplies: e.target.value })
                  }
                  rows={3}
                  style={{
                    ...inputStyle,
                    minHeight: "unset",
                    resize: "vertical",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setActiveEditShelter(null)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    minHeight: "48px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-gray-600)",
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                  }}
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: "14px",
                    minHeight: "48px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
