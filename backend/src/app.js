// backend/src/app.js (Servidor API Express - Blindado 100%)
import express from 'express';
import cors from 'cors';
import { supabase } from './infrastructure/database.js';
import { PostgresSocioRepository } from './infrastructure/PostgresSocioRepository.js';
import { RegistrarSocio } from './use-cases/RegistrarSocio.js';
import { ObtenerDashboard } from './use-cases/ObtenerDashboard.js';
import { RegistrarPagoCuota } from './use-cases/RegistrarPagoCuota.js';
import { RegistrarSocioCompleto } from './use-cases/RegistrarSocioCompleto.js';
import { ObtenerHistorialSocio } from './use-cases/ObtenerHistorialSocio.js';
import { ObtenerBalanceCuotas } from './use-cases/ObtenerBalanceCuotas.js';

const app = express();
app.use(cors());
app.use(express.json());

const socioRepository = new PostgresSocioRepository();

const registrarSocioUC =
  new RegistrarSocio(socioRepository);

const registrarSocioCompletoUC =
  new RegistrarSocioCompleto(
    socioRepository,
    supabase,
    registrarSocioUC
  );

const obtenerDashboardUC =
  new ObtenerDashboard(socioRepository);

const registrarPagoCuotaUC =
  new RegistrarPagoCuota(
    socioRepository,
    supabase
  );
const obtenerHistorialSocioUC =
  new ObtenerHistorialSocio(
    supabase
  );
const obtenerBalanceCuotasUC =
  new ObtenerBalanceCuotas(
    supabase,
    socioRepository
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
  try {
    const socioCreado =
      await registrarSocioCompletoUC.ejecutar(
        req.body
      );
    res.status(201).json(socioCreado);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
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

// ENDPOINT PARA EXTRAER EL HISTORIAL DE COMPROBANTES DE UN SOCIO
app.get('/socios/:id/pagos', async (req, res) => {
  try {
    const pagos =
      await obtenerHistorialSocioUC.ejecutar(
        req.params.id
      );
    res.json(pagos);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.get('/cuotas/balance', async (req, res) => {
  try {

 const mesDesde =
  req.query.mesDesde
    ? parseInt(req.query.mesDesde, 10)
    : null;

const mesHasta =
  req.query.mesHasta
    ? parseInt(req.query.mesHasta, 10)
    : null;

const anio =
  req.query.anio
    ? parseInt(req.query.anio, 10)
    : null;

//console.log('BALANCE:', {
//  mesDesde,
//  mesHasta,
//  anio
//});

const resultado =
  await obtenerBalanceCuotasUC.ejecutar({
    mesDesde,
    mesHasta,
    anio
  });

    res.json(resultado);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

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


const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, () => {
  console.log(`🚀 Servidor backend escuchando en puerto ${PUERTO}`);
});