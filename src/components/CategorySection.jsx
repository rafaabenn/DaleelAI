import { categories } from '../data/tools';
import { 
  Image as ImageIcon, 
  TextT, 
  VideoCamera, 
  Headphones, 
  CodeBlock, 
  Database 
} from '@phosphor-icons/react';
import './CategorySection.css';

const categoryIcons = {
  image: ImageIcon,
  texte: TextT,
  video: VideoCamera,
  audio: Headphones,
  code: CodeBlock,
  data: Database,
};

export default function CategorySection() {
  return (
    <section className="category-section">
      <div className="section-inner">
        <h2 className="section-title">Explorer par catégorie</h2>
        <div className="category-grid">
          {categories.map((cat) => {
            const IconComponent = categoryIcons[cat.id];
            
            return (
              <a href="#" key={cat.id} className="category-card">
                <div className="category-icon-wrapper" style={{ color: cat.color, backgroundColor: `${cat.color}15` }}>
                  <IconComponent size={32} weight="duotone" />
                </div>
                <span className="category-label">{cat.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
