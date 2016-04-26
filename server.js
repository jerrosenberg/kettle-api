'use strict';

var express = require('express');
var iKettle = require('ikettle.js');

var ikettle = new iKettle();

ikettle.discover(function (error, success) {
  if (error) {
    console.log('Kettle discovery error ' + error);
    process.exit(1);
  }

  var app = express();

  app.post('/boil', function (req, res) {
    ikettle.boil(function () {
      console.log('Kettle boiling');
      res.json({ success: true });
    });
  });

  app.post('/off', function (req, res) {
    ikettle.off(function () {
      console.log('Kettle stopped');
      res.json({ success: true });
    });
  });

  app.post('/keepwarm', function (req, res) {
    ikettle.setKeepWarm(function () {
      console.log('Kettle keep warm set');
      res.json({ success: true });
    });
  });

  app.listen(8080);
  console.log('Started listening');
});