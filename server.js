'use strict';

var express = require('express');
var net = require('net');

connectToKettle('bree', 2000, function (result) {
  console.log('Success: ' + result.success);
  console.log('Socket: ' + result.socket);
  
  if (!result.success) {
    process.exit(1);
    return;
  }
  
  var app = express();
  var socket = result.socket;

  app.post('/boil', function (req, res) {
    console.log('Set boil');
    socket.write('set sys output 0x4\n');
    res.json({ success: true });
  });

  app.post('/off', function (req, res) {
    console.log('Set off');
    socket.write('set sys output 0x0\n');
    res.json({ success: true });
  });

  app.post('/keepwarm', function (req, res) {
    console.log('Set keep warm');
    socket.write('set sys output 0x8\n');
    res.json({ success: true });
  });

  app.listen(8080);
  console.log('Started listening');
});

function connectToKettle(ip, port, callback) {
  var socket = new net.Socket()
  socket.setEncoding('ascii')
  socket.setNoDelay()

  socket.on('timeout', function() {
    console.log('Socket timeout');
    callbackError();
  });

  socket.on('error', function(err) {
    console.log('Socket error: ' + err.message);
    callbackError();
  });

  socket.connect(port, ip, function() {
    var timeoutHandle = setTimeout(function () {
      if (!found) {
        console.log('Handshake timeout');
        socket.end();
        callbackError();
      }
    }, 10000);
    
    socket.once('data', newLineStream(function (data) {
      if (data === 'HELLOAPP') {
        console.log('Received HELLOAPP');
        clearTimeout(timeoutHandle);
        callbackSuccess();        
      }
    }));
    
    socket.write('HELLOKETTLE\n');
    console.log('Sent HELLOKETTLE');
    
  });
  
  function callbackError() {
    callback({
      success: false
    });
  }
  
  function callbackSuccess() {
    callback({
      success: true,
      socket: socket
    })
  }
}

function newLineStream(callback) {
  var buffer = '';
  return (function (chunk) {
    var i = 0, piece = '', offset = 0, nl = '';
    buffer += chunk;
    while ( (i = buffer.indexOf((nl = '\r\n'), offset)) !== -1 ||
            (i = buffer.indexOf((nl = '\n'), offset)) !== -1 ||
            (i = buffer.indexOf((nl = '\r'), offset)) !== -1 ) {
      piece = buffer.substr(offset, i - offset);
      offset = i + nl.length;
      callback(piece);
    }
    buffer = buffer.substr(offset);
  });
}
