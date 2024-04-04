require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// db connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// url model
const shortUrlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: String,
    required: true
  }
});
const Url = mongoose.model('Url', shortUrlSchema);

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.json());

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});


  // Validate URL format
app.post('/api/shorturl', async (req, res) => {
  const bodyUrl = req.body.url;

  // Validate URL format
  const urlPattern = /^(https?:\/\/)?(www\.)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
  if (!urlPattern.test(bodyUrl)) {
    return res.status(400).json({ error: 'invalid url' });
  }

  try {
    let urlEntry = await Url.findOne({ original_url: bodyUrl });

    if (urlEntry) {
      return res.json({
        original_url: urlEntry.original_url,
        short_url: urlEntry.short_url
      });
    } else {
      const newShortUrl = new Url({
        original_url: bodyUrl,
        short_url: String(Math.floor(Math.random() * 10000)) // Generating a random short URL for simplicity
      });

      await newShortUrl.save();

      return res.json({
        original_url: newShortUrl.original_url,
        short_url: newShortUrl.short_url
      });
    }
  } catch (err) {
    return res.status(500).json({ error: 'server error' });
  }
});


app.get('/api/shorturl/:id', async (req, res) => {
  try {
    const urlEntry = await Url.findOne({ short_url: req.params.id });

    if (urlEntry) {
      return res.redirect(urlEntry.original_url);
    } else {
      return res.status(404).json({ error: 'URL not found' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'server error' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});