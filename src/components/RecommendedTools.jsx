import { recommendedTools } from '../data/tools';
import './RecommendedTools.css';

function StarIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#F5C842' : 'none'} stroke="#F5C842" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

import { Link } from 'react-router-dom';

export function ToolCard({ tool }) {
  return (
    <Link to={`/tool/${tool.id}`} className="tool-card" style={{ textDecoration: 'none' }}>
      <div className="tool-card-header">
        <div className="tool-avatar" style={{ backgroundColor: tool.avatarColor }}>
          {tool.avatar}
        </div>
        <div className="tool-header-right">
          {tool.isNew && <span className="tool-badge-new">Nouveau</span>}
          {tool.isTrending && <span className="tool-badge-trending">Populaire</span>}
          <div className="tool-rating">
            <StarIcon filled />
            <span>{tool.rating}</span>
          </div>
        </div>
      </div>
      <h3 className="tool-name">{tool.name}</h3>
      <p className="tool-description">{tool.description}</p>
      <div className="tool-tags">
        {tool.tags.map((tag) => (
          <span
            key={tag.label}
            className="tool-tag"
            style={{ backgroundColor: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}55` }}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </Link>
  );
}

export default function RecommendedTools({ title = "Outils recommandés" }) {
  return (
    <section className="recommended-section">
      <div className="section-inner">
        <div className="recommended-header">
          <h2 className="section-title">{title}</h2>
          <a href="#" className="see-all-link">
            Voir tout
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>
        <div className="tools-grid">
          {recommendedTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}
