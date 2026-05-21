import '../styles/components/DiscoveryOfDay.css';

export default function DiscoveryOfDay() {
  return (
    <section className="discovery-section">
      <div className="section-inner">
        <div className="discovery-card">
          <div className="discovery-star">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#C9A84C" stroke="#C9A84C" strokeWidth="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className="discovery-content">
            <span className="discovery-label">DÃ‰COUVERTE DU JOUR</span>
            <h3 className="discovery-name">Perplexity AI</h3>
            <p className="discovery-desc">
              Un moteur de recherche IA qui cite ses sources. IdÃ©al pour la recherche acadÃ©mique.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
