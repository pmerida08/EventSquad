const base = require('./app.json');

/** @type {(ctx: import('@expo/config').ConfigContext) => import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    // En EAS Build, GOOGLE_SERVICES_JSON es la ruta al archivo secreto subido.
    // En local, cae al archivo en la raíz del proyecto.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});
