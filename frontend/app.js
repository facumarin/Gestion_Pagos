// frontend/app.js
import { iniciarRelojLocal } from './src/reloj.js';
import { configurarNavegacion } from './src/navegacion.js';
import { obtenerDatosDashboard } from './src/api.js';
import { configurarModalPago } from './src/modals/modal-pago.js';
import { configurarModalSocio } from './src/modals/modal-socio.js';
import { exportarExcelContable, exportarPDFContable } from './src/reportes.js';
import { obtenerBalanceCuotas } from './src/api-cuotas.js';
import { API_URL } from './src/config-api.js';
import { MESES, poblarSelectorMeses,  obtenerMesActual} from './src/fechas.js';

let todosLosSocios = [];
let ultimoComprobante = null;

function aplicarConfiguracionVisual() {
  const cfg = window.AppConfig;
  if (!cfg) return;
  const subtituloLogin = document.getElementById('login-subtitulo-dinamico');
  if (subtituloLogin) {
    subtituloLogin.innerText = `${cfg.nombre} - Panel Administrativo`;
  }
  const emailInput = document.getElementById('login-email');
  if (emailInput) {
    emailInput.placeholder = 'ejemplo@institucion.com'; 
  }
  const imgEscudo = document.getElementById('app-escudo-img');
  if (imgEscudo) {
    imgEscudo.src = cfg.escudoUrl;
    imgEscudo.onerror = function() {
      this.style.display = 'none';
      this.parentElement.innerHTML = cfg.emojiDefecto || ' ';
    };
  }
  document.getElementById('app-nombre-entidad').innerText = cfg.nombre;
  document.getElementById('app-subtitulo-entidad').innerText = cfg.subtitulo;
  document.getElementById('menu-txt-plural').innerText = cfg.terminos.plural;
  document.getElementById('btn-txt-nuevo').innerText = `+ ${cfg.terminos.nuevoEntidad}`;
  document.getElementById('th-dashboard-entidad').innerText = `${cfg.terminos.singular} / Nombre`;
  document.getElementById('th-padron-entidad').innerText = `${cfg.terminos.singular} / Ficha`;
  document.getElementById('txt-modal-titulo-alta').innerText = cfg.terminos.nuevoEntidad;
}
// frontend/app.js (Orquestador Central)

async function cargarDashboard() {
  const badge = document.getElementById('badge-conexion');
  const dot = document.getElementById('dot-conexion');
  const txt = document.getElementById('txt-conexion');
  try {
    const datos = await obtenerDatosDashboard();
    todosLosSocios = datos.socios;
    
    const sociosActivos = todosLosSocios.filter(s => s.estado !== 'Inactivo');
    const verdes = sociosActivos.filter(s => s.estadoSemaforo === 'Verde').length;
    const amarillos = sociosActivos.filter(s => s.estadoSemaforo === 'Amarillo').length;
    const rojos = sociosActivos.filter(s => s.estadoSemaforo === 'Rojo').length;
    const totalActivos = sociosActivos.length;

    document.getElementById('txt-total').innerText = totalActivos;
    document.getElementById('txt-verdes').innerText = verdes;
    document.getElementById('txt-amarillos').innerText = amarillos;
    document.getElementById('txt-rojos').innerText = rojos;

    renderizarTabla(sociosActivos); 
    renderizarPadronSocios(todosLosSocios); 
    
    // Disparamos la sincronización de las tarjetas de aranceles
    //window.recalcularMetricasCuotasPorMes();

    
    if (txt) txt.innerText = "Sincronizado";
    if (dot) dot.className = "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse";
    if (badge) badge.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 transition-all duration-300";
  } catch (error) {
    console.error("Error al sincronizar dashboard:", error);
    if (document.getElementById('tabla-socios-body')) {
      document.getElementById('tabla-socios-body').innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-semibold">❌ No se pudo conectar con el servidor.</td></tr>`;
    }
    if (txt) txt.innerText = "Desconectado";
    if (dot) dot.className = "w-1.5 h-1.5 rounded-full bg-rose-500";
    if (badge) badge.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 transition-all duration-300";
  }
}

async function cargarBalanceCuotas() {
  try {
    const balance = await obtenerBalanceCuotas();
    document.getElementById('txt-caja-estimada').innerText = `$${balance.proyectado.toLocaleString('es-AR')}`;
    document.getElementById('txt-caja-real').innerText = `$${balance.cobrado.toLocaleString('es-AR')}`;
    document.getElementById('txt-caja-mora').innerText = `$${balance.pendiente.toLocaleString('es-AR')}`;
  } catch (error) {
    console.error(
      'Error al cargar balance:',
      error
    );
  }
}

