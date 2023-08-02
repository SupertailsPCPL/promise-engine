const mysql = require('mysql');

let connection = mysql.createConnection({
  host: '35.200.229.177',
  user: 'analyticsuser',
  database: 'razorpay',
  password: 'PI-fZOdeMu*0fiG|'
});

  connection.connect(function(err) {
    if (err) {
      console.error('Error connecting: ' + err.stack);
      return;
    }
    console.log('Connected as thread id: ' + connection.threadId);
  });
  
  module.exports = connection;