import React, { useState } from "react";

export default function ArtistDisplay() {
  const [artist1, setArtist1] = useState("");
  const [artist2, setArtist2] = useState("");
  const [pathData, setPathData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [songIndices, setSongIndices] = useState({});

  const fetchPath = async () => {
    if (!artist1.trim() || !artist2.trim()) {
      setError("Both artist names are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/namePath/${encodeURIComponent(artist1)}/${encodeURIComponent(artist2)}`);
      if (!response.ok) throw new Error("Failed to fetch artist path");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid response format");
      setPathData(data);
      setSongIndices({});
    } catch (err) {
      console.error("API error:", err);
      setError("Could not fetch connection. Please try again.");
      setPathData([]);
    } finally {
      setLoading(false);
    }
  };

  const changeSong = (key, direction, length) => {
    setSongIndices((prev) => {
      const current = prev[key] || 0;
      const next = (current + direction + length) % length;
      return { ...prev, [key]: next };
    });
  };

  const renderPath = () => {
    if (pathData.length === 0) {
      return <p className="text-gray-600">No connection found yet. Try searching!</p>;
    }

    const segments = pathData.flatMap(p => p.segments);
    const elements = [];

    segments.forEach((segment, index) => {
      const key = `${segment.start.properties.name}-${segment.end.properties.name}-${index}`;
      const songNames = segment.relationship.properties.songNames || [];
      const songImages = segment.relationship.properties.images || [];
      const songUris = segment.relationship.properties.songUris || [];
      const songIndex = songIndices[key] || 0;
      const currentSong = songNames[songIndex] || "";
      const currentImage = songImages[songIndex] || "https://via.placeholder.com/48";
      const currentUri = songUris[songIndex] || null;

      const artistImage = (image) => image || require('../resources/putidevil-miku-questionmark.jpg');
      const spotifyLink = (id) => `https://open.spotify.com/artist/${id}`;

      elements.push(
        <a
          key={`artist-${index}-start`}
          href={spotifyLink(segment.start.properties.spotifyId)}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-2 sm:p-4 rounded-lg shadow flex flex-col items-center w-full sm:max-w-xs hover:opacity-90 transition"
        >
          <img
            src={artistImage(segment.start.properties.image)}
            alt={segment.start.properties.name}
            className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-lg mb-2"
          />
          <div className="text-lg sm:text-xl font-semibold text-center">{segment.start.properties.name}</div>
        </a>
      );

      elements.push(
        <div
          key={`song-${index}`}
          onClick={() => {
            if (currentUri) {
              window.location.href = currentUri;
            }
          }}
          className="bg-gray-100 p-2 sm:p-4 rounded-lg shadow w-full sm:max-w-lg flex items-center justify-between cursor-pointer hover:bg-gray-200"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              changeSong(key, -1, songNames.length);
            }}
            className={`text-xl font-bold ${songIndex === 0 ? 'text-gray-400' : ''}`}
            disabled={songIndex === 0}
          >◀</button>
          <div className="flex items-center space-x-2 sm:space-x-4 w-3/4 truncate">
            <img
              src={currentImage}
              alt="song"
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
            />
            <div className="text-left truncate">
              <div className="font-medium text-base sm:text-lg truncate">{currentSong}</div>
              <div className="text-xs sm:text-sm text-gray-600 truncate">
                {segment.start.properties.name}, {segment.end.properties.name}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              changeSong(key, 1, songNames.length);
            }}
            className={`text-xl font-bold ${songIndex === songNames.length - 1 ? 'text-gray-400' : ''}`}
            disabled={songIndex === songNames.length - 1}
          >▶</button>
        </div>
      );

      if (index === segments.length - 1) {
        elements.push(
          <a
            key={`artist-${index}-end`}
            href={spotifyLink(segment.end.properties.spotifyId)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-2 sm:p-4 rounded-lg shadow flex flex-col items-center w-full sm:max-w-xs hover:opacity-90 transition"
          >
            <img
              src={artistImage(segment.end.properties.image)}
              alt={segment.end.properties.name}
              className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-lg mb-2"
            />
            <div className="text-lg sm:text-xl font-semibold text-center">{segment.end.properties.name}</div>
          </a>
        );
      }
    });

    return (
      <div className="flex flex-col items-center space-y-4 sm:space-y-6">
        {elements}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 sm:space-y-4 mb-2 sm:mb-4">
        <input
          type="text"
          placeholder="Type artist 1..."
          value={artist1}
          onChange={(e) => setArtist1(e.target.value)}
          className="p-2 sm:p-3 border border-gray-400 rounded-md w-full"
        />
        <input
          type="text"
          placeholder="Type artist 2..."
          value={artist2}
          onChange={(e) => setArtist2(e.target.value)}
          className="p-2 sm:p-3 border border-gray-400 rounded-md w-full"
        />
        <button
          onClick={fetchPath}
          className="bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 disabled:opacity-50 w-full"
          disabled={loading}
        >
          {loading ? "Loading..." : "Find Connection"}
        </button>
        {error && <p className="text-red-600 text-sm sm:text-base">{error}</p>}
      </div>
      <div className="flex-1 overflow-y-auto pr-1 sm:pr-2">
        {renderPath()}
      </div>
    </div>
  );
}
