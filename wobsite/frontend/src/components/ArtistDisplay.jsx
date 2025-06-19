import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function ArtistDisplay({ artist1 = "", artist2 = "" }) {
  const [input1, setInput1] = useState(artist1);
  const [input2, setInput2] = useState(artist2);
  const [suggestions1, setSuggestions1] = useState([]);
  const [suggestions2, setSuggestions2] = useState([]);
  const innerTimeoutRef1 = useRef();
  const innerTimeoutRef2 = useRef();
  const [pathData, setPathData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [songIndices, setSongIndices] = useState({});
  const navigate = useNavigate();

  const input1Ref = useRef();
  const input2Ref = useRef();

  const fetchPath = useCallback(async (a1, a2) => {
    if (!a1.trim() || !a2.trim()) {
      setError("Both artist names are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/namePath/${encodeURIComponent(a1)}/${encodeURIComponent(a2)}`);
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
  }, []);

  useEffect(() => {
    if (artist1 && artist2) {
      setInput1(artist1);
      setInput2(artist2);
      fetchPath(artist1, artist2);
    }
  }, [artist1, artist2, fetchPath]);

useEffect(() => {
  const outerTimeout = setTimeout(() => {
    if (input1.trim() && document.activeElement === input1Ref.current.querySelector('input')) {
      fetchSuggestions(input1, setSuggestions1);
      if (innerTimeoutRef1.current) {
        clearTimeout(innerTimeoutRef1.current);
      }
      innerTimeoutRef1.current = setTimeout(() => {
        if (document.activeElement === input1Ref.current.querySelector('input')) {
          fetchSuggestions(input1, setSuggestions1);
        }
      }, 3000);
    }
  }, 500);
  return () => {
    clearTimeout(outerTimeout);
    if (innerTimeoutRef1.current) {
      clearTimeout(innerTimeoutRef1.current);
    }
  };
}, [input1]);

  useEffect(() => {
    const outerTimeout = setTimeout(() => {
      if (input2.trim() && document.activeElement === input2Ref.current.querySelector('input')) {
        fetchSuggestions(input2, setSuggestions2);
        if (innerTimeoutRef2.current) clearTimeout(innerTimeoutRef2.current);
        innerTimeoutRef2.current = setTimeout(() => {
          if (document.activeElement === input2Ref.current.querySelector('input')) {
            fetchSuggestions(input2, setSuggestions2);
          }
        }, 3000);
      }
    }, 500);
    return () => {
      clearTimeout(outerTimeout);
      if (innerTimeoutRef2.current) clearTimeout(innerTimeoutRef2.current);
    };
  }, [input2]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (input1Ref.current && !input1Ref.current.contains(e.target)) {
        setSuggestions1([]);
      }
      if (input2Ref.current && !input2Ref.current.contains(e.target)) {
        setSuggestions2([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (name, setter) => {
    try {
      const res = await fetch(`/api/search/${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      const data = await res.json();
      setter(data);
    } catch (err) {
      console.error("Suggestion fetch error", err);
      setter([]);
    }
  };

  const handleSearch = () => {
    if(!input1 || !input2)
      return
    navigate(`/${encodeURIComponent(input1)}/${encodeURIComponent(input2)}`);
  };

  const getImageSrc = (image) => {
    if (image === "") {
      return require("../resources/icegif-loading.gif");
    }
    if (image === " ") {
      return require("../resources/putidevil-miku-questionmark.jpg");
    }
    return image;
  };

  const renderSuggestions = (suggestions, setter, clearSuggestions) => (
    <div className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 shadow max-h-48 overflow-y-auto w-full">
      {suggestions.map((s) => (
        <div key={s.spotifyId} onClick={() => { setter(s.name); clearSuggestions(); }} className="p-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2">
          <img src={getImageSrc(s.image)} alt={s.name} className="w-8 h-8 rounded object-cover" />
          <span className="truncate">{s.name}</span>
        </div>
      ))}
    </div>
  );

  const changeSong = (key, direction, length) => {
    setSongIndices(prev => {
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

      const artistImage = (image) => (image === "" || image === " ") ? require('../resources/putidevil-miku-questionmark.jpg') : image;
      const spotifyLink = (id) => `https://open.spotify.com/artist/${id}`;

      elements.push(
        <a key={`artist-${index}-start`} href={spotifyLink(segment.start.properties.spotifyId)} target="_blank" rel="noopener noreferrer"
          className="bg-white p-2 sm:p-4 rounded-lg shadow flex flex-col items-center w-full sm:max-w-xs hover:opacity-90 transition">
          <img src={artistImage(segment.start.properties.image)} alt={segment.start.properties.name} className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-lg mb-2" />
          <div className="text-lg sm:text-xl font-semibold text-center">{segment.start.properties.name}</div>
        </a>
      );

      elements.push(
        <a key={`song-${index}`} href={`${currentUri ? `https://open.spotify.com/track/${currentUri.split(":")[2]}` : ""}`} target="_blank" rel="noopener noreferrer"
          className="bg-gray-100 p-2 sm:p-4 rounded-lg shadow w-full sm:max-w-lg flex items-center justify-between cursor-pointer hover:bg-gray-200">
          <button onClick={(e) => { e.stopPropagation(); changeSong(key, -1, songNames.length); }}
            className={`text-xl font-bold ${songIndex === 0 ? 'text-gray-400' : ''}`}
            disabled={songIndex === 0}>◀</button>
          <div className="flex items-center space-x-2 sm:space-x-4 w-3/4 truncate">
            <img src={currentImage} alt="song" className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded" />
            <div className="text-left truncate">
              <div className="font-medium text-base sm:text-lg truncate">{currentSong}</div>
              <div className="text-xs sm:text-sm text-gray-600 truncate">{segment.start.properties.name}, {segment.end.properties.name}</div>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); changeSong(key, 1, songNames.length); }}
            className={`text-xl font-bold ${songIndex === songNames.length - 1 ? 'text-gray-400' : ''}`}
            disabled={songIndex === songNames.length - 1}>▶</button>
        </a>
      );

      if (index === segments.length - 1) {
        elements.push(
          <a key={`artist-${index}-end`} href={spotifyLink(segment.end.properties.spotifyId)} target="_blank" rel="noopener noreferrer"
            className="bg-white p-2 sm:p-4 rounded-lg shadow flex flex-col items-center w-full sm:max-w-xs hover:opacity-90 transition">
            <img src={artistImage(segment.end.properties.image)} alt={segment.end.properties.name} className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-lg mb-2" />
            <div className="text-lg sm:text-xl font-semibold text-center">{segment.end.properties.name}</div>
          </a>
        );
      }
    });

    return <div className="flex flex-col items-center space-y-4 sm:space-y-6">{elements}</div>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 sm:space-y-4 mb-2 sm:mb-4 relative">
        <div ref={input1Ref} className="relative">
          <input type="text" placeholder="Type artist 1..." value={input1} onChange={(e) => setInput1(e.target.value)}
            className="p-2 sm:p-3 border border-gray-400 rounded-md w-full" />
          {suggestions1.length > 0 && renderSuggestions(suggestions1, setInput1, () => setSuggestions1([]))}
        </div>
        <div ref={input2Ref} className="relative">
          <input type="text" placeholder="Type artist 2..." value={input2} onChange={(e) => setInput2(e.target.value)}
            className="p-2 sm:p-3 border border-gray-400 rounded-md w-full" />
          {suggestions2.length > 0 && renderSuggestions(suggestions2, setInput2, () => setSuggestions2([]))}
        </div>
        <button onClick={handleSearch} className="bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 disabled:opacity-50 w-full"
          disabled={loading}>
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
