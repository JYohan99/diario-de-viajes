import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { colores, radios } from "../../theme";
import useMapa from "../../src/hooks/useMapa";
import { RutasEnMapa, RutasUI } from "./RutasMapa";

const { width, height } = Dimensions.get("window");

export default function MapaPrincipal() {
  const mapRef = useRef(null);
  const {
    fotosConGPS,
    rutas,
    setRutas,
    cargando,
    regionInicial,
    miUbicacion,
    buscandoUbicacion,
    cargarDatos,
    irAMiUbicacion,
  } = useMapa();

  // Estados de UI que quedan en el componente
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [indiceAmpliada, setIndiceAmpliada] = useState(0);
  const [mostrarRutas, setMostrarRutas] = useState(true);
  const [mostrarFotos, setMostrarFotos] = useState(true);
  const [modoRuta, setModoRuta] = useState(false);
  const [puntosRuta, setPuntosRuta] = useState([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [modalVerRuta, setModalVerRuta] = useState(false);

  function handlePressMapa(e) {
    if (!modoRuta) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (!latitude || !longitude) return;
    setPuntosRuta((prev) => [...prev, { latitude, longitude }]);
  }

  function handleLongPressMapa(e) {
    if (!modoRuta) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (!latitude || !longitude) return;
    setPuntosRuta((prev) => [...prev, { latitude, longitude }]);
  }

  function handleLongPressFoto(foto) {
    if (!modoRuta) return;
    setPuntosRuta((prev) => [
      ...prev,
      { latitude: foto.latitud, longitude: foto.longitud },
    ]);
  }

  function abrirFoto(foto) {
    if (modoRuta) return;
    const indice = fotosConGPS.findIndex((f) => f.id === foto.id);
    setIndiceAmpliada(indice >= 0 ? indice : 0);
    setFotoAmpliada(foto);
  }

  function handleIrAMiUbicacion() {
    irAMiUbicacion();
  }

  if (cargando || !regionInicial) {
    return (
      <View style={s.centrado}>
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={s.textoCargando}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={s.contenedor}>
      <MapView
        ref={mapRef}
        style={s.mapa}
        provider={null}
        initialRegion={regionInicial}
        onPress={handlePressMapa}
        onLongPress={handleLongPressMapa}
      >
        {/* Rutas */}
        <RutasEnMapa
          rutas={rutas}
          mostrarRutas={mostrarRutas}
          modoRuta={modoRuta}
          puntosRuta={puntosRuta}
          onPresarRuta={(ruta) => {
            setRutaSeleccionada(ruta);
            setModalVerRuta(true);
          }}
        />

        {/* Marcadores fotos */}
        {mostrarFotos &&
          fotosConGPS.map((foto) => (
            <Marker
              key={foto.id}
              coordinate={{ latitude: foto.latitud, longitude: foto.longitud }}
              pinColor={colores.primario}
              title="📷 Foto"
              description={
                foto.fecha
                  ? new Date(foto.fecha).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Sin fecha"
              }
              onPress={() => abrirFoto(foto)}
              onCalloutPress={() => abrirFoto(foto)}
              tracksViewChanges={false}
            />
          ))}

        {/* Mi ubicación */}
        {miUbicacion && (
          <Marker
            coordinate={miUbicacion}
            pinColor="#4285F4"
            title="📍 Mi ubicación"
            tracksViewChanges={false}
          />
        )}
      </MapView>

      <RutasUI
        rutas={rutas}
        setRutas={setRutas}
        modoRuta={modoRuta}
        setModoRuta={setModoRuta}
        puntosRuta={puntosRuta}
        setPuntosRuta={setPuntosRuta}
        rutaSeleccionada={rutaSeleccionada}
        setRutaSeleccionada={setRutaSeleccionada}
        modalVerRuta={modalVerRuta}
        setModalVerRuta={setModalVerRuta}
      />

      {/* Contador */}
      <View style={s.contador}>
        <Ionicons name="images-outline" size={14} color={colores.textoBlanco} />
        <Text style={s.contadorTexto}>
          {" "}
          {fotosConGPS.length} fotos · {rutas.length} rutas
        </Text>
      </View>

      {/* Botones derecha */}
      <View style={s.botonesDerechaTop}>
        <TouchableOpacity style={s.botonFlotante} onPress={cargarDatos}>
          <Ionicons name="refresh" size={20} color={colores.primario} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.botonFlotante}
          onPress={handleIrAMiUbicacion}
          disabled={buscandoUbicacion}
        >
          {buscandoUbicacion ? (
            <ActivityIndicator size="small" color={colores.primario} />
          ) : (
            <Ionicons name="locate" size={20} color={colores.primario} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            s.botonFlotante,
            mostrarFotos && { backgroundColor: colores.primario },
          ]}
          onPress={() => setMostrarFotos(!mostrarFotos)}
        >
          <Ionicons
            name="images-outline"
            size={20}
            color={mostrarFotos ? "#fff" : colores.primario}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            s.botonFlotante,
            mostrarRutas && { backgroundColor: colores.primario },
          ]}
          onPress={() => setMostrarRutas(!mostrarRutas)}
        >
          <Ionicons
            name="git-merge-outline"
            size={20}
            color={mostrarRutas ? "#fff" : colores.primario}
          />
        </TouchableOpacity>
      </View>

      {/* Botón nueva ruta — solo si no estamos en modo ruta */}
      {!modoRuta && (
        <TouchableOpacity
          style={s.botonNuevaRuta}
          onPress={() => {
            setModoRuta(true);
            setPuntosRuta([]);
          }}
        >
          <Ionicons name="git-merge-outline" size={18} color="#fff" />
          <Text style={s.botonNuevaRutaTexto}>Nueva ruta</Text>
        </TouchableOpacity>
      )}

      {/* Aviso sin fotos */}
      {fotosConGPS.length === 0 && rutas.length === 0 && (
        <View style={s.aviso}>
          <Text style={s.avisoTitulo}>📍 Mapa vacío</Text>
          <Text style={s.avisoSubtitulo}>
            Importá fotos con GPS desde la Galería para verlas aquí
          </Text>
        </View>
      )}

      {/* Modal foto ampliada */}
      <Modal visible={!!fotoAmpliada} transparent={false} animationType="fade">
        <View style={s.fondoFoto}>
          {fotoAmpliada && (
            <>
              <FlatList
                data={fotosConGPS}
                keyExtractor={(f) => f.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={indiceAmpliada}
                getItemLayout={(_, i) => ({
                  length: width,
                  offset: width * i,
                  index: i,
                })}
                onMomentumScrollEnd={(e) => {
                  const i = Math.round(e.nativeEvent.contentOffset.x / width);
                  setIndiceAmpliada(i);
                  setFotoAmpliada(fotosConGPS[i]);
                }}
                renderItem={({ item }) => (
                  <View
                    style={{
                      width,
                      height: height - 90,
                      justifyContent: "center",
                    }}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      style={s.fotoCompleta}
                      resizeMode="contain"
                    />
                  </View>
                )}
              />
              {fotosConGPS.length > 1 && (
                <View style={s.contadorNav}>
                  <Text style={s.contadorNavTexto}>
                    {indiceAmpliada + 1} / {fotosConGPS.length}
                  </Text>
                </View>
              )}
              <View style={s.franjaInferior}>
                <TouchableOpacity
                  style={s.botonCerrar}
                  onPress={() => setFotoAmpliada(null)}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={28}
                    color={colores.textoGris}
                  />
                  <Text style={s.textoFranja}>Cerrar</Text>
                </TouchableOpacity>
                <View style={s.infoFranja}>
                  <Text style={s.infoFecha}>
                    📅{" "}
                    {fotoAmpliada.fecha
                      ? new Date(fotoAmpliada.fecha).toLocaleDateString(
                          "es-ES",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          },
                        )
                      : "Sin fecha"}
                  </Text>
                  <Text style={s.infoGPS}>
                    📍 {Number(fotoAmpliada.latitud).toFixed(4)},{" "}
                    {Number(fotoAmpliada.longitud).toFixed(4)}
                  </Text>
                  {fotoAmpliada.nota ? (
                    <Text style={s.infoNota}>💬 {fotoAmpliada.nota}</Text>
                  ) : null}
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { flex: 1 },
  mapa: { flex: 1 },
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.fondoOscuro,
  },
  textoCargando: { color: colores.textoGris, marginTop: 12, fontSize: 14 },
  contador: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radios.redondo,
  },
  contadorTexto: { color: colores.textoBlanco, fontSize: 12 },
  botonesDerechaTop: {
    position: "absolute",
    top: 16,
    right: 16,
    gap: 8,
  },
  botonFlotante: {
    width: 44,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  botonNuevaRuta: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colores.primario,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radios.redondo,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  botonNuevaRutaTexto: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  aviso: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: colores.fondoMedio,
    borderRadius: radios.lg,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colores.borde,
  },
  avisoTitulo: {
    color: colores.textoBlanco,
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },
  avisoSubtitulo: {
    color: colores.textoGris,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  fondoFoto: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "space-between",
  },
  fotoCompleta: { width, height: height - 90 },
  contadorNav: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contadorNavTexto: { color: "#fff", fontSize: 13 },
  franjaInferior: {
    height: 90,
    backgroundColor: colores.fondoMedio,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    paddingHorizontal: 12,
    gap: 12,
  },
  botonCerrar: { alignItems: "center" },
  textoFranja: { color: colores.textoGris, fontSize: 11, marginTop: 4 },
  infoFranja: { flex: 1, gap: 4 },
  infoFecha: { color: colores.textoBlanco, fontSize: 13 },
  infoGPS: { color: colores.secundario, fontSize: 12 },
  infoNota: { color: colores.textoGris, fontSize: 12, fontStyle: "italic" },
});
