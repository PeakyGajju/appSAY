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

var buttonDiv=document.querySelector('.registerBtn');
var registerButton=document.querySelector('#register');
var checkbox=document.querySelector('#Agreement');
var checkIfCompany=document.querySelector('#registerAsCompany');




// Enabling the register button only after the Agreement checkbox is ticked.




function terms_changed(checkbox){
  console.log("Inside the triggering function");
  if(checkbox.checked){
    registerButton.disabled=false;
  }else{
    registerButton.disabled=true;
    alert("Agree to the terms and conditions first");
  }
}
function storeDetails(){
       var phoneNumber = document.forms["registrationForm"]["PhoneNumber"].value;
      var nickName = document.forms["registrationForm"]["nickName"].value;
      var compnyUser=checkIfCompany.checked;
      console.log(phoneNumber);
      console.log(nickName);
      console.log(checkIfCompany.checked);
      var loginDetails = {
        id:1,
        phoneNumber : phoneNumber,
        nickName : nickName,
        CompanyUser:compnyUser
      }
      clearAllData('loginDetail')
      writeData('loginDetail',loginDetails);
      return true;
    }
 

function writeData(st, data) {
  return dbPromise
    .then(function(db) {
      var tx = db.transaction(st, 'readwrite');
      var store = tx.objectStore(st);
      store.put(data);
      return tx.complete;
    });
}

function readAllData(st) {
  return dbPromise
    .then(function(db) {
      var tx = db.transaction(st, 'readonly');
      var store = tx.objectStore(st);
      return store.getAll();
    });
}

function clearAllData(st) {
  return dbPromise
    .then(function(db) {
      var tx = db.transaction(st, 'readwrite');
      var store = tx.objectStore(st);
      store.clear();
      return tx.complete;
    });
}