import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { colores } from "./theme";
import GaleriaFotos from "./components/GaleriaFotos";
import MapaPrincipal from "./components/mapa/MapaPrincipal";

const PANTALLAS = { MAPA: "mapa", GALERIA: "galeria" };

export default function App() {
  const [pantalla, setPantalla] = useState(PANTALLAS.MAPA);

  function renderizarPantalla() {
    switch (pantalla) {
      case PANTALLAS.MAPA:
        return <MapaPrincipal />;
      case PANTALLAS.GALERIA:
        return <GaleriaFotos />;
    }
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.tituloApp}>📸 Diario de Viajes</Text>
      </View>
      <View style={styles.contenido}>{renderizarPantalla()}</View>
      <View style={styles.barraNavegacion}>
        {[
          { id: PANTALLAS.MAPA, icono: "🗺️", etiqueta: "Mapa" },
          { id: PANTALLAS.GALERIA, icono: "🖼️", etiqueta: "Galería" },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.botonNav,
              pantalla === item.id && styles.botonNavActivo,
            ]}
            onPress={() => setPantalla(item.id)}
          >
            <Text style={styles.iconoNav}>{item.icono}</Text>
            <Text
              style={[
                styles.etiquetaNav,
                pantalla === item.id && styles.etiquetaActiva,
              ]}
            >
              {item.etiqueta}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondoOscuro },
  encabezado: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colores.fondoMedio,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  tituloApp: { fontSize: 20, fontWeight: "bold", color: colores.textoBlanco },
  contenido: { flex: 1 },
  barraNavegacion: {
    flexDirection: "row",
    backgroundColor: colores.fondoMedio,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    paddingVertical: 8,
  },
  botonNav: { flex: 1, alignItems: "center", paddingVertical: 4 },
  botonNavActivo: { borderTopWidth: 2, borderTopColor: colores.primario },
  iconoNav: { fontSize: 22 },
  etiquetaNav: { fontSize: 11, color: colores.textoGris, marginTop: 2 },
  etiquetaActiva: { color: colores.primario, fontWeight: "bold" },
});
