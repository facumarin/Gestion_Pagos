import express from 'express';
import cors from 'cors';

export class ExpressServer {
  constructor(registrarSocioUC, generarCuotasUC, obtenerDashboardUC) {
    this.app = express();
    this.app.use(express.json()); // Permite al servidor entender formato JSON
    this.app.use(cors());         // Habilita llamadas desde otros dominios

    this.configurarRutas(registrarSocioUC, generarCuotasUC, obtenerDashboardUC);
  }

  configurarRutas(registrarSocioUC, generarCuotasUC, obtenerDashboardUC) {
    
    // Ruta 1: Obtener los datos del Semáforo y la tabla para el buscador
    this.app.get('/dashboard', async (req, res) => {
      try {
        const respuesta = await obtenerDashboardUC.ejecutar();
        res.json(respuesta);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Ruta 2: Registrar un nuevo socio en el club
    this.app.post('/socios', async (req, res) => {
      try {
        const nuevoSocio = await registrarSocioUC.ejecutar(req.body);
        res.status(201).json(nuevoSocio);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Ruta 3: Generar las cuotas de un mes para todo el lote de socios
    this.app.post('/cuotas/generar', async (req, res) => {
      try {
        const resultado = await generarCuotasUC.ejecutar(req.body); 
        res.json(resultado);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Nueva Ruta 4 (PAGAR): Ahora adentro del método, compartiendo la estructura limpia
    this.app.post('/cuotas/pagar', async (req, res) => {
      try {
        const { RegistrarPago } = await import('../use-cases/RegistrarPago.js');
        
        // Usamos el cuotaRepository que ya viene inyectado dentro del caso de uso del dashboard
        const cuotaRepo = obtenerDashboardUC.cuotaRepository;
        const registrarPagoUC = new RegistrarPago(cuotaRepo);
        
        const resultado = await registrarPagoUC.ejecutar(req.body); // Recibe { idSocio, mes, anio }
        res.json({ mensaje: "Pago registrado con éxito", cuota: resultado });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  // Enciende el motor de software en el puerto elegido
  iniciar(puerto) {
    this.app.listen(puerto, () => {
      console.log(`🚀 Servidor local escuchando peticiones en: http://localhost:${puerto}`);
    });
  }
}
