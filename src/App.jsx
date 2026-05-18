import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// Layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

// Sections homepage
import Hero from './components/Hero';
import CategorySection from './components/CategorySection';
import RecommendedTools from './components/RecommendedTools';
import DiscoveryOfDay from './components/DiscoveryOfDay';
import SubmitTool from './components/SubmitTool';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CategorySection />
        <RecommendedTools />
        <DiscoveryOfDay />
        <SubmitTool />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Chatbot />
    </BrowserRouter>
  );
}

export default App;
