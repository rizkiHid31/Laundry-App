<<<<<<< Updated upstream
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, WorkerStation, OrderStatus, PickupStatus, StationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ─── Super Admin ───────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "superadmin@laundry.com" },
    update: {},
    create: {
      email: "superadmin@laundry.com",
      passwordHash: await bcrypt.hash("Admin123!", 10),
      name: "Super Admin",
      role: Role.SUPER_ADMIN,
      isVerified: true,
    },
=======
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function seeder() {
  console.log('🌱 Seeding test data...');

  // ── Outlet ───────────────────────────────────────────────────────────────
  const outlet = await prisma.outlet.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Outlet Pusat',
      address: 'Jl. Sudirman No. 1, Jakarta',
      latitude: -6.2088,
      longitude: 106.8456,
      radiusKm: 10,
    },
  });
  console.log('  ✔ Outlet:', outlet.name);

  // ── Users ────────────────────────────────────────────────────────────────
  const pw = await hash('Password123!');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@laundry.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      email: 'superadmin@laundry.test',
      firstName: 'Super',
      lastName: 'Admin',
      password: pw,
      isVerified: true,
      role: 'SUPER_ADMIN',
      loginProvider: 'email',
    },
  });

  const outletAdminUser = await prisma.user.upsert({
    where: { email: 'admin@laundry.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      email: 'admin@laundry.test',
      firstName: 'Outlet',
      lastName: 'Admin',
      password: pw,
      isVerified: true,
      role: 'OUTLET_ADMIN',
      loginProvider: 'email',
    },
  });

  const workerUser = await prisma.user.upsert({
    where: { email: 'worker@laundry.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000012',
      email: 'worker@laundry.test',
      firstName: 'Budi',
      lastName: 'Worker',
      password: pw,
      isVerified: true,
      role: 'WORKER',
      loginProvider: 'email',
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@laundry.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000013',
      email: 'driver@laundry.test',
      firstName: 'Andi',
      lastName: 'Driver',
      password: pw,
      isVerified: true,
      role: 'DRIVER',
      loginProvider: 'email',
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@laundry.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000014',
      email: 'customer@laundry.test',
      firstName: 'Sari',
      lastName: 'Customer',
      password: pw,
      isVerified: true,
      role: 'CUSTOMER',
      loginProvider: 'email',
    },
  });

  console.log('  ✔ Users created');

  // ── OutletEmployees ───────────────────────────────────────────────────────
  const adminEmp = await prisma.outletEmployee.upsert({
    where: { outletId_userId: { outletId: outlet.id, userId: outletAdminUser.id } },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      outletId: outlet.id,
      userId: outletAdminUser.id,
      isActive: true,
    },
  });

  const workerEmp = await prisma.outletEmployee.upsert({
    where: { outletId_userId: { outletId: outlet.id, userId: workerUser.id } },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000021',
      outletId: outlet.id,
      userId: workerUser.id,
      isActive: true,
    },
  });

  const driverEmp = await prisma.outletEmployee.upsert({
    where: { outletId_userId: { outletId: outlet.id, userId: driverUser.id } },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000022',
      outletId: outlet.id,
      userId: driverUser.id,
      isActive: true,
    },
  });

  console.log('  ✔ OutletEmployees linked');

  // ── LaundryItems ──────────────────────────────────────────────────────────
  const shirt = await prisma.laundryItem.upsert({
    where: { name: 'Kemeja' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000030', name: 'Kemeja', unit: 'pcs' },
  });

  const pants = await prisma.laundryItem.upsert({
    where: { name: 'Celana' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000031', name: 'Celana', unit: 'pcs' },
  });

  console.log('  ✔ LaundryItems created');

  // ── Customer Address ──────────────────────────────────────────────────────
  const address = await prisma.address.upsert({
    where: { id: '00000000-0000-0000-0000-000000000040' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000040',
      userId: customerUser.id,
      label: 'Rumah',
      fullAddress: 'Jl. Kebon Jeruk No. 5, Jakarta Barat',
      latitude: -6.1944,
      longitude: 106.7895,
      isPrimary: true,
    },
  });

  console.log('  ✔ Customer address created');

  // ── PickupRequest (WAITING_DRIVER) ────────────────────────────────────────
  const pickup = await prisma.pickupRequest.upsert({
    where: { id: '00000000-0000-0000-0000-000000000050' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000050',
      customerId: customerUser.id,
      addressId: address.id,
      outletId: outlet.id,
      scheduledAt: new Date(),
      status: 'WAITING_DRIVER',
    },
  });

  console.log('  ✔ PickupRequest created (status: WAITING_DRIVER) → id:', pickup.id);

  // ── Order in PROCESSING (ready for worker) ────────────────────────────────
  const order = await prisma.order.upsert({
    where: { id: '00000000-0000-0000-0000-000000000060' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000060',
      invoiceNumber: 'INV-TEST-001',
      pickupRequestId: pickup.id,
      outletId: outlet.id,
      outletAdminId: adminEmp.id,
      totalKg: 3.5,
      totalPrice: 35000,
      status: 'PROCESSING',
    },
  });

  // OrderItems
  await prisma.orderItem.upsert({
    where: { id: '00000000-0000-0000-0000-000000000070' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000070',
      orderId: order.id,
      laundryItemId: shirt.id,
      quantity: 3,
      pricePerUnit: 5000,
    },
  });

  await prisma.orderItem.upsert({
    where: { id: '00000000-0000-0000-0000-000000000071' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000071',
      orderId: order.id,
      laundryItemId: pants.id,
      quantity: 2,
      pricePerUnit: 7000,
    },
  });

  // OrderStations: WASHING (PENDING), IRONING (PENDING), PACKING (PENDING)
  await prisma.orderStation.upsert({
    where: { orderId_station: { orderId: order.id, station: 'WASHING' } },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000080',
      orderId: order.id,
      station: 'WASHING',
      status: 'PENDING',
    },
  });

  await prisma.orderStation.upsert({
    where: { orderId_station: { orderId: order.id, station: 'IRONING' } },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000081',
      orderId: order.id,
      station: 'IRONING',
      status: 'PENDING',
    },
  });

  await prisma.orderStation.upsert({
    where: { orderId_station: { orderId: order.id, station: 'PACKING' } },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000082',
      orderId: order.id,
      station: 'PACKING',
      status: 'PENDING',
    },
  });

  console.log('  ✔ Order', order.invoiceNumber, '(PROCESSING) + 3 stations created');

  console.log('\n✅ Seed complete!\n');
  console.log('── Test accounts (password: Password123!) ────────────────────');
  console.log('  SUPER_ADMIN   superadmin@laundry.test');
  console.log('  OUTLET_ADMIN  admin@laundry.test');
  console.log('  WORKER        worker@laundry.test');
  console.log('  DRIVER        driver@laundry.test');
  console.log('  CUSTOMER      customer@laundry.test');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Pickup ID:  ', pickup.id);
  console.log('  Order ID:   ', order.id);
  console.log('  WASHING ID: ', '00000000-0000-0000-0000-000000000080');
  console.log('─────────────────────────────────────────────────────────────');
}

