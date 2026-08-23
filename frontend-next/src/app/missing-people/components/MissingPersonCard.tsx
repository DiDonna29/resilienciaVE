import React from "react";
import Link from "next/link";
import { Phone, MapPin, Calendar, User, CheckCircle2, ChevronRight } from "lucide-react";
import { MissingPerson } from "@/core/models/missing-person.interface";

interface MissingPersonCardProps {
  person: MissingPerson;
}

export default function MissingPersonCard({ person }: MissingPersonCardProps) {
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
        return "Desaparecido";
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
        return "Herido";
      case "deceased":
        return "Fallecido";
      case "unknown":
      default:
        return "Desconocido";
    }
  };

  const formattedDate = new Date(person.created_at).toLocaleDateString();

  return (
    <div className="card card-glass" style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
      {/* Header photo or placeholder */}
      <div style={{ position: "relative", height: "200px", background: "var(--color-gray-200)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {person.photo ? (
          <img 
            src={person.photo} 
            alt={person.full_name} 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        ) : (
          <User size={64} style={{ color: "var(--color-gray-600)" }} />
        )}
        
        {/* Status Badge */}
        <span 
          style={{ 
            position: "absolute", 
            top: "12px", 
            right: "12px", 
            background: getStatusColor(person.status), 
            color: "white", 
            fontSize: "0.75rem", 
            fontWeight: "700", 
            padding: "4px 10px", 
            borderRadius: "20px",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          {getStatusLabel(person.status)}
        </span>
      </div>

      {/* Card Body */}
      <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <h4 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--color-gray-900)", marginBottom: "0.25rem" }}>
          {person.full_name}
        </h4>
        <p style={{ fontSize: "0.85rem", color: "var(--color-gray-600)", marginBottom: "0.75rem" }}>
          Edad: <strong>{person.age} años</strong> {person.cedula ? `| Cédula: ${person.cedula}` : ""}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem", color: "var(--color-gray-800)", flex: 1, marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <MapPin size={16} style={{ color: "var(--color-blue)", flexShrink: 0 }} />
            <span>Última ubicación: {person.state_ve} — {person.last_known_location_description}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Calendar size={16} style={{ color: "var(--color-blue)" }} />
            <span>Reportado: {formattedDate}</span>
          </div>
          {person.status === "found" && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "rgba(16,185,129,0.08)", padding: "0.4rem 0.6rem", borderRadius: "6px", color: "#10B981" }}>
              <CheckCircle2 size={16} />
              <span>Condición: <strong>{getConditionLabel(person.found_condition || "")}</strong></span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", gap: "0.75rem", borderTop: "1px solid var(--color-gray-200)", paddingTop: "1rem" }}>
          <Link href={`/missing-people/${person.id}`} style={{ flex: 1, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", border: "1px solid var(--color-blue)", color: "var(--color-blue)", padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "600", transition: "all 0.2s" }}>
            <span>Ver Ficha</span>
            <ChevronRight size={14} />
          </Link>
          
          {person.status === "missing" && (
            <a 
              href={person.reporter_whatsapp_link} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#25D366", color: "white", padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "600", textDecoration: "none", boxShadow: "0 4px 12px rgba(37,211,102,0.2)" }}
            >
              <Phone size={14} />
              <span>Contacto</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
