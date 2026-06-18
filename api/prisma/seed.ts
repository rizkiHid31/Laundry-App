import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data (optional - be careful in production!)
  // await prisma.$executeRawUnsafe('TRUNCATE TABLE "public"."User" CASCADE;');

  // ─── CREATE USERS ───────────────────────────────────────────────────────────

  console.log("👥 Creating users...");

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@laundry.com" },
    update: {},
    create: {
      email: "admin@laundry.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "Laundry",
      phone: "08123456789",
      role: "SUPER_ADMIN",
      isVerified: true,
      loginProvider: "email",
    },
  });
  console.log("✓ Admin user created:", adminUser.id);

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Doe",
      phone: "08523456789",
      role: "CUSTOMER",
      isVerified: true,
      loginProvider: "email",
    },
  });
  console.log("✓ Customer user created:", customerUser.id);

  // ─── CREATE OUTLETS (before staff with outletId) ────────────────────────────

  console.log("🏪 Creating outlets...");

  const outlet1 = await prisma.outlet.upsert({
    where: { id: "outlet-1" },
    update: {},
    create: {
      id: "outlet-1",
      name: "Laundry Express - Pusat",
      address: "Jl. Merdeka No. 123",
      city: "Jakarta",
      province: "DKI Jakarta",
      postalCode: "12000",
      phone: "021-1234567",
      email: "pusat@laundry.com",
      latitude: -6.2088,
      longitude: 106.8456,
      serviceRadiusKm: 20,
      openingHours: "07:00",
      closingHours: "21:00",
      isActive: true,
    },
  });
  console.log("✓ Outlet 1 created:", outlet1.id);

  const outlet2 = await prisma.outlet.upsert({
    where: { id: "outlet-2" },
    update: {},
    create: {
      id: "outlet-2",
      name: "Laundry Express - Bintaro",
      address: "Jl. Raya Bintaro Jaya No. 456",
      city: "Tangerang",
      province: "Banten",
      postalCode: "15311",
      phone: "021-7654321",
      email: "bintaro@laundry.com",
      latitude: -6.3156,
      longitude: 106.7331,
      serviceRadiusKm: 20,
      openingHours: "07:00",
      closingHours: "21:00",
      isActive: true,
    },
  });
  console.log("✓ Outlet 2 created:", outlet2.id);

  const outletAdminUser = await prisma.user.upsert({
    where: { email: "outlet.admin@laundry.com" },
    update: { outletId: "outlet-1" },
    create: {
      email: "outlet.admin@laundry.com",
      password: hashedPassword,
      firstName: "Outlet",
      lastName: "Manager",
      phone: "08223456789",
      role: "OUTLET_ADMIN",
      outletId: "outlet-1",
      isVerified: true,
      loginProvider: "email",
    },
  });
  console.log("✓ Outlet admin user created:", outletAdminUser.id);

  const workerUser = await prisma.user.upsert({
    where: { email: "worker@laundry.com" },
    update: { outletId: "outlet-1", workerType: "WASHING" },
    create: {
      email: "worker@laundry.com",
      password: hashedPassword,
      firstName: "Pekerja",
      lastName: "Cucian",
      phone: "08323456789",
      role: "WORKER",
      workerType: "WASHING",
      outletId: "outlet-1",
      isVerified: true,
      loginProvider: "email",
    },
  });
  console.log("✓ Worker user created:", workerUser.id);

  const driverUser = await prisma.user.upsert({
    where: { email: "driver@laundry.com" },
    update: {},
    create: {
      email: "driver@laundry.com",
      password: hashedPassword,
      firstName: "Sopir",
      lastName: "Pickup",
      phone: "08423456789",
      role: "DRIVER",
      isVerified: true,
      loginProvider: "email",
    },
  });
  console.log("✓ Driver user created:", driverUser.id);

  // ─── CREATE STATIONS ────────────────────────────────────────────────────────

  console.log("🏢 Creating stations...");

  const station1 = await prisma.station.upsert({
    where: { id: "station-1" },
    update: {},
    create: {
      id: "station-1",
      outletId: outlet1.id,
      name: "Wash Station 1",
      stationType: "WASHING",
      description: "Mesin cuci premium kapasitas tinggi",
      capacity: 50,
    },
  });
  console.log("✓ Station 1 created:", station1.id);

  const station2 = await prisma.station.upsert({
    where: { id: "station-2" },
    update: {},
    create: {
      id: "station-2",
      outletId: outlet1.id,
      name: "Iron Station 1",
      stationType: "IRONING",
      description: "Area pengeringan dengan mesin pengering",
      capacity: 40,
    },
  });
  console.log("✓ Station 2 created:", station2.id);

  // ─── CREATE ADDRESSES ───────────────────────────────────────────────────────

  console.log("📍 Creating customer addresses...");

  const address1 = await prisma.address.upsert({
    where: { id: "address-1" },
    update: {},
    create: {
      id: "address-1",
      userId: customerUser.id,
      label: "Rumah",
      street: "Jl. Sudirman No. 789",
      city: "Jakarta",
      province: "DKI Jakarta",
      postalCode: "12190",
      latitude: -6.2191,
      longitude: 106.8004,
      isDefault: true,
    },
  });
  console.log("✓ Address 1 created:", address1.id);

  // ─── CREATE SHIFTS ──────────────────────────────────────────────────────────

  console.log("⏰ Creating shifts...");

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const shift1 = await prisma.shift.create({
    data: {
      workerId: workerUser.id,
      stationId: station1.id,
      shiftDate: today,
      startTime: "07:00",
      endTime: "15:00",
      status: "PRESENT",
      notes: "Regular morning shift",
    },
  });
  console.log("✓ Shift 1 created:", shift1.id);

  // ─── CREATE DRIVER ──────────────────────────────────────────────────────────

  console.log("🚗 Creating driver info...");

  const driver = await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: { outletId: outlet1.id },
    create: {
      userId: driverUser.id,
      outletId: outlet1.id,
      phone: "08423456789",
      vehicle: "Avanza KA 1234",
      licenseNumber: "DK12AB123456",
      isActive: true,
    },
  });
  console.log("✓ Driver created:", driver.id);

  // ─── CREATE ORDERS ──────────────────────────────────────────────────────────

  console.log("📦 Creating orders...");

  const order1 = await prisma.order.create({
    data: {
      invoiceNumber: "INV-SEED-001",
      userId: customerUser.id,
      outletId: outlet1.id,
      totalKilo: 5.5,
      status: "WAITING_PAYMENT",
      totalPrice: 27500,
      isPaid: false,
      paymentMethod: "CASH",
      estimatedDeliveryDate: tomorrow,
      notes: "Express service",
      items: {
        create: [
          {
            itemType: "Kaos",
            quantity: 10,
            weight: 2.0,
            price: 15000,
          },
          {
            itemType: "Celana Panjang",
            quantity: 5,
            weight: 3.5,
            price: 33000,
          },
        ],
      },
    },
  });
  console.log("✓ Order 1 created:", order1.id);

  // ─── CREATE PAYMENTS ────────────────────────────────────────────────────────

  console.log("💳 Creating payments...");

  const payment1 = await prisma.payment.create({
    data: {
      orderId: order1.id,
      userId: customerUser.id,
      amount: 27500,
      status: "PENDING",
      method: "CASH",
      transactionId: "TXN001",
      notes: "Payment pending - will collect on pickup",
    },
  });
  console.log("✓ Payment 1 created:", payment1.id);

  // ─── CREATE PICKUP REQUEST ──────────────────────────────────────────────────

  console.log("🚚 Creating pickup requests...");

  const pickupRequest = await prisma.pickupRequest.create({
    data: {
      userId: customerUser.id,
      addressId: address1.id,
      outletId: outlet1.id,
      orderId: order1.id,
      driverId: driver.id,
      pickupAddress: "Jl. Sudirman No. 789",
      pickupCity: "Jakarta",
      pickupProvince: "DKI Jakarta",
      pickupPostalCode: "12190",
      latitude: -6.2191,
      longitude: 106.8004,
      status: "ARRIVED_AT_OUTLET",
      notes: "Please call before pickup",
      estimatedPickupTime: tomorrow,
    },
  });
  console.log("✓ Pickup request created:", pickupRequest.id);

  // ─── CREATE REQUESTS/BYPASS ─────────────────────────────────────────────────

  console.log("📋 Creating requests...");

  const request1 = await prisma.request.create({
    data: {
      userId: customerUser.id,
      type: "RUSH_ORDER",
      description: "Need laundry done in 24 hours for special event",
      status: "PENDING",
    },
  });
  console.log("✓ Request 1 created:", request1.id);

  console.log("\n✅ Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`  Users: 5 (1 admin, 1 outlet manager, 1 worker, 1 driver, 1 customer)`);
  console.log(`  Outlets: 2`);
  console.log(`  Stations: 2`);
  console.log(`  Addresses: 1`);
  console.log(`  Shifts: 1`);
  console.log(`  Drivers: 1`);
  console.log(`  Orders: 1`);
  console.log(`  Order Items: 2`);
  console.log(`  Payments: 1`);
  console.log(`  Pickup Requests: 1`);
  console.log(`  Requests: 1`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
