const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function redirect(req, res) {
  // Replace this with the domain of your WordPress site
  const wordpressDomain = 'https://dailytrendings.info/';

  // Get the requested path from the URL
  const path = req.url;

  // Build the WordPress URL to fetch the meta tags
  const url = `https://${wordpressDomain}${path}`;

  // Fetch the WordPress URL
  const response = await fetch(url);

  if (response.status !== 200) {
    // If the WordPress URL doesn't exist, return a 404 error
    res.status(404).send('Page not found');
  } else {
    // If the WordPress URL exists, extract the meta tags from the HTML
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('meta[property="og:title"]').attr('content');
    const description = $('meta[property="og:description"]').attr('content');
    const image = $('meta[property="og:image"]').attr('content');

    // Redirect to the WordPress URL with the meta tags as query parameters
    const redirectUrl = `https://${wordpressDomain}${path}?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&image=${encodeURIComponent(image)}`;
    res.redirect(301, redirectUrl);
  }
}

module.exports = redirect;
