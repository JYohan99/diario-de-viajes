import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { colores } from "../../../theme";

const s = {
  contenedor: { flex: 1, backgroundColor: colores.fondoOscuro },
  encabezadoGPS: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
    backgroundColor: colores.fondoMedio,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  volverGPS: { color: colores.primario, fontSize: 16, fontWeight: "bold" },
  tituloGPS: { color: colores.textoBlanco, fontSize: 16, fontWeight: "bold" },
  instruccionGPS: {
    color: colores.textoGris,
    fontSize: 13,
    textAlign: "center",
    padding: 10,
    backgroundColor: colores.fondoOscuro,
  },
  barraCoords: {
    backgroundColor: colores.fondoMedio,
    padding: 12,
    alignItems: "center",
  },
  textoCoordsGPS: { color: colores.primario, fontSize: 14, fontWeight: "bold" },
};

export default function ModalGPS({
  visible,
  ubicacionTemp,
  onSeleccionarUbicacion,
  onConfirmar,
  onCancelar,
}) {
  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <View style={s.contenedor}>
        <View style={s.encabezadoGPS}>
          <TouchableOpacity onPress={onCancelar}>
            <Text style={s.volverGPS}>‹ Cancelar</Text>
          </TouchableOpacity>
          <Text style={s.tituloGPS}>Elegir ubicación</Text>
          <TouchableOpacity onPress={onConfirmar} disabled={!ubicacionTemp}>
            <Text style={[s.volverGPS, !ubicacionTemp && { opacity: 0.4 }]}>
              Confirmar
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={s.instruccionGPS}>
          Tocá el mapa para marcar la ubicación
        </Text>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: ubicacionTemp?.latitude || -34.9011,
            longitude: ubicacionTemp?.longitude || -56.1645,
            latitudeDelta: 5,
            longitudeDelta: 5,
          }}
          onPress={onSeleccionarUbicacion}
        >
          {ubicacionTemp && (
            <Marker coordinate={ubicacionTemp} pinColor={colores.primario} />
          )}
        </MapView>
        {ubicacionTemp && (
          <View style={s.barraCoords}>
            <Text style={s.textoCoordsGPS}>
              📍 {ubicacionTemp.latitude.toFixed(4)},{" "}
              {ubicacionTemp.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
