const API_URL = import.meta.env.VITE_API_BASE_URL;

export interface JobApplicationImportPreview {
    applicationDate: string;
    company: string | null;
    position: string | null;
    location: string | null;
    address: string | null;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    jobUrl: string | null;
    suggestedStatus: string;
    notes: string | null;
    rawText: string;
    warnings: string[];
}

export interface ApplicationImportPreviewResponse {
    fileName: string;
    applicationCount: number;
    applications: JobApplicationImportPreview[];
}

export interface ApplicationImportSaveResponse {
    savedCount: number;
    message: string;
}

export async function previewApplications(
    file: File,
): Promise<ApplicationImportPreviewResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
        `${API_URL}/applications/import/structured-preview`,
        {
            method: "POST",
            body: formData,
        },
    );

    if (!response.ok) {
        const details = await response.text();

        throw new Error(
            `PDF konnte nicht verarbeitet werden: HTTP ${response.status} ${details || response.statusText
            }`,
        );
    }

    return response.json();
}

export async function saveImportedApplications(
    applications: JobApplicationImportPreview[],
): Promise<ApplicationImportSaveResponse> {
    const response = await fetch(
        `${API_URL}/applications/import/save`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(applications),
        },
    );

    if (!response.ok) {
        const details = await response.text();

        throw new Error(
            `Bewerbungen konnten nicht importiert werden: HTTP ${response.status
            } ${details || response.statusText}`,
        );
    }

    return response.json();
}
