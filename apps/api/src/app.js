import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { requireAuth, requireCsrfHeader } from './auth/middleware.js';
import { authRouter } from './auth/routes.js';
import { config } from './lib/config.js';
import { exposeError } from './lib/errors.js';
import { prisma } from './lib/prisma.js';
import { profileRouter } from './profile.js';

const app = express();

const validMovementTypes = ['IN', 'OUT', 'ADJUSTMENT'];

const getInventoryStatus = (quantity, minQuantity) => {
  if (quantity <= 0) return 'EMPTY';
  if (minQuantity !== null && minQuantity !== undefined && quantity <= minQuantity) return 'LOW';
  return 'OK';
};

const serializeInventory = (item) => ({
  ...item,
  quantity: Number(item.quantity),
  minQuantity: item.minQuantity === null ? null : Number(item.minQuantity),
});

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: exposeError(error) });
  }
});

app.use('/api', requireCsrfHeader);
app.use('/api/auth', authRouter);

// Everything below this line requires a signed-in user.
app.use('/api', requireAuth);
app.use('/api/profile', profileRouter);

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
      error: exposeError(error),
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
      error: exposeError(error),
    });
  }
});

const serializeMovement = (movement) => ({
  ...movement,
  purchase: movement.purchase ?? null,
  quantity: Number(movement.quantity),
  previousQuantity: Number(movement.previousQuantity),
  resultingQuantity: Number(movement.resultingQuantity),
});

const findCategory = async (categoryId) => {
  if (!categoryId) return null;
  return prisma.category.findUnique({ where: { id: String(categoryId) } });
};

app.get('/api/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      message: 'Unable to fetch categories',
      error: exposeError(error),
    });
  }
});

app.get('/api/purchases', async (_req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      orderBy: { purchasedAt: 'desc' },
      include: { items: { include: { inventory: true } } },
    });
    res.json(purchases.map((purchase) => ({
      ...purchase,
      items: purchase.items.map((item) => ({ ...item, quantity: Number(item.quantity) })),
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch purchases', error: exposeError(error) });
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const lines = Array.isArray(req.body.items) ? req.body.items : [];
    const purchasedAt = req.body.purchasedAt ? new Date(req.body.purchasedAt) : new Date();
    const inventoryIds = lines.map((line) => String(line.inventoryId || ''));

    if (lines.length === 0) return res.status(400).json({ message: 'purchase must contain at least one item' });
    if (new Set(inventoryIds).size !== inventoryIds.length) return res.status(400).json({ message: 'purchase cannot contain duplicate items' });
    if (Number.isNaN(purchasedAt.getTime())) return res.status(400).json({ message: 'purchasedAt must be a valid date' });
    if (lines.some((line) => !line.inventoryId || !Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0)) {
      return res.status(400).json({ message: 'each purchase item must have an inventoryId and positive quantity' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const inventoryItems = await tx.houseInventory.findMany({ where: { id: { in: inventoryIds } } });
      if (inventoryItems.length !== lines.length) {
        const error = new Error('one or more inventory items were not found');
        error.statusCode = 400;
        throw error;
      }

      const purchase = await tx.purchase.create({
        data: {
          purchasedAt,
          store: req.body.store ? String(req.body.store).trim() : null,
          notes: req.body.notes ? String(req.body.notes).trim() : null,
          items: {
            create: lines.map((line) => ({ inventoryId: String(line.inventoryId), quantity: Number(line.quantity) })),
          },
        },
        include: { items: true },
      });

      const updatedItems = [];
      for (const line of lines) {
        const item = inventoryItems.find((candidate) => candidate.id === String(line.inventoryId));
        const quantity = Number(line.quantity);
        const previousQuantity = Number(item.quantity);
        const resultingQuantity = previousQuantity + quantity;

        await tx.inventoryMovement.create({
          data: {
            inventoryId: item.id,
            purchaseId: purchase.id,
            type: 'IN',
            quantity,
            previousQuantity,
            resultingQuantity,
            isPurchase: true,
            notes: req.body.store ? `Compra em ${String(req.body.store).trim()}` : 'Compra registrada',
            occurredAt: purchasedAt,
          },
        });

        updatedItems.push(await tx.houseInventory.update({
          where: { id: item.id },
          data: {
            quantity: resultingQuantity,
            status: getInventoryStatus(resultingQuantity, item.minQuantity === null ? null : Number(item.minQuantity)),
            lastPurchaseAt: purchasedAt,
            lastUpdatedAt: new Date(),
          },
          include: { category: true },
        }));
      }

      return {
        purchase: { ...purchase, items: purchase.items.map((item) => ({ ...item, quantity: Number(item.quantity) })) },
        items: updatedItems.map(serializeInventory),
      };
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Unable to create purchase', error: error.statusCode ? undefined : exposeError(error) });
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
      error: exposeError(error),
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
      error: exposeError(error),
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
      minQuantity,
      categoryId,
    } = req.body;

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ message: 'name is required' });
    }

    const category = await findCategory(categoryId);
    if (categoryId && !category) return res.status(400).json({ message: 'category not found' });

    const normalizedQuantity = Math.max(0, Number(quantity) || 0);
    const normalizedMinimum = minQuantity === undefined || minQuantity === null ? null : Math.max(0, Number(minQuantity) || 0);

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.houseInventory.create({
        data: {
          name: String(name).trim(),
          icon: category?.icon ?? '📦',
          description: description ? String(description) : null,
          quantity: normalizedQuantity,
          unit: String(unit),
          status: getInventoryStatus(normalizedQuantity, normalizedMinimum),
          minQuantity: normalizedMinimum,
          categoryId: category?.id ?? null,
          lastUpdatedAt: new Date(),
        },
        include: { category: true },
      });

      if (normalizedQuantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            inventoryId: created.id,
            type: 'ADJUSTMENT',
            quantity: normalizedQuantity,
            previousQuantity: 0,
            resultingQuantity: normalizedQuantity,
            notes: 'Saldo inicial',
          },
        });
      }

      return created;
    });

    res.status(201).json(serializeInventory(item));
  } catch (error) {
    res.status(500).json({
      message: 'Unable to create inventory item',
      error: exposeError(error),
    });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, unit, minQuantity, categoryId } = req.body;

    const existing = await prisma.houseInventory.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const category = categoryId === undefined ? undefined : await findCategory(categoryId);
    if (categoryId && !category) return res.status(400).json({ message: 'category not found' });

    const nextQuantity = quantity === undefined ? Number(existing.quantity) : Math.max(0, Number(quantity) || 0);
    const nextMinimum = minQuantity === undefined
      ? existing.minQuantity === null ? null : Number(existing.minQuantity)
      : minQuantity === null ? null : Math.max(0, Number(minQuantity) || 0);

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.houseInventory.update({
        where: { id },
        data: {
          name: name === undefined ? existing.name : String(name).trim(),
          icon: categoryId === undefined ? existing.icon : category?.icon ?? '📦',
          description: description === undefined ? existing.description : description ? String(description) : null,
          quantity: nextQuantity,
          unit: unit === undefined ? existing.unit : String(unit),
          status: getInventoryStatus(nextQuantity, nextMinimum),
          minQuantity: nextMinimum,
          categoryId: categoryId === undefined ? existing.categoryId : category?.id ?? null,
          lastUpdatedAt: new Date(),
        },
        include: { category: true },
      });

      if (nextQuantity !== Number(existing.quantity)) {
        await tx.inventoryMovement.create({
          data: {
            inventoryId: existing.id,
            type: 'ADJUSTMENT',
            quantity: nextQuantity,
            previousQuantity: existing.quantity,
            resultingQuantity: nextQuantity,
            notes: 'Saldo alterado na edição do item',
          },
        });
      }

      return item;
    });

    res.json(serializeInventory(updated));
  } catch (error) {
    res.status(500).json({
      message: 'Unable to update inventory item',
      error: exposeError(error),
    });
  }
});

