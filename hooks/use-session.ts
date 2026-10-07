import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

/** The current Supabase auth session, kept live. `ready` flips to true once
 * the initial lookup has finished, so callers can tell "signed out" apart
 * from "not known yet" and avoid flashing a sign-in prompt at signed-in
 * users. */
export function useSession(): { session: Session | null; ready: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setReady(true);
      },
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, ready };
}
