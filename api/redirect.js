const fetch = require('node-fetch');
const { createHttpLink } = require('apollo-link-http');
const { setContext } = require('apollo-link-context');
const { ApolloClient, InMemoryCache, gql } = require('@apollo/client');
const cheerio = require('cheerio');

async function redirect(req, res) {
  // Replace this with the domain of your WordPress site
  const wordpressDomain = 'example.com';

  // Build the WordPress URL to fetch the meta tags
  const path = req.url;
  const url = `https://${wordpressDomain}${path}`;

  // Fetch the WordPress post ID from the GraphQL API
  const httpLink = createHttpLink({ uri: `https://${wordpressDomain}/graphql` });
  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: `Bearer ${process.env.WP_GRAPHQL_AUTH_TOKEN}`,
      }
    };
  });
  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
  const query = gql`
    query {
      postBy(uri: "${path}") {
        id
        title
        excerpt
        featuredImage {
          node {
            sourceUrl(size: MEDIUM_LARGE)
          }
        }
      }
    }
  `;
  const { data } = await client.query({ query });
  const { id, title, excerpt, featuredImage } = data.postBy;

  // Build the WordPress URL with the post ID as query parameter
  const redirectUrl = `https://${wordpressDomain}?p=${id}`;

  // Fetch the WordPress URL
  const response = await fetch(redirectUrl);

  if (response.status !== 200) {
    // If the WordPress URL doesn't exist, return a 404 error
    res.status(404).send('Page not found');
  } else {
    // If the WordPress URL exists, extract the meta tags from the HTML
    const html = await response.text();
    const $ = cheerio.load(html);
    $('meta[property="og:title"]').attr('content', title);
    $('meta[property="og:description"]').attr('content', excerpt);
    $('meta[property="og:image"]').attr('content', featuredImage?.node?.sourceUrl);

    // Return the modified HTML
    res.send($.html());
  }
}

module.exports = redirect;
