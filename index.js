require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const idgenerator = require('idgenerator');
const validator = require('validator');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// db connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

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

app.use(cors());  // Add this line to handle CORS
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
        const urlGen = idgenerator.generate(); // Moved inside the else block
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
      res.status(500).json('server error');
    }
  }
});

// get method
app.get('/api/shorturl/:id', async (req, res) => {
  try {
    const urlParams = await Url.findOne({
      short_url: req.params.id
    });

    if (urlParams) {
      return res.redirect(urlParams.original_url);
    } else {
      return res.status(404).json('URL not found');
    }
  } catch(err) {
    res.status(500).json('server error');
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