function renderizarTabla(listaDeSocios) {
  const tbody = document.getElementById('tabla-socios-body');
  if (!tbody) return;
  const configuracionSemaforo = {
    'Verde': { claseBadge: 'bg-emerald-50 text-emerald-700 border-emerald-100', claseDot: 'bg-emerald-500' },
    'Amarillo': { claseBadge: 'bg-amber-50 text-amber-700 border-amber-100', claseDot: 'bg-amber-500' },
    'Rojo': { claseBadge: 'bg-rose-50 text-rose-700 border-rose-100', claseDot: 'bg-rose-500' },
    'Gris': { claseBadge: 'bg-slate-50 text-slate-600 border-slate-200', claseDot: 'bg-slate-400' }
  };
  tbody.innerHTML = listaDeSocios.map(socio => {
    const estilo = configuracionSemaforo[socio.estadoSemaforo] || { claseBadge: 'bg-gray-50 text-gray-600 border-gray-100', claseDot: 'bg-gray-400' };
    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50/60 transition text-sm">
        <td class="p-4 pl-6">
          <span onclick="window.verFichaDetalladaSocio('${socio.id}')" class="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition">${socio.nombre} ${socio.apellido || ''}</span>
        </td>
        <td class="p-4 text-gray-600">${socio.dni}</td>
        <td class="p-4 text-gray-500"><span class="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">${socio.tipo}</span></td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${estilo.claseBadge}">
            <span class="w-1.5 h-1.5 rounded-full ${estilo.claseDot}"></span>${socio.leyendaSemaforo || socio.estadoSemaforo}
          </span>
        </td>
        <td class="p-4 pr-6 text-right space-x-1">
          <button onclick="abrirModalConfirmarPago('${socio.id}')" class="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-1.5 px-3 rounded border border-emerald-200 transition cursor-pointer active:scale-[0.97]">Cobrar</button>
          <button onclick="abrirModalWhatsApp('${socio.id}')" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1.5 px-3 rounded border border-blue-200 transition cursor-pointer active:scale-[0.97]">Alerta</button>
        </td>
      </tr>
    `;
  }).join('');
}
// frontend/app.js (Orquestador Central) - PARTE 3 DE 4

function renderizarPadronSocios(listaDeSocios) {
  const tbody = document.getElementById('tabla-padron-body');
  if (!tbody) return;
  tbody.innerHTML = listaDeSocios.map(socio => {
    const esActivo = socio.estado !== 'Inactivo'; 
    const claseEstado = esActivo ? 'bg-emerald-100 text-emerald-800 border-emerald-500' : 'bg-gray-100 text-gray-600 border-gray-300';
    const textoBotonBaja = esActivo ? '🔻 Baja' : '🟢 Activar';
    const completoNombre = `${socio.nombre} ${socio.apellido || ''}`.trim();
    const nombreEscapado = completoNombre.replace(/'/g, "\\'");
    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50/60 transition text-sm text-gray-700">
        <td class="p-4 pl-6">
          <span onclick="window.verFichaDetalladaSocio('${socio.id}')" class="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition">${completoNombre}</span>
          <span class="block text-[10px] text-gray-400 font-sans tracking-wide mt-0.5">${socio.direccion || 'Sin dirección'}</span>
        </td>
        <td class="p-4 font-mono font-medium text-gray-900">${socio.dni}</td>
        <td class="p-4">
          <div class="text-gray-900 font-medium">${socio.telefono || 'Sin número'}</div>
          <div class="text-gray-400 text-xs font-sans">${socio.email || 'Sin correo'}</div>
        </td>
        <td class="p-4">
          <div class="font-bold text-gray-800">${socio.tipo}</div>
          <div class="text-[11px] text-gray-500 font-sans font-medium mt-0.5">${socio.actividad || 'General'} • ${socio.categoria || 'Socio'}</div>
        </td>
        <td class="p-4 text-center font-medium text-gray-600">${socio.fechaAlta ? new Date(socio.fechaAlta).toLocaleDateString('es-AR') : '-'}</td> 
        <td class="p-4 text-center"><span class="px-2.5 py-0.5 rounded-full text-xs font-bold border-l-4 ${claseEstado}">${esActivo ? 'Activo' : 'Inactivo'}</span></td>
        <td class="p-4 pr-6">
          <div class="flex justify-end gap-1.5">
            <button onclick="window.toggleBajaSocio('${socio.id}')" class="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-2.5 rounded border border-gray-200 transition cursor-pointer active:scale-[0.97]">${textoBotonBaja}</button>
            <button onclick="window.abrirModalEditarSocio('${socio.id}')" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1.5 px-2.5 rounded border border-blue-200 transition cursor-pointer active:scale-[0.97]">✏️</button>
            <button onclick="window.eliminarSocioPadrón('${socio.id}', '${nombreEscapado}')" class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 px-2.5 rounded border border-rose-200 transition cursor-pointer active:scale-[0.97]">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.abrirModalEditarSocio = function(idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  document.getElementById('edit-form-id').value = socio.id;
  document.getElementById('edit-form-nombre').value = socio.nombre;
  document.getElementById('edit-form-apellido').value = socio.apellido || '';
  document.getElementById('edit-form-dni').value = socio.dni;
  document.getElementById('edit-form-telefono').value = socio.telefono || '';
  document.getElementById('edit-form-email').value = socio.email || '';
  document.getElementById('edit-form-direccion').value = socio.direccion || '';
  document.getElementById('edit-form-tipo').value = socio.tipo || '';
  document.getElementById('edit-form-monto').value = socio.montoCuota || 0;
  document.getElementById('edit-form-notas').value = socio.notas || '';
  document.getElementById('edit-form-actividad').value = socio.actividad || '';
  document.getElementById('edit-form-categoria').value = socio.categoria || '';
  if (socio.fechaNacimiento) document.getElementById('edit-form-nacimiento').value = socio.fechaNacimiento.split('T')[0];
  if (socio.fechaVencimiento) document.getElementById('edit-form-vencimiento').value = socio.fechaVencimiento.split('T')[0];
  document.getElementById('modal-editar-socio').classList.remove('hidden');
}

window.cerrarModalEditarSocio = function() {
  document.getElementById('modal-editar-socio').classList.add('hidden');
}

window.toggleBajaSocio = function(idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  const esActivo = socio.estado !== 'Inactivo';
  const proximoEstado = esActivo ? 'Inactivo' : 'Activo';
  document.getElementById('lbl-baja-titulo').innerText = esActivo ? ' 🔻 Confirmar Baja' : ' 🟢 Activar Miembro';
  document.getElementById('lbl-baja-nombre').innerText = `${socio.nombre} ${socio.apellido || ''}`;
  const btnEjecutar = document.getElementById('btn-baja-ejecutar');
  btnEjecutar.onclick = async function() {
    try {
      await fetch(`${API_URL}/socios/${idSocio}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...socio, estado: proximoEstado })
      });
      document.getElementById('modal-baja-confirmar').classList.add('hidden');
      await cargarDashboard();
    } catch (error) {
      alert("⚠️ Error de conexión al procesar el cambio de estado.");
    }
  };
  document.getElementById('modal-baja-confirmar').classList.remove('hidden');
}

