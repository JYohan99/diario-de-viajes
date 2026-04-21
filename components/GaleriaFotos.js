import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { colores, tipografia, espaciado, radios } from "../theme";
import {
  obtenerFotos,
  agregarFotos,
  actualizarFoto,
  eliminarFoto,
} from "../almacenamiento";
import ModalEditar from "../src/components/galeria/ModalEditar";
import ModalGPS from "../src/components/galeria/ModalGPS";
import {
  formatearFecha,
  extraerCarpeta,
  agruparPorFecha,
  agruparPorCarpeta,
} from "../src/utils/galeria";

const { width, height } = Dimensions.get("window");
const TAM = (width - 2) / 3;

// ─── COMPONENTE PRINCIPAL ────────────────────────────────
export default function GaleriaFotos() {
  const [fotos, setFotos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("fecha");
  const [carpetaAbierta, setCarpetaAbierta] = useState(null);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [indiceAmpliada, setIndiceAmpliada] = useState(0);
  const [fotosNavegacion, setFotosNavegacion] = useState([]);
  const [modalDetalles, setModalDetalles] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [fotoEditando, setFotoEditando] = useState(null);
  const [modalGPS, setModalGPS] = useState(false);
  const [ubicacionTemp, setUbicacionTemp] = useState(null);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [modalAplicarGPS, setModalAplicarGPS] = useState(false);
  const [fotosParaGPS, setFotosParaGPS] = useState([]);
  const [seleccionadasGPS, setSeleccionadasGPS] = useState([]);
  const [ubicacionParaAplicar, setUbicacionParaAplicar] = useState(null);
  const [editFecha, setEditFecha] = useState("");
  const [editNota, setEditNota] = useState("");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    const datos = await obtenerFotos();
    setFotos(datos);
    setCargando(false);
  }

  // ─── IMPORTAR ──────────────────────────────────────────
  async function importarFotos() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería.");

      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 1,
      exif: true,
    });

    if (resultado.canceled) return;
    setCargando(true);
    const fotosActuales = await obtenerFotos();
    const nuevas = [];
    let duplicados = 0;
    for (const asset of resultado.assets) {
      const nombre = asset.uri.split("/").pop().split("?")[0].toLowerCase();

      const existe = fotosActuales.find(
        (f) =>
          f.uri === asset.uri ||
          f.nombreArchivo === nombre ||
          (f.ancho === asset.width &&
            f.alto === asset.height &&
            asset.width > 0 &&
            f.ancho > 0),
      );

      if (existe) {
        duplicados++;

        continue;
      }

      let lat = null,
        lng = null;

      if (asset.exif?.GPSLatitude) lat = asset.exif.GPSLatitude;
      if (asset.exif?.GPSLongitude) lng = asset.exif.GPSLongitude;
      let fecha = new Date().toISOString();
      if (asset.exif?.DateTimeOriginal) {
        try {
          const exifFecha = asset.exif.DateTimeOriginal.replace(
            /^(\d{4}):(\d{2}):(\d{2})/,

            "$1-$2-$3",
          );

          fecha = new Date(exifFecha).toISOString();
        } catch (_e) {
          /* fecha inválida ignorada */
        }
      }

      nuevas.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        uri: asset.uri,
        nombreArchivo: nombre,
        carpeta: extraerCarpeta(asset.uri),
        fecha,
        latitud: lat,
        longitud: lng,
        nota: "",
        ancho: asset.width || 0,
        alto: asset.height || 0,
        tamaño: asset.fileSize || 0,
      });
    }

    const todas = await agregarFotos(nuevas);
    setFotos(todas || fotosActuales);
    setCargando(false);

    if (nuevas.length === 0 && duplicados > 0) {
      Alert.alert(
        "⚠️ Sin cambios",

        `Las ${duplicados} foto(s) ya estaban en la galería.`,
      );
    } else {
      Alert.alert(
        "✅ Listo",

        duplicados > 0
          ? `${nuevas.length} foto(s) importada(s). ${duplicados} duplicada(s) ignorada(s).`
          : `${nuevas.length} foto(s) importada(s).`,
      );
    }
  }

  // ─── SELECCIÓN MÚLTIPLE ────────────────────────────────
  function toggleSeleccion(id) {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function eliminarSeleccionadas() {
    Alert.alert(
      "¿Eliminar fotos?",

      `Se eliminarán ${seleccionadas.length} foto(s) de la app. No se borran de tu celular.`,

      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",

          onPress: async () => {
            let actuales = [...fotos];
            for (const id of seleccionadas) {
              await eliminarFoto(id);

              actuales = actuales.filter((f) => f.id !== id);
            }
            setFotos(actuales);
            setSeleccionadas([]);
            setModoSeleccion(false);
          },
        },
      ],
    );
  }

  // ─── EDITAR ────────────────────────────────────────────
  function abrirEditar(foto) {
    setFotoEditando(foto);
    setEditFecha(
      foto.fecha ? new Date(foto.fecha).toISOString().slice(0, 10) : "",
    );
    setEditNota(foto.nota || "");
    setEditLat(foto.latitud ? foto.latitud.toString() : "");
    setEditLng(foto.longitud ? foto.longitud.toString() : "");
    setUbicacionTemp(
      foto.latitud
        ? { latitude: foto.latitud, longitude: foto.longitud }
        : null,
    );
    setFotoAmpliada(null);
    setModalEditar(true);
  }

  async function guardarEdicion() {
    if (!fotoEditando) return;
    const lat = parseFloat(editLat);
    const lng = parseFloat(editLng);
    const cambios = {
      nota: editNota.trim(),
      latitud: !isNaN(lat) ? lat : null,
      longitud: !isNaN(lng) ? lng : null,
    };

    if (editFecha) {
      try {
        // Agregar mediodía local para evitar problema de zona horaria

        cambios.fecha = new Date(editFecha + "T12:00:00").toISOString();
      } catch (_e) {
        /* fecha inválida ignorada */
      }
    }

    const tieneNuevaUbicacion = !isNaN(lat) && !isNaN(lng);
    const fotoGuardadaId = fotoEditando.id;
    const actualizada = await actualizarFoto(fotoGuardadaId, cambios);

    if (actualizada) {
      setFotos((prev) =>
        prev.map((f) => (f.id === fotoGuardadaId ? actualizada : f)),
      );
    }
    setModalEditar(false);
    setFotoEditando(null);
    if (tieneNuevaUbicacion) {
      const otrasSinGPS = fotos.filter(
        (f) => f.id !== fotoGuardadaId && (!f.latitud || !f.longitud),
      );

      if (otrasSinGPS.length > 0) {
        Alert.alert(
          "📍 Aplicar ubicación",

          `¿Querés aplicar esta ubicación a otras fotos sin GPS? Hay ${otrasSinGPS.length} foto(s) sin ubicación.`,

          [
            { text: "No", style: "cancel" },
            {
              text: "Elegir fotos",
              onPress: () => {
                setFotosParaGPS(otrasSinGPS);
                setUbicacionParaAplicar({ latitud: lat, longitud: lng });
                setModalAplicarGPS(true);
              },
            },

            {
              text: "Aplicar a todas",

              onPress: async () => {
                let actuales = [...fotos];

                for (const f of otrasSinGPS) {
                  const act = await actualizarFoto(f.id, {
                    latitud: lat,

                    longitud: lng,
                  });

                  if (act)
                    actuales = actuales.map((x) => (x.id === f.id ? act : x));
                }

                setFotos(actuales);

                Alert.alert(
                  "✅ Listo",

                  `Ubicación aplicada a ${otrasSinGPS.length} foto(s).`,
                );
              },
            },
          ],
        );
      }
    }
  }

  async function eliminarUna(foto) {
    Alert.alert(
      "¿Eliminar foto?",

      "Se eliminará de la app, no de tu celular.",

      [
        { text: "Cancelar", style: "cancel" },

        {
          text: "Eliminar",

          style: "destructive",

          onPress: async () => {
            await eliminarFoto(foto.id);

            setFotos((prev) => prev.filter((f) => f.id !== foto.id));

            setFotoAmpliada(null);
          },
        },
      ],
    );
  }

  // ─── RENDER MINIATURA ──────────────────────────────────

  function renderMiniatura(foto) {
    const seleccionada = seleccionadas.includes(foto.id);

    const tieneGPS = foto.latitud && foto.longitud;

    return (
      <TouchableOpacity
        key={foto.id}
        style={[s.contenedorMini, seleccionada && s.miniSeleccionada]}
        onPress={() => {
          if (modoSeleccion) {
            toggleSeleccion(foto.id);
          } else {
            // Obtener las fotos en el orden visual actual

            let fotosOrdenadas = [];

            if (vista === "fecha") {
              agruparPorFecha(fotos).forEach(([_, grupo]) => {
                fotosOrdenadas = [...fotosOrdenadas, ...grupo];
              });
            } else if (vista === "carpeta_detalle" && carpetaAbierta) {
              const fotosCarpeta = fotos.filter(
                (f) => (f.carpeta || extraerCarpeta(f.uri)) === carpetaAbierta,
              );

              agruparPorFecha(fotosCarpeta).forEach(([_, grupo]) => {
                fotosOrdenadas = [...fotosOrdenadas, ...grupo];
              });
            } else {
              fotosOrdenadas = [...fotos];
            }

            const indice = fotosOrdenadas.findIndex((f) => f.id === foto.id);

            setIndiceAmpliada(indice >= 0 ? indice : 0);

            setFotosNavegacion(fotosOrdenadas);

            setFotoAmpliada(foto);
          }
        }}
        onLongPress={() => {
          if (!modoSeleccion) {
            setModoSeleccion(true);

            setSeleccionadas([foto.id]);
          }
        }}
        activeOpacity={0.8}
      >
        <Image source={{ uri: foto.uri }} style={s.miniatura} />

        {!modoSeleccion && (
          <View style={[s.badgeGPS, !tieneGPS && s.badgeSinGPS]}>
            <Text style={s.badgeTexto}>{tieneGPS ? "📍" : "📍?"}</Text>
          </View>
        )}

        {modoSeleccion && (
          <View style={[s.circulo, seleccionada && s.circuloActivo]}>
            {seleccionada && <Text style={s.checkTexto}>✓</Text>}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ─── VISTAS ────────────────────────────────────────────

  function renderContenido() {
    if (fotos.length === 0) {
      return (
        <View style={s.vacio}>
          <Text style={s.vacioCabeza}>📷</Text>

          <Text style={s.vacioTitulo}>No hay fotos aún</Text>

          <Text style={s.vacioSubtitulo}>
            Tocá el botón + para importar fotos de tu dispositivo
          </Text>
        </View>
      );
    }

    if (vista === "fecha") {
      return (
        <ScrollView>
          {agruparPorFecha(fotos).map(([titulo, grupo]) => (
            <View key={titulo}>
              <Text style={s.tituloGrupo}>{titulo}</Text>

              <View style={s.grilla}>{grupo.map(renderMiniatura)}</View>
            </View>
          ))}
        </ScrollView>
      );
    }

    if (vista === "carpetas") {
      return (
        <ScrollView contentContainerStyle={s.scrollCarpetas}>
          {agruparPorCarpeta(fotos).map(([carpeta, fotosGrupo]) => (
            <TouchableOpacity
              key={carpeta}
              style={s.tarjetaCarpeta}
              onPress={() => {
                setCarpetaAbierta(carpeta);

                setVista("carpeta_detalle");
              }}
            >
              <View style={s.previewCarpeta}>
                {[0, 1, 2, 3].map((i) =>
                  fotosGrupo[i] ? (
                    <Image
                      key={i}
                      source={{ uri: fotosGrupo[i].uri }}
                      style={s.previewFoto}
                    />
                  ) : (
                    <View key={i} style={[s.previewFoto, s.previewVacio]} />
                  ),
                )}
              </View>

              <View style={s.infoCarpeta}>
                <Text style={s.nombreCarpeta} numberOfLines={1}>
                  📁 {carpeta}
                </Text>

                <Text style={s.cantidadCarpeta}>
                  {fotosGrupo.length} foto(s)
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }

    if (vista === "carpeta_detalle" && carpetaAbierta) {
      const fotosCarpeta = fotos.filter(
        (f) => (f.carpeta || extraerCarpeta(f.uri)) === carpetaAbierta,
      );

      return (
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={s.botonVolver}
            onPress={() => {
              setCarpetaAbierta(null);

              setVista("carpetas");
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colores.primario}
              />

              <Text style={s.textoVolverCarpeta}>{carpetaAbierta}</Text>
            </View>
          </TouchableOpacity>

          <ScrollView>
            {agruparPorFecha(fotosCarpeta).map(([titulo, grupo]) => (
              <View key={titulo}>
                <Text style={s.tituloGrupo}>{titulo}</Text>

                <View style={s.grilla}>{grupo.map(renderMiniatura)}</View>
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }

    return null;
  }

  // ─── RENDER ────────────────────────────────────────────

  if (cargando) {
    return (
      <View style={s.centrado}>
        <ActivityIndicator size="large" color={colores.primario} />

        <Text style={{ color: colores.textoGris, marginTop: 12 }}>
          Cargando...
        </Text>
      </View>
    );
  }

  return (
    <View style={s.contenedor}>
      {/* Barra superior */}

      <View style={s.barraTop}>
        {modoSeleccion ? (
          <>
            <TouchableOpacity
              onPress={() => {
                setModoSeleccion(false);

                setSeleccionadas([]);
              }}
            >
              <Ionicons
                name="close"
                size={24}
                color={colores.textoGris}
                style={{ padding: 14 }}
              />
            </TouchableOpacity>

            <Text style={s.contadorSel}>
              {seleccionadas.length} seleccionada(s)
            </Text>

            <TouchableOpacity
              onPress={eliminarSeleccionadas}
              disabled={seleccionadas.length === 0}
            >
              <Ionicons
                name="trash"
                size={24}
                color={colores.error}
                style={{ padding: 14 }}
              />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[s.tab, vista === "fecha" && s.tabActivo]}
              onPress={() => setVista("fecha")}
            >
              <Text style={[s.tabTexto, vista === "fecha" && s.tabTextoActivo]}>
                📅 Por fecha
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.tab,

                (vista === "carpetas" || vista === "carpeta_detalle") &&
                  s.tabActivo,
              ]}
              onPress={() => {
                setVista("carpetas");

                setCarpetaAbierta(null);
              }}
            >
              <Text
                style={[
                  s.tabTexto,

                  (vista === "carpetas" || vista === "carpeta_detalle") &&
                    s.tabTextoActivo,
                ]}
              >
                📁 Carpetas
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Contenido */}

      <View style={{ flex: 1 }}>{renderContenido()}</View>

      {/* Botón flotante */}

      {!modoSeleccion && (
        <TouchableOpacity style={s.fab} onPress={importarFotos}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ── Modal foto ampliada con deslizamiento ── */}

      <Modal visible={!!fotoAmpliada} transparent={false} animationType="fade">
        <View style={s.fondoFoto}>
          {fotoAmpliada && (
            <>
              <FlatList
                data={fotosNavegacion}
                keyExtractor={(f) => f.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={indiceAmpliada}
                getItemLayout={(_, index) => ({
                  length: width,

                  offset: width * index,

                  index,
                })}
                onMomentumScrollEnd={(e) => {
                  const nuevoIndice = Math.round(
                    e.nativeEvent.contentOffset.x / width,
                  );

                  setIndiceAmpliada(nuevoIndice);

                  setFotoAmpliada(fotosNavegacion[nuevoIndice]);
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

              {/* Contador */}

              {fotosNavegacion.length > 1 && (
                <View style={s.contadorNav}>
                  <Text style={s.contadorNavTexto}>
                    {indiceAmpliada + 1} / {fotosNavegacion.length}
                  </Text>
                </View>
              )}

              {/* Franja inferior */}

              <View style={s.franjaInferior}>
                <TouchableOpacity
                  style={s.botonFranja}
                  onPress={() => setFotoAmpliada(null)}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={28}
                    color={colores.textoGris}
                  />

                  <Text style={s.textoFranja}>Cerrar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.botonFranja}
                  onPress={() => setModalDetalles(true)}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={28}
                    color={colores.textoGris}
                  />

                  <Text style={s.textoFranja}>Detalles</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.botonFranja}
                  onPress={() => abrirEditar(fotoAmpliada)}
                >
                  <Ionicons
                    name="create-outline"
                    size={28}
                    color={colores.textoGris}
                  />

                  <Text style={s.textoFranja}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.botonFranja}
                  onPress={() => eliminarUna(fotoAmpliada)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={28}
                    color={colores.error}
                  />

                  <Text style={[s.textoFranja, { color: colores.error }]}>
                    Eliminar
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* ── Modal detalles ── */}

      <Modal visible={modalDetalles} transparent animationType="slide">
        <TouchableOpacity
          style={s.fondoModal}
          activeOpacity={1}
          onPress={() => setModalDetalles(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => null}>
            <View style={s.tarjeta}>
              <Text style={s.tarjetaTitulo}>ℹ️ Detalles</Text>

              {fotoAmpliada && (
                <>
                  <View style={s.filaDetalle}>
                    <Text style={s.labelDetalle}>📅 Fecha</Text>

                    <Text style={s.valorDetalle}>
                      {formatearFecha(fotoAmpliada.fecha)}
                    </Text>
                  </View>

                  <View style={s.filaDetalle}>
                    <Text style={s.labelDetalle}>📍 Ubicación</Text>

                    <Text style={s.valorDetalle}>
                      {fotoAmpliada.latitud
                        ? `${Number(fotoAmpliada.latitud).toFixed(6)}, ${Number(
                            fotoAmpliada.longitud,
                          ).toFixed(6)}`
                        : "Sin ubicación GPS"}
                    </Text>
                  </View>

                  <View style={s.filaDetalle}>
                    <Text style={s.labelDetalle}>📁 Carpeta</Text>

                    <Text style={s.valorDetalle}>
                      {fotoAmpliada.carpeta || extraerCarpeta(fotoAmpliada.uri)}
                    </Text>
                  </View>

                  <View style={s.filaDetalle}>
                    <Text style={s.labelDetalle}>📐 Dimensiones</Text>

                    <Text style={s.valorDetalle}>
                      {fotoAmpliada.ancho > 0
                        ? `${fotoAmpliada.ancho} × ${fotoAmpliada.alto} px`
                        : "No disponible"}
                    </Text>
                  </View>

                  <View style={s.filaDetalle}>
                    <Text style={s.labelDetalle}>🗂️ Nombre</Text>

                    <Text style={s.valorDetalle} numberOfLines={2}>
                      {fotoAmpliada.nombreArchivo
                        ? fotoAmpliada.nombreArchivo

                            .replace(/\.[^/.]+$/, "")

                            .toUpperCase()
                        : "—"}
                    </Text>
                  </View>

                  <View style={s.filaDetalle}>
                    <Text style={s.labelDetalle}>📦 Tamaño</Text>

                    <Text style={s.valorDetalle}>
                      {fotoAmpliada.tamaño > 0
                        ? fotoAmpliada.tamaño > 1024 * 1024
                          ? `${(fotoAmpliada.tamaño / (1024 * 1024)).toFixed(1)} MB`
                          : `${(fotoAmpliada.tamaño / 1024).toFixed(0)} KB`
                        : "No disponible"}
                    </Text>
                  </View>

                  {fotoAmpliada.nota ? (
                    <View style={s.filaDetalle}>
                      <Text style={s.labelDetalle}>💬 Nota</Text>

                      <Text style={s.valorDetalle}>{fotoAmpliada.nota}</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ModalEditar
        visible={modalEditar}
        fotoEditando={fotoEditando}
        editFecha={editFecha}
        editNota={editNota}
        editLat={editLat}
        editLng={editLng}
        ubicacionTemp={ubicacionTemp}
        onChangeFecha={setEditFecha}
        onChangeNota={setEditNota}
        onChangeLat={setEditLat}
        onChangeLng={setEditLng}
        onGuardar={guardarEdicion}
        onCancelar={() => setModalEditar(false)}
        onAbrirMapaGPS={() => setModalGPS(true)}
      />

      <ModalGPS
        visible={modalGPS}
        ubicacionTemp={ubicacionTemp}
        onSeleccionarUbicacion={(e) =>
          setUbicacionTemp(e.nativeEvent.coordinate)
        }
        onConfirmar={() => {
          if (ubicacionTemp) {
            setEditLat(ubicacionTemp.latitude.toString());
            setEditLng(ubicacionTemp.longitude.toString());
          }
          setModalGPS(false);
        }}
        onCancelar={() => setModalGPS(false)}
      />

      {/* ── Modal aplicar GPS a varias fotos ── */}

      <Modal visible={modalAplicarGPS} transparent animationType="slide">
        <View style={s.fondoModal}>
          <View style={[s.tarjeta, { maxHeight: "85%" }]}>
            <Text style={s.tarjetaTitulo}>📍 Elegí las fotos</Text>

            <Text
              style={{
                color: colores.textoGris,

                fontSize: 13,

                marginBottom: 12,
              }}
            >
              Seleccioná las fotos a las que querés aplicar la misma ubicación
            </Text>

            <FlatList
              data={fotosParaGPS}
              keyExtractor={(f) => f.id}
              numColumns={3}
              style={{ maxHeight: 350 }}
              renderItem={({ item }) => {
                const sel = seleccionadasGPS.includes(item.id);

                return (
                  <TouchableOpacity
                    style={[s.contenedorMini, sel && s.miniSeleccionada]}
                    onPress={() =>
                      setSeleccionadasGPS((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((id) => id !== item.id)
                          : [...prev, item.id],
                      )
                    }
                  >
                    <Image source={{ uri: item.uri }} style={s.miniatura} />

                    {sel && (
                      <View style={[s.circulo, s.circuloActivo]}>
                        <Text style={s.checkTexto}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <View style={s.filaAcciones}>
              <TouchableOpacity
                style={s.botonCancelar}
                onPress={() => {
                  setModalAplicarGPS(false);

                  setSeleccionadasGPS([]);
                }}
              >
                <Text style={s.botonTexto}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.botonGuardar,

                  seleccionadasGPS.length === 0 && { opacity: 0.4 },
                ]}
                disabled={seleccionadasGPS.length === 0}
                onPress={async () => {
                  if (seleccionadasGPS.length === 0 || !ubicacionParaAplicar)
                    return;

                  // Cerrar modal inmediatamente para evitar re-renders
                  setModalAplicarGPS(false);

                  const idsAActualizar = [...seleccionadasGPS];
                  const ubicacion = { ...ubicacionParaAplicar };
                  setSeleccionadasGPS([]);

                  let actuales = [...fotos];
                  for (const id of idsAActualizar) {
                    const act = await actualizarFoto(id, {
                      latitud: ubicacion.latitud,
                      longitud: ubicacion.longitud,
                    });
                    if (act)
                      actuales = actuales.map((x) => (x.id === id ? act : x));
                  }
                  setFotos(actuales);
                  Alert.alert(
                    "✅ Listo",
                    `Ubicación aplicada a ${idsAActualizar.length} foto(s).`,
                  );
                }}
              >
                <Text style={s.botonTexto}>
                  Aplicar a {seleccionadasGPS.length} foto(s)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── ESTILOS ─────────────────────────────────────────────
const s = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondoOscuro },
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.fondoOscuro,
  },
  barraTop: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colores.fondoMedio,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
    paddingHorizontal: 8,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabActivo: { borderBottomWidth: 2, borderBottomColor: colores.primario },
  tabTexto: { color: colores.textoGris, fontSize: 14 },
  tabTextoActivo: { color: colores.textoBlanco, fontWeight: "bold" },
  contadorSel: {
    flex: 1,
    color: colores.textoBlanco,
    fontWeight: "bold",
    textAlign: "center",
  },
  vacio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  vacioCabeza: { fontSize: 64, marginBottom: 16 },
  vacioTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: colores.textoBlanco,
    marginBottom: 8,
  },
  vacioSubtitulo: {
    fontSize: 14,
    color: colores.textoGris,
    textAlign: "center",
    lineHeight: 22,
  },
  tituloGrupo: {
    color: colores.textoGris,
    fontSize: 13,
    fontWeight: "bold",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colores.fondoOscuro,
  },
  grilla: { flexDirection: "row", flexWrap: "wrap" },
  contenedorMini: { width: TAM, height: TAM, margin: 0.5 },
  miniatura: { width: "100%", height: "100%" },
  miniSeleccionada: { opacity: 0.5 },
  badgeGPS: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 2,
  },
  badgeSinGPS: { backgroundColor: "rgba(255,165,0,0.7)" },
  badgeTexto: { fontSize: 10 },
  circulo: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  circuloActivo: {
    backgroundColor: colores.primario,
    borderColor: colores.primario,
  },
  checkTexto: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colores.primario,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  botonVolver: {
    padding: 14,
    backgroundColor: colores.fondoMedio,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  textoVolverCarpeta: {
    color: colores.primario,
    fontWeight: "bold",
    fontSize: 16,
  },

  // Foto ampliada
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
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    paddingHorizontal: 8,
  },
  botonFranja: { flex: 1, alignItems: "center", paddingVertical: 8 },
  textoFranja: { color: colores.textoGris, fontSize: 11, marginTop: 4 },

  // Detalles
  filaDetalle: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  labelDetalle: { color: colores.textoGris, fontSize: 13, flex: 1 },
  valorDetalle: {
    color: colores.textoBlanco,
    fontSize: 13,
    flex: 2,
    textAlign: "right",
  },

  // Modales
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
  // GPS modal
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
  // Carpetas
  scrollCarpetas: { flexDirection: "row", flexWrap: "wrap", padding: 8 },
  tarjetaCarpeta: {
    width: (width - 24) / 2,
    margin: 4,
    backgroundColor: colores.fondoMedio,
    borderRadius: radios.lg,
    overflow: "hidden",
  },
  previewCarpeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    aspectRatio: 1,
  },
  previewFoto: { width: "50%", height: "50%" },
  previewVacio: { backgroundColor: colores.fondoTarjeta },
  infoCarpeta: { padding: 10 },
  nombreCarpeta: {
    color: colores.textoBlanco,
    fontWeight: "bold",
    fontSize: 13,
  },
  cantidadCarpeta: { color: colores.textoGris, fontSize: 11, marginTop: 2 },
});
