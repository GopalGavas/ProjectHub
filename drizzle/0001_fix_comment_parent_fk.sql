ALTER TABLE comments
DROP CONSTRAINT IF EXISTS comments_parent_id_fkey;

ALTER TABLE comments
ADD CONSTRAINT comments_parent_id_fkey
FOREIGN KEY (parent_id)
REFERENCES comments(id)
ON DELETE CASCADE;
