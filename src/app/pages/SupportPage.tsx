import { FormEvent, useState } from "react";
import { Header } from "../components/Header";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { api } from "../lib/api";

export function SupportPage() {
  const [form, setForm] = useState({
    userName: "",
    email: "",
    type: "Incident",
    subject: "",
    description: "",
    priority: "Medium",
  });
  const [result, setResult] = useState<{ ticketCode: string; statusLabel: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await api<{ ticketCode: string; statusLabel: string }>("/support/tickets", {
        method: "POST",
        body: JSON.stringify({ ...form, channel: "WEB" }),
      });
      setResult(response);
      setForm({ userName: "", email: "", type: "Incident", subject: "", description: "", priority: "Medium" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка створення звернення");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartCount={0} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-semibold">Підтримка RetailNova</h1>
            <p className="text-gray-600 mt-2">Залиште звернення — команда Support опрацює його якнайшвидше.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="userName">Ім'я</Label>
              <Input id="userName" value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="email">Email або ID користувача</Label>
              <Input id="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="type">Тип звернення</Label>
              <select id="type" className="w-full h-10 border rounded-md px-3" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Incident</option>
                <option>Change Request</option>
                <option>Service Request</option>
              </select>
            </div>
            <div>
              <Label htmlFor="subject">Тема</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="description">Опис</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={5} />
            </div>
            <div>
              <Label htmlFor="priority">Пріоритет</Label>
              <select id="priority" className="w-full h-10 border rounded-md px-3" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <Button type="submit" className="w-full bg-[#1e40af]" disabled={loading}>
              {loading ? "Відправляємо..." : "Створити звернення"}
            </Button>
          </form>

          {result && (
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="font-medium">Звернення успішно зареєстровано.</p>
              <p>Номер: {result.ticketCode}</p>
              <p>Статус: {result.statusLabel}</p>
            </Card>
          )}
          {error && <p className="text-red-600">{error}</p>}
        </Card>
      </main>
    </div>
  );
}