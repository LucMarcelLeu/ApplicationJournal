import {
    Alert,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
    Box,
} from "@mui/material";

import type { ApplicationActivity } from "../types/applicationActivity";
import type { JobApplication } from "../types/jobApplication";

interface ApplicationActivitiesDialogProps {
    open: boolean;
    application: JobApplication | null;
    activities: ApplicationActivity[];
    loading: boolean;
    error: string | null;
    saving: boolean;
    onClose: () => void;
    onCreateActivity: () => void;
    onCompleteActivity: (activity: ApplicationActivity) => void;
    activityType: string;
    onActivityTypeChange: (value: string) => void;
    activityTitle: string;
    onActivityTitleChange: (value: string) => void;
    activityDescription: string;
    onActivityDescriptionChange: (value: string) => void;
    activityDate: string;
    onActivityDateChange: (value: string) => void;
    activityDueDate: string;
    onActivityDueDateChange: (value: string) => void;
}

function getActivityTypeLabel(type: string): string {
    switch (type) {
        case "EmailReceived":
            return "E-Mail erhalten";
        case "PhoneCall":
            return "Telefonat";
        case "Interview":
            return "Vorstellungsgespräch";
        case "PlannedAction":
            return "Geplante Aufgabe";
        default:
            return "Sonstiges";
    }
}

export default function ApplicationActivitiesDialog({
    open,
    application,
    activities,
    loading,
    error,
    saving,
    onClose,
    onCreateActivity,
    onCompleteActivity,
    activityType,
    onActivityTypeChange,
    activityTitle,
    onActivityTitleChange,
    activityDescription,
    onActivityDescriptionChange,
    activityDate,
    onActivityDateChange,
    activityDueDate,
    onActivityDueDateChange,
}: ApplicationActivitiesDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>
                Aktivitäten
                {application && (
                    <Typography variant="subtitle2" color="text.secondary">
                        {application.company} – {application.position}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent dividers>
                {loading && (
                    <Typography>Aktivitäten werden geladen …</Typography>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {!loading && !error && activities.length === 0 && (
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Für diese Bewerbung sind noch keine Aktivitäten erfasst.
                    </Typography>
                )}

                {activities.map((activity) => (
                    <Paper
                        key={activity.id}
                        variant="outlined"
                        sx={{ p: 2, mb: 1.5 }}
                    >
                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                            }}
                        >
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: "bold" }}
                                >
                                    {activity.title}
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                    {getActivityTypeLabel(activity.type)} ·{" "}
                                    {new Date(activity.activityDate).toLocaleDateString(
                                        "de-CH",
                                    )}
                                </Typography>

                                {activity.description && (
                                    <Typography
                                        sx={{ mt: 1, whiteSpace: "pre-wrap" }}
                                    >
                                        {activity.description}
                                    </Typography>
                                )}

                                {activity.dueDate && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Fällig:{" "}
                                        {new Date(activity.dueDate).toLocaleDateString("de-CH")}
                                    </Typography>
                                )}
                            </Box>

                            {activity.status === "Open" && (
                                <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
                                    <Chip label="Offen" color="warning" size="small" />
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => onCompleteActivity(activity)}
                                    >
                                        Erledigt
                                    </Button>
                                </Stack>
                            )}

                            {activity.status === "Completed" && (
                                <Chip label="Erledigt" color="success" size="small" />
                            )}
                        </Stack>
                    </Paper>
                ))}

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ mb: 2 }}>
                    Neue Aktivität erfassen
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        select
                        label="Art der Aktivität"
                        value={activityType}
                        onChange={(event) => onActivityTypeChange(event.target.value)}
                        fullWidth
                    >
                        <MenuItem value="EmailReceived">E-Mail erhalten</MenuItem>
                        <MenuItem value="PhoneCall">Telefonat</MenuItem>
                        <MenuItem value="Interview">Vorstellungsgespräch</MenuItem>
                        <MenuItem value="PlannedAction">Geplante Aufgabe</MenuItem>
                        <MenuItem value="Other">Sonstiges</MenuItem>
                    </TextField>

                    <TextField
                        label="Titel"
                        value={activityTitle}
                        onChange={(event) => onActivityTitleChange(event.target.value)}
                        required
                        fullWidth
                    />

                    <TextField
                        label="Beschreibung"
                        value={activityDescription}
                        onChange={(event) =>
                            onActivityDescriptionChange(event.target.value)
                        }
                        multiline
                        minRows={2}
                        fullWidth
                    />

                    <TextField
                        label="Aktivitätsdatum"
                        type="date"
                        value={activityDate}
                        onChange={(event) => onActivityDateChange(event.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        required
                        fullWidth
                    />

                    {activityType === "PlannedAction" && (
                        <TextField
                            label="Fällig am"
                            type="date"
                            value={activityDueDate}
                            onChange={(event) =>
                                onActivityDueDateChange(event.target.value)
                            }
                            slotProps={{ inputLabel: { shrink: true } }}
                            fullWidth
                        />
                    )}

                    <Button
                        variant="contained"
                        onClick={onCreateActivity}
                        disabled={saving || !activityTitle.trim()}
                    >
                        {saving ? "Speichert …" : "Aktivität speichern"}
                    </Button>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Schliessen</Button>
            </DialogActions>
        </Dialog>
    );
}
