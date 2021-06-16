// Constants:
const customWebsites = ['flipkart']


// Functions:
const customFilter = (sanitizedURL) => {
  let finalURL = sanitizedURL;

  for (let i = 0; i < customWebsites.length; i++) {
    const customWebsite = customWebsites[i];
    if (sanitizedURL.includes(customWebsite)) {
      finalURL = sanitizedURL.split('&')[0];
      break;
    }
  }

  return finalURL;
};

const sanitizeURL = (URL) => {
  return customFilter(URL
    // Delete the protocol.
    .replace(/(^\w+:|^)\/\//, '')
    // Delete fragments.
    .replace(/#.*$/, '')
    // Delete any trailing slashes.
    .replace(/\/$/, '')
    // Delete the www subdomain, if present.
    .replace(/www\./, ''));
};


// Exports:
export default sanitizeURL;
