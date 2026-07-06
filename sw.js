const CACHE = 'songs-beyond-mountains-v10';
const ASSETS = ['./', './index.html', './style.css', './app.js', './library-data.js', './chapters.json', './chapters-data.js', './chapters-da.json', './chapters-data-da.js', './audio/en/ready.js', './audio/da/ready.js', './manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request))));
