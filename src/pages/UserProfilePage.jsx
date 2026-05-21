import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  User, 
  Gear, 
  SignOut, 
  PencilSimple, 
  CheckCircle,
  XCircle,
  EnvelopeSimple,
  MapPin,
  Phone,
  LinkSimple,
  Lock,
  Bell
} from '@phosphor-icons/react';
import './UserProfilePage.css';

export default function UserProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Aya',
    lastName: 'Ghammad',
    email: 'aya@exemple.com',
    phone: '+33 6 12 34 56 78',
    country: 'France',
    bio: 'Passionnée par les outils IA et l\'innovation',
    website: 'https://ayaghammad.com',
    notifications: true,
  });

  const [editForm, setEditForm] = useState(formData);

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm(formData);
  };

  const handleSave = () => {
    setFormData(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <>
      <Navbar isLoggedIn={true} />
      
      <main className="profile-main">
        {/* Hero Section */}
        <section className="profile-hero">
          <div className="profile-hero-inner">
            <h1 className="profile-title">Mon Profil</h1>
            <p className="profile-subtitle">Gérez vos informations personnelles</p>
          </div>
        </section>

        <div className="profile-content">
          {/* Sidebar Navigation */}
          <aside className="profile-sidebar">
            <nav className="profile-nav">
              <a href="/profile" className="profile-nav-item active">
                <User size={20} />
                <span>Informations Personnelles</span>
              </a>
              <a href="/profile/security" className="profile-nav-item">
                <Lock size={20} />
                <span>Sécurité</span>
              </a>
              <a href="/profile/notifications" className="profile-nav-item">
                <Bell size={20} />
                <span>Notifications</span>
              </a>
              <a href="/profile/preferences" className="profile-nav-item">
                <Gear size={20} />
                <span>Préférences</span>
              </a>
              <div className="profile-nav-divider"></div>
              <a href="/" className="profile-nav-item text-danger">
                <SignOut size={20} />
                <span>Déconnexion</span>
              </a>
            </nav>
          </aside>

          {/* Main Profile Content */}
          <div className="profile-main-content">
            {/* Profile Card */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-avatar">
                  <span>{formData.firstName.charAt(0)}{formData.lastName.charAt(0)}</span>
                </div>
                <div className="profile-header-info">
                  <h2>{formData.firstName} {formData.lastName}</h2>
                  <p className="profile-plan">Plan Pro • Membre depuis Janvier 2024</p>
                </div>
                {!isEditing && (
                  <button className="btn-edit" onClick={handleEdit}>
                    <PencilSimple size={18} />
                    Modifier
                  </button>
                )}
              </div>
            </div>

            {/* Information Sections */}
            {isEditing ? (
              <form className="profile-form">
                <div className="form-section">
                  <h3 className="form-section-title">Informations Personnelles</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">Prénom</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={editForm.firstName}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Nom</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={editForm.lastName}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Téléphone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="country">Pays</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={editForm.country}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Biographie</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={editForm.bio}
                      onChange={handleChange}
                      className="form-input"
                      rows="4"
                      placeholder="Parlez-nous de vous..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="website">Site Web</label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={editForm.website}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-save"
                    onClick={handleSave}
                  >
                    <CheckCircle size={18} />
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    className="btn btn-cancel"
                    onClick={handleCancel}
                  >
                    <XCircle size={18} />
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="profile-section">
                  <h3 className="section-title">Informations Personnelles</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">
                        <User size={16} />
                        Nom
                      </span>
                      <span className="info-value">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <EnvelopeSimple size={16} />
                        Email
                      </span>
                      <span className="info-value">{formData.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <Phone size={16} />
                        Téléphone
                      </span>
                      <span className="info-value">{formData.phone}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <MapPin size={16} />
                        Pays
                      </span>
                      <span className="info-value">{formData.country}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h3 className="section-title">À Propos</h3>
                  <p className="about-text">{formData.bio}</p>
                  {formData.website && (
                    <p className="website-link">
                      <LinkSimple size={16} />
                      <a href={formData.website} target="_blank" rel="noopener noreferrer">
                        {formData.website}
                      </a>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
