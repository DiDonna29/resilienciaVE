"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, ChevronLeft } from "lucide-react";
import { useAuth } from "@/shared/hooks/useAuth";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const gsiInitialized = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load Google Identity Services and render the Sign-In button
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      if (gsiInitialized.current) return;
      gsiInitialized.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            setLoading(true);
            await googleLogin(response.credential);
            router.push("/");
            router.refresh();
          } catch (err: any) {
            console.error("Google Login Error:", err);
            const msg = err.response?.data?.detail || err.message || "Error al iniciar sesión con Google.";
            MySwal.fire({ icon: "error", title: "Error", text: msg });
          } finally {
            setLoading(false);
          }
        },
        auto_select: false,
        use_fedcm_for_prompt: true,
      });

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: googleBtnRef.current.offsetWidth || 380,
          text: "continue_with",
          locale: "es",
        });
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      MySwal.fire({ icon: "error", title: "Atención", text: "Por favor ingrese su correo y contraseña." });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      MySwal.fire({ icon: "error", title: "Error", text: "Por favor ingrese un correo válido." });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      MySwal.fire({ icon: "error", title: "Credenciales inválidas", text: "La contraseña no cumple con los requisitos de seguridad." });
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });
      MySwal.fire({ icon: "success", title: "¡Bienvenido!", text: "Has iniciado sesión exitosamente.", timer: 1500, showConfirmButton: false }).then(() => {
        router.push("/");
        router.refresh();
      });
    } catch (err: any) {
      console.error("Login error:", err);
      const msg = err.response?.data?.detail || "Credenciales inválidas o error de conexión.";
      MySwal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "0" : "1rem",
        boxSizing: "border-box",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-glass"
        style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : "450px",
          padding: isMobile ? "1.5rem 1rem" : "2.5rem",
          borderRadius: isMobile ? "0" : undefined,
          minHeight: isMobile ? "100dvh" : undefined,
          display: "flex",
          flexDirection: "column",
          justifyContent: isMobile ? "center" : undefined,
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
          Iniciar Sesión
        </h1>
        <p style={{ color: "var(--color-gray-600)", marginBottom: "2rem", fontSize: "0.95rem" }}>
          Ingresa tus credenciales para acceder a tu cuenta
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-gray-800)" }}>
              Correo electrónico
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 12px 14px 42px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-gray-300)",
                  fontSize: "1rem",
                  minHeight: "48px",
                  boxSizing: "border-box",
                }}
              />
              <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-gray-800)" }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 12px 14px 42px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-gray-300)",
                  fontSize: "1rem",
                  minHeight: "48px",
                  boxSizing: "border-box",
                }}
              />
              <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-600)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link href="/auth/recover" style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--color-blue)", textDecoration: "none" }}>
                ¿Olvidaste tu contraseña?
              </Link>
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
              marginTop: "0.5rem",
              minHeight: "48px",
              fontSize: "1rem",
            }}
          >
            {loading ? "Iniciando..." : (
              <>
                <LogIn size={18} />
                <span>Ingresar</span>
              </>
            )}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "1.75rem 0", width: "100%" }}>
          <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--color-gray-300)" }} />
          <span style={{ padding: "0 0.75rem", fontSize: "0.8rem", color: "var(--color-gray-600)" }}>O continuar con</span>
          <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--color-gray-300)" }} />
        </div>

        {/* Google Identity Services renders the real Google button here */}
        <div ref={googleBtnRef} style={{ width: "100%", display: "flex", justifyContent: "center" }} />

        <p style={{ textAlign: "center", fontSize: "0.85rem", marginTop: "2rem", color: "var(--color-gray-600)" }}>
          ¿No tienes una cuenta?{" "}
          <Link href="/auth/register" style={{ color: "var(--color-blue)", fontWeight: "600", textDecoration: "none" }}>
            Regístrate aquí
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
