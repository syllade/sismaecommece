import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

export default function AdminLoginPage() {
  const { user, login, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      // Redirect based on role
      if (user.role === "super_admin") {
        setLocation("/super-admin/dashboard");
      } else {
        setLocation("/admin/dashboard");
      }
    }
  }, [user, setLocation]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      await login(email.trim(), password);
      // Redirect will be handled by useEffect after user state is updated
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Connexion impossible");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-outfit text-2xl">Connexion Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Email admin"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full bg-sisma-red hover:bg-sisma-red/90" type="submit" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
            <p className="text-xs text-slate-500">Comptes seedes: admin@fashop.com ou superadmin@fashop.com (mot de passe: admin123).</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
