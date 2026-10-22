export interface JobApplication {
    id: number;
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
    createdAt: string;
}

export interface CreateJobApplicationRequest {
    company: string;
    position: string;
    location: string | null;
    address: string | null;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    jobUrl: string | null;
    applicationDate: string;
    notes: string | null;
}