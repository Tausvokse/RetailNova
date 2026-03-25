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

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
};

export function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await api<Ticket[]>("/admin/tickets", {}, true);
      setTickets(data);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (q = "") => {
    const encoded = encodeURIComponent(q);
    const data = await api<AdminUser[]>(`/admin/users${encoded ? `?q=${encoded}` : ""}`, {}, true);
    setUsers(data);
  };

  useEffect(() => {
    loadTickets();
    loadUsers();
  }, []);

  const updateTicket = async (ticketCode: string, payload: Partial<Ticket>) => {
    await api(`/admin/tickets/${ticketCode}`, { method: "PATCH", body: JSON.stringify(payload) }, true);
    await loadTickets();
  };

  const setUserAdminAccess = async (userId: string, isAdmin: boolean) => {
    await api(`/admin/users/${userId}/access`, { method: "PATCH", body: JSON.stringify({ isAdmin }) }, true);
    await loadUsers(query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartCount={0} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Доступ до адмін панелі</h2>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Пошук користувача (email / ім'я)" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button variant="outline" onClick={() => loadUsers(query)}>Знайти</Button>
          </div>
          <div className="space-y-2 mb-8">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                <Button variant={user.isAdmin ? "outline" : "default"} onClick={() => setUserAdminAccess(user.id, !user.isAdmin)}>
                  {user.isAdmin ? "Забрати адмін доступ" : "Надати адмін доступ"}
                </Button>
              </div>
            ))}
          </div>

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