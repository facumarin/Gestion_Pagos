// backend/src/use-cases/ObtenerDashboard.js
export class ObtenerDashboard {
  constructor(socioRepository) {
    this.socioRepository = socioRepository;
  }

  async ejecutar() {
    // 1. Traemos la lista de socios extendida desde Supabase
    const sociosDb = await this.socioRepository.obtenerTodos() || [];

    if (sociosDb.length === 0) {
      return {
        socios: [],
        metricas: { totalSocios: 0, verdes: 0, amarillos: 0, reds: 0, rojos: 0 }
      };
    }

    // 2. Computamos las métricas leyendo el semáforo dinámico de deudas
    const verdes = sociosDb.filter(s => s.estadoSemaforo === 'Verde').length;
    const amarillos = sociosDb.filter(s => s.estadoSemaforo === 'Amarillo').length;
    const rojos = sociosDb.filter(s => s.estadoSemaforo === 'Rojo').length;

    return {
      socios: sociosDb,
      metricas: {
        totalSocios: sociosDb.length,
        verdes,
        amarillos,
        rojos
      }
    };
  }
}
