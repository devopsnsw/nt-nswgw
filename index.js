const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { verify } = require('crypto');
const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const user = {
  username: 'admin',
  password: 'admin'
};

const access_secret='access_secret';
const refresh_secret='refresh_secret';


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
  console.log(req.body);
  res.status(201).json({ messageId:req.body.messageId, code:0, status:"success" });
});


app.post('/api/auth/reqToken', (req, res) => {


  if (req.body.username === user.username && req.body.password === user.password) {
    const accessToken = jwt.sign({ username: user.username }, access_secret, { expiresIn: '1h' });
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