const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { verify } = require('crypto');
const fs = require('fs');
const uuid = require('uuid');
const jszip = require('jszip');
const axios = require('axios');

const app = express();
const port = 3002;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const user = {
  username: 'admin',
  password: 'admin'
};

const access_secret='access_secret';
const refresh_secret='refresh_secret';

const vsed = fs.readFileSync('xml/vsed.xml', 'utf8');
const saoper = fs.readFileSync('xml/saoper.xml', 'utf8');
const mman = fs.readFileSync('xml/mman.xml', 'utf8');
const clis = fs.readFileSync('xml/clis.xml', 'utf8');
const canman = fs.readFileSync('xml/canman.xml', 'utf8');
// vsed to base64

const vsed_base64 = Buffer.from(vsed).toString('base64');
const saoper_base64 = Buffer.from(saoper).toString('base64');
const mman_base64 = Buffer.from(mman).toString('base64');
const clis_base64 = Buffer.from(clis).toString('base64');
const canman_base64 = Buffer.from(canman).toString('base64');



async function zipxml(xmlbase64){

  const zip = new jszip();
  zip.file('xml',xmlbase64);
  const xmlbase64zip = await zip.generateAsync({type:"base64"});
  //console.log(xmlbase64zip);
  return xmlbase64zip;
  
      
  }

  async function unzipxml(xmlbase64zip){
    const zip = new jszip();
    const zipxml = await zip.loadAsync(xmlbase64zip,{base64:true});
    const base64_xml = await zipxml.file('xml').async('string');
    //base64 to xml
    //const xml = Buffer.from(base64_xml,'base64').toString('utf-8');
    //console.log(xml);
    return base64_xml;

}   




// verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  //console.log(token);

  if (!token) {
    res.sendStatus(401);
  }

  jwt.verify(token, access_secret, (err, user) => {
    if (err) {
      res.sendStatus(403);
      console.log(err);
    }

    next();
  });
};

// post nsw with verify token
app.post('/nsw', verifyToken, async (req, res) => {

 let action = "";
 let payload = "";

  if(req.body.action == "VSED"){
    action = "VSED_VSEA";
    payload = await zipxml(vsed_base64);
   
  }
  else if(req.body.action == "SAOPER"){
    action = "SAOPER_SAOA";
    payload = await zipxml(saoper_base64);
  }
  else if(req.body.action == "MMAN"){
    action = "MMAN_MMAA";
    payload = await zipxml(mman_base64);
  }
  else if(req.body.action == "CLIS"){
    action = "CLIS_CLSA";
    payload = await zipxml(clis_base64);
  }
  else if(req.body.action == "CANMAN"){
    action = "CANMAN_CAMA";
    payload = await zipxml(canman_base64);
  }
  

  const response = {
    messageId: "THNSW_Dev@"+uuid.v4(),
    fromId: req.body.toId,
    toId: req.body.fromId,
    action:action,
    serviceName: req.body.serviceName,
    conversationId: req.body.conversationId,    
    timestamp: new Date().toISOString(),
    refToMessageId: req.body.messageId,
    payload: payload,
  };
  console.log(response);

  // Post to http://localhost:3001/response with token
  const token_url = "http://localhost:3001/manifest-receiver/api/v1/token";
  const conf = {
    headers:{
      'Content-Type': 'application/json'
    }
  };
  const data = {
    username: 'nswapi',
    password: 'nswapi'
  };
  const token_rs = await axios.post(token_url, data, conf);
  const token = token_rs.data.token;
  //console.log(token);
  


  //const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im5zd2FwaSIsInBhc3N3b3JkIjoibnN3YXBpIiwiaWF0IjoxNzAzODE5ODg1LCJleHAiOjE3MDM5MDYyODV9.3Zkf-QskbbBdiYPS1S3XhB3KhW7IwLFaElco4F5idZI";

  const url = "http://localhost:3001/manifest-receiver/api/v1/response";
  const config = {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  };
  const rs = await axios.post(url, response, config);
  console.log(rs.data);



  
  res.status(201).json({ messageId:req.body.messageId, code:0, status:"success" });
});


app.post('/api/auth/reqToken', (req, res) => {


  if (req.body.username === user.username && req.body.password === user.password) {
    const accessToken = jwt.sign({ username: user.username }, access_secret, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ username: user.username }, refresh_secret);
    res.json({
      code:0,
      status:"success",
      token: accessToken,
      
    });
  } else {
    res.send('Username or password incorrect');
  }
 

 
});


// verify access token and get data
app.post('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log(token);

  if (!token) {
    res.sendStatus(401);
  }

  jwt.verify(token, access_secret, (err, user) => {
    if (err) {
      res.sendStatus(403);
    }

    res.json({
      message: 'ok',
      user
    });
  });
});

// refresh access token
app.post('/refresh', (req, res) => {
  const refreshToken = req.body.token;

  if (!refreshToken) {
    res.sendStatus(401);
  }

  jwt.verify(refreshToken, refresh_secret, (err, user) => {
    if (err) {
      res.sendStatus(403);
    }

    const accessToken = jwt.sign({ username: user.username }, access_secret, { expiresIn: '5m' });

    res.json({
      accessToken
    });
  });
});





app.listen(port, () => console.log(`Example app listening on port ${port}!`));