const mysql = require('mysql');

let connection = mysql.createConnection({
  host: '34.93.179.111',
  user: 'temp',
  database: 'promiseEngine',
  password: 'temp@123'
});

  connection.connect(function(err) {
    if (err) {
      console.error('Error connecting: ' + err.stack);
      return;
    }
    console.log('Connected as thread id: ' + connection.threadId);
  });
  
  module.exports = connection;