import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { api, setToken, getToken, setIsAdmin } from "../lib/api";
import { setCartOwner } from "../lib/cart";

type AuthResponse = { token: string; user: { id: string; isAdmin?: boolean } };

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });

  const state = (location.state || {}) as { returnTo?: string; items?: any[] };

  useEffect(() => {
    if (getToken()) {
      navigate(state.returnTo || "/profile", { state: state.items ? { items: state.items } : undefined, replace: true });
    }
  }, [navigate, state.items, state.returnTo]);

  const submit = async () => {
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await api<AuthResponse>(endpoint, { method: "POST", body: JSON.stringify(form) });
      setToken(res.token);
      setIsAdmin(Boolean(res.user.isAdmin));
      setCartOwner(res.user.id);
      navigate(state.returnTo || "/profile", { state: state.items ? { items: state.items } : undefined });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartCount={0} />
      <main className="max-w-xl mx-auto px-4 py-12">
        <Card className="p-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            {mode === "register" ? "Реєстрація" : "Вхід"}
          </h1>
          <p className="text-gray-600 mb-6">Щоб продовжити оформлення покупки, увійдіть або створіть акаунт.</p>

          <div className="flex gap-2 mb-6">
            <Button variant={mode === "register" ? "default" : "outline"} onClick={() => setMode("register")} className={mode === "register" ? "bg-[#1e40af]" : ""}>Реєстрація</Button>
            <Button variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")} className={mode === "login" ? "bg-[#1e40af]" : ""}>Вхід</Button>
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Ім'я" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                <Input placeholder="Прізвище" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
              </div>
            )}
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Input type="password" placeholder="Пароль" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full bg-[#1e40af] hover:bg-[#1e3a8a]" onClick={submit}>Продовжити</Button>
          </div>
        </Card>
      </main>
    </div>
  );
}