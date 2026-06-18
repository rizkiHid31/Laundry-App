import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/pages/DashboardPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const ITEM_TYPES = ['Kaos', 'Celana Panjang', 'Celana Pendek', 'Celana Dalam', 'Kemeja'];

type Order = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalKilo: number;
  items: { itemType: string; quantity: number }[];
};

type Bypass = {
  id: string;
  reason: string;
  stationType: string;
  order: { invoiceNumber: string };
  worker: { firstName: string; lastName: string };
};

export default function OutletAdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bypasses, setBypasses] = useState<Bypass[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [totalKilo, setTotalKilo] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [bypassNotes, setBypassNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const [orderRes, bypassRes] = await Promise.all([
      apiFetch<{ items: Order[] }>('/api/orders/outlet/list?status=ARRIVED_AT_OUTLET'),
      apiFetch<Bypass[]>('/api/orders/bypass/pending'),
    ]);
    setOrders(orderRes.data?.items || []);
    setBypasses(bypassRes.data || []);
  };

  useEffect(() => { load(); }, []);

  const createOrder = async () => {
    if (!selected || totalKilo <= 0) {
      toast.error('Total kilo wajib diisi');
      return;
    }
    const items = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([itemType, quantity]) => ({ itemType, quantity }));
    if (!items.length) {
      toast.error('Minimal 1 item pakaian');
      return;
    }
    await apiFetch('/api/orders/create', {
      method: 'POST',
      body: JSON.stringify({ orderId: selected.id, totalKilo, items }),
    });
    toast.success('Order diproses, masuk ke washing station');
    setSelected(null);
    load();
  };

  const approveBypass = async (id: string) => {
    const notes = bypassNotes[id];
    if (!notes?.trim()) {
      toast.error('Isi keterangan problem terlebih dahulu');
      return;
    }
    await apiFetch(`/api/orders/bypass/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ adminNotes: notes }),
    });
    toast.success('Bypass disetujui');
    load();
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Outlet Admin</h1>

      {bypasses.length > 0 && (
        <Card className="mb-6 border-yellow-300">
          <CardHeader><CardTitle>Bypass Request ({bypasses.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {bypasses.map((b) => (
              <div key={b.id} className="rounded-lg border p-3 space-y-2">
                <p className="font-medium">{b.order.invoiceNumber} · {b.stationType}</p>
                <p className="text-sm text-muted-foreground">{b.worker.firstName} {b.worker.lastName}: {b.reason}</p>
                <Textarea
                  placeholder="Keterangan problem..."
                  value={bypassNotes[b.id] || ''}
                  onChange={(e) => setBypassNotes({ ...bypassNotes, [b.id]: e.target.value })}
                />
                <Button size="sm" onClick={() => approveBypass(b.id)}>Setujui Bypass</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          {orders.map((o) => (
            <Card key={o.id} className="cursor-pointer" onClick={() => {
              setSelected(o);
              setQuantities({});
              setTotalKilo(0);
            }}>
              <CardContent className="flex justify-between pt-6">
                <span className="font-medium">{o.invoiceNumber}</span>
                <Badge>Menunggu Input</Badge>
              </CardContent>
            </Card>
          ))}
          {!orders.length && <p className="text-muted-foreground text-center py-8">Tidak ada order masuk</p>}
        </div>

        {selected && (
          <Card>
            <CardHeader><CardTitle>Buat Order - {selected.invoiceNumber}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Total Kilo (kg)</Label>
                <Input type="number" step="0.1" value={totalKilo || ''} onChange={(e) => setTotalKilo(Number(e.target.value))} />
              </div>
              {ITEM_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Label className="flex-1">{type}</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={quantities[type] || ''}
                    onChange={(e) => setQuantities({ ...quantities, [type]: Number(e.target.value) })}
                  />
                  <span className="text-sm">pcs</span>
                </div>
              ))}
              <Button className="w-full" onClick={createOrder}>Proses Order</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
