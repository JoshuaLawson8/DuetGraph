import { useParams } from "react-router-dom";
import ArtistDisplay from "./components/ArtistDisplay.jsx";

export default function DuetGraph() {
  const { artist1, artist2 } = useParams();

  return (
    <div className="flex flex-col sm:flex-row min-h-screen">
      <div className="w-full sm:w-1/2 bg-blue-900 text-white p-6 sm:p-12 flex flex-col justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 sm:mb-8 text-center sm:text-left">DuetGraph</h1>
          <p className="mb-2 sm:mb-4 text-base sm:text-lg text-center sm:text-left">
            Discover how artists are connected through music.
          </p>
          <p className="mb-2 sm:mb-4 text-base sm:text-lg text-center sm:text-left">
            Explore collaboration chains.
          </p>
          <p className="mb-2 sm:mb-4 text-base sm:text-lg text-center sm:text-left">
            Visualize the path between two artists.
          </p>
        </div>
        <div className="text-sm text-center sm:text-left mt-4 sm:mt-0">
          Who made this?? | Feedback
        </div>
      </div>

      <div className="w-full sm:w-1/2 bg-blue-100 p-6 sm:p-12 flex-1 flex flex-col">
        <ArtistDisplay initialArtist1={artist1} initialArtist2={artist2} />
      </div>
    </div>
  );
}
