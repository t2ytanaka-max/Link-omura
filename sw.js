const CACHE_NAME = 'link-omura-pwa-v14';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon.jpg',
  './'
];

// サービスワーカーのインストールとアセットのキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// リクエストの処理（キャッシュ優先、フォールバック）
self.addEventListener('fetch', event => {
  // ブラウザ拡張機能などのスキーム (chrome-extension:// など) はキャッシュ対象外にする
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(networkResponse => {
          // 有効なレスポンスであればキャッシュに追加（オプション）
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // オフラインかつキャッシュがない場合のフォールバック（必要なら）
        });
      })
  );
});
