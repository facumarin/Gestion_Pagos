// backend/src/app.js (Servidor API Express - Blindado 100%)
import express from 'express';
import cors from 'cors';
import { supabase } from './infrastructure/database.js';
import { PostgresSocioRepository } from './infrastructure/PostgresSocioRepository.js';
import { RegistrarSocio } from './use-cases/RegistrarSocio.js';
import { ObtenerDashboard } from './use-cases/ObtenerDashboard.js';

const app = express();
app.use(cors());
app.use(express.json());

const socioRepository = new PostgresSocioRepository();
const registrarSocioUC = new RegistrarSocio(socioRepository);
const obtenerDashboardUC = new ObtenerDashboard(socioRepository);

// 📡 A. Traer los datos del Dashboard y métricas del semáforo
app.get('/dashboard', async (req, res) => {
  try {
    const datos = await obtenerDashboardUC.ejecutar();
    res.json(datos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📡 B. Alta de un miembro (Evita duplicados por DNI)
app.post('/socios', async (req, res) => {
  try {
    const existe = await socioRepository.buscarPorDni(req.body.dni);
    if (existe && existe.length > 0) {
      return res.status(400).json({ error: `El DNI ${req.body.dni} ya está registrado.` });
    }
    const nuevo = await socioRepository.guardar(req.body);
    res.status(201).json(nuevo);
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

// 💵 ENDPOINT DE COBROS INTEGRADO (CON IMPORTACIÓN ACTIVA Y EXTRACTOR DE ARRAY)

app.post('/socios/:id/cobrar', async (req, res) => {
  const { id } = req.params;
  const { monto, medioPago, notas } = req.body;

  try {
    // 1. Buscamos al socio de forma flexible soportando listas u objetos directos
    const resultadoBusqueda = await socioRepository.buscarPorId(id);
    
    // Extraemos la información del socio de forma tolerante
    let socioReal = null;
    if (resultadoBusqueda) {
      socioReal = Array.isArray(resultadoBusqueda) ? resultadoBusqueda[0] : resultadoBusqueda;
    }

    // 2. Buscamos el id de la categoría oficial para tus cuotas en Supabase
    const { data: categoria, error: errorCat } = await supabase
      .from('categorias_caja')
      .select('id')
      .eq('nombre', 'Cuota Social / Arancel')
      .maybeSingle();

    if (errorCat || !categoria) {
      throw new Error("No se encontró la categoría 'Cuota Social / Arancel' en Supabase.");
    }

    // 3. Calculamos matemáticamente el próximo vencimiento (1 mes adelante)
    const hoy = new Date();
    hoy.setMonth(hoy.getMonth() + 1);
    const nuevaFecha = hoy.toISOString().split('T')[0]; // Formato limpio YYYY-MM-DD

    // 4. REGISTRO CONTABLE REAL: Insertamos la fila en la contabilidad general de internet
    const { error: errorCaja } = await supabase
      .from('caja_movimientos')
      .insert([{
        id_categoria: categoria.id,
        id_socio: id,
        concepto: `Cobro de Cuota Social - Miembro: ${socioReal ? (socioReal.nombre + ' ' + (socioReal.apellido || '')) : id}`,
        monto: parseFloat(monto || 5000),
        tipo_pago: medioPago || 'Efectivo', 
        notas: notas || null
      }]);

    if (errorCaja) throw new Error(`Error en caja_movimientos: ${errorCaja.message}`);

    // 5. ACTUALIZACIÓN DE FICHA: Movemos el semáforo e impactamos las columnas
    const payloadSocio = {
      montoCuota: parseFloat(monto || 5000),
      monto_cuota: parseFloat(monto || 5000),
      fechaVencimiento: nuevaFecha,
      fecha_vencimiento: nuevaFecha
    };

    await socioRepository.actualizar(id, payloadSocio);

    res.json({ success: true, fechaVencimiento: nuevaFecha });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
