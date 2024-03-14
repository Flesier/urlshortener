require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const data = [];

const isValidURL = (url) => {
  try {
    const url = new URL(url);

    return true;
  } catch (error) {
    return false;
  }
};

const myLogger = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);

  next();
};

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(myLogger);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;
  const urlPattern = /^http(s)?:\/\/(www\.)?\w+(\.\w+)|(:\d+)/;

  console.log({ url });

  if (!urlPattern.test(url)) {
    return res.json({
      error: 'invalid url'
    });
  }

  const short_url = Date.now();

  data.unshift({
    original_url: url,
    short_url
  });

  res.json({
    original_url: url,
    short_url
  });
});

app.get('/api/shorturl/:id', (req, res) => {
  const id = Number(req.params.id);

  const url = data.find((el) => el.short_url === id);

  if (!url) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(url.original_url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});