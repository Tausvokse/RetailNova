import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Clock, CreditCard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Header } from "../components/Header";
import { api, getToken } from "../lib/api";
import { clearCart, getCartCount, getCartItems } from "../lib/cart";

type CheckoutItem = { id: string; name: string; price: number; quantity: number; images?: string[]; image?: string };
type PaymentMethod = { id: string; brand: string; cardLast4: string; isDefault?: boolean };
type ProfileData = { user: { firstName?: string; lastName?: string; phone?: string }; paymentMethods: PaymentMethod[] };
type BranchSelection = {
  id: string;
  shortName?: string;
  addressParts?: { city?: string; street?: string; building?: string };
};

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateItems = (location.state?.items || []) as CheckoutItem[];
  const items: CheckoutItem[] = stateItems.length
    ? stateItems
    : getCartItems().map((item) => ({ ...item, images: [item.image] }));

  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [details, setDetails] = useState({ recipientName: "", recipientPhone: "" });

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchSelection | null>(null);
  const [coords, setCoords] = useState<{ latitude: string; longitude: string }>({ latitude: "", longitude: "" });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({ latitude: String(position.coords.latitude), longitude: String(position.coords.longitude) });
        },
        () => setCoords({ latitude: "", longitude: "" }),
      );
    }
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
        setDetails({
          recipientName: `${data.user.lastName || ""} ${data.user.firstName || ""}`.trim(),
          recipientPhone: data.user.phone || "",
        });
        if (data.paymentMethods.length > 0) {
          const preferredCard = data.paymentMethods.find((m) => m.isDefault) || data.paymentMethods[0];
          setSelectedPayment(preferredCard.id);
        }
      })
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    if (!isBranchModalOpen) return;

    const handler = (event: MessageEvent) => {
      if (event.origin !== "https://widget.novapost.com") return;
      if (event.data === "closeFrame") {
        setIsBranchModalOpen(false);
        return;
      }

      if (event.data && typeof event.data === "object") {
        setSelectedBranch(event.data as BranchSelection);
        setIsBranchModalOpen(false);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isBranchModalOpen]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const selectedBranchText = selectedBranch?.shortName || "";
  const selectedBranchDescription = selectedBranch
    ? `${selectedBranch.addressParts?.city || ""} вул. ${selectedBranch.addressParts?.street || ""}, ${selectedBranch.addressParts?.building || ""}`.trim()
    : "Обрати відділення або поштомат";

  const sendInitDataToIframe = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      {
        placeName: "Київ",
        latitude: coords.latitude,
        longitude: coords.longitude,
        domain: window.location.hostname,
        id: selectedBranch?.id || null,
      },
      "*",
    );
  };

  const handlePlaceOrder = async () => {
    if (!getToken()) {
      navigate("/auth", { state: { returnTo: "/checkout", items } });
      return;
    }

    if (!details.recipientName.trim() || !details.recipientPhone.trim()) {
      setError("Вкажіть ПІБ та номер отримувача.");
      return;
    }

    if (!selectedBranch) {
      setError("Оберіть відділення або поштомат Нової Пошти для доставки.");
      return;
    }

    try {
      const reserve = await api<{ reservationId: string }>("/checkout/reserve", { method: "POST", body: JSON.stringify({ items: items.map((i) => ({ id: i.id, quantity: i.quantity })) }) }, true);
      const order = await api<{ orderId: string }>(
        "/orders",
        {
          method: "POST",
          body: JSON.stringify({
            reservationId: reserve.reservationId,
            customerDetails: {
              recipientName: details.recipientName.trim(),
              recipientPhone: details.recipientPhone.trim(),
              selectedPayment,
              deliveryMethod: "nova-poshta",
              novaPoshtaBranch: selectedBranch,
              deliveryAddress: `${selectedBranch.shortName || ""} ${selectedBranchDescription}`,
            },
          }),
        },
        true,
      );
      clearCart();
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
      <Header cartCount={getCartCount()} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">Оформлення замовлення</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6 space-y-4">
              <div>
                <Label>ПІБ отримувача</Label>
                <Input value={details.recipientName} onChange={(e) => setDetails((d) => ({ ...d, recipientName: e.target.value }))} />
              </div>

              <div>
                <Label>Номер отримувача</Label>
                <Input value={details.recipientPhone} onChange={(e) => setDetails((d) => ({ ...d, recipientPhone: e.target.value }))} />
              </div>

              <div>
                <Label className="mb-2 block">Вибір відділення Нової Пошти</Label>
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(true)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white"
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <path d="M11.9401 16.4237H16.0596V21.271H19.2101L15.39 25.0911C14.6227 25.8585 13.3791 25.8585 12.6118 25.0911L8.79166 21.271H11.9401V16.4237ZM21.2688 19.2102V8.78972L25.091 12.6098C25.8583 13.3772 25.8583 14.6207 25.091 15.3881L21.2688 19.2102ZM16.0596 6.73099V11.5763H11.9401V6.73099H8.78958L12.6097 2.90882C13.377 2.14148 14.6206 2.14148 15.3879 2.90882L19.2101 6.73099H16.0596ZM2.90868 12.6098L6.72877 8.78972V19.2102L2.90868 15.3901C2.14133 14.6228 2.14133 13.3772 2.90868 12.6098Z" fill="#DA291C"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-base leading-5 font-medium text-gray-900">{selectedBranchText}</p>
                    <p className="text-sm leading-5 text-gray-600">{selectedBranchDescription}</p>
                  </div>
                  <span className="text-gray-500 text-xl">›</span>
                </button>
              </div>

              {profile && profile.paymentMethods.length > 0 && (
                <div>
                  <Label>Оберіть платіжний засіб з профілю</Label>
                  <select className="w-full mt-1 h-10 rounded-md border border-gray-200 px-3" value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)}>
                    {profile.paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.brand} •••• {method.cardLast4}</option>)}
                  </select>
                </div>
              )}
            </Card>
          </div>

          <div><Card className="p-6 sticky top-24"><h2 className="text-xl font-semibold mb-4">Підсумок</h2>{items.map((item) => <div key={item.id} className="flex justify-between py-2"><span>{item.name} x{item.quantity}</span><span>${(item.price * item.quantity).toFixed(2)}</span></div>)}<div className="border-t mt-3 pt-3 font-semibold">Всього: <span className="text-[#1e40af]">${total.toFixed(2)}</span></div><Button className="w-full mt-4 py-6 text-lg bg-[#1e40af] hover:bg-[#1e3a8a]" onClick={handlePlaceOrder}><CreditCard className="w-5 h-5 mr-2" />Оформити замовлення</Button>{error && <p className="text-red-600 text-sm mt-3">{error}</p>}</Card></div>
        </div>
      </div>

      {isBranchModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4">
          <div className="relative w-[80%] max-w-6xl h-[80%] bg-white shadow-xl overflow-hidden">
            <header className="h-20 border-b border-gray-200 px-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Вибрати відділення</h2>
              <button type="button" onClick={() => setIsBranchModalOpen(false)} className="text-3xl leading-none">×</button>
            </header>
            <iframe
              ref={iframeRef}
              title="Nova Poshta Widget"
              src="https://widget.novapost.com/division/index.html"
              className="w-full h-[calc(100%-81px)] border-0"
              allow="geolocation"
              onLoad={sendInitDataToIframe}
            />
          </div>
        </div>
      )}
    </div>
  );
}