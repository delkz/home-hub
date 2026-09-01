import type { InventoryItem } from '../domain/inventory';

type InventoryTableProps = {
  items: InventoryItem[];
  busyItemId?: string | null;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onAdjust: (item: InventoryItem, change: number) => void;
};

export function InventoryTable({ items, busyItemId, onEdit, onDelete, onAdjust }: InventoryTableProps) {
  return (
    <div className="table-wrap">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Status</th>
            <th>Last updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-state">
                No inventory items yet.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="item-name">{item.name}</div>
                  {item.description ? <small>{item.description}</small> : null}
                </td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>
                  <span className={`status-pill status-${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>{new Date(item.lastUpdatedAt).toLocaleDateString()}</td>
                <td>
                  <div className="item-actions">
                    <button
                      type="button"
                      className="quantity-button"
                      onClick={() => onAdjust(item, -1)}
                      disabled={busyItemId === item.id || item.quantity === 0}
                      aria-label={`Remove one ${item.unit} of ${item.name}`}
                      title="Remove one"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      className="quantity-button quantity-button-increase"
                      onClick={() => onAdjust(item, 1)}
                      disabled={busyItemId === item.id}
                      aria-label={`Add one ${item.unit} of ${item.name}`}
                      title="Add one"
                    >
                      +
                    </button>
                    <button type="button" className="table-action" onClick={() => onEdit(item)} disabled={busyItemId === item.id}>
                      Edit
                    </button>
                    <button type="button" className="table-action table-action-danger" onClick={() => onDelete(item)} disabled={busyItemId === item.id}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
