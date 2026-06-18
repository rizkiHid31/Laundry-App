import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/pages/DashboardPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type Outlet = {
  id: string;
  name: string;
  city: string;
  serviceRadiusKm: number;
  isActive: boolean;
};

export default function SuperAdminDashboard() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [form, setForm] = useState({
    name: '', address: '', city: '', province: '', postalCode: '',
    latitude: '', longitude: '', serviceRadiusKm: '15',
  });

  const load = async () => {
    const res = await apiFetch<{ items: Outlet[] }>('/api/admin/outlets');
    setOutlets(res.data?.items || []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    await apiFetch('/api/admin/outlets', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        latitude: Number(form.latitude) || null,
        longitude: Number(form.longitude) || null,
        serviceRadiusKm: Number(form.serviceRadiusKm),
      }),
    });
    toast.success('Outlet dibuat');
    setForm({ name: '', address: '', city: '', province: '', postalCode: '', latitude: '', longitude: '', serviceRadiusKm: '15' });
    load();
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Super Admin</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tambah Outlet</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(['name', 'address', 'city', 'province', 'postalCode', 'latitude', 'longitude', 'serviceRadiusKm'] as const).map((f) => (
              <div key={f}>
                <Label className="capitalize">{f}</Label>
                <Input value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
              </div>
            ))}
            <Button className="w-full mt-2" onClick={create}>Simpan Outlet</Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {outlets.map((o) => (
            <Card key={o.id}>
              <CardContent className="pt-6">
                <p className="font-medium">{o.name}</p>
                <p className="text-sm text-muted-foreground">{o.city} · Radius {o.serviceRadiusKm} km</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
