import type {
  CreateInventoryItemInput,
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

  async adjustQuantity(item: InventoryItem, change: number): Promise<InventoryItem> {
    const quantity = Math.max(0, item.quantity + change);
    const status = quantity === 0 ? 'EMPTY' : item.minQuantity && quantity <= item.minQuantity ? 'LOW' : 'OK';

    return this.updateItem(item.id, {
      name: item.name,
      description: item.description || undefined,
      quantity,
      unit: item.unit,
      status,
      minQuantity: item.minQuantity,
      categoryId: item.categoryId,
    });
  }
}
