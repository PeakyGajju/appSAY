// jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const http=require('http');
const mongoose = require('mongoose');
const socketio=require('socket.io');
const webpush = require('web-push');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');
const { log } = require('console');

require('dotenv').config()

const app = express();
const server=http.createServer(app);
const io=socketio(server);

app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

//atlas DB connection details
const pass = process.env.MONGODB_PASSWORD; //password for atlas
const remoteDBurl = "mongodb+srv://admin-sid:" + pass + "@cluster0.haf22.mongodb.net/appsayDB";
mongoose.connect(remoteDBurl, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const detailSchema = new mongoose.Schema({
  nickName: String,
  phoneNumber: Number,
  CompanyUser: Boolean,
  messageList: [{
    from: Number,
    to: Number,
    body: String,
    time:String

  }]
});

const Detail = new mongoose.model("Detail", detailSchema);

//define schema for subscription(alongwith subscriber's phone number)
const subcriptionSchema = new mongoose.Schema({
  subscriptionDetail: {
    endpoint: {
      type: String,
      required: true
    },
    expirationTime: {

    },
    keys: {
      auth: {
        type: String,
        required: true
      },
      p256dh: {
        type: String,
        required: true
      }
    },
  },
  phoneNumber: {
    type: Number,
    required: true
  }
});

const Subscription = new mongoose.model('Subscription', subcriptionSchema);


//redirect to index page
app.get('/', (req, res) => {
  res.send("/index.html");
});

//redirect to when user enters details/otp
app.post('/otpVerification', (req, res) => {
  var phone = req.body.PhoneNumber;
  const nickName = req.body.nickName;
  var companyUser;
  console.log(req.body.checkForCompany);

  if (req.body.checkForCompany) {
    companyUser = true;
  } else {
    companyUser = false;
  }

  console.log("PhoneNumber: " + req.body.PhoneNumber);
  console.log("nickName: " + req.body.nickName);
  console.log("Checking if the user registered as a Company: " + companyUser);

  var message;
  var errorMsg = "";
  number = phone;

  //find if number is already registered
  Detail.findOne({
    phoneNumber: phone
  }, (err, result) => {
    if (err) {
      console.log(err);
    } else if (!result) {
      const newDetailItem = new Detail({ //add number to database if not registered
        nickName: nickName,
        phoneNumber: phone,
        CompanyUser: companyUser,
        messageList: [{
          from: null,
          to: null,
          body: null,
          time:null
        }]
      });
      newDetailItem.save();
      console.log("detail inserted");
      message = "Welcome to AppSay, to register";
      res.render('otp', {
        nickName: nickName,
        message: message,
        phoneNo: phone,
        errorMsg: errorMsg
      }); //Redirecting to the otp page
    } else { //give message to sign in
      console.log("Number exists already!");
      message = "Welcome to AppSay, to sign-in";
      res.render('otp', {
        nickName: nickName,
        message: message,
        phoneNo: phone,
        errorMsg: errorMsg
      }); //Redirecting to the otp page
    }
  })

  app.post('/otp-check', (req, res) => {
    const otp = req.body.otpInput;
    if (otp === '0702') {
      res.redirect('/main.html');
    } else {
      errorMsg = "Wrong otp!! Please re-enter."
      res.render('otp', {
        nickName: nickName,
        message: message,
        phoneNo: phone,
        errorMsg: errorMsg
      });
      errorMsg = "";
    }
  })

});

var loggedInUserName;
var loggedInUserPhoneNumber;


// THis code checks if the user is registered as a company or not.

app.post('/renderMainPage', function (req, res) {
  const companyUser = req.body.CompanyUser;
  loggedInUserName=req.body.nickName;
  loggedInUserPhoneNumber=req.body.phoneNumber;

  console.log("Checking if user is company or not: " + companyUser);
  if (companyUser) {
    Detail.find({
      CompanyUser: false
    }, function (err, docs) {
      if (err) {
        console.log(err);
      } else {
        if (!docs) {
          console.log("No users present");
        } else {
           res.send(JSON.parse(JSON.stringify(docs)));

        }
      }

    })
  } else if (!companyUser) {
    Detail.find({
      CompanyUser: true
    }, function (err, docs) {
      if (err) {
        console.log(err);
      } else {
        if (!docs) {
          console.log("No companies present");
        } else {
          res.send(JSON.parse(JSON.stringify(docs)));
        }
      }
    })
  }


})
//vapid keys
const publicVapidKey = 'BKOaSfmqAThoHdNbrtRSeYTozFJ0_hawimfbrF1X_bY8iBUwEw3j-N6vpLpkQE-Q2g_MljIJrEFthjywGrUUSCQ';

const privateVapidKey = process.env.VAPID_KEY_PRIVATE;

webpush.setVapidDetails('mailto:test@test.com', publicVapidKey, privateVapidKey);

//handling subscription
app.post('/subscribe', (req, res) => {
  console.log('req received!');
  const subObject = req.body;
  var subDetail = subObject.subDetail;
  console.log("SubDetail: " + subDetail)
  var userDetails = subObject.userDetails;
  console.log("UserDetails: " + userDetails)
  var userPhoneNumber = userDetails.phoneNumber
  console.log("UserPhoneNumber: " + userPhoneNumber)

  if (subDetail == null || subDetail == ' ' || !subDetail) {
    res.status(204).json({});
  } else {
    Subscription.findOne({
      phoneNumber: userPhoneNumber
    }, (err, foundObject) => { //check for previous subscription
      if (err) {
        console.log(err);
      } else {
        if (!foundObject) { //storing subscription in database
          const newSubscriptionItem = new Subscription({
            phoneNumber: userPhoneNumber,
            subscriptionDetail: subDetail
          });
          newSubscriptionItem.save();
          res.status(201).json({});
        } else { //delete old subscription and store new
          foundObject.subscriptionDetail = subDetail;
          foundObject.save();
          res.status(201).json({});

        }
      }
    })
    console.log("SubDetail: " + subDetail);
    //payload
    const payload = JSON.stringify({
      'title': 'Test Sub!'
    });
    //sending notification
    webpush.sendNotification(subDetail, payload)
      .catch(err => console.error(err));
  }

})

//client browser can access list of all messages

// Changed the /getMessages route.In working condition.

app.post('/getMessages', (req, res) => {
  //parses company name received from client
  var OtherUsernickName = req.body.otherUserNickName;
  var myPhoneNumber = req.body.myPhoneNumber;
  var otherUserPhoneNumber = 0;
  console.log("OtherUsernickName: "+OtherUsernickName);
  console.log("myPhoneNumber: "+myPhoneNumber);
  Detail.findOne({
    nickName: OtherUsernickName
  }, function (err, objectFound) {
    if (err) {
      console.log(err);
    } else {
      if (!objectFound) {
        console.log("Company/user  " + OtherUsernickName + " not registered");
      } else {
        otherUserPhoneNumber = objectFound.phoneNumber;
        console.log("otherUserPhoneNumber: "+otherUserPhoneNumber)
        Detail.findOne({
          phoneNumber: myPhoneNumber
        }, function (err, docs) {
          if (err) {
            console.log(err);
          } else {
            if (!docs) {
              console.log("Company/user with number " + myPhoneNumber + " not registered");
            } else {
              // console.log("docs.MessageList "+docs.messageList);
              var allMessageArray = docs.messageList;
              console.log("allMessageArray: "+allMessageArray);
              messageArray = [];
              allMessageArray.forEach(element => {
                if (element.to === otherUserPhoneNumber || element.from === otherUserPhoneNumber) {
                  messageArray.push(element);
                }
              });
              console.log("messageArray: "+messageArray)
              res.json(messageArray);
            }

          }
        })
      }

    }
  })
  console.log("Other User phone number = " + otherUserPhoneNumber)


})


var botName='ChatBot';

io.on('connection', function(socket){
  console.log("New WS connection");
  console.log("Socket id: "+socket.id);

  // socket.emit('message', formatMessage(botName, 'Welcome!!!'));


  socket.on('chatMessage', function(msgObj){

      var otherUserNickName=msgObj.to;
      var msg=msgObj.msg;

         console.log("Message from client: "+msgObj);
         console.log("Client Name: "+msgObj.to);
      io.emit('message', formatMessage(loggedInUserName, msgObj.msg));

    var to;
      Detail.findOne
      ({nickName:otherUserNickName},
         function(err, userFound){
        if(err){
          console.log(err);
        }else{
          if(!userFound){
            console.log("Company/User "+otherUserNickName+" is not registered");
          }else{
            to=userFound.phoneNumber;
            messagePayLoad={
              from:loggedInUserPhoneNumber,
              to:to,
              body:msg,
              time:formatMessage(loggedInUserName,msg).time
            }

            Detail.findOne({
              phoneNumber:loggedInUserPhoneNumber
              },function(err, docs){
                if(err){
                  console.log(err);
                }else{
                  if(!docs){
                    console.log("Company/User "+loggedInUserName+" is not registered");
                  }else{
                    docs.messageList.push(messagePayLoad);
                    docs.save();
                    console.log("inserted record in sender")

                    Subscription.findOne({
                      phoneNumber:to
                    }, function(err, result){
                      if(err){
                        console.log(err);
                      }else{
                        const payload=JSON.stringify({
                          'title': loggedInUserName+" - "+loggedInUserPhoneNumber,
                          'content': msg
                        })
                        if(!result){
                          console.log("subs not Found");
                          }else{
                            webpush.sendNotification(result.subscriptionDetail, payload)
                            .catch(err=>console.log(err));
                          }
                      }
                    })

                    Detail.findOne({
                      phoneNumber:to
                    }, function(err, docs){
                      if(err){
                        console.log(err);
                      }else{
                        if(!docs){
                          console.log("Company/User "+to+" is not registered");
                        }else{
                          docs.messageList.push(messagePayLoad);
                          docs.save();
                          console.log("inserted record in receiver")

                        }
                      }
                    })

                  }
                }
              }
            )
            
          }
        }
      })
  })
})



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
server.listen(port, function () {
  console.log("Server started on port 3000");
});