import { API_URL } from './config-api.js';

export async function obtenerMovimientosCaja() {

  const res =
    await fetch(
      `${API_URL}/caja/movimientos`
    );

  if (!res.ok) {
    throw new Error(
      'Error al obtener movimientos.'
    );
  }

  return await res.json();

}

export async function obtenerCategoriasCaja() {

  const res =
    await fetch(
      `${API_URL}/categorias-caja`
    );

  if (!res.ok) {
    throw new Error(
      'Error al obtener categorías.'
    );
  }

  return await res.json();

}

export async function obtenerMediosPagoCaja() {

  const res =
    await fetch(
      `${API_URL}/medios-pago`
    );

  if (!res.ok) {
    throw new Error(
      'Error al obtener medios de pago.'
    );
  }

  return await res.json();

}

export async function registrarMovimientoCaja(datos) {

  const res =
    await fetch(
      `${API_URL}/caja/movimientos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      }
    );

  const data =
    await res.json();

  if (!res.ok) {

    throw new Error(
      data.error ||
      'Error al registrar movimiento.'
    );

  }

  return data;

}

export async function subirComprobanteCaja(
  archivo,
  tipo
) {

  const formData =
    new FormData();

  formData.append(
    'archivo',
    archivo
  );

  formData.append(
    'tipo',
    tipo.toLowerCase()
  );

  const res =
    await fetch(
      `${API_URL}/caja/upload-comprobante`,
      {
        method: 'POST',
        body: formData
      }
    );

  const data =
    await res.json();

  if (!res.ok) {

    throw new Error(
      data.error ||
      'Error al subir comprobante.'
    );

  }

  return data;

}