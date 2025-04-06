const { getProfile, fetchAccessToken } = require("../utils/spotify-api-utils");


async function test(){
    const access_token = await fetchAccessToken()
    const profile = await getProfile(access_token)
    console.log(profile)
}

test()