"use client";

import React, { useState } from "react";
import { Code, Terminal, BookOpen, Layers, ShieldCheck, ExternalLink } from "lucide-react";

export default function OpenDataPage() {
  const [activeTab, setActiveTab] = useState<string>("curl");

  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/seismology/",
      desc: "Listado cronológico de sismos detectados dentro de las coordenadas de Venezuela.",
      params: "min_magnitude, limit, page"
    },
    {
      method: "GET",
      path: "/api/v1/seismology/stats/",
      desc: "Estadísticas agregadas: total sismos, sismos de hoy y último sismo de gran magnitud.",
      params: "Ninguno"
    },
    {
      method: "GET",
      path: "/api/v1/missing-people/",
      desc: "Consulta pública del listado de personas desaparecidas o localizadas.",
      params: "status (missing|found), search (nombre/cédula), page"
    },
    {
      method: "GET",
      path: "/api/v1/rescue-zones/",
      desc: "Listado de zonas críticas de derrumbes, inundaciones e insumos solicitados.",
      params: "status (active|attended|closed), risk_type"
    },
    {
      method: "GET",
      path: "/api/v1/health-network/",
      desc: "Semáforo y estado de operatividad de hospitales y clínicas en Venezuela.",
      params: "status, type, state_ve"
    },
    {
      method: "GET",
      path: "/api/v1/shelters/",
      desc: "Ubicación de refugios temporales y disponibilidad de cupos.",
      params: "status, type, state_ve"
    }
  ];

  const curlExample = `curl -X GET "http://localhost:8000/api/v1/seismology/?min_magnitude=4.5" \\
     -H "Accept: application/json"`;

  const jsExample = `// Consumir API de Sismología de RESILIENCIA VZLA
fetch("http://localhost:8000/api/v1/seismology/?min_magnitude=4.5")
  .then(response => response.json())
  .then(data => {
    console.log("Sismos &gt;= 4.5 detectados:", data.results);
  })
  .catch(error =&gt; console.error("Error:", error));`;

  const pythonExample = `# Obtener estadísticas sísmicas en Python
import requests

url = "http://localhost:8000/api/v1/seismology/stats/"
response = requests.get(url)
if response.status_code == 200:
    stats = response.json()
    print(f"Sismos registrados hoy: {stats['today_count']}")
    print(f"Último evento: {stats['latest_event']['epicenter_name']}")`;

  return (
    <div className="container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 1rem" }}>
      
      {/* Header */}
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "900", color: "var(--color-blue)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Code size={28} />
          <span>API de Datos Abiertos y Documentación</span>
        </h1>
        <p style={{ color: "var(--color-gray-600)", marginTop: "0.25rem" }}>
          Promovemos la libre circulación de información estructurada. Puedes consumir nuestros endpoints de forma pública para alimentar tus aplicaciones o paneles de control.
        </p>
      </header>

      {/* Grid: Rate limits and policy */}
      <section style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem", marginBottom: "3rem" }}>
        
        {/* API Info */}
        <div className="card card-glass" style={{ padding: "1.75rem", borderLeft: "4px solid var(--color-blue)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-blue)", marginBottom: "1rem" }}>
            <BookOpen size={20} />
            <span>Políticas de Uso de la API</span>
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-gray-700)", lineHeight: "1.5" }}>
            Los datos referentes a desastres, personas desaparecidas y zonas de emergencia son completamente públicos.
            Garantizamos CORS abierto para que puedas consumirlos directamente desde el cliente en cualquier origen de dominio.
          </p>
          <ul style={{ paddingLeft: "1.25rem", marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-gray-700)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <li><strong>Límite público (Anónimo)</strong>: 1,000 peticiones al día por dirección IP.</li>
            <li><strong>Límite de escritura</strong>: Requiere token Bearer JWT de cuenta autorizada.</li>
            <li><strong>Formato de respuesta</strong>: Siempre en codificación JSON (UTF-8).</li>
          </ul>
        </div>

        {/* OpenAPI interactive schema redirect */}
        <div className="card card-glass" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-800)", marginBottom: "0.75rem" }}>
              <Layers size={20} />
              <span>Esquema Swagger / OpenAPI</span>
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-gray-600)", lineHeight: "1.4" }}>
              Poseemos un esquema estructurado e interactivo OpenAPI completo para verificar de forma visual cada endpoint del backend.
            </p>
          </div>
          
          <a 
            href="http://localhost:8000/api/v1/docs/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-primary" 
            style={{ display: "inline-flex", alignItems: "center", justifySelf: "flex-end", gap: "0.5rem", textDecoration: "none", fontSize: "0.85rem", marginTop: "1rem" }}
          >
            <span>Ver Swagger Interactivo</span>
            <ExternalLink size={14} />
          </a>
        </div>

      </section>

      {/* Endpoints List */}
      <section style={{ marginBottom: "3rem" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1.25rem" }}>Endpoints Públicos Disponibles</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {endpoints.map((ep, idx) => (
            <div key={idx} className="card card-glass" style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ flex: 1, minWidth: "300px" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ background: "rgba(0,61,165,0.1)", color: "var(--color-blue)", fontSize: "0.75rem", fontWeight: "700", padding: "4px 8px", borderRadius: "4px" }}>
                    {ep.method}
                  </span>
                  <code style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--color-gray-900)" }}>{ep.path}</code>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--color-gray-600)", marginTop: "0.5rem" }}>
                  {ep.desc}
                </p>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-gray-600)", background: "var(--color-gray-100)", padding: "0.4rem 0.8rem", borderRadius: "6px" }}>
                Filtros: <code>{ep.params}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Code Examples Playground */}
      <section style={{ marginBottom: "4rem" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Terminal size={22} />
          <span>Ejemplos de Integración</span>
        </h3>

        <div className="card card-glass" style={{ overflow: "hidden" }}>
          {/* Tab buttons */}
          <div style={{ display: "flex", background: "var(--color-gray-100)", borderBottom: "1px solid var(--color-gray-300)" }}>
            <button 
              onClick={() => setActiveTab("curl")}
              style={{ background: activeTab === "curl" ? "white" : "transparent", border: "none", borderRight: "1px solid var(--color-gray-300)", padding: "12px 20px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", color: activeTab === "curl" ? "var(--color-blue)" : "var(--color-gray-600)" }}
            >
              cURL
            </button>
            <button 
              onClick={() => setActiveTab("js")}
              style={{ background: activeTab === "js" ? "white" : "transparent", border: "none", borderRight: "1px solid var(--color-gray-300)", padding: "12px 20px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", color: activeTab === "js" ? "var(--color-blue)" : "var(--color-gray-600)" }}
            >
              JavaScript (Fetch)
            </button>
            <button 
              onClick={() => setActiveTab("python")}
              style={{ background: activeTab === "python" ? "white" : "transparent", border: "none", padding: "12px 20px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", color: activeTab === "python" ? "var(--color-blue)" : "var(--color-gray-600)" }}
            >
              Python
            </button>
          </div>

          {/* Code preview area */}
          <div style={{ padding: "1.5rem", background: "#1E1E2F", color: "#A9B2C3", overflowX: "auto" }}>
            <pre style={{ margin: 0, fontFamily: "var(--font-geist-mono), monospace", fontSize: "0.85rem", lineHeight: "1.5" }}>
              <code>
                {activeTab === "curl" && curlExample}
                {activeTab === "js" && jsExample}
                {activeTab === "python" && pythonExample}
              </code>
            </pre>
          </div>
        </div>
      </section>

    </div>
  );
}
