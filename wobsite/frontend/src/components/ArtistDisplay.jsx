import React from "react";

export default function ArtistDisplay({ path }) {
  if (!path || path.length === 0) {
    return <p className="text-gray-500">No connection found yet. Try searching!</p>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {path.map((step, index) => (
        <div
          key={index}
          className="flex flex-col items-center bg-white shadow-md p-4 rounded-lg w-full sm:w-auto"
        >
          <div className="font-bold text-lg text-blue-800 mb-2">{step.artist}</div>
          <div className="text-sm text-gray-700">
            {step.songs && step.songs.length > 0 ? (
              <ul className="list-disc pl-4">
                {step.songs.map((song, i) => (
                  <li key={i}>{song}</li>
                ))}
              </ul>
            ) : (
              <p>No songs listed</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
