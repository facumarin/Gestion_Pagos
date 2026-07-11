import { API_URL } from './config-api.js';
import {  obtenerMesActual} from './fechas.js';

export async function obtenerBalanceCuotas(
  mesDesde,
  mesHasta,
  anio
)
{

  const respuesta =
    await fetch(
      `${API_URL}/cuotas/balance?mesDesde=${mesDesde}&mesHasta=${mesHasta}&anio=${anio}`
    );

  if (!respuesta.ok) {
    throw new Error(
      'No se pudo obtener el balance.'
    );
  }

  return await respuesta.json();

}