import React, { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: "Connexion réussie" });
      setLocation("/dashboard");
    } catch (err) {
      toast({ title: "Erreur de connexion", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <form className="w-full max-w-sm bg-white p-6 rounded-lg shadow" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-4">Connexion Fournisseur</h2>
        <Label className="text-sm">Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3" />
        <Label className="text-sm">Mot de passe</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4" />
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</Button>
      </form>
    </div>
  );
}
