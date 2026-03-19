import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell,
  ChevronRight,
  Loader2,
  LogOut,
  Package,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/ClientAuthContext";
import { PageLoader } from "@/components/Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { clearSignupPrefill, getSignupPrefill, saveCustomerProfile } from "@/lib/customerProfile";
import {
  getMemberProfile,
  getNotificationPreferences,
  hasPostOrderSignal,
  saveMemberProfile,
  updateNotificationPreference,
  type NotificationPreferences,
} from "@/lib/client-account";

interface ProfileFormState {
  name: string;
  email: string;
  phone: string;
  commune: string;
  quartier: string;
  repere: string;
  customerLocation: string;
}

const defaultProfileState: ProfileFormState = {
  name: "",
  email: "",
  phone: "",
  commune: "",
  quartier: "",
  repere: "",
  customerLocation: "",
};

function buildProfileState(base?: Partial<ProfileFormState> | null): ProfileFormState {
  return {
    ...defaultProfileState,
    ...base,
  };
}

export default function Account() {
  const { user, token, loading, login, register, logout } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const searchString = typeof window !== "undefined" ? window.location.search : "";
  const query = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const initialMode = query.get("mode") === "register" ? "register" : "login";
  const redirect = query.get("redirect") || "/orders?welcome=1";

  const memberProfile = useMemo(() => getMemberProfile(), [token, user?.id, location]);
  const signupPrefill = useMemo(() => getSignupPrefill(), [location]);

  const [tab, setTab] = useState<"login" | "register">(initialMode);
  const [loginEmail, setLoginEmail] = useState(query.get("email") || signupPrefill?.email || memberProfile?.email || "");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerForm, setRegisterForm] = useState<ProfileFormState>(() =>
    buildProfileState({
      name: query.get("name") || signupPrefill?.name || memberProfile?.name || "",
      email: query.get("email") || signupPrefill?.email || memberProfile?.email || "",
      phone: query.get("phone") || signupPrefill?.phone || memberProfile?.phone || "",
      commune: memberProfile?.commune || "",
      quartier: memberProfile?.quartier || "",
      repere: memberProfile?.repere || "",
      customerLocation: memberProfile?.customerLocation || "",
    }),
  );
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() =>
    buildProfileState({
      name: memberProfile?.name || user?.name || "",
      email: memberProfile?.email || user?.email || "",
      phone: memberProfile?.phone || user?.phone || "",
      commune: memberProfile?.commune || "",
      quartier: memberProfile?.quartier || "",
      repere: memberProfile?.repere || "",
      customerLocation: memberProfile?.customerLocation || "",
    }),
  );
  const [notifications, setNotifications] = useState<NotificationPreferences>(getNotificationPreferences());
  const [submitting, setSubmitting] = useState<"login" | "register" | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setTab(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const nextProfile = buildProfileState({
      name: memberProfile?.name || user?.name || "",
      email: memberProfile?.email || user?.email || "",
      phone: memberProfile?.phone || user?.phone || "",
      commune: memberProfile?.commune || "",
      quartier: memberProfile?.quartier || "",
      repere: memberProfile?.repere || "",
      customerLocation: memberProfile?.customerLocation || "",
    });
    setProfileForm(nextProfile);
  }, [memberProfile, user]);

  if (loading) {
    return <PageLoader text="Chargement de votre espace client..." />;
  }

  const updateForm = (
    setter: Dispatch<SetStateAction<ProfileFormState>>,
    key: keyof ProfileFormState,
    value: string,
  ) => {
    setter((current) => ({ ...current, [key]: value }));
  };

  const persistProfile = (form: ProfileFormState) => {
    const nextProfile = {
      userId: user?.id ?? memberProfile?.userId ?? null,
      name: form.name,
      email: form.email || null,
      phone: form.phone,
      commune: form.commune || null,
      quartier: form.quartier || null,
      repere: form.repere || null,
      customerLocation: form.customerLocation || null,
    };

    if (form.phone) {
      saveCustomerProfile({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        commune: form.commune || null,
        quartier: form.quartier || null,
        repere: form.repere || null,
        customerLocation: form.customerLocation || null,
      });
    }

    saveMemberProfile(nextProfile);
    return nextProfile;
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting("login");
    setAuthError(null);

    const { error } = await login(loginEmail, loginPassword);
    setSubmitting(null);

    if (error) {
      setAuthError(error.message);
      return;
    }

    toast({
      title: "Connexion réussie",
      description: "Votre compte SISMA est prêt pour le suivi et la commande rapide.",
    });
    setLocation(redirect);
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting("register");
    setAuthError(null);

    const { error } = await register({
      name: registerForm.name,
      email: registerForm.email,
      phone: registerForm.phone,
      password: registerPassword,
      password_confirmation: registerPassword,
    });
    setSubmitting(null);

    if (error) {
      setAuthError(error.message);
      return;
    }

    persistProfile(registerForm);
    clearSignupPrefill();
    toast({
      title: "Compte créé",
      description: "Vos informations sont sauvegardées pour le suivi, les notifications et la commande rapide.",
    });
    setLocation(redirect);
  };

  const handleProfileSave = (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    persistProfile(profileForm);
    setSavingProfile(false);
    toast({
      title: "Profil mis à jour",
      description: "Vos prochaines commandes pourront être pré-remplies automatiquement.",
    });
  };

  const togglePreference = (key: keyof NotificationPreferences, value: boolean) => {
    updateNotificationPreference(key, value);
    setNotifications((current) => ({ ...current, [key]: value }));
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Déconnexion effectuée",
      description: "Vous pourrez revenir quand vous voulez pour retrouver vos commandes.",
    });
    setLocation("/");
  };

  if (user && token) {
    return (
      <div className="min-h-screen bg-gray-50 pt-14 sm:pt-16 pb-12">
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-3 max-w-5xl py-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/" className="hover:text-red-600">
                Accueil
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-800 font-medium">Mon compte</span>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bonjour {user.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Votre espace SISMA centralise le suivi des commandes, les notifications et le checkout express.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f57224] text-white font-semibold hover:bg-[#e56614] transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Mes commandes
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-red-200 hover:text-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 max-w-5xl py-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                icon: Package,
                title: "Suivi centralisé",
                text: "Retrouvez vos commandes invitées et connectées au même endroit.",
              },
              {
                icon: Bell,
                title: "Notifications",
                text: "Recevez les alertes de validation, livraison et bons plans membres.",
              },
              {
                icon: Zap,
                title: "Commande rapide",
                text: "Nom, téléphone et adresse restent prêts pour vos prochains achats.",
              },
              {
                icon: Sparkles,
                title: "Avantages membres",
                text: "Débloquez des sélections moins chères et des recommandations personnalisées.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#f57224]" />
                </div>
                <h2 className="font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500 mt-1">{text}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
            <form onSubmit={handleProfileSave} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Informations sauvegardées</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Ces données servent au pré-remplissage de vos commandes rapides.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-gray-600">
                  Nom complet
                  <input
                    value={profileForm.name}
                    onChange={(event) => updateForm(setProfileForm, "name", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#f57224] focus:outline-none focus:ring-2 focus:ring-[#f57224]/20"
                    required
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Téléphone
                  <input
                    value={profileForm.phone}
                    onChange={(event) => updateForm(setProfileForm, "phone", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#f57224] focus:outline-none focus:ring-2 focus:ring-[#f57224]/20"
                    required
                  />
                </label>
                <label className="text-sm text-gray-600 sm:col-span-2">
                  Email
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => updateForm(setProfileForm, "email", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#f57224] focus:outline-none focus:ring-2 focus:ring-[#f57224]/20"
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Commune
                  <input
                    value={profileForm.commune}
                    onChange={(event) => updateForm(setProfileForm, "commune", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#f57224] focus:outline-none focus:ring-2 focus:ring-[#f57224]/20"
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Quartier
                  <input
                    value={profileForm.quartier}
                    onChange={(event) => updateForm(setProfileForm, "quartier", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#f57224] focus:outline-none focus:ring-2 focus:ring-[#f57224]/20"
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Repère
                  <input
                    value={profileForm.repere}
                    onChange={(event) => updateForm(setProfileForm, "repere", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#f57224] focus:outline-none focus:ring-2 focus:ring-[#f57224]/20"
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Lieu détaillé
                  <input
                    value={profileForm.customerLocation}
                    onChange={(event) => updateForm(setProfileForm, "customerLocation", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#f57224] focus:outline-none focus:ring-2 focus:ring-[#f57224]/20"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f57224] text-white font-semibold hover:bg-[#e56614] transition-colors disabled:opacity-60"
              >
                {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                Sauvegarder mon profil
              </button>
            </form>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-[#f57224]" />
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      key: "orderUpdates" as const,
                      title: "Suivi des commandes",
                      text: "Validation, préparation, livraison et retour.",
                    },
                    {
                      key: "promotions" as const,
                      title: "Produits moins chers",
                      text: "Recevoir les baisses de prix et les offres membres.",
                    },
                    {
                      key: "recommendations" as const,
                      title: "Recommandations personnalisées",
                      text: "Sélections adaptées à vos vues et commandes récentes.",
                    },
                  ].map((item) => (
                    <div key={item.key} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.text}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key]}
                        onCheckedChange={(checked) => togglePreference(item.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-[#f57224]" />
                  <h2 className="text-lg font-semibold text-gray-900">Compte optimisé conversion</h2>
                </div>
                <p className="text-sm text-gray-600">
                  SISMA laisse commander sans friction, puis transforme l’expérience en fidélité grâce au suivi, au
                  remplissage automatique et aux recommandations utiles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pt-14 sm:pt-16 pb-12">
      <div className="bg-surface-container-low border-b border-outline-variant/20">
        <div className="container mx-auto px-3 max-w-4xl py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-red-600">
              Accueil
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-800 font-medium">Compte client</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Compte SISMA</h1>
          <p className="text-sm text-gray-500 mt-1">
            Commandez sans compte d’abord, puis créez votre espace quand vous voulez pour débloquer le suivi et la
            commande rapide.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-3 max-w-4xl py-6 space-y-4">
        {hasPostOrderSignal() && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-white/80 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-[#f57224]" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Votre première commande est déjà passée</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Créez votre compte maintenant pour rattacher vos informations, suivre plus facilement vos commandes
                  et recevoir les offres membres.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-[1fr_1fr] items-start">
          {/* Auth Forms */}
          <div className="bg-surface-container-lowest p-8 md:p-12 rounded-2xl shadow-[0_10px_40px_rgba(28,27,27,0.06)]">
            <Tabs value={tab} onValueChange={(value) => setTab(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 bg-surface-container-high rounded-xl p-1">
                <TabsTrigger 
                  value="login"
                  className="rounded-lg font-bold text-sm data-[state=active]:bg-[#D81918] data-[state=active]:text-white transition-all"
                >
                  Connexion
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="rounded-lg font-bold text-sm data-[state=active]:bg-[#D81918] data-[state=active]:text-white transition-all"
                >
                  Créer un compte
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-8">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      className="w-full bg-surface-container-high border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all text-on-surface"
                      placeholder="jean@exemple.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Mot de passe</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      className="w-full bg-surface-container-high border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all text-on-surface"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting === "login"}
                    className="w-full bg-gradient-to-r from-[#D81918] to-[#d81918] text-white font-bold py-4 rounded-full text-base shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting === "login" && <Loader2 className="w-5 h-5 animate-spin" />}
                    Se connecter
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-8">
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Nom complet</label>
                      <input
                        value={registerForm.name}
                        onChange={(event) => updateForm(setRegisterForm, "name", event.target.value)}
                        className="w-full bg-surface-container-high border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all text-on-surface"
                        placeholder="Jean Dupont"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Téléphone</label>
                      <input
                        value={registerForm.phone}
                        onChange={(event) => updateForm(setRegisterForm, "phone", event.target.value)}
                        className="w-full bg-surface-container-high border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all text-on-surface"
                        placeholder="+225 00 00 00 00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Email</label>
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(event) => updateForm(setRegisterForm, "email", event.target.value)}
                        className="w-full bg-surface-container-high border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all text-on-surface"
                        placeholder="jean@exemple.com"
                        required
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Mot de passe</label>
                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(event) => setRegisterPassword(event.target.value)}
                        className="w-full bg-surface-container-high border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all text-on-surface"
                        placeholder="••••••••"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting === "register"}
                    className="w-full bg-gradient-to-r from-[#D81918] to-[#d81918] text-white font-bold py-4 rounded-full text-base shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-6"
                  >
                    {submitting === "register" && <Loader2 className="w-5 h-5 animate-spin" />}
                    Créer mon compte
                  </button>
                </form>
              </TabsContent>
            </Tabs>

            {authError && (
              <div className="mt-6 rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
                {authError}
              </div>
            )}
          </div>

          {/* Benefits Sidebar */}
          <div className="space-y-6">
            {/* Why Account Card */}
            <div className="bg-surface-container-low p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">Pourquoi créer un compte ?</h2>
              </div>
              <div className="space-y-4 text-on-surface-variant">
                <p className="text-sm font-medium">✓ Suivi complet de vos commandes</p>
                <p className="text-sm font-medium">✓ Notifications utiles et personnalisées</p>
                <p className="text-sm font-medium">✓ Commande rapide avec pré-remplissage</p>
                <p className="text-sm font-medium">✓ Produits recommandés pour vous</p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-surface-container-lowest p-6 rounded-2xl flex items-center gap-5 border border-outline-variant/10 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined" data-weight="fill">payments</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Paiement à la livraison</p>
                  <p className="text-xs text-on-surface-variant">Payez en toute sécurité à réception</p>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl flex items-center gap-5 border border-outline-variant/10 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined" data-weight="fill">local_shipping</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Livraison 24-72h</p>
                  <p className="text-xs text-on-surface-variant">Suivi en temps réel disponible</p>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl flex items-center gap-5 border border-outline-variant/10 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined" data-weight="fill">replay</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Retour 14 jours</p>
                  <p className="text-xs text-on-surface-variant">Satisfait ou remboursé intégralement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
