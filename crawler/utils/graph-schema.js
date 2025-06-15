const validator = require('validator');

function isSpotifyURI(uri, type) {
    const regex = new RegExp(`^spotify:${type}:[a-zA-Z0-9]+$`);
    return regex.test(uri);
}

function validateArtistInput(artist) {
    if (!artist.spotifyId) {
        throw new Error(`Invalid or missing Spotify Artist URI: ${artist.spotifyUri}`);
    }
    if (typeof artist.name !== 'string' || !artist.name.trim()) {
        throw new Error(`Invalid artist name: ${artist.name}`);
    }
    if (artist.image && !validator.isURL(artist.image)) {
        throw new Error(`Invalid artist image URL: ${artist.image}`);
    }

    if ('popularity' in artist && (typeof artist.popularity !== 'number' || artist.popularity < 0 || artist.popularity > 100)) {
        throw new Error(`Invalid artist popularity: ${artist.popularity}`);
    }

    return true;
}

function formatArtistForDb(artist) {
    validateArtistInput(artist);

    return {
        spotifyId: artist.spotifyId,
        name: artist.name,
        image: artist.image,
        ...(artist.popularity !== undefined ? { popularity: artist.popularity } : {})
    };
}

function validateEdgeInput(edge) {
    if (!Array.isArray(edge.songs) || edge.songs.length === 0) {
        throw new Error("COLLABORATED_WITH edge must include a non-empty 'songs' array.");
    }

    edge.songs.forEach((song, index) => {
        if (!isSpotifyURI(song.songUri, 'track')) {
            throw new Error(`Invalid Spotify Track URI at index ${index}: ${song.songUri}`);
        }
        if (typeof song.name !== 'string' || !song.name.trim()) {
            throw new Error(`Invalid song name at index ${index}: ${song.name}`);
        }
        if (!isSpotifyURI(song.albumUri, 'album')) {
            throw new Error(`Invalid album URI at index ${index}: ${song.albumUri}`);
        }
    });

    return true;
}

function formatEdgeForDb(edge) {
    validateEdgeInput(edge);

    return {
        songUris: edge.songs.map(song => song.songUri),
        songNames: edge.songs.map(song => song.name),
        albumUris: edge.songs.map(song => song.albumUri),
        images: edge.songs.map(song => song.image)
    };
}


module.exports = {
    validateArtistInput,
    formatArtistForDb,
    validateEdgeInput,
    formatEdgeForDb
};
