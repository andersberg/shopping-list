export function mergeComments(
	existing: string | null,
	newComment: string | null,
): string | null {
	if (!newComment) return existing;
	if (!existing) return newComment;

	const existing_comments = existing.split(",").map((c) => c.trim());
	const new_comments = newComment.split(",").map((c) => c.trim());

	// Combine and deduplicate while maintaining order
	const merged_comments = [...existing_comments];
	for (const comment of new_comments) {
		if (!merged_comments.includes(comment)) {
			merged_comments.push(comment);
		}
	}

	return merged_comments.join(", ");
}
