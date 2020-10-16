
const CACHE_STATIC_NAME = 'static-v2';
const CACHE_DYNAMIC_NAME = 'dynamic-v2';
const STATIC_FILES = [ //Cached the files but not otp.ejs and success.ejs
  '/', //index.ejs gets cached when '/' is cached
  '/main.html',
  '/index.html',
  '/company1.html',
  '/src/css/style.css',
  '/src/css/styleOtp.css',
  '/src/css/main.css',
  '/src/images/chat.png',
  '/src/js/app.js',
  '/src/js/fetch.js',
  '/src/js/idb.js',
  '/src/js/material.min.js',
  '/src/js/promise.js',
  '/src/js/registerScreen.js',
  '/src/js/company1.js',
  '/src/images/icons/57.png',
  '/src/images/icons/60.png',
  '/src/images/icons/72.png',
  '/src/images/icons/76.png',
  '/src/images/icons/114.png',
  '/src/images/icons/120.png',
  '/src/images/icons/144.png',
  '/src/images/icons/152.png',
  '/src/images/icons/180.png',
  '/src/images/icons/48.png',
  '/src/images/icons/96.png',
  '/src/images/icons/192.png',
  '/src/images/icons/256.png',
  '/src/images/icons/512.png',
  '/src/images/superhero.png',
  '/src/images/superhero2.png',
  '/src/images/superhero3.png',
  'https://fonts.googleapis.com/css2?family=Kumbh+Sans&display=swap',
  'https://code.jquery.com/jquery-3.5.1.slim.min.js',
  'https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js',
  'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css'
];


self.addEventListener('install', function (event) {
  console.log("[Service Worker] Installing service Worker...", event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
    .then(function (cache) {
      console.log("[Service Worker] Prefetching App Shell...");
      cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener('activate', function (event) {
  console.log("[Service Worker] Activating Service Workrer...", event);
  event.waitUntil(
    caches.keys()
    .then(function (keyList) {
      return Promise.all(keyList.map(function (key) {
        if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
          console.log("[Service Worker] Removing old caches", key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});


self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
    .then(function (response) {
      if (response) {
        return response;
      } else {
        return fetch(event.request)
          .then(function (res) {
            return caches.open(CACHE_DYNAMIC_NAME)
              .then(function (cache) {
                cache.put(event.request.url, res.clone());
                return res;
              });
          })
          .catch(function (err) {
            console.log(err);
          });
      }
    })
  );
});


//handling push event initiated from server side

self.addEventListener('push', function (event) {
  console.log('Push Notification received', event);

  var data = {
    title: 'New!',
    content: 'Something new happened!',
    openUrl: '/'
  };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: '/src/images/chat.png',
    badge: '/src/images/chat.png',
    // data:{
    //   url:    //data.openUrl
    // }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});



// Below code is taken from pwa notifications sections todo
//Modifications yet to be done.

self.addEventListener('notificationclick', function(event) {
  var notification = event.notification;
  event.waitUntil(
    clients.matchAll()
      .then(function(clis) {
        var client = clis.find(function(c) {
          return c.visibilityState === 'visible';
        });

        if (client !== undefined) {
          client.navigate('/main.html');
          client.focus();
        } else {
          clients.openWindow('/main.html');
        }
        notification.close();
      })
  );
  // var action = event.action;

  // console.log(notification);

  // if (action === 'confirm') {
  //   console.log('Confirm was chosen');
  //   notification.close();
  // } else {
  //   console.log(action);
  //   event.waitUntil(
  //     clients.matchAll()
  //       .then(function(clis) {
  //         var client = clis.find(function(c) {
  //           return c.visibilityState === 'visible';
  //         });

  //         if (client !== undefined) {
  //           client.navigate(notification.data.url);
  //           client.focus();
  //         } else {
  //           clients.openWindow(notification.data.url);
  //         }
  //         notification.close();
  //       })
  //   );
  // }
});

// self.addEventListener('notificationclose', function(event) {
//   console.log('Notification was closed', event);
// });