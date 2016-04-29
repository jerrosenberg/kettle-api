'use strict';

var express = require('express');
var net = require('net');

var kettleHostInfo = {
  host: process.env['KETTLEHOST'],
  port: process.env['KETTLEPORT'] || 2000
};

var listenPort = process.env['LISTENPORT'] || 8080;

if (!kettleHostInfo.host) {
  console.log('KETTLEHOST not set.');
  process.exit(1);
  return;
}


// TODO: Extract into module
function connectToKettle(kettleHostInfo, callback) {
  var invokedCallback = false;
  var socket = new net.Socket()
  socket.setEncoding('ascii')
  socket.setNoDelay()

  socket.once('timeout', function() {
    console.log('Socket timeout');
    callbackError();
  });

  socket.once('error', function(err) {
    console.log('Socket error: ' + err.message);
    callbackError();
  });
  
  socket.once('close', function() {
    console.log('Socket closed.');
    callbackError(); // Note: Will not invoke error if result already reported.
    socket = null;
  });

  console.log('Connecting to kettle at ' + kettleHostInfo.host + ':' + kettleHostInfo.port);
  
  socket.connect(kettleHostInfo.port, kettleHostInfo.host, function() {
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
    invokeCallbackOnce({
      success: false
    });
  }
  
  function callbackSuccess() {
    invokeCallbackOnce({
      success: true,
      socket: socket,
      done: function () {
        socket.end();
        socket = null;
      }
    })
  }
  
  function invokeCallbackOnce(data) {
    if (invokedCallback) {
      return;
    }
    
    invokedCallback = true;
    callback(data);
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


var app = express();

app.post('/boil', function (req, res) {
  console.log('Set boil');
  connectToKettle(kettleHostInfo, function (result) {
    if (result.success) {
      result.socket.write('set sys output 0x4\n');
      result.done();
    }
    
    res.json({ success: result.success });
  });
});

app.post('/off', function (req, res) {
  console.log('Set off');
  connectToKettle(kettleHostInfo, function (result) {
    if (result.success) {
      result.socket.write('set sys output 0x0\n');
      result.done();
    }
    
    res.json({ success: result.success });
  });
});

app.post('/keepwarm', function (req, res) {
  console.log('Set keep warm');
  connectToKettle(kettleHostInfo, function (result) {
    if (result.success) {
      result.socket.write('set sys output 0x8\n');
      result.done();
    }
    
    res.json({ success: result.success });
  });
});

app.listen(listenPort);
console.log('Listening on port ' + listenPort);

