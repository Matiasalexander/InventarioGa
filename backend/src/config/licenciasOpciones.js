
const OPCIONES_LICENCIAS = {
  SQL_SERVER: {
    codigo: "SQL_SERVER",
    nombre: "Microsoft SQL Server",

    versiones: [
      {
        version: "2022", 
        ediciones: [
          {
            nombre: "Standard",
            modalidades: [
              "POR_NUCLEO",
              "SERVER_CAL"
            ]
          },
          {
            nombre: "Enterprise",
            modalidades: [
              "POR_NUCLEO"
            ]
          }
        ]
      }, 
      {
        version: "2019", 
        ediciones: [
          {
            nombre: "Standard",
            modalidades: [
              "POR_NUCLEO",
              "SERVER_CAL"
            ]
          },
          {
            nombre: "Enterprise",
            modalidades: [
              "POR_NUCLEO"
            ]
          }
        ]
      }
    ]
  }
};

const CAMPOS_MODALIDAD = {
  POR_NUCLEO: [
    {
      nombre: "nucleosLicenciados",
      etiqueta: "Núcleos licenciados",
      tipo: "number",
      obligatorio: true,
      minimo: 1
    },
    {
      nombre: "entorno",
      etiqueta: "Tipo de entorno",
      tipo: "select",
      obligatorio: false,
      opciones: [
        { valor: "FISICO", etiqueta: "Servidor físico" },
        { valor: "VIRTUAL", etiqueta: "Máquina virtual" }
      ]
    }
  ],

  SERVER_CAL: [
    {
      nombre: "tipoCAL",
      etiqueta: "Tipo de CAL",
      tipo: "select",
      obligatorio: true,
      opciones: [
        { valor: "USUARIO", etiqueta: "Usuario" },
        { valor: "DISPOSITIVO", etiqueta: "Dispositivo" }
      ]
    },
    {
      nombre: "cantidadCAL",
      etiqueta: "Cantidad de CAL",
      tipo: "number",
      obligatorio: true,
      minimo: 1
    }
  ],

  SUSCRIPCION: [
    {
      nombre: "fechaVencimiento",
      etiqueta: "Fecha de vencimiento",
      tipo: "date",
      obligatorio: true
    }
  ],

  PERPETUA: []
};

module.exports = {
  OPCIONES_LICENCIAS,
  CAMPOS_MODALIDAD
};
