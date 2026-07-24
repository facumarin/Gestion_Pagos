let comprobanteActivo = null;

export function guardarComprobante(datos) {
  comprobanteActivo = datos;
}

export function obtenerComprobante() {
  return comprobanteActivo;
}

export function mostrarModalComprobante() {
  document
    .getElementById('modal-pago-exito')
    ?.classList.remove('hidden');
}

export function emitirComprobante(comprobanteManual = null){
  const comprobante = comprobanteManual || obtenerComprobante();

  if (!comprobante) {
    console.warn('⚠️ No existe comprobante activo.');
    return;
  }

  const cfg = window.AppConfig || {
    nombre: 'Institución',
    subtitulo: 'Gestión',
    escudoUrl: null,
    terminos: {
      cuotaConcepto: 'Cuota'
    }
  };

  document.getElementById('recibo-nombre-institucion').innerText =
    cfg.nombre;

  document.getElementById('recibo-subtitulo-institucion').innerText =
    cfg.subtitulo;

  document.getElementById('recibo-num-txt').innerText =
    comprobante.numeroRecibo
      ? `#${comprobante.numeroRecibo}`
      : '#----';

  document.getElementById('recibo-fecha-txt').innerText =
    `Fecha: ${new Date().toLocaleDateString('es-AR')}`;

  document.getElementById('recibo-socio-nombre').innerText =
    comprobante.nombreCompleto || '';

  document.getElementById('recibo-socio-dni').innerText =
    `DNI: ${comprobante.dni || '-'}`;

  document.getElementById('recibo-socio-plan').innerText =
    `Arancel: ${comprobante.tipo || 'Cuota Social'}`;

  document.getElementById('recibo-socio-periodo').innerText =
    comprobante.periodo || '-';

  document.getElementById('recibo-tabla-concepto').innerText =
    `${cfg.nombre} - ${cfg.terminos.cuotaConcepto}`;

  document.getElementById('recibo-tabla-medio').innerText =
    comprobante.medio || 'Efectivo';

  document.getElementById('recibo-tabla-monto').innerText =
    `$${Number(comprobante.monto || 0)
      .toLocaleString('es-AR', {
        minimumFractionDigits: 2
      })}`;

  const logo =
    document.getElementById('recibo-logo-img');
/*
  console.log('==============================');
  console.log('🖨️ EMISIÓN DE COMPROBANTE');
  console.log('cfg.escudoUrl:', cfg.escudoUrl);
  console.log('logo encontrado:', !!logo);
*/
  if (logo && cfg.escudoUrl) {
/*
    console.log('logo.src actual:', logo.src);
    console.log('logo.complete:', logo.complete);
    console.log('logo.naturalWidth:', logo.naturalWidth);
*/
    if (
      logo.src.includes(cfg.escudoUrl) &&
      logo.complete &&
      logo.naturalWidth > 0
    ) {
     // console.log('✅ Logo ya cargado y válido. Imprimiendo...' );

      window.print();
      return;
    }

    logo.onload = null;
    logo.onerror = null;

    logo.onload = function () {
/*
      console.log('✅ LOGO CARGADO CORRECTAMENTE');
      console.log('logo.src:',logo.src);
      console.log('logo.naturalWidth:',logo.naturalWidth);
*/
      window.print();
    };

    logo.onerror = function (error) {

      console.error('❌ ERROR CARGANDO LOGO' );
/*
      console.log('Intentó cargar:',cfg.escudoUrl);
      console.log('logo.src final:',logo.src);
      console.log(error);
*/
      window.print();
    };

    //console.log( '➡️ Asignando logo:',cfg.escudoUrl);

    logo.src = cfg.escudoUrl;

  } else {

    console.warn('⚠️ No existe el elemento logo o cfg.escudoUrl está vacío');

    window.print();
  }
}