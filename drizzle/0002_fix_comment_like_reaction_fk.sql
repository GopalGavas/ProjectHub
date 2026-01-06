-- Fix FK: comment_likes → comments
-- Reason: allow hard delete of comments by cascading dependent likes

ALTER TABLE comment_likes
DROP CONSTRAINT IF EXISTS comment_likes_comment_id_comments_id_fk;

ALTER TABLE comment_likes
ADD CONSTRAINT comment_likes_comment_id_comments_id_fk
FOREIGN KEY (comment_id)
REFERENCES comments(id)
ON DELETE CASCADE;


-- Fix FK: comment_reactions → comments
-- Reason: allow hard delete of comments by cascading dependent reactions

ALTER TABLE comment_reactions
DROP CONSTRAINT IF EXISTS comment_reactions_comment_id_comments_id_fk;

ALTER TABLE comment_reactions
ADD CONSTRAINT comment_reactions_comment_id_comments_id_fk
FOREIGN KEY (comment_id)
REFERENCES comments(id)
ON DELETE CASCADE;
