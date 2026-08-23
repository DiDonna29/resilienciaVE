import React, { useState } from "react";
import { X, Heart, ShieldAlert } from "lucide-react";
import missingPeopleService from "@/core/services/missing-people.service";

interface MarkAsFoundModalProps {
  personId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MarkAsFoundModal({ personId, onClose, onSuccess }: MarkAsFoundModalProps) {
  const [formData, setFormData] = useState({
    found_condition: "safe", // safe, injured, deceased, unknown
    found_location_type: "home", // hospital, shelter, risk_zone, home, other
    found_location_description: "",
    locator_phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await missingPeopleService.markAsFound(personId, {
        status: formData.found_condition === 'deceased' ? 'deceased' : 'found',
        found_condition: formData.found_condition as any,
        found_location_type: formData.found_location_type as any,
        found_location_description: formData.found_location_description,
        locator_phone: formData.locator_phone || undefined,
      });
      onSuccess();
    } catch (err: any) {
      console.error("Error marking person as found:", err);
      setError(
        err.response?.data?.detail || 
        "Error al actualizar el estado de localización. Intente de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="card card-glass" style={{ width: "100%", maxWidth: "450px", padding: "2rem", position: "relative" }}>
        
        <button 
          onClick={onClose}
          style={{ position: "absolute", top: "1rem", right: "1rem", background: "transparent", border: "none", cursor: "pointer", color: "var(--color-gray-600)" }}
        >
          <X size={24} />
        </button>

        <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--color-blue)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Heart size={20} color="var(--color-red)" />
          <span>Marcar como Localizado</span>
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--color-gray-600)", marginBottom: "1.5rem" }}>
          Confirma que has localizado a esta persona e ingresa los detalles actuales de su condición para actualizar a la comunidad.
        </p>

        {error && (
          <div style={{ background: "rgba(239,51,64,0.1)", border: "1px solid var(--color-red)", color: "var(--color-red)", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Estado de salud / Condición física</label>
            <select 
              name="found_condition"
              value={formData.found_condition}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
            >
              <option value="safe">Ileso / Sano y Salvo</option>
              <option value="injured">Herido (Requiere Atención Médica)</option>
              <option value="deceased">Fallecido</option>
              <option value="unknown">Desconocido</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Ubicación actual</label>
            <select 
              name="found_location_type"
              value={formData.found_location_type}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
            >
              <option value="home">Domicilio Particular</option>
              <option value="hospital">Hospital / Centro de Salud</option>
              <option value="shelter">Refugio o Centro de Acopio</option>
              <option value="risk_zone">Zona de Riesgo</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Detalles de la localización</label>
            <textarea 
              name="found_location_description"
              placeholder="Ej. Se encuentra estable en el hospital Clínico Universitario recibiendo atención."
              value={formData.found_location_description}
              onChange={handleChange}
              rows={3}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)", fontFamily: "inherit", fontSize: "0.9rem" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Tu número de contacto (Validador)</label>
            <input 
              type="tel"
              name="locator_phone"
              placeholder="04125072134"
              value={formData.locator_phone}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid var(--color-gray-600)", background: "transparent", cursor: "pointer", fontWeight: "600" }}
            >
              Cerrar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
              style={{ flex: 1, padding: "12px", border: "none", cursor: "pointer" }}
            >
              {loading ? "Actualizando..." : "Confirmar Localizado"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
