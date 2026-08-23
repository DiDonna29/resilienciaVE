"use client";

import React, { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import missingPeopleService from "@/core/services/missing-people.service";
import { MissingPerson, MissingStats } from "@/core/models/missing-person.interface";
import MissingPersonCard from "./components/MissingPersonCard";
import MissingPersonForm from "./components/MissingPersonForm";
import { useAuthStore } from "@/core/store/auth.store";
import SearchBar from "@/shared/components/search-bar/SearchBar";

/* ─── Responsive hook ─── */
function useViewport() {
  const [width, setWidth] = useState<number>(360);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

export default function MissingPeoplePage() {
  const { isAuthenticated } = useAuthStore();
  const { isMobile, isTablet } = useViewport();
  const [people, setPeople] = useState<MissingPerson[]>([]);
  const [stats, setStats] = useState<MissingStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("missing");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listData, statsData] = await Promise.all([
        missingPeopleService.getList(
          (statusFilter || undefined) as any,
          1,
          searchTerm || undefined
        ),
        missingPeopleService.getStats(),
      ]);
      setPeople(listData.results || []);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading missing people:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, searchTerm]);

  /* ─── Layout values ─── */
  const pagePadding = isMobile ? "0 12px" : "0 1rem";
  const titleSize   = isMobile ? "1.4rem" : "2rem";

  // Stats grid: 2 cols on mobile, 4 on tablet+
  const statsGridCols = isMobile
    ? "repeat(2, 1fr)"
    : "repeat(auto-fit, minmax(200px, 1fr))";

  // Cards grid: 1 col mobile, 2 col tablet, auto-fill desktop
  const cardsGridCols = isMobile
    ? "1fr"
    : isTablet
    ? "repeat(2, 1fr)"
    : "repeat(auto-fill, minmax(280px, 1fr))";

  return (
    <div
      className="container"
      style={{ maxWidth: "1200px", margin: "0 auto", padding: pagePadding }}
    >
      {/* ── Header ── */}
      <header
        style={{
          marginBottom: isMobile ? "1.25rem" : "2rem",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "flex-start",
          gap: "0.75rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: titleSize,
              fontWeight: "900",
              color: "var(--color-blue)",
              lineHeight: 1.2,
            }}
          >
            Búsqueda de Desaparecidos
          </h1>
          <p
            style={{
              color: "var(--color-gray-600)",
              marginTop: "0.25rem",
              fontSize: isMobile ? "0.85rem" : "1rem",
            }}
          >
            Ayuda a localizar a personas desaparecidas tras los recientes eventos sísmicos.
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              window.location.href = "/auth/login";
            } else {
              setShowForm(true);
            }
          }}
          className="btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            minHeight: "48px",
            padding: "0 1.25rem",
            fontSize: isMobile ? "0.85rem" : "1rem",
            whiteSpace: "nowrap",
            alignSelf: isMobile ? "stretch" : "auto",
            justifyContent: "center",
          }}
        >
          <Plus size={18} />
          <span>Reportar Desaparecido</span>
        </button>
      </header>

      {/* ── Stats Board ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: statsGridCols,
          gap: isMobile ? "0.75rem" : "1rem",
          marginBottom: isMobile ? "1.25rem" : "2rem",
        }}
      >
        <div
          className="card card-glass"
          style={{ padding: isMobile ? "0.875rem" : "1.25rem", textAlign: "center" }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "var(--color-gray-600)",
              fontWeight: "600",
              textTransform: "uppercase",
              display: "block",
            }}
          >
            Total reportados
          </span>
          <h2
            style={{
              fontSize: isMobile ? "1.5rem" : "2rem",
              fontWeight: "800",
              color: "var(--color-gray-900)",
              marginTop: "0.25rem",
            }}
          >
            {stats?.total ?? "..."}
          </h2>
        </div>

        <div
          className="card card-glass"
          style={{
            padding: isMobile ? "0.875rem" : "1.25rem",
            textAlign: "center",
            borderLeft: "4px solid var(--color-red)",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "var(--color-gray-600)",
              fontWeight: "600",
              textTransform: "uppercase",
              display: "block",
            }}
          >
            {isMobile ? "Desaparecidos" : "Desaparecidos (Activos)"}
          </span>
          <h2
            style={{
              fontSize: isMobile ? "1.5rem" : "2rem",
              fontWeight: "800",
              color: "var(--color-red)",
              marginTop: "0.25rem",
            }}
          >
            {stats?.missing_count ?? "..."}
          </h2>
        </div>

        <div
          className="card card-glass"
          style={{
            padding: isMobile ? "0.875rem" : "1.25rem",
            textAlign: "center",
            borderLeft: "4px solid #10B981",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "var(--color-gray-600)",
              fontWeight: "600",
              textTransform: "uppercase",
              display: "block",
            }}
          >
            Localizados
          </span>
          <h2
            style={{
              fontSize: isMobile ? "1.5rem" : "2rem",
              fontWeight: "800",
              color: "#10B981",
              marginTop: "0.25rem",
            }}
          >
            {stats?.found_count ?? "..."}
          </h2>
        </div>

        <div
          className="card card-glass"
          style={{
            padding: isMobile ? "0.875rem" : "1.25rem",
            textAlign: "center",
            borderLeft: "4px solid #1F2937",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "var(--color-gray-600)",
              fontWeight: "600",
              textTransform: "uppercase",
              display: "block",
            }}
          >
            Fallecidos
          </span>
          <h2
            style={{
              fontSize: isMobile ? "1.5rem" : "2rem",
              fontWeight: "800",
              color: "#1F2937",
              marginTop: "0.25rem",
            }}
          >
            {stats?.deceased_count ?? "..."}
          </h2>
        </div>
      </section>

      {/* ── Search & Tabs filters ── */}
      <section
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: "0.75rem",
          marginBottom: isMobile ? "1.25rem" : "2rem",
        }}
      >
        {/* Navigation Tabs — scrollable on mobile */}
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch" as any,
            scrollbarWidth: "none" as any,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              gap: "0.5rem",
              background: "var(--color-gray-200)",
              padding: "4px",
              borderRadius: "10px",
              minWidth: "max-content",
            }}
          >
            <button
              onClick={() => setStatusFilter("missing")}
              style={{
                border: "none",
                padding: isMobile ? "10px 14px" : "8px 16px",
                minHeight: "44px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: isMobile ? "0.82rem" : "0.9rem",
                cursor: "pointer",
                background:
                  statusFilter === "missing" ? "var(--color-red)" : "transparent",
                color:
                  statusFilter === "missing" ? "white" : "var(--color-gray-800)",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              Buscar Desaparecidos
            </button>
            <button
              onClick={() => setStatusFilter("found")}
              style={{
                border: "none",
                padding: isMobile ? "10px 14px" : "8px 16px",
                minHeight: "44px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: isMobile ? "0.82rem" : "0.9rem",
                cursor: "pointer",
                background:
                  statusFilter === "found" ? "#10B981" : "transparent",
                color:
                  statusFilter === "found" ? "white" : "var(--color-gray-800)",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              Ver Localizados
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ width: isMobile ? "100%" : "300px" }}>
          <SearchBar
            placeholder="Buscar por nombre o cédula..."
            onChange={(val) => setSearchTerm(val)}
          />
        </div>
      </section>

      {/* ── Grid of Results ── */}
      <section style={{ marginBottom: "3rem" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: isMobile ? "2.5rem 1rem" : "4rem",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <Loader2 size={40} className="animate-spin" color="var(--color-blue)" />
            <span style={{ color: "var(--color-gray-600)", fontSize: "0.9rem" }}>
              Cargando base de datos...
            </span>
          </div>
        ) : people.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: isMobile ? "3rem 1rem" : "5rem 2rem",
              background: "var(--color-white)",
              borderRadius: "16px",
              border: "1px solid var(--color-gray-200)",
            }}
          >
            <h3
              style={{
                fontSize: isMobile ? "1.1rem" : "1.25rem",
                fontWeight: "700",
                color: "var(--color-gray-700)",
              }}
            >
              No se encontraron registros
            </h3>
            <p
              style={{
                color: "var(--color-gray-600)",
                marginTop: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              Intenta cambiar los filtros o realizar otra búsqueda.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: cardsGridCols,
              gap: isMobile ? "0.875rem" : "1.5rem",
            }}
          >
            {people.map((person) => (
              <MissingPersonCard key={person.id} person={person} />
            ))}
          </div>
        )}
      </section>

      {/* ── Create Modal Form ── */}
      {showForm && (
        <MissingPersonForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
