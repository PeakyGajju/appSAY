// jshint esversion:6

const users = [];

// Join user to chat
function userJoin(id, username, room) {
  const user = { 
    id:id, 
    username:username
    // room:room 
  };

  users.push(user);

  return user;
}

// Get current user
function getCurrentUser(id) {
  return users.find(function(user){
    user.id === id;
  });
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex(function(user){
    user.id === id;
  });

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get room users
// function getRoomUsers(room) {
//   return users.filter(function(user){
//     user.room === room;
//   });
// }

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave
  // getRoomUsers
};
