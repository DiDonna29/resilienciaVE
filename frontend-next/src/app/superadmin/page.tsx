"use client";

import React, { useEffect, useState } from "react";
import adminService from "@/core/services/admin.service";

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, verifications: 0, pending: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [users, verifs] = await Promise.all([
          adminService.getUsers(),
          adminService.getVerificationRequests()
        ]);
        setStats({
          users: users.length,
          verifications: verifs.length,
          pending: verifs.filter(v => v.status === 'pending').length
        });
      } catch (err) {
        console.error("Error loading dashboard stats", err);
      }
    }
    loadData();
  }, []);

  const statCards = [
    {
      label: "Usuarios Registrados",
      value: stats.users,
      color: "var(--color-blue)",
      borderColor: "var(--color-blue)",
    },
    {
      label: "Solicitudes Pendientes",
      value: stats.pending,
      color: "#F59E0B",
      borderColor: "#F59E0B",
    },
    {
      label: "Total Verificaciones",
      value: stats.verifications,
      color: "var(--color-gray-900)",
      borderColor: "#10B981",
    },
  ];

  return (
    <div>
      <h1
        style={{
          fontSize: isMobile ? "1.5rem" : "2rem",
          fontWeight: "800",
          color: "var(--color-gray-900)",
          marginBottom: "1.5rem",
        }}
      >
        Dashboard
      </h1>

      <div
        style={{
          display: "grid",
          /* 2 columns on mobile, auto-fit on larger screens */
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(200px, 1fr))",
          gap: isMobile ? "1rem" : "1.5rem",
        }}
      >
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="card card-glass"
            style={{
              padding: isMobile ? "1rem" : "1.5rem",
              borderLeft: `4px solid ${card.borderColor}`,
              /* Last card spans full width on mobile when count is odd */
              gridColumn: isMobile && idx === statCards.length - 1 && statCards.length % 2 !== 0 ? "1 / -1" : undefined,
            }}
          >
            <h3
              style={{
                fontSize: isMobile ? "0.72rem" : "0.85rem",
                color: "var(--color-gray-600)",
                fontWeight: "700",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}
            >
              {card.label}
            </h3>
            <p
              style={{
                fontSize: isMobile ? "2rem" : "2.5rem",
                fontWeight: "800",
                color: card.color,
                margin: 0,
              }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
