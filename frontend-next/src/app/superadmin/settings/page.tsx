"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, ShieldOff } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/core/services/api.service";

interface SystemModule {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export default function SuperAdminSettingsPage() {
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadModules();
  }, []);

  async function loadModules() {
    setLoading(true);
    try {
      const { data } = await api.get<SystemModule[]>('/admin-panel/modules/');
      setModules(data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudieron cargar los módulos", "error");
    } finally {
      setLoading(false);
    }
  }

  const toggleModule = async (mod: SystemModule) => {
    try {
      const { data } = await api.patch('/admin-panel/modules/', {
        slug: mod.slug,
        is_active: !mod.is_active
      });
      Swal.fire("Éxito", data.detail, "success");
      loadModules();
      if (typeof window !== 'undefined') {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.detail || "Hubo un error", "error");
    }
  };

  return (
    <div>
      <h1
        style={{
          fontSize: isMobile ? "1.4rem" : "2rem",
          fontWeight: "800",
          color: "var(--color-gray-900)",
          marginBottom: "0.5rem",
        }}
      >
        Configuración del Sistema
      </h1>
      <p style={{ color: "var(--color-gray-600)", marginBottom: "2rem", fontSize: isMobile ? "0.875rem" : "1rem" }}>
        Activa o desactiva los módulos principales de la plataforma. Los cambios afectarán la barra de navegación pública.
      </p>

      <div className="card card-glass" style={{ padding: isMobile ? "1rem" : "2rem" }}>
        <h2 style={{ fontSize: isMobile ? "1.05rem" : "1.25rem", fontWeight: "700", marginBottom: "1.5rem" }}>
          Módulos del Sistema
        </h2>

        {loading ? (
          <p style={{ color: "var(--color-gray-500)" }}>Cargando configuración...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {modules.map(mod => (
              <div
                key={mod.id}
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: isMobile ? "12px" : "1rem",
                  padding: isMobile ? "0.875rem" : "1rem",
                  background: "var(--color-gray-100)",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: isMobile ? "1rem" : "1.1rem", fontWeight: "600", color: "var(--color-gray-900)" }}>
                    {mod.name}
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--color-gray-500)" }}>
                    Identificador: {mod.slug}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    width: isMobile ? "100%" : undefined,
                    justifyContent: isMobile ? "space-between" : undefined,
                  }}
                >
                  {mod.is_active ? (
                    <span style={{ color: "#10B981", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.9rem" }}>
                      <CheckCircle size={16} /> Activo
                    </span>
                  ) : (
                    <span style={{ color: "#EF3340", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.9rem" }}>
                      <ShieldOff size={16} /> Inactivo
                    </span>
                  )}

                  <button
                    onClick={() => toggleModule(mod)}
                    style={{
                      background: mod.is_active ? "transparent" : "#10B981",
                      border: mod.is_active ? "1px solid #EF3340" : "none",
                      color: mod.is_active ? "#EF3340" : "#fff",
                      padding: isMobile ? "10px 16px" : "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      minHeight: "44px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {mod.is_active ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
