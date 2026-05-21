import { useState, useRef, useEffect } from 'react';
import { Robot, X, PaperPlaneRight } from '@phosphor-icons/react';
import '../styles/components/Chatbot.css';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Bonjour ! ðŸ‘‹ Comment puis-je vous aider Ã  trouver le meilleur outil IA aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');

    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'bot', text: "Je suis une version de dÃ©monstration, mais bientÃ´t je pourrai vous conseiller les meilleurs outils selon vos besoins !" }
      ]);
    }, 1000);
  };

  return (
    <div className="chatbot-container">
      {/* FenÃªtre de chat */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">
              <Robot size={20} weight="fill" />
            </div>
            <span>Assistant Daleel AI</span>
          </div>
          <button className="chatbot-close" onClick={() => setIsOpen(false)}>
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.sender}`}>
              <div className="chat-bubble">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input-area" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Posez votre question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="chatbot-send" disabled={!input.trim()}>
            <PaperPlaneRight size={20} weight="fill" />
          </button>
        </form>
      </div>

      {/* Bouton flottant */}
      <button 
        className={`chatbot-toggle ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Ouvrir le chat"
      >
        <Robot size={28} weight="duotone" />
      </button>
    </div>
  );
}
