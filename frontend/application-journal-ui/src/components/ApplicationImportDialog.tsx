import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import type { JobApplicationImportPreview } from "../services/applicationImportService";

interface ApplicationImportDialogProps {
    open: boolean;
    loading: boolean;
    saving: boolean;
    error: string | null;
    message: string | null;
    applications: JobApplicationImportPreview[];
    selectedIndexes: number[];
    validated: boolean;
    statusLabels: Record<string, string>;

    onClose: () => void;
    onCancel: () => void;
    onSave: () => void;
    onSelectionChange: (indexes: number[]) => void;
    onUpdateField: (
        index: number,
        changes: Partial<JobApplicationImportPreview>,
    ) => void;

    isEntryInvalid: (application: JobApplicationImportPreview) => boolean;
}

export default function ApplicationImportDialog({
    open,
    loading,
    saving,
    error,
    message,
    applications,
    selectedIndexes,
    validated,
    statusLabels,
    onClose,
    onCancel,
    onSave,
    onSelectionChange,
    onUpdateField,
    isEntryInvalid,
}: ApplicationImportDialogProps) {
    const allSelected =
        applications.length > 0 &&
        selectedIndexes.length === applications.length;

    return (
        <Dialog
            open={open}
            onClose={() => {
                if (!loading && !saving) {
                    onClose();
                }
            }}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>RAV-Bewerbungen importieren</DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {message && <Alert severity="success">{message}</Alert>}

                    {loading ? (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                p: 5,
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <Typography color="text.secondary">
                                Prüfe die erkannten Bewerbungen und korrigiere die Felder
                                vor dem Speichern. Es werden noch keine Daten gespeichert.
                            </Typography>

                            {applications.length > 0 && (
                                <Stack
                                    direction="row"
                                    sx={{
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: 1,
                                    }}
                                >
                                    <Typography variant="body2">
                                        {selectedIndexes.length} von {applications.length}{" "}
                                        Bewerbungen ausgewählt
                                    </Typography>

                                    <Button
                                        size="small"
                                        onClick={() => {
                                            onSelectionChange(
                                                allSelected
                                                    ? []
                                                    : applications.map((_, index) => index),
                                            );
                                        }}
                                    >
                                        {allSelected ? "Alle abwählen" : "Alle auswählen"}
                                    </Button>
                                </Stack>
                            )}

                            {applications.map((application, index) => (
                                <Paper
                                    key={index}
                                    id={`import-card-${index}`}
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderColor:
                                            validated &&
                                                selectedIndexes.includes(index) &&
                                                isEntryInvalid(application)
                                                ? "error.main"
                                                : undefined,
                                    }}
                                >
                                    <Stack spacing={2}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={selectedIndexes.includes(index)}
                                                    onChange={(event) => {
                                                        onSelectionChange(
                                                            event.target.checked
                                                                ? [...selectedIndexes, index]
                                                                : selectedIndexes.filter(
                                                                    (selected) => selected !== index,
                                                                ),
                                                        );
                                                    }}
                                                />
                                            }
                                            label={
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{ fontWeight: 600 }}
                                                >
                                                    Bewerbung {index + 1}
                                                </Typography>
                                            }
                                        />

                                        {application.warnings.length > 0 && (
                                            <Alert severity="warning">
                                                {application.warnings.join(" ")}
                                            </Alert>
                                        )}

                                        <TextField
                                            label="Unternehmen"
                                            value={application.company ?? ""}
                                            error={validated && !application.company?.trim()}
                                            onChange={(event) =>
                                                onUpdateField(index, {
                                                    company: event.target.value,
                                                })
                                            }
                                            required
                                            fullWidth
                                        />

                                        <TextField
                                            label="Stelle"
                                            value={application.position ?? ""}
                                            error={validated && !application.position?.trim()}
                                            onChange={(event) =>
                                                onUpdateField(index, {
                                                    position: event.target.value,
                                                })
                                            }
                                            required
                                            fullWidth
                                        />

                                        <TextField
                                            label="Arbeitsort"
                                            value={application.location ?? ""}
                                            onChange={(event) =>
                                                onUpdateField(index, {
                                                    location: event.target.value,
                                                })
                                            }
                                            fullWidth
                                        />

                                        <TextField
                                            label="Adresse"
                                            value={application.address ?? ""}
                                            onChange={(event) =>
                                                onUpdateField(index, {
                                                    address: event.target.value,
                                                })
                                            }
                                            fullWidth
                                        />

                                        <TextField
                                            label="Kontaktperson"
                                            value={application.contactPerson ?? ""}
                                            onChange={(event) =>
                                                onUpdateField(index, {
                                                    contactPerson: event.target.value,
                                                })
                                            }
                                            fullWidth
                                        />

                                        <TextField
                                            label="E-Mail"
                                            type="email"
                                            value={application.email ?? ""}
                                            onChange={(event) =>
                                                onUpdateField(index, {
                                                    email: event.target.value,
                                                })
                                            }
                                            fullWidth
                                        />

                                        <TextField
                                            label="Telefon"
                                            type="tel"
                                            value={application.phone ?? ""}
                                            onChange={(event) =>
                                                onUpdateField(index, {
                                                    phone: event.target.value,
                                                })
                                            }
                                            fullWidth
                                        />

                                        <TextField
                                            label="Link zur Stelle"
                                            type="url"
                                            value={application.jobUrl ?? ""}
                                            onChange={(event) =>
                                                onUpdateField(index, {
                                                    jobUrl: event.target.value,
                                                })
                                            }
                                            fullWidth
                                        />

                                        <TextField
                                            label="Bewerbungsdatum"
                                            type="date"
                                            value={application.applicationDate}
                                            onChange={(event) =>
                                                onUpdateField(index, {
                                                    applicationDate: event.target.value,
                                                })
                                            }
                                            required
                                            fullWidth
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />

                                        <FormControl fullWidth>
                                            <InputLabel id={`import-status-${index}`}>
                                                Status
                                            </InputLabel>

                                            <Select
                                                labelId={`import-status-${index}`}
                                                label="Status"
                                                value={application.suggestedStatus}
                                                onChange={(event) =>
                                                    onUpdateField(index, {
                                                        suggestedStatus: event.target.value,
                                                    })
                                                }
                                            >
                                                {Object.entries(statusLabels).map(
                                                    ([value, label]) => (
                                                        <MenuItem key={value} value={value}>
                                                            {label}
                                                        </MenuItem>
                                                    ),
                                                )}
                                            </Select>
                                        </FormControl>

                                        <TextField
                                            label="Notizen"
                                            value={application.notes ?? ""}
                                            onChange={(event) =>
                                                onUpdateField(index, {
                                                    notes: event.target.value,
                                                })
                                            }
                                            multiline
                                            minRows={2}
                                            fullWidth
                                        />
                                    </Stack>
                                </Paper>
                            ))}
                        </>
                    )}
                </Stack>
            </DialogContent>

            {error && (
                <Alert severity="error" sx={{ mx: 2.5, mb: 0 }}>
                    {error}
                </Alert>
            )}

            <DialogActions sx={{ p: 2.5 }}>
                <Button
                    onClick={onCancel}
                    disabled={loading || saving}
                >
                    Abbrechen
                </Button>

                <Button
                    variant="contained"
                    onClick={onSave}
                    disabled={
                        loading || saving || selectedIndexes.length === 0
                    }
                >
                    {saving ? (
                        <CircularProgress size={22} color="inherit" />
                    ) : (
                        `${applications.length} Bewerbungen speichern`
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
