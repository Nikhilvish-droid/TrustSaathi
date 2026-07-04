import { useEffect, useState } from "react";
import { hasUploadDraft, subscribeUploadDraftChanges } from "@/lib/upload-draft-storage";

export function useUploadDraft() {
  const [hasDraft, setHasDraft] = useState(hasUploadDraft);

  useEffect(() => {
    const sync = () => setHasDraft(hasUploadDraft());
    sync();
    return subscribeUploadDraftChanges(sync);
  }, []);

  return hasDraft;
}
