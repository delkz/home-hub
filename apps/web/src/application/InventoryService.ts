import type {
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  CreatePurchaseInput,
  InventoryItem,
  InventoryRepository,
  UpdateInventoryItemInput,
} from '../domain/inventory';

export class InventoryService {
  private readonly repository: InventoryRepository;

  constructor(repository: InventoryRepository) {
    this.repository = repository;
  }

  async listItems(): Promise<InventoryItem[]> {
    return this.repository.list();
  }

  async listCategories() {
    return this.repository.listCategories();
  }

  async createItem(input: CreateInventoryItemInput): Promise<InventoryItem> {
    return this.repository.create(input);
  }

  async updateItem(id: string, input: UpdateInventoryItemInput): Promise<InventoryItem> {
    return this.repository.update(id, input);
  }

  async deleteItem(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async listMovements(itemId: string) {
    return this.repository.listMovements(itemId);
  }

  async createMovement(input: CreateInventoryMovementInput) {
    return this.repository.createMovement(input);
  }

  async createPurchase(input: CreatePurchaseInput) {
    return this.repository.createPurchase(input);
  }

  async adjustQuantity(item: InventoryItem, change: number): Promise<InventoryItem> {
    const result = await this.createMovement({
      inventoryId: item.id,
      type: change >= 0 ? 'IN' : 'OUT',
      quantity: Math.abs(change),
      notes: 'Ajuste rápido',
    });
    return result.item;
  }
}
