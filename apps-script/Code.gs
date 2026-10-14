/**
 * Backend de "Datos de envío" para Rebe's Way.
 * Este script va pegado en Extensions > Apps Script de una Google Sheet.
 *
 * Las sucursales de Correo Argentino ya vienen incluidas en el propio
 * formulario (src/data/sucursales.json, generado con
 * scripts/fetch_sucursales.py), así que este backend solo se encarga de
 * guardar cada envío cargado por una clienta como fila nueva en la hoja
 * "Envios".
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    guardarEnvio(data);
    notificarPedido(data);
    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

// Te manda un mail con el resumen de cada pedido nuevo (a la cuenta de Google
// dueña de este script). Si el mail falla, el pedido igual queda guardado.
function notificarPedido(data) {
  try {
    var destino = Session.getEffectiveUser().getEmail();
    if (!destino) return;

    var esDomicilio = data.tipoEntrega === 'Domicilio';
    var lineas = [
      'Tipo de entrega: ' + (data.tipoEntrega || ''),
      'Nombre: ' + (data.nombre || ''),
      'Correo: ' + (data.email || ''),
      'Teléfono: ' + (data.codArea || '') + ' ' + (data.celular || ''),
      'Provincia: ' + (data.provinciaNombre || ''),
    ];
    if (esDomicilio) {
      lineas.push('Localidad: ' + (data.localidad || ''));
      lineas.push('Dirección: ' + (data.direccion || ''));
      lineas.push('Código Postal: ' + (data.cp || ''));
    } else {
      lineas.push('Sucursal: ' + (data.sucursalNombre || ''));
    }
    if (data.nota) lineas.push('Nota: ' + data.nota);

    MailApp.sendEmail(
      destino,
      'Nuevo pedido: ' + (data.nombre || 'sin nombre') + ' (' + (data.tipoEntrega || '') + ')',
      lineas.join('\n')
    );
  } catch (err) {
    // no frenamos el guardado por un problema con el mail
  }
}

// Para probar el aviso por mail: en el editor elegí "probarAviso" arriba y
// apretá Ejecutar. La primera vez Google te pide autorizar el permiso.
function probarAviso() {
  notificarPedido({
    tipoEntrega: 'Sucursal',
    nombre: 'Prueba de aviso',
    email: 'prueba@email.com',
    codArea: '11',
    celular: '12345678',
    provinciaNombre: 'Ciudad Autónoma de Buenos Aires',
    sucursalNombre: 'PALERMO',
  });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// El orden acá define el orden de las columnas en la hoja. Localidad y CP
// solo se completan en envíos a domicilio; Sucursal solo en retiro en
// sucursal (el resto queda vacío según corresponda).
var HEADERS = [
  'Fecha',
  'Tipo de entrega',
  'Nombre',
  'Provincia',
  'Localidad',
  'Sucursal',
  'Dirección',
  'Código Postal',
  'Correo electrónico',
  'Cód. de Área',
  'Celular',
  'Nota',
];

function guardarEnvio(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Envios');
  if (!sheet) {
    sheet = ss.insertSheet('Envios');
  }

  // Se asegura de que la fila de encabezados siempre tenga exactamente las
  // columnas correctas, incluso en hojas viejas creadas antes de este
  // cambio (limpia cualquier encabezado viejo que haya sobrado a la derecha).
  var lastCol = Math.max(sheet.getLastColumn(), HEADERS.length);
  sheet.getRange(1, 1, 1, lastCol).clearContent();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

  var fila = {
    'Fecha': new Date(),
    'Tipo de entrega': data.tipoEntrega || '',
    'Nombre': data.nombre || '',
    'Provincia': data.provinciaNombre || '',
    'Localidad': data.localidad || '',
    'Sucursal': data.sucursalNombre || '',
    'Dirección': data.direccion || '',
    'Código Postal': data.cp || '',
    'Correo electrónico': data.email || '',
    'Cód. de Área': data.codArea || '',
    'Celular': data.celular || '',
    'Nota': data.nota || '',
  };

  sheet.appendRow(HEADERS.map(function (h) { return fila[h]; }));
}
