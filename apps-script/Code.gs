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
    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// El orden acá define el orden de las columnas en la hoja.
var HEADERS = [
  'Fecha',
  'Nombre',
  'Email',
  'WhatsApp cliente',
  'Tipo de entrega',
  'Provincia',
  'Localidad',
  'Sucursal',
  'Dirección sucursal',
  'Código sucursal',
  'Dirección domicilio',
  'CP',
  'Nota',
];

function guardarEnvio(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Envios');
  if (!sheet) {
    sheet = ss.insertSheet('Envios');
  }

  // Se asegura de que la fila de encabezados siempre tenga las columnas
  // correctas, incluso en hojas viejas creadas antes de este cambio.
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

  var fila = {
    'Fecha': new Date(),
    'Nombre': data.nombre || '',
    'Email': data.email || '',
    'WhatsApp cliente': data.telefono || '',
    'Tipo de entrega': data.tipoEntrega || '',
    'Provincia': data.provinciaNombre || '',
    'Localidad': data.localidad || '',
    'Sucursal': data.sucursalNombre || '',
    'Dirección sucursal': data.direccionSucursal || '',
    'Código sucursal': data.sucursalId || '',
    'Dirección domicilio': data.direccionDomicilio || '',
    'CP': data.cp || '',
    'Nota': data.nota || '',
  };

  sheet.appendRow(HEADERS.map(function (h) { return fila[h]; }));
}
