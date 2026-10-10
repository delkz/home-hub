import type {
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  CreatePurchaseInput,
  InventoryCategory,
  InventoryItem,
  InventoryMovement,
  InventoryMovementResult,
  InventoryRepository,
  PurchaseResult,
  UpdateInventoryItemInput,
} from '../domain/inventory';
import { apiFetch } from './apiClient';

export class HttpInventoryRepository implements InventoryRepository {
  async list(): Promise<InventoryItem[]> {
    const response = await apiFetch(`/inventory`);

    if (!response.ok) {
      throw new Error('Failed to load inventory');
    }

    return response.json();
  }

  async listCategories(): Promise<InventoryCategory[]> {
    const response = await apiFetch(`/categories`);

    if (!response.ok) {
      throw new Error('Failed to load categories');
    }

    return response.json();
  }

  async create(input: CreateInventoryItemInput): Promise<InventoryItem> {
    const response = await apiFetch(`/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create item' }));
      throw new Error(error.message || 'Failed to create item');
    }

    return response.json();
  }

  async update(id: string, input: UpdateInventoryItemInput): Promise<InventoryItem> {
    const response = await apiFetch(`/inventory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update item' }));
      throw new Error(error.message || 'Failed to update item');
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await apiFetch(`/inventory/${id}`, { method: 'DELETE' });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete item' }));
      throw new Error(error.message || 'Failed to delete item');
    }
  }

  async listMovements(itemId: string): Promise<InventoryMovement[]> {
    const response = await apiFetch(`/inventory/${itemId}/movements`);
    if (!response.ok) throw new Error('Failed to load movement history');
    return response.json();
  }

  async createMovement(input: CreateInventoryMovementInput): Promise<InventoryMovementResult> {
    const response = await apiFetch(`/inventory/${input.inventoryId}/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create movement' }));
      throw new Error(error.message || 'Failed to create movement');
    }

    return response.json();
  }

  async createPurchase(input: CreatePurchaseInput): Promise<PurchaseResult> {
    const response = await apiFetch(`/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create purchase' }));
      throw new Error(error.message || 'Failed to create purchase');
    }

    return response.json();
  }
}
