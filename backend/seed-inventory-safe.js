const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const materials = [
    { name: '3D EXPANSION SCREW', category: 'ORTHO', stock: 2, unit: 'pc', minStock: 0 },
    { name: '3D PRINTER FILM', category: 'RESINS', stock: 11, unit: 'pc', minStock: 0 },
    { name: '3D PRINTER TANK', category: 'ZIRCON', stock: 1, unit: 'pc', minStock: 0 },
    { name: 'ACRYLIC POWDER - BLACK 40 GM', category: 'ORTHO', stock: 1, unit: 'Bottle', minStock: 0 },
    { name: 'ALGINATE ALGINPLUS (453 GM)', category: 'ACRYLIC', stock: 0, unit: 'Packet', minStock: 0 },
    { name: 'BASE PASTE TUBE', category: 'CERAMIC', stock: 17, unit: 'Tube', minStock: 0 },
    { name: 'BASE PLATE', category: 'ACRYLIC', stock: 17, unit: 'Box', minStock: 0 },
  ];

  for (const m of materials) {
    // Check if exists by name (since code column isn't reliably there)
    const existing = await prisma.material.findFirst({ where: { name: m.name } });
    if (!existing) {
        await prisma.material.create({ data: m });
    }
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
