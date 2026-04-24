import { useCallback, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { extractPdfContextFromUri } from "@/src/ai/pdf";

export type PdfAttachment = {
  id: string;
  name: string;
  uri: string;
  status: "processing" | "ready" | "failed";
  error?: string;
  chunks: string[];
};

export const usePdfAttachments = () => {
  const [pdfAttachments, setPdfAttachments] = useState<PdfAttachment[]>([]);

  const handleRemovePdf = useCallback((attachmentId: string) => {
    setPdfAttachments((current) =>
      current.filter((attachment) => attachment.id !== attachmentId),
    );
  }, []);

  const handlePickPdf = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    for (const asset of result.assets) {
      const attachmentId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      setPdfAttachments((current) => [
        ...current,
        {
          id: attachmentId,
          name: asset.name ?? "Document.pdf",
          uri: asset.uri,
          status: "processing",
          chunks: [],
        },
      ]);

      try {
        const extracted = await extractPdfContextFromUri(asset.uri, {
          maxPages: 24,
          maxChunks: 8,
        });

        setPdfAttachments((current) =>
          current.map((attachment) =>
            attachment.id === attachmentId
              ? {
                  ...attachment,
                  status: extracted.chunks.length ? "ready" : "failed",
                  error: extracted.chunks.length ? undefined : "No readable text found",
                  chunks: extracted.chunks,
                }
              : attachment,
          ),
        );
      } catch (error) {
        setPdfAttachments((current) =>
          current.map((attachment) =>
            attachment.id === attachmentId
              ? {
                  ...attachment,
                  status: "failed",
                  error:
                    error instanceof Error ? error.message : "Failed to parse PDF",
                }
              : attachment,
          ),
        );
      }
    }
  }, []);

  const clearAttachments = useCallback(() => {
    setPdfAttachments([]);
  }, []);

  return {
    pdfAttachments,
    handlePickPdf,
    handleRemovePdf,
    clearAttachments,
  };
};
