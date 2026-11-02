import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FeedbackSchema,
  PAGE_SIZE_DEFAULT,
  SSE_EVENT_FEEDBACK_CREATED,
  type Feedback,
} from '@feedback-wall/shared';
import { FEEDBACK_STREAM_URL, listFeedback } from '../api/feedbackApi';
import { mergeFeedback } from '../lib/mergeFeedback';

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting';

/** Delay before re-creating an EventSource that the browser gave up on. */
const MANUAL_RECONNECT_MS = 5000;

export interface FeedbackWallState {
  notes: Feedback[];
  status: ConnectionStatus;
  isLoading: boolean;
  loadError: string | null;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  olderError: string | null;
  loadOlder: () => void;
  retryLoad: () => void;
  /** Adds a note immediately (e.g. from a POST response); deduped against SSE. */
  addNote: (note: Feedback) => void;
}

export function useFeedbackWall(): FeedbackWallState {
  const [notes, setNotes] = useState<Feedback[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const loadingOlderRef = useRef(false);

  const addNote = useCallback((note: Feedback) => {
    setNotes((current) => mergeFeedback(current, [note]));
  }, []);

  // Initial load, then the live stream.
  useEffect(() => {
    let cancelled = false;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    /** Pulls the newest page and merges it in, so nothing posted while offline is missed. */
    async function catchUp(): Promise<void> {
      try {
        const page = await listFeedback({ limit: PAGE_SIZE_DEFAULT });
        if (!cancelled) setNotes((current) => mergeFeedback(current, page.items));
      } catch {
        // Not fatal: live events keep flowing; the next reconnect will try again.
      }
    }

    function onCreated(event: MessageEvent<string>): void {
      try {
        const parsed = FeedbackSchema.safeParse(JSON.parse(event.data));
        if (parsed.success) addNote(parsed.data);
      } catch {
        // Ignore malformed events.
      }
    }

    function connect(): void {
      source = new EventSource(FEEDBACK_STREAM_URL);
      source.addEventListener(SSE_EVENT_FEEDBACK_CREATED, onCreated);
      source.onopen = () => {
        setStatus('live');
        // Covers notes posted between the initial fetch and the stream opening,
        // and anything posted during an outage.
        void catchUp();
      };
      source.onerror = () => {
        if (cancelled) return;
        setStatus('reconnecting');
        // EventSource retries on its own unless it gave up (CLOSED), e.g. after a non-200.
        if (source?.readyState === EventSource.CLOSED) {
          source.close();
          reconnectTimer = setTimeout(connect, MANUAL_RECONNECT_MS);
        }
      };
    }

    async function start(): Promise<void> {
      setIsLoading(true);
      setLoadError(null);
      try {
        const page = await listFeedback({ limit: PAGE_SIZE_DEFAULT });
        if (cancelled) return;
        setNotes((current) => mergeFeedback(current, page.items));
        setNextCursor(page.nextCursor);
        setIsLoading(false);
        setStatus('connecting');
        connect();
      } catch {
        if (cancelled) return;
        setIsLoading(false);
        setLoadError("Couldn't load the wall. Please try again.");
      }
    }

    void start();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [addNote, loadAttempt]);

  const loadOlder = useCallback(() => {
    if (nextCursor === null || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setIsLoadingOlder(true);
    setOlderError(null);
    listFeedback({ limit: PAGE_SIZE_DEFAULT, before: nextCursor })
      .then((page) => {
        setNotes((current) => mergeFeedback(current, page.items));
        setNextCursor(page.nextCursor);
      })
      .catch(() => setOlderError("Couldn't load older notes. Please try again."))
      .finally(() => {
        loadingOlderRef.current = false;
        setIsLoadingOlder(false);
      });
  }, [nextCursor]);

  const retryLoad = useCallback(() => setLoadAttempt((n) => n + 1), []);

  return {
    notes,
    status,
    isLoading,
    loadError,
    hasOlder: nextCursor !== null,
    isLoadingOlder,
    olderError,
    loadOlder,
    retryLoad,
    addNote,
  };
}
