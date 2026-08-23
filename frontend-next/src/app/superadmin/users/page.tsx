"use client";

import React, { useEffect, useState } from "react";
import adminService from "@/core/services/admin.service";
import { useAuth } from "@/shared/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff, Search, FileCheck } from "lucide-react";
import Swal from "sweetalert2";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (user && !['SUPERADMIN', 'ADMIN'].includes(user.role)) {
      router.replace('/superadmin');
      return;
    }
    loadUsers();
  }, [user]);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudieron cargar los usuarios", "error");
    } finally {
      setLoading(false);
    }
  }

  const toggleUserStatus = async (u: any) => {
    try {
      const result = await Swal.fire({
        title: u.is_active ? "¿Desactivar usuario?" : "¿Activar usuario?",
        text: u.is_active ? "El usuario no podrá iniciar sesión." : "El usuario recuperará el acceso.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: u.is_active ? "#EF3340" : "#10B981",
        confirmButtonText: "Sí, continuar"
      });
      if (result.isConfirmed) {
        const res = await adminService.toggleUserStatus(u.id);
        Swal.fire("Éxito", res.detail, "success");
        loadUsers();
      }
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.detail || "Hubo un error", "error");
    }
  };

  const toggleAdminRole = async (u: any) => {
    try {
      const isCurrentlyAdmin = u.role === 'ADMIN';
      const result = await Swal.fire({
        title: isCurrentlyAdmin ? "¿Quitar permisos de Admin?" : "¿Hacer Admin?",
        text: isCurrentlyAdmin ? "El usuario volverá a ser un Ciudadano." : "El usuario podrá acceder al panel de administración.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: isCurrentlyAdmin ? "#EF3340" : "#10B981",
        confirmButtonText: "Sí, continuar"
      });
      if (result.isConfirmed) {
        const res = await adminService.toggleAdmin(u.id);
        Swal.fire("Éxito", res.detail, "success");
        loadUsers();
      }
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.detail || "Hubo un error", "error");
    }
  };

  const toggleVerification = async (u: any, flag: string, flagLabel: string) => {
    const isCurrentlyVerified = u[flag];
    try {
      const result = await Swal.fire({
        title: isCurrentlyVerified ? `¿Revocar ${flagLabel}?` : `¿Verificar como ${flagLabel}?`,
        text: isCurrentlyVerified ? "Se le quitará esta insignia al usuario." : "Se le otorgará esta insignia sin solicitud previa.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: isCurrentlyVerified ? "#EF3340" : "#10B981",
        confirmButtonText: "Sí, continuar"
      });
      if (result.isConfirmed) {
        await adminService.verifyUserFlag(u.id, flag, !isCurrentlyVerified);
        Swal.fire("Éxito", "Estado de verificación actualizado", "success");
        loadUsers();
      }
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.detail || "Hubo un error", "error");
    }
  };

  const getVerifications = (u: any) => {
    const verifs = [];
    if (u.is_verified_health_worker) verifs.push({ label: "Salud", full: "Trabajador de Salud" });
    if (u.is_verified_shelter_manager) verifs.push({ label: "Refugio", full: "Gestor de Refugio" });
    if (u.is_verified_org_donor) verifs.push({ label: "Donante", full: "Donante" });
    if (u.is_verified_web_collaborator) verifs.push({ label: "Web", full: "Colaborador Web" });
    return verifs;
  };

  const filteredUsers = users.filter(u =>
    (activeTab === 'active' ? u.is_active : !u.is_active) &&
    (u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadge = (role: string) => {
    const bg = role === 'SUPERADMIN' ? "var(--color-blue)" : role === 'ADMIN' ? "#8B5CF6" : "var(--color-gray-200)";
    const color = role === 'SUPERADMIN' || role === 'ADMIN' ? "#fff" : "var(--color-gray-700)";
    const label = role === 'SUPERADMIN' ? 'SuperAdmin' : role === 'ADMIN' ? 'Admin' : 'Ciudadano';
    return (
      <span style={{ fontSize: "0.72rem", background: bg, color, padding: "3px 8px", borderRadius: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
        {label}
      </span>
    );
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          marginBottom: "1.5rem",
          gap: "1rem",
        }}
      >
        <h1
          style={{
            fontSize: isMobile ? "1.5rem" : "2rem",
            fontWeight: "800",
            color: "var(--color-gray-900)",
            margin: 0,
          }}
        >
          Gestión de Usuarios
        </h1>

        <div style={{ position: "relative", width: "100%", maxWidth: isMobile ? "100%" : "300px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-500)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre, correo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 10px 10px 38px",
              borderRadius: "8px",
              border: "1px solid var(--color-gray-300)",
              minHeight: "44px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0",
          marginBottom: "1.5rem",
          borderBottom: "2px solid var(--color-gray-200)",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {(['active', 'inactive'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "transparent",
              border: "none",
              padding: isMobile ? "10px 12px" : "10px 16px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: isMobile ? "0.8rem" : "0.9rem",
              color: activeTab === tab ? "var(--color-blue)" : "var(--color-gray-500)",
              borderBottom: activeTab === tab ? "3px solid var(--color-blue)" : "3px solid transparent",
              marginBottom: "-2px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {tab === 'active' ? 'Activos' : 'Inactivos'}
            <span
              style={{
                marginLeft: "6px",
                background: "var(--color-gray-200)",
                color: "var(--color-gray-700)",
                padding: "2px 7px",
                borderRadius: "12px",
                fontSize: "0.72rem",
              }}
            >
              {users.filter(u => tab === 'active' ? u.is_active : !u.is_active).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── MOBILE: Card list view ── */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--color-gray-500)" }}>Cargando...</p>
          ) : filteredUsers.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--color-gray-500)" }}>No se encontraron usuarios</p>
          ) : (
            filteredUsers.map((u) => {
              const isTargetSuperAdmin = u.role === 'SUPERADMIN';
              const isTargetAdmin = u.role === 'ADMIN';
              const canModify = user?.role === 'SUPERADMIN' || (user?.role === 'ADMIN' && !isTargetSuperAdmin && !isTargetAdmin);
              const canPromote = user?.role === 'SUPERADMIN' && !isTargetSuperAdmin;
              const verifs = getVerifications(u);

              return (
                <div
                  key={u.id}
                  className="card card-glass"
                  style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
                >
                  {/* Header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: "700", color: "var(--color-gray-900)", fontSize: "0.95rem" }}>
                        {u.first_name} {u.last_name}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-gray-500)", wordBreak: "break-all" }}>{u.email}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                      {getRoleBadge(u.role)}
                      {u.is_active ? (
                        <span style={{ color: "#10B981", fontWeight: "600", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "3px" }}>
                          <Shield size={12} /> Activo
                        </span>
                      ) : (
                        <span style={{ color: "#EF3340", fontWeight: "600", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "3px" }}>
                          <ShieldOff size={12} /> Inactivo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Verifications */}
                  {verifs.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {verifs.map(v => (
                        <span key={v.label} style={{ fontSize: "0.68rem", display: "flex", alignItems: "center", gap: "2px", background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 6px", borderRadius: "4px" }}>
                          <FileCheck size={10} /> {v.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  {canModify && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingTop: "4px", borderTop: "1px solid var(--color-gray-100)" }}>
                      <button
                        onClick={() => toggleUserStatus(u)}
                        style={{
                          border: "1px solid " + (u.is_active ? "#EF3340" : "#10B981"),
                          color: u.is_active ? "#EF3340" : "#10B981",
                          background: "transparent",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "0.78rem",
                        }}
                      >
                        {u.is_active ? "Desactivar" : "Activar"}
                      </button>
                      {canPromote && (
                        <button
                          onClick={() => toggleAdminRole(u)}
                          style={{
                            border: "1px solid " + (u.role === 'ADMIN' ? "#F59E0B" : "#8B5CF6"),
                            color: u.role === 'ADMIN' ? "#F59E0B" : "#8B5CF6",
                            background: "transparent",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.78rem",
                          }}
                        >
                          {u.role === 'ADMIN' ? "Quitar Admin" : "Hacer Admin"}
                        </button>
                      )}
                      {/* Verification toggles */}
                      {[
                        { flag: 'is_verified_health_worker', label: '🏥 Salud' },
                        { flag: 'is_verified_shelter_manager', label: '🏠 Refugio' },
                        { flag: 'is_verified_org_donor', label: '💛 Donante' },
                        { flag: 'is_verified_web_collaborator', label: '💻 Web' },
                      ].map(({ flag, label }) => (
                        <button
                          key={flag}
                          onClick={() => toggleVerification(u, flag, label)}
                          style={{
                            background: u[flag] ? "#10B981" : "transparent",
                            color: u[flag] ? "#fff" : "var(--color-gray-500)",
                            border: "1px solid " + (u[flag] ? "#10B981" : "var(--color-gray-300)"),
                            padding: "5px 8px",
                            borderRadius: "4px",
                            fontSize: "0.68rem",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ── DESKTOP: Table view ── */
        <div className="card card-glass" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--color-gray-100)" }}>
                <tr>
                  <th style={{ padding: "1rem", color: "var(--color-gray-600)", fontWeight: "700" }}>Usuario</th>
                  <th style={{ padding: "1rem", color: "var(--color-gray-600)", fontWeight: "700" }}>Rol</th>
                  <th style={{ padding: "1rem", color: "var(--color-gray-600)", fontWeight: "700" }}>Verificaciones</th>
                  <th style={{ padding: "1rem", color: "var(--color-gray-600)", fontWeight: "700" }}>Estado</th>
                  <th style={{ padding: "1rem", color: "var(--color-gray-600)", fontWeight: "700" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center" }}>Cargando...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center" }}>No se encontraron usuarios</td></tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--color-gray-200)" }}>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: "600", color: "var(--color-gray-900)" }}>{u.first_name} {u.last_name}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>{u.email}</div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {getRoleBadge(u.role)}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {getVerifications(u).length > 0 ? (
                            getVerifications(u).map(v => (
                              <span key={v.label} style={{ fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "2px", background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 6px", borderRadius: "4px" }}>
                                <FileCheck size={10} /> {v.full}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>Sin verificación</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {u.is_active ? (
                          <span style={{ color: "#10B981", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}><Shield size={14} /> Activo</span>
                        ) : (
                          <span style={{ color: "#EF3340", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}><ShieldOff size={14} /> Inactivo</span>
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {(() => {
                          const isTargetSuperAdmin = u.role === 'SUPERADMIN';
                          const isTargetAdmin = u.role === 'ADMIN';
                          const canModify = user?.role === 'SUPERADMIN' || (user?.role === 'ADMIN' && !isTargetSuperAdmin && !isTargetAdmin);
                          const canPromote = user?.role === 'SUPERADMIN' && !isTargetSuperAdmin;

                          return (
                            <>
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                                {canModify && (
                                  <button
                                    onClick={() => toggleUserStatus(u)}
                                    style={{ background: "transparent", border: "1px solid " + (u.is_active ? "#EF3340" : "#10B981"), color: u.is_active ? "#EF3340" : "#10B981", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.75rem" }}
                                  >
                                    {u.is_active ? "Desactivar" : "Activar"}
                                  </button>
                                )}
                                {canPromote && (
                                  <button
                                    onClick={() => toggleAdminRole(u)}
                                    style={{ background: "transparent", border: "1px solid " + (u.role === 'ADMIN' ? "#F59E0B" : "#8B5CF6"), color: u.role === 'ADMIN' ? "#F59E0B" : "#8B5CF6", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.75rem" }}
                                  >
                                    {u.role === 'ADMIN' ? "Quitar Admin" : "Hacer Admin"}
                                  </button>
                                )}
                              </div>
                              {canModify && (
                                <div style={{ marginTop: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                  <button onClick={() => toggleVerification(u, 'is_verified_health_worker', 'Trabajador de Salud')} style={{ background: u.is_verified_health_worker ? "#10B981" : "transparent", color: u.is_verified_health_worker ? "#fff" : "var(--color-gray-500)", border: "1px solid " + (u.is_verified_health_worker ? "#10B981" : "var(--color-gray-300)"), padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem", cursor: "pointer" }} title="Alternar Trabajador de Salud">Salud</button>
                                  <button onClick={() => toggleVerification(u, 'is_verified_shelter_manager', 'Gestor de Refugio')} style={{ background: u.is_verified_shelter_manager ? "#10B981" : "transparent", color: u.is_verified_shelter_manager ? "#fff" : "var(--color-gray-500)", border: "1px solid " + (u.is_verified_shelter_manager ? "#10B981" : "var(--color-gray-300)"), padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem", cursor: "pointer" }} title="Alternar Gestor de Refugio">Refugio</button>
                                  <button onClick={() => toggleVerification(u, 'is_verified_org_donor', 'Donante')} style={{ background: u.is_verified_org_donor ? "#10B981" : "transparent", color: u.is_verified_org_donor ? "#fff" : "var(--color-gray-500)", border: "1px solid " + (u.is_verified_org_donor ? "#10B981" : "var(--color-gray-300)"), padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem", cursor: "pointer" }} title="Alternar Donante">Donante</button>
                                  <button onClick={() => toggleVerification(u, 'is_verified_web_collaborator', 'Colaborador Web')} style={{ background: u.is_verified_web_collaborator ? "#10B981" : "transparent", color: u.is_verified_web_collaborator ? "#fff" : "var(--color-gray-500)", border: "1px solid " + (u.is_verified_web_collaborator ? "#10B981" : "var(--color-gray-300)"), padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem", cursor: "pointer" }} title="Alternar Colaborador Web">Colab</button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
