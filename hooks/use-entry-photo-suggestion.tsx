import { promptSuggestionSignIn } from "@/components/suggestion-entry";
import { SuggestionModal } from "@/components/suggestion-modal";
import { useLanguage } from "@/contexts/language-context";
import type { SuggestionCategory } from "@/data/suggestions";
import { useSession } from "@/hooks/use-session";
import { useCallback, useState, type ReactElement } from "react";

type Entry = { id: string; name: string };

/** "Add a photo" for an existing dish / island / landmark that has none
 * (the button on `EntryListRow`). One hook per *screen*, not per row: it owns
 * the single form modal and the sign-in check, so a long list doesn't mount a
 * modal and an auth listener for every row. Render `modal` once on the
 * screen and call `open(entry)` from a row. `name` should be the entry's
 * English name — it's stored on the suggestion for the admin panel. */
export function useEntryPhotoSuggestion(
  category: Exclude<SuggestionCategory, "heritage_photo">,
  countryId: string,
): { open: (entry: Entry) => void; modal: ReactElement } {
  const { t } = useLanguage();
  const { session } = useSession();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [visible, setVisible] = useState(false);

  const open = useCallback(
    (picked: Entry) => {
      if (!session) {
        promptSuggestionSignIn(t);
        return;
      }
      setEntry(picked);
      setVisible(true);
    },
    [session, t],
  );

  const modal = (
    <SuggestionModal
      visible={visible}
      category={category}
      countryId={countryId}
      existingEntry={entry}
      onClose={() => setVisible(false)}
    />
  );

  return { open, modal };
}
