import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home";
import { PodcastSearch } from "@/pages/PodcastSearch";
import { EpisodeSearch } from "@/pages/EpisodeSearch";
import { AllSearch } from "@/pages/AllSearch";
import { AuthorSearch } from "@/pages/AuthorSearch";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { SearchCacheProvider } from "@/contexts/SearchCacheContext";

export function App() {
  return (
    <SearchCacheProvider>
      <FavoritesProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/podcast" element={<PodcastSearch />} />
            <Route path="/episode" element={<EpisodeSearch />} />
            <Route path="/author" element={<AuthorSearch />} />
            <Route path="/all-search" element={<AllSearch />} />
          </Routes>
        </BrowserRouter>
      </FavoritesProvider>
    </SearchCacheProvider>
  );
}

export default App;