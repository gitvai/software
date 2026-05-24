const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const materials = [
    { name: '3D EXPANSION SCREW', category: 'ORTHO', code: 'ORTHO-001', stock: 2, unit: 'pc', reorderLevel: 0 },
    { name: '3D PRINTER FILM', category: 'RESINS', code: 'RESIN-001', stock: 11, unit: 'pc', reorderLevel: 0 },
    { name: '3D PRINTER TANK', category: 'ZIRCON', code: 'ZIRCON-001', stock: 1, unit: 'pc', reorderLevel: 0 },
    { name: 'ACRYLIC POWDER - BLACK 40 GM', category: 'ORTHO', code: 'ORTHO-002', stock: 1, unit: 'Bottle', reorderLevel: 0 },
    { name: 'ALGINATE ALGINPLUS (453 GM)', category: 'ACRYLIC', code: 'ACRY-001', stock: 0, unit: 'Packet', reorderLevel: 0 },
    { name: 'BASE PASTE TUBE', category: 'CERAMIC', code: 'CERA-001', stock: 17, unit: 'Tube', reorderLevel: 0 },
    { name: 'BASE PLATE', category: 'ACRYLIC', code: 'ACRY-002', stock: 17, unit: 'Box', reorderLevel: 0 },
  ];

  for (const m of materials) {
    await prisma.material.upsert({
      where: { code: m.code },
      update: m,
      create: m,
    });
  }

  console.log('Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
