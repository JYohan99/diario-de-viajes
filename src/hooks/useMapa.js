import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { obtenerFotos, obtenerRutas } from '../../almacenamiento';

export default function useMapa() {
  const [fotosConGPS, setFotosConGPS] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [regionInicial, setRegionInicial] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarDatos() {
    setCargando(true);
    const datos = await obtenerFotos();
    const conGPS = datos.filter((f) => f.latitud && f.longitud);
    setFotosConGPS(conGPS);

    const rutasGuardadas = await obtenerRutas();
    setRutas(rutasGuardadas);

    if (!regionInicial) {
      if (conGPS.length > 0) {
        const ultima = conGPS[conGPS.length - 1];
        setRegionInicial({
          latitude: ultima.latitud,
          longitude: ultima.longitud,
          latitudeDelta: 1,
          longitudeDelta: 1,
        });
      } else {
        setRegionInicial({
          latitude: -34.9011,
          longitude: -56.1645,
          latitudeDelta: 10,
          longitudeDelta: 10,
        });
      }
    }
    setCargando(false);
  }

  async function irAMiUbicacion() {
    setBuscandoUbicacion(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setBuscandoUbicacion(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setMiUbicacion(coords);
      return coords; // Retornar coords para que el componente pueda usar animateToRegion
    } catch (_e) {
      /* sin ubicación */
    }
    setBuscandoUbicacion(false);
  }

  return {
    // Estados de datos
    fotosConGPS,
    rutas,
    setRutas,
    cargando,
    regionInicial,
    miUbicacion,
    buscandoUbicacion,
    
    // Funciones
    cargarDatos,
    irAMiUbicacion,
  };
}
