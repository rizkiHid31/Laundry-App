import {
  PrismaClient,
  RoleScope,
  StationName,
  StationStatus,
  PickupStatus,
  DeliveryStatus,
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/utils/password";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
export const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Demo1234!";

const TABLES = [
  "notifications",
  "complaints",
  "payments",
  "station_items",
  "bypass_requests",
  "order_stations",
  "order_items",
  "delivery_requests",
  "orders",
  "pickup_requests",
  "outlet_item_prices",
  "laundry_items",
  "shifts",
  "outlet_employees",
  "addresses",
  "user_roles",
  "role_permissions",
  "permissions",
  "roles",
  "oauth_accounts",
  "verification_tokens",
  "users",
  "outlets",
];

async function truncateAll() {
  const quoted = TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
}

async function seeder() {
  console.log("Truncating all tables...");
  await truncateAll();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  console.log("Creating roles...");
  const roleDefs = [
    { name: "customer", scope: RoleScope.GLOBAL },
    { name: "worker", scope: RoleScope.OUTLET },
    { name: "driver", scope: RoleScope.OUTLET },
    { name: "outlet_admin", scope: RoleScope.OUTLET },
  ];
  const roles: Record<string, { id: string }> = {};
  for (const r of roleDefs) {
    roles[r.name] = await prisma.role.create({ data: r });
  }

  console.log("Creating outlet...");
  const outlet = await prisma.outlet.create({
    data: {
      name: "Outlet Demo - Kemang",
      address: "Jl. Kemang Raya No. 1, Jakarta Selatan",
      latitude: -6.2608,
      longitude: 106.8133,
    },
  });

  console.log("Creating laundry items...");
  const kaos = await prisma.laundryItem.create({ data: { name: "Kaos", unit: "pcs" } });
  const celana = await prisma.laundryItem.create({ data: { name: "Celana", unit: "pcs" } });
  await prisma.outletItemPrice.createMany({
    data: [
      { outletId: outlet.id, laundryItemId: kaos.id, pricePerUnit: 5000 },
      { outletId: outlet.id, laundryItemId: celana.id, pricePerUnit: 7000 },
    ],
  });

  console.log("Creating customers...");
  const customerNames = ["Budi Santoso", "Siti Aminah", "Rian Pratama"];
  const customers: { userId: string; addressId: string; email: string }[] = [];
  for (let i = 0; i < customerNames.length; i++) {
    const email = `customer${i + 1}@demo.com`;
    const user = await prisma.user.create({
      data: { name: customerNames[i], email, passwordHash, isVerified: true },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: roles.customer.id } });
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label: "Rumah",
        fullAddress: `Jl. Demo No. ${i + 1}, Jakarta Selatan`,
        latitude: -6.26 + i * 0.001,
        longitude: 106.81 + i * 0.001,
        isPrimary: true,
      },
    });
    customers.push({ userId: user.id, addressId: address.id, email });
  }

  console.log("Creating workers...");
  const workerNames = ["Andi Wijaya", "Dewi Lestari", "Rudi Hartono"];
  const workers: { employeeId: string; email: string }[] = [];
  for (let i = 0; i < workerNames.length; i++) {
    const email = `worker${i + 1}@demo.com`;
    const user = await prisma.user.create({
      data: { name: workerNames[i], email, passwordHash, isVerified: true },
    });
    await prisma.userRole.create({
      data: { userId: user.id, roleId: roles.worker.id, outletId: outlet.id },
    });
    const employee = await prisma.outletEmployee.create({
      data: { outletId: outlet.id, userId: user.id },
    });
    workers.push({ employeeId: employee.id, email });
  }

  console.log("Creating driver...");
  const driverUser = await prisma.user.create({
    data: { name: "Doni Saputra", email: "driver1@demo.com", passwordHash, isVerified: true },
  });
  await prisma.userRole.create({
    data: { userId: driverUser.id, roleId: roles.driver.id, outletId: outlet.id },
  });
  const driverEmployee = await prisma.outletEmployee.create({
    data: { outletId: outlet.id, userId: driverUser.id },
  });

  console.log("Creating outlet admin (needed to approve bypass & view attendance report)...");
  const adminUser = await prisma.user.create({
    data: { name: "Admin Outlet", email: "admin1@demo.com", passwordHash, isVerified: true },
  });
  await prisma.userRole.create({
    data: { userId: adminUser.id, roleId: roles.outlet_admin.id, outletId: outlet.id },
  });
  const adminEmployee = await prisma.outletEmployee.create({
    data: { outletId: outlet.id, userId: adminUser.id },
  });

  console.log("Creating Order A (live demo: washing -> ironing -> packing, unpaid)...");
  const prA = await prisma.pickupRequest.create({
    data: {
      customerId: customers[0].userId,
      addressId: customers[0].addressId,
      outletId: outlet.id,
      driverId: driverEmployee.id,
      scheduledAt: new Date(),
      pickedUpAt: new Date(),
      arrivedAtOutlet: new Date(),
      status: PickupStatus.ARRIVED_AT_OUTLET,
    },
  });
  const orderA = await prisma.order.create({
    data: {
      invoiceNumber: "INV-DEMO-A001",
      pickupRequestId: prA.id,
      outletId: outlet.id,
      outletAdminId: adminEmployee.id,
      totalKg: 3.5,
      totalPrice: 29000,
      status: OrderStatus.WASHING,
    },
  });
  await prisma.orderItem.createMany({
    data: [
      { orderId: orderA.id, laundryItemId: kaos.id, quantity: 3, pricePerUnit: 5000 },
      { orderId: orderA.id, laundryItemId: celana.id, quantity: 2, pricePerUnit: 7000 },
    ],
  });
  await prisma.orderStation.createMany({
    data: [
      { orderId: orderA.id, station: StationName.WASHING, status: StationStatus.PENDING },
      { orderId: orderA.id, station: StationName.IRONING, status: StationStatus.PENDING },
      { orderId: orderA.id, station: StationName.PACKING, status: StationStatus.PENDING },
    ],
  });
  await prisma.payment.create({
    data: { orderId: orderA.id, amount: 29000, gateway: "manual", status: PaymentStatus.PENDING },
  });

  console.log("Creating Order B (pre-fast-forwarded to Packing, already paid)...");
  const prB = await prisma.pickupRequest.create({
    data: {
      customerId: customers[1].userId,
      addressId: customers[1].addressId,
      outletId: outlet.id,
      driverId: driverEmployee.id,
      scheduledAt: new Date(),
      pickedUpAt: new Date(),
      arrivedAtOutlet: new Date(),
      status: PickupStatus.ARRIVED_AT_OUTLET,
    },
  });
  const orderB = await prisma.order.create({
    data: {
      invoiceNumber: "INV-DEMO-B002",
      pickupRequestId: prB.id,
      outletId: outlet.id,
      outletAdminId: adminEmployee.id,
      totalKg: 2,
      totalPrice: 17000,
      status: OrderStatus.PACKING,
    },
  });
  const washingB = await prisma.orderStation.create({
    data: {
      orderId: orderB.id,
      station: StationName.WASHING,
      status: StationStatus.COMPLETED,
      workerId: workers[0].employeeId,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
  const ironingB = await prisma.orderStation.create({
    data: {
      orderId: orderB.id,
      station: StationName.IRONING,
      status: StationStatus.COMPLETED,
      workerId: workers[1].employeeId,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
  await prisma.orderStation.create({
    data: { orderId: orderB.id, station: StationName.PACKING, status: StationStatus.PENDING },
  });
  await prisma.orderItem.createMany({
    data: [
      { orderId: orderB.id, laundryItemId: kaos.id, quantity: 2, pricePerUnit: 5000 },
      { orderId: orderB.id, laundryItemId: celana.id, quantity: 1, pricePerUnit: 7000 },
    ],
  });
  await prisma.stationItem.createMany({
    data: [
      { stationId: washingB.id, laundryItemId: kaos.id, quantityInput: 2 },
      { stationId: washingB.id, laundryItemId: celana.id, quantityInput: 1 },
      { stationId: ironingB.id, laundryItemId: kaos.id, quantityInput: 2 },
      { stationId: ironingB.id, laundryItemId: celana.id, quantityInput: 1 },
    ],
  });
  await prisma.payment.create({
    data: {
      orderId: orderB.id,
      amount: 17000,
      gateway: "manual",
      status: PaymentStatus.PAID,
      paidAt: new Date(),
    },
  });

  console.log("Creating Order C (already Ready to Deliver, for driver delivery demo)...");
  const prC = await prisma.pickupRequest.create({
    data: {
      customerId: customers[2].userId,
      addressId: customers[2].addressId,
      outletId: outlet.id,
      driverId: driverEmployee.id,
      scheduledAt: new Date(),
      pickedUpAt: new Date(),
      arrivedAtOutlet: new Date(),
      status: PickupStatus.ARRIVED_AT_OUTLET,
    },
  });
  const orderC = await prisma.order.create({
    data: {
      invoiceNumber: "INV-DEMO-C003",
      pickupRequestId: prC.id,
      outletId: outlet.id,
      outletAdminId: adminEmployee.id,
      totalKg: 1.5,
      totalPrice: 12000,
      status: OrderStatus.READY_TO_DELIVER,
    },
  });
  await prisma.orderStation.createMany({
    data: [
      { orderId: orderC.id, station: StationName.WASHING, status: StationStatus.COMPLETED, completedAt: new Date() },
      { orderId: orderC.id, station: StationName.IRONING, status: StationStatus.COMPLETED, completedAt: new Date() },
      { orderId: orderC.id, station: StationName.PACKING, status: StationStatus.COMPLETED, completedAt: new Date() },
    ],
  });
  await prisma.orderItem.create({
    data: { orderId: orderC.id, laundryItemId: kaos.id, quantity: 1, pricePerUnit: 5000 },
  });
  await prisma.payment.create({
    data: {
      orderId: orderC.id,
      amount: 12000,
      gateway: "manual",
      status: PaymentStatus.PAID,
      paidAt: new Date(),
    },
  });
  await prisma.deliveryRequest.create({
    data: {
      orderId: orderC.id,
      outletId: outlet.id,
      addressId: customers[2].addressId,
      status: DeliveryStatus.WAITING_DRIVER,
    },
  });

  console.log("Creating 2 unassigned pickups (for driver 'available pickups' demo)...");
  await prisma.pickupRequest.create({
    data: {
      customerId: customers[0].userId,
      addressId: customers[0].addressId,
      outletId: outlet.id,
      scheduledAt: new Date(Date.now() + 3600_000),
      status: PickupStatus.WAITING_DRIVER,
    },
  });
  await prisma.pickupRequest.create({
    data: {
      customerId: customers[1].userId,
      addressId: customers[1].addressId,
      outletId: outlet.id,
      scheduledAt: new Date(Date.now() + 7200_000),
      status: PickupStatus.WAITING_DRIVER,
    },
  });

  console.log("\n=== DEMO LOGIN CREDENTIALS (password sama untuk semua: " + DEMO_PASSWORD + ") ===");
  console.table([
    { role: "outlet_admin", ...{ email: "admin1@demo.com" } },
    ...workers.map((w, i) => ({ role: `worker (${workerNames[i]})`, email: w.email })),
    { role: "driver", email: "driver1@demo.com" },
    ...customers.map((c, i) => ({ role: `customer (${customerNames[i]})`, email: c.email })),
  ]);
  console.log("\nOrder A (INV-DEMO-A001): fresh order at WASHING, unpaid -> demo alur lengkap + mismatch + bypass.");
  console.log("  -> Worker yang clock-in station WASHING akan melihat order ini.");
  console.log("Order B (INV-DEMO-B002): sudah di PACKING, sudah lunas -> demo 'Laundry Siap Diantar'.");
  console.log("  -> Worker yang clock-in station PACKING akan melihat order ini.");
  console.log("Order C (INV-DEMO-C003): sudah Ready to Deliver, delivery tersedia untuk driver.");
  console.log("2 pickup tambahan tersedia untuk demo 'accept pickup' & 'satu order dalam satu waktu'.\n");
}

seeder()
  .then(async () => {
    await prisma.$disconnect();
  })
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
