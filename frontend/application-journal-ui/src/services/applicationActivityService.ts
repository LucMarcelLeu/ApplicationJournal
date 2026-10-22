
import type {
    ApplicationActivity,
    CreateApplicationActivityRequest,
} from "../types/applicationActivity";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export async function getApplicationActivities(
    jobApplicationId: number,
): Promise<ApplicationActivity[]> {
    const response = await fetch(
        `${API_URL}/applications/${jobApplicationId}/activities`,
    );

    if (!response.ok) {
        throw new Error("Aktivitäten konnten nicht geladen werden.");
    }

    return response.json();
}

export async function createApplicationActivity(
    jobApplicationId: number,
    request: CreateApplicationActivityRequest,
): Promise<ApplicationActivity> {
    const response = await fetch(
        `${API_URL}/applications/${jobApplicationId}/activities`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
        },
    );

    if (!response.ok) {
        const details = await response.text();

        throw new Error(
            `Aktivität konnte nicht gespeichert werden: HTTP ${response.status} ${details || response.statusText
            }`,
        );
    }

    return response.json();
}

export async function completeApplicationActivity(
    jobApplicationId: number,
    activityId: number,
): Promise<void> {
    const response = await fetch(
        `${API_URL}/applications/${jobApplicationId}/activities/${activityId}/complete`,
        {
            method: "PATCH",
        },
    );

    if (!response.ok) {
        const details = await response.text();

        throw new Error(
            `Aufgabe konnte nicht abgeschlossen werden: HTTP ${response.status} ${details || response.statusText
            }`,
        );
    }
}

export interface OpenApplicationActivity {
    id: number;
    jobApplicationId: number;
    company: string;
    position: string;
    title: string;
    description: string | null;
    activityDate: string;
    dueDate: string | null;
    status: string;
    isOverdue: boolean;
}

export async function getOpenApplicationActivities(): Promise<
    OpenApplicationActivity[]
> {
    const response = await fetch(`${API_URL}/activities/open`);

    if (!response.ok) {
        throw new Error("Offene Aufgaben konnten nicht geladen werden.");
    }

    return response.json();
}
