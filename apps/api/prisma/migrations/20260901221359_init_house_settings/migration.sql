-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('OK', 'LOW', 'EMPTY');

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "house_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "house_inventory" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unit" VARCHAR(30) NOT NULL DEFAULT 'unit',
    "status" "InventoryStatus" NOT NULL DEFAULT 'OK',
    "minQuantity" DECIMAL(10,2),
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "house_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "house_inventory_status_idx" ON "house_inventory"("status");

-- CreateIndex
CREATE INDEX "house_inventory_name_idx" ON "house_inventory"("name");
