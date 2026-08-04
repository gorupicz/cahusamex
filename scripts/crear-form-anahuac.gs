/**
 * Crea el Google Form de inscripciones de la Certificación en IA Aplicada
 * (Universidad Anáhuac Cancún) en TU cuenta de Google, con su hoja de
 * respuestas vinculada.
 *
 * CÓMO USARLO
 *   1. Entrá a https://script.google.com y creá un proyecto nuevo.
 *   2. Seleccioná TODO el contenido de Code.gs y reemplazalo por este archivo.
 *   3. Ejecutá la función `crearFormularioInscripciones`.
 *   4. Autorizá los permisos que pide (son sobre tu propio Drive).
 *   5. Copiá las tres URLs del registro de ejecución y pasámelas.
 *
 * Todo vive en una sola función a propósito: no hay helpers que puedan
 * quedar afuera si la pegada se corta.
 */

function crearFormularioInscripciones() {
  var form = FormApp.create(
    'Inscripciones — Certificación en Herramientas de IA Aplicadas a Productividad Profesional'
  )
    .setDescription(
      'Universidad Anáhuac Cancún · Beca La Bolsa MX / CAHUSAMEX\n\n' +
        'Importante: tu matrícula de alumno y diploma se basarán en los datos ' +
        'que escribas aquí. Por favor colocá los acentos correspondientes.'
    )
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setLimitOneResponsePerUser(false)
    .setProgressBar(false);

  // --- Datos personales ---------------------------------------------------
  form.addTextItem().setTitle('Nombre(s)').setRequired(true);
  form.addTextItem().setTitle('Apellido paterno').setRequired(true);
  form.addTextItem().setTitle('Apellido materno').setRequired(true);

  form
    .addTextItem()
    .setTitle('Correo electrónico')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .requireTextIsEmail()
        .setHelpText('Escribí un correo electrónico válido.')
        .build()
    );

  form.addTextItem().setTitle('Teléfono celular').setRequired(true);

  form.addDateItem().setTitle('Fecha de nacimiento').setRequired(true);

  form
    .addTextItem()
    .setTitle('Edad')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .requireNumberBetween(16, 99)
        .setHelpText('Escribí tu edad en números.')
        .build()
    );

  form
    .addMultipleChoiceItem()
    .setTitle('Género')
    .setChoiceValues(['Mujer', 'Hombre'])
    .setRequired(true);

  form
    .addTextItem()
    .setTitle('País')
    .setHelpText('Por ejemplo: México, EUA')
    .setRequired(true);

  form
    .addTextItem()
    .setTitle('Ciudad')
    .setHelpText('Por ejemplo: Cancún, Washington')
    .setRequired(true);

  // --- Datos profesionales ------------------------------------------------
  form
    .addTextItem()
    .setTitle('Empresa donde laboras')
    .setHelpText('Por ejemplo: Hotel Dreams')
    .setRequired(true);

  form
    .addTextItem()
    .setTitle('Puesto')
    .setHelpText('Por ejemplo: Director, Gerente de operaciones')
    .setRequired(true);

  form
    .addTextItem()
    .setTitle('Sector')
    .setHelpText('Por ejemplo: Hotelería')
    .setRequired(true);

  form
    .addListItem()
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
    .setHelpText(
      'Por ejemplo: Licenciatura en Administración. Si no contás con estudios superiores, escribí N/A.'
    )
    .setRequired(true);

  // --- Atribución ---------------------------------------------------------
  var origen = form
    .addMultipleChoiceItem()
    .setTitle('¿Cómo te enteraste del programa?')
    .setRequired(true);

  origen.setChoices([
    origen.createChoice('Correo'),
    origen.createChoice('AMPI Playa del Carmen'),
    origen.createChoice('ADVI'),
    origen.createChoice('La Bolsa'),
    origen.createChoice('Recomendación'),
    origen.createChoice('Redes sociales'),
    origen.createChoice('MasterClass (clase muestra)'),
    origen.createChoice('WhatsApp')
  ]);
  origen.showOtherOption(true);

  // --- Hoja de respuestas -------------------------------------------------
  var hoja = SpreadsheetApp.create('Leads — Certificación IA Anáhuac Cancún');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());

  var salida =
    '\n' +
    '======================================================================\n' +
    'LISTO. Pasale estas tres URLs a Claude:\n' +
    '\n' +
    '  PUBLICA (de aqui salen los entry.NNN):\n' +
    '  ' +
    form.getPublishedUrl() +
    '\n\n' +
    '  EDICION (para vos):\n' +
    '  ' +
    form.getEditUrl() +
    '\n\n' +
    '  HOJA DE RESPUESTAS (aca caen los leads):\n' +
    '  ' +
    hoja.getUrl() +
    '\n' +
    '======================================================================';

  Logger.log(salida);
  return salida;
}
