-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "house_inventory" ADD COLUMN "category_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "house_inventory_category_id_idx" ON "house_inventory"("category_id");

-- AddForeignKey
ALTER TABLE "house_inventory" ADD CONSTRAINT "house_inventory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SeedData
INSERT INTO "categories" ("id", "name", "updated_at") VALUES
    ('category_food', 'Alimentos', CURRENT_TIMESTAMP),
    ('category_cleaning', 'Limpeza', CURRENT_TIMESTAMP),
    ('category_hygiene', 'Higiene', CURRENT_TIMESTAMP),
    ('category_household', 'Casa', CURRENT_TIMESTAMP),
    ('category_other', 'Outros', CURRENT_TIMESTAMP);
