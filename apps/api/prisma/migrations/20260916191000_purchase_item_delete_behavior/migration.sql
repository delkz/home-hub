ALTER TABLE "purchase_items" DROP CONSTRAINT "purchase_items_inventory_id_fkey";
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "house_inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
