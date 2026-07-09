export const MESES = [
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

export function obtenerMesActual() {
  return new Date().getMonth() + 1;
}

export function poblarSelectorMeses(idSelect) {
  const select = document.getElementById(idSelect);

  if (!select) return;

  select.innerHTML = MESES.map((mes, index) =>
    `<option value="${index + 1}">${mes}</option>`
  ).join('');

  select.value = String(obtenerMesActual());
}