import { useParams, useNavigate } from "react-router-dom";
import ArtistDisplay from "./components/ArtistDisplay";

export default function DuetGraph() {
  const { artist1, artist2 } = useParams();
  const navigate = useNavigate();

  const handleSearch = (a1, a2) => {
    navigate(`/${encodeURIComponent(a1)}/${encodeURIComponent(a2)}`);
  };

  return (
    <div className="h-screen">
      <div className="w-full bg-blue-900 text-white p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-6xl  font-bold text-center">DuetGraph</h1>
          <p className=" text-base text-center p-0 m-1">
            Like Six Degrees of Wikipedia, but for music.
          </p>
        </div>
        <div className="text-sm text-center mt-.5">
        <a href="https://deepertime.com" target="_blank" rel="noreferrer">
          Who made this?? 
        </a> | About | Source
        </div>
      </div>

      <div className="w-50 bg-blue-100 p-3 h-full flex-1 flex flex-col">
        <ArtistDisplay
          artist1={artist1 || ""}
          artist2={artist2 || ""}
          onSearch={handleSearch}
        />
      </div>
    </div>
  );
}
