import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  firstName: z.string().min(2, 'Nama minimal 2 karakter'),
  lastName: z.string().optional(),
});

export const addressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(5, 'Alamat terlalu pendek'),
  city: z.string().min(2),
  province: z.string().min(2),
  postalCode: z.string().regex(/^\d{5}$/, 'Kode pos 5 digit'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().optional(),
});

export const pickupSchema = z.object({
  addressId: z.string().min(1),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
});

export const STATUS_LABELS: Record<string, string> = {
  WAITING_DRIVER_PICKUP: 'Menunggu Penjemputan Driver',
  LAUNDRY_TO_OUTLET: 'Laundry Menuju Outlet',
  ARRIVED_AT_OUTLET: 'Laundry Sampai Outlet',
  WASHING: 'Sedang Dicuci',
  IRONING: 'Sedang Disetrika',
  PACKING: 'Sedang Di Packing',
  WAITING_PAYMENT: 'Menunggu Pembayaran',
  READY_FOR_DELIVERY: 'Siap Diantar',
  DELIVERING: 'Sedang Dikirim',
  DELIVERED: 'Telah Diterima',
  COMPLETED: 'Selesai',
};
