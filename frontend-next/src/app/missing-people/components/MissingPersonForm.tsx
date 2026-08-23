import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { X, Image as ImageIcon, MapPin, ShieldAlert } from "lucide-react";
import missingPeopleService from "@/core/services/missing-people.service";
import DuplicateAlert from "./DuplicateAlert";
import { MissingPerson } from "@/core/models/missing-person.interface";

// Map component dynamically loaded
const MapViewer = dynamic(
  () => import("@/shared/components/map-viewer/MapViewer"),
  { ssr: false, loading: () => <div style={{ height: "200px", background: "var(--color-gray-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando mapa...</div> }
);

interface MissingPersonFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function MissingPersonForm({ onClose, onSuccess }: MissingPersonFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    cedula: "",
    last_known_location_description: "",
    state_ve: "Distrito Capital",
    latitude: 10.4806, // Default Caracas
    longitude: -66.9036,
    reporter_phone: "",
  });

  const [photoFile, setPhotoFile] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate states
  const [duplicateCheckPassed, setDuplicateCheckPassed] = useState(false);
  const [duplicateFound, setDuplicateFound] = useState<boolean>(false);
  const [existingPerson, setExistingPerson] = useState<MissingPerson | null>(null);
  const [similarityScore, setSimilarityScore] = useState<number>(0);

  // Venezuelan States list from base settings
  const states = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
    'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
    'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta',
    'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
  ];

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Helper to compress image to webp <= 150kb
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Resize if too big
          const maxResolution = 1000;
          if (width > maxResolution || height > maxResolution) {
            if (width > height) {
              height = Math.round((height * maxResolution) / width);
              width = maxResolution;
            } else {
              width = Math.round((width * maxResolution) / height);
              height = maxResolution;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to webp with compression quality
          let quality = 0.8;
          const convert = () => {
            canvas.toBlob((blob) => {
              if (blob) {
                if (blob.size > 150 * 1024 && quality > 0.2) {
                  quality -= 0.1;
                  convert();
                } else {
                  resolve(blob);
                }
              } else {
                reject(new Error("Error converting to blob"));
              }
            }, "image/webp", quality);
          };
          convert();
        };
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      const compressed = await compressImage(file);
      setPhotoFile(compressed);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Image compression error:", err);
      setError("Error al procesar y comprimir la imagen.");
    } finally {
      setLoading(false);
    }
  };

  // Submit flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number
    if (!formData.reporter_phone) {
      setError("Por favor ingrese su número de teléfono.");
      return;
    }

    // Validate Cédula format if provided
    const cedulaRegex = /^[VvEe]-\d{6,9}$/;
    if (formData.cedula && !cedulaRegex.test(formData.cedula)) {
      setError("Cédula inválida. Debe tener formato V-12345678 o E-12345678 (incluya el guion).");
      return;
    }

    setLoading(true);

    try {
      // 1. Perform duplicate check first if not passed
      if (!duplicateCheckPassed) {
        const dupCheck = await missingPeopleService.checkDuplicate(
          formData.full_name,
          parseInt(formData.age) || 0,
          formData.cedula || undefined
        );

        if (dupCheck.is_duplicate) {
          setDuplicateFound(true);
          setExistingPerson(dupCheck.existing_person as any);
          setSimilarityScore(dupCheck.similarity);
          setLoading(false);
          return;
        }
      }

      // 2. Submit form if no duplicates or bypass proceed
      const submitData = new FormData();
      submitData.append("full_name", formData.full_name);
      submitData.append("age", formData.age);
      if (formData.cedula) submitData.append("cedula", formData.cedula);
      submitData.append("last_known_location_description", formData.last_known_location_description);
      submitData.append("state_ve", formData.state_ve);
      submitData.append("latitude", formData.latitude.toString());
      submitData.append("longitude", formData.longitude.toString());
      submitData.append("reporter_phone", formData.reporter_phone);
      
      if (photoFile) {
        submitData.append("photo", photoFile, "photo.webp");
      }

      await missingPeopleService.create(submitData);
      onSuccess();
    } catch (err: any) {
      console.error("Error creating report:", err);
      setError(err.response?.data?.detail || "Error al registrar el reporte. Por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", overflowY: "auto" }}>
      <div className="card card-glass" style={{ width: "100%", maxWidth: "600px", padding: "2rem", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
        
        <button 
          onClick={onClose}
          style={{ position: "absolute", top: "1rem", right: "1rem", background: "transparent", border: "none", cursor: "pointer", color: "var(--color-gray-600)" }}
        >
          <X size={24} />
        </button>

        <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-blue)", marginBottom: "1.5rem" }}>
          Reportar Persona Desaparecida
        </h3>

        {error && (
          <div style={{ background: "rgba(239,51,64,0.1)", border: "1px solid var(--color-red)", color: "var(--color-red)", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {duplicateFound && existingPerson && (
          <DuplicateAlert 
            existingPerson={existingPerson}
            similarity={similarityScore}
            onCancel={onClose}
            onProceed={() => {
              setDuplicateFound(false);
              setDuplicateCheckPassed(true);
              // Wait for state updates, then trigger submission in next render tick
              setTimeout(() => {
                const btn = document.getElementById("submit-btn");
                btn?.click();
              }, 100);
            }}
          />
        )}

        {!duplicateFound && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* Image Upload Area with pre-compression indicator */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Foto de Referencia (Se comprimirá a WebP &lt; 150KB)</label>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "8px", background: "var(--color-gray-100)", border: "1px solid var(--color-gray-300)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <ImageIcon size={32} style={{ color: "var(--color-gray-600)" }} />
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ fontSize: "0.85rem" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombre Completo</label>
                <input 
                  type="text" 
                  name="full_name"
                  placeholder="Juan Carlos Pérez"
                  value={formData.full_name}
                  onChange={handleTextChange}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Edad (Años)</label>
                <input 
                  type="number" 
                  name="age"
                  placeholder="34"
                  value={formData.age}
                  onChange={handleTextChange}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Cédula de Identidad (Opcional)</label>
                <input 
                  type="text" 
                  name="cedula"
                  placeholder="V-12345678"
                  value={formData.cedula}
                  onChange={handleTextChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Teléfono del Reportante (WhatsApp)</label>
                <input 
                  type="tel" 
                  name="reporter_phone"
                  placeholder="04125072134"
                  value={formData.reporter_phone}
                  onChange={handleTextChange}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Estado</label>
                <select 
                  name="state_ve"
                  value={formData.state_ve}
                  onChange={handleTextChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
                >
                  {states.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Zona aproximada de desaparición</label>
                <input 
                  type="text" 
                  name="last_known_location_description"
                  placeholder="Ej. Cerca de la plaza Bolívar, sector Chacao"
                  value={formData.last_known_location_description}
                  onChange={handleTextChange}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-300)" }}
                />
              </div>
            </div>

            {/* Map Picker */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <MapPin size={16} color="var(--color-blue)" />
                <span>Geolocalización en mapa (Haz clic para marcar el punto)</span>
              </label>
              <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid var(--color-gray-300)" }}>
                <MapViewer 
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  zoom={12}
                  markers={[{ lat: formData.latitude, lng: formData.longitude, popup: "Última ubicación conocida" }]}
                  height="200px"
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--color-gray-600)" }}>
                <span>Lat: {formData.latitude.toFixed(6)}</span>
                <span>Lon: {formData.longitude.toFixed(6)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button 
                type="button" 
                onClick={onClose}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid var(--color-gray-600)", background: "transparent", cursor: "pointer", fontWeight: "600" }}
              >
                Cancelar
              </button>
              <button 
                id="submit-btn"
                type="submit" 
                disabled={loading}
                className="btn-primary"
                style={{ flex: 1, padding: "12px", border: "none", cursor: "pointer" }}
              >
                {loading ? "Registrando..." : "Guardar Reporte"}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
