"use client";

import React, { useEffect, useState } from "react";
import { HeartPulse, Plus, Loader2, Edit3, X, ShieldCheck } from "lucide-react";
import healthNetworkService from "@/core/services/health-network.service";
import { HealthCenter, HealthCenterType, OperationalStatus } from "@/core/models/health-center.interface";
import DisasterCard from "@/shared/components/disaster-card/DisasterCard";
import { useAuthStore } from "@/core/store/auth.store";

export default function HealthNetworkPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [centers, setCenters] = useState<HealthCenter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Responsive
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");

  // Modals
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newCenter, setNewCenter] = useState({
    name: "",
    type: "hospital",
    latitude: 10.4806,
    longitude: -66.9036,
    address: "",
    state_ve: "Distrito Capital",
    status: "operational",
    is_attending: true,
    contact_phone: "",
    contact_email: "",
    missing_supplies: "",
  });

  // Edit supplies
  const [activeSuppliesCenter, setActiveSuppliesCenter] = useState<HealthCenter | null>(null);
  const [suppliesText, setSuppliesText] = useState("");

  const states = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
    'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
    'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta',
    'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
  ];

  const loadCenters = async () => {
    setLoading(true);
    try {
      const data = await healthNetworkService.getList(
        (statusFilter || undefined) as any,
        (typeFilter || undefined) as any,
        stateFilter || undefined,
        1
      );
      setCenters(data.results || []);
    } catch (err) {
      console.error("Error loading health centers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCenters();
  }, [statusFilter, typeFilter, stateFilter]);

  const handleRegisterCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const suppliesList = newCenter.missing_supplies
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      await healthNetworkService.create({
        ...newCenter,
        type: newCenter.type as HealthCenterType,
        status: newCenter.status as OperationalStatus,
        missing_supplies: suppliesList
      });

      setShowAddForm(false);
      setNewCenter({
        name: "",
        type: "hospital",
        latitude: 10.4806,
        longitude: -66.9036,
        address: "",
        state_ve: "Distrito Capital",
        status: "operational",
        is_attending: true,
        contact_phone: "",
        contact_email: "",
        missing_supplies: "",
      });
      loadCenters();
    } catch (err) {
      console.error("Error registering health center:", err);
      alert("Error al registrar el centro de salud. Verifique los datos.");
    }
  };

  const handleSuppliesUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSuppliesCenter) return;
    try {
      const suppliesList = suppliesText
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      await healthNetworkService.updateSupplies(activeSuppliesCenter.id, {
        missing_supplies: suppliesList
      });

      setActiveSuppliesCenter(null);
      setSuppliesText("");
      loadCenters();
    } catch (err) {
      console.error("Error updating supplies:", err);
      alert("Error al actualizar la lista de insumos.");
    }
  };

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case "operational": return "operational";
      case "critical": return "critical";
      case "closed": return "closed";
      default: return "operational";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "operational": return "Operativo (Con Capacidad)";
      case "critical": return "Crítico / Escasez";
      case "closed": return "Colapsado / Fuera de Servicio";
      default: return status;
    }
  };

  const getCenterTypeLabel = (type: string) => {
    switch (type) {
      case "hospital": return "Hospital";
      case "clinic": return "Clínica";
      case "medical_post": return "Puesto de Atención";
      default: return type;
    }
  };

  // ── Responsive style helpers ────────────────────────────────────────────
  const cPad = isMobile ? "0 12px" : "0 1rem";
  const h1Sz = isMobile ? "1.35rem" : "2rem";
  const hMb  = isMobile ? "1.5rem" : "2.5rem";
  const fGrid = isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))";
  const cGrid = isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))";
  const fCol  = isMobile ? "1fr" : "1fr 1fr";
  const iPad  = isMobile ? "12px 10px" : "10px";

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: cPad }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        style={{
          marginBottom: hMb,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: h1Sz,
              fontWeight: "900",
              color: "var(--color-blue)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              flexWrap: "wrap",
              lineHeight: 1.2,
            }}
          >
            <HeartPulse size={isMobile ? 22 : 28} style={{ flexShrink: 0 }} />
            <span>Red Hospitalaria y Centros Médicos</span>
          </h1>
          <p
            style={{
              color: "var(--color-gray-600)",
              marginTop: "0.25rem",
              fontSize: isMobile ? "0.82rem" : "0.95rem",
              lineHeight: 1.45,
            }}
          >
            Estado de operatividad en tiempo real de hospitales y clínicas
            venezolanas e insumos de emergencia requeridos.
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
            gap: "0.4rem",
            fontSize: isMobile ? "0.82rem" : "0.9rem",
            padding: isMobile ? "10px 14px" : "10px 18px",
            whiteSpace: "nowrap",
            minHeight: "44px",
          }}
        >
          <Plus size={16} />
          <span>Registrar Centro</span>
        </button>
      </header>

      {/* ── Verification Info ─────────────────────────────────────────── */}
      <div
        className="card card-glass"
        style={{
          padding: isMobile ? "1rem" : "1.25rem",
          background: "rgba(0, 61, 165, 0.05)",
          borderLeft: "4px solid var(--color-blue)",
          marginBottom: "1.5rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-start",
        }}
      >
        <ShieldCheck size={22} color="var(--color-blue)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <h4 style={{ fontWeight: "700", color: "var(--color-blue)", fontSize: isMobile ? "0.88rem" : "0.95rem" }}>
            Edición y Verificación de Personal Médico
          </h4>
          <p style={{ fontSize: isMobile ? "0.78rem" : "0.85rem", color: "var(--color-gray-700)", marginTop: "0.25rem", lineHeight: "1.4" }}>
            Los usuarios registrados que tengan la insignia de <strong>Trabajador de Salud Verificado</strong> (otorgada por SuperAdmin) pueden editar el listado de insumos críticos de cualquier centro de salud para mantener la base de datos actualizada en tiempo de escasez.
          </p>
        </div>
      </div>

      {/* ── Filters Bar ───────────────────────────────────────────────── */}
      <section className="card card-glass" style={{ padding: isMobile ? "1rem" : "1.25rem", marginBottom: "1.5rem" }}>
        <h4 style={{ fontWeight: "700", marginBottom: "0.75rem", fontSize: isMobile ? "0.9rem" : "1rem" }}>
          Filtrar Centros Médicos
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: fGrid, gap: isMobile ? "0.75rem" : "1rem" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "600" }}>Operatividad</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", fontSize: isMobile ? "0.85rem" : "0.9rem", minHeight: "44px" }}
            >
              <option value="">Todos los Estados</option>
              <option value="operational">🟢 Operativo</option>
              <option value="critical">🟡 Crítico / Escasez</option>
              <option value="closed">🔴 Colapsado</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "600" }}>Tipo de Centro</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", fontSize: isMobile ? "0.85rem" : "0.9rem", minHeight: "44px" }}
            >
              <option value="">Todos los Tipos</option>
              <option value="hospital">Hospital</option>
              <option value="clinic">Clínica</option>
              <option value="medical_post">Puesto de Atención</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "600" }}>Estado de Venezuela</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", fontSize: isMobile ? "0.85rem" : "0.9rem", minHeight: "44px" }}
            >
              <option value="">Todos los Estados</option>
              {states.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* ── Grid listing ──────────────────────────────────────────────── */}
      <section style={{ marginBottom: "3rem" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <Loader2 size={40} className="animate-spin" color="var(--color-blue)" />
          </div>
        ) : centers.length === 0 ? (
          <div style={{ textAlign: "center", padding: isMobile ? "3rem 1rem" : "4rem 2rem", background: "var(--color-white)", borderRadius: "16px", border: "1px solid var(--color-gray-200)", fontSize: isMobile ? "0.9rem" : "1rem" }}>
            No se encontraron centros médicos que coincidan con los filtros.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: cGrid, gap: isMobile ? "1rem" : "1.5rem" }}>
            {centers.map((c) => {
              const canEdit = isAuthenticated && (
                c.registered_by?.id === user?.id || 
                user?.role === 'SUPERADMIN' || 
                user?.is_verified_health_worker
              );

              const metadata = [
                { label: "Atención de emergencias", value: c.is_attending ? "SÍ (Abierto)" : "NO" },
                { label: "Contacto", value: c.contact_phone },
                { label: "Última actualización", value: new Date(c.updated_at).toLocaleString() }
              ];

              return (
                <DisasterCard
                  key={c.id}
                  title={c.name}
                  subtitle={getCenterTypeLabel(c.type).toUpperCase()}
                  description={c.address}
                  status={getStatusBadgeType(c.status)}
                  badge={getStatusLabel(c.status)}
                  location={c.state_ve}
                  metadata={metadata}
                >
                  <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-gray-200)", paddingTop: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-gray-800)" }}>
                        Insumos críticos faltantes:
                      </span>
                      {canEdit && (
                        <button 
                          onClick={() => {
                            setActiveSuppliesCenter(c);
                            setSuppliesText(c.missing_supplies.join(", "));
                          }}
                          style={{ background: "transparent", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--color-blue)", fontWeight: "600" }}
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>
                      )}
                    </div>
                    
                    {c.missing_supplies.length === 0 ? (
                      <p style={{ fontSize: "0.8rem", color: "#10B981", marginTop: "0.25rem", fontWeight: "600" }}>
                        ✓ Cuenta con insumos suficientes actualmente
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                        {c.missing_supplies.map((item, idx) => (
                          <span key={idx} style={{ background: "rgba(239,51,64,0.08)", color: "var(--color-red)", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
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

      {/* ── Add Center Modal ──────────────────────────────────────────── */}
      {showAddForm && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.55)", zIndex: 1000,
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            padding: isMobile ? "0" : "1rem",
            overflowY: "auto",
          }}
        >
          <div
            className="card card-glass"
            style={{
              width: "100%", maxWidth: isMobile ? "100%" : "550px",
              padding: isMobile ? "1.25rem 1rem" : "2rem",
              maxHeight: "92vh", overflowY: "auto",
              borderRadius: isMobile ? "16px 16px 0 0" : "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: isMobile ? "1.15rem" : "1.5rem", fontWeight: "800", color: "var(--color-blue)" }}>
                Registrar Centro de Salud
              </h3>
              <button onClick={() => setShowAddForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer", minHeight: "44px", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterCenter} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombre Comercial / Institución</label>
                <input
                  type="text"
                  placeholder="Ej. Hospital Clínico de Caracas"
                  value={newCenter.name}
                  onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                  required
                  style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px", fontSize: isMobile ? "0.9rem" : "1rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: fCol, gap: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Tipo de Centro</label>
                  <select
                    value={newCenter.type}
                    onChange={(e) => setNewCenter({ ...newCenter, type: e.target.value })}
                    style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                  >
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clínica</option>
                    <option value="medical_post">Puesto de Atención</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Estado</label>
                  <select
                    value={newCenter.state_ve}
                    onChange={(e) => setNewCenter({ ...newCenter, state_ve: e.target.value })}
                    style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                  >
                    {states.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Dirección Física Detallada</label>
                <textarea
                  placeholder="Piso, avenida, sector, punto de referencia."
                  value={newCenter.address}
                  onChange={(e) => setNewCenter({ ...newCenter, address: e.target.value })}
                  required rows={2}
                  style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", fontFamily: "inherit", resize: "vertical", fontSize: isMobile ? "0.9rem" : "1rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: fCol, gap: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Estado de operatividad</label>
                  <select
                    value={newCenter.status}
                    onChange={(e) => setNewCenter({ ...newCenter, status: e.target.value })}
                    style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                  >
                    <option value="operational">Operativo</option>
                    <option value="critical">Crítico / Escasez</option>
                    <option value="closed">Colapsado</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>¿Atendiendo emergencias?</label>
                  <select
                    value={newCenter.is_attending ? "true" : "false"}
                    onChange={(e) => setNewCenter({ ...newCenter, is_attending: e.target.value === "true" })}
                    style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                  >
                    <option value="true">Sí, abierto a emergencias</option>
                    <option value="false">No, colapsado o cerrado</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: fCol, gap: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Teléfono de contacto</label>
                  <input type="tel" placeholder="0212..."
                    value={newCenter.contact_phone}
                    onChange={(e) => setNewCenter({ ...newCenter, contact_phone: e.target.value })}
                    required
                    style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Email (Opcional)</label>
                  <input type="email" placeholder="contacto@hospital.com"
                    value={newCenter.contact_email}
                    onChange={(e) => setNewCenter({ ...newCenter, contact_email: e.target.value })}
                    style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Insumos críticos requeridos (Separados por coma)</label>
                <input type="text" placeholder="Ej. Gasa estéril, Catéteres, Jeringas 5cc"
                  value={newCenter.missing_supplies}
                  onChange={(e) => setNewCenter({ ...newCenter, missing_supplies: e.target.value })}
                  style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowAddForm(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid var(--color-gray-600)", background: "transparent", cursor: "pointer", fontWeight: "600", minHeight: "44px" }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary"
                  style={{ flex: 1, padding: "12px", border: "none", cursor: "pointer", minHeight: "44px" }}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Supplies Modal ───────────────────────────────────────── */}
      {activeSuppliesCenter && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.55)", zIndex: 1000,
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            padding: isMobile ? "0" : "1rem",
          }}
        >
          <div
            className="card card-glass"
            style={{
              width: "100%", maxWidth: isMobile ? "100%" : "450px",
              padding: isMobile ? "1.25rem 1rem" : "2rem",
              borderRadius: isMobile ? "16px 16px 0 0" : "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontWeight: "800", color: "var(--color-blue)", fontSize: isMobile ? "1.05rem" : "1.25rem" }}>
                Editar Insumos Faltantes
              </h3>
              <button onClick={() => setActiveSuppliesCenter(null)} style={{ background: "transparent", border: "none", cursor: "pointer", minHeight: "44px", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: isMobile ? "0.8rem" : "0.85rem", color: "var(--color-gray-600)", marginBottom: "1.25rem" }}>
              Modifique la lista de insumos críticos faltantes para <strong>{activeSuppliesCenter.name}</strong>.
            </p>

            <form onSubmit={handleSuppliesUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Insumos (Separados por coma)</label>
                <textarea
                  value={suppliesText}
                  onChange={(e) => setSuppliesText(e.target.value)}
                  placeholder="Ej. Gasa, Algodón, Antibiótico..."
                  rows={4}
                  style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", fontFamily: "inherit", fontSize: isMobile ? "0.88rem" : "0.9rem", resize: "vertical" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--color-gray-600)" }}>
                  Deje vacío si el centro cuenta con todos los insumos necesarios.
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="button" onClick={() => setActiveSuppliesCenter(null)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-600)", background: "transparent", cursor: "pointer", minHeight: "44px" }}
                >
                  Cerrar
                </button>
                <button type="submit" className="btn-primary"
                  style={{ flex: 1, padding: "10px", border: "none", cursor: "pointer", minHeight: "44px" }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
