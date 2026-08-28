import {
  obtenerEventos
} from './calendario-api.js';
import {
  renderizarGrillaMensual
} from './calendario-grilla.js';

let mesActual;
let anioActual;

export async function inicializarCalendario() {

  try {

    const hoy = new Date();

mesActual =
  hoy.getMonth();

anioActual =
  hoy.getFullYear();


    const desde = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    );

    const hasta = new Date(
      hoy.getFullYear(),
      hoy.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const eventos =
      await obtenerEventos(
        desde.toISOString(),
        hasta.toISOString()
      );

    renderizarGrillaMensual(
  eventos,
  mesActual,
  anioActual
);

registrarEventosNavegacion();

  } catch (error) {

    console.error(
      '[Calendario]',
      error
    );

    const contenedor =
      document.getElementById(
        'calendario-eventos'
      );

    if (contenedor) {

      contenedor.innerHTML = `
        <div class="p-4 text-rose-600 font-semibold">
          Error al cargar los eventos.
        </div>
      `;
    }
  }
}

function renderizarEventos(eventos) {

  const contenedor =
    document.getElementById(
      'calendario-eventos'
    );

  if (!contenedor) return;

  if (!eventos.length) {

    contenedor.innerHTML = `
      <div class="p-4 text-gray-500">
        No existen eventos cargados.
      </div>
    `;

    return;
  }

  contenedor.innerHTML =
    eventos.map(evento => {

      const fecha =
        new Date(
          evento.fechaInicio
        );

      return `
        <div class="p-4 border-b border-gray-100">
          <div class="font-bold text-gray-900">
            ${evento.titulo}
          </div>

          <div class="text-sm text-gray-500 mt-1">
            ${fecha.toLocaleDateString('es-AR')}
          </div>

          <div class="text-sm text-gray-500">
            ${fecha.toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      `;
    }).join('');
}
function registrarEventosNavegacion() {

  const btnAnterior =
    document.getElementById(
      'btn-mes-anterior'
    );

  const btnSiguiente =
    document.getElementById(
      'btn-mes-siguiente'
    );

  if (btnAnterior) {

    btnAnterior.onclick =
      () => {

        console.log(
          'Mes anterior'
        );
      };
  }

  if (btnSiguiente) {

    btnSiguiente.onclick =
      () => {

        console.log(
          'Mes siguiente'
        );
      };
  }
}