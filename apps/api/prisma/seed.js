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

  const inventoryItems = [
    {
      name: 'Rice',
      description: 'White rice for daily meals.',
      quantity: 8,
      unit: 'kg',
      status: 'OK',
      minQuantity: 2,
    },
    {
      name: 'Coffee',
      description: 'Ground coffee for the kitchen.',
      quantity: 1.5,
      unit: 'kg',
      status: 'LOW',
      minQuantity: 1,
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
