const DIAS = [
  'Lun',
  'Mar',
  'Mié',
  'Jue',
  'Vie',
  'Sáb',
  'Dom'
];
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];
export function renderizarGrillaMensual(
  eventos,
  mes,
  anio
) {

  const contenedor =
    document.getElementById(
      'calendario-eventos'
    );

  if (!contenedor) return;

  const primerDia =
    new Date(anio, mes, 1);

  const ultimoDia =
    new Date(anio, mes + 1, 0);

  let inicioSemana =
    primerDia.getDay();

  inicioSemana =
    inicioSemana === 0
      ? 6
      : inicioSemana - 1;

  const totalDias =
    ultimoDia.getDate();

    let html = `
  <div class="p-4">

    <div
      class="flex items-center justify-between mb-4"
    >

      <button
        id="btn-mes-anterior"
        class="px-3 py-1 border rounded"
      >
        ◀
      </button>

      <h3
        class="font-bold text-lg"
      >
        ${MESES[mes]} ${anio}
      </h3>

      <button
        id="btn-mes-siguiente"
        class="px-3 py-1 border rounded"
      >
        ▶
      </button>

    </div>

    <div
      class="grid grid-cols-7 gap-2 text-center font-bold text-sm text-slate-600 mb-3"
    >
`;

  DIAS.forEach(dia => {

    html += `
      <div>${dia}</div>
    `;
  });

  html += `
      </div>

      <div
        class="grid grid-cols-7 gap-2"
      >
  `;

  for (
    let i = 0;
    i < inicioSemana;
    i++
  ) {

    html += `
      <div
        class="min-h-[100px]"
      ></div>
    `;
  }

  for (
    let dia = 1;
    dia <= totalDias;
    dia++
  ) {

    const fechaTexto =
      `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    const eventosDelDia =
      eventos.filter(evento => {

        const fecha =
          new Date(
            evento.fechaInicio
          );

        const fechaEvento =
          `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

        return fechaEvento === fechaTexto;
      });

    html += `
      <div
        class="border rounded-lg min-h-[100px] p-2 bg-white"
      >

        <div
          class="font-bold text-sm mb-2"
        >
          ${dia}
        </div>
    `;

    eventosDelDia.forEach(evento => {

      html += `
        <div
          class="bg-blue-100 text-blue-800 text-xs rounded px-2 py-1 mb-1 truncate"
          title="${evento.titulo}"
        >
          ${evento.titulo}
        </div>
      `;
    });

    html += `
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  contenedor.innerHTML = html;
}