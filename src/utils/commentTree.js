export const buildCommentTree = (comments) => {
  const commentMap = new Map();
  const roots = [];

  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach((comment) => {
    if (comment.parentId) {
      const parentComment = commentMap.get(comment.parentId);
      if (parentComment) parentComment.replies.push(commentMap.get(comment.id));
    } else {
      roots.push(commentMap.get(comment.id));
    }
  });

  return roots;
};
