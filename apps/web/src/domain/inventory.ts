export type InventoryStatus = 'OK' | 'LOW' | 'EMPTY';

export type InventoryCategory = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  status: InventoryStatus;
  minQuantity: number | null;
  categoryId: string | null;
  category: InventoryCategory | null;
  lastUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateInventoryItemInput = {
  name: string;
  description?: string;
  quantity?: number;
  unit?: string;
  status?: InventoryStatus;
  minQuantity?: number | null;
  categoryId?: string | null;
};

export type UpdateInventoryItemInput = CreateInventoryItemInput;

export interface InventoryRepository {
  list(): Promise<InventoryItem[]>;
  listCategories(): Promise<InventoryCategory[]>;
  create(input: CreateInventoryItemInput): Promise<InventoryItem>;
  update(id: string, input: UpdateInventoryItemInput): Promise<InventoryItem>;
  delete(id: string): Promise<void>;
}
