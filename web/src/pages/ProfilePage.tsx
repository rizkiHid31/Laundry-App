import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/pages/DashboardPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      toast.success('Profil diperbarui');
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Logout dari akun?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Profil Saya</h1>
      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{user.firstName} {user.lastName}</CardTitle>
            <Badge>{user.role}</Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
            <p><span className="text-muted-foreground">Verifikasi:</span> {user.isVerified ? '✓ Terverifikasi' : 'Belum'}</p>
            {!user.isVerified && (
              <Link to="/verify-email" className="text-primary text-sm hover:underline">Verifikasi ulang</Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Edit Profil</CardTitle></CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={save} className="space-y-3">
                <div><Label>Nama Depan</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                <div><Label>Nama Belakang</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
                <div><Label>Telepon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>Simpan</Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Batal</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm">Telepon: {user.phone || '-'}</p>
                <Button variant="outline" onClick={() => setEditing(true)}>Edit Profil</Button>
                {user.role === 'CUSTOMER' && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/addresses">Kelola Alamat</Link>
                  </Button>
                )}
                <Button variant="destructive" className="w-full" onClick={handleLogout}>Logout</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
