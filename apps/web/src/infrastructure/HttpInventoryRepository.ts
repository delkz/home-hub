import type {
  CreateInventoryItemInput,
  InventoryCategory,
  InventoryItem,
  InventoryRepository,
  UpdateInventoryItemInput,
} from '../domain/inventory';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class HttpInventoryRepository implements InventoryRepository {
  async list(): Promise<InventoryItem[]> {
    const response = await fetch(`${API_BASE_URL}/inventory`);

    if (!response.ok) {
      throw new Error('Failed to load inventory');
    }

    return response.json();
  }

  async listCategories(): Promise<InventoryCategory[]> {
    const response = await fetch(`${API_BASE_URL}/categories`);

    if (!response.ok) {
      throw new Error('Failed to load categories');
    }

    return response.json();
  }

  async create(input: CreateInventoryItemInput): Promise<InventoryItem> {
    const response = await fetch(`${API_BASE_URL}/inventory`, {
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
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, { method: 'DELETE' });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete item' }));
      throw new Error(error.message || 'Failed to delete item');
    }
  }
}
