# Diario de Viajes — Documentación Técnica Completa

## Contexto para Claude

Este documento describe un proyecto de app móvil personal llamado "Diario de Viajes" desarrollado por Jorge (Uruguay). Jorge tiene experiencia previa en React/JavaScript pero es principiante en desarrollo móvil. El proyecto fue iniciado en Expo Snack y migrado a desarrollo local con Windsurf (IDE con IA). Se comunica en español.

**Preferencias de Jorge:**

- Recibir archivos completos en vez de ediciones parciales cuando hay muchos cambios acumulados
- Aclarar todos los requisitos antes de codificar
- Explicaciones en español

---

## Descripción General

App móvil de diario de viajes que permite importar fotos del dispositivo, organizarlas, editarles metadatos (GPS, fecha, notas) y visualizarlas en un mapa junto con rutas de viaje trazadas manualmente.

**Stack:**

- React Native con Expo (Bare Workflow — tiene carpeta `android/`)
- AsyncStorage para persistencia local
- `react-native-maps` para el mapa (actualmente con Google Maps — **pendiente migrar a MapLibre**)
- `expo-image-picker` para importar fotos
- `expo-location` para GPS del dispositivo

**Ubicación del proyecto:** `C:\dev\diario-de-viajes\`

**Estado actual:** Build nativo funcionando en emulador Android (Pixel 7, API 34). El mapa crashea por falta de Google Maps API key — está pendiente migrar a MapLibre + OpenStreetMap para eliminar esa dependencia.

---

## Estructura de Archivos

```
diario-de-viajes/
├── App.js                          # Entry point, navegación entre pantallas
├── theme.js                        # Colores, tipografía, espaciado, radios
├── almacenamiento.js               # Capa de persistencia (AsyncStorage)
├── index.js                        # Registro del componente raíz
├── app.json                        # Configuración Expo
├── android/                        # Carpeta nativa generada por expo prebuild
│   └── gradle/wrapper/gradle-wrapper.properties  # distributionUrl=gradle-8.13-bin.zip
├── components/
│   ├── GaleriaFotos.js             # Pantalla galería (~800 líneas)
│   └── mapa/
│       ├── MapaPrincipal.js        # Pantalla mapa (~230 líneas)
│       ├── RutasMapa.js            # Componentes de rutas en mapa (~250 líneas)
│       └── constantes.js           # TRANSPORTES, colores, iconos
├── src/
│   ├── components/
│   │   └── galeria/
│   │       ├── ModalEditar.js      # Modal edición de metadatos de foto
│   │       └── ModalGPS.js         # Modal selector de ubicación en mapa
│   ├── hooks/
│   │   ├── useGaleria.js           # (no llegó a crearse — lógica inline en GaleriaFotos)
│   │   ├── useMapa.js              # Hook con lógica de datos del mapa
│   │   └── useRutas.js             # Hook con lógica de gestión de rutas
│   └── utils/
│       └── galeria.js              # Funciones puras: formatearFecha, extraerCarpeta, agrupar*
└── assets/
```

---

## Theme (theme.js)

```javascript
export const colores = {
  primario: "#FF6B6B", // Rojo coral
  secundario: "#4ECDC4", // Turquesa
  acento: "#FFE66D", // Amarillo
  fondoOscuro: "#1A1A2E",
  fondoMedio: "#16213E",
  fondoTarjeta: "#0F3460",
  textoBlanco: "#FFFFFF",
  textoGris: "#AAAAAA",
  textoSutil: "#555555",
  exito: "#4CAF50",
  error: "#FF4444",
  advertencia: "#FFA500",
  borde: "#333333",
};

