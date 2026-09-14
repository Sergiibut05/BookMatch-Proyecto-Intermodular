/**
 * Configuración del entorno de producción.
 * Usada al hacer build con --configuration=production.
 * API en producción (misma base que en local: …/api; en Vercel el rewrite ocultaba el prefijo).
 */
export const environment = {
    production: true,
    firebase: {
        apiKey: "AIzaSyBh8yIwyt8pAxG_jj3nx8Y8vDnKnrPsV14",
        authDomain: "bookmatch-522d5.firebaseapp.com",
        projectId: "bookmatch-522d5",
        storageBucket: "bookmatch-522d5.firebasestorage.app",
        messagingSenderId: "735953151639",
        appId: "1:735953151639:web:35092cd2fa7015d06f2bd2",
        databaseURL: "https://bookmatch-522d5-default-rtdb.europe-west1.firebasedatabase.app",
        measurementId: "G-YD2T0NCDTC"
    },
    stripePublishableKey: 'pk_test_51SXKSE9RfkpN8LkuajmtkGe2fBJNNYiVhepYyANGrlr5xBW9nMJXEm76iUAoJb3iqutIywJviuf4QQJHFNFQQr0d007T7bx4gt',
    // AWS (api.bookmatch.club) está caído. No hay failover en el cliente:
    // apiUrl se hornea en el build, así que hay que redeployar el front.
    apiUrl: 'https://book-match-proyecto-intermodular-k5fb-i2442vm5r.vercel.app/api'
};
