import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE_FOTOS = 'fotos_v2';

// ─── FOTOS ────────────────────────────────────────────────

export async function obtenerFotos() {
  try {
    const datos = await AsyncStorage.getItem(CLAVE_FOTOS);
    return datos ? JSON.parse(datos) : [];
  } catch (e) {
    console.log('Error obtenerFotos:', e);
    return [];
  }
}

export async function guardarFotos(fotos) {
  try {
    await AsyncStorage.setItem(CLAVE_FOTOS, JSON.stringify(fotos));
    return true;
  } catch (e) {
    console.log('Error guardarFotos:', e);
    return false;
  }
}

export async function agregarFotos(nuevasFotos) {
  try {
    const actuales = await obtenerFotos();
    const todas = [...actuales, ...nuevasFotos];
    await guardarFotos(todas);
    return todas;
  } catch (e) {
    console.log('Error agregarFotos:', e);
    return null;
  }
}

export async function actualizarFoto(id, cambios) {
  try {
    const fotos = await obtenerFotos();
    const indice = fotos.findIndex((f) => f.id === id);
    if (indice === -1) return null;
    fotos[indice] = { ...fotos[indice], ...cambios };
    await guardarFotos(fotos);
    return fotos[indice];
  } catch (e) {
    console.log('Error actualizarFoto:', e);
    return null;
  }
}

export async function eliminarFoto(id) {
  try {
    const fotos = await obtenerFotos();
    const nuevas = fotos.filter((f) => f.id !== id);
    await guardarFotos(nuevas);
    return true;
  } catch (e) {
    console.log('Error eliminarFoto:', e);
    return false;
  }
}

// ─── BACKUP ──────────────────────────────────────────────

export async function exportarBackup() {
  try {
    const fotos = await obtenerFotos();
    return JSON.stringify({
      version: '2.0',
      fecha: new Date().toISOString(),
      fotos,
    });
  } catch (e) {
    return null;
  }
}

export async function importarBackup(json) {
  try {
    const datos = JSON.parse(json);
    if (!datos.fotos) return false;
    await guardarFotos(datos.fotos);
    return true;
  } catch (e) {
    return false;
  }
}

// ─── RUTAS ───────────────────────────────────────────────

const CLAVE_RUTAS = 'rutas_v1';

export async function obtenerRutas() {
  try {
    const datos = await AsyncStorage.getItem(CLAVE_RUTAS);
    return datos ? JSON.parse(datos) : [];
  } catch (e) {
    return [];
  }
}

export async function guardarRuta(ruta) {
  try {
    const rutas = await obtenerRutas();
    const nueva = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      nombre: ruta.nombre || '',
      transporte: ruta.transporte,
      puntos: ruta.puntos, // [{ latitude, longitude }]
      fecha: new Date().toISOString(),
    };
    rutas.push(nueva);
    await AsyncStorage.setItem(CLAVE_RUTAS, JSON.stringify(rutas));
    return nueva;
  } catch (e) {
    return null;
  }
}

export async function eliminarRuta(id) {
  try {
    const rutas = await obtenerRutas();
    const nuevas = rutas.filter((r) => r.id !== id);
    await AsyncStorage.setItem(CLAVE_RUTAS, JSON.stringify(nuevas));
    return true;
  } catch (e) {
    return false;
  }
}

export async function actualizarRuta(id, cambios) {
  try {
    const rutas = await obtenerRutas();
    const indice = rutas.findIndex((r) => r.id === id);
    if (indice === -1) return null;
    rutas[indice] = { ...rutas[indice], ...cambios };
    await AsyncStorage.setItem(CLAVE_RUTAS, JSON.stringify(rutas));
    return rutas[indice];
  } catch (e) {
    return null;
  }
}
