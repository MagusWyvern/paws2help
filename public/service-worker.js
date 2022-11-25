importScripts('https://cdnjs.cloudflare.com/ajax/libs/workbox-sw/6.2.2/workbox-sw.js')

// This file ensures that our app is available offline

workbox.routing.registerRoute(

    // If the image file is already in the cache, retrieve from the cache first
    ({request}) => request.destination == 'image',
    new workbox.strategies.CacheFirst()
);