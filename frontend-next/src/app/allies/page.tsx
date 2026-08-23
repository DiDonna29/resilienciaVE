"use client";

import React, { useEffect, useState } from "react";
import { Users, Plus, Loader2, Share2, HelpCircle } from "lucide-react";
import alliesService from "@/core/services/allies.service";
import { AllyProfile, AllyType } from "@/core/models/ally.interface";
import DisasterCard from "@/shared/components/disaster-card/DisasterCard";
import SocialFlyer from "@/shared/components/social-flyer/SocialFlyer";
import { useAuthStore } from "@/core/store/auth.store";

export default function AlliesPage() {
  const { isAuthenticated } = useAuthStore();
  const [allies, setAllies] = useState<AllyProfile[]>([]);
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
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newAlly, setNewAlly] = useState({
    name: "",
    type: "company",
    description: "",
    phone: "",
    email: "",
    instagram: "",
    services_offered: "",
  });

  // Flyer target
  const [activeFlyerData, setActiveFlyerData] = useState<{
    title: string;
    description: string;
    services: string[];
    contact: string;
  } | null>(null);

  const loadAllies = async () => {
    setLoading(true);
    try {
      const data = await alliesService.getList(
        typeFilter as AllyType || undefined,
        1,
        searchQuery || undefined
      );
      setAllies(data.results || []);
    } catch (err) {
      console.error("Error loading allies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllies();
  }, [typeFilter, searchQuery]);

  const handleRegisterAlly = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const servicesList = newAlly.services_offered
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const contactObj = {
        phone: newAlly.phone,
        email: newAlly.email,
        instagram: newAlly.instagram,
      };

      await alliesService.create({
        name: newAlly.name,
        type: newAlly.type as AllyType,
        description: newAlly.description,
        contact_info: contactObj,
        services_offered: servicesList
      });

      setShowAddForm(false);
      setNewAlly({
        name: "",
        type: "company",
        description: "",
        phone: "",
        email: "",
        instagram: "",
        services_offered: "",
      });
      loadAllies();
    } catch (err) {
      console.error("Error registering ally profile:", err);
      alert("Error al registrar el perfil. Verifique los datos de contacto.");
    }
  };

  const getAllyTypeLabel = (type: string) => {
    switch (type) {
      case "company": return "Empresa / Comercio";
      case "brand": return "Marca";
      case "donor": return "Donador Particular";
      case "individual": return "Persona Natural / Técnico";
      default: return type;
    }
  };

  // ── Responsive style helpers ────────────────────────────────────────────
  const cPad = isMobile ? "0 12px" : "0 1rem";
  const h1Sz = isMobile ? "1.35rem" : "2rem";
  const hMb  = isMobile ? "1.5rem" : "2.5rem";
  const cGrid = isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))";
  const fCol  = isMobile ? "1fr" : "1fr 1fr";
  const iPad  = isMobile ? "12px 10px" : "10px";

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: cPad }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
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
            <Users size={isMobile ? 22 : 28} style={{ flexShrink: 0 }} />
            <span>Catálogo de Aliados Solidarios</span>
          </h1>
          <p style={{ color: "var(--color-gray-600)", marginTop: "0.25rem", fontSize: isMobile ? "0.82rem" : "0.95rem", lineHeight: 1.45 }}>
            Directorio de empresas, organizaciones y personas que ofrecen servicios gratuitos, donaciones o soporte técnico para la emergencia.
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
          <span>Registrarme como Aliado</span>
        </button>
      </header>

      {/* ── Filter and Search Bar ───────────────────────────────────────── */}
      <section
        className="card card-glass"
        style={{
          padding: isMobile ? "1rem" : "1.25rem",
          marginBottom: "2rem",
          display: "flex",
          gap: "0.75rem",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Buscar por nombre, servicio, transporte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px", fontSize: isMobile ? "0.9rem" : "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ width: isMobile ? "100%" : "200px" }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: "100%", padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px", fontSize: isMobile ? "0.88rem" : "1rem" }}
          >
            <option value="">Todas las Categorías</option>
            <option value="company">Empresa</option>
            <option value="brand">Marca</option>
            <option value="donor">Donador</option>
            <option value="individual">Voluntario Individual</option>
          </select>
        </div>
      </section>

      {/* ── Grid listing ─────────────────────────────────────────────── */}
      <section style={{ marginBottom: "3rem" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <Loader2 size={40} className="animate-spin" color="var(--color-blue)" />
          </div>
        ) : allies.length === 0 ? (
          <div style={{ textAlign: "center", padding: isMobile ? "3rem 1rem" : "4rem 2rem", background: "var(--color-white)", borderRadius: "16px", border: "1px solid var(--color-gray-200)", fontSize: isMobile ? "0.9rem" : "1rem" }}>
            No se encontraron aliados registrados que coincidan con la búsqueda.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: cGrid, gap: isMobile ? "1rem" : "1.5rem" }}>
            {allies.map((a) => {
              const phone = a.contact_info.phone || "Sin teléfono";
              const instagram = a.contact_info.instagram ? `@${a.contact_info.instagram.replace("@", "")}` : "";
              const contactDetails = `${phone} ${instagram ? `| Instagram: ${instagram}` : ""}`;

              const metadata = [
                { label: "Contacto", value: contactDetails },
                { label: "Correo", value: a.contact_info.email || "Sin email registrado" },
              ];

              return (
                <DisasterCard
                  key={a.id}
                  title={a.name}
                  subtitle={getAllyTypeLabel(a.type).toUpperCase()}
                  description={a.description}
                  status="operational"
                  badge={getAllyTypeLabel(a.type)}
                  metadata={metadata}
                  primaryActionLabel="Generar Flyer de Difusión"
                  onPrimaryAction={() => {
                    setActiveFlyerData({
                      title: a.name,
                      description: a.description,
                      services: a.services_offered,
                      contact: contactDetails,
                    });
                  }}
                >
                  <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-gray-200)", paddingTop: "1rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-gray-800)" }}>
                      Servicios / Donaciones que ofrece:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                      {a.services_offered.map((s, idx) => (
                        <span key={idx} style={{ background: "rgba(0,61,165,0.06)", color: "var(--color-blue)", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </DisasterCard>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Add Ally Form Modal ────────────────────────────────────────── */}
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
                Registrar Perfil Solidario
              </h3>
              <button onClick={() => setShowAddForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer", minHeight: "44px", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={20} style={{ transform: "rotate(45deg)" }} />
              </button>
            </div>

            <form onSubmit={handleRegisterAlly} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombre Comercial / Razón Social / Tu Nombre</label>
                <input
                  type="text"
                  placeholder="Ej. Transporte Integral de Caracas, S.A."
                  value={newAlly.name}
                  onChange={(e) => setNewAlly({ ...newAlly, name: e.target.value })}
                  required
                  style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px", fontSize: isMobile ? "0.9rem" : "1rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Tipo de Colaborador</label>
                <select
                  value={newAlly.type}
                  onChange={(e) => setNewAlly({ ...newAlly, type: e.target.value })}
                  style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                >
                  <option value="company">Empresa / Comercio</option>
                  <option value="brand">Marca</option>
                  <option value="donor">Donador Particular</option>
                  <option value="individual">Persona Natural / Voluntario Técnico</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Descripción detallada del ofrecimiento</label>
                <textarea
                  placeholder="Explique en qué consiste su ayuda."
                  value={newAlly.description}
                  onChange={(e) => setNewAlly({ ...newAlly, description: e.target.value })}
                  required
                  rows={3}
                  style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", fontFamily: "inherit", resize: "vertical", fontSize: isMobile ? "0.9rem" : "1rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: fCol, gap: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Teléfono de contacto</label>
                  <input
                    type="tel" placeholder="0412..."
                    value={newAlly.phone}
                    onChange={(e) => setNewAlly({ ...newAlly, phone: e.target.value })}
                    required
                    style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Instagram (Opcional)</label>
                  <input
                    type="text" placeholder="@transporte_solidario"
                    value={newAlly.instagram}
                    onChange={(e) => setNewAlly({ ...newAlly, instagram: e.target.value })}
                    style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Correo electrónico (Opcional)</label>
                <input
                  type="email" placeholder="contacto@empresa.com"
                  value={newAlly.email}
                  onChange={(e) => setNewAlly({ ...newAlly, email: e.target.value })}
                  style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Servicios / Insumos que ofrece (Separados por coma)</label>
                <input
                  type="text" placeholder="Ej. Transporte de carga, Agua potable, Telecomunicaciones"
                  value={newAlly.services_offered}
                  onChange={(e) => setNewAlly({ ...newAlly, services_offered: e.target.value })}
                  style={{ padding: iPad, borderRadius: "8px", border: "1px solid var(--color-gray-300)", minHeight: "44px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid var(--color-gray-600)", background: "transparent", cursor: "pointer", fontWeight: "600", minHeight: "44px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: "12px", border: "none", cursor: "pointer", minHeight: "44px" }}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Social Flyer download modal */}
      {activeFlyerData && (
        <SocialFlyer 
          isOpen={true}
          onClose={() => setActiveFlyerData(null)}
          title="Ficha de Aliado Solidario"
          data={{
            name: activeFlyerData.title,
            description: activeFlyerData.description,
            services: activeFlyerData.services,
            contact: activeFlyerData.contact,
          }}
        />
      )}

    </div>
  );
}
