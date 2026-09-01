import { useState } from 'react';
import { useEffect } from 'react';
import type { CreateInventoryItemInput, InventoryItem, InventoryStatus } from '../domain/inventory';

type InventoryFormProps = {
  onSubmit: (input: CreateInventoryItemInput) => Promise<void>;
  initialItem?: InventoryItem | null;
  onCancel?: () => void;
  submitting?: boolean;
};

const defaultForm = {
  name: '',
  description: '',
  quantity: 0,
  unit: 'unit',
  status: 'OK' as InventoryStatus,
  minQuantity: 0,
};

export function InventoryForm({ initialItem, onSubmit, onCancel, submitting = false }: InventoryFormProps) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    setForm(
      initialItem
        ? {
            name: initialItem.name,
            description: initialItem.description || '',
            quantity: initialItem.quantity,
            unit: initialItem.unit,
            status: initialItem.status,
            minQuantity: initialItem.minQuantity || 0,
          }
        : defaultForm,
    );
  }, [initialItem]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === 'quantity' || name === 'minQuantity' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      name: form.name,
      description: form.description || undefined,
      quantity: form.quantity,
      unit: form.unit,
      status: form.status,
      minQuantity: form.minQuantity || null,
    });

    if (!initialItem) {
      setForm(defaultForm);
    }
  };

  return (
    <form className="inventory-form" onSubmit={handleSubmit}>
      <div className="field-grid">
        <label>
          <span>Name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Rice"
            required
          />
        </label>

        <label>
          <span>Unit</span>
          <input
            name="unit"
            value={form.unit}
            onChange={handleChange}
            placeholder="kg"
          />
        </label>
      </div>

      <label>
        <span>Description</span>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder="Kitchen staple"
        />
      </label>

      <div className="field-grid">
        <label>
          <span>Quantity</span>
          <input
            name="quantity"
            type="number"
            step="0.01"
            value={form.quantity}
            onChange={handleChange}
          />
        </label>

        <label>
          <span>Minimum quantity</span>
          <input
            name="minQuantity"
            type="number"
            step="0.01"
            value={form.minQuantity}
            onChange={handleChange}
          />
        </label>
      </div>

      <label>
        <span>Status</span>
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="OK">OK</option>
          <option value="LOW">LOW</option>
          <option value="EMPTY">EMPTY</option>
        </select>
      </label>

      <button type="submit" className="submit-button" disabled={submitting}>
        {submitting ? 'Saving...' : initialItem ? 'Save changes' : 'Add item'}
      </button>
      {initialItem && onCancel ? (
        <button type="button" className="cancel-button" onClick={onCancel} disabled={submitting}>
          Cancel editing
        </button>
      ) : null}
    </form>
  );
}
