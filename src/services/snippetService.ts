import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Snippet, UserPresence, SupportedLanguage } from '../types/snippet';
import { User } from 'firebase/auth';

const SNIPPETS_COLLECTION = 'snippets';

export async function createSnippet(params: {
  title: string;
  code: string;
  language: SupportedLanguage | string;
  isPublic: boolean;
  tags: string[];
  user: User;
}): Promise<string> {
  const snippetId = 'snp_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const docRef = doc(db, SNIPPETS_COLLECTION, snippetId);

  const newSnippetData = {
    title: params.title.trim() || 'Untitled Snippet',
    code: params.code ?? '',
    language: params.language || 'javascript',
    isPublic: Boolean(params.isPublic),
    tags: Array.isArray(params.tags) ? params.tags.slice(0, 15) : [],
    ownerId: params.user.uid,
    ownerName: params.user.displayName || params.user.email?.split('@')[0] || 'Anonymous',
    ownerPhoto: params.user.photoURL || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastEditedBy: params.user.displayName || params.user.email?.split('@')[0] || 'Anonymous',
  };

  try {
    await setDoc(docRef, newSnippetData);
    return snippetId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${SNIPPETS_COLLECTION}/${snippetId}`);
  }
}

export async function updateSnippet(
  snippetId: string,
  updates: Partial<Snippet>,
  isOwner: boolean
): Promise<void> {
  const docRef = doc(db, SNIPPETS_COLLECTION, snippetId);
  const payload: any = {
    updatedAt: serverTimestamp(),
  };

  if (updates.code !== undefined) payload.code = updates.code;
  if (updates.lastEditedBy !== undefined) payload.lastEditedBy = updates.lastEditedBy;

  if (isOwner) {
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.language !== undefined) payload.language = updates.language;
    if (updates.isPublic !== undefined) payload.isPublic = updates.isPublic;
    if (updates.tags !== undefined) payload.tags = updates.tags.slice(0, 15);
  }

  try {
    await updateDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SNIPPETS_COLLECTION}/${snippetId}`);
  }
}

export async function deleteSnippet(snippetId: string): Promise<void> {
  const docRef = doc(db, SNIPPETS_COLLECTION, snippetId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SNIPPETS_COLLECTION}/${snippetId}`);
  }
}

export async function getSnippet(snippetId: string): Promise<Snippet | null> {
  const path = `${SNIPPETS_COLLECTION}/${snippetId}`;
  try {
    const snap = await getDoc(doc(db, SNIPPETS_COLLECTION, snippetId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Snippet;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToSnippet(
  snippetId: string,
  onUpdate: (snippet: Snippet | null) => void,
  onError?: (err: any) => void
): () => void {
  const path = `${SNIPPETS_COLLECTION}/${snippetId}`;
  const docRef = doc(db, SNIPPETS_COLLECTION, snippetId);

  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        onUpdate({ id: snap.id, ...snap.data() } as Snippet);
      }
    },
    (error) => {
      if (onError) onError(error);
      console.error('Snippet listener error:', path, error);
    }
  );
}

export function subscribeToUserSnippets(
  userId: string,
  onUpdate: (snippets: Snippet[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = SNIPPETS_COLLECTION;
  const q = query(
    collection(db, SNIPPETS_COLLECTION),
    where('ownerId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const snippets = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Snippet[];
      
      // Sort client side to handle non-indexed composite queries gracefully
      snippets.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        return timeB - timeA;
      });

      onUpdate(snippets);
    },
    (error) => {
      if (onError) onError(error);
      console.error('User snippets listener error:', path, error);
    }
  );
}

export function subscribeToPublicSnippets(
  onUpdate: (snippets: Snippet[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = SNIPPETS_COLLECTION;
  const q = query(
    collection(db, SNIPPETS_COLLECTION),
    where('isPublic', '==', true),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const snippets = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Snippet[];

      snippets.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        return timeB - timeA;
      });

      onUpdate(snippets);
    },
    (error) => {
      if (onError) onError(error);
      console.error('Public snippets listener error:', path, error);
    }
  );
}

// Presence management for live collaboration & live cursors
export async function updatePresence(
  snippetId: string,
  user: User,
  cursorLine: number,
  cursorColumn: number,
  color: string
): Promise<void> {
  const presencePath = `${SNIPPETS_COLLECTION}/${snippetId}/presence/${user.uid}`;
  const presenceRef = doc(db, SNIPPETS_COLLECTION, snippetId, 'presence', user.uid);

  try {
    await setDoc(
      presenceRef,
      {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.photoURL || '',
        cursorLine: Math.max(1, Math.floor(cursorLine)),
        cursorColumn: Math.max(1, Math.floor(cursorColumn)),
        color: color || '#3b82f6',
        lastActive: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, presencePath);
  }
}

export async function removePresence(snippetId: string, userId: string): Promise<void> {
  const presencePath = `${SNIPPETS_COLLECTION}/${snippetId}/presence/${userId}`;
  const presenceRef = doc(db, SNIPPETS_COLLECTION, snippetId, 'presence', userId);
  try {
    await deleteDoc(presenceRef);
  } catch (error) {
    // If user leaves or presence is already gone, soft ignore or handle
    console.debug('Failed to remove presence:', error);
  }
}

export function subscribeToPresence(
  snippetId: string,
  onUpdate: (presenceList: UserPresence[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = `${SNIPPETS_COLLECTION}/${snippetId}/presence`;
  const presRef = collection(db, SNIPPETS_COLLECTION, snippetId, 'presence');

  return onSnapshot(
    presRef,
    (snapshot) => {
      const now = Date.now();
      const list: UserPresence[] = [];

      snapshot.docs.forEach((d) => {
        const data = d.data();
        // Filter out stale heartbeats older than 90 seconds
        const activeTime = data.lastActive?.toMillis
          ? data.lastActive.toMillis()
          : data.lastActive
          ? new Date(data.lastActive).getTime()
          : now;

        if (now - activeTime < 90000) {
          list.push({
            userId: d.id,
            userName: data.userName || 'Dev User',
            userPhoto: data.userPhoto || undefined,
            cursorLine: data.cursorLine || 1,
            cursorColumn: data.cursorColumn || 1,
            color: data.color || '#3b82f6',
            lastActive: data.lastActive,
          });
        }
      });

      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      console.error('Presence listener error:', path, error);
    }
  );
}