window.eliminarSocioPadrón = function(idSocio, nombreSocio) {
  document.getElementById('lbl-eliminar-nombre').innerText = nombreSocio;
  const btnEjecutar = document.getElementById('btn-eliminar-ejecutar');
  btnEjecutar.onclick = async function() {
    try {
      const res = await fetch(`${API_URL}/socios/${idSocio}`, {
  method: 'DELETE'
});
      if (!res.ok) throw new Error();
      document.getElementById('modal-eliminar-confirmar').classList.add('hidden');
      await cargarDashboard();
    } catch (error) {
      alert("⚠️ Error de comunicación con la base de datos cloud.");
    }
  };
  document.getElementById('modal-eliminar-confirmar').classList.remove('hidden');
}
// frontend/app.js (Alertas, Pasarelas y Auditoría de Aranceles) - PARTE 4-A

let socioWhatsAppActivo = null;
let tipoNotificacionActual = 'vencido';

window.abrirModalWhatsApp = function (idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  socioWhatsAppActivo = socio;
  tipoNotificacionActual = socio.estadoSemaforo === 'Rojo' ? 'vencido' : 'proximo';
  
  document.getElementById('wa-socio-nombre').innerText = `${socio.nombre} ${socio.apellido || ''}`;
  document.getElementById('wa-socio-telefono').innerText = socio.telefono || 'Sin número';
  document.getElementById('wa-socio-iniciales').innerText = socio.nombre.substring(0, 2).toUpperCase();
  
  actualizarDiseñoBotonesTipoRecordatorio();
  armarPlantillaMensajeTexto();
  document.getElementById('modal-whatsapp').classList.remove('hidden');
}

window.cerrarModalWhatsApp = function () {
  document.getElementById('modal-whatsapp').classList.add('hidden');
}

window.cambiarTipoMensajeWhatsApp = function (nuevoTipo) {
  tipoNotificacionActual = nuevoTipo;
  actualizarDiseñoBotonesTipoRecordatorio();
  armarPlantillaMensajeTexto();
}

