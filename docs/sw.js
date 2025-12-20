// 서비스 워커 - 오프라인 지원 및 캐싱
const CACHE_NAME = 'portfolio-genius-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// 캐시할 정적 리소스
const STATIC_ASSETS = [
  '/stock-portfolio-genius/',
  '/stock-portfolio-genius/index.html',
  '/stock-portfolio-genius/battle.html',
  '/stock-portfolio-genius/screener.html',
  '/stock-portfolio-genius/ideas.html',
  '/stock-portfolio-genius/history.html',
  '/stock-portfolio-genius/manage.html',
  '/stock-portfolio-genius/guide.html',
  '/stock-portfolio-genius/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 설치 이벤트 - 정적 리소스 캐싱
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map(key => {
              console.log('[SW] Removing old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch 이벤트 - 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청은 네트워크 우선
  if (url.pathname.includes('data.json') || url.pathname.includes('market-data.json')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 정적 리소스는 캐시 우선
  event.respondWith(cacheFirst(request));
});

// 캐시 우선 전략
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // 오프라인 폴백
    return new Response('오프라인 상태입니다.', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// 네트워크 우선 전략
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// 푸시 알림 이벤트
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '포트폴리오 알림';
  const options = {
    body: data.body || '새로운 알림이 있습니다.',
    icon: '/stock-portfolio-genius/icons/icon-192.png',
    badge: '/stock-portfolio-genius/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/stock-portfolio-genius/'
    },
    actions: [
      { action: 'open', title: '열기' },
      { action: 'close', title: '닫기' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/stock-portfolio-genius/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});
