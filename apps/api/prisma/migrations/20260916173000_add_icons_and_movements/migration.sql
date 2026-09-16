-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "icon" TEXT NOT NULL DEFAULT '📦';
ALTER TABLE "house_inventory" ADD COLUMN "icon" TEXT NOT NULL DEFAULT '📦';
ALTER TABLE "house_inventory" ADD COLUMN "last_purchase_at" TIMESTAMP(3);

-- Seed category icons
UPDATE "categories" SET "icon" = CASE "name"
    WHEN 'Alimentos' THEN '🍽️'
    WHEN 'Limpeza' THEN '🧽'
    WHEN 'Higiene' THEN '🧴'
    WHEN 'Casa' THEN '🏠'
    ELSE '📦'
END;

-- Existing products inherit their category icon when possible.
UPDATE "house_inventory" AS item
SET "icon" = category."icon"
FROM "categories" AS category
WHERE item."category_id" = category."id";

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "inventory_id" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "previous_quantity" DECIMAL(10,2) NOT NULL,
    "resulting_quantity" DECIMAL(10,2) NOT NULL,
    "is_purchase" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_movements_inventory_id_occurred_at_idx" ON "inventory_movements"("inventory_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "house_inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
