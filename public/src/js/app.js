// jshint esversion:6


//registering service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function (err) {
      console.log(err);
    });
}



// Sending a fetch request to the server to check is the user is registered as a company or not.

var userOrCompanies=[];

console.log("Hello from app.js");
readAllData('loginDetail')
.then(function(loginDetails){
  if(JSON.stringify(loginDetails[0]!== undefined)){
    fetch('/renderMainPage',{
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body:JSON.stringify(loginDetails[0])
    })

    .then(function(response){
      console.log("Response: "+response);
      return response.json()
    })
    .then(function(list){
      console.log(list);
      if(list.length>0){
        console.log("List: "+list[0].nickName);
        console.log(list.length);
        console.log(typeof(list));
        userOrCompanies=list;
        console.log("userOrCompanies: "+userOrCompanies);
        updateUI(userOrCompanies);
      }
            
    })
  }
})

function createCard(data){
  console.log("In create card function");
  var wrapper=document.createElement('div');
  wrapper.className='row';
  var imagediv=document.createElement('div');
  imagediv.className='col-6';
  imagediv.className='pic';
  imagediv.style.textAlign='center';
  wrapper.appendChild(imagediv);
  var image=document.createElement('img');
  image.src="src/images/superhero.png";
  imagediv.appendChild(image);

  var textdiv=document.createElement('div');
  textdiv.className='col-6';
  textdiv.className='item';
  textdiv.style.textAlign='center';
  textdiv.style.fontWeight='bold';
  textdiv.style.letterSpacing='2px';
  wrapper.appendChild(textdiv);
  
  var textlink=document.createElement('a');
  textlink.className='person';
  textlink.style.color='#f6f4e6';
  textlink.href="../company1.html?nickName="+data.nickName;
  textlink.text=data.nickName;
  
  textdiv.appendChild(textlink);

  container_fluid.appendChild(wrapper);

}

function updateUI(data) {
  console.log("In UpdateUI: "+data);
  clearCards();
  for (var i = 0; i <data.length; i++) {
      console.log("Data[i]: "+data[i])
      createCard(data[i]);
    }
}

var container_fluid=document.querySelector('.container-fluid');

function clearCards(){
  while (container_fluid.hasChildNodes()) {
    container_fluid.removeChild(container_fluid.lastChild);
}
}


//using direct code instead of utility.js
var dbPromise = idb.open('AppsayDB', 1, function (db) {
  if (!db.objectStoreNames.contains('loginDetail')) {
    console.log("utility debug2")
    db.createObjectStore('loginDetail', {keyPath: 'id'});
  }
  if (!db.objectStoreNames.contains('messageListCompany1')) {
    console.log("utility2 debug3")

    db.createObjectStore('messageListCompany1', {keyPath: 'id'});
  }
  if (!db.objectStoreNames.contains('messageListCompany2')) {
    console.log("utility2 debug3")

    db.createObjectStore('messageListCompany2', {keyPath: 'id'});
  }

});

function readAllData(st) {
  return dbPromise
    .then(function(db) {
      var tx = db.transaction(st, 'readonly');
      var store = tx.objectStore(st);
      return store.getAll();
    });
}
// var userDetails;

// readAllData('loginDetail')
//       .then(function(userDetail){
//          userDetails = userDetail;
//       })

var enable = document.querySelector('.enableNotificationButton');

//handling notification permission

if ('Notification' in window && 'serviceWorker' in navigator) {
  enable.style.display = 'inline-block';
  enable.addEventListener('click', askForNotificationPermission);
}


function askForNotificationPermission() { //This code taken from the pwa course
  Notification.requestPermission(function (result) { //notification section
    console.log('User Choice', result);
    if (result !== 'granted') {
      console.log('No notification permission granted!');
    } else {
      //displayConfirmNotification();
      enable.style.display = 'none';
      configurePushSub();
    }
  });
}


//configuring subscription
function configurePushSub() { // //This code taken from the pwa course
  if (!('serviceWorker' in navigator)) {
    return;
  }
  var reg;
  navigator.serviceWorker.ready
    .then(function (swreg) {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then(function (sub) {
        var vapidPublicKey = 'BKOaSfmqAThoHdNbrtRSeYTozFJ0_hawimfbrF1X_bY8iBUwEw3j-N6vpLpkQE-Q2g_MljIJrEFthjywGrUUSCQ'; //public vapid key
        var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey
        });
    })
    .then(function (newsub) {
      readAllData('loginDetail')
      .then(function(userDetails){
        console.log(userDetails[0]);

        var subObject = {
          subDetail: newsub,
          userDetails : userDetails[0]
        }
        console.log(subObject+"hello");
        return fetch('/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(subObject)
        });
      })
      
    });

}

//convert vapid key to unit 8
function urlBase64ToUint8Array(base64String) { //This code taken from the pwa course
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
