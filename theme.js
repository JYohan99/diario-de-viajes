// Cambiá los colores aquí y se actualizan en toda la app
export const colores = {
  // Colores principales
  primario: "#FF6B6B", // Rojo coral — botones principales, acentos
  secundario: "#4ECDC4", // Turquesa — botones secundarios
  acento: "#FFE66D", // Amarillo — destacados

  // Fondos
  fondoOscuro: "#1A1A2E", // Fondo principal
  fondoMedio: "#16213E", // Encabezados, barras
  fondoTarjeta: "#0F3460", // Tarjetas, inputs

  // Textos
  textoBlanco: "#FFFFFF",
  textoGris: "#AAAAAA",
  textoSutil: "#555555",

  // Estados
  exito: "#4CAF50",
  error: "#FF4444",
  advertencia: "#FFA500",

  // Bordes
  borde: "#333333",
};

export const tipografia = {
  titulo: { fontSize: 22, fontWeight: "bold", color: colores.textoBlanco },
  subtitulo: { fontSize: 16, fontWeight: "600", color: colores.textoBlanco },
  cuerpo: { fontSize: 14, color: colores.textoGris },
  pequeño: { fontSize: 12, color: colores.textoSutil },
};

export const espaciado = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radios = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  redondo: 999,
};
