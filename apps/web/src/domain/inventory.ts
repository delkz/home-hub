export type InventoryStatus = 'OK' | 'LOW' | 'EMPTY';

export type InventoryItem = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  status: InventoryStatus;
  minQuantity: number | null;
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
};

export interface InventoryRepository {
  list(): Promise<InventoryItem[]>;
  create(input: CreateInventoryItemInput): Promise<InventoryItem>;
}
