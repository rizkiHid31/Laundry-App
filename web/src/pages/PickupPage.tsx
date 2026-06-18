import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/pages/DashboardPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Truck } from 'lucide-react';

type Address = { id: string; label?: string; street: string; city: string; isDefault: boolean };

export default function PickupPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch<Address[]>('/api/addresses').then((r) => {
      const list = r.data || [];
      setAddresses(list);
      const def = list.find((a) => a.isDefault) || list[0];
      if (def) setAddressId(def.id);
    });
  }, []);

  const submit = async () => {
    if (!addressId) return toast.error('Pilih alamat terlebih dahulu');
    setLoading(true);
    try {
      await apiFetch('/api/pickups', {
        method: 'POST',
        body: JSON.stringify({ addressId, scheduledAt, notes }),
      });
      toast.success('Request pickup berhasil!');
      navigate('/orders');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membuat pickup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Truck className="h-7 w-7 text-primary" /> Request Pickup
      </h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Jadwal Penjemputan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Alamat Penjemputan</Label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={addressId}
              onChange={(e) => setAddressId(e.target.value)}
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label || 'Alamat'} - {a.street}, {a.city}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Jadwal (opsional)</Label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div>
            <Label>Catatan</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instruksi khusus..." />
          </div>
          <Button className="w-full" onClick={submit} disabled={loading}>
            {loading ? 'Memproses...' : 'Buat Request Pickup'}
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
