const { fetchWithRetry } = require('./utils');
require('dotenv').config();

let cachedToken = null;
let tokenFetchedAt = 0;
const TOKEN_TTL = 3000 * 1000; // 3000 seconds in ms

async function fetchAccessToken() {
  const now = Date.now();

  if (cachedToken && now - tokenFetchedAt < TOKEN_TTL) {
    return cachedToken;
  }

  const response = await fetchWithRetry('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenFetchedAt = now;

  return cachedToken;
}
async function getArtistFromSearch(access_token, artistName) {
    const params = new URLSearchParams({
        q: artistName,
        type: "artist",
        limit: 3
    });

    const response = await fetchWithRetry(`https://api.spotify.com/v1/search?${params.toString()}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
    }

    return await response.json();
}

/**
 * Fetches all album IDs for a given artist.
 * @param {string} accessToken - The OAuth token for Spotify API.
 * @param {string} artistId - The Spotify ID of the artist.
 * @returns {Promise<Array<string>>} - A promise that resolves to an array of album IDs.
 */
async function getArtistAlbumIds(accessToken, artistId) {
    const albumIds = [];
    let nextUrl = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50`;
  
    while (nextUrl) {
      const response = await fetchWithRetry(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch albums: ${response.status}`);
      }
  
      const data = await response.json();
      albumIds.push(...data.items.map((album) => album.id));
      nextUrl = data.next;
    }
  
    return albumIds;
  }


async function getArtistDetails(accessToken, artistId) {
  const response = await fetchWithRetry(`https://api.spotify.com/v1/artists/${artistId}`, {
      method: 'GET',
      headers: {
          Authorization: `Bearer ${accessToken}`
      }
  });

  if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetches detailed information for multiple albums using their Spotify IDs.
 * @param {string} accessToken - The OAuth token for Spotify API.
 * @param {Array<string>} albumIds - An array of Spotify album IDs (max 20).
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of album objects.
 */
async function getMultipleAlbums(accessToken, albumIds) {
    const ids = albumIds.join(',');
    const response = await fetchWithRetry(`https://api.spotify.com/v1/albums?ids=${ids}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  
    if (!response.ok) {
      throw new Error(`Failed to fetch multiple albums: ${response.status}`);
    }
  
    const data = await response.json();
    return data.albums;
  }
  

module.exports = { fetchAccessToken, getArtistFromSearch, getArtistAlbumIds, getArtistDetails, getMultipleAlbums };