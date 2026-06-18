import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/pages/DashboardPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const ITEM_TYPES = ['Kaos', 'Celana Panjang', 'Celana Pendek', 'Celana Dalam', 'Kemeja'];

type Order = {
  id: string;
  invoiceNumber: string;
  status: string;
  items: { itemType: string; quantity: number }[];
};

export default function WorkerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [bypassReason, setBypassReason] = useState('');

  const load = async () => {
    const res = await apiFetch<Order[]>('/api/orders/worker/list');
    setOrders(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const selectOrder = (o: Order) => {
    setSelected(o);
    const q: Record<string, number> = {};
    o.items.forEach((i) => { q[i.itemType] = i.quantity; });
    setQuantities(q);
  };

  const process = async () => {
    if (!selected) return;
    const items = Object.entries(quantities).map(([itemType, quantity]) => ({ itemType, quantity }));
    try {
      await apiFetch('/api/orders/worker/process', {
        method: 'POST',
        body: JSON.stringify({ orderId: selected.id, items }),
      });
      toast.success('Station selesai!');
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal proses');
    }
  };

  const requestBypass = async () => {
    if (!selected || !bypassReason) return;
    await apiFetch('/api/orders/worker/bypass', {
      method: 'POST',
      body: JSON.stringify({ orderId: selected.id, reason: bypassReason }),
    });
    toast.success('Bypass request dikirim ke admin');
    setBypassReason('');
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Worker Station</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          {orders.map((o) => (
            <Card key={o.id} className="cursor-pointer hover:shadow-md" onClick={() => selectOrder(o)}>
              <CardContent className="pt-6">
                <p className="font-medium">{o.invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">{o.items.length} jenis item</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {selected && (
          <Card>
            <CardHeader><CardTitle>{selected.invoiceNumber}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ITEM_TYPES.filter((t) => quantities[t] !== undefined || selected.items.find((i) => i.itemType === t)).map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Label className="flex-1">{type}</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={quantities[type] || 0}
                    onChange={(e) => setQuantities({ ...quantities, [type]: Number(e.target.value) })}
                  />
                  <span className="text-sm">pcs</span>
                </div>
              ))}
              <Button className="w-full" onClick={process}>Selesai Station</Button>
              <div className="border-t pt-3 space-y-2">
                <Label>Request Bypass (qty tidak sesuai)</Label>
                <Textarea value={bypassReason} onChange={(e) => setBypassReason(e.target.value)} />
                <Button variant="outline" className="w-full" onClick={requestBypass}>Ajukan Bypass</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
