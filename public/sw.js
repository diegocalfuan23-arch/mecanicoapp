// Service worker mínimo: solo habilita "Agregar a pantalla de inicio".
// Sin caché ni modo offline — el taller ya confirmó que no tiene
// problemas de conexión, así que no hace falta ese trabajo extra.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Chrome exige que el fetch handler responda de verdad para
  // considerar la app instalable — un listener vacío no basta, aunque
  // el resultado sea idéntico a no interceptar nada.
  event.respondWith(fetch(event.request));
});
