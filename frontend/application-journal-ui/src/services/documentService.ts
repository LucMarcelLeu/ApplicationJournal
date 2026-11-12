import type { ApplicationDocument } from "../types/applicationDocument";
import { apiFetch } from "./apiFetch";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export async function getDocuments(
    applicationId: number,
): Promise<ApplicationDocument[]> {
    const response = await apiFetch(
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

    const response = await apiFetch(
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

export async function downloadDocument(
    applicationId: number,
    documentId: number,
): Promise<void> {
    const response = await apiFetch(
        `${API_URL}/applications/${applicationId}/documents/${documentId}/download`,
    );

    if (!response.ok) {
        throw new Error("Dokument konnte nicht heruntergeladen werden.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "dokument";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

export async function getDocumentPreview(
    applicationId: number,
    documentId: number,
): Promise<string> {
    const response = await apiFetch(
        `${API_URL}/applications/${applicationId}/documents/${documentId}/preview`,
    );

    if (!response.ok) {
        throw new Error("PDF-Vorschau konnte nicht geladen werden.");
    }

    const blob = await response.blob();

    return URL.createObjectURL(blob);
}

export async function deleteDocument(
    applicationId: number,
    documentId: number
): Promise<void> {
    const response = await apiFetch(
        `${API_URL}/applications/${applicationId}/documents/${documentId}`,
        { method: "DELETE" }
    );

    if (!response.ok) {
        throw new Error("Dokument konnte nicht gelöscht werden.");
    }
}