'use strict'
const express = require('express');
const path = require('path');
const router = require('./router/index');
const http = require('http');
const bodyParser = require('body-parser');
const app = express();
const port = 3385;
const host = '106.14.153.109';
process.env.JWT_SECRET = 'uwotm9';
app.set('views', path.join(__dirname, 'views'));
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.use(bodyParser.json());
app.use(bodyParser.json({limit:'5mb'}));
app.use(bodyParser.urlencoded({limit:'5mb',extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
const url='mongodb://wuxing:wxqcL10t@127.0.0.1:27017/wuxing';
const mongoClient = require('mongodb').MongoClient;
const assert = require('assert');

mongoClient.connect(url, {useNewUrlParser:true ,useUnifiedTopology: true},(err, client)=>{
  assert.equal(null,err);
  const db = client.db('wuxing');
  app.use(function(req, res, next) {
    req.db=db;
    if(req.headers['x-http-method-override']){
      req.method=req.headers['x-http-method-override'];
    }
    next()
  });
  app.use(router);
  app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
  });
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      errmsg: err.message,
      error: {}
    });
  });
	let server = http.Server(app);
	server.listen(port,(err)=>{
    console.log(err);
  })
});

