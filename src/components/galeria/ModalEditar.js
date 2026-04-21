import React from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { colores, radios, espaciado } from "../../../theme";

const s = {
  fondoModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  tarjeta: {
    backgroundColor: colores.fondoMedio,
    borderTopLeftRadius: radios.xl,
    borderTopRightRadius: radios.xl,
    padding: espaciado.lg,
    paddingBottom: 40,
  },
  tarjetaTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: colores.textoBlanco,
    marginBottom: 16,
  },
  prevEditar: {
    width: "100%",
    height: 160,
    borderRadius: radios.md,
    marginBottom: 16,
  },
  labelInput: {
    color: colores.textoGris,
    fontSize: 12,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colores.fondoTarjeta,
    color: colores.textoBlanco,
    borderRadius: radios.md,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colores.borde,
    marginBottom: 4,
  },
  botonMapa: {
    backgroundColor: colores.fondoTarjeta,
    borderRadius: radios.md,
    padding: 12,
    alignItems: "center",
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colores.secundario,
  },
  botonMapaTexto: { color: colores.secundario, fontWeight: "bold" },
  coordsTemp: {
    color: colores.primario,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  filaAcciones: { flexDirection: "row", gap: 12, marginTop: 16 },
  botonCancelar: {
    flex: 1,
    backgroundColor: colores.borde,
    borderRadius: radios.md,
    padding: 14,
    alignItems: "center",
  },
  botonGuardar: {
    flex: 1,
    backgroundColor: colores.primario,
    borderRadius: radios.md,
    padding: 14,
    alignItems: "center",
  },
  botonTexto: { color: "#fff", fontWeight: "bold", fontSize: 15 },
};

export default function ModalEditar({
  visible,
  fotoEditando,
  editFecha,
  editNota,
  editLat,
  editLng,
  ubicacionTemp,
  onChangeFecha,
  onChangeNota,
  onChangeLat,
  onChangeLng,
  onGuardar,
  onCancelar,
  onAbrirMapaGPS,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.fondoModal}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={s.tarjeta}>
            <Text style={s.tarjetaTitulo}>✏️ Editar metadatos</Text>
            {fotoEditando && (
              <Image
                source={{ uri: fotoEditando.uri }}
                style={s.prevEditar}
                resizeMode="cover"
              />
            )}
            <Text style={s.labelInput}>📅 Fecha (AAAA-MM-DD)</Text>
            <TextInput
              style={s.input}
              value={editFecha}
              onChangeText={onChangeFecha}
              placeholder="2024-06-15"
              placeholderTextColor={colores.textoSutil}
            />
            <Text style={s.labelInput}>📍 Latitud</Text>
            <TextInput
              style={s.input}
              value={editLat}
              onChangeText={onChangeLat}
              placeholder="-34.9011"
              placeholderTextColor={colores.textoSutil}
              keyboardType="numeric"
            />
            <Text style={s.labelInput}>📍 Longitud</Text>
            <TextInput
              style={s.input}
              value={editLng}
              onChangeText={onChangeLng}
              placeholder="-56.1645"
              placeholderTextColor={colores.textoSutil}
              keyboardType="numeric"
            />
            <TouchableOpacity style={s.botonMapa} onPress={onAbrirMapaGPS}>
              <Text style={s.botonMapaTexto}>
                🗺️ Elegir ubicación en el mapa
              </Text>
            </TouchableOpacity>
            {ubicacionTemp && (
              <Text style={s.coordsTemp}>
                📍 {ubicacionTemp.latitude.toFixed(4)},{" "}
                {ubicacionTemp.longitude.toFixed(4)}
              </Text>
            )}
            <Text style={s.labelInput}>💬 Nota (opcional)</Text>
            <TextInput
              style={[s.input, { height: 80, textAlignVertical: "top" }]}
              value={editNota}
              onChangeText={onChangeNota}
              placeholder="Añadí una nota..."
              placeholderTextColor={colores.textoSutil}
              multiline
            />
            <View style={s.filaAcciones}>
              <TouchableOpacity style={s.botonCancelar} onPress={onCancelar}>
                <Text style={s.botonTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.botonGuardar} onPress={onGuardar}>
                <Text style={s.botonTexto}>Guardar ✅</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
