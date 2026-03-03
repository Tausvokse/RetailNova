import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Clock, CreditCard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Header } from "../components/Header";
import { api, getToken } from "../lib/api";

type CheckoutItem = { id: string; name: string; price: number; quantity: number; images?: string[]; image?: string };
type ProfileData = { user: { firstName?: string; lastName?: string; email?: string; phone?: string }; addresses: any[]; paymentMethods: any[] };

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const items: CheckoutItem[] = location.state?.items || [];
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [details, setDetails] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", state: "", postalCode: "" });

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!getToken() && items.length > 0) {
      navigate("/auth", { state: { returnTo: "/checkout", items }, replace: true });
    }
  }, [items, navigate]);

  useEffect(() => {
    if (!getToken()) return;
    api<ProfileData>("/profile", {}, true)
      .then((data) => {
        setProfile(data);
        setDetails((d) => ({ ...d, firstName: data.user.firstName || "", lastName: data.user.lastName || "", email: data.user.email || "", phone: data.user.phone || "" }));
        if (data.addresses.length > 0) {
          const preferred = data.addresses.find((a) => a.isDefault) || data.addresses[0];
          setSelectedAddress(preferred.id);
          setDetails((d) => ({ ...d, address: preferred.line1 || "", city: preferred.city || "", state: preferred.state || "", postalCode: preferred.postalCode || "" }));
        }
        if (data.paymentMethods.length > 0) {
          const preferredCard = data.paymentMethods.find((m) => m.isDefault) || data.paymentMethods[0];
          setSelectedPayment(preferredCard.id);
        }
      })
      .catch(() => setProfile(null));
  }, []);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const onSelectAddress = (id: string) => {
    setSelectedAddress(id);
    const address = profile?.addresses.find((a) => a.id === id);
    if (!address) return;
    setDetails((d) => ({ ...d, address: address.line1 || "", city: address.city || "", state: address.state || "", postalCode: address.postalCode || "" }));
  };

  const handlePlaceOrder = async () => {
    if (!getToken()) {
      navigate("/auth", { state: { returnTo: "/checkout", items } });
      return;
    }

    try {
      const reserve = await api<{ reservationId: string }>("/checkout/reserve", { method: "POST", body: JSON.stringify({ items: items.map((i) => ({ id: i.id, quantity: i.quantity })) }) }, true);
      const order = await api<{ orderId: string }>("/orders", { method: "POST", body: JSON.stringify({ reservationId: reserve.reservationId, customerDetails: { ...details, selectedAddress, selectedPayment } }) }, true);
      navigate(`/order-success/${order.orderId}`, { state: { orderId: order.orderId, items, total } });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (items.length === 0) {
    return <div className="min-h-screen bg-gray-50"><Header cartCount={0} /><div className="flex items-center justify-center pt-20"><Card className="p-8 text-center max-w-md"><p className="text-gray-600 mb-4">Ваш кошик порожній</p><Button onClick={() => navigate("/")}>Продовжити покупки</Button></Card></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#f97316] to-[#ef4444] text-white py-4 px-4 shadow-lg"><div className="max-w-7xl mx-auto flex items-center justify-center gap-3"><Clock className="w-5 h-5 animate-pulse" /><p className="font-semibold text-lg">Товари зарезервовані на <span className="font-mono text-xl">{formatTime(timeLeft)}</span></p></div></div>
      <Header cartCount={items.length} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">Оформлення замовлення</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6 space-y-4">
              {profile && profile.addresses.length > 0 && (
                <div>
                  <Label>Оберіть адресу з профілю</Label>
                  <select className="w-full mt-1 h-10 rounded-md border border-gray-200 px-3" value={selectedAddress} onChange={(e) => onSelectAddress(e.target.value)}>
                    {profile.addresses.map((address) => <option key={address.id} value={address.id}>{address.title} — {address.line1}</option>)}
                  </select>
                </div>
              )}
              {profile && profile.paymentMethods.length > 0 && (
                <div>
                  <Label>Оберіть платіжний засіб з профілю</Label>
                  <select className="w-full mt-1 h-10 rounded-md border border-gray-200 px-3" value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)}>
                    {profile.paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.brand} •••• {method.cardLast4}</option>)}
                  </select>
                </div>
              )}

              <Label>Ім'я</Label><Input value={details.firstName} onChange={(e) => setDetails((d) => ({ ...d, firstName: e.target.value }))} />
              <Label>Прізвище</Label><Input value={details.lastName} onChange={(e) => setDetails((d) => ({ ...d, lastName: e.target.value }))} />
              <Label>Email</Label><Input type="email" value={details.email} onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))} />
              <Label>Телефон</Label><Input value={details.phone} onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))} />
              <Label>Адреса</Label><Input value={details.address} onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))} />
            </Card>
          </div>

          <div><Card className="p-6 sticky top-24"><h2 className="text-xl font-semibold mb-4">Підсумок</h2>{items.map((item) => <div key={item.id} className="flex justify-between py-2"><span>{item.name} x{item.quantity}</span><span>${(item.price * item.quantity).toFixed(2)}</span></div>)}<div className="border-t mt-3 pt-3 font-semibold">Всього: <span className="text-[#1e40af]">${total.toFixed(2)}</span></div><Button className="w-full mt-4 py-6 text-lg bg-[#1e40af] hover:bg-[#1e3a8a]" onClick={handlePlaceOrder}><CreditCard className="w-5 h-5 mr-2" />Оформити замовлення</Button>{error && <p className="text-red-600 text-sm mt-3">{error}</p>}</Card></div>
        </div>
      </div>
    </div>
  );
}
