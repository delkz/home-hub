import type {
  CreateInventoryItemInput,
  InventoryItem,
  InventoryRepository,
} from '../domain/inventory';

export class InventoryService {
  private readonly repository: InventoryRepository;

  constructor(repository: InventoryRepository) {
    this.repository = repository;
  }

  async listItems(): Promise<InventoryItem[]> {
    return this.repository.list();
  }

  async createItem(input: CreateInventoryItemInput): Promise<InventoryItem> {
    return this.repository.create(input);
  }
}
