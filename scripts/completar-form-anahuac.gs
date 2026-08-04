/**
 * Completa el formulario de inscripciones que quedó a medias.
 *
 * Reemplazá TODO el Code.gs por esto (⌘A y pegar) y ejecutá `completarFormulario`.
 * Si la pegada se corta, el script avisa en vez de fingir que anduvo.
 */

function completarFormulario() {
  if (typeof FIN_DEL_ARCHIVO === 'undefined') {
    throw new Error(
      'La pegada quedó incompleta: falta el final del archivo. Copiá todo de nuevo.'
    );
  }

  var form = FormApp.openById(
    '1oJr3QnVNJSOEPmjc0GVKZE9DHYpAilK5-yjjAddNmk8'
  );

  // Sin esto el formulario solo acepta respuestas de tu Workspace y la landing
  // pública no puede enviar nada.
  form.setRequireLogin(false);

  var listas = form.getItems(FormApp.ItemType.LIST);
  if (!listas.length) {
    throw new Error('No encontré el desplegable vacío.');
  }

  listas[listas.length - 1]
    .asListItem()
    .setTitle('Antigüedad en la empresa')
    .setChoiceValues([
      '1 mes',
      '2 meses',
      '3 meses',
      '1 año',
      '2 años',
      'Más de 3 años',
      'Más de 5 años',
      'Más de 10 años'
    ])
    .setRequired(true);

  form
    .addParagraphTextItem()
    .setTitle('Estudios superiores')
    .setHelpText('Por ejemplo: Licenciatura en Administración. Si no tenés, escribí N/A.')
    .setRequired(true);

  var origen = form
    .addMultipleChoiceItem()
    .setTitle('¿Cómo te enteraste del programa?')
    .setRequired(true);

  origen.setChoiceValues([
    'Correo',
    'AMPI Playa del Carmen',
    'ADVI',
    'La Bolsa',
    'Recomendación',
    'Redes sociales',
    'MasterClass (clase muestra)',
    'WhatsApp'
  ]);
  origen.showOtherOption(true);

  var hoja = SpreadsheetApp.create('Leads — Certificación IA Anáhuac Cancún');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());

  Logger.log('OK. Preguntas: ' + form.getItems().length);
  Logger.log('Acepta respuestas de cualquiera: ' + !form.requiresLogin());
  Logger.log('Hoja de leads: ' + hoja.getUrl());
}

var FIN_DEL_ARCHIVO = true;
