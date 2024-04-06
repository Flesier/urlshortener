require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const validator = require('validator');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// db connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('MongoDB connected...'))
.catch(err => {
  console.log('MongoDB connection error:', err);
  process.exit(1);
});

// url model
const shortUrlSchema = new mongoose.Schema({
  original_url : {
    type: String,
    required: true
  },
  short_url : {
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

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// post request
app.post('/api/shorturl', async (req, res) => {
  const bodyUrl = req.body.url;

  if (!validator.isURL(bodyUrl)) {
    res.status(200).json({
      error: 'invalid url'
    });
  } else {
    try {
      let findOne = await Url.findOne({
        original_url: bodyUrl
      });

      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        });
      } else {
        const { nanoid } = await import('nanoid');
        const urlGen = nanoid(8); // Generate a unique, URL-friendly ID with a length of 8 characters
        findOne = new Url({
          original_url: bodyUrl,
          short_url: urlGen
        });

        await findOne.save();

        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        });
      }

    } catch (err) {
      console.log('Post request error:', err);
      res.status(500).json({
        error: 'server error'
      });
    }
  }
});

// get method for redirection
app.get('/api/shorturl/:id', async (req, res) => {
  try {
    const urlParams = await Url.findOne({
      short_url: req.params.id
    });

    if (urlParams) {
      return res.redirect(urlParams.original_url);
    } else {
      return res.status(404).json({
        error: 'URL not found'
      });
    }
  } catch(err) {
    console.log('Get request error:', err);
    res.status(500).json({
      error: 'server error'
    });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
