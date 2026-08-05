import { useCallback, useRef, useState } from "react";
import {
  ATTACHMENT_MAX_BYTES,
  isAllowedMimeType,
  isImageMimeType,
  type UploadedAttachment,
} from "@/modules/attachment/attachment.schema";

/**
 * Staged attachment state for a chat composer.
 *
 * The file uploads as soon as it is picked rather than on send, so the user finds out
 * immediately that a 40MB video is not going through — and pressing Send then only has
 * to post a message that already has its URL. `objectUrl` is a local preview so the
 * thumbnail appears before the round trip finishes.
 */
export type StagedAttachment = UploadedAttachment & { objectUrl: string | null };

type UseAttachmentUploadOptions = {
  ticketId: string;
  projectId: string;
  /** Surfaces a rejected file or a failed upload. */
  onError?: (message: string) => void;
};

export function useAttachmentUpload({ ticketId, projectId, onError }: UseAttachmentUploadOptions) {
  const [attachment, setAttachment] = useState<StagedAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const revokePreview = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    revokePreview();
    setAttachment(null);
  }, [revokePreview]);

  const upload = useCallback(
    async (file: File) => {
      // Mirror the server allowlist so an obviously bad file never leaves the browser.
      // The server re-checks regardless — this is feedback, not enforcement.
      if (file.size > ATTACHMENT_MAX_BYTES) {
        onError?.(`"${file.name}" is larger than ${Math.floor(ATTACHMENT_MAX_BYTES / (1024 * 1024))}MB.`);
        return;
      }
      if (!isAllowedMimeType(file.type)) {
        onError?.(`"${file.name}" is not a supported file type.`);
        return;
      }

      revokePreview();
      const preview = isImageMimeType(file.type) ? URL.createObjectURL(file) : null;
      objectUrlRef.current = preview;
      setIsUploading(true);

      try {
        const form = new FormData();
        form.append("file", file);
        form.append("ticketId", ticketId);
        form.append("projectId", projectId);

        const response = await fetch("/api/attachments", { method: "POST", body: form });
        const body = (await response.json().catch(() => null)) as (UploadedAttachment & { error?: string }) | null;

        if (!response.ok || !body?.id) {
          revokePreview();
          onError?.(body?.error ?? "Upload failed. Please try again.");
          return;
        }

        setAttachment({ ...body, objectUrl: preview });
      } catch {
        revokePreview();
        onError?.("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [ticketId, projectId, onError, revokePreview],
  );

  return { attachment, isUploading, upload, clear };
}
