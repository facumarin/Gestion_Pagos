// backend/src/app.js (Servidor API Express - Blindado 100%)
import express from 'express';
import cors from 'cors';
import { supabase } from './infrastructure/database.js';
import { PostgresSocioRepository } from './infrastructure/PostgresSocioRepository.js';
import { RegistrarSocio } from './use-cases/RegistrarSocio.js';
import { ObtenerDashboard } from './use-cases/ObtenerDashboard.js';
import { RegistrarPagoCuota } from './use-cases/RegistrarPagoCuota.js';
import { RegistrarSocioCompleto } from './use-cases/RegistrarSocioCompleto.js';

const app = express();
app.use(cors());
app.use(express.json());

const socioRepository = new PostgresSocioRepository();

const registrarSocioUC =
  new RegistrarSocio(socioRepository);

const obtenerDashboardUC =
  new ObtenerDashboard(socioRepository);

const registrarPagoCuotaUC =
  new RegistrarPagoCuota(
    socioRepository,
    supabase
  );

// 📡 A. Traer los datos del Dashboard y métricas del semáforo
app.get('/dashboard', async (req, res) => {
  try {
    const datos = await obtenerDashboardUC.ejecutar();
    res.json(datos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// 🟢 
app.get('/medios-pago', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('medios_pago')
      .select('id, nombre, emoji')
      .order('nombre', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// B. Alta de un miembro
app.post('/socios', async (req, res) => {
  // 🔌 Agregamos "condicionIngreso" a la extracción de tu req.body
  const { registraPagoInicial, montoCuota, altaMesContable, altaMedioPago, condicionIngreso } = req.body;

  try {
    const existe = await socioRepository.buscarPorDni(req.body.dni);
    if (existe && existe.length > 0) {
      return res.status(400).json({ error: `El DNI ${req.body.dni} ya está registrado.` });
    }

    // Guardamos la ficha del miembro en la tabla de socios de Supabase
    const resultado = await socioRepository.guardar(req.body);
    const socioCreado = Array.isArray(resultado) ? resultado : resultado;

    // 🧾 REGISTRO RELACIONAL: El dinero SOLO se asienta si la condición es estrictamente 'pago'
    if (condicionIngreso === 'pago' && registraPagoInicial && socioCreado) {
      const anioAct = 2026;
      const mesesTxt = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

      // 1. Pescamos la categoría de cuotas en la nube
      const { data: cat } = await supabase.from('categorias_caja').select('id').eq('nombre', 'Cuota Social / Arancel').maybeSingle();

      if (cat) {
        // 2. Insertamos la obligación liquidada en tu tabla 'cuotas'
        const { data: cuota } = await supabase.from('cuotas').insert([{
          id_socio: socioCreado.id,
          mes: altaMesContable,
          anio: anioAct,
          monto_total: parseFloat(montoCuota || 5000),
          pagada: true,
          saldo_pendiente: 0.00
        }]).select().single();

        if (cuota) {
          // 3. Insertamos el recibo histórico en tu tabla 'pagos' con el mes y año real elegidos
          await supabase.from('pagos').insert([{
            id_cuota: cuota.id,
            monto_abonado: parseFloat(montoCuota || 5000),
            forma_pago: altaMedioPago || 'Efectivo', 
            periodo_mes: altaMesContable,            
            periodo_anio: anioAct,
            cobrado_por: 'Administrativo'
          }]);

          // 4. Insertamos el movimiento contable general para los balances del club
          await supabase.from('caja_movimientos').insert([{
            id_categoria: cat.id,
            id_socio: socioCreado.id,
            concepto: `Pago Inicial Alta - Período: ${mesesTxt[altaMesContable - 1]} ${anioAct}`,
            monto: parseFloat(montoCuota || 5000),
            tipo_pago: altaMedioPago || 'Efectivo'
          }]);
        }
      }
    }

    res.status(201).json(socioCreado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// 📡 C. Modificar la ficha completa de un miembro
app.put('/socios/:id', async (req, res) => {
  try {
    const actualizado = await socioRepository.actualizar(req.params.id, req.body);
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 📡 D. Eliminar físicamente de la nube de Supabase
app.delete('/socios/:id', async (req, res) => {
  try {
    const exito = await socioRepository.eliminar(req.params.id);
    res.json({ success: exito });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 💵 ENDPOINT DE COBROS INTEGRADO 
app.post('/socios/:id/cobrar', async (req, res) => {

  try {

    const resultado =
      await registrarPagoCuotaUC.ejecutar({
        id: req.params.id,
        ...req.body
      });

    res.json(resultado);

  } catch (error) {

    res.status(400).json({
      error: error.message
    });

  }

});

// backend/src/app.js - ENDPOINT PARA EXTRAER EL HISTORIAL DE COMPROBANTES DE UN SOCIO
app.get('/socios/:id/pagos', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Buscamos todas las cuotas liquidadas que pertenezcan a este ID de socio en internet
    const { data: cuotas, error: errorCuotas } = await supabase
      .from('cuotas')
      .select('id')
      .eq('id_socio', id);

    if (errorCuotas) throw errorCuotas;

    if (!cuotas || cuotas.length === 0) {
      return res.json([]); // Si no tiene cuotas, devolvemos un array vacío sin romper la app
    }

    // Extraemos la lista pura de IDs de cuotas [id1, id2, id3...]
    const listaIdsCuotas = cuotas.map(c => c.id);

    // 2. 📡 CONSULTA RELACIONAL: Filtramos los recibos de la tabla 'pagos' que calcen con esas cuotas
    const { data: pagos, error: errorPagos } = await supabase
      .from('pagos')
      .select('id, id_cuota, monto_abonado, fecha_pago, forma_pago, periodo_mes, periodo_anio, numero_recibo')
      .in('id_cuota', listaIdsCuotas)
      .order('fecha_pago', { ascending: false }); // Los más nuevos arriba de todo

    if (errorPagos) throw errorPagos;

    res.json(pagos || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔒 ENDPOINT: VALIDACIÓN DE CREDENCIALES REALES EN SUPABASE AUTH
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Le pedimos al cliente oficial de Supabase que valide la cuenta en la nube
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    // Si Supabase detecta que la clave es incorrecta o el mail no existe, rebota con error
    if (error) {
      return res.status(401).json({ error: "Credenciales de acceso inválidas." });
    }

    // Si la clave es correcta, devolvemos éxito y el token seguro de sesión
    res.json({ success: true, user: data.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const PUERTO = 3000;
app.listen(PUERTO, () => {
  console.log(`🚀 Servidor backend escuchando peticiones en http://localhost:${PUERTO}`);
});
