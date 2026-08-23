"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Mail, CreditCard, Lock, Phone, ChevronLeft, UserPlus } from "lucide-react";
import { useAuth } from "@/shared/hooks/useAuth";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    cedula: "V-",
    phone_number: "0412",
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

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(formData.first_name) || !/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(formData.last_name)) {
      MySwal.fire({ icon: "error", title: "Formato inválido", text: "Nombres y apellidos solo pueden contener letras." });
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

    const cedulaRegex = /^[VvEeJjGgPpCc]-\d{6,9}(?:-\d)?$/;
    if (formData.cedula && !cedulaRegex.test(formData.cedula)) {
      MySwal.fire({ icon: "error", title: "Error", text: "Cédula/RIF inválido." });
      return;
    }

    const phoneRegex = /^(0412|0414|0424|0416|0426|0422)\d{7}$|^\+?58(412|414|424|416|426|422)\d{7}$/;
    if (formData.phone_number && !phoneRegex.test(formData.phone_number)) {
      MySwal.fire({ icon: "error", title: "Error", text: "Teléfono inválido. Formato válido: 04121234567." });
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      MySwal.fire({ icon: "success", title: "¡Éxito!", text: "Registro completado exitosamente." }).then(() => {
        router.push("/");
        router.refresh();
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      const data = err.response?.data;
      let errMsg = "Error al registrarse. Intente de nuevo.";
      if (data) {
        if (data.detail) errMsg = data.detail;
        else if (data.cedula) errMsg = Array.isArray(data.cedula) ? data.cedula[0] : data.cedula;
        else if (data.email) errMsg = Array.isArray(data.email) ? data.email[0] : data.email;
        else if (typeof data === "object") {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            const val = data[keys[0]];
            errMsg = Array.isArray(val) ? `${keys[0]}: ${val[0]}` : `${keys[0]}: ${val}`;
          }
        } else if (typeof data === "string") errMsg = data;
      }
      MySwal.fire({ icon: "error", title: "Error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 12px 13px 38px",
    borderRadius: "8px",
    border: "1px solid var(--color-gray-300)",
    fontSize: "1rem",
    minHeight: "48px",
    boxSizing: "border-box",
  };

  const smallInputStyle: React.CSSProperties = {
    padding: "13px 12px",
    borderRadius: "8px",
    border: "1px solid var(--color-gray-300)",
    fontSize: "0.95rem",
    minHeight: "48px",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "center",
        padding: isMobile ? "0" : "1.5rem",
        boxSizing: "border-box",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-glass"
        style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : "500px",
          padding: isMobile ? "1.5rem 1rem 2rem" : "2.5rem",
          borderRadius: isMobile ? "0" : undefined,
          boxSizing: "border-box",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            color: "var(--color-blue)",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: "600",
            marginBottom: "1.5rem",
          }}
        >
          <ChevronLeft size={16} />
          <span>Volver al Inicio</span>
        </Link>

        <h1
          style={{
            fontSize: isMobile ? "1.5rem" : "1.75rem",
            fontWeight: "800",
            color: "var(--color-blue)",
            marginBottom: "0.5rem",
          }}
        >
          Registro
        </h1>
        <p style={{ color: "var(--color-gray-600)", marginBottom: "2rem", fontSize: "0.95rem" }}>
          Únete a la red ciudadana de resiliencia
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Nombres y Apellidos — 1 col mobile, 2 col desktop */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombres</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  name="first_name"
                  placeholder="Juan"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Apellidos</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  name="last_name"
                  placeholder="Pérez"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)" }} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Correo electrónico</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                name="email"
                placeholder="juanperez@correo.com"
                value={formData.email}
                onChange={handleChange}
                required
                style={inputStyle}
              />
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)" }} />
            </div>
          </div>

          {/* Cédula y Teléfono — 1 col mobile, 2 col desktop */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Cédula / RIF</label>
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
                  style={{ ...smallInputStyle, padding: "13px 8px 13px 32px", outline: "none", cursor: "pointer", background: "#ffffff", color: "#0A0A0A" }}
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
                    const onlyNums = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, cedula: `${letter}-${onlyNums}` });
                  }}
                  required
                  style={{ ...smallInputStyle, flex: 1, minWidth: "80px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Teléfono de Contacto</label>
              <div style={{ display: "flex", gap: "8px", position: "relative" }}>
                <Phone size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)", zIndex: 2 }} />
                <select
                  value={(() => {
                    const val = formData.phone_number.replace(/\s/g, "");
                    const prefixes = ["0412", "0414", "0424", "0416", "0426", "0422"];
                    if (val.startsWith("+58")) return prefixes.find(p => val.substring(3).startsWith(p.substring(1))) || "0412";
                    if (val.length >= 4) return prefixes.find(p => val.startsWith(p)) || "0412";
                    return "0412";
                  })()}
                  onChange={(e) => {
                    let num = formData.phone_number;
                    const val = formData.phone_number.replace(/\s/g, "");
                    if (val.startsWith("+58")) num = val.substring(6);
                    else if (val.length >= 4) num = val.substring(4);
                    setFormData({ ...formData, phone_number: e.target.value + num });
                  }}
                  style={{ ...smallInputStyle, padding: "13px 8px 13px 32px", outline: "none", cursor: "pointer", background: "#ffffff", color: "#0A0A0A" }}
                >
                  {["0412", "0414", "0424", "0416", "0426", "0422"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                  type="tel"
                  placeholder="1234567"
                  value={(() => {
                    const val = formData.phone_number.replace(/\s/g, "");
                    if (val.startsWith("+58")) return val.substring(6);
                    if (val.length >= 4 && ["0412", "0414", "0424", "0416", "0426", "0422"].some(p => val.startsWith(p))) return val.substring(4);
                    return val;
                  })()}
                  onChange={(e) => {
                    const val = formData.phone_number.replace(/\s/g, "");
                    let prefix = "0412";
                    if (val.startsWith("+58")) {
                      const p = ["0412", "0414", "0424", "0416", "0426", "0422"].find(px => val.substring(3).startsWith(px.substring(1)));
                      if (p) prefix = p;
                    } else if (val.length >= 4) {
                      const p = ["0412", "0414", "0424", "0416", "0426", "0422"].find(px => val.startsWith(px));
                      if (p) prefix = p;
                    }
                    const onlyNums = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, phone_number: prefix + onlyNums });
                  }}
                  style={{ ...smallInputStyle, flex: 1, minWidth: "80px" }}
                />
              </div>
            </div>
          </div>

          {/* Contraseñas — 1 col mobile, 2 col desktop */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Confirmar contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  name="password_confirm"
                  placeholder="••••••••"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)" }} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: "0.75rem",
              minHeight: "48px",
              fontSize: "1rem",
            }}
          >
            {loading ? "Registrando..." : (
              <>
                <UserPlus size={18} />
                <span>Registrarse</span>
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.85rem", marginTop: "2rem", color: "var(--color-gray-600)" }}>
          ¿Ya tienes una cuenta?{" "}
          <Link href="/auth/login" style={{ color: "var(--color-blue)", fontWeight: "600", textDecoration: "none" }}>
            Inicia sesión aquí
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
