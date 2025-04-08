const { getArtistFromSearch, fetchAccessToken } = require("../utils/spotify-api-utils");


async function test(){
    const access_token = await fetchAccessToken()
    const profile = await getArtistFromSearch(access_token, "Frost Children")
    console.log(profile['artists']['items'][0])
}

test();