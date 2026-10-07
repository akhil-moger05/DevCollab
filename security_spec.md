# Security Specification: DevCollab

## 1. Data Invariants
1. A snippet document must have a valid `ownerId` that equals `request.auth.uid` upon creation.
2. The `ownerId` and `createdAt` cannot be modified after snippet creation.
3. Private snippets (`isPublic == false`) can only be read by the owner (`request.auth.uid == resource.data.ownerId`).
4. Public snippets (`isPublic == true`) can be read by anyone (authenticated or anonymous).
5. Only the owner can delete a snippet (`request.auth.uid == resource.data.ownerId`).
6. Only the owner can update settings like `isPublic`, `ownerId`, `ownerEmail`, or delete.
7. Public snippets allow signed-in users to collaborate on code and update `code`, `updatedAt`, and `lastEditedBy`.
8. Presence entries in `/snippets/{snippetId}/presence/{userId}` can only be created/updated by the user themselves (`request.auth.uid == userId`) when they have read access to the parent snippet.

## 2. The Dirty Dozen Payloads (Targeting Exploits)
1. Malicious delete from non-owner: Attacker tries to DELETE someone else's snippet. -> DENIED.
2. Spoofed snippet owner create: Attacker sends `ownerId: "victim_123"`. -> DENIED.
3. Private snippet read snooping: Attacker attempts GET or LIST on someone else's private snippet. -> DENIED.
4. Ownership transfer exploit: Attacker attempts UPDATE `ownerId: "attacker_uid"` on an existing snippet. -> DENIED.
5. Oversized code injection (Denial of Wallet): Attacker tries to write snippet with code exceeding 250,000 characters. -> DENIED.
6. Tag flooding: Attacker submits an array of 500 tags to crash client queries. -> DENIED (Max 15 tags).
7. Non-string tag payload: Attacker sends objects or booleans inside the tags array. -> DENIED.
8. Junk doc ID attack: Attacker sends a 5KB junk string ID. -> DENIED by `isValidId`.
9. Impersonated presence cursor: User A attempts to write cursor for User B at `/presence/{userB}`. -> DENIED.
10. Unauthenticated write: Unauthenticated user attempts to create a snippet. -> DENIED.
11. Blanket query bypass: Query requesting all snippets without filtering by `isPublic == true` or `ownerId == auth.uid`. -> DENIED.
12. Future timestamp forgery: Attacker crafts `createdAt` with forged future time instead of `request.time`. -> DENIED.
