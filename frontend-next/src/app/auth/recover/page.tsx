"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, CreditCard, ChevronLeft } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import api from "@/core/services/api.service";

const MySwal = withReactContent(Swal);

export default function RecoverPasswordPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: "",
    cedula: "V-",
    password: "",
    password_confirm: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      MySwal.fire({ icon: "error", title: "Error", text: "Por favor ingrese un correo válido." });
      return;
    }

    const cedulaRegex = /^[VvEeJjGgPpCc]-\d{6,9}(?:-\d)?$/;
    if (formData.cedula && !cedulaRegex.test(formData.cedula)) {
      MySwal.fire({ icon: "error", title: "Error", text: "Cédula/RIF inválido." });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      MySwal.fire({ icon: "error", title: "Contraseña débil", text: "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número." });
      return;
    }

    if (formData.password !== formData.password_confirm) {
      MySwal.fire({ icon: "error", title: "Error", text: "Las contraseñas no coinciden." });
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/password-recovery/", {
        email: formData.email,
        cedula: formData.cedula,
        new_password: formData.password,
        new_password_confirm: formData.password_confirm,
      });

      MySwal.fire({ 
        icon: "success", 
        title: "¡Éxito!", 
        text: "Contraseña actualizada. Ahora puedes iniciar sesión.",
      }).then(() => {
        router.push("/auth/login");
      });
    } catch (err: any) {
      console.error("Recovery error:", err);
      const data = err.response?.data;
      let errMsg = "Error al recuperar la contraseña.";
      if (data) {
        if (data.detail) errMsg = data.detail;
        else if (data.non_field_errors) errMsg = data.non_field_errors[0];
        else if (typeof data === "object") {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            const val = data[keys[0]];
            errMsg = Array.isArray(val) ? `${keys[0]}: ${val[0]}` : `${keys[0]}: ${val}`;
          }
        }
      }
      MySwal.fire({ icon: "error", title: "Error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-glass" 
        style={{ width: "100%", maxWidth: "450px", padding: "2.5rem" }}
      >
        <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--color-blue)", textDecoration: "none", fontSize: "0.85rem", fontWeight: "600", marginBottom: "1.5rem" }}>
          <ChevronLeft size={16} />
          <span>Volver a Iniciar Sesión</span>
        </Link>

        <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--color-blue)", marginBottom: "0.5rem" }}>
          Recuperar Contraseña
        </h1>
        <p style={{ color: "var(--color-gray-600)", marginBottom: "2rem", fontSize: "0.95rem" }}>
          Ingresa tus datos registrados para cambiar tu contraseña.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-gray-800)" }}>
              Cédula / RIF
            </label>
            <div style={{ display: "flex", gap: "8px", position: "relative" }}>
              <CreditCard size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)", zIndex: 2 }} />
              <select
                value={(() => {
                  const parts = formData.cedula.split("-");
                  return parts.length >= 2 && ["V", "E", "J", "G", "P", "C"].includes(parts[0].toUpperCase()) ? parts[0].toUpperCase() : "V";
                })()}
                onChange={(e) => {
                  let num = "";
                  if (formData.cedula.includes("-")) {
                    num = formData.cedula.split("-").slice(1).join("-");
                  } else {
                    num = formData.cedula;
                  }
                  setFormData({ ...formData, cedula: `${e.target.value}-${num}` });
                }}
                style={{ padding: "12px 8px 12px 32px", borderRadius: "10px", border: "1px solid var(--color-gray-300)", fontSize: "0.95rem", outline: "none", cursor: "pointer", background: "#ffffff", color: "#0A0A0A" }}
              >
                {["V", "E", "J", "G", "P", "C"].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input
                type="text"
                placeholder="12345678"
                value={(() => {
                  if (formData.cedula.includes("-")) return formData.cedula.split("-").slice(1).join("-");
                  return formData.cedula;
                })()}
                onChange={(e) => {
                  let letter = "V";
                  if (formData.cedula.includes("-")) {
                    const prefix = formData.cedula.split("-")[0].toUpperCase();
                    if (["V", "E", "J", "G", "P", "C"].includes(prefix)) letter = prefix;
                  }
                  // Only allow numbers for the input part
                  const onlyNums = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, cedula: `${letter}-${onlyNums}` });
                }}
                required
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid var(--color-gray-300)", fontSize: "0.95rem" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-gray-800)" }}>
              Correo electrónico registrado
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                name="email"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "10px", border: "1px solid var(--color-gray-300)", fontSize: "0.95rem" }}
              />
              <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-gray-800)" }}>
              Nueva Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "10px", border: "1px solid var(--color-gray-300)", fontSize: "0.95rem" }}
              />
              <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-gray-800)" }}>
              Confirmar Nueva Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                name="password_confirm"
                placeholder="••••••••"
                value={formData.password_confirm}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "10px", border: "1px solid var(--color-gray-300)", fontSize: "0.95rem" }}
              />
              <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)" }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.5rem",
              padding: "12px",
              background: "var(--color-blue)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {loading ? "Verificando..." : "Cambiar Contraseña"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
