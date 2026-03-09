// sw.js - Táctica de "Presión Alta" (Network First) y "Relojero" (Alarmas)

const CACHE_NAME = 'smart-training-v3';

// ============================================================================
// 1. INSTALACIÓN Y ACTIVACIÓN
// ============================================================================

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('🟢⚪ [Utillero] Instalado y calentando en la banda.');
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🧹 [Utillero] Borrando tácticas viejas:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ============================================================================
// 2. INTERCEPCIÓN (LA MAGIA): Network First, fallback to Cache
// ============================================================================

self.addEventListener('fetch', (event) => {
    // Solo interceptamos peticiones GET (nada de POST a bases de datos externas)
    if (event.request.method !== 'GET') return;

    // Ignoramos extensiones de Chrome u otras basuras externas
    if (!event.request.url.startsWith('http')) return;

    // 🟢⚪ TÁCTICA DE PELLEGRINI: El Utillero no tira las faltas, se las deja al 10 (labService).
    // Si la pelota va hacia Google Storage (modelos MediaPipe), nos apartamos y no tocamos el CORS.
    if (event.request.url.includes('storage.googleapis.com/mediapipe-models/')) {
        console.log('⚽ [Utillero] Dejo pasar este balón. Que lo baje y lo descargue el que sabe.');
        return; 
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Hay internet: Guardamos una copia en el banquillo y devolvemos la respuesta
                const clonedResponse = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clonedResponse);
                });
                return networkResponse;
            })
            .catch(async () => {
                // No hay internet: Sacamos al suplente del banquillo (Caché)
                console.log('📶 [Utillero] Sin conexión, buscando en el banquillo:', event.request.url);
                const cachedResponse = await caches.match(event.request);
                
                // Si la caché está vacía, evitamos devolver 'undefined' (penalti por mano).
                // En su lugar, sacamos tarjeta amarilla por falta de conexión (Error 408).
                return cachedResponse || new Response('Offline - Jugador no convocado', { status: 408 });
            })
    );
});

// ============================================================================
// 3. EL CHIVATAZO (MENSAJES): Escuchamos el walkie-talkie del Contable
// ============================================================================

self.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'MEAL_NOTIFICATION_UPDATE') {
        const payload = event.data.payload;
        console.log('📻 [Utillero] Mensaje recibido por walkie-talkie:', payload);

        if (payload.notification) {
            // El usuario encendió el toggle: Programamos la alarma
            await programarAlarma(payload);
        } else {
            // El usuario apagó el toggle: Cancelamos la alarma
            await cancelarAlarma(payload.id);
        }
    }
});

// ============================================================================
// 4. FUNCIONES DE ALARMA (PROGRAMAR Y CANCELAR)
// ============================================================================

// 🎯 Función para programar la alarma
async function programarAlarma(payload) {
    // 1. Calculamos a qué hora hay que pitar (ej: 14:00)
    const [hours, minutes] = payload.time.split(':').map(Number);
    const now = new Date();
    let alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    // Si la hora ya ha pasado hoy, lo programamos para la misma hora de mañana
    if (alarmTime.getTime() <= now.getTime()) {
        alarmTime.setDate(alarmTime.getDate() + 1);
    }

    // 2. Comprobamos si el navegador permite programar a futuro (Triggers API)
    if ('showTrigger' in Notification.prototype) {
        console.log(`⏰ [Utillero] Programando alarma offline para [${payload.label}] a las ${alarmTime.toLocaleString()}`);

        try {
            // 🔥 El diseño ultra-minimalista: Título = Nombre comida, Cuerpo = ⏱️ Hora
            await self.registration.showNotification(payload.label, {
                body: `⏱️ ${payload.time}`,
                icon: '/assets/icons/icon-192.png', 
                tag: payload.id, // FUNDAMENTAL: La matrícula para cancelarla
                showTrigger: new TimestampTrigger(alarmTime.getTime()) // 🚀 LA MAGIA OFFLINE
            });
        } catch (error) {
            console.error('❌ [Utillero] Error al programar la notificación:', error);
        }
    } else {
        // Fallback para Safari y navegadores sin Triggers API
        console.warn('⚠️ [Utillero] El árbitro (Navegador) no permite la Notification Triggers API. No se puede programar en segundo plano.');
    }
}

// 🚫 Función para cancelar la alarma
async function cancelarAlarma(id) {
    // Buscamos las notificaciones programadas
    const notifications = await self.registration.getNotifications({
        tag: id,
        includeTriggered: true // Incluimos las que están en cola esperando al Trigger
    });

    // Si encontramos la notificación con esta matrícula (tag), la borramos
    notifications.forEach(notification => {
        notification.close();
        console.log(`🚫 [Utillero] Alarma cancelada para la comida: ${id}`);
    });
}

// ============================================================================
// 5. CLICK EN LA NOTIFICACIÓN: ¿Qué pasa cuando el usuario la toca?
// ============================================================================

self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Cerramos la notificación emergente
    console.log('👆 [Utillero] El usuario ha tocado la notificación.');

    // --- 🔄 EL TRUCO DEL ALMENDRUCO (Bucle infinito) ---
    // 1. Leemos el texto de la notificación (ej: "⏱️ 14:30") y le quitamos el emoji y el espacio
    const timeString = event.notification.body.replace('⏱️ ', '');

    // 2. Metemos los datos en la misma caja que usaba el Contable
    const payload = {
        id: event.notification.tag,      // La matrícula
        label: event.notification.title, // El nombre de la comida (ej: Pollo)
        time: timeString,                // La hora limpia (ej: 14:30)
        notification: true
    };

    // 3. Le decimos al Utillero que vuelva a programar la alarma (como la hora de hoy ya pasó, la pondrá mañana)
    programarAlarma(payload); 
    // ---------------------------------------------------

    // Abrimos la app y llevamos al usuario a la vista de dieta
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url.includes('/nutrition') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/nutrition'); 
            }
        })
    );
});

// ============================================================================
// 6. DESCARTAR LA NOTIFICACIÓN: ¿Qué pasa cuando el usuario la desliza (swipe)?
// ============================================================================

self.addEventListener('notificationclose', (event) => {
    console.log('👋 [Utillero] El usuario ha descartado la notificación sin abrir la app.');

    // --- 🔄 EL TRUCO DEL ALMENDRUCO (Bucle infinito) ---
    const timeString = event.notification.body.replace('⏱️ ', '');

    const payload = {
        id: event.notification.tag,
        label: event.notification.title,
        time: timeString,
        notification: true
    };

    // Volvemos a programar la alarma para mañana
    programarAlarma(payload);
});