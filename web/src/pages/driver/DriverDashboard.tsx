import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { STATUS_LABELS } from '@/lib/validations';
import { AppShell } from '@/pages/DashboardPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Pickup = {
  id: string;
  status: string;
  pickupAddress: string;
  requestType: string;
  order?: { invoiceNumber: string };
  user?: { firstName: string; lastName: string };
};

export default function DriverDashboard() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [deliveries, setDeliveries] = useState<Pickup[]>([]);

  const load = async () => {
    const [p, d] = await Promise.all([
      apiFetch<Pickup[]>('/api/pickups/driver'),
      apiFetch<Pickup[]>('/api/pickups/deliveries'),
    ]);
    setPickups(p.data || []);
    setDeliveries(d.data || []);
  };

  useEffect(() => { load(); }, []);

  const action = async (path: string, msg: string) => {
    await apiFetch(path, { method: 'POST' });
    toast.success(msg);
    load();
  };

  const renderList = (items: Pickup[], type: 'pickup' | 'delivery') => (
    <div className="space-y-3">
      {items.map((p) => (
        <Card key={p.id}>
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6">
            <div>
              <p className="font-medium">{p.order?.invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">{p.pickupAddress}</p>
              <Badge className="mt-1">{STATUS_LABELS[p.status] || p.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {type === 'pickup' && p.status === 'WAITING_DRIVER_PICKUP' && (
                <Button size="sm" onClick={() => action(`/api/pickups/${p.id}/accept`, 'Pickup diterima')}>Ambil</Button>
              )}
              {type === 'pickup' && p.status !== 'WAITING_DRIVER_PICKUP' && p.status !== 'ARRIVED_AT_OUTLET' && (
                <>
                  <Button size="sm" variant="outline" onClick={() => action(`/api/pickups/${p.id}/picked-up`, 'Laundry diambil')}>Sudah Diambil</Button>
                  <Button size="sm" onClick={() => action(`/api/pickups/${p.id}/arrived`, 'Sampai outlet')}>Sampai Outlet</Button>
                </>
              )}
              {type === 'delivery' && p.status === 'READY_FOR_DELIVERY' && (
                <Button size="sm" onClick={() => action(`/api/pickups/deliveries/${p.id}/accept`, 'Delivery diterima')}>Ambil</Button>
              )}
              {type === 'delivery' && p.status === 'DELIVERING' && (
                <Button size="sm" variant="outline" onClick={() => action(`/api/pickups/deliveries/${p.id}/complete`, 'Selesai kirim')}>Selesai</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {!items.length && <p className="text-muted-foreground text-center py-8">Tidak ada request</p>}
    </div>
  );

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Dashboard Driver</h1>
      <h2 className="font-semibold mb-3">Pickup Request</h2>
      {renderList(pickups, 'pickup')}
      <h2 className="font-semibold mb-3 mt-8">Delivery Request</h2>
      {renderList(deliveries, 'delivery')}
    </AppShell>
  );
}
