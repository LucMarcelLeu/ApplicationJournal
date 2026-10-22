import type {
    JobApplication,
    CreateJobApplicationRequest,
} from "../types/jobApplication";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export async function getApplications(): Promise<JobApplication[]> {
    const response = await fetch(`${API_URL}/applications`);

    if (!response.ok) {
        throw new Error("Bewerbungen konnten nicht geladen werden.");
    }

    return response.json();
}

export async function createApplication(
    request: CreateJobApplicationRequest,
): Promise<JobApplication> {
    const response = await fetch(`${API_URL}/applications`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error("Bewerbung konnte nicht gespeichert werden.");
    }

    return response.json();
}

export async function updateApplicationStatus(
    id: number,
    status: string,
): Promise<void> {
    const response = await fetch(`${API_URL}/applications/${id}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        const details = await response.text();

        throw new Error(
            `HTTP ${response.status}: ${details || response.statusText}`,
        );
    }
}

export interface UpdateJobApplicationRequest {
    company: string;
    position: string;
    location: string | null;
    address: string | null;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    jobUrl: string | null;
    applicationDate: string;
    status: string;
    notes: string | null;
}

export async function updateApplication(
    id: number,
    request: UpdateJobApplicationRequest,
): Promise<void> {
    const response = await fetch(`${API_URL}/applications/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const details = await response.text();

        throw new Error(
            `Bewerbung konnte nicht aktualisiert werden: HTTP ${response.status} ${details || response.statusText
            }`,
        );
    }
}
