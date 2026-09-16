export type InventoryStatus = 'OK' | 'LOW' | 'EMPTY';

export type InventoryCategory = {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  quantity: number;
  unit: string;
  status: InventoryStatus;
  minQuantity: number | null;
  categoryId: string | null;
  category: InventoryCategory | null;
  lastPurchaseAt: string | null;
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

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export type InventoryMovement = {
  id: string;
  inventoryId: string;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  resultingQuantity: number;
  isPurchase: boolean;
  notes: string | null;
  occurredAt: string;
  createdAt: string;
  purchase: { id: string; store: string | null; purchasedAt: string } | null;
};

export type CreateInventoryMovementInput = {
  inventoryId: string;
  type: MovementType;
  quantity: number;
  isPurchase?: boolean;
  notes?: string;
  occurredAt?: string;
};

export type InventoryMovementResult = {
  item: InventoryItem;
  movement: InventoryMovement;
};

export type CreatePurchaseInput = {
  purchasedAt?: string;
  store?: string;
  notes?: string;
  items: Array<{ inventoryId: string; quantity: number }>;
};

export type PurchaseResult = {
  purchase: {
    id: string;
    purchasedAt: string;
    store: string | null;
    notes: string | null;
  };
  items: InventoryItem[];
};

export interface InventoryRepository {
  list(): Promise<InventoryItem[]>;
  listCategories(): Promise<InventoryCategory[]>;
  create(input: CreateInventoryItemInput): Promise<InventoryItem>;
  update(id: string, input: UpdateInventoryItemInput): Promise<InventoryItem>;
  delete(id: string): Promise<void>;
  listMovements(itemId: string): Promise<InventoryMovement[]>;
  createMovement(input: CreateInventoryMovementInput): Promise<InventoryMovementResult>;
  createPurchase(input: CreatePurchaseInput): Promise<PurchaseResult>;
}