seeder()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
>>>>>>> Stashed changes
  });

  // ─── Outlet ────────────────────────────────────────────────────
  const outlet = await prisma.outlet.upsert({
    where: { id: "outlet-1" },
    update: {},
    create: {
      id: "outlet-1",
      name: "Laundry Bersih Cabang Utama",
      address: "Jl. Sudirman No. 1, Jakarta Pusat",
      latitude: -6.2088,
      longitude: 106.8456,
      maxRadius: 10,
      isActive: true,
    },
  });

  // ─── Outlet Admin ──────────────────────────────────────────────
  const outletAdmin = await prisma.user.upsert({
    where: { email: "admin.outlet@laundry.com" },
    update: {},
    create: {
      email: "admin.outlet@laundry.com",
      passwordHash: await bcrypt.hash("Admin123!", 10),
      name: "Outlet Admin",
      role: Role.OUTLET_ADMIN,
      isVerified: true,
      outletId: outlet.id,
    },
  });

  // ─── Workers ───────────────────────────────────────────────────
  const workerData = [
    { email: "worker.washing@laundry.com", name: "Worker Cuci", station: WorkerStation.WASHING },
    { email: "worker.ironing@laundry.com", name: "Worker Setrika", station: WorkerStation.IRONING },
    { email: "worker.packing@laundry.com", name: "Worker Packing", station: WorkerStation.PACKING },
  ];

  for (const w of workerData) {
    await prisma.user.upsert({
      where: { email: w.email },
      update: {},
      create: {
        email: w.email,
        passwordHash: await bcrypt.hash("Worker123!", 10),
        name: w.name,
        role: Role.WORKER,
        workerStation: w.station,
        isVerified: true,
        outletId: outlet.id,
      },
    });
  }

  // ─── Driver ────────────────────────────────────────────────────
  const driver = await prisma.user.upsert({
    where: { email: "driver@laundry.com" },
    update: {},
    create: {
      email: "driver@laundry.com",
      passwordHash: await bcrypt.hash("Driver123!", 10),
      name: "Driver Satu",
      role: Role.DRIVER,
      isVerified: true,
      outletId: outlet.id,
    },
  });

  // ─── Customer ──────────────────────────────────────────────────
  const customer = await prisma.user.upsert({
    where: { email: "customer@laundry.com" },
    update: {},
    create: {
      email: "customer@laundry.com",
      passwordHash: await bcrypt.hash("Customer123!", 10),
      name: "Customer Demo",
      role: Role.CUSTOMER,
      phone: "08123456789",
      isVerified: true,
    },
  });

  // ─── Customer Address ──────────────────────────────────────────
  const address = await prisma.userAddress.upsert({
    where: { id: "address-1" },
    update: {},
    create: {
      id: "address-1",
      userId: customer.id,
      label: "Rumah",
      address: "Jl. Kebon Jeruk No. 10, Jakarta Barat",
      latitude: -6.1944,
      longitude: 106.7703,
      isPrimary: true,
    },
  });

  // ─── Laundry Items ─────────────────────────────────────────────
  const itemData = [
    { name: "Kaos", unit: "pcs" },
    { name: "Kemeja", unit: "pcs" },
    { name: "Celana Panjang", unit: "pcs" },
    { name: "Celana Pendek", unit: "pcs" },
    { name: "Celana Dalam", unit: "pcs" },
    { name: "Rok", unit: "pcs" },
    { name: "Jaket", unit: "pcs" },
    { name: "Sweater", unit: "pcs" },
    { name: "Dress", unit: "pcs" },
    { name: "Sepatu", unit: "pasang" },
  ];

  const laundryItems: { id: string; name: string }[] = [];
  for (const item of itemData) {
    const created = await prisma.laundryItem.upsert({
      where: { name: item.name },
      update: {},
      create: { name: item.name, unit: item.unit, isActive: true },
    });
    laundryItems.push(created);
  }

  // ─── Sample Pickup Request (arrived, siap diproses) ────────────
  const pickupRequest = await prisma.pickupRequest.upsert({
    where: { id: "pickup-1" },
    update: {},
    create: {
      id: "pickup-1",
      customerId: customer.id,
      addressId: address.id,
      outletId: outlet.id,
      driverId: driver.id,
      scheduledAt: new Date("2026-06-01T09:00:00Z"),
      status: PickupStatus.ARRIVED_AT_OUTLET,
    },
  });

  // ─── Sample Order (status PROCESSING, siap dikerjakan worker) ──
  const order = await prisma.order.upsert({
    where: { invoiceNumber: "INV-20260601-000001" },
    update: {},
    create: {
      invoiceNumber: "INV-20260601-000001",
      pickupRequestId: pickupRequest.id,
      outletId: outlet.id,
      outletAdminId: outletAdmin.id,
      totalWeight: 3.5,
      pricePerKg: 7000,
      totalPrice: 24500,
      status: OrderStatus.PROCESSING,
      notes: "Pisahkan baju putih",
    },
  });

  // ─── Order Items ───────────────────────────────────────────────
  const orderItemsData = [
    { laundryItemId: laundryItems[0].id, quantity: 3 }, // Kaos
    { laundryItemId: laundryItems[1].id, quantity: 2 }, // Kemeja
    { laundryItemId: laundryItems[2].id, quantity: 2 }, // Celana Panjang
  ];

  for (const item of orderItemsData) {
    await prisma.orderItem.upsert({
      where: { id: `orderitem-${item.laundryItemId}` },
      update: {},
      create: {
        id: `orderitem-${item.laundryItemId}`,
        orderId: order.id,
        laundryItemId: item.laundryItemId,
        quantity: item.quantity,
      },
    });
  }

  // ─── Order Stations (3 stasiun, semua PENDING) ─────────────────
  const stations = [WorkerStation.WASHING, WorkerStation.IRONING, WorkerStation.PACKING];
  for (const station of stations) {
    await prisma.orderStation.upsert({
      where: { orderId_station: { orderId: order.id, station } },
      update: {},
      create: {
        orderId: order.id,
        station,
        status: StationStatus.PENDING,
      },
    });
  }

  console.log("Seed completed.");
  console.log("─────────────────────────────────");
  console.log("Akun tersedia:");
  console.log("  Super Admin   : superadmin@laundry.com  / Admin123!");
  console.log("  Outlet Admin  : admin.outlet@laundry.com / Admin123!");
  console.log("  Worker Cuci   : worker.washing@laundry.com / Worker123!");
  console.log("  Worker Setrika: worker.ironing@laundry.com / Worker123!");
  console.log("  Worker Packing: worker.packing@laundry.com / Worker123!");
  console.log("  Driver        : driver@laundry.com       / Driver123!");
  console.log("  Customer      : customer@laundry.com     / Customer123!");
  console.log("─────────────────────────────────");
  console.log("Sample order INV-20260601-000001 siap diproses worker.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
