export const ORDER_STATUS = {
  WAITING_DRIVER_PICKUP: 'WAITING_DRIVER_PICKUP',
  LAUNDRY_TO_OUTLET: 'LAUNDRY_TO_OUTLET',
  ARRIVED_AT_OUTLET: 'ARRIVED_AT_OUTLET',
  WASHING: 'WASHING',
  IRONING: 'IRONING',
  PACKING: 'PACKING',
  WAITING_PAYMENT: 'WAITING_PAYMENT',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  DELIVERING: 'DELIVERING',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const STATUS_LABELS: Record<string, string> = {
  WAITING_DRIVER_PICKUP: 'Menunggu Penjemputan Driver',
  LAUNDRY_TO_OUTLET: 'Laundry Sedang Menuju Outlet',
  ARRIVED_AT_OUTLET: 'Laundry Telah Sampai Outlet',
  WASHING: 'Laundry Sedang Dicuci',
  IRONING: 'Laundry Sedang Disetrika',
  PACKING: 'Laundry Sedang Di Packing',
  WAITING_PAYMENT: 'Menunggu Pembayaran',
  READY_FOR_DELIVERY: 'Laundry Siap Diantar',
  DELIVERING: 'Laundry Sedang Dikirim Menuju Customer',
  DELIVERED: 'Laundry Telah Diterima Customer',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const STATION_FLOW = ['WASHING', 'IRONING', 'PACKING'] as const;

export const PRICE_PER_KG = 5000;
