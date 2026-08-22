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
  // el resultado sea idéntico a no interceptar nada. Solo GET: para
  // todo lo demás (POST de formularios, server actions) no conviene
  // que el service worker se meta en el medio.
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() => fetch(event.request))
  );
});
