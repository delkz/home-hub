-- Existing inventory starts its history with an opening-balance adjustment.
INSERT INTO "inventory_movements" (
    "id",
    "inventory_id",
    "type",
    "quantity",
    "previous_quantity",
    "resulting_quantity",
    "is_purchase",
    "notes",
    "occurred_at",
    "created_at"
)
SELECT
    'opening_' || item."id",
    item."id",
    'ADJUSTMENT'::"MovementType",
    item."quantity",
    0,
    item."quantity",
    false,
    'Saldo inicial migrado',
    item."created_at",
    CURRENT_TIMESTAMP
FROM "house_inventory" AS item
WHERE item."quantity" > 0
  AND NOT EXISTS (
      SELECT 1 FROM "inventory_movements" AS movement
      WHERE movement."inventory_id" = item."id"
  );
