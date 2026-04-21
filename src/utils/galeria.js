// Funciones de utilidad para la galería

export function formatearFecha(fechaStr) {
  if (!fechaStr) return 'Sin fecha';

  const f = new Date(fechaStr);

  if (isNaN(f)) return 'Sin fecha';

  return f.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function extraerCarpeta(uri) {
  try {
    const limpia = decodeURIComponent(uri.split('?')[0]);
    const partes = limpia.split('/').filter((p) => p.length > 0);

    if (partes.length >= 2) {
      const carpeta = partes[partes.length - 2];
      const ignorar = [
        'cache',
        'files',
        'tmp',
        'ImagePicker',
        'ExponentExperienceData',
        'data',
        'user',
        '0',
        'emulated',
        'storage',
        'sdcard',
        'Android',
      ];

      if (!ignorar.includes(carpeta) && !carpeta.match(/^[0-9a-f-]{8,}$/i)) {
        return carpeta;
      }
    }
    return 'Importadas';
  } catch {
    return 'Importadas';
  }
}

export function agruparPorFecha(fotos) {
  const grupos = {};
  [...fotos]
    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
    .forEach((foto) => {
      const f = new Date(foto.fecha);
      const clave = isNaN(f)
        ? 'Sin fecha'
        : `${f.getDate()} de ${f.toLocaleString('es-ES', {
            month: 'long',
          })} de ${f.getFullYear()}`;

      if (!grupos[clave]) grupos[clave] = [];
      grupos[clave].push(foto);
    });

  return Object.entries(grupos);
}

export function agruparPorCarpeta(fotos) {
  const grupos = {};
  fotos.forEach((foto) => {
    const carpeta = foto.carpeta || extraerCarpeta(foto.uri);
    if (!grupos[carpeta]) grupos[carpeta] = [];
    grupos[carpeta].push(foto);
  });

  return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0]));
}
