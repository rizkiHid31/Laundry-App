import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema } from '@/lib/validations';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/pages/DashboardPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from '@/context/LocationContext';
import { z } from 'zod';
import { toast } from 'sonner';
import { MapPin, Trash2, Star } from 'lucide-react';

type AddressForm = z.infer<typeof addressSchema>;
type Address = AddressForm & { id: string; isDefault: boolean };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const { latitude, longitude, granted, requestLocation } = useLocation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  const load = async () => {
    const res = await apiFetch<Address[]>('/api/addresses');
    setAddresses(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data: AddressForm) => {
    if (!granted || !latitude || !longitude) {
      toast.error('Izinkan akses lokasi terlebih dahulu');
      requestLocation();
      return;
    }
    await apiFetch('/api/addresses', {
      method: 'POST',
      body: JSON.stringify({ ...data, latitude, longitude }),
    });
    toast.success('Alamat ditambahkan');
    reset();
    load();
  };

  const setDefault = async (id: string) => {
    await apiFetch(`/api/addresses/${id}/default`, { method: 'PATCH' });
    toast.success('Alamat utama diperbarui');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus alamat ini?')) return;
    await apiFetch(`/api/addresses/${id}`, { method: 'DELETE' });
    toast.success('Alamat dihapus');
    load();
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Kelola Alamat</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tambah Alamat</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div><Label>Label</Label><Input {...register('label')} placeholder="Rumah" /></div>
              <div><Label>Alamat</Label><Input {...register('street')} />{errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}</div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Kota</Label><Input {...register('city')} /></div>
                <div><Label>Provinsi</Label><Input {...register('province')} /></div>
              </div>
              <div><Label>Kode Pos</Label><Input {...register('postalCode')} /></div>
              {!granted && (
                <p className="text-xs text-amber-600">Izinkan lokasi agar pickup bisa menemukan outlet terdekat.</p>
              )}
              <Button type="submit" className="w-full">Simpan Alamat</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {addresses.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start justify-between pt-6">
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{a.label || 'Alamat'} {a.isDefault && <Star className="inline h-4 w-4 text-yellow-500" />}</p>
                    <p className="text-sm text-muted-foreground">{a.street}, {a.city}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!a.isDefault && <Button size="sm" variant="ghost" onClick={() => setDefault(a.id)}>Utama</Button>}
                  <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
