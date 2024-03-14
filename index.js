require('dotenv').config();
const express = require('express');
const cors = require('cors');
const validUrl = require('valid-url');
const mongoose = require('mongoose');
const dns = require('dns');
const { promisify } = require('util');
const { Schema } = mongoose;

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define URL Schema
const urlSchema = new Schema({
  original_url: String,
  short_url: String // Change to String for storing short URL
});

const Url = mongoose.model('Url', urlSchema);

// Promisify dns.lookup
const lookupPromise = promisify(dns.lookup);

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Function to generate short URL
const generateShortUrl = async () => {
  const count = await Url.countDocuments();
  return (count + 1).toString(); // Convert to string for shorter representation
};

app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;

  // Validate URL format
  if (!validUrl.isWebUri(url)) {
    return res.json({ error: 'Invalid URL format' });
  }

  // Validate if the hostname is reachable
  try {
    const { address } = await lookupPromise(new URL(url).hostname);
  } catch (error) {
    return res.json({ error: 'Hostname not reachable' });
  }

  try {
    // Check if URL already exists in the database
    const existingUrl = await Url.findOne({ original_url: url });

    if (existingUrl) {
      return res.json({ original_url: existingUrl.original_url, short_url: existingUrl.short_url });
    }

    // Generate unique short URL
    const short_url = await generateShortUrl();

    // Save new URL to database
    const newUrl = new Url({ original_url: url, short_url });
    await newUrl.save();

    res.json({ original_url: url, short_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const url = await Url.findOne({ short_url: shortUrl });

    if (!url) {
      return res.json({ error: 'No short URL found for the given input' });
    }

    res.redirect(url.original_url);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

// Start the server
app.listen(port, function() {
  console.log(`Server is running on port ${port}`);
});
