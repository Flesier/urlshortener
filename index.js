require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mongo = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
const idgenerator = require('idgenerator');
const app = express();
const urlVal = require('urlval');

// Basic Configuration
const port = process.env.PORT || 3000;

// db connection
mongoose.connect(process.env.MONGO_URI, { 
useNewUrlParser: true, 
useUnifiedTopology: true });

mongoose.connection.on('error')

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
}))

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.json())
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// post request
app.post('(api/shorturl', async (req, res) => {
  const bodyUrl = req.body.url
  const urlGen = idgenerator.generate()

  if(!urlVal.isWebUrl(bodyUrl)) {
    res.status(200).json({
      error: 'URL Invalid'
    })
  } else {
    try {
      let findOne = await URL.findOne({
        original_url: bodyUrl
      })

      if(findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })

      } else {
        findOne = new Url({
          original_url: findOne.original_url,
          short_url: urlGen
        })

        await findOne.save()

        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }

    } catch (err) {
      res.status(500).json('server error')
    }
  }
})

// get method
app.get('/api/shorturl/:id', async (req, res) => {
  try {
    const urlParams = await Url.findOne({
      short_url: req.params.id
    })

    if(urlParams){
      return res.redirect(urlParams.original_url)
    } else {
      return res.status(404).json('URL not found')
    }
  } catch(err) {
    res.status(500).json('server error')
  }
})


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});