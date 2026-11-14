/**
 * Limpieza final: borra las 2 preguntas duplicadas y manda a la papelera la
 * hoja de leads huérfana que quedó de la corrida repetida.
 *
 * Reemplazá TODO el Code.gs por esto y ejecutá `limpiar`.
 * Nada se borra para siempre: la hoja va a la papelera (30 días).
 */

function limpiar() {
  if (typeof FIN_DEL_ARCHIVO === 'undefined') {
    throw new Error('La pegada quedó incompleta. Copiá todo de nuevo.');
  }

  var form = FormApp.openById('1oJr3QnVNJSOEPmjc0GVKZE9DHYpAilK5-yjjAddNmk8');
  var items = form.getItems();

  if (items.length !== 18) {
    throw new Error('Esperaba 18 preguntas y encontré ' + items.length + '. Frenamos.');
  }

  // Las dos últimas son los duplicados de la segunda corrida.
  Logger.log('Borrando: "' + items[17].getTitle() + '"');
  Logger.log('Borrando: "' + items[16].getTitle() + '"');
  form.deleteItem(items[17]);
  form.deleteItem(items[16]);

  // Hoja huérfana (la vinculada es 1t8ChNz38CgiuFtKblU9YhoU_gHC8RbGSNfRcC_chuEE).
  DriveApp.getFileById('1bz0TzwSOXcChOmUuJ8yODbwdwNXmNWtZtbkjtdO3II0').setTrashed(true);

  Logger.log('Preguntas ahora: ' + form.getItems().length);
  Logger.log('Hoja de leads: https://docs.google.com/spreadsheets/d/1t8ChNz38CgiuFtKblU9YhoU_gHC8RbGSNfRcC_chuEE/edit');
}

var FIN_DEL_ARCHIVO = true;
