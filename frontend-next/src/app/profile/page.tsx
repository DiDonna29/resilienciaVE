"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Shield,
  LogOut,
  CheckCircle,
  Calendar,
  Edit3,
  Save,
  X,
  AlertCircle,
  Settings,
} from "lucide-react";
import { useAuth } from "@/shared/hooks/useAuth";
import authService from "@/core/services/auth.service";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// ─── Validation helpers ─────────────────────────────────────────────────────
const CEDULA_REGEX = /^[VvEeJjGgPpCc]-\d{6,9}(?:-\d)?$/;
const PHONE_REGEX = /^(0412|0414|0424|0416|0426|0422)\d{7}$|^\+?58(412|414|424|416|426|422)\d{7}$/;

interface FormState {
  first_name: string;
  last_name: string;
  phone_number: string;
  cedula: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  cedula?: string;
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.first_name.trim()) {
    errors.first_name = "El nombre es obligatorio.";
  } else if (form.first_name.trim().length < 2) {
    errors.first_name = "El nombre debe tener al menos 2 caracteres.";
  }

  if (!form.last_name.trim()) {
    errors.last_name = "El apellido es obligatorio.";
  } else if (form.last_name.trim().length < 2) {
    errors.last_name = "El apellido debe tener al menos 2 caracteres.";
  }

  if (form.phone_number && !PHONE_REGEX.test(form.phone_number.replace(/\s/g, ""))) {
    errors.phone_number = "Formato inválido. Ej: 04121234567 o +584121234567";
  }

  if (form.cedula && !CEDULA_REGEX.test(form.cedula)) {
    errors.cedula = "Formato inválido. Ej: V-12345678, E-12345678, J-12345678-9";
  }

  return errors;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({ first_name: "", last_name: "", phone_number: "", cedula: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  // Verification request state
  const [showVerForm, setShowVerForm] = useState(false);
  const [verRole, setVerRole] = useState("health_worker");
  const [verFile, setVerFile] = useState<File | null>(null);
  const [verStatus, setVerStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verFile) {
      MySwal.fire({ icon: "error", title: "Error", text: "Debe adjuntar un documento o credencial." });
      return;
    }
    setVerStatus("sending");
    try {
      const formData = new FormData();
      formData.append("role_requested", verRole);
      formData.append("document", verFile);
      await authService.submitVerificationRequest(formData);
      setVerStatus("success");
      MySwal.fire({ icon: "success", title: "¡Solicitud enviada!", text: "Su solicitud de verificación ha sido recibida y está en revisión." });
      setShowVerForm(false);
      setVerStatus("idle");
      setVerFile(null);
    } catch (err: any) {
      setVerStatus("error");
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Error al enviar la solicitud.";
      MySwal.fire({ icon: "error", title: "Error", text: msg });
    }
  };

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      refreshUser();
    }
  }, [isAuthenticated, refreshUser]);

  useEffect(() => {
    if (mounted && !isAuthenticated) router.push("/auth/login");
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        cedula: user.cedula || "",
      });
    }
  }, [user]);

  if (!mounted || !user) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid var(--color-gray-200)", borderTop: "4px solid var(--color-blue)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    // Clear individual field error on change
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleSave = async () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await authService.updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_number: form.phone_number.trim() || undefined,
        cedula: form.cedula.trim() || undefined,
      });
      await refreshUser();
      setEditing(false);
      setErrors({});
      MySwal.fire({ icon: "success", title: "¡Guardado!", text: "Perfil actualizado exitosamente.", timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === "object" && !data.detail) {
        // Field-level backend errors
        const mapped: FormErrors = {};
        if (data.first_name) mapped.first_name = Array.isArray(data.first_name) ? data.first_name[0] : data.first_name;
        if (data.last_name) mapped.last_name = Array.isArray(data.last_name) ? data.last_name[0] : data.last_name;
        if (data.phone_number) mapped.phone_number = Array.isArray(data.phone_number) ? data.phone_number[0] : data.phone_number;
        if (data.cedula) mapped.cedula = Array.isArray(data.cedula) ? data.cedula[0] : data.cedula;
        setErrors(mapped);
      } else {
        MySwal.fire({ icon: "error", title: "Error", text: data?.detail || "Error al guardar los cambios. Intente de nuevo." });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm({ first_name: user.first_name || "", last_name: user.last_name || "", phone_number: user.phone_number || "", cedula: user.cedula || "" });
    }
    setErrors({});
    setEditing(false);
  };

  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "?";

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" });

  const BADGES = [
    { key: "is_verified_health_worker" as const, label: "Trabajador de Salud", emoji: "🏥" },
    { key: "is_verified_shelter_manager" as const, label: "Gestor de Refugio", emoji: "🏠" },
    { key: "is_verified_org_donor" as const, label: "Donante Verificado", emoji: "💛" },
    { key: "is_verified_web_collaborator" as const, label: "Colaborador Web", emoji: "💻" },
  ];

  const hasAnyBadge = BADGES.some(b => user[b.key]);

  return (
    <div style={{ minHeight: "80vh", padding: "2rem 1rem", maxWidth: "740px", margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Header card ── */}
        <div className="card" style={{ padding: "2rem", background: "linear-gradient(135deg, var(--color-blue) 0%, #1a56db 100%)", color: "#fff", borderRadius: "16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flexWrap: "wrap" }}>

            {/* Avatar */}
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "3px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 800, flexShrink: 0, backdropFilter: "blur(6px)" }}>
              {initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, wordBreak: "break-word" }}>
                  {user.first_name} {user.last_name}
                </h1>
                {user.role === "SUPERADMIN" && (
                  <span style={{ background: "var(--color-yellow)", color: "#000", fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", display: "inline-flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                    <Shield size={10} /> SuperAdmin
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.875rem", opacity: 0.82, marginTop: "3px", wordBreak: "break-all" }}>{user.email}</div>
              {user.date_joined && (
                <div style={{ fontSize: "0.75rem", opacity: 0.65, marginTop: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Calendar size={12} /> Miembro desde {formatDate(user.date_joined)}
                </div>
              )}

              {/* Auth method chips */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                {user.auth_provider === "google" || user.google_id ? (
                  <span style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", padding: "3px 10px", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google
                  </span>
                ) : null}
                {user.auth_provider === "manual" ? (
                  <span style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", padding: "3px 10px", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 600 }}>
                    👤 Registro manual
                  </span>
                ) : null}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
              {!editing && (
                <button onClick={() => setEditing(true)} style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.35)", color: "#fff", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.83rem", fontWeight: 600 }}>
                  <Edit3 size={14} /> Editar perfil
                </button>
              )}
              <button onClick={logout} style={{ background: "rgba(239,51,64,0.22)", border: "1px solid rgba(239,51,64,0.45)", color: "#fff", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.83rem", fontWeight: 600 }}>
                <LogOut size={14} /> Cerrar Sesión
              </button>
              {['SUPERADMIN', 'ADMIN'].includes(user.role) && (
                <button onClick={() => router.push('/superadmin')} style={{ background: "rgba(255,255,255,0.95)", color: "var(--color-blue)", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.83rem", fontWeight: 700, marginTop: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                  <Settings size={14} /> Panel Admin
                </button>
              )}
            </div>
          </div>

          {/* Verification badges */}
          {hasAnyBadge && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
              {BADGES.filter(b => user[b.key]).map(b => (
                <span key={b.key} style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.28)", padding: "4px 12px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 600 }}>
                  {b.emoji} {b.label}
                </span>
              ))}
            </div>
          )}
        </div>



        {/* ── Personal info card ── */}
        <div className="card" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-gray-900)", margin: 0 }}>
              Información Personal
            </h2>
            {editing ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleCancel} style={{ background: "var(--color-gray-100)", border: "none", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.83rem", fontWeight: 600, color: "var(--color-gray-700)" }}>
                  <X size={14} /> Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} style={{ background: "var(--color-blue)", border: "none", color: "#fff", padding: "7px 16px", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.83rem", fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                  <Save size={14} /> {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} style={{ background: "none", border: "1px solid var(--color-gray-300)", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.83rem", fontWeight: 600, color: "var(--color-gray-700)" }}>
                <Edit3 size={14} /> Editar
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1.25rem" }}>
            <Field label="Nombres *" icon={<User size={15} />} editing={editing}
              value={form.first_name} readValue={user.first_name || "—"}
              onChange={(v: string) => handleFieldChange("first_name", v)}
              error={errors.first_name} placeholder="Juan" />

            <Field label="Apellidos *" icon={<User size={15} />} editing={editing}
              value={form.last_name} readValue={user.last_name || "—"}
              onChange={(v: string) => handleFieldChange("last_name", v)}
              error={errors.last_name} placeholder="Pérez" />

            <Field label="Correo electrónico" icon={<Mail size={15} />} editing={false}
              value={user.email} readValue={user.email}
              onChange={() => {}} hint="No editable" />

            <CompositePhoneField label="Teléfono" icon={<Phone size={15} />} editing={editing}
              value={form.phone_number} readValue={user.phone_number || "—"}
              onChange={(v: string) => handleFieldChange("phone_number", v)}
              error={errors.phone_number} placeholder="1234567" />

            <CompositeCedulaField label="Cédula / RIF" icon={<CreditCard size={15} />} editing={editing}
              value={form.cedula} readValue={user.cedula || "—"}
              onChange={(v: string) => handleFieldChange("cedula", v)}
              error={errors.cedula} placeholder="12345678" />

            {/* Auth provider — shows BOTH if linked */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={labelStyle}>Método de acceso</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(user.auth_provider === "google" || user.google_id) && (
                  <div style={chipStyle}>
                    <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-gray-800)" }}>Cuenta de Google vinculada</span>
                  </div>
                )}
                {user.auth_provider === "manual" && (
                  <div style={chipStyle}>
                    <span style={{ fontSize: "15px" }}>👤</span>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-gray-800)" }}>Registro manual con correo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Role & permissions ── */}
        <div className="card" style={{ padding: "1.75rem" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "1.25rem" }}>
            Rol y Verificaciones
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "1rem" }}>
            {/* Role */}
            <div style={{ padding: "1rem", borderRadius: "10px", background: user.role === "SUPERADMIN" ? "rgba(0,61,165,0.08)" : "var(--color-gray-50)", border: `1.5px solid ${user.role === "SUPERADMIN" ? "var(--color-blue)" : "var(--color-gray-200)"}` }}>
              <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rol</div>
              <div style={{ fontWeight: 700, color: user.role === "SUPERADMIN" ? "var(--color-blue)" : "var(--color-gray-800)", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem" }}>
                {user.role === "SUPERADMIN" ? <><Shield size={14} /> SuperAdmin</> : <><User size={14} /> Ciudadano</>}
              </div>
            </div>

            {/* Verification badges */}
            {BADGES.map(b => (
              <div key={b.key} style={{ padding: "1rem", borderRadius: "10px", background: user[b.key] ? "rgba(16,185,129,0.08)" : "var(--color-gray-50)", border: `1.5px solid ${user[b.key] ? "#10B981" : "var(--color-gray-200)"}` }}>
                <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {b.emoji} {b.label}
                </div>
                <div style={{ fontWeight: 700, color: user[b.key] ? "#10B981" : "var(--color-gray-400)", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem" }}>
                  {user[b.key] ? <><CheckCircle size={14} /> Verificado</> : "Sin verificar"}
                </div>
              </div>
            ))}
          </div>

          {/* Verification Request Form */}
          <div style={{ marginTop: "1.5rem" }}>
            {!showVerForm && verStatus !== "success" ? (
              <button 
                onClick={() => setShowVerForm(true)}
                style={{
                  background: "var(--color-blue)", color: "#fff", border: "none", padding: "8px 16px",
                  borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer"
                }}>
                Solicitar Verificación Especial
              </button>
            ) : (
              <div style={{ padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-gray-200)", background: "var(--color-white)" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-gray-900)" }}>Solicitar Verificación</h3>
                {verStatus === "success" ? (
                  <div style={{ color: "#10B981", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                    <CheckCircle size={18} /> ¡Solicitud enviada correctamente! La revisaremos pronto.
                  </div>
                ) : (
                  <form onSubmit={handleVerificationSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={labelStyle}>Rol Solicitado</label>
                      <select 
                        value={verRole} 
                        onChange={e => setVerRole(e.target.value)}
                        style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-gray-200)", outline: "none", fontSize: "0.9rem" }}
                      >
                        <option value="health_worker">Trabajador de Salud</option>
                        <option value="shelter_manager">Gestor de Refugio</option>
                        <option value="org_donor">Organización Donante</option>
                        <option value="web_collaborator">Colaborador Web</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={labelStyle}>Documento / Credencial (Imagen o PDF)</label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={e => setVerFile(e.target.files?.[0] || null)}
                        style={{ fontSize: "0.9rem" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                      <button 
                        type="button" 
                        onClick={() => setShowVerForm(false)}
                        style={{ background: "transparent", color: "var(--color-gray-600)", border: "1px solid var(--color-gray-300)", padding: "8px 16px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        disabled={verStatus === "sending"}
                        style={{ background: "var(--color-blue)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: verStatus === "sending" ? 0.7 : 1 }}>
                        {verStatus === "sending" ? "Enviando..." : "Enviar Solicitud"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "var(--color-gray-500)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const chipStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "9px 13px",
  background: "var(--color-gray-50)",
  borderRadius: "8px",
  border: "1px solid var(--color-gray-200)",
};

// ─── Reusable Field ───────────────────────────────────────────────────────────
function Field({
  label, icon, editing, value, readValue, onChange, placeholder, hint, error,
}: {
  label: string;
  icon: React.ReactNode;
  editing: boolean;
  value: string;
  readValue: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={labelStyle}>{label}</label>
      {editing ? (
        <>
          <div style={{ position: "relative" }}>
            <input
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                borderRadius: "8px",
                border: `1.5px solid ${error ? "var(--color-red)" : "var(--color-blue)"}`,
                fontSize: "0.9rem",
                outline: "none",
                boxSizing: "border-box",
                background: error ? "rgba(239,51,64,0.04)" : "var(--color-white)",
              }}
            />
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: error ? "var(--color-red)" : "var(--color-blue)" }}>
              {icon}
            </span>
          </div>
          {error && (
            <div style={{ fontSize: "0.75rem", color: "var(--color-red)", display: "flex", alignItems: "center", gap: "4px" }}>
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 13px", background: "var(--color-gray-50)", borderRadius: "8px", border: "1px solid var(--color-gray-200)" }}>
          <span style={{ color: "var(--color-gray-400)", flexShrink: 0 }}>{icon}</span>
          <span style={{ fontSize: "0.875rem", color: readValue === "—" ? "var(--color-gray-400)" : "var(--color-gray-800)", fontWeight: 500, wordBreak: "break-all" }}>
            {readValue}
          </span>
          {hint && <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--color-gray-400)", flexShrink: 0 }}>{hint}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Composite Input Components ───────────────────────────────────────────────

function CompositePhoneField({ label, icon, editing, value, readValue, onChange, placeholder, error }: any) {
  // Parse value to split prefix and number
  let prefix = "0412";
  let num = "";
  if (value) {
    const cleanValue = value.replace(/\s/g, "");
    if (cleanValue.startsWith("+58")) {
      prefix = "+58" + cleanValue.substring(3, 6);
      num = cleanValue.substring(6);
    } else if (cleanValue.length >= 4) {
      prefix = cleanValue.substring(0, 4);
      num = cleanValue.substring(4);
    } else {
      num = cleanValue;
    }
  }

  const PREFIXES = ["0412", "0414", "0424", "0416", "0426", "0422"];
  if (!PREFIXES.includes(prefix)) prefix = "0412";

  const handleChange = (newPrefix: string, newNum: string) => {
    onChange(newPrefix + newNum);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={labelStyle}>{label}</label>
      {editing ? (
        <>
          <div style={{ display: "flex", gap: "8px", position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: error ? "var(--color-red)" : "var(--color-blue)", zIndex: 2 }}>
              {icon}
            </span>
            <select
              value={prefix}
              onChange={(e) => handleChange(e.target.value, num)}
              style={{
                padding: "10px 8px 10px 32px",
                borderRadius: "8px",
                border: `1.5px solid ${error ? "var(--color-red)" : "var(--color-blue)"}`,
                fontSize: "0.9rem",
                outline: "none",
                background: error ? "rgba(239,51,64,0.04)" : "var(--color-white)",
                cursor: "pointer",
              }}
            >
              {PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              value={num}
              onChange={(e) => handleChange(prefix, e.target.value)}
              placeholder={placeholder}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "8px",
                border: `1.5px solid ${error ? "var(--color-red)" : "var(--color-blue)"}`,
                fontSize: "0.9rem",
                outline: "none",
                boxSizing: "border-box",
                background: error ? "rgba(239,51,64,0.04)" : "var(--color-white)",
              }}
            />
          </div>
          {error && (
            <div style={{ fontSize: "0.75rem", color: "var(--color-red)", display: "flex", alignItems: "center", gap: "4px" }}>
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 13px", background: "var(--color-gray-50)", borderRadius: "8px", border: "1px solid var(--color-gray-200)" }}>
          <span style={{ color: "var(--color-gray-400)", flexShrink: 0 }}>{icon}</span>
          <span style={{ fontSize: "0.875rem", color: readValue === "—" ? "var(--color-gray-400)" : "var(--color-gray-800)", fontWeight: 500, wordBreak: "break-all" }}>
            {readValue}
          </span>
        </div>
      )}
    </div>
  );
}

function CompositeCedulaField({ label, icon, editing, value, readValue, onChange, placeholder, error }: any) {
  let letter = "V";
  let num = "";
  if (value) {
    const parts = value.split("-");
    if (parts.length >= 2) {
      letter = parts[0].toUpperCase();
      num = parts.slice(1).join("-");
    } else {
      num = value;
    }
  }

  const LETTERS = ["V", "E", "J", "G", "P", "C"];
  if (!LETTERS.includes(letter)) letter = "V";

  const handleChange = (newLetter: string, newNum: string) => {
    onChange(`${newLetter}-${newNum}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={labelStyle}>{label}</label>
      {editing ? (
        <>
          <div style={{ display: "flex", gap: "8px", position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: error ? "var(--color-red)" : "var(--color-blue)", zIndex: 2 }}>
              {icon}
            </span>
            <select
              value={letter}
              onChange={(e) => handleChange(e.target.value, num)}
              style={{
                padding: "10px 8px 10px 32px",
                borderRadius: "8px",
                border: `1.5px solid ${error ? "var(--color-red)" : "var(--color-blue)"}`,
                fontSize: "0.9rem",
                outline: "none",
                background: error ? "rgba(239,51,64,0.04)" : "var(--color-white)",
                cursor: "pointer",
              }}
            >
              {LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <input
              value={num}
              onChange={(e) => handleChange(letter, e.target.value)}
              placeholder={placeholder}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "8px",
                border: `1.5px solid ${error ? "var(--color-red)" : "var(--color-blue)"}`,
                fontSize: "0.9rem",
                outline: "none",
                boxSizing: "border-box",
                background: error ? "rgba(239,51,64,0.04)" : "var(--color-white)",
              }}
            />
          </div>
          {error && (
            <div style={{ fontSize: "0.75rem", color: "var(--color-red)", display: "flex", alignItems: "center", gap: "4px" }}>
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 13px", background: "var(--color-gray-50)", borderRadius: "8px", border: "1px solid var(--color-gray-200)" }}>
          <span style={{ color: "var(--color-gray-400)", flexShrink: 0 }}>{icon}</span>
          <span style={{ fontSize: "0.875rem", color: readValue === "—" ? "var(--color-gray-400)" : "var(--color-gray-800)", fontWeight: 500, wordBreak: "break-all" }}>
            {readValue}
          </span>
        </div>
      )}
    </div>
  );
}
