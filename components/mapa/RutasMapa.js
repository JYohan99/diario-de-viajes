import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colores, radios } from '../../theme';
import {
  TRANSPORTES,
  colorTransporte,
  iconoTransporte,
  nombreTransporte,
} from './constantes';
import {
  guardarRuta,
  eliminarRuta,
  actualizarRuta,
} from '../../almacenamiento';

// ─── PARTE DEL MAPA (solo elementos que van dentro de MapView) ───

export function RutasEnMapa({
  rutas,
  mostrarRutas,
  modoRuta,
  puntosRuta,
  onPresarRuta,
}) {
  return (
    <>
      {/* Rutas guardadas */}
      {mostrarRutas &&
        rutas.map((ruta) => (
          <React.Fragment key={ruta.id}>
            <Polyline
              coordinates={ruta.puntos}
              strokeColor={colorTransporte(ruta.transporte)}
              strokeWidth={4}
              lineDashPattern={
                ruta.transporte === 'avion' ? [12, 6] : undefined
              }
              tappable
              onPress={() => onPresarRuta(ruta)}
            />
            {/* Marcador inicio de ruta */}
            {ruta.puntos.length > 0 && (
              <Marker
                coordinate={ruta.puntos[0]}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}>
                <View
                  style={[
                    s.marcadorInicio,
                    { backgroundColor: colorTransporte(ruta.transporte) },
                  ]}>
                  <Text style={s.marcadorInicioIcono}>
                    {iconoTransporte(ruta.transporte)}
                  </Text>
                </View>
              </Marker>
            )}
          </React.Fragment>
        ))}

      {/* Ruta en construcción */}
      {modoRuta && puntosRuta.length > 1 && (
        <Polyline
          coordinates={puntosRuta}
          strokeColor={colores.textoGris}
          strokeWidth={3}
          lineDashPattern={[6, 4]}
        />
      )}

      {/* Puntos numerados */}
      {modoRuta &&
        puntosRuta.map((punto, i) => (
          <Marker
            key={`punto_${i}`}
            coordinate={punto}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}>
            <View style={s.puntoRuta}>
              <Text style={s.puntoRutaTexto}>{i + 1}</Text>
            </View>
          </Marker>
        ))}
    </>
  );
}

// ─── PARTE UI (modales y barra — va fuera del MapView) ───────────

