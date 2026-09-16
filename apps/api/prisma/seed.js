import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingSetting = await prisma.setting.findFirst();

  if (!existingSetting) {
    await prisma.setting.create({
      data: {
        houseName: 'Minha Casa',
      },
    });
  }

  const categories = [
    { name: 'Alimentos', icon: '🍽️' },
    { name: 'Limpeza', icon: '🧽' },
    { name: 'Higiene', icon: '🧴' },
    { name: 'Casa', icon: '🏠' },
    { name: 'Outros', icon: '📦' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { icon: category.icon },
      create: category,
    });
  }

  const foodCategory = await prisma.category.findUnique({ where: { name: 'Alimentos' } });

  const inventoryItems = [
    {
      name: 'Rice',
      description: 'White rice for daily meals.',
      quantity: 8,
      unit: 'kg',
      status: 'OK',
      minQuantity: 2,
      categoryId: foodCategory?.id,
      icon: foodCategory?.icon,
    },
    {
      name: 'Coffee',
      description: 'Ground coffee for the kitchen.',
      quantity: 1.5,
      unit: 'kg',
      status: 'LOW',
      minQuantity: 1,
      categoryId: foodCategory?.id,
      icon: foodCategory?.icon,
    },
    {
      name: 'Toilet paper',
      description: 'Bathroom consumable.',
      quantity: 12,
      unit: 'rolls',
      status: 'OK',
      minQuantity: 4,
    },
  ];

  for (const item of inventoryItems) {
    const exists = await prisma.houseInventory.findFirst({
      where: { name: item.name },
    });

    if (!exists) {
      await prisma.houseInventory.create({
        data: item,
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