function actualizarDiseñoBotonesTipoRecordatorio() {
  const btnVencido = document.getElementById('btn-wa-vencido');
  const btnProximo = document.getElementById('btn-wa-proximo');
  if (tipoNotificacionActual === 'vencido') {
    btnVencido.className = "p-3 border-2 border-rose-500 rounded-xl text-left transition bg-rose-50/50 cursor-pointer";
    btnProximo.className = "p-3 border-2 border-gray-200 rounded-xl text-left transition hover:border-amber-400 cursor-pointer";
  } else {
    btnVencido.className = "p-3 border-2 border-gray-200 rounded-xl text-left transition hover:border-rose-400 cursor-pointer";
    btnProximo.className = "p-3 border-2 border-amber-500 rounded-xl text-left transition bg-amber-50/50 cursor-pointer";
  }
}

function armarPlantillaMensajeTexto() {
  if (!socioWhatsAppActivo) return;
  const txt = tipoNotificacionActual === 'vencido' ? 'VENCIDO' : 'próxima a vencer';
  document.getElementById('txt-wa-cuerpo').value = `Hola ${socioWhatsAppActivo.nombre},\n\nTe recordamos que tu cuota de $${socioWhatsAppActivo.montoCuota || 0} se encuentra en estado ${txt}.`;
}

window.dispararPestañaWhatsApp = function () {
  const urlFinal = `https://wa.me/${socioWhatsAppActivo.telefono}?text=${encodeURIComponent(document.getElementById('txt-wa-cuerpo').value)}`;
  window.open(urlFinal, '_blank');
  document.getElementById('modal-whatsapp').classList.add('hidden');
}

// --- COBROS ---
let socioCobroActivo = null;
let modalidadCobroActual = 'total';

window.abrirModalConfirmarPago = function (idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  socioCobroActivo = socio;
  modalidadCobroActual = 'total';
let montoPlan = parseFloat(socio.montoCuota || socio.monto_cuota);

if (isNaN(montoPlan) || montoPlan <= 0) {
  alert(
    'El socio no tiene una cuota válida configurada. Revise la ficha antes de cobrar.'
  );
  return;
}
  
  if (window.AppConfig?.modulosActivos?.recargosMora && socio.estadoSemaforo === 'Rojo') {
    montoPlan += (montoPlan * 5) / 100;
  }
  const fechaRef = socio.fechaVencimiento || socio.fecha_vencimiento;
  let dateObj = new Date();
  if (fechaRef) dateObj = new Date(typeof fechaRef === 'string' ? fechaRef.split('T')[0].replace(/-/g, '/') : fechaRef);
  if (isNaN(dateObj.getTime())) dateObj = new Date();

  
  document.getElementById('pago-socio-nombre').innerText = `${socio.nombre} ${socio.apellido || ''}`;
  document.getElementById('pago-servicio-txt').innerHTML = `${socio.tipo || 'Cuota'} <span class="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs ml-1 font-black uppercase">Abona: ${MESES[dateObj.getMonth()]} ${dateObj.getFullYear()}</span>`;
  document.getElementById('pago-monto-txt').innerText = `$${montoPlan.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
  document.getElementById('pago-vencimiento-txt').innerText = fechaRef ? new Date(fechaRef).toLocaleDateString('es-AR') : '-';
  document.getElementById('txt-pago-notas').value = '';
  document.getElementById('input-monto-parcial').value = montoPlan;
  document.getElementById('contenedor-monto-parcial').classList.add('hidden');
  actualizarDisenoBotonesCobro(); 
  document.getElementById('modal-confirmar-pago').classList.remove('hidden');
}

window.cerrarModalConfirmarPago = function () {
  document.getElementById('modal-confirmar-pago').classList.add('hidden');
}

window.seleccionarTipoCobro = function (modalidad) {
  modalidadCobroActual = modalidad;
  actualizarDisenoBotonesCobro();
  if (modalidad === 'parcial') document.getElementById('contenedor-monto-parcial').classList.remove('hidden');
  else document.getElementById('contenedor-monto-parcial').classList.add('hidden');
}

function actualizarDisenoBotonesCobro() {
  const btnTotal = document.getElementById('btn-pago-total');
  const btnParcial = document.getElementById('btn-pago-parcial');
  if (modalidadCobroActual === 'total') {
    btnTotal.className = "p-3 border-2 border-emerald-500 rounded-xl bg-emerald-50/50 cursor-pointer text-center";
    btnParcial.className = "p-3 border-2 border-gray-200 rounded-xl cursor-pointer text-center";
  } else {
    btnTotal.className = "p-3 border-2 border-gray-200 rounded-xl cursor-pointer text-center";
    btnParcial.className = "p-3 border-2 border-amber-500 rounded-xl bg-amber-50/50 cursor-pointer text-center";
  }
}
// frontend/app.js (Procesamiento de Cobros, Ticket y Ficha) - PARTE 4-B

window.procesarCobroDefinitivo = async function () {
  if (!socioCobroActivo) return;
  const notas = document.getElementById('txt-pago-notas').value.trim();
  const medio = document.getElementById('select-pago-medio').value;
  let montoACobrar = parseFloat(socioCobroActivo.montoCuota || 0);
  if (modalidadCobroActual === 'parcial') montoACobrar = parseFloat(document.getElementById('input-monto-parcial').value) || 0;
  
  try {
    const res = await fetch(`${API_URL}/socios/${socioCobroActivo.id}/cobrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: montoACobrar, medioPago: medio, notas, tipoVencimiento: 'calendario' })
    });
    const respuestaAPI = await res.json();

