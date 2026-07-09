// src/api.js

import { API_URL } from './config-api.js';

// Centraliza la petición para obtener los datos del semáforo y la tabla
export async function obtenerDatosDashboard() {
  const respuesta = await fetch(`${API_URL}/dashboard`);
  if (!respuesta.ok) throw new Error('No se pudo conectar con el servidor.');
  return await respuesta.json();
}

// Centraliza el envío para dar de alta un nuevo miembro
export async function guardarNuevoSocio(datosSocio) {
  const respuesta = await fetch(`${API_URL}/socios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosSocio)
  });
  
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || 'Error al registrar el socio.');
  return datos;
}

// Centraliza el registro de pago de una cuota
export async function registrarPagoCuota(idSocio, mes, anio) {
  const respuesta = await fetch(`${API_URL}/cuotas/pagar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idSocio, mes, anio })
  });

  if (!respuesta.ok) throw new Error('No se pudo procesar el cobro.');
  return await respuesta.json();
}
