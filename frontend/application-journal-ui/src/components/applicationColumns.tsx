import AttachFileIcon from "@mui/icons-material/AttachFile";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HistoryIcon from "@mui/icons-material/History";

import {
    IconButton,
    Link,
    MenuItem,
    Select,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";

import type { GridColDef } from "@mui/x-data-grid";
import type { JobApplication } from "../types/jobApplication";

interface ApplicationColumnsProps {
    statusLabels: Record<string, string>;
    onEdit: (application: JobApplication) => void;
    onStatusChange: (
        application: JobApplication,
        newStatus: string,
    ) => void;
    onOpenDocuments: (application: JobApplication) => void;
    onOpenActivities: (application: JobApplication) => void;
}

const safeHttpUrl = (
    value: string | null | undefined,
): string | null => {
    if (!value) return null;

    try {
        const url = new URL(value.trim());

        return url.protocol === "http:" || url.protocol === "https:"
            ? url.href
            : null;
    } catch {
        return null;
    }
};

export function createApplicationColumns({
    statusLabels,
    onEdit,
    onStatusChange,
    onOpenDocuments,
    onOpenActivities,
}: ApplicationColumnsProps): GridColDef<JobApplication>[] {
    return [
        {
            field: "applicationDate",
            headerName: "Bewerbungsdatum",
            width: 160,
            valueFormatter: (value) =>
                value
                    ? new Date(`${value}T00:00:00`).toLocaleDateString("de-CH")
                    : "",
        },
        {
            field: "company",
            headerName: "Unternehmen",
            flex: 1,
            minWidth: 170,
        },
        {
            field: "position",
            headerName: "Stelle",
            flex: 1.4,
            minWidth: 220,
            renderCell: (params) => {
                const url = safeHttpUrl(params.row.jobUrl);

                return url ? (
                    <Link
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                    >
                        {params.row.position}
                    </Link>
                ) : (
                    params.row.position
                );
            },
        },
        {
            field: "location",
            headerName: "Arbeitsort",
            width: 150,
            valueGetter: (value) => value || "–",
        },
        {
            field: "contactPerson",
            headerName: "Kontakt",
            width: 230,
            sortable: false,
            renderCell: (params) => {
                const { contactPerson, email, phone } = params.row;

                if (!contactPerson && !email && !phone) {
                    return "–";
                }

                return (
                    <Stack sx={{ justifyContent: "center", lineHeight: 1.3, py: 0.5 }}>
                        {contactPerson && (
                            <Typography variant="body2">{contactPerson}</Typography>
                        )}
                        {email && (
                            <Link
                                href={`mailto:${email}`}
                                variant="body2"
                                underline="hover"
                            >
                                {email}
                            </Link>
                        )}
                        {phone && (
                            <Link
                                href={`tel:${phone.replace(/\s+/g, "")}`}
                                variant="body2"
                                underline="hover"
                            >
                                {phone}
                            </Link>
                        )}
                    </Stack>
                );
            },
        },
        {
            field: "status",
            headerName: "Status",
            width: 210,
            sortable: false,
            renderCell: (params) => (
                <Select
                    size="small"
                    fullWidth
                    value={params.row.status}
                    onChange={(event) =>
                        onStatusChange(params.row, event.target.value)
                    }
                    aria-label={`Status für ${params.row.company}`}
                >
                    {Object.entries(statusLabels).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                            {label}
                        </MenuItem>
                    ))}
                </Select>
            ),
        },
        {
            field: "actions",
            headerName: "Aktionen",
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Bewerbung bearbeiten">
                        <IconButton
                            size="small"
                            aria-label="Bewerbung bearbeiten"
                            onClick={() => onEdit(params.row)}
                        >
                            <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Dokumente verwalten">
                        <IconButton
                            size="small"
                            aria-label="Dokumente verwalten"
                            onClick={() => onOpenDocuments(params.row)}
                        >
                            <AttachFileIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Aktivitäten anzeigen">
                        <IconButton
                            size="small"
                            aria-label="Aktivitäten anzeigen"
                            onClick={() => onOpenActivities(params.row)}
                        >
                            <HistoryIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ];
}