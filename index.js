const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/urlShortener', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const urlSchema = new mongoose.Schema({
    original_url: String,
    short_url: String
});

const Url = mongoose.model('Url', urlSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/shorturl', (req, res) => {
    const originalUrl = req.body.url;

    // Validate URL
    dns.lookup(new URL(originalUrl).hostname, (err) => {
        if (err) {
            return res.json({ error: 'invalid URL' });
        }

        // Check if URL already exists in the database
        Url.findOne({ original_url: originalUrl }, (err, data) => {
            if (err) {
                return res.json({ error: 'Database error' });
            }

            if (data) {
                return res.json({ original_url: data.original_url, short_url: data.short_url });
            }

            // Create a new short URL
            const shortUrl = Math.floor(Math.random() * 10000).toString();
            const newUrl = new Url({
                original_url: originalUrl,
                short_url: shortUrl
            });

            newUrl.save((err, data) => {
                if (err) {
                    return res.json({ error: 'Database error' });
                }

                res.json({ original_url: data.original_url, short_url: data.short_url });
            });
        });
    });
});

app.get('/api/shorturl/:short_url', (req, res) => {
    const shortUrl = req.params.short_url;

    Url.findOne({ short_url: shortUrl }, (err, data) => {
        if (err || !data) {
            return res.json({ error: 'Short URL not found' });
        }

        res.redirect(data.original_url);
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
