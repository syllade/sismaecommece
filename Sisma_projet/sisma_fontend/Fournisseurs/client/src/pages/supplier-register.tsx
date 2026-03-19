import { useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import {
  usePublicCategories,
  useSupplierRegisterMutation,
  useSupplierRequirements,
  type PublicCategory,
} from "@/hooks/use-supplier-registration";
import RegistrationSuccess from "@/components/RegistrationSuccess";

type FormErrors = Record<string, string[]>;

type RegisterForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  company_name: string;
  company_rccm: string;
  company_nif: string;
  address: string;
  city: string;
  country: string;
  description: string;
  category_ids: number[];
  logo: File | null;
  id_document: File | null;
  business_document: File | null;
};

const initialForm: RegisterForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  company_name: "",
  company_rccm: "",
  company_nif: "",
  address: "",
  city: "",
  country: "",
  description: "",
  category_ids: [],
  logo: null,
  id_document: null,
  business_document: null,
};

function firstError(errors: FormErrors, key: string): string | null {
  const row = errors[key];
  if (!row || row.length === 0) return null;
  return row[0];
}

export default function SupplierRegisterPage() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { data: requirementsData } = useSupplierRequirements();
  const { data: fetchedCategories = [] } = usePublicCategories();
  const registerMutation = useSupplierRegisterMutation();

  const categories = useMemo<PublicCategory[]>(
    () => requirementsData?.data?.available_categories || fetchedCategories,
    [requirementsData?.data?.available_categories, fetchedCategories],
  );

  const updateField = (field: keyof RegisterForm, value: string | File | null | number[]) => {
    setForm((prev) => ({ ...prev, [field]: value as never }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleCategory = (categoryId: number) => {
    setForm((prev) => {
      const exists = prev.category_ids.includes(categoryId);
      return {
        ...prev,
        category_ids: exists
          ? prev.category_ids.filter((id) => id !== categoryId)
          : [...prev.category_ids, categoryId],
      };
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate required fields
    if (!agreedToTerms) {
      setSubmitError("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    setErrors({});
    setSubmitError("");
    setSuccessMessage("");

    try {
      const response = await registerMutation.mutateAsync({
        ...form,
      });
      const message =
        response?.message || "Inscription enregistrée avec succès!";
      setSuccessMessage(message);
      // Redirect to success page after short delay
      setTimeout(() => {
        setLocation("/register/success");
      }, 1500);
    } catch (error: any) {
      const fieldErrors = error?.payload?.errors || {};
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setSubmitError(error?.payload?.message || error?.message || "Erreur lors de l'inscription.");
      }
    }
  };

  if (successMessage) {
    return <RegistrationSuccess message={successMessage} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 md:px-20 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 uppercase">SISMA</h2>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-[#ec5b13] transition-colors">
            Déjà un compte ?
          </Link>
          <Link
            href="/login"
            className="bg-[#ec5b13] text-white px-6 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-md"
          >
            Connexion
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">Inscription Fournisseur</h1>
          <p className="text-gray-500 text-lg">Rejoignez la marketplace SISMA et développer votre entreprise avec des outils professionnels.</p>
        </div>

        <form className="space-y-12" onSubmit={submit}>
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* Section 1: Personal Information */}
          <section className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <span className="material-symbols-outlined text-[#ec5b13]">person</span>
              <h2 className="text-xl font-bold">1. Informations personnelles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Prénom *</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  placeholder="Jean"
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                />
                {firstError(errors, "first_name") && (
                  <p className="text-xs text-red-600">{firstError(errors, "first_name")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Nom *</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  placeholder="Dupont"
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                />
                {firstError(errors, "last_name") && (
                  <p className="text-xs text-red-600">{firstError(errors, "last_name")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Adresse email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="jean.dupont@example.com"
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                />
                {firstError(errors, "email") && (
                  <p className="text-xs text-red-600">{firstError(errors, "email")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Téléphone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+243 ..."
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                />
                {firstError(errors, "phone") && (
                  <p className="text-xs text-red-600">{firstError(errors, "phone")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Mot de passe *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                />
                {firstError(errors, "password") && (
                  <p className="text-xs text-red-600">{firstError(errors, "password")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Confirmer le mot de passe *</label>
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) => updateField("password_confirmation", e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                />
                {firstError(errors, "password_confirmation") && (
                  <p className="text-xs text-red-600">{firstError(errors, "password_confirmation")}</p>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Company Information */}
          <section className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <span className="material-symbols-outlined text-[#ec5b13]">business</span>
              <h2 className="text-xl font-bold">2. Informations entreprise</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Nom de l'entreprise *</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => updateField("company_name", e.target.value)}
                  placeholder="SISMA Solutions SARL"
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                />
                {firstError(errors, "company_name") && (
                  <p className="text-xs text-red-600">{firstError(errors, "company_name")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">RCCM</label>
                <input
                  type="text"
                  value={form.company_rccm}
                  onChange={(e) => updateField("company_rccm", e.target.value)}
                  placeholder="Numéro RCCM"
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">NIF</label>
                <input
                  type="text"
                  value={form.company_nif}
                  onChange={(e) => updateField("company_nif", e.target.value)}
                  placeholder="Numéro d'identification fiscale"
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Ville *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Kinshasa"
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                />
                {firstError(errors, "city") && (
                  <p className="text-xs text-red-600">{firstError(errors, "city")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Pays *</label>
                <select
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                >
                  <option value="">Sélectionner un pays</option>
                  
                  <option value="Côte d'ivoire">Côte d'ivoire</option>

                </select>
                {firstError(errors, "country") && (
                  <p className="text-xs text-red-600">{firstError(errors, "country")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Adresse complète *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Av. de l'Equateur, Gombe"
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all"
                />
                {firstError(errors, "address") && (
                  <p className="text-xs text-red-600">{firstError(errors, "address")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Description de l'entreprise</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Décrivez votre activité..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Sales Categories */}
          <section className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <span className="material-symbols-outlined text-[#ec5b13]">category</span>
              <h2 className="text-xl font-bold">3. Catégories de vente</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Sélectionnez les catégories qui correspondent le mieux à vos produits ou services.</p>
            <div className="flex flex-wrap gap-2">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <label key={category.id} className="group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.category_ids.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="hidden peer"
                    />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">
                      {category.name}
                    </span>
                  </label>
                ))
              ) : (
                <>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Chaussures</span>
                  </label>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Décoration</span>
                  </label>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Électronique</span>
                  </label>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Maquillage</span>
                  </label>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Meubles</span>
                  </label>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Mode Enfants</span>
                  </label>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Mode Femmes</span>
                  </label>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Mode Hommes</span>
                  </label>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Ordinateurs</span>
                  </label>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Parfums</span>
                  </label>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Sacs & Maroquinerie</span>
                  </label>
                  <label className="group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <span className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium cursor-pointer peer-checked:bg-[#ec5b13] peer-checked:text-white peer-checked:border-[#ec5b13] transition-all hover:border-[#ec5b13]">Téléphones & Tablettes</span>
                  </label>
                </>
              )}
            </div>
            {firstError(errors, "category_ids") && (
              <p className="text-xs text-red-600 mt-2">{firstError(errors, "category_ids")}</p>
            )}
          </section>

          {/* Section 4: Documents Upload */}
          <section className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <span className="material-symbols-outlined text-[#ec5b13]">upload_file</span>
              <h2 className="text-xl font-bold">4. Téléversement des documents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#ec5b13] transition-colors bg-gray-50">
                <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">add_photo_alternate</span>
                <span className="text-xs font-bold uppercase text-gray-500 mb-1">Logo entreprise</span>
                <span className="text-[10px] text-gray-400">PNG, JPG jusqu'à 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  id="logo-upload"
                  className="hidden"
                  onChange={(e) => updateField("logo", e.target.files?.[0] || null)}
                />
                <label htmlFor="logo-upload" className="mt-4 text-xs font-bold text-[#ec5b13] cursor-pointer hover:underline">
                  Choisir un fichier
                </label>
              </div>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#ec5b13] transition-colors bg-gray-50">
                <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">badge</span>
                <span className="text-xs font-bold uppercase text-gray-500 mb-1">Pièce d'identité</span>
                <span className="text-[10px] text-gray-400">PDF, JPG jusqu'à 10MB</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  id="id-upload"
                  className="hidden"
                  onChange={(e) => updateField("id_document", e.target.files?.[0] || null)}
                />
                <label htmlFor="id-upload" className="mt-4 text-xs font-bold text-[#ec5b13] cursor-pointer hover:underline">
                  Choisir un fichier
                </label>
              </div>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#ec5b13] transition-colors bg-gray-50">
                <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">description</span>
                <span className="text-xs font-bold uppercase text-gray-500 mb-1">Document RCCM</span>
                <span className="text-[10px] text-gray-400">PDF, JPG jusqu'à 10MB</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  id="rccm-upload"
                  className="hidden"
                  onChange={(e) => updateField("business_document", e.target.files?.[0] || null)}
                />
                <label htmlFor="rccm-upload" className="mt-4 text-xs font-bold text-[#ec5b13] cursor-pointer hover:underline">
                  Choisir un fichier
                </label>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col gap-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-[#ec5b13] focus:ring-[#ec5b13]" 
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                J'accepte les <a href="#" className="text-[#ec5b13] font-semibold hover:underline">Conditions d'utilisation</a> et la <a href="#" className="text-[#ec5b13] font-semibold hover:underline">Politique de confidentialité</a> de SISMA Marketplace. Je confirme que toutes les informations fournies sont exactes et authentiques.
              </span>
            </label>
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-[#ec5b13] text-white py-4 rounded-xl text-lg font-black tracking-wide hover:brightness-110 transition-all shadow-lg shadow-[#ec5b13]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {registerMutation.isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Inscription en cours...
                </>
              ) : (
                <>
                  Finaliser l'inscription
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
            <p className="text-center text-sm text-gray-500 mt-2">
              Votre demande sera examinée par notre équipe sous 24-48 heures ouvrables.
            </p>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 md:px-20 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-500">SISMA MARKETPLACE</span>
            </div>
            <p className="text-xs text-gray-400">© 2024 SISMA. Tous droits réservés.</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-gray-400 hover:text-[#ec5b13] transition-colors text-sm font-medium">Centre d'aide</a>
            <a href="#" className="text-gray-400 hover:text-[#ec5b13] transition-colors text-sm font-medium">Conditions</a>
            <a href="#" className="text-gray-400 hover:text-[#ec5b13] transition-colors text-sm font-medium">Confidentialité</a>
            <a href="#" className="text-gray-400 hover:text-[#ec5b13] transition-colors text-sm font-medium">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
