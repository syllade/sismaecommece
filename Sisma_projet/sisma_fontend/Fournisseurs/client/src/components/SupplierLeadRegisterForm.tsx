import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  usePublicCategories,
  useSupplierRegisterMutation,
  useSupplierRequirements,
} from "@/hooks/use-supplier-registration";

type LeadForm = {
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  password: string;
  password_confirmation: string;
  category_ids: number[];
};

const initialForm: LeadForm = {
  company_name: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  country: "Côte d'Ivoire",
  address: "",
  password: "",
  password_confirmation: "",
  category_ids: [],
};

export function SupplierLeadRegisterForm() {
  const [form, setForm] = useState<LeadForm>(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const registerMutation = useSupplierRegisterMutation();
  const { data: requirementsData } = useSupplierRequirements();
  const { data: fallbackCategories = [] } = usePublicCategories();
  const categories = useMemo(
    () => requirementsData?.data?.available_categories || fallbackCategories,
    [requirementsData?.data?.available_categories, fallbackCategories],
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 15px",
    border: "1.5px solid rgba(0,0,0,.09)",
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "var(--body)",
    outline: "none",
    background: "#fff",
  };

  const updateField = (key: keyof LeadForm, value: string | number[]) => {
    setForm((prev) => ({ ...prev, [key]: value as never }));
  };

  const toggleCategory = (id: number) => {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter((categoryId) => categoryId !== id)
        : [...prev.category_ids, id],
    }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (form.password !== form.password_confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const payload = await registerMutation.mutateAsync({
        ...form,
      });
      setMessage(payload?.message || "Inscription envoyée. Validation en cours.");
      setForm(initialForm);
    } catch (err: any) {
      setError(err?.payload?.message || err?.message || "Erreur d'inscription.");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: "#fff",
        borderRadius: 22,
        padding: "40px",
        border: "1px solid rgba(0,0,0,.07)",
        boxShadow: "0 20px 60px rgba(0,0,0,.07)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {message && (
        <div style={{ fontSize: 13, color: "#166534", background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "10px 12px" }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 13, color: "#991B1B", background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 12px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="steps-grid">
        <input style={inputStyle} placeholder="Nom du magasin" value={form.company_name} onChange={(e) => updateField("company_name", e.target.value)} required />
        <input style={inputStyle} placeholder="Ville" value={form.city} onChange={(e) => updateField("city", e.target.value)} required />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="steps-grid">
        <input style={inputStyle} placeholder="Prénom" value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} required />
        <input style={inputStyle} placeholder="Nom" value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} required />
      </div>

      <input style={inputStyle} type="email" placeholder="Email professionnel" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
      <input style={inputStyle} placeholder="Téléphone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} required />
      <input style={inputStyle} placeholder="Adresse" value={form.address} onChange={(e) => updateField("address", e.target.value)} required />
      <input style={inputStyle} placeholder="Pays" value={form.country} onChange={(e) => updateField("country", e.target.value)} required />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="steps-grid">
        <input style={inputStyle} type="password" placeholder="Mot de passe" value={form.password} onChange={(e) => updateField("password", e.target.value)} required />
        <input
          style={inputStyle}
          type="password"
          placeholder="Confirmer mot de passe"
          value={form.password_confirmation}
          onChange={(e) => updateField("password_confirmation", e.target.value)}
          required
        />
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, letterSpacing: ".05em", textTransform: "uppercase", fontFamily: "var(--body)" }}>
          Catégories
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }} className="feat-grid">
          {categories.slice(0, 8).map((category) => (
            <label
              key={category.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid rgba(0,0,0,.12)",
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.category_ids.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
                style={{ accentColor: "#D81918" }}
              />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={registerMutation.isPending}
        style={{
          background: "#D81918",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "14px",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "var(--body)",
        }}
      >
        {registerMutation.isPending ? "Inscription..." : "Créer mon compte fournisseur"}
      </button>

      <p style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF", fontFamily: "var(--body)" }}>
        Besoin d'un formulaire complet avec documents ?{" "}
        <Link href="/supplier/register" style={{ color: "#D81918", fontWeight: 700, textDecoration: "none" }}>
          Ouvrir l'inscription avancée
        </Link>
      </p>
    </form>
  );
}
