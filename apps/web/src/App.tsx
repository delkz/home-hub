import { useEffect, useState } from 'react';
import { InventoryForm } from './components/InventoryForm';
import { InventoryTable } from './components/InventoryTable';
import { InventoryService } from './application/InventoryService';
import type { CreateInventoryItemInput, InventoryItem } from './domain/inventory';
import { HttpInventoryRepository } from './infrastructure/HttpInventoryRepository';
import './App.css';

const inventoryService = new InventoryService(new HttpInventoryRepository());

function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.listItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const handleSubmit = async (input: CreateInventoryItemInput) => {
    try {
      setSubmitting(true);
      setError(null);
      await inventoryService.createItem(input);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Home Hub</p>
        <h1>Household inventory</h1>
        <p className="subtitle">
          A simple inventory view for the home, with fast tracking and lightweight item registration.
        </p>

        <div className="panel-grid">
          <div className="panel">
            <h2>Add item</h2>
            <InventoryForm onSubmit={handleSubmit} submitting={submitting} />
          </div>

          <div className="panel">
            <h2>Inventory</h2>
            {error ? <p className="error-message">{error}</p> : null}
            {loading ? <p>Loading items...</p> : <InventoryTable items={items} />}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
