import type { InventoryItem } from '../domain/inventory';

type InventoryTableProps = {
  items: InventoryItem[];
};

export function InventoryTable({ items }: InventoryTableProps) {
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
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty-state">
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
