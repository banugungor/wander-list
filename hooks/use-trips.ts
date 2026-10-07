import {
  createTrip,
  deleteTrip,
  emptyDays,
  fetchTrips,
  inclusiveDayCount,
  readTripsCache,
  updateTrip,
  writeTripsCache,
  type Trip,
  type TripDraft,
  type TripPatch,
} from "@/data/trips";
import { useSession } from "@/hooks/use-session";
import { useCallback, useEffect, useRef, useState } from "react";

const NO_TRIPS: Trip[] = [];

type TripsState = {
  /** Which user these trips belong to. Anything not matching the current
   * user is ignored, so signing out and into another account on the same
   * device can never flash the previous account's trips. */
  ownerId: string | null;
  trips: Trip[];
  /** True once the cache or a fetch has produced a first answer. */
  loaded: boolean;
};

/** The signed-in user's trips. Supabase's `trips` table is the source of
 * truth; the AsyncStorage copy (data/trips.ts) is only an offline read
 * cache, shown instantly (and kept when the network is down) while a fresh
 * fetch runs — the same stale-while-revalidate shape as hooks/use-country-meals.ts.
 *
 * Writes are optimistic: the UI updates immediately, and a failed write
 * rolls the trip back to its last server-confirmed state and rethrows so the
 * caller can tell the user. */
export function useTrips() {
  const { session, ready } = useSession();
  const userId = session?.user.id ?? null;

  const [state, setState] = useState<TripsState>({
    ownerId: null,
    trips: NO_TRIPS,
    loaded: false,
  });
  // True after a fetch failed and nothing (cache included) could be shown.
  const [loadFailed, setLoadFailed] = useState(false);

  const mine = state.ownerId === userId;
  const trips = userId && mine ? state.trips : NO_TRIPS;
  const loading = !!userId && !(mine && state.loaded);

  // Mirrors `trips` so callbacks always read the latest list without being
  // recreated (and re-triggering effects) on every edit.
  const tripsRef = useRef<Trip[]>(NO_TRIPS);
  // The latest user id, readable from callbacks that outlive a render — so a
  // slow request from a previous account can't write into the new one's state.
  const userIdRef = useRef(userId);
  // Last version of each trip the server confirmed; what a failed edit rolls back to.
  const confirmedRef = useRef(new Map<string, Trip>());
  // Writes still in flight per trip, so overlapping edits don't clobber each other.
  const inFlightRef = useRef(new Map<string, number>());
  // Set once a fetch (or any local commit) has landed; a slower cache read
  // must not overwrite it.
  const freshRef = useRef(false);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const commit = useCallback(
    (next: Trip[]) => {
      if (userIdRef.current !== userId) return;
      freshRef.current = true;
      tripsRef.current = next;
      setState({ ownerId: userId, trips: next, loaded: true });
      if (userId) writeTripsCache(userId, next);
    },
    [userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const fresh = await fetchTrips();
      if (userIdRef.current !== userId) return;
      confirmedRef.current = new Map(fresh.map((trip) => [trip.id, trip]));
      setLoadFailed(false);
      commit(fresh);
    } catch (e) {
      // Keep whatever the cache already showed.
      console.log("TRIPS FETCH ERROR", e);
      if (userIdRef.current !== userId) return;
      setLoadFailed(true);
      setState((current) =>
        current.ownerId === userId
          ? { ...current, loaded: true }
          : { ownerId: userId, trips: NO_TRIPS, loaded: true },
      );
    }
  }, [userId, commit]);

  useEffect(() => {
    // Whoever the previous user was, start from nothing.
    tripsRef.current = NO_TRIPS;
    confirmedRef.current = new Map();
    inFlightRef.current = new Map();
    freshRef.current = false;
    if (!ready || !userId) return;

    let cancelled = false;

    readTripsCache(userId).then((cached) => {
      // Skip if a fetch already landed — the cache is older than that.
      if (cancelled || cached.length === 0 || freshRef.current) return;
      tripsRef.current = cached;
      confirmedRef.current = new Map(cached.map((trip) => [trip.id, trip]));
      setState({ ownerId: userId, trips: cached, loaded: true });
    });
    // refresh() only sets state after awaiting the network, never
    // synchronously — the lint rule just can't see through the callback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();

    return () => {
      cancelled = true;
    };
  }, [ready, userId, refresh]);

  const create = useCallback(
    async (draft: TripDraft): Promise<Trip> => {
      if (!userId) throw new Error("Not signed in");
      const days = emptyDays(inclusiveDayCount(draft.startDate, draft.endDate));
      const trip = await createTrip(userId, draft, days);
      confirmedRef.current.set(trip.id, trip);
      commit([trip, ...tripsRef.current]);
      return trip;
    },
    [userId, commit],
  );

  const update = useCallback(
    async (id: string, patch: TripPatch): Promise<void> => {
      commit(tripsRef.current.map((t) => (t.id === id ? { ...t, ...patch } : t)));

      const inFlight = inFlightRef.current;
      inFlight.set(id, (inFlight.get(id) ?? 0) + 1);
      const settle = () => {
        const remaining = (inFlight.get(id) ?? 1) - 1;
        inFlight.set(id, remaining);
        return remaining;
      };

      try {
        const saved = await updateTrip(id, patch);
        confirmedRef.current.set(id, saved);
        // Only show the server's copy once no newer edit is queued behind
        // this one — otherwise it would briefly erase that newer edit. The
        // last write in the chain carries every earlier change too.
        if (settle() === 0) {
          commit(tripsRef.current.map((t) => (t.id === id ? saved : t)));
        }
      } catch (e) {
        // Same rule: with newer edits still queued they decide the outcome,
        // so only roll back when this was the last one.
        if (settle() === 0) {
          const confirmed = confirmedRef.current.get(id);
          if (confirmed) {
            commit(tripsRef.current.map((t) => (t.id === id ? confirmed : t)));
          }
        }
        throw e;
      }
    },
    [commit],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await deleteTrip(id);
      confirmedRef.current.delete(id);
      commit(tripsRef.current.filter((t) => t.id !== id));
    },
    [commit],
  );

  return {
    trips,
    signedIn: !!userId,
    /** False until the initial session lookup has finished. */
    sessionReady: ready,
    loading,
    loadFailed,
    refresh,
    create,
    update,
    remove,
  };
}
