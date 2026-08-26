import express from 'express';

import {
  RecursoRepositorySupabase,
  ActividadRepositorySupabase,
  EventoRepositorySupabase
} from '../infrastructure/calendario/RepositoriosSupabase.js';

import { CrearEvento } from '../use-cases/calendario/CrearEvento.js';

const router = express.Router();

const recursoRepo = new RecursoRepositorySupabase();
const actividadRepo = new ActividadRepositorySupabase();
const eventoRepo = new EventoRepositorySupabase();

router.get('/recursos', async (req, res) => {
  try {
    const recursos =
      await recursoRepo.listar({
        soloActivos: true
      });

    res.json(recursos);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});

router.get('/actividades', async (req, res) => {
  try {

    const actividades =
      await actividadRepo.listar({
        soloActivos: true
      });

    res.json(actividades);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});

router.post('/eventos', async (req, res) => {

  try {

    const crearEvento =
      new CrearEvento(
        eventoRepo,
        recursoRepo,
        actividadRepo
      );

    const evento =
      await crearEvento.ejecutar({
        ...req.body,
        fechaInicio:
          new Date(req.body.fechaInicio)
      });

    res.status(201).json(evento);

  } catch (error) {

    res.status(400).json({
      error: error.message
    });
  }
});

export default router;