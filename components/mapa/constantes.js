export const TRANSPORTES = [
  { id: "caminando", nombre: "Caminando", icono: "🚶", color: "#4CAF50" },
  { id: "bicicleta", nombre: "Bicicleta", icono: "🚲", color: "#FFD600" },
  { id: "auto", nombre: "Auto", icono: "🚗", color: "#2196F3" },
  {
    id: "publico",
    nombre: "Transporte público",
    icono: "🚌",
    color: "#FF9800",
  },
  { id: "barco", nombre: "Barco", icono: "⛵", color: "#00BCD4" },
  { id: "avion", nombre: "Avión", icono: "✈️", color: "#9C27B0" },
];

export function colorTransporte(id) {
  return TRANSPORTES.find((t) => t.id === id)?.color || "#FF6B6B";
}

export function iconoTransporte(id) {
  return TRANSPORTES.find((t) => t.id === id)?.icono || "📍";
}

export function nombreTransporte(id) {
  return TRANSPORTES.find((t) => t.id === id)?.nombre || "Desconocido";
}
