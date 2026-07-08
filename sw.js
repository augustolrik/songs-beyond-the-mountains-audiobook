const CACHE = 'songs-beyond-mountains-v13';
const ASSETS = ['./', './index.html', './style.css', './app.js', './library-data.js', './chapters.json', './chapters-data.js', './chapters-da.json', './chapters-data-da.js', './audio/en/ready.js', './audio/da/ready.js', './manifest.webmanifest', './extras/songs-beyond-the-mountains-dnd-campaign-guide.html', './extras/songs-beyond-the-mountains-dnd-campaign-guide.md', './extras/songs-beyond-the-mountains-choose-your-own-adventure.html', './extras/songs-beyond-the-mountains-choose-your-own-adventure.md'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request))));
