import React from "react";
import Link from "next/link";
import { ShieldAlert, Phone, ExternalLink } from "lucide-react";
import { MissingPerson } from "@/core/models/missing-person.interface";

interface DuplicateAlertProps {
  existingPerson: MissingPerson;
  similarity: number;
  onCancel: () => void;
  onProceed: () => void;
}

export default function DuplicateAlert({ existingPerson, similarity, onCancel, onProceed }: DuplicateAlertProps) {
  const percentage = Math.round(similarity * 100);

  return (
    <div style={{ background: "rgba(245,158,11,0.08)", border: "2px solid #F59E0B", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <ShieldAlert size={24} color="#F59E0B" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <h4 style={{ color: "#D97706", fontWeight: "700", fontSize: "1rem", marginBottom: "0.5rem" }}>
            Posible Registro Duplicado Detectado ({percentage}% de coincidencia)
          </h4>
          <p style={{ fontSize: "0.85rem", color: "var(--color-gray-800)", marginBottom: "1rem", lineHeight: "1.4" }}>
            El sistema detectó que ya existe una persona registrada con datos muy similares en nuestra base de datos.
            Por favor, revisa si se trata de la misma persona antes de continuar con un nuevo registro.
          </p>

          {/* Existing Person Card Summary */}
          <div style={{ background: "var(--color-white)", padding: "1rem", borderRadius: "8px", border: "1px solid #F3F4F6", display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
            {existingPerson.photo && (
              <img 
                src={existingPerson.photo} 
                alt={existingPerson.full_name} 
                style={{ width: "60px", height: "60px", borderRadius: "6px", objectFit: "cover" }} 
              />
            )}
            <div>
              <h5 style={{ fontWeight: "700", color: "var(--color-gray-900)" }}>{existingPerson.full_name}</h5>
              <p style={{ fontSize: "0.8rem", color: "var(--color-gray-600)" }}>
                Edad: {existingPerson.age} años | Estado: {existingPerson.state_ve}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--color-gray-600)", marginTop: "0.25rem" }}>
                Última ubicación: {existingPerson.last_known_location_description}
              </p>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <Link href={`/missing-people/${existingPerson.id}`} target="_blank" style={{ fontSize: "0.75rem", color: "var(--color-blue)", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  <span>Ver ficha existente</span>
                  <ExternalLink size={12} />
                </Link>
                <a href={existingPerson.reporter_whatsapp_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "#25D366", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  <Phone size={12} />
                  <span>Contactar reportante</span>
                </a>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button 
              onClick={onCancel}
              className="btn-primary" 
              style={{ background: "#F59E0B", color: "white", padding: "8px 16px", fontSize: "0.85rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
            >
              Sí, es la misma persona (Cancelar Registro)
            </button>
            <button 
              onClick={onProceed}
              style={{ background: "transparent", border: "1px solid var(--color-gray-600)", color: "var(--color-gray-700)", padding: "8px 16px", fontSize: "0.85rem", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
            >
              No, es una persona diferente (Continuar)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
