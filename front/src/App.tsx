import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AppDetail from './pages/AppDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Quando a URL for apenas "/", carrega o Radar */}
        <Route path="/" element={<Home />} />
        
        {/* Quando a URL for "/app/alguma-coisa", carrega os Detalhes */}
        <Route path="/app/:appName" element={<AppDetail />} />
      </Routes>
    </BrowserRouter>
  );
}