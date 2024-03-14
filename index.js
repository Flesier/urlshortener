require('dotenv').config();
const express = require('express');
const cors = require('cors');
const validUrl = require('valid-url');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');  // Using nanoid for short URL generation

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define URL Schema
const urlSchema = new Schema({
  original_url: String,
  short_url: String,
});

const Url = mongoose.model('Url', urlSchema);

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;

  if (!validUrl.isWebUri(url)) {
    return res.json({ error: 'Invalid URL' });
  }

  try {
    // Generate a unique short URL using nanoid
    const short_url = nanoid(6);  // Generate 6 character long random string

    const existingUrl = await Url.findOne({ original_url: url });
    if (existingUrl) {
      // Return existing short URL if it already exists
      return res.json({ original_url: url, short_url: existingUrl.short_url });
    }

    const newUrl = new Url({ original_url: url, short_url });
    await newUrl.save();

    res.json({ original_url: url, short_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const url = await Url.findOne({ short_url });

    if (!url) {
      return res.json({ error: 'No short URL found for the given input' });
    }

    res.redirect(url.original_url);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, function() {
  console.log(`Server is running on port ${port}`);
});
