import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface LandingSettings {
  // Site
  site_name: string;
  site_description: string;
  // Hero
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_cta_link: string;
  hero_image: string;
  // About
  about_title: string;
  about_text: string;
  about_image: string;
  // Contact
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  // Social
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  whatsapp_url: string;
  youtube_url: string;
  // Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  // Features
  features_title: string;
  features_subtitle: string;
  // CTA
  cta_title: string;
  cta_text: string;
  cta_button_text: string;
  // SEO
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_image: string;
  // Maintenance
  maintenance_mode: string;
  maintenance_message: string;
}

const defaultSettings: LandingSettings = {
  site_name: '',
  site_description: '',
  hero_title: '',
  hero_subtitle: '',
  hero_cta_text: '',
  hero_cta_link: '',
  hero_image: '',
  about_title: '',
  about_text: '',
  about_image: '',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  facebook_url: '',
  instagram_url: '',
  tiktok_url: '',
  whatsapp_url: '',
  youtube_url: '',
  primary_color: '#3B82F6',
  secondary_color: '#10B981',
  accent_color: '#F59E0B',
  features_title: '',
  features_subtitle: '',
  cta_title: '',
  cta_text: '',
  cta_button_text: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  seo_image: '',
  maintenance_mode: 'false',
  maintenance_message: '',
};

export default function LandingPageSettings() {
  const [settings, setSettings] = useState<LandingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('hero');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/v1/admin/settings/landing');
      if (response.data.success) {
        setSettings({ ...defaultSettings, ...response.data.data });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof LandingSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await api.put('/v1/admin/settings/landing', settings);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès!' });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Erreur lors de l\'enregistrement' 
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'hero', label: 'Hero', icon: '🖼️' },
    { id: 'about', label: 'À propos', icon: '📝' },
    { id: 'contact', label: 'Contact', icon: '📞' },
    { id: 'social', label: 'Réseaux Sociaux', icon: '🔗' },
    { id: 'colors', label: 'Couleurs', icon: '🎨' },
    { id: 'features', label: 'Fonctionnalités', icon: '⚡' },
    { id: 'cta', label: 'CTA', icon: '👆' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres Landing Page</h1>
          <p className="text-gray-600">Configurez le contenu de votre page d'accueil</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {message && (
        <div className={`p-4 mb-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border p-6">
          {/* Hero Tab */}
          {activeTab === 'hero' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Section Hero</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre principal</label>
                <input
                  type="text"
                  value={settings.hero_title}
                  onChange={e => handleChange('hero_title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Bienvenue sur SISMA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
                <input
                  type="text"
                  value={settings.hero_subtitle}
                  onChange={e => handleChange('hero_subtitle', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Votre plateforme e-commerce de confiance"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Texte du bouton</label>
                  <input
                    type="text"
                    value={settings.hero_cta_text}
                    onChange={e => handleChange('hero_cta_text', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Découvrir"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lien du bouton</label>
                  <input
                    type="text"
                    value={settings.hero_cta_link}
                    onChange={e => handleChange('hero_cta_link', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="/shop"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'image</label>
                <input
                  type="text"
                  value={settings.hero_image}
                  onChange={e => handleChange('hero_image', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Section À propos</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={settings.about_title}
                  onChange={e => handleChange('about_title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte</label>
                <textarea
                  value={settings.about_text}
                  onChange={e => handleChange('about_text', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Image</label>
                <input
                  type="text"
                  value={settings.about_image}
                  onChange={e => handleChange('about_image', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Informations de contact</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  value={settings.contact_phone}
                  onChange={e => handleChange('contact_phone', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="+225 00 000 000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={e => handleChange('contact_email', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={settings.contact_address}
                  onChange={e => handleChange('contact_address', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Réseaux sociaux</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input
                  type="text"
                  value={settings.facebook_url}
                  onChange={e => handleChange('facebook_url', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input
                  type="text"
                  value={settings.instagram_url}
                  onChange={e => handleChange('instagram_url', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
                <input
                  type="text"
                  value={settings.tiktok_url}
                  onChange={e => handleChange('tiktok_url', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={settings.whatsapp_url}
                  onChange={e => handleChange('whatsapp_url', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://wa.me/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                <input
                  type="text"
                  value={settings.youtube_url}
                  onChange={e => handleChange('youtube_url', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Couleurs du site</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur primaire</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={e => handleChange('primary_color', e.target.value)}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={e => handleChange('primary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur secondaire</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={e => handleChange('secondary_color', e.target.value)}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={e => handleChange('secondary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur d'accent</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.accent_color}
                      onChange={e => handleChange('accent_color', e.target.value)}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.accent_color}
                      onChange={e => handleChange('accent_color', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Aperçu</h3>
                <div className="flex gap-4">
                  <div 
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: settings.primary_color }}
                  >
                    Primaire
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: settings.secondary_color }}
                  >
                    Secondaire
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: settings.accent_color }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Section Fonctionnalités</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={settings.features_title}
                  onChange={e => handleChange('features_title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
                <input
                  type="text"
                  value={settings.features_subtitle}
                  onChange={e => handleChange('features_subtitle', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* CTA Tab */}
          {activeTab === 'cta' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Bannière CTA</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={settings.cta_title}
                  onChange={e => handleChange('cta_title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte</label>
                <textarea
                  value={settings.cta_text}
                  onChange={e => handleChange('cta_text', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte du bouton</label>
                <input
                  type="text"
                  value={settings.cta_button_text}
                  onChange={e => handleChange('cta_button_text', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Référencement (SEO)</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre SEO</label>
                <input
                  type="text"
                  value={settings.seo_title}
                  onChange={e => handleChange('seo_title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea
                  value={settings.seo_description}
                  onChange={e => handleChange('seo_description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  maxLength={160}
                />
                <p className="text-sm text-gray-500 mt-1">{settings.seo_description.length}/160 caractères</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mots-clés (séparés par virgules)</label>
                <input
                  type="text"
                  value={settings.seo_keywords}
                  onChange={e => handleChange('seo_keywords', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e-commerce, achat en ligne, Côte d'Ivoire"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image OG (Open Graph)</label>
                <input
                  type="text"
                  value={settings.seo_image}
                  onChange={e => handleChange('seo_image', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Mode Maintenance</h2>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="maintenance_mode"
                    checked={settings.maintenance_mode === 'true'}
                    onChange={e => handleChange('maintenance_mode', e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 text-yellow-600"
                  />
                  <div>
                    <label htmlFor="maintenance_mode" className="font-medium text-yellow-800">
                      Activer le mode maintenance
                    </label>
                    <p className="text-sm text-yellow-700">
                      Les visiteurs verront un message de maintenance. Les admins peuvent toujours accéder au site.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message de maintenance</label>
                <textarea
                  value={settings.maintenance_message}
                  onChange={e => handleChange('maintenance_message', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Le site est en maintenance. Revenez bientôt!"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
