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

function guardarEnvio(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Envios');
  if (!sheet) {
    sheet = ss.insertSheet('Envios');
    sheet.appendRow(['Fecha', 'Nombre', 'WhatsApp cliente', 'Provincia', 'Localidad', 'Sucursal', 'Dirección', 'Código sucursal', 'CP', 'Nota', 'Tipo de entrega']);
  }
  // Nota: "Tipo de entrega" se agrega como última columna (K) para no
  // desordenar planillas ya creadas antes de este cambio. Si tu planilla es
  // vieja, agregá "Tipo de entrega" a mano en la celda K1.
  sheet.appendRow([
    new Date(),
    data.nombre || '',
    data.telefono || '',
    data.provinciaNombre || '',
    data.localidad || '',
    data.sucursalNombre || '',
    data.sucursalDireccion || '',
    data.sucursalId || '',
    data.cp || '',
    data.nota || '',
    data.tipoEntrega || '',
  ]);
}
