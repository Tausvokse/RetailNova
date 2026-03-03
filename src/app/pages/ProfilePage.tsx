import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { User, Package, MapPin, CreditCard, Bell, Shield } from "lucide-react";
import { api, clearToken, getToken } from "../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

type ProfileData = any;

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [data, setData] = useState<ProfileData | null>(null);
  const [message, setMessage] = useState("");
  const [newAddress, setNewAddress] = useState({ title: "", line1: "", city: "", state: "", postalCode: "", isDefault: false });
  const [newCard, setNewCard] = useState({ holderName: "", cardLast4: "", expMonth: "", expYear: "", brand: "Visa", isDefault: false });
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const loadProfile = () => api<ProfileData>("/profile", {}, true).then(setData).catch(() => setData(null));
  useEffect(() => { if (getToken()) loadProfile(); }, []);

  const tabs = [
    { id: "profile", name: "Профіль", icon: User },
    { id: "orders", name: "Замовлення", icon: Package },
    { id: "addresses", name: "Адреси", icon: MapPin },
    { id: "payment", name: "Оплата", icon: CreditCard },
    { id: "notifications", name: "Сповіщення", icon: Bell },
    { id: "security", name: "Безпека", icon: Shield },
  ];

  if (!getToken()) return <div className="min-h-screen bg-gray-50"><Header cartCount={0} /><div className="max-w-3xl mx-auto p-10"><Card className="p-8 text-center">Для перегляду профілю потрібно авторизуватись на сторінці оформлення замовлення.</Card></div></div>;
  if (!data) return <div className="min-h-screen bg-gray-50"><Header cartCount={0} /><div className="max-w-3xl mx-auto p-10">Завантаження...</div></div>;

  const saveProfile = async () => { await api("/profile", { method: "PUT", body: JSON.stringify(data.user) }, true); setMessage("Профіль оновлено"); };
  const addAddress = async () => { await api("/profile/addresses", { method: "POST", body: JSON.stringify(newAddress) }, true); setNewAddress({ title: "", line1: "", city: "", state: "", postalCode: "", isDefault: false }); loadProfile(); };
  const addCard = async () => { await api("/profile/payment-methods", { method: "POST", body: JSON.stringify(newCard) }, true); setNewCard({ holderName: "", cardLast4: "", expMonth: "", expYear: "", brand: "Visa", isDefault: false }); loadProfile(); };

  const renderContent = () => {
    switch (activeTab) {
      case "profile": return <div className="space-y-4"><Label>Ім'я</Label><Input value={data.user.firstName || ""} onChange={(e) => setData({ ...data, user: { ...data.user, firstName: e.target.value } })} /><Label>Прізвище</Label><Input value={data.user.lastName || ""} onChange={(e) => setData({ ...data, user: { ...data.user, lastName: e.target.value } })} /><Label>Email</Label><Input value={data.user.email || ""} onChange={(e) => setData({ ...data, user: { ...data.user, email: e.target.value } })} /><Label>Телефон</Label><Input value={data.user.phone || ""} onChange={(e) => setData({ ...data, user: { ...data.user, phone: e.target.value } })} /><Button className="bg-[#1e40af]" onClick={saveProfile}>Зберегти зміни</Button></div>;
      case "orders": return <div className="space-y-4">{data.orders.map((o: any) => <Card key={o.id} className="p-4"><div className="flex justify-between items-start gap-3"><div><p>Замовлення #{o.id}</p><p className="text-sm text-gray-600">{new Date(o.date).toLocaleString("uk-UA")} — {o.status}</p></div><div className="text-right"><p className="font-semibold mb-2">${o.total.toFixed(2)}</p><Button variant="outline" size="sm" onClick={() => setSelectedOrder(o)}>Деталі</Button></div></div></Card>)}</div>;
      case "addresses": return <div className="space-y-4">{data.addresses.map((a: any) => <Card key={a.id} className="p-4 flex justify-between"><div><p className="font-semibold">{a.title}</p><p>{a.line1}, {a.city}</p></div><Button variant="outline" size="sm" onClick={async () => { await api(`/profile/addresses/${a.id}`, { method: "DELETE" }, true); loadProfile(); }}>Видалити</Button></Card>)}<Card className="p-4 space-y-2"><Input placeholder="Назва" value={newAddress.title} onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })} /><Input placeholder="Адреса" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} /><Input placeholder="Місто" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} /><Button className="bg-[#1e40af]" onClick={addAddress}>Додати адресу</Button></Card></div>;
      case "payment": return <div className="space-y-4">{data.paymentMethods.map((m: any) => <Card key={m.id} className="p-4 flex justify-between"><p>{m.brand} •••• {m.cardLast4}</p><Button variant="outline" size="sm" onClick={async () => { await api(`/profile/payment-methods/${m.id}`, { method: "DELETE" }, true); loadProfile(); }}>Видалити</Button></Card>)}<Card className="p-4 space-y-2"><Input placeholder="Ім'я власника" value={newCard.holderName} onChange={(e) => setNewCard({ ...newCard, holderName: e.target.value })} /><Input placeholder="Останні 4 цифри" value={newCard.cardLast4} onChange={(e) => setNewCard({ ...newCard, cardLast4: e.target.value })} /><Input placeholder="MM" value={newCard.expMonth} onChange={(e) => setNewCard({ ...newCard, expMonth: e.target.value })} /><Input placeholder="YY" value={newCard.expYear} onChange={(e) => setNewCard({ ...newCard, expYear: e.target.value })} /><Button className="bg-[#1e40af]" onClick={addCard}>Додати картку</Button></Card></div>;
      case "notifications": return <div className="space-y-4"><label className="flex justify-between">Email<input type="checkbox" checked={data.notifications?.email} onChange={async (e) => { await api("/profile/notifications", { method: "PUT", body: JSON.stringify({ email: e.target.checked }) }, true); loadProfile(); }} /></label><label className="flex justify-between">SMS<input type="checkbox" checked={data.notifications?.sms} onChange={async (e) => { await api("/profile/notifications", { method: "PUT", body: JSON.stringify({ sms: e.target.checked }) }, true); loadProfile(); }} /></label><label className="flex justify-between">Маркетинг<input type="checkbox" checked={data.notifications?.marketing} onChange={async (e) => { await api("/profile/notifications", { method: "PUT", body: JSON.stringify({ marketing: e.target.checked }) }, true); loadProfile(); }} /></label></div>;
      case "security": return <div className="space-y-4"><Button variant="outline" onClick={async () => { await api("/profile/security/2fa", { method: "PUT", body: JSON.stringify({ enabled: !data.security?.twoFactorEnabled }) }, true); loadProfile(); }}>{data.security?.twoFactorEnabled ? "Вимкнути" : "Увімкнути"} 2FA</Button><Button variant="outline" onClick={() => { clearToken(); window.location.href = "/catalog"; }}>Вийти з акаунту</Button></div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50"><Header cartCount={0} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><h1 className="text-3xl font-semibold text-gray-900 mb-8">Мій профіль</h1>{message && <p className="text-green-700 mb-4">{message}</p>}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8"><aside className="lg:col-span-1"><Card className="p-6"><div className="text-center mb-6"><div className="w-20 h-20 bg-[#1e40af] rounded-full flex items-center justify-center mx-auto mb-3"><User className="w-10 h-10 text-white" /></div><p className="font-semibold text-gray-900">{data.user.firstName} {data.user.lastName}</p><p className="text-sm text-gray-600">{data.user.email}</p></div><nav className="space-y-1">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id ? "bg-[#1e40af] text-white" : "hover:bg-gray-100 text-gray-700"}`}><Icon className="w-5 h-5" />{tab.name}</button>; })}</nav></Card></aside><div className="lg:col-span-3"><Card className="p-8">{renderContent()}</Card></div></div>
      </main>
      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}><DialogContent><DialogHeader><DialogTitle>Деталі замовлення {selectedOrder?.id}</DialogTitle></DialogHeader>{selectedOrder && <div className="space-y-3">{selectedOrder.items?.map((item: any, idx: number) => <div key={idx} className="flex justify-between border-b pb-2"><span>{item.name} × {item.quantity}</span><span>${(item.price * item.quantity).toFixed(2)}</span></div>)}<div className="font-semibold text-right">Всього: ${selectedOrder.total?.toFixed(2)}</div></div>}</DialogContent></Dialog>
    </div>
  );
}
