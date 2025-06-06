import React, { useState } from "react";
import ArtistDisplay from "./components/ArtistDisplay";

export default function DuetGraph() {
  const [artist1, setArtist1] = useState("");
  const [artist2, setArtist2] = useState("");
  const [path, setPath] = useState([]);

  const fetchPath = async () => {
    const response = await fetch(`/api/path?from=${artist1}&to=${artist2}`);
    const data = await response.json();
    setPath(data.path);
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-1/2 bg-blue-900 text-white p-12 flex flex-col justify-between">
        <div>
          <h1 className="text-5xl font-bold mb-8">DuetGraph</h1>
          <p className="mb-4 text-lg">Discover how artists are connected through music.</p>
          <p className="mb-4 text-lg">Explore collaboration chains.</p>
          <p className="mb-4 text-lg">Visualize the path between two artists.</p>
        </div>
        <div className="text-sm">About Me - Mikey</div>
      </div>

      {/* Right Interactive Section */}
      <div className="w-1/2 bg-blue-100 p-12">
        <div className="flex flex-col space-y-4 mb-8">
          <input
            type="text"
            placeholder="Type artist 1..."
            value={artist1}
            onChange={(e) => setArtist1(e.target.value)}
            className="p-3 border border-gray-400 rounded-md"
          />
          <input
            type="text"
            placeholder="Type artist 2..."
            value={artist2}
            onChange={(e) => setArtist2(e.target.value)}
            className="p-3 border border-gray-400 rounded-md"
          />
          <button
            onClick={fetchPath}
            className="bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800"
          >
            Find Connection
          </button>
        </div>

        {/* Dynamic artist connection list */}
        <div className="space-y-4">
          <ArtistDisplay path={path} />
        </div>
      </div>
    </div>
  );
}
