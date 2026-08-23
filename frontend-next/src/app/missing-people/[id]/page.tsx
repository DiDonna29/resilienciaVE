"use client";

import React, { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, MapPin, Calendar, User, Phone, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import missingPeopleService from "@/core/services/missing-people.service";
import { MissingPerson } from "@/core/models/missing-person.interface";
import { useAuthStore } from "@/core/store/auth.store";
import MarkAsFoundModal from "../components/MarkAsFoundModal";
import { formatVE } from "@/core/utils/date";

// Load MapViewer dynamically to prevent SSR issues
const MapViewer = dynamic(
  () => import("@/shared/components/map-viewer/MapViewer"),
  { ssr: false, loading: () => <div style={{ height: "300px", background: "var(--color-gray-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando mapa de localización...</div> }
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MissingPersonDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { isAuthenticated } = useAuthStore();
  const [person, setPerson] = useState<MissingPerson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocateModal, setShowLocateModal] = useState<boolean>(false);

  const loadPerson = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await missingPeopleService.getDetail(id);
      setPerson(data);
    } catch (err) {
      console.error("Error loading missing person detail:", err);
      setError("No se pudo cargar la ficha de la persona. Verifique el enlace o intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerson();
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "5rem" }}>Cargando detalles de la persona...</div>;
  }

  if (error || !person) {
    return (
      <div className="container" style={{ maxWidth: "600px", margin: "4rem auto", padding: "0 1rem", textAlign: "center" }}>
        <div className="card card-glass" style={{ padding: "3rem" }}>
          <AlertTriangle size={48} color="var(--color-red)" style={{ margin: "0 auto 1.5rem" }} />
          <h3 style={{ fontWeight: "700" }}>Error al cargar</h3>
          <p style={{ color: "var(--color-gray-600)", marginTop: "0.5rem" }}>{error || "Ficha no encontrada"}</p>
          <Link href="/missing-people" className="btn-primary" style={{ display: "inline-block", marginTop: "2rem", textDecoration: "none" }}>
            Volver a la Búsqueda
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "missing":
        return "var(--color-red)";
      case "found":
        return "#10B981";
      case "deceased":
        return "#1F2937";
      default:
        return "#6C757D";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "missing":
        return "Desaparecido / Por localizar";
      case "found":
        return "Localizado";
      case "deceased":
        return "Fallecido";
      default:
        return status;
    }
  };

  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case "safe":
        return "Ileso / Sano";
      case "injured":
        return "Herido (Bajo atención médica)";
      case "deceased":
        return "Fallecido";
      case "unknown":
      default:
        return "Desconocido";
    }
  };

  const getLocTypeLabel = (loc: string) => {
    switch (loc) {
      case "hospital":
        return "Hospital / Clínica";
      case "shelter":
        return "Refugio / Albergue";
      case "risk_zone":
        return "Zona de Riesgo / Afectada";
      case "home":
        return "Domicilio Particular";
      case "other":
      default:
        return "Otro";
    }
  };

  return (
    <div className="container" style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1rem" }}>
      
      <Link href="/missing-people" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--color-blue)", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600", marginBottom: "2rem" }}>
        <ChevronLeft size={18} />
        <span>Volver a la Búsqueda</span>
      </Link>

      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* Photo Reference and Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card card-glass" style={{ overflow: "hidden", borderRadius: "16px" }}>
            <div style={{ position: "relative", height: "300px", background: "var(--color-gray-200)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {person.photo ? (
                <img 
                  src={person.photo} 
                  alt={person.full_name} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              ) : (
                <User size={96} style={{ color: "var(--color-gray-600)" }} />
              )}
              
              <span 
                style={{ 
                  position: "absolute", 
                  bottom: "12px", 
                  left: "12px", 
                  background: getStatusColor(person.status), 
                  color: "white", 
                  fontSize: "0.8rem", 
                  fontWeight: "700", 
                  padding: "6px 12px", 
                  borderRadius: "20px",
                  boxShadow: "var(--shadow-md)"
                }}
              >
                {getStatusLabel(person.status)}
              </span>
            </div>
          </div>

          {/* Action to Mark as Located */}
          {person.status === "missing" && (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  window.location.href = "/auth/login";
                } else {
                  setShowLocateModal(true);
                }
              }}
              className="btn-primary"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "14px" }}
            >
              <CheckCircle2 size={18} />
              <span>Marcar como Localizado</span>
            </button>
          )}
        </div>

        {/* Detailed Information */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className="card card-glass" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: "900", color: "var(--color-blue)", marginBottom: "0.5rem" }}>
              {person.full_name}
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--color-gray-700)", marginBottom: "1.5rem" }}>
              Edad: <strong>{person.age} años</strong> {person.cedula ? `| Cédula: ${person.cedula}` : ""}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", borderTop: "1px solid var(--color-gray-200)", paddingTop: "1.5rem" }}>
              
              {/* Last known location */}
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <MapPin size={20} color="var(--color-blue)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-gray-600)", fontWeight: "600" }}>Última Ubicación Conocida</span>
                  <p style={{ fontSize: "0.95rem", color: "var(--color-gray-900)", marginTop: "0.15rem" }}>
                    {person.state_ve} — {person.last_known_location_description}
                  </p>
                </div>
              </div>

              {/* Reported Date */}
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <Calendar size={20} color="var(--color-blue)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-gray-600)", fontWeight: "600" }}>Fecha de Registro del Reporte</span>
                  <p style={{ fontSize: "0.95rem", color: "var(--color-gray-900)", marginTop: "0.15rem" }}>
                    {formatVE(person.created_at)}
                  </p>
                </div>
              </div>

              {/* Reporter Info */}
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <User size={20} color="var(--color-blue)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-gray-600)", fontWeight: "600" }}>Reportado por (Ciudadano)</span>
                  <p style={{ fontSize: "0.95rem", color: "var(--color-gray-900)", marginTop: "0.15rem" }}>
                    {person.reported_by_name}
                  </p>
                  
                  {person.status === "missing" && (
                    <a 
                      href={person.reporter_whatsapp_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#25D366", color: "white", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", textDecoration: "none", marginTop: "0.5rem", boxShadow: "0 4px 10px rgba(37,211,102,0.15)" }}
                    >
                      <Phone size={14} />
                      <span>Contactar vía WhatsApp ({person.reporter_phone})</span>
                    </a>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Localization Details card */}
          {person.status === "found" && (
            <div className="card card-glass" style={{ padding: "2rem", borderLeft: "6px solid #10B981", background: "rgba(16,185,129,0.03)" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#10B981", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={22} />
                <span>Detalles de Localización</span>
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-gray-600)" }}>Condición física</span>
                  <p style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--color-gray-900)" }}>
                    {getConditionLabel(person.found_condition || "")}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-gray-600)" }}>Ubicación actual de traslado</span>
                  <p style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--color-gray-900)" }}>
                    {getLocTypeLabel(person.found_location_type || "")}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-gray-600)" }}>Detalles aportados</span>
                  <p style={{ fontSize: "0.95rem", color: "var(--color-gray-800)", lineHeight: "1.4", fontStyle: "italic", background: "var(--color-white)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-gray-200)", marginTop: "0.25rem" }}>
                    "{person.found_location_description || "Sin descripción aportada."}"
                  </p>
                </div>

                <div style={{ display: "flex", gap: "1.5rem", borderTop: "1px solid rgba(16,185,129,0.2)", paddingTop: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-gray-600)" }}>Localizado por</span>
                    <p style={{ fontSize: "0.9rem", fontWeight: "600" }}>{person.located_by_name || "Comunidad"}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-gray-600)" }}>Fecha de localización</span>
                    <p style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                      {formatVE(person.located_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Map Viewer */}
          {person.last_known_latitude && person.last_known_longitude && (
            <div className="card card-glass" style={{ padding: "1.25rem" }}>
              <h4 style={{ fontWeight: "700", marginBottom: "0.75rem" }}>Ubicación Geográfica Estimada</h4>
              <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-gray-300)" }}>
                <MapViewer 
                  latitude={Number(person.last_known_latitude)}
                  longitude={Number(person.last_known_longitude)}
                  zoom={14}
                  markers={[{ lat: Number(person.last_known_latitude), lng: Number(person.last_known_longitude), popup: `Última ubicación de ${person.full_name}` }]}
                  height="300px"
                />
              </div>
            </div>
          )}

        </div>

      </section>

      {/* Locate Modal */}
      {showLocateModal && (
        <MarkAsFoundModal 
          personId={person.id}
          onClose={() => setShowLocateModal(false)}
          onSuccess={() => {
            setShowLocateModal(false);
            loadPerson();
          }}
        />
      )}

    </div>
  );
}
