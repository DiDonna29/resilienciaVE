# RESILIENCIA VZLA — Contexto del Agente Frontend

> **IMPORTANTE**: Este archivo debe ser actualizado por cualquier agente de IA o desarrollador que modifique la UI, agregue páginas/rutas, edite los estilos globales o actualice los servicios de consumo del frontend.

---

## 1. Arquitectura & Stack Técnico
El frontend está desarrollado con:
* **Next.js 16.2.9 (App Router)**
* **TypeScript** para un desarrollo tipado y seguro.
* **Axios** como cliente HTTP con interceptores automáticos para la inyección de tokens JWT y refresco automático de tokens caducados.
* **Zustand** para la gestión ligera y persistente de la autenticación de usuarios.
* **CSS Nativo (`globals.css`)** para lograr un diseño responsivo móvil-primero premium, estilizado con glassmorphism, degradados limpios, micro-animaciones en hover y transiciones fluidas.

---

## 2. Identidad Visual (Colores del Sistema)
* **Amarillo (`--color-yellow: #FCE300`)**: Usado para alertas de sismos moderados, badges informativos y advertencias.
* **Azul (`--color-blue: #003DA5`)**: Usado para la barra de navegación, cabeceras de sección, botones secundarios y paneles de información.
* **Rojo (`--color-red: #EF3340`)**: Usado para botones principales de llamadas a la acción, reportes de emergencia, alertas críticas y badges semáforos urgentes.
* **Fondo Blanco/Gris Claro**: Utilizado en el layout para asegurar legibilidad en condiciones de luz diurna y emergencias.

---

## 3. Estado del Proyecto
* **Compilación y Construcción**:
  * Ejecutar `pnpm run build` compila con **cero errores de TypeScript, imports u optimización**.
  * Todas las páginas estáticas y dinámicas se pre-renderizan correctamente.
* **Modelos y Tipos**:
  * Las interfaces TypeScript definidas en `core/models/` están completamente sincronizadas con los esquemas del backend de Django REST Framework (por ejemplo, el modelo de `MissingPerson`, `RescueZone`, `HealthCenter`, `Shelter`, entre otros).
* **Integración del Mapa (`MapViewer`)**:
  * El componente `MapViewer` está optimizado para renderizar marcadores interactivos (sismos, desaparecidos, zonas de rescate) en base a coordenadas.

---

## 4. Comandos de Inicialización (Frontend)
1. **Instalar Dependencias**:
   ```bash
   pnpm install
   ```
2. **Iniciar Servidor de Desarrollo**:
   ```bash
   pnpm run dev
   ```
   El frontend estará disponible en: [http://localhost:3000](http://localhost:3000)
3. **Compilar para Producción**:
   ```bash
   pnpm run build
   ```
4. **Iniciar Servidor en Producción**:
   ```bash
   pnpm run start
   ```

---

## 5. Estructura de Páginas (Rutas)
* `/` - Módulo principal con accesos directos rápidos a todas las herramientas de respuesta.
* `/auth/login` & `/auth/register` - Autenticación y registro manual con cédula venezolana.
* `/seismology` - Reporte y visor interactivo de sismos de la USGS y TerraQuake.
* `/missing-people` - Registro, búsqueda y verificación de personas desaparecidas.
* `/rescue-zones` - Mapa de zonas de rescate activas y llamado de voluntarios.
* `/health-network` - Red de hospitales nacionales y suministros médicos faltantes.
* `/shelters` - Ocupación de refugios en tiempo real.
* `/allies` - Organizaciones aliadas y donantes autorizados.
* `/crisis-directory` - Sitios web, redes y números telefónicos de emergencia oficiales.
* `/open-data` - Consola API pública con acceso a datos en formato JSON para desarrolladores y medios.
