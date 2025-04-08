const { fetchWithRetry } = require('./utils');
require('dotenv').config();

async function fetchAccessToken() {
    const response = await fetchWithRetry('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
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

async function getArtistAlbums(access_token, artistId) {
    const albums = [];
    let nextUrl = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50`;

    while (nextUrl) {
        const response = await fetchWithRetry(nextUrl, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch albums: ${response.status}`);
        }

        const data = await response.json();
        albums.push(...data.items);
        nextUrl = data.next;
    }

    return albums;
}

async function getAlbumTracks(access_token, albumId) {
    const tracks = [];
    let nextUrl = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;

    while (nextUrl) {
        const response = await fetchWithRetry(nextUrl, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch tracks: ${response.status}`);
        }

        const data = await response.json();
        tracks.push(...data.items);
        nextUrl = data.next;
    }

    return tracks;
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

module.exports = { fetchAccessToken, getArtistFromSearch, getArtistAlbums, getAlbumTracks, getArtistDetails };