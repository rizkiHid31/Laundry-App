import { PrismaClient, RoleScope } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
export const prisma = new PrismaClient({ adapter });

async function seeder() {
  const roles = [
    { name: 'customer', scope: 'GLOBAL' as RoleScope, description: 'End user / customer' },
    { name: 'driver', scope: 'GLOBAL' as RoleScope, description: 'Driver / courier' },
    { name: 'worker', scope: 'GLOBAL' as RoleScope, description: 'Outlet worker / station staff' },
    { name: 'outlet_admin', scope: 'GLOBAL' as RoleScope, description: 'Outlet administrator / manager' },
    { name: 'super_admin', scope: 'GLOBAL' as RoleScope, description: 'Super administrator' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, scope: r.scope },
      create: { name: r.name, scope: r.scope, description: r.description },
    });
    console.info('Ensured role:', r.name);
  }

  const passwordPlain = 'Password123!';
  const hashedPassword = await bcrypt.hash(passwordPlain, 10);

  const upsertUser = async (email: string, firstName: string, lastName?: string, extra: any = {}) => {
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash: hashedPassword, isVerified: true, ...extra },
      create: { email, name, passwordHash: hashedPassword, isVerified: true, ...extra },
    });
    return user;
  };

  console.info('👥 Creating users...');
  const adminUser = await upsertUser('admin@laundry.com', 'Admin', 'Laundry');
  const customerUser = await upsertUser('customer@example.com', 'John', 'Doe');
  const outletAdminUser = await upsertUser('outlet.admin@laundry.com', 'Outlet', 'Manager');
  const workerUser = await upsertUser('worker@laundry.com', 'Pekerja', 'Cucian');
  const driverUser = await upsertUser('driver@laundry.com', 'Sopir', 'Pickup');

  console.info('🏪 Creating outlets...');
  let outlet1 = await prisma.outlet.findFirst({ where: { name: 'Laundry Express - Pusat' } });
  if (!outlet1) {
    outlet1 = await prisma.outlet.create({
      data: {
        name: 'Laundry Express - Pusat',
        address: 'Jl. Merdeka No. 123',
        latitude: -6.2088,
        longitude: 106.8456,
        radiusKm: 20,
        isActive: true,
      },
    });
  }

  let outlet2 = await prisma.outlet.findFirst({ where: { name: 'Laundry Express - Bintaro' } });
  if (!outlet2) {
    outlet2 = await prisma.outlet.create({
      data: {
        name: 'Laundry Express - Bintaro',
        address: 'Jl. Raya Bintaro Jaya No. 456',
        latitude: -6.3156,
        longitude: 106.7331,
        radiusKm: 20,
        isActive: true,
      },
    });
  }

  // Create outlet employees for outlet admin, worker, driver
  const ensureOutletEmployee = async (userId: string, outletId: string) => {
    const existing = await prisma.outletEmployee.findFirst({ where: { userId, outletId } });
    if (!existing) {
      return prisma.outletEmployee.create({ data: { userId, outletId, isActive: true } });
    }
    return existing;
  };

  await ensureOutletEmployee(outletAdminUser.id, outlet1.id);
  await ensureOutletEmployee(workerUser.id, outlet1.id);
  await ensureOutletEmployee(driverUser.id, outlet1.id);

  console.info('🧺 Ensuring laundry item catalog...');
  const defaultLaundryItems = [
    { name: 'Shirt', unit: 'pcs' },
    { name: 'Pants', unit: 'pcs' },
    { name: 'Jacket', unit: 'pcs' },
    { name: 'Towel', unit: 'pcs' },
    { name: 'Bedsheet', unit: 'pcs' },
    { name: 'Blanket', unit: 'pcs' },
  ];

  const createdLaundryItems = [] as Array<{ id: string; name: string }>;
  for (const item of defaultLaundryItems) {
    const laundryItem = await prisma.laundryItem.upsert({
      where: { name: item.name },
      update: { unit: item.unit, isActive: true },
      create: { name: item.name, unit: item.unit, isActive: true },
    });
    createdLaundryItems.push({ id: laundryItem.id, name: laundryItem.name });
  }

  const ensureOutletItemPrices = async (outletId: string) => {
    for (const laundryItem of createdLaundryItems) {
      const exists = await prisma.outletItemPrice.findFirst({ where: { outletId, laundryItemId: laundryItem.id } });
      if (!exists) {
        await prisma.outletItemPrice.create({
          data: {
            outletId,
            laundryItemId: laundryItem.id,
            pricePerUnit: outletId === outlet2.id ? 8500 : 7000,
          },
        });
      }
    }
  };

  await ensureOutletItemPrices(outlet1.id);
  await ensureOutletItemPrices(outlet2.id);

  // Assign roles by creating user_roles entries
  const getRoleId = async (name: string) => {
    const r = await prisma.role.findUnique({ where: { name } });
    return r?.id ?? null;
  };

  const assignUserRole = async (userId: string, roleName: string, outletId?: string | null) => {
    const roleId = await getRoleId(roleName);
    if (!roleId) return null;
    const exists = await prisma.userRole.findFirst({ where: { userId, roleId, outletId: outletId ?? null } });
    if (!exists) {
      return prisma.userRole.create({ data: { userId, roleId, outletId: outletId ?? undefined } });
    }
    return exists;
  };

  await assignUserRole(adminUser.id, 'super_admin');
  await assignUserRole(customerUser.id, 'customer');
  await assignUserRole(outletAdminUser.id, 'outlet_admin', outlet1.id);
  await assignUserRole(workerUser.id, 'worker', outlet1.id);
  await assignUserRole(driverUser.id, 'driver');

  // Output login email addresses grouped by role
  const userRoles = await prisma.userRole.findMany({ include: { user: true, role: true } });
  const byRole: Record<string, string[]> = {};
  for (const ur of userRoles) {
    const roleName = ur.role.name;
    byRole[roleName] = byRole[roleName] || [];
    if (ur.user?.email) byRole[roleName].push(ur.user.email);
  }

  console.info('\n🔐 Login emails by role:');
  for (const [roleName, emails] of Object.entries(byRole)) {
    console.info(` - ${roleName}: ${emails.join(', ')}`);
  }

  console.info('\nSeeding complete');
}

seeder()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
