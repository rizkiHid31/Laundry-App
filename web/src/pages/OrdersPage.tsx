import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { STATUS_LABELS } from '@/lib/validations';
import { AppShell } from '@/pages/DashboardPage';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

type Order = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalPrice: number;
  isPaid: boolean;
  createdAt: string;
};

type Paginated = { items: Order[]; pagination: { page: number; totalPages: number; total: number } };

export default function OrdersPage() {
  const [data, setData] = useState<Paginated | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    const params = new URLSearchParams({ page: String(page), limit: '10', search });
    const res = await apiFetch<Paginated>(`/api/orders/my?${params}`);
    setData(res.data || null);
  };

  useEffect(() => { load(); }, [page, search]);

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Pesanan Saya</h1>
        <Input
          placeholder="Cari no invoice..."
          className="max-w-xs"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="space-y-3">
        {data?.items.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`}>
            <Card className="hover:shadow-md transition">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="font-semibold">{o.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(o.createdAt), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={o.isPaid ? 'success' : 'warning'}>
                    {STATUS_LABELS[o.status] || o.status}
                  </Badge>
                  <p className="text-sm font-medium mt-1">Rp {o.totalPrice.toLocaleString('id-ID')}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!data?.items.length && (
          <p className="text-center text-muted-foreground py-12">Belum ada pesanan</p>
        )}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span className="py-2 text-sm">{page} / {data.pagination.totalPages}</span>
          <Button variant="outline" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </AppShell>
  );
}