app.get('/api/inventory/:id/movements', async (req, res) => {
  try {
    const item = await prisma.houseInventory.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    const movements = await prisma.inventoryMovement.findMany({
      where: { inventoryId: req.params.id },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      include: { purchase: { select: { id: true, store: true, purchasedAt: true } } },
    });

    res.json(movements.map(serializeMovement));
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch inventory movements', error: exposeError(error) });
  }
});

app.post('/api/inventory/:id/movements', async (req, res) => {
  try {
    const type = String(req.body.type || '').toUpperCase();
    const quantity = Number(req.body.quantity);
    const occurredAt = req.body.occurredAt ? new Date(req.body.occurredAt) : new Date();
    const isPurchase = type === 'IN' && Boolean(req.body.isPurchase);
    const notes = req.body.notes ? String(req.body.notes).trim() : null;

    if (!validMovementTypes.includes(type)) {
      return res.status(400).json({ message: 'type must be one of: IN, OUT, ADJUSTMENT' });
    }
    if (!Number.isFinite(quantity) || quantity < 0 || (type !== 'ADJUSTMENT' && quantity === 0)) {
      return res.status(400).json({ message: 'quantity must be a valid positive number' });
    }
    if (Number.isNaN(occurredAt.getTime())) {
      return res.status(400).json({ message: 'occurredAt must be a valid date' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.houseInventory.findUnique({ where: { id: req.params.id } });
      if (!item) {
        const error = new Error('Inventory item not found');
        error.statusCode = 404;
        throw error;
      }

      const previousQuantity = Number(item.quantity);
      let resultingQuantity = quantity;
      if (type === 'IN') resultingQuantity = previousQuantity + quantity;
      if (type === 'OUT') resultingQuantity = previousQuantity - quantity;

      if (resultingQuantity < 0) {
        const error = new Error('Movement would result in negative stock');
        error.statusCode = 400;
        throw error;
      }

      const movement = await tx.inventoryMovement.create({
        data: {
          inventoryId: item.id,
          type,
          quantity,
          previousQuantity,
          resultingQuantity,
          isPurchase,
          notes,
          occurredAt,
        },
      });

      const updatedItem = await tx.houseInventory.update({
        where: { id: item.id },
        data: {
          quantity: resultingQuantity,
          status: getInventoryStatus(resultingQuantity, item.minQuantity === null ? null : Number(item.minQuantity)),
          lastPurchaseAt: isPurchase ? occurredAt : item.lastPurchaseAt,
          lastUpdatedAt: new Date(),
        },
        include: { category: true },
      });

      return { item: serializeInventory(updatedItem), movement: serializeMovement(movement) };
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Unable to create inventory movement',
      error: error.statusCode ? undefined : exposeError(error),
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
      error: exposeError(error),
    });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request body too large' });
  res.status(500).json({ message: 'Internal server error', error: exposeError(error) });
});

export default app;