export function RutasUI({
  rutas,
  setRutas,
  modoRuta,
  setModoRuta,
  puntosRuta,
  setPuntosRuta,
  rutaSeleccionada,
  setRutaSeleccionada,
  modalVerRuta,
  setModalVerRuta,
}) {
  const [modalTransporte, setModalTransporte] = useState(false);
  const [modalNombre, setModalNombre] = useState(false);
  const [modalEditarRuta, setModalEditarRuta] = useState(false);
  const [transporteSeleccionado, setTransporteSeleccionado] = useState(null);
  const [nombreRuta, setNombreRuta] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editTransporte, setEditTransporte] = useState(null);

  // ─── CREAR ────────────────────────────────────────────

  function confirmarPuntos() {
    if (puntosRuta.length < 2) {
      Alert.alert(
        '⚠️ Faltan puntos',
        'Agregá al menos 2 puntos para crear una ruta.'
      );
      return;
    }
    setModalTransporte(true);
  }

  function seleccionarTransporte(t) {
    setTransporteSeleccionado(t);
    setModalTransporte(false);
    setNombreRuta('');
    setModalNombre(true);
  }

  async function finalizarRuta() {
    const nueva = await guardarRuta({
      nombre: nombreRuta.trim() || `Ruta ${rutas.length + 1}`,
      transporte: transporteSeleccionado.id,
      puntos: puntosRuta,
    });
    if (nueva) {
      setRutas((prev) => [...prev, nueva]);
      setModoRuta(false);
      setPuntosRuta([]);
      setTransporteSeleccionado(null);
      setModalNombre(false);
      setNombreRuta('');
      Alert.alert('✅ Ruta creada', `"${nueva.nombre}" fue guardada.`);
    }
  }

  // ─── EDITAR ───────────────────────────────────────────

  function abrirEditar(ruta) {
    setEditNombre(ruta.nombre);
    setEditTransporte(
      TRANSPORTES.find((t) => t.id === ruta.transporte) || TRANSPORTES[0]
    );
    setModalVerRuta(false);
    setModalEditarRuta(true);
  }

  async function guardarEdicion() {
    if (!rutaSeleccionada) return;
    const actualizada = await actualizarRuta(rutaSeleccionada.id, {
      nombre: editNombre.trim() || rutaSeleccionada.nombre,
      transporte: editTransporte.id,
    });
    if (actualizada) {
      setRutas((prev) =>
        prev.map((r) => (r.id === rutaSeleccionada.id ? actualizada : r))
      );
    }
    setModalEditarRuta(false);
    setRutaSeleccionada(null);
    Alert.alert('✅ Ruta actualizada');
  }

  // ─── ELIMINAR ─────────────────────────────────────────

  async function handleEliminar(id) {
    Alert.alert('¿Eliminar ruta?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarRuta(id);
          setRutas((prev) => prev.filter((r) => r.id !== id));
          setModalVerRuta(false);
          setModalEditarRuta(false);
          setRutaSeleccionada(null);
        },
      },
    ]);
  }

  return (
    <>
      {/* Barra inferior modo ruta */}
      {modoRuta && (
        <View style={s.barraRuta}>
          <View style={s.infoRuta}>
            <Text style={s.infoRutaTitulo}>🗺️ Creando ruta</Text>
            <Text style={s.infoRutaSub}>
              {puntosRuta.length} punto(s) · Mantené presionado el mapa para
              agregar
            </Text>
          </View>
          <View style={s.botonesRuta}>
            {puntosRuta.length > 0 && (
              <TouchableOpacity
                style={s.botonRutaAcc}
                onPress={() => setPuntosRuta((prev) => prev.slice(0, -1))}>
                <Ionicons
                  name="backspace-outline"
                  size={20}
                  color={colores.advertencia}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={s.botonRutaAcc}
              onPress={() => {
                setModoRuta(false);
                setPuntosRuta([]);
              }}>
              <Ionicons name="close" size={20} color={colores.error} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.botonRutaAcc,
                puntosRuta.length < 2 && { opacity: 0.4 },
              ]}
              onPress={confirmarPuntos}
              disabled={puntosRuta.length < 2}>
              <Ionicons name="checkmark" size={22} color={colores.exito} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal elegir transporte */}
      <Modal visible={modalTransporte} transparent animationType="slide">
        <View style={s.fondoModal}>
          <View style={s.tarjeta}>
            <Text style={s.tarjetaTitulo}>🚗 ¿Cómo viajaste?</Text>
            {TRANSPORTES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[s.opcionTransporte, { borderLeftColor: t.color }]}
                onPress={() => seleccionarTransporte(t)}>
                <Text style={s.iconoT}>{t.icono}</Text>
                <Text style={s.nombreT}>{t.nombre}</Text>
                <View style={[s.bolita, { backgroundColor: t.color }]} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={s.botonCancelar}
              onPress={() => setModalTransporte(false)}>
              <Text style={s.botonCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal nombre ruta */}
      <Modal visible={modalNombre} transparent animationType="slide">
        <View style={s.fondoModal}>
          <View style={s.tarjeta}>
            <Text style={s.tarjetaTitulo}>
              {transporteSeleccionado?.icono} {transporteSeleccionado?.nombre}
            </Text>
            <Text style={s.labelInput}>Nombre de la ruta (opcional)</Text>
            <TextInput
              style={s.input}
              value={nombreRuta}
              onChangeText={setNombreRuta}
              placeholder={`Ruta ${rutas.length + 1}`}
              placeholderTextColor={colores.textoSutil}
              autoFocus
            />
            <View style={s.filaAcciones}>
              <TouchableOpacity
                style={s.botonCancelar}
                onPress={() => {
                  setModalNombre(false);
                  setModalTransporte(true);
                }}>
                <Text style={s.botonCancelarTexto}>‹ Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.botonGuardar} onPress={finalizarRuta}>
                <Text style={s.botonTexto}>Guardar ✅</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal ver ruta */}
      <Modal visible={modalVerRuta} transparent animationType="slide">
        <TouchableOpacity
          style={s.fondoModal}
          activeOpacity={1}
          onPress={() => setModalVerRuta(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => null}>
            <View style={s.tarjeta}>
              {rutaSeleccionada && (
                <>
                  <View
                    style={[
                      s.barraColor,
                      {
                        backgroundColor: colorTransporte(
                          rutaSeleccionada.transporte
                        ),
                      },
                    ]}
                  />
                  <Text style={s.tarjetaTitulo}>{rutaSeleccionada.nombre}</Text>
                  <View style={s.filaDetalle}>
                    <Text style={s.labelDetalle}>Transporte</Text>
                    <Text
                      style={[
                        s.valorDetalle,
                        { color: colorTransporte(rutaSeleccionada.transporte) },
                      ]}>
                      {iconoTransporte(rutaSeleccionada.transporte)}{' '}
                      {nombreTransporte(rutaSeleccionada.transporte)}
                    </Text>
                  </View>
                  <View style={s.filaDetalle}>
                    <Text style={s.labelDetalle}>Puntos</Text>
                    <Text style={s.valorDetalle}>
                      {rutaSeleccionada.puntos.length}
                    </Text>
                  </View>
                  <View style={s.filaDetalle}>
                    <Text style={s.labelDetalle}>Fecha</Text>
                    <Text style={s.valorDetalle}>
                      {new Date(rutaSeleccionada.fecha).toLocaleDateString(
                        'es-ES',
                        {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        }
                      )}
                    </Text>
                  </View>
                  <View style={s.filaAcciones}>
                    <TouchableOpacity
                      style={s.botonEditar}
                      onPress={() => abrirEditar(rutaSeleccionada)}>
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colores.primario}
                      />
                      <Text style={[s.botonTexto, { color: colores.primario }]}>
                        Editar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.botonEliminar}
                      onPress={() => handleEliminar(rutaSeleccionada.id)}>
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                      <Text style={s.botonTexto}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal editar ruta */}
      <Modal visible={modalEditarRuta} transparent animationType="slide">
        <View style={s.fondoModal}>
          <View style={s.tarjeta}>
            <Text style={s.tarjetaTitulo}>✏️ Editar ruta</Text>
            <Text style={s.labelInput}>Nombre</Text>
            <TextInput
              style={s.input}
              value={editNombre}
              onChangeText={setEditNombre}
              placeholderTextColor={colores.textoSutil}
              autoFocus
            />
            <Text style={s.labelInput}>Transporte</Text>
            <View style={s.grillaTransporte}>
              {TRANSPORTES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    s.chipTransporte,
                    editTransporte?.id === t.id && { backgroundColor: t.color },
                  ]}
                  onPress={() => setEditTransporte(t)}>
                  <Text style={s.chipIcono}>{t.icono}</Text>
                  <Text
                    style={[
                      s.chipNombre,
                      editTransporte?.id === t.id && {
                        color: '#fff',
                        fontWeight: 'bold',
                      },
                    ]}>
                    {t.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.filaAcciones}>
              <TouchableOpacity
                style={s.botonCancelar}
                onPress={() => setModalEditarRuta(false)}>
                <Text style={s.botonCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.botonGuardar} onPress={guardarEdicion}>
                <Text style={s.botonTexto}>Guardar ✅</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  marcadorInicio: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  marcadorInicioIcono: { fontSize: 14 },
  puntoRuta: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  puntoRutaTexto: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  barraRuta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colores.fondoMedio,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    elevation: 8,
  },
  infoRuta: { flex: 1 },
  infoRutaTitulo: {
    color: colores.textoBlanco,
    fontWeight: 'bold',
    fontSize: 15,
  },
  infoRutaSub: { color: colores.textoGris, fontSize: 12, marginTop: 2 },
  botonesRuta: { flexDirection: 'row', gap: 10 },
  botonRutaAcc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colores.fondoTarjeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  tarjeta: {
    backgroundColor: colores.fondoMedio,
    borderTopLeftRadius: radios.xl,
    borderTopRightRadius: radios.xl,
    padding: 24,
    paddingBottom: 40,
  },
  tarjetaTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colores.textoBlanco,
    marginBottom: 16,
  },
  barraColor: { height: 4, borderRadius: 2, marginBottom: 12 },
  filaDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  labelDetalle: { color: colores.textoGris, fontSize: 13 },
  valorDetalle: { color: colores.textoBlanco, fontSize: 13 },
  opcionTransporte: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.fondoTarjeta,
    borderRadius: radios.md,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  iconoT: { fontSize: 22, marginRight: 12 },
  nombreT: { flex: 1, color: colores.textoBlanco, fontSize: 15 },
  bolita: { width: 14, height: 14, borderRadius: 7 },
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
  filaAcciones: { flexDirection: 'row', gap: 12, marginTop: 16 },
  botonCancelar: {
    flex: 1,
    backgroundColor: colores.fondoTarjeta,
    borderRadius: radios.md,
    padding: 14,
    alignItems: 'center',
  },
  botonCancelarTexto: { color: colores.textoGris, fontWeight: 'bold' },
  botonGuardar: {
    flex: 1,
    backgroundColor: colores.primario,
    borderRadius: radios.md,
    padding: 14,
    alignItems: 'center',
  },
  botonEditar: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colores.fondoTarjeta,
    borderRadius: radios.md,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colores.primario,
  },
  botonEliminar: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colores.error,
    borderRadius: radios.md,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  grillaTransporte: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chipTransporte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colores.fondoTarjeta,
    borderRadius: radios.redondo,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  chipIcono: { fontSize: 16 },
  chipNombre: { color: colores.textoGris, fontSize: 12 },
});
