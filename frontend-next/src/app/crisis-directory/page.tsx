"use client";

import React, { useEffect, useState } from "react";
import { Compass, Plus, Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import crisisDirectoryService from "@/core/services/crisis-directory.service";
import { CrisisResource, ResourceCategory } from "@/core/models/crisis-resource.interface";
import DisasterCard from "@/shared/components/disaster-card/DisasterCard";
import { useAuthStore } from "@/core/store/auth.store";

export default function CrisisDirectoryPage() {
  const { isAuthenticated } = useAuthStore();
  const [resources, setResources] = useState<CrisisResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Modals
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newResource, setNewResource] = useState({
    name: "",
    url: "",
    social_network: "",
    description: "",
    category: "website",
  });

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await crisisDirectoryService.getList(
        (categoryFilter || undefined) as any,
        1
      );
      setResources(data.results || []);
    } catch (err) {
      console.error("Error loading crisis resources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [categoryFilter]);

  const handleRegisterResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await crisisDirectoryService.create({
        ...newResource,
        category: newResource.category as ResourceCategory
      });
      
      // Check response message for moderation warnings
      if (resp.message) {
        alert(resp.message);
      } else {
        alert("¡Recurso enviado y publicado con éxito!");
      }

      setShowAddForm(false);
      setNewResource({
        name: "",
        url: "",
        social_network: "",
        description: "",
        category: "website",
      });
      loadResources();
    } catch (err: any) {
      console.error("Error registering resource:", err);
      alert("Error al registrar el recurso. Verifique la URL.");
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "app": return "Aplicación Móvil / PWA";
      case "website": return "Sitio Web de Ayuda";
      case "social": return "Red Social / Canal de Telegram";
      case "ngo": return "Organización No Gubernamental (ONG)";
      case "other":
      default: return "Otro Recurso";
    }
  };

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
      
      {/* Header */}
      <header style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "900", color: "var(--color-blue)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Compass size={28} />
            <span>Directorio de Crisis Ciudadano</span>
          </h1>
          <p style={{ color: "var(--color-gray-600)", marginTop: "0.25rem" }}>
            Tablón público de aplicaciones web, páginas de asistencia, canales oficiales de información y ONGs de ayuda en Venezuela.
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
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Plus size={18} />
          <span>Sugerir Recurso</span>
        </button>
      </header>

      {/* Auto-Moderation Alert info */}
      <div className="card card-glass" style={{ padding: "1.25rem", background: "rgba(16, 185, 129, 0.04)", borderLeft: "4px solid #10B981", marginBottom: "2rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <ShieldCheck size={24} color="#10B981" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ fontWeight: "700", color: "#10B981", fontSize: "0.95rem" }}>Auto-Moderación Automática Inteligente</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--color-gray-700)", marginTop: "0.25rem", lineHeight: "1.4" }}>
            Cualquier ciudadano puede sugerir herramientas de terceros. Si el algoritmo de censura del backend no detecta palabras obscenas o flags, el recurso se publica <strong>automáticamente</strong> al instante para acelerar la respuesta. Caso contrario, queda retenido hasta revisión del SuperAdmin.
          </p>
        </div>
      </div>

      {/* Category filters */}
      <section style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
        <button 
          onClick={() => setCategoryFilter("")}
          className="btn-secondary"
          style={{ 
            background: categoryFilter === "" ? "var(--color-blue)" : "transparent",
            color: categoryFilter === "" ? "white" : "var(--color-blue)",
            padding: "8px 16px", fontSize: "0.85rem"
          }}
        >
          Todos
        </button>
        <button 
          onClick={() => setCategoryFilter("website")}
          className="btn-secondary"
          style={{ 
            background: categoryFilter === "website" ? "var(--color-blue)" : "transparent",
            color: categoryFilter === "website" ? "white" : "var(--color-blue)",
            padding: "8px 16px", fontSize: "0.85rem"
          }}
        >
          Sitios Web
        </button>
        <button 
          onClick={() => setCategoryFilter("app")}
          className="btn-secondary"
          style={{ 
            background: categoryFilter === "app" ? "var(--color-blue)" : "transparent",
            color: categoryFilter === "app" ? "white" : "var(--color-blue)",
            padding: "8px 16px", fontSize: "0.85rem"
          }}
        >
          Aplicaciones / PWA
        </button>
        <button 
          onClick={() => setCategoryFilter("social")}
          className="btn-secondary"
          style={{ 
            background: categoryFilter === "social" ? "var(--color-blue)" : "transparent",
            color: categoryFilter === "social" ? "white" : "var(--color-blue)",
            padding: "8px 16px", fontSize: "0.85rem"
          }}
        >
          Canales / Redes
        </button>
        <button 
          onClick={() => setCategoryFilter("ngo")}
          className="btn-secondary"
          style={{ 
            background: categoryFilter === "ngo" ? "var(--color-blue)" : "transparent",
            color: categoryFilter === "ngo" ? "white" : "var(--color-blue)",
            padding: "8px 16px", fontSize: "0.85rem"
          }}
        >
          ONGs
        </button>
      </section>

      {/* Grid listing */}
      <section style={{ marginBottom: "3rem" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <Loader2 size={40} className="animate-spin" color="var(--color-blue)" />
          </div>
        ) : resources.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--color-white)", borderRadius: "16px", border: "1px solid var(--color-gray-200)" }}>
            No se encontraron recursos registrados en esta categoría.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {resources.map((r) => {
              const metadata = [
                { label: "Canal/Red", value: r.social_network || "No especificada" },
                { label: "Registrado por", value: r.submitted_by_name }
              ];

              return (
                <DisasterCard
                  key={r.id}
                  title={r.name}
                  subtitle={getCategoryLabel(r.category).toUpperCase()}
                  description={r.description}
                  status="operational"
                  badge={getCategoryLabel(r.category)}
                  metadata={metadata}
                  primaryActionLabel="Visitar Recurso"
                  onPrimaryAction={() => {
                    window.open(r.url, "_blank", "noopener,noreferrer");
                  }}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Suggest Resource Form Modal */}
      {showAddForm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", overflowY: "auto" }}>
          <div className="card card-glass" style={{ width: "100%", maxWidth: "450px", padding: "2rem" }}>
            <h3 style={{ fontWeight: "800", color: "var(--color-blue)", marginBottom: "1rem" }}>Sugerir Recurso de Apoyo</h3>
            
            <form onSubmit={handleRegisterResource} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombre del Recurso / Herramienta</label>
                <input 
                  type="text" 
                  placeholder="Ej. Mapa de Donaciones en Lara"
                  value={newResource.name}
                  onChange={(e) => setNewResource({...newResource, name: e.target.value})}
                  required
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Categoría</label>
                <select 
                  value={newResource.category}
                  onChange={(e) => setNewResource({...newResource, category: e.target.value})}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
                >
                  <option value="website">Sitio Web</option>
                  <option value="app">Aplicación / PWA</option>
                  <option value="social">Red Social / Telegram</option>
                  <option value="ngo">ONG</option>
                  <option value="other">Otro Recurso</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Dirección URL / Enlace</label>
                <input 
                  type="url" 
                  placeholder="https://ejemplo.com/ayuda"
                  value={newResource.url}
                  onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                  required
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Usuario Red/Canal (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="@canaltelegram o @cuenta_insta"
                  value={newResource.social_network}
                  onChange={(e) => setNewResource({...newResource, social_network: e.target.value})}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Descripción corta (máx 140 carac.)</label>
                <textarea 
                  placeholder="Ej. Directorio interactivo de centros de acopio en Barquisimeto."
                  value={newResource.description}
                  onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                  required
                  maxLength={140}
                  rows={2}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-600)", background: "transparent", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ flex: 1, padding: "10px", border: "none", cursor: "pointer" }}
                >
                  Sugerir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
