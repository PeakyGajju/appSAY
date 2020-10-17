//using direct code instead of utility.js


// When user clicks on a chat the user gets redirected to this page.

var dbPromise = idb.open('AppsayDB', 1, function (db) {
    if (!db.objectStoreNames.contains('messageListCompany1')) {
        console.log("utility2 debug3")

        db.createObjectStore('messageListCompany1', {
            keyPath: 'id'
        }); //for storing messages in idb
    }

});

function getParameterByName(name, url) { //This function is used to get the nickName from the url.
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
var loginName;

var sharedMomentsArea=document.querySelector('#shared-moments');
const chatName = document.querySelector('.chatName');
const chatForm=document.querySelector('#chat-form');
chatName.textContent = getParameterByName('nickName');

var user=chatName.textContent;
console.log("User: "+user);


readAllData('loginDetail')
    .then(function (loginDetails) {
        if (JSON.stringify(loginDetails[0] !== undefined)) {

             loginName=loginDetails[0].nickName;
            var chatWithUser = {
                otherUserNickName: user,
                myPhoneNumber: loginDetails[0].phoneNumber
            }
            console.log("chatWithUser: "+chatWithUser);
            //getting all messages from DB for particular company
            fetch('/getMessages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(chatWithUser)
                })
                .then(function (messageArray) {
                    return messageArray.json()
                })
                .then(function (finalArray) {
                    //couldn't access finalArray out of scope...so used global variable to store it
                    messageList = finalArray;
                    listLength = messageList.length; //because promises don't return normal arrays
                    storeMessagesIdb(messageList, listLength); //storing messages in IDB
                })
                .then(function(){
                    readAllData('messageListCompany1') //read data from IDB
                        .then(function (list) {
                            console.log("Reading the messages from messageListCompany1: " + list)
                            updateUI(list, list.length); //update chats
                        })
                })

        }
    })

const socket=io();

socket.on('message', function(message){
    console.log(message);
    outputMessage(message);

    sharedMomentsArea.scrollTop=sharedMomentsArea.scrollHeight;
})

chatForm.addEventListener('submit', function(event){
    event.preventDefault();

    let msg=event.target.elements.msg.value;
    console.log(msg);

    msg=msg.trim();

    if(!msg){
        return false;
    }

    var msgObj={
        msg:msg,
        to:user
    }

    socket.emit('chatMessage', msgObj);

    event.target.elements.msg.value = '';
    event.target.elements.msg.focus();
})




function outputMessage(message) {
    var msgWrapper = document.createElement('div');
    msgWrapper.className = 'message-container';
    var msgTitle = document.createElement('div');
    msgWrapper.appendChild(msgTitle);
    var msgTitleTextElement = document.createElement('h5');
    msgTitleTextElement.style.color = 'black';
    msgTitleTextElement.className = 'message-title';
    msgTitleTextElement.textContent = "from - "+message.from+" - "+message.time;
    msgTitle.appendChild(msgTitleTextElement);
    var msgSupportingText = document.createElement('div');
    msgSupportingText.className = 'message-body';
    msgSupportingText.textContent = message.body;
    msgSupportingText.style.fontSize='20px';
    msgWrapper.appendChild(msgSupportingText);
    sharedMomentsArea.appendChild(msgWrapper);

  }

  function updateUI(data, len) {
    clearCards();
    for (var i = 0; i < len; i++) {
        console.log("Data[i]: " + data[i])
        outputMessage(data[i]);
    }
}


  function clearCards() {
    while (sharedMomentsArea.hasChildNodes()) {
        sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
    }
}

  


//all functions

function storeMessagesIdb(data, len) {
    clearAllData('messageListCompany1')
    for (var i = 0; i < len; i++) {
        var msgObj = {
            id: i + 1,
            from: data[i].from,
            to: data[i].to,
            body: data[i].body,
            time:data[i].time
        }
        writeData('messageListCompany1', msgObj);
    }
}

function clearAllData(st) {
    return dbPromise
        .then(function (db) {
            var tx = db.transaction(st, 'readwrite');
            var store = tx.objectStore(st);
            store.clear();
            return tx.complete;
        });
}


function readAllData(st) {
    return dbPromise
        .then(function (db) {
            var tx = db.transaction(st, 'readonly');
            var store = tx.objectStore(st);
            return store.getAll();
        });
}

function writeData(st, data) {
    return dbPromise
        .then(function (db) {
            var tx = db.transaction(st, 'readwrite');
            var store = tx.objectStore(st);
            store.put(data);
            return tx.complete;
        });
}