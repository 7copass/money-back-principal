-- Add products_details column to store array of products with individual values
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS products_details JSONB;

-- Example of what will be stored:
-- [
--   {"name": "Troca de Tela iPhone 12 PM", "value": 990},
--   {"name": "iPhone 11 64gb", "value": 1599}
-- ]
