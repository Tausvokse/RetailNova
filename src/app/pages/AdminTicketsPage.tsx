import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { api } from "../lib/api";

type Ticket = {
  ticketCode: string;
  typeLabel: string;
  subject: string;
  priorityLabel: string;
  status: string;
  statusLabel: string;
  channel: string;
  createdAt: string;
  assignee?: string | null;
  comment?: string | null;
};

export function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await api<Ticket[]>("/admin/tickets");
      setTickets(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const updateTicket = async (ticketCode: string, payload: Partial<Ticket>) => {
    await api(`/admin/tickets/${ticketCode}`, { method: "PATCH", body: JSON.stringify(payload) });
    await loadTickets();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartCount={0} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-6">
          <h1 className="text-3xl font-semibold mb-6">Admin: звернення підтримки</h1>
          {loading ? (
            <p>Завантаження...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">ID</th>
                    <th className="p-2">Тип</th>
                    <th className="p-2">Тема</th>
                    <th className="p-2">Пріоритет</th>
                    <th className="p-2">Статус</th>
                    <th className="p-2">Канал</th>
                    <th className="p-2">Дата</th>
                    <th className="p-2">Відповідальний</th>
                    <th className="p-2">Коментар</th>
                    <th className="p-2">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.ticketCode} className="border-b align-top">
                      <td className="p-2 font-medium">{ticket.ticketCode}</td>
                      <td className="p-2">{ticket.typeLabel}</td>
                      <td className="p-2">{ticket.subject}</td>
                      <td className="p-2">{ticket.priorityLabel}</td>
                      <td className="p-2">
                        <select
                          className="border rounded px-2 py-1"
                          value={ticket.status}
                          onChange={(e) => setTickets((prev) => prev.map((t) => (t.ticketCode === ticket.ticketCode ? { ...t, status: e.target.value } : t)))}
                        >
                          <option value="NEW">New</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="REVIEW">Review</option>
                          <option value="DONE">Done</option>
                        </select>
                      </td>
                      <td className="p-2">{ticket.channel}</td>
                      <td className="p-2">{new Date(ticket.createdAt).toLocaleString("uk-UA")}</td>
                      <td className="p-2">
                        <Input value={ticket.assignee || ""} onChange={(e) => setTickets((prev) => prev.map((t) => (t.ticketCode === ticket.ticketCode ? { ...t, assignee: e.target.value } : t)))} />
                      </td>
                      <td className="p-2">
                        <Input value={ticket.comment || ""} onChange={(e) => setTickets((prev) => prev.map((t) => (t.ticketCode === ticket.ticketCode ? { ...t, comment: e.target.value } : t)))} />
                      </td>
                      <td className="p-2">
                        <Button size="sm" onClick={() => updateTicket(ticket.ticketCode, { status: ticket.status, assignee: ticket.assignee, comment: ticket.comment })}>Зберегти</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}