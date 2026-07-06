// backend/src/infrastructure/PostgresSocioRepository.js
import { supabase } from './database.js';

function calcularColorSemaforo(estadoSocio, fechaVencimientoStr) {
  if (estadoSocio === 'Inactivo') return { color: 'Gris', texto: 'Inactivo' };
  if (!fechaVencimientoStr) return { color: 'Amarillo', texto: 'Vence Hoy' };

  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Parseamos la fecha de Supabase sin importar la zona horaria regional
    const fechaLimpia = fechaVencimientoStr.split('T')[0];
    const partes = fechaLimpia.split('-');
    const vencimiento = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
    vencimiento.setHours(0, 0, 0, 0);

    // 🎯 MATEMÁTICA DEL PROTOTIPO: Calculamos la diferencia exacta en días corrientes
    const diferenciaMilisegundos = vencimiento.getTime() - hoy.getTime();
    const diasFaltantes = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

    if (diasFaltantes < 0) {
      // Pasó la fecha de vencimiento: Rojo estricto
      const diasPasados = Math.abs(diasFaltantes);
      return { color: 'Rojo', texto: `Vencido hace ${diasPasados} ${diasPasados === 1 ? 'día' : 'días'}` };
    } 
    
    if (diasFaltantes === 0) {
      // Es el día exacto de vencimiento (Socio nuevo sin tildar o cuota al límite): Amarillo
      return { color: 'Amarillo', texto: 'Vence Hoy' };
    } 
    
    if (diasFaltantes <= 7) {
      // Está en la semana de gracia de cobro: Amarillo preventivo
      return { color: 'Amarillo', texto: `Vence en ${diasFaltantes} días` };
    }

    // Tiene saldo a favor mayor a una semana: Verde impecable
    return { color: 'Verde', texto: `Al Día (Vence ${vencimiento.toLocaleDateString('es-AR')})` };
  } catch (e) {
    return { color: 'Amarillo', texto: 'Vence Hoy' };
  }
}

export class PostgresSocioRepository {
  
  async obtenerTodos() {
    const { data, error } = await supabase
      .from('socios')
      .select('id, nombre, apellido, dni, telefono, email, direccion, tipo, id_titular, estado, fecha_alta, notas, fecha_nacimiento, actividad, categoria, monto_cuota, fecha_vencimiento')
      .order('fecha_alta', { ascending: false });

    if (error) throw new Error(`Error al obtener socios: ${error.message}`);
    
    return data.map(socio => {
      // 🔌 CONEXIÓN RELACIONAL INTERNA DEL MAPEADOR
      const infoSemaforo = calcularColorSemaforo(socio.estado, socio.fecha_vencimiento);
      
      return {
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
        estadoSemaforo: infoSemaforo.color,
        leyendaSemaforo: infoSemaforo.texto
      };
    });
  }

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
    return data;
  }

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
    return data;
  }

  async eliminar(id) {
    const { error } = await supabase.from('socios').delete().eq('id', id);
    if (error) throw new Error(`Error al eliminar socio: ${error.message}`);
    return true;
  }

  async buscarPorDni(dni) {
    const { data, error } = await supabase
      .from('socios')
      .select('id, nombre, apellido, dni, telefono, email, direccion, tipo, id_titular, estado, fecha_alta, notas, fecha_nacimiento, actividad, categoria, monto_cuota, fecha_vencimiento')
      .eq('dni', dni.toString());
      
    if (error) throw new Error(`Error al buscar DNI: ${error.message}`);
    if (!data || data.length === 0) return null;
    return data; 
  }

  async buscarPorId(id) {
    const { data, error } = await supabase
      .from('socios')
      .select('id, nombre, apellido, dni, telefono, email, direccion, tipo, id_titular, estado, fecha_alta, notas, fecha_nacimiento, actividad, categoria, monto_cuota, fecha_vencimiento')
      .eq('id', id);
      
    if (error) throw new Error(`Error al buscar por ID: ${error.message}`);
    if (!data || data.length === 0) return null;
    return data; 
  }
}
