// backend/src/app.js
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
import { AnularPago } from './use-cases/AnularPago.js';
import { RegistrarMovimientoCaja } from './use-cases/RegistrarMovimientoCaja.js';
import { ObtenerMovimientosCaja } from './use-cases/ObtenerMovimientosCaja.js';
import multer from 'multer';
import calendarioRoutes from './routes/rutasCalendario.js';

const upload = multer({
  storage: multer.memoryStorage()
});

const app = express();

app.use(cors());
app.use(express.json());
app.use('/calendario', calendarioRoutes);

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
  const anularPagoUC =
  new AnularPago(
    supabase
  );

  const registrarMovimientoCajaUC =
  new RegistrarMovimientoCaja(
    supabase
  );

  const obtenerMovimientosCajaUC =
  new ObtenerMovimientosCaja(
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

// 📡 D. Eliminar físicamente de la nube de la base de datos
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

// 🚫 ANULAR COMPROBANTE
app.post('/pagos/:id/anular', async (req, res) => {

  try {

    const resultado =
      await anularPagoUC.ejecutar(
        req.params.id
      );

    res.json(resultado);

  } catch (error) {

    res.status(400).json({
      error: error.message
    });

  }

});

// 💰 REGISTRAR MOVIMIENTO DE CAJA
app.post('/caja/movimientos', async (req, res) => {

  try {

    const movimiento =
      await registrarMovimientoCajaUC.ejecutar(
        req.body
      );

    res.status(201).json(movimiento);

  } catch (error) {

    res.status(400).json({
      error: error.message
    });

  }

});

// 📝 ENDPOINT CORREGIDO EN APP.JS (Mapeo idéntico a tu base de datos)
app.put('/caja/movimientos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { idCategoria, concepto, monto, medioPago, notas, comprobanteUrl, archivoNombre } = req.body;

    const { data, error } = await supabase
      .from('caja_movimientos')
      .update({
        id_categoria: idCategoria,
        concepto: concepto?.trim(),
        monto: Number(monto),
        tipo_pago: medioPago,
        notas: notas, //  Corregido de 'notes' a 'notas'
        comprobante_url: comprobanteUrl, // Mantiene o actualiza la URL del storage
        archivo_nombre: archivoNombre   // Mantiene o actualiza el nombre del archivo
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// 📋 OBTENER MOVIMIENTOS DE CAJA
app.get('/caja/movimientos', async (req, res) => {

  try {

    const movimientos =
      await obtenerMovimientosCajaUC.ejecutar();

    res.json(movimientos);

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

// 📂 CATEGORÍAS DE CAJA
app.get('/categorias-caja', async (req, res) => {

  try {

    const { data, error } =
      await supabase
        .from('categorias_caja')
        .select('*')
        .order('nombre');

    if (error) throw error;

    res.json(data);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

app.post(
  '/caja/upload-comprobante',
  upload.single('archivo'),
  async (req, res) => {

    try {

      if (!req.file) {

        return res
          .status(400)
          .json({
            error: 'No se recibió archivo.'
          });

      }

      const tipo =
        req.body.tipo || 'ingreso';

      const carpeta =
        tipo.toLowerCase();

      const nombreArchivo =
        `${Date.now()}_${req.file.originalname}`;

      const rutaCompleta =
        `${carpeta}/${nombreArchivo}`;

      const { error } =
        await supabase.storage
          .from(
            'comprobantes-contables'
          )
          .upload(
            rutaCompleta,
            req.file.buffer,
            {
              contentType:
                req.file.mimetype,
              upsert: false
            }
          );

      if (error) throw error;

      const {
        data: urlData
      } =
        supabase.storage
          .from(
            'comprobantes-contables'
          )
          .getPublicUrl(
            rutaCompleta
          );

      res.json({
        url: urlData.publicUrl,
        nombreArchivo
      });

    } catch (error) {

      res.status(500).json({
        error: error.message
      });

    }

  }
);

const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, () => {
  console.log(`🚀 Servidor backend escuchando en puerto ${PUERTO}`);
});