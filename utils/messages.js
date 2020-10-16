

const moment = require('moment');

function formatMessage(username, text) {
  return {
    from:username,
    body:text,
    time: moment().format('h:mm a')
  };
}

module.exports = formatMessage;
