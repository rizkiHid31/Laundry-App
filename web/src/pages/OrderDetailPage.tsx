import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { STATUS_LABELS } from '@/lib/validations';
import { AppShell } from '@/pages/DashboardPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type Order = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalKilo: number;
  totalPrice: number;
  isPaid: boolean;
  items: { itemType: string; quantity: number }[];
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [complaint, setComplaint] = useState({ type: 'QUALITY', description: '' });

  const load = async () => {
    const res = await apiFetch<Order>(`/api/orders/${id}`);
    setOrder(res.data || null);
  };

  useEffect(() => { load(); }, [id]);

  const pay = async () => {
    const res = await apiFetch<{ payment: { id: string } }>('/api/payments', {
      method: 'POST',
      body: JSON.stringify({ orderId: id, method: 'E_WALLET' }),
    });
    await apiFetch(`/api/payments/${res.data?.payment.id}/confirm`, { method: 'POST' });
    toast.success('Pembayaran berhasil!');
    load();
  };

  const confirm = async () => {
    await apiFetch(`/api/orders/${id}/confirm`, { method: 'POST' });
    toast.success('Pesanan dikonfirmasi diterima');
    load();
  };

  const submitComplaint = async () => {
    await apiFetch('/api/admin/complaints', {
      method: 'POST',
      body: JSON.stringify({ orderId: id, ...complaint }),
    });
    toast.success('Komplain terkirim');
    setComplaint({ type: 'QUALITY', description: '' });
  };

  if (!order) return <AppShell><p>Memuat...</p></AppShell>;

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{order.invoiceNumber}</h1>
        <Badge className="mt-2">{STATUS_LABELS[order.status] || order.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Detail Item</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.itemType}</span>
                <span>{item.quantity} pcs</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>{order.totalKilo} kg</span>
              <span>Rp {order.totalPrice.toLocaleString('id-ID')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Aksi</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {order.status === 'WAITING_PAYMENT' && !order.isPaid && (
              <Button className="w-full" onClick={pay}>Bayar Sekarang</Button>
            )}
            {order.status === 'DELIVERED' && (
              <Button className="w-full" onClick={confirm}>Konfirmasi Diterima</Button>
            )}
            {['DELIVERED', 'COMPLETED'].includes(order.status) && (
              <div className="space-y-2 pt-4 border-t">
                <Label>Ajukan Komplain</Label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={complaint.type}
                  onChange={(e) => setComplaint({ ...complaint, type: e.target.value })}
                >
                  <option value="QUALITY">Kualitas tidak sesuai</option>
                  <option value="DAMAGE">Kerusakan</option>
                  <option value="LOSS">Kehilangan</option>
                </select>
                <Textarea
                  value={complaint.description}
                  onChange={(e) => setComplaint({ ...complaint, description: e.target.value })}
                  placeholder="Jelaskan masalah..."
                />
                <Button variant="outline" className="w-full" onClick={submitComplaint}>Kirim Komplain</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
