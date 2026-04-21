import { useState } from 'react';
import { Alert } from 'react-native';
import { guardarRuta, actualizarRuta, eliminarRuta } from '../../almacenamiento';
import { TRANSPORTES } from '../../components/mapa/constantes';

export default function useRutas({
  rutas,
  setRutas,
  puntosRuta,
  setPuntosRuta,
  setModoRuta,
  rutaSeleccionada,
  setRutaSeleccionada,
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

  // ─── EDITAR ────────────────────────────────────────────

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

  // ─── ELIMINAR ────────────────────────────────────────────

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

  return {
    // Estados locales
    modalTransporte,
    modalNombre,
    modalEditarRuta,
    transporteSeleccionado,
    nombreRuta,
    setNombreRuta,
    editNombre,
    setEditNombre,
    editTransporte,
    setEditTransporte,
    
    // Funciones
    confirmarPuntos,
    seleccionarTransporte,
    finalizarRuta,
    abrirEditar,
    guardarEdicion,
    handleEliminar,
  };
}
