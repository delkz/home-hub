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
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
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
      if (editingItem) {
        await inventoryService.updateItem(editingItem.id, input);
        setEditingItem(null);
      } else {
        await inventoryService.createItem(input);
      }
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjust = async (item: InventoryItem, change: number) => {
    try {
      setBusyItemId(item.id);
      setError(null);
      await inventoryService.adjustQuantity(item, change);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to adjust quantity');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;

    try {
      setBusyItemId(item.id);
      setError(null);
      await inventoryService.deleteItem(item.id);
      if (editingItem?.id === item.id) setEditingItem(null);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete item');
    } finally {
      setBusyItemId(null);
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
            <h2>{editingItem ? 'Edit item' : 'Add item'}</h2>
            <InventoryForm
              initialItem={editingItem}
              onSubmit={handleSubmit}
              onCancel={() => setEditingItem(null)}
              submitting={submitting}
            />
          </div>

          <div className="panel">
            <h2>Inventory</h2>
            {error ? <p className="error-message">{error}</p> : null}
            {loading ? (
              <p>Loading items...</p>
            ) : (
              <InventoryTable
                items={items}
                busyItemId={busyItemId}
                onEdit={setEditingItem}
                onDelete={handleDelete}
                onAdjust={handleAdjust}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
