
export interface ApplicationActivity {
    id: number;
    jobApplicationId: number;
    type: string;
    title: string;
    description: string | null;
    activityDate: string;
    dueDate: string | null;
    status: string;
    createdAt: string;
}

export interface CreateApplicationActivityRequest {
    type: string;
    title: string;
    description: string | null;
    activityDate: string;
    dueDate: string | null;
}
