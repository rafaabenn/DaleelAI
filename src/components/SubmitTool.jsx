import {
  Robot,
  Brain,
  Gear,
  Image,
  Lightbulb,
  MagicWand,
  Sparkle,
  ArrowRight,
} from '@phosphor-icons/react';
import '../styles/components/SubmitTool.css';

const floatingIcons = [
  { top: '10%',  left: '3%',   Icon: Robot,     size: 44, opacity: 0.28 },
  { top: '75%',  left: '2%',   Icon: Brain,     size: 38, opacity: 0.22 },
  { top: '5%',   right: '4%',  Icon: Gear,      size: 40, opacity: 0.25 },
  { top: '80%',  right: '3%',  Icon: Image,     size: 42, opacity: 0.24 },
  { top: '45%',  left: '8%',   Icon: Lightbulb, size: 32, opacity: 0.2  },
  { top: '42%',  right: '8%',  Icon: MagicWand, size: 34, opacity: 0.2  },
  { top: '88%',  left: '30%',  Icon: Brain,     size: 28, opacity: 0.15 },
  { top: '5%',   left: '40%',  Icon: Sparkle,   size: 26, opacity: 0.15 },
];

export default function SubmitTool() {
  return (
    <section className="submit-section">
      <div className="submit-inner">
        {floatingIcons.map((ic, i) => (
          <span
            key={i}
            className="floating-icon"
            style={{
              top: ic.top,
              left: ic.left,
              right: ic.right,
              opacity: ic.opacity,
            }}
          >
            <ic.Icon size={ic.size} weight="duotone" />
          </span>
        ))}
        <div className="submit-content">
          <h2 className="submit-title">Submit a new Ai Tool ?</h2>
          <p className="submit-subtitle">
            Add a new feature to help others to achieve their needs !
          </p>
          <a href="#" className="submit-btn">
            Submit
            <ArrowRight size={18} weight="bold" />
          </a>
        </div>
      </div>
    </section>
  );
}
