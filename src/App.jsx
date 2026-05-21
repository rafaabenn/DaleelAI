import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/index.css';

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
import ToolDetailsPage from './pages/ToolDetailsPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminProfilePage from './pages/AdminProfilePage';

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
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
        <Route path="/tool/:id" element={<ToolDetailsPage />} />
      </Routes>
      <Chatbot />
    </BrowserRouter>
  );
}

export default App;
