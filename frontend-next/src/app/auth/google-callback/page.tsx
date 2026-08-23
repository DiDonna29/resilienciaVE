"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";
import authService from "@/core/services/auth.service";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { } = useAuth();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        setErrorMsg("Acceso cancelado por Google.");
        setStatus("error");
        setTimeout(() => router.push("/auth/login"), 3000);
        return;
      }

      if (!code) {
        setErrorMsg("No se recibió un código de autorización.");
        setStatus("error");
        setTimeout(() => router.push("/auth/login"), 3000);
        return;
      }

      try {
        // Exchange the authorization code for tokens via our backend
        await authService.googleLoginWithCode(code);
        router.push("/");
        router.refresh();
      } catch (err: any) {
        console.error("Google callback error:", err);
        const msg = err.response?.data?.detail || "Error al autenticar con Google.";
        setErrorMsg(msg);
        setStatus("error");
        setTimeout(() => router.push("/auth/login"), 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "1.5rem",
      padding: "2rem",
    }}>
      {status === "loading" ? (
        <>
          <div style={{
            width: "56px",
            height: "56px",
            border: "4px solid var(--color-gray-200)",
            borderTop: "4px solid var(--color-blue)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "var(--color-gray-700)", fontWeight: 600, fontSize: "1rem" }}>
            Autenticando con Google...
          </p>
        </>
      ) : (
        <>
          <div style={{
            width: "56px",
            height: "56px",
            background: "rgba(239,51,64,0.1)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
          }}>
            ✕
          </div>
          <p style={{ color: "var(--color-red)", fontWeight: 700, fontSize: "1rem", textAlign: "center" }}>
            {errorMsg}
          </p>
          <p style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>
            Redirigiendo al inicio de sesión...
          </p>
        </>
      )}
    </div>
  );
}
