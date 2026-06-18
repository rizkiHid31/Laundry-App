import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import Navbar from './Navbar2';
import Hero from './Hero';
import Footer from './Footer';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { granted, loading, error, requestLocation } = useLocation();

  const startOrder = () => {
    if (!isAuthenticated) return navigate('/register');
    if (!user?.isVerified) return navigate('/check-email');
    navigate('/pickup');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {!loading && !granted && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-xl border bg-card p-4 shadow-lg sm:left-auto sm:right-4">
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Izinkan akses lokasi</p>
              <p className="text-xs text-muted-foreground mt-1">
                Kami membutuhkan lokasi Anda untuk menemukan outlet laundry terdekat.
              </p>
              {error && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {error}
                </p>
              )}
              <Button size="sm" className="mt-2" onClick={requestLocation}>
                Izinkan Lokasi
              </Button>
            </div>
          </div>
        </div>
      )}

      <Hero onCta={startOrder} />

      <section id="services" className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Cara Kerja</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            ['1', 'Request Pickup', 'Pilih alamat & jadwal penjemputan'],
            ['2', 'Proses Laundry', 'Dicuci, disetrika & di-packing'],
            ['3', 'Bayar & Lacak', 'Pantau status & bayar online'],
            ['4', 'Antar ke Rumah', 'Laundry dikirim ke alamat Anda'],
          ].map(([n, t, d]) => (
            <div key={n} className="text-center p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto mb-3">{n}</div>
              <h3 className="font-semibold mb-1">{t}</h3>
              <p className="text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Harga Transparan</h2>
          <p className="text-muted-foreground mb-8">Mulai dari Rp 5.000/kg · Gratis pickup & delivery</p>
          <Button size="lg" onClick={startOrder}>Mulai Laundry Sekarang</Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
