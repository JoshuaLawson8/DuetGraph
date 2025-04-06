require('dotenv').config()

async function fetchAccessToken() {

    console.log(process.env.SPOTIFY_CLIENT_SECRET)
    const response = await fetch('https://accounts.spotify.com/api/token', {
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

async function getProfile(access_token) {
    console.log(access_token)
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: 'Bearer ' + access_token
      }
    });
  
    const data = await response.json();
    return data
}

module.exports = { getProfile, fetchAccessToken }