"use client";

import React, { useEffect, useState } from "react";
import adminService, { VerificationRequestAdmin } from "@/core/services/admin.service";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import Swal from "sweetalert2";

const ROLE_TRANSLATIONS: Record<string, string> = {
  health_worker: "Trabajador de Salud",
  shelter_manager: "Gestor de Refugio",
  org_donor: "Organización Donante"
};

export default function SuperAdminVerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequestAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await adminService.getVerificationRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudieron cargar las solicitudes", "error");
    } finally {
      setLoading(false);
    }
  }

  const reviewRequest = async (req: VerificationRequestAdmin, status: 'approved' | 'rejected') => {
    try {
      const { value: notes } = await Swal.fire({
        title: status === 'approved' ? '¿Aprobar solicitud?' : '¿Rechazar solicitud?',
        input: 'textarea',
        inputLabel: 'Notas del Administrador (opcional)',
        inputPlaceholder: 'Escribe el motivo...',
        showCancelButton: true,
        confirmButtonColor: status === 'approved' ? '#10B981' : '#EF3340',
        confirmButtonText: status === 'approved' ? 'Aprobar' : 'Rechazar'
      });

      if (notes !== undefined) {
        await adminService.reviewVerificationRequest(req.id, { status, admin_notes: notes });
        Swal.fire("Éxito", "La solicitud ha sido " + (status === 'approved' ? 'aprobada' : 'rechazada'), "success");
        loadRequests();
      }
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.detail || "Hubo un error", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return (
        <span style={{ color: "#F59E0B", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", fontSize: "0.82rem" }}>
          <Clock size={13} /> Pendiente
        </span>
      );
      case 'approved': return (
        <span style={{ color: "#10B981", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", fontSize: "0.82rem" }}>
          <CheckCircle size={13} /> Aprobada
        </span>
      );
      case 'rejected': return (
        <span style={{ color: "#EF3340", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", fontSize: "0.82rem" }}>
          <XCircle size={13} /> Rechazada
        </span>
      );
      default: return null;
    }
  };

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8000${url}`;
  };

  const filteredRequests = requests.filter(r => r.status === activeTab);

  return (
    <div>
      <h1
        style={{
          fontSize: isMobile ? "1.4rem" : "2rem",
          fontWeight: "800",
          color: "var(--color-gray-900)",
          marginBottom: "1.5rem",
        }}
      >
        Solicitudes de Verificación
      </h1>

      {/* Tabs — scrollable on mobile */}
      <div
        style={{
          display: "flex",
          gap: "0",
          marginBottom: "1.5rem",
          borderBottom: "2px solid var(--color-gray-200)",
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {(['pending', 'approved', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "transparent",
              border: "none",
              padding: isMobile ? "10px 14px" : "10px 16px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: isMobile ? "0.8rem" : "0.9rem",
              color: activeTab === tab ? "var(--color-blue)" : "var(--color-gray-500)",
              borderBottom: activeTab === tab ? "3px solid var(--color-blue)" : "3px solid transparent",
              marginBottom: "-2px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {tab === 'pending' ? 'Pendientes' : tab === 'approved' ? 'Aprobadas' : 'Rechazadas'}
            <span
              style={{
                marginLeft: "6px",
                background: "var(--color-gray-200)",
                color: "var(--color-gray-700)",
                padding: "2px 7px",
                borderRadius: "12px",
                fontSize: "0.72rem",
              }}
            >
              {requests.filter(r => r.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards grid — 1 col on mobile, auto-fill on desktop */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
          gap: isMobile ? "1rem" : "1.5rem",
        }}
      >
        {loading ? (
          <p style={{ color: "var(--color-gray-500)", padding: "1rem" }}>Cargando solicitudes...</p>
        ) : filteredRequests.length === 0 ? (
          <p style={{ color: "var(--color-gray-500)", padding: "1rem" }}>No hay solicitudes en esta categoría.</p>
        ) : (
          filteredRequests.map(r => (
            <div
              key={r.id}
              className="card card-glass"
              style={{
                padding: isMobile ? "1rem" : "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "var(--color-gray-900)",
                      margin: 0,
                      wordBreak: "break-all",
                    }}
                  >
                    ID: {r.user.split('-')[0]}...
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--color-gray-600)" }}>
                    Rol: <strong>{ROLE_TRANSLATIONS[r.role_requested] || r.role_requested}</strong>
                  </p>
                </div>
                {getStatusBadge(r.status)}
              </div>

              {/* Document preview */}
              <div
                style={{
                  background: "var(--color-gray-100)",
                  padding: "10px",
                  borderRadius: "8px",
                  height: "130px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {r.document ? (
                  <a
                    href={getMediaUrl(r.document)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      textDecoration: "none",
                      color: "var(--color-blue)",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                    }}
                  >
                    <Eye size={24} />
                    Ver Documento
                  </a>
                ) : (
                  <span style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>Sin documento</span>
                )}
              </div>

              {/* Date */}
              <div style={{ fontSize: "0.78rem", color: "var(--color-gray-500)" }}>
                Enviada: {new Date(r.created_at).toLocaleString()}
              </div>

              {/* Rejection notes */}
              {r.status === 'rejected' && r.admin_notes && (
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "#EF3340",
                    background: "rgba(239, 51, 64, 0.1)",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <strong>Motivo de rechazo:</strong> {r.admin_notes}
                </div>
              )}

              {/* Action buttons */}
              {r.status === 'pending' && (
                <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                  <button
                    onClick={() => reviewRequest(r, 'approved')}
                    style={{
                      flex: 1,
                      background: "#10B981",
                      color: "#fff",
                      border: "none",
                      padding: "10px",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: "pointer",
                      minHeight: "44px",
                      fontSize: "0.9rem",
                    }}
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => reviewRequest(r, 'rejected')}
                    style={{
                      flex: 1,
                      background: "#EF3340",
                      color: "#fff",
                      border: "none",
                      padding: "10px",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: "pointer",
                      minHeight: "44px",
                      fontSize: "0.9rem",
                    }}
                  >
                    Rechazar
                  </button>
                </div>
              )}
              {r.status === 'rejected' && (
                <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                  <button
                    onClick={() => reviewRequest(r, 'approved')}
                    style={{
                      flex: 1,
                      background: "#10B981",
                      color: "#fff",
                      border: "none",
                      padding: "10px",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: "pointer",
                      minHeight: "44px",
                      fontSize: "0.9rem",
                    }}
                  >
                    Revisar y Aprobar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
