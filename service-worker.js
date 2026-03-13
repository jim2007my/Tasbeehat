const CACHE_NAME = 'tasbeehat-v2'; // تم تغيير الإصدار لتحديث الكاش القديم

// الملفات الأساسية التي يجب تخزينها فوراً عند فتح التطبيق
const urlsToCache = [
  '/',
  '/index.html',
  '/azkar.html',
  '/quran.html',
  '/radio.html',
  '/prayer.html',
  '/about.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Cairo:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
  // ملاحظة: تأكد من إضافة مسارات الأيقونات هنا إذا أردت ظهورها أوفلاين
  // '/icons/icon-192x192.png',
  // '/icons/icon-512x512.png'
];

// 1. تثبيت الخدمة وتخزين الملفات الأساسية
self.addEventListener('install', event => {
  self.skipWaiting(); // تفعيل النسخة الجديدة فوراً
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 2. تفعيل الخدمة ومسح الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
      })
    ))
  );
});

// 3. اعتراض الطلبات (التخزين الديناميكي)
self.addEventListener('fetch', event => {
  // استثناء البث المباشر للراديو من التخزين
  if (event.request.url.includes('radiojar.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // إذا كان الملف موجوداً في الكاش، قم بإرجاعه فوراً (يعمل بدون إنترنت)
      if (cachedResponse) {
        return cachedResponse;
      }

      // إذا لم يكن موجوداً، قم بجلبه من الإنترنت ثم تخزينه للمرات القادمة
      return fetch(event.request).then(networkResponse => {
        // التأكد من أن الاستجابة صحيحة قبل تخزينها
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // هنا يمكن وضع صفحة Fallback في حال فشل الاتصال وعدم وجود كاش
        console.log('You are offline and the resource is not cached.');
      });
    })
  );
});