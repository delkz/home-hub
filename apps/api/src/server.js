import express from 'express';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

const validStatuses = ['OK', 'LOW', 'EMPTY'];

const serializeInventory = (item) => ({
  ...item,
  quantity: Number(item.quantity),
  minQuantity: item.minQuantity === null ? null : Number(item.minQuantity),
});

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    const now = await prisma.$queryRaw`SELECT NOW() AS current_time`;

    res.json({
      status: 'ok',
      database: 'connected',
      time: now[0].current_time,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

app.get('/api/hello', (_req, res) => {
  res.json({
    message: 'Home Hub API is running',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/settings', async (_req, res) => {
  try {
    const setting = await prisma.setting.findFirst();
    res.json(setting ?? { houseName: '' });
  } catch (error) {
    res.status(500).json({
      message: 'Unable to fetch settings',
      error: error.message,
    });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const houseName = String(req.body.houseName || '').trim();

    if (!houseName) {
      return res.status(400).json({ message: 'houseName is required' });
    }

    const existing = await prisma.setting.findFirst();

    const setting = existing
      ? await prisma.setting.update({
          where: { id: existing.id },
          data: { houseName },
        })
      : await prisma.setting.create({
          data: { houseName },
        });

    res.json(setting);
  } catch (error) {
    res.status(500).json({
      message: 'Unable to update settings',
      error: error.message,
    });
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      message: 'Unable to fetch categories',
      error: error.message,
    });
  }
});

app.get('/api/inventory', async (_req, res) => {
  try {
    const items = await prisma.houseInventory.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { category: true },
    });

    res.json(items.map(serializeInventory));
  } catch (error) {
    res.status(500).json({
      message: 'Unable to fetch inventory',
      error: error.message,
    });
  }
});

app.get('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.houseInventory.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json(serializeInventory(item));
  } catch (error) {
    res.status(500).json({
      message: 'Unable to fetch inventory item',
      error: error.message,
    });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const {
      name,
      description,
      quantity = 0,
      unit = 'unit',
      status = 'OK',
      minQuantity,
      categoryId,
    } = req.body;

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ message: 'name is required' });
    }

    const normalizedStatus = String(status).toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: 'status must be one of: OK, LOW, EMPTY' });
    }

    const item = await prisma.houseInventory.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description) : null,
        quantity: Number(quantity),
        unit: String(unit),
        status: normalizedStatus,
        minQuantity: minQuantity === undefined || minQuantity === null ? null : Number(minQuantity),
        categoryId: categoryId ? String(categoryId) : null,
        lastUpdatedAt: new Date(),
      },
      include: { category: true },
    });

    res.status(201).json(serializeInventory(item));
  } catch (error) {
    res.status(500).json({
      message: 'Unable to create inventory item',
      error: error.message,
    });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, unit, status, minQuantity, categoryId } = req.body;

    const existing = await prisma.houseInventory.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const nextStatus = status === undefined ? existing.status : String(status).toUpperCase();

    if (!validStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: 'status must be one of: OK, LOW, EMPTY' });
    }

    const updated = await prisma.houseInventory.update({
      where: { id },
      data: {
        name: name === undefined ? existing.name : String(name).trim(),
        description: description === undefined ? existing.description : description ? String(description) : null,
        quantity: quantity === undefined ? existing.quantity : Number(quantity),
        unit: unit === undefined ? existing.unit : String(unit),
        status: nextStatus,
        minQuantity: minQuantity === undefined ? existing.minQuantity : minQuantity === null ? null : Number(minQuantity),
        categoryId: categoryId === undefined ? existing.categoryId : categoryId ? String(categoryId) : null,
        lastUpdatedAt: new Date(),
      },
      include: { category: true },
    });

    res.json(serializeInventory(updated));
  } catch (error) {
    res.status(500).json({
      message: 'Unable to update inventory item',
      error: error.message,
    });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.houseInventory.delete({
      where: { id },
    });

    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({
      message: 'Unable to delete inventory item',
      error: error.message,
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
