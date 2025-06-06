import React from "react";
import ArtistDisplay from "./components/ArtistDisplay";

export default function DuetGraph() {
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
        <div className="text-sm">Who made this?? | Feedback</div>
      </div>

      {/* Right Interactive Section */}
      <div className="w-1/2 bg-blue-100 p-12">
        <ArtistDisplay />
      </div>
    </div>
  );
}