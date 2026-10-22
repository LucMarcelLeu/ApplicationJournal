import type { ApplicationDocument } from "../types/applicationDocument";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export async function getDocuments(
    applicationId: number,
): Promise<ApplicationDocument[]> {
    const response = await fetch(
        `${API_URL}/applications/${applicationId}/documents`,
    );

    if (!response.ok) {
        throw new Error("Dokumente konnten nicht geladen werden.");
    }

    return response.json();
}

export async function uploadDocument(
    applicationId: number,
    file: File,
    documentType: string,
): Promise<ApplicationDocument> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const response = await fetch(
        `${API_URL}/applications/${applicationId}/documents`,
        {
            method: "POST",
            body: formData,
        },
    );

    if (!response.ok) {
        const details = await response.text();
        throw new Error(
            `Upload fehlgeschlagen (HTTP ${response.status}): ${details}`,
        );
    }

    return response.json();
}

export function getDocumentDownloadUrl(
    applicationId: number,
    documentId: number,
): string {
    return `${API_URL}/applications/${applicationId}/documents/${documentId}/download`;
}

export async function deleteDocument(
    applicationId: number,
    documentId: number
): Promise<void> {
    const response = await fetch(
        `${API_URL}/applications/${applicationId}/documents/${documentId}`,
        { method: "DELETE" }
    );

    if (!response.ok) {
        throw new Error("Dokument konnte nicht gelöscht werden.");
    }
}
