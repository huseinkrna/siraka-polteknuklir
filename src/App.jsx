import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Home from './pages/Home';
import HistoryTour from './pages/HistoryTour';
import Simulator from './pages/Simulator';
import Gallery from './pages/Gallery';
import Model3D from './pages/Model3D';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tour" element={<HistoryTour />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/model3d" element={<Model3D />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;