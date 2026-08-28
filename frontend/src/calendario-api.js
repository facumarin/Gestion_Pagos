import { API_URL } from './config-api.js';

export async function obtenerEventos(
  desde,
  hasta
) {

  const respuesta = await fetch(
    `${API_URL}/calendario/eventos?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`
  );

  if (!respuesta.ok) {
    throw new Error(
      'No se pudieron obtener los eventos.'
    );
  }

  return await respuesta.json();
}

export async function obtenerRecursos() {

  const respuesta =
    await fetch(
      `${API_URL}/calendario/recursos`
    );

  if (!respuesta.ok) {
    throw new Error(
      'No se pudieron obtener los recursos.'
    );
  }

  return await respuesta.json();
}

export async function obtenerActividades() {

  const respuesta =
    await fetch(
      `${API_URL}/calendario/actividades`
    );

  if (!respuesta.ok) {
    throw new Error(
      'No se pudieron obtener las actividades.'
    );
  }

  return await respuesta.json();
}

export async function crearEvento(
  evento
) {

  const respuesta =
    await fetch(
      `${API_URL}/calendario/eventos`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json'
        },
        body: JSON.stringify(evento)
      }
    );

  const datos =
    await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.error ||
      'No se pudo crear el evento.'
    );
  }

  return datos;
}