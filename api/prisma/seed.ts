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
