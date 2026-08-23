"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/shared/hooks/useAuth";
import { Users, FileCheck, LayoutDashboard, Settings, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated || !['SUPERADMIN', 'ADMIN'].includes(user?.role || '')) {
        router.replace('/profile');
      }
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted || !user || !['SUPERADMIN', 'ADMIN'].includes(user.role)) {
    return <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando Panel Admin...</div>;
  }

  const allNavItems = [
    { name: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
    { name: "Verificaciones", href: "/superadmin/verifications", icon: FileCheck },
    { name: "Usuarios", href: "/superadmin/users", icon: Users },
    { name: "Configuración", href: "/superadmin/settings", icon: Settings },
  ];

  const navItems = allNavItems.filter(item => !(item.reqSuper && user.role !== 'SUPERADMIN'));

  /* ── MOBILE LAYOUT ── */
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: "var(--color-body-bg)" }}>
        {/* Top compact nav bar */}
        <div
          style={{
            background: "var(--color-white)",
            borderBottom: "1px solid var(--color-gray-200)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          {/* Title row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
              borderBottom: "1px solid var(--color-gray-100)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link
                href="/profile"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  color: "var(--color-gray-600)",
                  textDecoration: "none",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                }}
              >
                <ChevronLeft size={15} /> Perfil
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1rem", fontWeight: "800", color: "var(--color-blue)" }}>Admin</span>
              <span
                style={{
                  fontSize: "0.65rem",
                  background: "var(--color-gray-100)",
                  color: "var(--color-gray-700)",
                  padding: "2px 7px",
                  borderRadius: "12px",
                  fontWeight: "600",
                }}
              >
                {user.role === "SUPERADMIN" ? "SuperAdmin" : "Admin"}
              </span>
            </div>
          </div>

          {/* Horizontal scrollable nav */}
          <nav
            style={{
              display: "flex",
              overflowX: "auto",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
              padding: "0 8px",
            }}
          >
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "3px",
                    padding: "10px 16px",
                    borderBottom: isActive ? "3px solid var(--color-blue)" : "3px solid transparent",
                    color: isActive ? "var(--color-blue)" : "var(--color-gray-500)",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "0.72rem",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content - full width */}
        <main style={{ flex: 1, padding: "1rem", overflowY: "auto" }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>
      </div>
    );
  }

  /* ── DESKTOP LAYOUT ── */
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-body-bg)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "260px",
          background: "var(--color-white)",
          borderRight: "1px solid var(--color-gray-200)",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
          flexShrink: 0,
        }}
      >
        <div>
          <Link
            href="/profile"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              color: "var(--color-gray-600)",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              marginBottom: "1.5rem",
            }}
          >
            <ChevronLeft size={16} /> Volver al Perfil
          </Link>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--color-blue)" }}>
            Admin Panel
          </h2>
          <span
            style={{
              fontSize: "0.75rem",
              background: "var(--color-gray-100)",
              color: "var(--color-gray-700)",
              padding: "2px 8px",
              borderRadius: "12px",
              fontWeight: "600",
            }}
          >
            {user.role === "SUPERADMIN" ? "SuperAdmin" : "Admin"}
          </span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: isActive ? "var(--color-blue)" : "transparent",
                  color: isActive ? "#fff" : "var(--color-gray-700)",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.2s",
                }}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto", minWidth: 0 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
