"use client";

/**
 * Resolve a record's owner/assignee display name. Backend resolves the relation
 * as either `owner` (customer, opportunity) or `assignedUser` (lead, deal, task,
 * ticket) — this reads whichever is present so every module works the same.
 */
export function ownerName(entity) {
  const u = entity?.owner || entity?.assignedUser;
  return u ? `${u.firstName} ${u.lastName || ""}`.trim() : "Unassigned";
}

/** Table-cell friendly wrapper: `<OwnerCell entity={row.original} />`. */
export default function OwnerCell({ entity }) {
  return ownerName(entity);
}
