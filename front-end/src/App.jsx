import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import './index.css';

import Navbar from './components/Navbar';
import ChatbotWindow from './components/ChatbotWindow';
import FreeTrialPopup from './components/FreeTrialPopup';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

import { api } from './services/api';

function App() {
    const getPageFromHash = () => {
        const hash = window.location.hash.replace('#', '').toLowerCase();
        const validPages = ['home', 'login', 'register', 'dashboard', 'admin'];
        return validPages.includes(hash) ? hash : 'home';
    };

    const [page, setPageState] = useState(getPageFromHash());
    const [user, setUser] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [chatbotOpen, setChatbotOpen] = useState(false);
    const [trialTool, setTrialTool] = useState(null);

    const setPage = (target) => {
        const normalized = target ? target.toLowerCase() : 'home';
        const validPages = ['home', 'login', 'register', 'dashboard', 'admin'];
        const nextPage = validPages.includes(normalized) ? normalized : 'home';
        window.location.hash = nextPage;
        setPageState(nextPage);
    };

    // React to hash changes for direct navigation
    useEffect(() => {
        const handleHashChange = () => {
            setPageState(getPageFromHash());
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Restore session from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('daleel_ai_user');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
            } catch (e) {
                localStorage.removeItem('daleel_ai_user');
                localStorage.removeItem('daleel_ai_token');
            }
        }
    }, []);

    // Load favorites when user changes
    useEffect(() => {
        if (user) {
            loadFavorites();
        } else {
            setFavorites([]);
        }
    }, [user]);

    const loadFavorites = async () => {
        try {
            const res = await api.tools.getFavorites();
            if (res.success && res.tools) {
                setFavorites(res.tools.map(t => t.id));
            }
        } catch (err) {
            console.error("Erreur chargement favoris:", err);
        }
    };

    const handleToggleFav = async (toolId) => {
        if (!user) return;
        try {
            await api.tools.toggleFavorite(toolId);
            setFavorites(prev =>
                prev.includes(toolId)
                    ? prev.filter(id => id !== toolId)
                    : [...prev, toolId]
            );
        } catch (err) {
            console.error("Erreur toggle favori:", err);
        }
    };

    const handleAuthSuccess = (userData) => {
        setUser(userData);
        setPage('home');
    };

    const handleLogout = () => {
        localStorage.removeItem('daleel_ai_token');
        localStorage.removeItem('daleel_ai_user');
        setUser(null);
        setFavorites([]);
        setChatbotOpen(false);
        setPage('home');
    };

    const handleOpenTrial = (tool) => {
        setTrialTool(tool);
    };

    const handleSelectToolFromChat = (toolId) => {
        setChatbotOpen(false);
        setPage('home');
    };

    // Render the current page
    const renderPage = () => {
        switch (page) {
            case 'login':
                return <Login onAuthSuccess={handleAuthSuccess} setPage={setPage} />;
            case 'register':
                return <Register onAuthSuccess={handleAuthSuccess} setPage={setPage} />;
            case 'dashboard':
                if (!user) { setPage('login'); return null; }
                return (
                    <UserDashboard
                        user={user}
                        favorites={favorites}
                        onToggleFav={handleToggleFav}
                        setPage={setPage}
                        onOpenTrial={handleOpenTrial}
                    />
                );
            case 'admin':
                if (!user || user.role_id !== 1) { setPage('home'); return null; }
                return <AdminDashboard user={user} />;
            case 'home':
            default:
                return (
                    <Home
                        user={user}
                        onOpenTrial={handleOpenTrial}
                        favorites={favorites}
                        onToggleFav={handleToggleFav}
                    />
                );
        }
    };

    return (
        <div className="app-container">
            <div className="gradient-bg-secondary"></div>

            {/* Floating Navbar */}
            <Navbar
                user={user}
                onLogout={handleLogout}
                setPage={setPage}
            />

            {/* Main Content */}
            <main className="main-content">
                {renderPage()}
            </main>

            {/* Footer */}
            <footer style={{
                textAlign: 'center',
                padding: '24px 20px',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                color: '#6b7280',
                fontSize: '0.78rem',
                background: 'rgba(8, 9, 15, 0.95)'
            }}>
                <span>© 2026 </span>
                <strong style={{ color: '#a78bfa' }}>Daleel AI</strong>
                <span> — Portail Académique de Référencement d'Outils d'Intelligence Artificielle</span>
            </footer>

            {/* ── Floating Chatbot (Registered users only) ── */}
            {user && (
                <>
                    {!chatbotOpen && (
                        <button
                            className="chatbot-trigger"
                            onClick={() => setChatbotOpen(true)}
                            title="Ouvrir l'Assistant Daleel AI"
                        >
                            <MessageCircle size={26} />
                        </button>
                    )}
                    {chatbotOpen && (
                        <ChatbotWindow
                            user={user}
                            onClose={() => setChatbotOpen(false)}
                            onSelectTool={handleSelectToolFromChat}
                        />
                    )}
                </>
            )}

            {/* ── Free Trial Popup Overlay ── */}
            {trialTool && (
                <FreeTrialPopup
                    tool={trialTool}
                    onClose={() => setTrialTool(null)}
                    user={user}
                />
            )}
        </div>
    );
}

export default App;