if (!res.ok) {
  throw new Error(
    respuestaAPI.error || "Error de respuesta"
  );
}

ultimoComprobante = {
  numeroRecibo: respuestaAPI.numeroRecibo,
  periodo: `${respuestaAPI.mesLiquidado} ${respuestaAPI.anioLiquidado}`
};   
    document.getElementById('modal-confirmar-pago').classList.add('hidden');
    document.getElementById('lbl-pagoexito-nombre').innerText = `${socioCobroActivo.nombre} ${socioCobroActivo.apellido || ''}`;
    document.getElementById('lbl-pagoexito-monto').innerText = `$${montoACobrar.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
    document.getElementById('lbl-pagoexito-tipo').innerHTML = `${modalidadCobroActual === 'total' ? 'Pago Total' : 'Pago Parcial'} <br><span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Período: ${respuestaAPI.mesLiquidado || ''} ${respuestaAPI.anioLiquidado || ''}</span>`;
    document.getElementById('modal-pago-exito').classList.remove('hidden');
    await cargarDashboard();
  } catch (error) {
    alert(error.message || "Error al registrar el cobro en Supabase.");
  }
}

window.emitirComprobanteImpreso = function() {
  if (!socioCobroActivo) return;
  const cfg = window.AppConfig || { nombre: "Institución", subtitulo: "Gestión", terminos: { cuotaConcepto: "Cuota" } };
  const medio = document.getElementById('select-pago-medio').options[document.getElementById('select-pago-medio').selectedIndex]?.text || 'Efectivo';
  let montoAbonado = parseFloat(socioCobroActivo.montoCuota || 0);
  if (modalidadCobroActual === 'parcial') montoAbonado = parseFloat(document.getElementById('input-monto-parcial').value) || 0;
  
  // Sincronización Marca Blanca Nativa
  document.getElementById('recibo-nombre-institucion').innerText = cfg.nombre;
  document.getElementById('recibo-subtitulo-institucion').innerText = cfg.subtitulo;
  const logo =  document.getElementById('recibo-logo-img');
if (logo) {
  logo.src = cfg.escudoUrl;
}
document.getElementById('recibo-num-txt').innerText = ultimoComprobante?.numeroRecibo? `#${ultimoComprobante.numeroRecibo}` : '#----';
  document.getElementById('recibo-fecha-txt').innerText = `Fecha: ${new Date().toLocaleDateString('es-AR')}`;
  document.getElementById('recibo-socio-nombre').innerText = `${socioCobroActivo.nombre} ${socioCobroActivo.apellido || ''}`.trim();
  document.getElementById('recibo-socio-dni').innerText = `DNI: ${socioCobroActivo.dni}`;
  document.getElementById('recibo-socio-plan').innerText = `Arancel: ${socioCobroActivo.tipo || 'Cuota Social'}`;
  document.getElementById('recibo-socio-periodo').innerText = ultimoComprobante?.periodo || 'Período saldado';
  document.getElementById('recibo-tabla-concepto').innerText = `${cfg.nombre} - ${cfg.terminos.cuotaConcepto}`;
  document.getElementById('recibo-tabla-medio').innerText = medio;
  document.getElementById('recibo-tabla-monto').innerText = `$${montoAbonado.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
  window.print();
}

async function inicializarMediosDePagoPantalla() {
  try {
   const respuesta = await fetch(`${API_URL}/medios-pago`);
    if (!respuesta.ok) throw new Error();
    const medios = await respuesta.json();
    const opcionesHTML = medios.map(m => `<option value="${m.id}">${m.emoji || ' '} ${m.nombre}</option>`).join('');
    
    const selectAlta = document.getElementById('form-alta-medio');
    const selectCobro = document.getElementById('select-pago-medio');
    if (selectAlta) selectAlta.innerHTML = opcionesHTML;
    if (selectCobro) selectCobro.innerHTML = opcionesHTML;
  } catch (error) {
    console.error("Error al poblar pasarelas:", error);
  }
}

window.verFichaDetalladaSocio = async function(idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  document.getElementById('ficha-avatar-txt').innerText = String(socio.nombre).substring(0, 2).toUpperCase();
  document.getElementById('ficha-nombre-completo').innerText = `${socio.nombre} ${socio.apellido || ''}`.trim();
  document.getElementById('ficha-dni').innerText = socio.dni;
  document.getElementById('ficha-telefono').innerText = socio.telefono || 'Sin teléfono';
  document.getElementById('ficha-email').innerText = socio.email || 'Sin correo electrónico';
  document.getElementById('ficha-actividad').innerText = `${socio.actividad || 'General'} / ${socio.categoria || 'Socio'}`;
  document.getElementById('ficha-monto').innerText = `$${parseFloat(socio.montoCuota || 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
  const vencimientoTxt = socio.fechaVencimiento || socio.fecha_vencimiento;
  document.getElementById('ficha-vencimiento').innerText = vencimientoTxt ? vencimientoTxt.split('T')[0] : 'Sin fecha';
  
  const badgeEstado = document.getElementById('ficha-estado-badge');
  if (badgeEstado) {
    badgeEstado.innerText = socio.leyendaSemaforo || socio.estadoSemaforo;
    const clasesSemaforo = { 'Verde': 'bg-emerald-50 text-emerald-700 border-emerald-200', 'Amarillo': 'bg-amber-50 text-amber-700 border-amber-200', 'Rojo': 'bg-rose-50 text-rose-700 border-rose-200', 'Gris': 'bg-slate-50 text-slate-600 border-slate-200' };
    badgeEstado.className = `inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 border ${clasesSemaforo[socio.estadoSemaforo] || 'bg-gray-50'}`;
  }
  const tablaPagosBody = document.getElementById('ficha-tabla-pagos-body');
  if (tablaPagosBody) tablaPagosBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400">Buscando recibos...</td></tr>`;
  try {
  const res = await fetch(`${API_URL}/socios/${idSocio}/pagos`);
    const pagosHistoricos = await res.json();
    if (!pagosHistoricos || pagosHistoricos.length === 0) {
      tablaPagosBody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-400">Sin comprobantes emitidos.</td></tr>`;
    } else {
      
      tablaPagosBody.innerHTML = pagosHistoricos.map(p => {
        const fechaPagoObj = new Date(p.fecha_pago || p.created_at);
        return `
          <tr class="hover:bg-slate-50/80 transition text-gray-600">
            <td class="p-3 pl-4 font-medium text-gray-400">${fechaPagoObj.toLocaleDateString('es-AR')}</td>
            <td class="p-3 text-center font-mono font-bold text-blue-600">#${String(p.numero_recibo || '-').padStart(4, '0')}</td>
            <td class="p-3 text-center font-semibold uppercase text-slate-700"><span class="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">${p.periodo_mes
  ? MESES[
      parseInt(p.periodo_mes, 10) - 1
    ].substring(0, 3)
  : '-'} ${p.periodo_anio || ''}</span></td>
            <td class="p-3 text-center font-medium text-gray-500">${p.forma_pago || 'Efectivo'}</td>
            <td class="p-3 text-right pr-4 font-mono font-black text-emerald-600">$${parseFloat(p.monto_abonado || 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
          </tr>`;
      }).join('');
    }
  } catch (err) {
    if (tablaPagosBody) tablaPagosBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-rose-500 font-semibold">⚠️ Error de red.</td></tr>`;
  }
  document.getElementById('modal-ficha-historica').classList.remove('hidden');
}

window.cerrarFichaHistoricaSocio = function() {
  document.getElementById('modal-ficha-historica').classList.add('hidden');
}
// frontend/app.js (Motor de Rangos Desde/Hasta y Cierre del Archivo) - PARTE 4-C

let auditoriaColorActivoGlobal = 'Todos';

window.evaluarEstructuraFiltroRango = function() {
  const checkActivo = document.getElementById('check-habilitar-rango').checked;
  const lblDesde = document.getElementById('lbl-caja-desde');
  const contenedorHasta = document.getElementById('contenedor-caja-hasta');
  if (checkActivo) {
    lblDesde?.classList.remove('hidden');
    contenedorHasta?.classList.remove('hidden');
  } else {
    lblDesde?.classList.add('hidden');
    contenedorHasta?.classList.add('hidden');
  }
  window.recalcularMetricasCuotasPorMes();
}

window.recalcularMetricasCuotasPorMes = function() {
  const checkActivo = document.getElementById('check-habilitar-rango')?.checked || false;
  const mesDesde = parseInt(
  document.getElementById('select-cuotas-mes-desde')?.value ||
  obtenerMesActual(),
  10
);

const mesHasta = checkActivo
  ? parseInt(
      document.getElementById('select-cuotas-mes-hasta')?.value ||
      obtenerMesActual(),
      10
    )
  : mesDesde;

  const montoBaseDefault = window.AppConfig?.montoBaseDefault || 0;

  const sociosActivos = todosLosSocios.filter(s => s.estado !== 'Inactivo');
  let estimadosMonto = 0; let cobradosMonto = 0; let moraMonto = 0;

  sociosActivos.forEach(socio => {
    const cuotaMonto = parseFloat(socio.montoCuota || socio.monto_cuota || montoBaseDefault);
    estimadosMonto += cuotaMonto;
    const fVenc = socio.fechaVencimiento || socio.fecha_vencimiento;
    if (fVenc) {
      const mesVencimientoSocio = new Date(fVenc).getUTCMonth() + 1;
      if (mesVencimientoSocio > mesHasta) cobradosMonto += cuotaMonto;
      else if (mesVencimientoSocio >= mesDesde && mesVencimientoSocio <= mesHasta) moraMonto += cuotaMonto;
      else estimadosMonto -= cuotaMonto; 
    } else {
      moraMonto += cuotaMonto;
    }
  });

  document.getElementById('txt-caja-estimada').innerText = `$${estimadosMonto.toLocaleString('es-AR')},00`;
  document.getElementById('txt-caja-real').innerText = `$${cobradosMonto.toLocaleString('es-AR')},00`;
  document.getElementById('txt-caja-mora').innerText = `$${moraMonto.toLocaleString('es-AR')},00`;
  
  window.renderizarTablaAuditoriaCuotas();
}

window.filtrarAuditoriaCuotas = function(color) {
  auditoriaColorActivoGlobal = color;
  const titulos = { 'Todos': 'Listado General del Período', 'Verde': 'Comprobantes Saldados (Al Día)', 'Rojo': 'Padrón de Miembros en Mora' };
  const lblTitulo = document.getElementById('lbl-auditoria-titulo-filtro');
  if (lblTitulo) lblTitulo.innerText = titulos[color] || 'Listado General';
  window.renderizarTablaAuditoriaCuotas();
}

window.renderizarTablaAuditoriaCuotas = function() {
  const tbody = document.getElementById('tabla-auditoria-cuotas-body');
  const buscadorTxt = document.getElementById('input-buscador-auditoria-cuotas')?.value.toLowerCase().trim() || '';
  if (!tbody) return;

  const checkActivo = document.getElementById('check-habilitar-rango')?.checked || false;
 const mesDesde = parseInt(
  document.getElementById('select-cuotas-mes-desde')?.value ||
  obtenerMesActual(),
  10
);

const mesHasta = checkActivo
  ? parseInt(
      document.getElementById('select-cuotas-mes-hasta')?.value ||
      obtenerMesActual(),
      10
    )
  : mesDesde;
  let filtrados = todosLosSocios.filter(s => s.estado !== 'Inactivo');

  filtrados = filtrados.filter(s => {
    const fVenc = s.fechaVencimiento || s.fecha_vencimiento;
    if (!fVenc) return true;
    const mesV = new Date(fVenc).getUTCMonth() + 1;
    return mesV >= mesDesde;
  });

  if (auditoriaColorActivoGlobal !== 'Todos') {
    filtrados = filtrados.filter(s => {
      const fVenc = s.fechaVencimiento || s.fecha_vencimiento;
      const mesV = fVenc ? new Date(fVenc).getUTCMonth() + 1 : 1;
      return auditoriaColorActivoGlobal === 'Verde' ? mesV > mesHasta : mesV <= mesHasta;
    });
  }

  if (buscadorTxt) {
    filtrados = filtrados.filter(s => s.nombre.toLowerCase().includes(buscadorTxt) || s.dni.toString().includes(buscadorTxt));
  }

  if (filtrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400 text-sm font-medium">Sin registros para el filtro seleccionado.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtrados.map(s => {
    const fVenc = s.fechaVencimiento || s.fecha_vencimiento;
    const esPagado = fVenc ? (new Date(fVenc).getUTCMonth() + 1) > mesHasta : false;
    const waUrl = `https://wa.me/${s.telefono}?text=${encodeURIComponent(`Hola ${s.nombre}, te contactamos desde la administración para recordar regularizar tu arancel.`)}`;

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50/50 transition text-sm">
        <td class="p-4 pl-6 font-bold text-gray-900">${s.nombre} ${s.apellido || ''}</td>
        <td class="p-4 font-mono text-gray-600">${s.dni}</td>
        <td class="p-4 text-gray-500">${s.tipo || 'Arancel Social'}</td>
        <td class="p-4 text-center font-medium">${esPagado ? '✅ Percibido' : '❌ Pendiente'}</td>
        <td class="p-4 text-right font-mono font-black ${esPagado ? 'text-emerald-600' : 'text-rose-600'}">$${parseFloat(s.montoCuota || 0).toLocaleString('es-AR')},00</td>
        <td class="p-4 text-right pr-6">
          ${esPagado ? `<span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Emitido</span>` : `<a href="${waUrl}" target="_blank" class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 px-3 rounded border border-rose-200 transition cursor-pointer active:scale-[0.97]">📲 Reclamar</a>`}
        </td>
      </tr>`;
  }).join('');
}

window.filtrarPorSemaforo = function (color) {
  const sociosActivos = todosLosSocios.filter(s => s.estado !== 'Inactivo');
  if (color === 'Todos') return renderizarTabla(sociosActivos);
  renderizarTabla(sociosActivos.filter(s => s.estadoSemaforo === color));
}

// --- INITIALIZER CENTRAL READY DOM UNIFICADO ---
document.addEventListener('DOMContentLoaded', () => {
  aplicarConfiguracionVisual();
  iniciarRelojLocal();
  configurarNavegacion();
  configurarModalPago(cargarDashboard);
  configurarModalSocio(() => todosLosSocios, cargarDashboard);
  inicializarMediosDePagoPantalla();
  poblarSelectorMeses('select-cuotas-mes-desde');
poblarSelectorMeses('select-cuotas-mes-hasta');
poblarSelectorMeses('select-caja-mes-filtro');
  cargarDashboard();
  cargarBalanceCuotas();

  document.getElementById('input-buscador')?.addEventListener('input', (e) => {
    const txt = e.target.value.toLowerCase().trim();
    renderizarTabla(todosLosSocios.filter(s => s.estado !== 'Inactivo' && (s.nombre.toLowerCase().includes(txt) || s.dni.toString().includes(txt))));
  });

  document.getElementById('input-buscador-padron')?.addEventListener('input', (e) => {
    const txt = e.target.value.toLowerCase().trim();
    renderizarPadronSocios(todosLosSocios.filter(s => s.nombre.toLowerCase().includes(txt) || s.dni.toString().includes(txt)));
  });

  document.getElementById('input-buscador-auditoria-cuotas')?.addEventListener('input', () => {
    window.renderizarTablaAuditoriaCuotas();
  });

  document.getElementById('form-editar-socio')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idSocio = document.getElementById('edit-form-id').value;
    const datos = {
      nombre: document.getElementById('edit-form-nombre').value.trim(),
      apellido: document.getElementById('edit-form-apellido').value.trim(),
      telefono: document.getElementById('edit-form-telefono').value.trim(),
      email: document.getElementById('edit-form-email').value.trim(),
      direccion: document.getElementById('edit-form-direccion').value.trim(),
      tipo: document.getElementById('edit-form-tipo').value.trim(),
      montoCuota: parseFloat(document.getElementById('edit-form-monto').value) || 0,
      fechaVencimiento: document.getElementById('edit-form-vencimiento').value,
      actividad: document.getElementById('edit-form-actividad').value.trim(),
      categoria: document.getElementById('edit-form-categoria').value.trim(),
      notas: document.getElementById('edit-form-notas').value.trim()
    };
    try {
      await fetch(`${API_URL}/socios/${idSocio}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
      document.getElementById('modal-editar-socio').classList.add('hidden');
      document.getElementById('lbl-editexito-nombre').innerText = `${datos.nombre} ${datos.apellido}`;
      document.getElementById('modal-editar-exito').classList.remove('hidden');
      await cargarDashboard();
    } catch (error) { alert("⚠️ Error al actualizar la ficha."); }
  });

  if (sessionStorage.getItem('sesion_administrativa_activa') === 'true') {
    document.getElementById('contenedor-login')?.classList.add('hidden');
  }

  const formLogin = document.getElementById('form-login-administrativo');
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorMsg = document.getElementById('login-error-msg');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: document.getElementById('login-email').value.trim(), password: document.getElementById('login-password').value })
      });
      const datosRes = await res.json();
      if (!res.ok) throw new Error(datosRes.error || "Rebote.");
      sessionStorage.setItem('sesion_administrativa_activa', 'true');
      errorMsg?.classList.add('hidden');
      document.getElementById('contenedor-login')?.classList.add('hidden');
    } catch (error) {
      if (errorMsg) { errorMsg.innerText = ` ❌ ${error.message}`; errorMsg.classList.remove('hidden'); }
    }
  });
});

