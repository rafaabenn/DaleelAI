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
  Phone,
  ShieldCheck,
  Warning,
  Wrench,
  Users,
  MagnifyingGlass
} from '@phosphor-icons/react';
import '../styles/pages/AdminProfilePage.css';

export default function AdminProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [adminData, setAdminData] = useState({
    firstName: 'Admin',
    lastName: 'Manager',
    email: 'admin@exemple.com',
    phone: '+33 6 87 65 43 21',
    role: 'Super Administrateur',
    permissions: ['Gestion des outils', 'Gestion des utilisateurs', 'ParamÃ¨tres systÃ¨me', 'ModÃ©ration'],
    joinDate: 'Janvier 2023',
    totalUsers: 1250,
    totalTools: 342,
    pendingApprovals: 15
  });

  const [editForm, setEditForm] = useState(adminData);

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm(adminData);
  };

  const handleSave = () => {
    setAdminData(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  return (
    <>
      <Navbar isLoggedIn={true} isAdmin={true} />
      
      <main className="admin-profile-main">
        {/* Sidebar */}
        <aside className="admin-profile-sidebar">
          <div className="admin-brand">
            <Wrench size={28} weight="fill" color="var(--primary)" />
            <h2>Admin Panel</h2>
          </div>

          <nav className="admin-profile-nav">
            <a href="/admin/dashboard" className="admin-profile-nav-item">
              <User size={20} />
              <span>Tableau de bord</span>
            </a>
            <a href="/admin/tools" className="admin-profile-nav-item">
              <Wrench size={20} />
              <span>Gestion des Outils</span>
            </a>
            <a href="/admin/users" className="admin-profile-nav-item">
              <Users size={20} />
              <span>Utilisateurs</span>
            </a>
            <a href="/admin/profile" className="admin-profile-nav-item active">
              <ShieldCheck size={20} />
              <span>Mon Profil</span>
            </a>
            <a href="/admin/settings" className="admin-profile-nav-item">
              <Gear size={20} />
              <span>ParamÃ¨tres</span>
            </a>
            <div className="admin-profile-nav-divider"></div>
            <a href="/" className="admin-profile-nav-item text-danger">
              <SignOut size={20} />
              <span>Retour au site</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="admin-profile-content">
          <header className="admin-profile-header">
            <div>
              <h1 className="admin-profile-title">Profil Administrateur</h1>
              <p className="admin-profile-subtitle">GÃ©rez votre compte administrateur</p>
            </div>
            {!isEditing && (
              <button className="btn-edit-profile" onClick={handleEdit}>
                <PencilSimple size={18} />
                Modifier le profil
              </button>
            )}
          </header>

          {/* Profile Card */}
          <div className="admin-profile-card">
            <div className="admin-card-header">
              <div className="admin-avatar">
                <span>{adminData.firstName.charAt(0)}{adminData.lastName.charAt(0)}</span>
              </div>
              <div className="admin-card-info">
                <h2>{adminData.firstName} {adminData.lastName}</h2>
                <p className="admin-role">{adminData.role}</p>
                <p className="admin-member-since">Membre depuis {adminData.joinDate}</p>
              </div>
              <div className="admin-badge-container">
                <div className="admin-badge admin-badge-super">
                  <ShieldCheck size={16} weight="fill" />
                  Super Admin
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="admin-stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Utilisateurs Totaux</p>
                <p className="stat-value">{adminData.totalUsers}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Wrench size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Outils en Base</p>
                <p className="stat-value">{adminData.totalTools}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-warning">
                <Warning size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Approbations en Attente</p>
                <p className="stat-value">{adminData.pendingApprovals}</p>
              </div>
            </div>
          </div>

          {/* Information Section */}
          {isEditing ? (
            <form className="admin-profile-form">
              <div className="form-section">
                <h3 className="form-section-title">Informations de Compte</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">PrÃ©nom</label>
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
                  <label htmlFor="phone">TÃ©lÃ©phone</label>
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
                  <label htmlFor="role">RÃ´le</label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={editForm.role}
                    onChange={handleChange}
                    className="form-input"
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                  <small style={{ color: '#7a7060' }}>Le rÃ´le ne peut pas Ãªtre modifiÃ©</small>
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
              <div className="admin-info-section">
                <h3 className="section-title">Informations de Compte</h3>
                <div className="admin-info-grid">
                  <div className="admin-info-item">
                    <span className="admin-info-label">
                      <User size={16} />
                      Nom Complet
                    </span>
                    <span className="admin-info-value">{adminData.firstName} {adminData.lastName}</span>
                  </div>
                  <div className="admin-info-item">
                    <span className="admin-info-label">
                      <EnvelopeSimple size={16} />
                      Email
                    </span>
                    <span className="admin-info-value">{adminData.email}</span>
                  </div>
                  <div className="admin-info-item">
                    <span className="admin-info-label">
                      <Phone size={16} />
                      TÃ©lÃ©phone
                    </span>
                    <span className="admin-info-value">{adminData.phone}</span>
                  </div>
                  <div className="admin-info-item">
                    <span className="admin-info-label">
                      <ShieldCheck size={16} />
                      RÃ´le
                    </span>
                    <span className="admin-info-value">{adminData.role}</span>
                  </div>
                </div>
              </div>

              <div className="admin-permissions-section">
                <h3 className="section-title">Permissions</h3>
                <div className="permissions-list">
                  {adminData.permissions.map((permission, index) => (
                    <div key={index} className="permission-item">
                      <ShieldCheck size={16} weight="fill" />
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Security Alert */}
          <div className="security-alert">
            <div className="alert-icon">
              <ShieldCheck size={20} weight="fill" />
            </div>
            <div className="alert-content">
              <h4>SÃ©curitÃ© de Compte</h4>
              <p>Authentification Ã  deux facteurs: <strong>ActivÃ©e</strong></p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
