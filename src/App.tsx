import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home";
import { PodcastSearch } from "@/pages/PodcastSearch";
import { EpisodeSearch } from "@/pages/EpisodeSearch";
import { AllSearch } from "@/pages/AllSearch";
import { AuthorSearch } from "@/pages/AuthorSearch";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/podcast" element={<PodcastSearch />} />
        <Route path="/episode" element={<EpisodeSearch />} />
        <Route path="/author" element={<AuthorSearch />} />
        <Route path="/all-search" element={<AllSearch />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;