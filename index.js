const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { verify } = require('crypto');
const fs = require('fs');
const uuid = require('uuid');

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





/*
app.post('/nsw', (req, res) => {
  console.log(req.body);
  res.status(201).json({ message: 'ok' });
});
*/

// verify token
const verifyToken = (req, res, next) => {
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

    next();
  });
};

// post nsw with verify token
app.post('/nsw', verifyToken, (req, res) => {
  //console.log(req.body);

  const action = "";
  const rs ="";
  switch(req.body.action){
    case "VSED": action = "VSED_VSEA"; rs=vsed_base64; break;
    case "SAOPER": action = "SAOPER_SAOA"; rs=saoper_base64;break;
    case "MMAN": action = "MMAN_MMAA"; rs=mman_base64; break;
    case "CLIS": action = "CLIS_CLSA"; rs=clis_base64;break;
    case "CANMAN": action = "CANMAN_CAMA"; rs=canman_base64; break;
  }


  const response = {
    messageId: "THNSW_Dev@"+uuid.v4(),
    fromId: req.body.toId,
    toId: req.body.fromId,
    action: action,
    serviceName: req.body.serviceName,
    conversationId: req.body.conversationId,    
    timestamp: new Date().toISOString(),
    reftoMessageId: req.body.messageId,
    payload: rs,
  };
  console.log(response);
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