// backend/src/infrastructure/PostgresSocioRepository.js (Sincronizado 100%)
import { supabase } from './database.js';


function calcularColorSemaforo(estadoSocio, fechaVencimientoStr) {
  if (estadoSocio === 'Inactivo') return 'Rojo';
  if (!fechaVencimientoStr) return 'Amarillo';

  // Creamos la fecha de hoy limpia a las 00:00 para comparar solo días
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Parseamos la fecha de vencimiento que viene de Supabase (YYYY-MM-DD)
  // Reemplazamos guiones para evitar problemas de zona horaria en JavaScript
  const vencimiento = new Date(fechaVencimientoStr.replace(/-/g, '\/'));
  vencimiento.setHours(0, 0, 0, 0);

  // 🟢 REGLA DE NEGOCIO: Si el vencimiento es MAYOR o IGUAL a hoy, está al día (Verde)
  if (vencimiento >= hoy) {
    return 'Verde';
  }
  
  // 🔴 Si el vencimiento ya pasó, está moroso (Rojo)
  return 'Rojo';
}


export class PostgresSocioRepository {
  
  // 1. Obtener todos los miembros desde Supabase
  async obtenerTodos() {
    const { data, error } = await supabase
      .from('socios')
      .select('id, nombre, apellido, dni, telefono, email, direccion, tipo, id_titular, estado, fecha_alta, notas, fecha_nacimiento, actividad, categoria, monto_cuota, fecha_vencimiento')
      .order('fecha_alta', { ascending: false });

    if (error) throw new Error(`Error al obtener socios: ${error.message}`);
    
    return data.map(socio => ({
      id: socio.id,
      nombre: socio.nombre,
      apellido: socio.apellido,
      dni: socio.dni,
      telefono: socio.telefono,
      email: socio.email,
      direccion: socio.direccion,
      tipo: socio.tipo,
      id_titular: socio.id_titular,
      idTitular: socio.id_titular,
      estado: socio.estado,
      fechaAlta: socio.fecha_alta,
      notas: socio.notas,
      fechaNacimiento: socio.fecha_nacimiento,
      actividad: socio.actividad,
      categoria: socio.categoria,
      montoCuota: socio.monto_cuota,
      fechaVencimiento: socio.fecha_vencimiento,
      estadoSemaforo: calcularColorSemaforo(socio.estado, socio.fecha_vencimiento)
    }));
  }

  // 2. Guardar un nuevo miembro mapeando las columnas de tu script SQL
  async guardar(socio) {
    const { data, error } = await supabase
      .from('socios')
      .insert([{
        nombre: socio.nombre,
        apellido: socio.apellido || null,
        dni: socio.dni,
        telefono: socio.telefono,
        email: socio.email,
        direccion: socio.direccion,
        tipo: socio.tipo,
        id_titular: socio.id_titular || socio.idTitular || null,
        notas: socio.notas || null,
        actividad: socio.actividad || null,
        categoria: socio.categoria || null,
        monto_cuota: socio.montoCuota || socio.monto_cuota || 5000,
        fecha_vencimiento: socio.fechaVencimiento || socio.fecha_vencimiento || null,
        fecha_nacimiento: socio.fechaNacimiento || socio.fecha_nacimiento || null 
      }])
      .select();

    if (error) throw new Error(`Error al guardar socio: ${error.message}`);
    return data[0];
  }

  // 3. Modificar Ficha de Socio: Acoplador Estricto para PostgreSQL
  async actualizar(id, datosActualizados) {
    const payload = {};
    
    if (datosActualizados.nombre !== undefined) payload.nombre = datosActualizados.nombre;
    if (datosActualizados.apellido !== undefined) payload.apellido = datosActualizados.apellido;
    if (datosActualizados.telefono !== undefined) payload.telefono = datosActualizados.telefono;
    if (datosActualizados.email !== undefined) payload.email = datosActualizados.email;
    if (datosActualizados.direccion !== undefined) payload.direccion = datosActualizados.direccion;
    if (datosActualizados.tipo !== undefined) payload.tipo = datosActualizados.tipo;
    if (datosActualizados.notas !== undefined) payload.notas = datosActualizados.notas;
    if (datosActualizados.estado !== undefined) payload.estado = datosActualizados.estado;
    if (datosActualizados.actividad !== undefined) payload.actividad = datosActualizados.actividad;
    if (datosActualizados.categoria !== undefined) payload.categoria = datosActualizados.categoria;
    
    // Mapeo seguro a nombres de columna snake_case de tu SQL
    if (datosActualizados.montoCuota !== undefined) payload.monto_cuota = datosActualizados.montoCuota;
    if (datosActualizados.monto_cuota !== undefined) payload.monto_cuota = datosActualizados.monto_cuota;
    
    if (datosActualizados.fechaVencimiento !== undefined) payload.fecha_vencimiento = datosActualizados.fechaVencimiento;
    if (datosActualizados.fecha_vencimiento !== undefined) payload.fecha_vencimiento = datosActualizados.fecha_vencimiento;
    
    if (datosActualizados.fechaNacimiento !== undefined) payload.fecha_nacimiento = datosActualizados.fechaNacimiento;
    if (datosActualizados.fecha_nacimiento !== undefined) payload.fecha_nacimiento = datosActualizados.fecha_nacimiento;

    const { data, error } = await supabase
      .from('socios')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw new Error(`Error al actualizar socio: ${error.message}`);
    return data[0];
  }

  // 4. Eliminar Físicamente de la tabla
  async eliminar(id) {
    const { error } = await supabase
      .from('socios')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar socio: ${error.message}`);
    return true;
  }

  // 5. Buscar duplicados por DNI
  async buscarPorDni(dni) {
    const { data, error } = await supabase
      .from('socios')
      .select('id, nombre, apellido, dni, telefono, email, direccion, tipo, id_titular, estado, fecha_alta, notas, fecha_nacimiento, actividad, categoria, monto_cuota, fecha_vencimiento')
      .eq('dni', dni.toString());

    if (error) throw new Error(`Error al buscar DNI: ${error.message}`);
    if (!data || data.length === 0) return null;
    
    // 🔌 CONEXIÓN REAL: Retorna el objeto socio limpio de la primera fila
    return data[0]; 
  }

  // 6. Buscar por ID UUID (Extrae la primera fila real de la lista para el Cobrador)
  async buscarPorId(id) {
    const { data, error } = await supabase
      .from('socios')
      .select('id, nombre, apellido, dni, telefono, email, direccion, tipo, id_titular, estado, fecha_alta, notas, fecha_nacimiento, actividad, categoria, monto_cuota, fecha_vencimiento')
      .eq('id', id);

    if (error) throw new Error(`Error al buscar por ID: ${error.message}`);
    if (!data || data.length === 0) return null;
    
    // 🔌 CONEXIÓN REAL: Retorna el objeto socio limpio de la primera fila
    return data[0]; 
  }


  // 6. Buscar por ID único UUID de Supabase
  async buscarPorId(id) {
    const { data, error } = await supabase
      .from('socios')
      .select('id, nombre, apellido, dni, telefono, email, direccion, tipo, id_titular, estado, fecha_alta, notas, fecha_nacimiento, actividad, categoria, monto_cuota, fecha_vencimiento')
      .eq('id', id);

    if (error) throw new Error(`Error al buscar por ID: ${error.message}`);
    if (!data || data.length === 0) return null;
    return data[0]; // Retorna la primera fila limpia
  }
}
