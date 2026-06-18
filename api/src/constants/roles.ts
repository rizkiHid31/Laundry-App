export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  SUPER_ADMIN: 'SUPER_ADMIN',
  OUTLET_ADMIN: 'OUTLET_ADMIN',
  WORKER: 'WORKER',
  DRIVER: 'DRIVER',
} as const;

export const WORKER_TYPES = {
  WASHING: 'WASHING',
  IRONING: 'IRONING',
  PACKING: 'PACKING',
} as const;

export const ITEM_TYPES = [
  'Kaos',
  'Celana Panjang',
  'Celana Pendek',
  'Celana Dalam',
  'Kemeja',
  'Jaket',
  'Handuk',
  'Selimut',
] as const;
