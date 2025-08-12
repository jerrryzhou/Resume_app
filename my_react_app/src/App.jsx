import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';
import Page from './page.jsx'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />   {/* Your upload form */}
        <Route path="/page" element={<Page />} /> {/* Results page */}
      </Routes>
    </Router>
  );
}