// Service worker mínimo: solo habilita "Agregar a pantalla de inicio".
// Sin caché ni modo offline — el taller ya confirmó que no tiene
// problemas de conexión, así que no hace falta ese trabajo extra.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Sin manejo propio: deja pasar todas las peticiones a la red normal.
});