export const tipografia = { titulo, subtitulo, cuerpo, pequeño };
export const espaciado = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radios = { sm: 8, md: 12, lg: 20, xl: 28, redondo: 999 };
```

---

## Almacenamiento (almacenamiento.js)

Capa centralizada de AsyncStorage. Claves: `fotos_v2`, `rutas_v1`.

**Funciones de fotos:**

- `obtenerFotos()` → array de fotos
- `guardarFotos(fotos)` → boolean
- `agregarFotos(nuevasFotos)` → array completo actualizado
- `actualizarFoto(id, cambios)` → foto actualizada
- `eliminarFoto(id)` → boolean
- `exportarBackup()` → JSON string
- `importarBackup(json)` → boolean

**Funciones de rutas:**

- `obtenerRutas()` → array de rutas
- `guardarRuta(ruta)` → ruta nueva con id generado
- `eliminarRuta(id)` → boolean
- `actualizarRuta(id, cambios)` → ruta actualizada

**Estructura de una foto:**

```javascript
{
  id: string,           // Date.now() + random
  uri: string,          // URI local del dispositivo
  nombreArchivo: string,
  carpeta: string,      // extraído del URI
  fecha: string,        // ISO string
  latitud: number|null,
  longitud: number|null,
  nota: string,
  ancho: number,
  alto: number,
  tamaño: number,       // bytes
}
```

**Estructura de una ruta:**

```javascript
{
  id: string,
  nombre: string,
  transporte: string,   // id de TRANSPORTES
  puntos: [{ latitude, longitude }],
  fecha: string,        // ISO string
}
```

---

## App.js

Navegación simple con dos pantallas: Mapa y Galería. Barra de navegación inferior con emojis.

```javascript
const PANTALLAS = { MAPA: "mapa", GALERIA: "galeria" };
// Renderiza MapaPrincipal o GaleriaFotos según pantalla activa
```

---

## Constantes del Mapa (constantes.js)

```javascript
export const TRANSPORTES = [
  { id: 'caminando', nombre: 'Caminando', icono: '🚶', color: '#4CAF50' },
  { id: 'bicicleta', nombre: 'Bicicleta', icono: '🚲', color: '#FFD600' },
  { id: 'auto',      nombre: 'Auto',      icono: '🚗', color: '#2196F3' },
  { id: 'publico',   nombre: 'Transporte público', icono: '🚌', color: '#FF9800' },
  { id: 'barco',     nombre: 'Barco',     icono: '⛵', color: '#00BCD4' },
  { id: 'avion',     nombre: 'Avión',     icono: '✈️', color: '#9C27B0' },
];
export function colorTransporte(id) { ... }
export function iconoTransporte(id) { ... }
export function nombreTransporte(id) { ... }
```

---

## Hook: useMapa (src/hooks/useMapa.js)

Maneja la lógica de datos del mapa: cargar fotos con GPS, cargar rutas, obtener ubicación del dispositivo.

**Estado que maneja:**

- `fotosConGPS` — fotos filtradas que tienen latitud y longitud
- `rutas` / `setRutas`
- `cargando`, `regionInicial`
- `miUbicacion`, `buscandoUbicacion`

**Funciones:**

- `cargarDatos()` — carga fotos y rutas desde AsyncStorage
- `irAMiUbicacion()` — solicita permisos GPS y retorna coords

**Retorna:** todos los estados + setRutas + cargarDatos + irAMiUbicacion

---

## Hook: useRutas (src/hooks/useRutas.js)

Maneja la lógica de creación, edición y eliminación de rutas.

**Parámetros de entrada:** `{ rutas, setRutas, puntosRuta, setPuntosRuta, setModoRuta, rutaSeleccionada, setRutaSeleccionada, setModalVerRuta }`

**Estado local:**

- `modalTransporte`, `modalNombre`, `modalEditarRuta`
- `transporteSeleccionado`, `nombreRuta`
- `editNombre`, `editTransporte`

**Funciones:**

- `confirmarPuntos()` — valida mínimo 2 puntos y abre modal transporte
- `seleccionarTransporte(t)` — guarda transporte y abre modal nombre
- `finalizarRuta()` — guarda la ruta en AsyncStorage
- `abrirEditar(ruta)` — prepara estado de edición
- `guardarEdicion()` — actualiza ruta en AsyncStorage
- `handleEliminar(id)` — elimina ruta con confirmación Alert

---

## MapaPrincipal.js

Usa `useMapa()` para datos y tiene estado de UI propio.

**Estado de UI (local):**

- `fotoAmpliada`, `indiceAmpliada` — foto en pantalla completa
- `mostrarRutas`, `mostrarFotos` — toggles de visibilidad
- `modoRuta`, `puntosRuta` — creación de nueva ruta
- `rutaSeleccionada`, `modalVerRuta` — ver detalle de ruta existente

**Funciones locales:**

- `handlePressMapa` / `handleLongPressMapa` — agregan puntos al crear ruta
- `handleLongPressFoto(foto)` — agrega ubicación de foto como punto de ruta
- `abrirFoto(foto)` — abre foto en pantalla completa
- `handleIrAMiUbicacion()` — wrapper de irAMiUbicacion del hook

**Render:** MapView con marcadores de fotos (pinColor primario), marcador de ubicación propia (azul), RutasEnMapa, RutasUI, botones flotantes, modal de foto ampliada.

**⚠️ PROBLEMA PENDIENTE:** Actualmente usa `PROVIDER_DEFAULT` (Google Maps) que requiere API key. **Pendiente migrar a MapLibre** para eliminar dependencia de Google y habilitar uso offline.

---

## RutasMapa.js

Tiene dos exports:

**`RutasEnMapa`** — elementos que van DENTRO del MapView:

- Polylines de rutas guardadas (con color por transporte, lineDashPattern para avión)
- Marcador de inicio de cada ruta (círculo con ícono del transporte)
- Polyline de ruta en construcción (punteada gris)
- Marcadores numerados de puntos en construcción

**`RutasUI`** — elementos FUERA del MapView:

- Barra inferior de modo creación (con botón deshacer, cancelar, confirmar)
- Modal elegir transporte
- Modal nombre de ruta
- Modal ver detalle de ruta (con botones editar/eliminar)
- Modal editar ruta (nombre + transporte)
- Usa `useRutas()` internamente para toda la lógica

**Props que recibe RutasUI:** `rutas, setRutas, modoRuta, setModoRuta, puntosRuta, setPuntosRuta, rutaSeleccionada, setRutaSeleccionada, modalVerRuta, setModalVerRuta`

---

## GaleriaFotos.js

Pantalla principal de galería (~800 líneas). La lógica quedó inline (el hook `useGaleria` no llegó a crearse).

**Vistas:**

- `fecha` — fotos agrupadas por día, ordenadas de más nueva a más vieja
- `carpetas` — grid de carpetas con preview 2x2
- `carpeta_detalle` — fotos de una carpeta agrupadas por fecha

**Funcionalidades:**

- Importar fotos múltiples con `expo-image-picker`, detecta duplicados por URI/nombre/dimensiones
- Lee EXIF automáticamente (GPS y fecha)
- Modo selección múltiple (long press) para eliminar en lote
- Edición de metadatos: fecha (AAAA-MM-DD), latitud, longitud, nota
- Selector de ubicación en mapa interactivo (ModalGPS)
- Al asignar GPS a una foto, ofrece aplicar a otras fotos sin GPS (Elegir fotos / Aplicar a todas)
- Navegación con swipe entre fotos (FlatList horizontal paginada)
- Modal de detalles (fecha, GPS, carpeta, dimensiones, tamaño, nota)
- Badge 📍 en miniaturas (naranja si no tiene GPS, transparente si tiene)

**Modales separados:**

- `ModalEditar` (src/components/galeria/ModalEditar.js)
- `ModalGPS` (src/components/galeria/ModalGPS.js)

---

## Utils de Galería (src/utils/galeria.js)

Funciones puras sin estado:

- `formatearFecha(fechaStr)` → string en formato "15 de junio de 2024"
- `extraerCarpeta(uri)` → nombre de carpeta del URI, ignorando nombres genéricos
- `agruparPorFecha(fotos)` → `[['15 de junio...', [foto, foto]], ...]` ordenado desc
- `agruparPorCarpeta(fotos)` → `[['NombreCarpeta', [foto, foto]], ...]` ordenado alfa

⚠️ Nota: estas funciones también siguen definidas localmente en GaleriaFotos.js. El import desde utils quedó pendiente de limpiar.

---

## Modales de Galería

### ModalEditar.js

Modal sheet (bottom) para editar metadatos de una foto.

**Props:** `visible, fotoEditando, editFecha, editNota, editLat, editLng, ubicacionTemp, onChangeFecha, onChangeNota, onChangeLat, onChangeLng, onGuardar, onCancelar, onAbrirMapaGPS`

### ModalGPS.js

Modal fullscreen con MapView para elegir ubicación tocando el mapa.

**Props:** `visible, ubicacionTemp, onSeleccionarUbicacion, onConfirmar, onCancelar`

---

## Configuración de Build

**Plataforma:** Android (Expo Bare Workflow)
**Gradle:** 8.13 (`android/gradle/wrapper/gradle-wrapper.properties`)
**minSdk:** 24, **compileSdk:** 36, **targetSdk:** 36
**Package name:** `com.anonymous.snackeb118057893947c2bd0a1959e6b90602` (pendiente cambiar)

**Comandos:**

```powershell
cd C:\dev\diario-de-viajes
npx expo run:android        # Compila y lanza en emulador/dispositivo
npx expo prebuild --platform android  # Regenera carpeta android/
```

**Emulador configurado:** Pixel 7, API 34 (Android 14)

---

## Limitaciones Conocidas y Pendientes

| #   | Problema                                                    | Estado                                         |
| --- | ----------------------------------------------------------- | ---------------------------------------------- |
| 1   | Google Maps API key requerida — app crashea en build nativo | **Pendiente migrar a MapLibre**                |
| 2   | Package name tiene nombre de Snack genérico                 | Pendiente cambiar                              |
| 3   | Las funciones utils siguen duplicadas en GaleriaFotos.js    | Pendiente limpiar import                       |
| 4   | `useGaleria` hook no llegó a crearse                        | Lógica inline en GaleriaFotos.js, aceptable    |
| 5   | Escritura de EXIF permanente no implementada                | Requiere librería nativa (objetivo futuro)     |
| 6   | Marcadores de foto en mapa sin thumbnail                    | Limitación de Expo Go, posible en build nativo |

---

## Próximos Pasos Planificados

1. **Migrar mapa a MapLibre** — eliminar dependencia de Google Maps
   - Desinstalar `react-native-maps`
   - Instalar `@maplibre/maplibre-react-native`
   - Reescribir `MapaPrincipal.js` y `RutasMapa.js`
   - Configurar tiles de OpenStreetMap (online) o tiles locales (offline)

2. **Escritura de EXIF permanente** — el objetivo principal de la migración a bare workflow
   - Requiere librería como `react-native-exif` o módulo nativo propio

3. **Cambiar package name** a algo más prolijo como `com.jorgedev.diarioviajes`

---

## Historial de Decisiones Importantes

- **Reinicio desde cero a mitad del desarrollo** — para reducir complejidad acumulada. Se aprendió separación de responsabilidades en ese proceso.
- **Eliminación de sección "Lista"** de la navegación — simplificación de scope.
- **Restricción del mapa** — los marcadores de foto solo muestran fotos que ya están en la galería, no se pueden importar directamente desde el mapa.
- **Separación RutasEnMapa/RutasUI** — aprendida después de un bug de pantalla en blanco por mezclar elementos de MapView con elementos de UI.
- **Migración a Expo Bare Workflow** — para acceder a APIs nativas y poder escribir EXIF permanentemente.
- \*\*Proyecto movido de OneDrive a C:\dev\*\* — por límite de 260 caracteres en rutas de Windows que rompía la compilación nativa.
