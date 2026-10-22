import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
} from "@mui/material";

interface ApplicationFormDialogProps {
    open: boolean;
    editingId: number | null;
    saving: boolean;
    formError: string | null;

    company: string;
    position: string;
    location: string;
    address: string;
    contactPerson: string;
    email: string;
    phone: string;
    jobUrl: string;
    applicationDate: string;
    notes: string;

    onClose: () => void;
    onSave: () => void;

    onCompanyChange: (value: string) => void;
    onPositionChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onAddressChange: (value: string) => void;
    onContactPersonChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onPhoneChange: (value: string) => void;
    onJobUrlChange: (value: string) => void;
    onApplicationDateChange: (value: string) => void;
    onNotesChange: (value: string) => void;
}

export default function ApplicationFormDialog({
    open,
    editingId,
    saving,
    formError,
    company,
    position,
    location,
    address,
    contactPerson,
    email,
    phone,
    jobUrl,
    applicationDate,
    notes,
    onClose,
    onSave,
    onCompanyChange,
    onPositionChange,
    onLocationChange,
    onAddressChange,
    onContactPersonChange,
    onEmailChange,
    onPhoneChange,
    onJobUrlChange,
    onApplicationDateChange,
    onNotesChange,
}: ApplicationFormDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>
                {editingId !== null
                    ? "Bewerbung bearbeiten"
                    : "Neue Bewerbung erfassen"}
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2.5} sx={{ pt: 1 }}>
                    {formError && (
                        <Alert severity="error">{formError}</Alert>
                    )}

                    <TextField
                        label="Unternehmen"
                        value={company}
                        onChange={(event) => onCompanyChange(event.target.value)}
                        required
                        fullWidth
                        autoFocus
                    />

                    <TextField
                        label="Stellenbezeichnung"
                        value={position}
                        onChange={(event) => onPositionChange(event.target.value)}
                        required
                        fullWidth
                    />

                    <TextField
                        label="Arbeitsort"
                        value={location}
                        onChange={(event) => onLocationChange(event.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Adresse"
                        value={address}
                        onChange={(event) => onAddressChange(event.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Kontaktperson"
                        value={contactPerson}
                        onChange={(event) => onContactPersonChange(event.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="E-Mail"
                        type="email"
                        value={email}
                        onChange={(event) => onEmailChange(event.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Telefon"
                        type="tel"
                        value={phone}
                        onChange={(event) => onPhoneChange(event.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Link zur Stelle"
                        type="url"
                        value={jobUrl}
                        onChange={(event) => onJobUrlChange(event.target.value)}
                        fullWidth
                        placeholder="https://..."
                    />

                    <TextField
                        label="Bewerbungsdatum"
                        type="date"
                        value={applicationDate}
                        onChange={(event) =>
                            onApplicationDateChange(event.target.value)
                        }
                        required
                        fullWidth
                        slotProps={{
                            inputLabel: { shrink: true },
                        }}
                    />

                    <TextField
                        label="Notizen"
                        value={notes}
                        onChange={(event) => onNotesChange(event.target.value)}
                        multiline
                        minRows={3}
                        fullWidth
                        placeholder="Zum Beispiel: Kontaktperson, Telefonat oder Rückmeldung ..."
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, pt: 1 }}>
                <Button onClick={onClose} disabled={saving}>
                    Abbrechen
                </Button>

                <Button
                    variant="contained"
                    onClick={onSave}
                    disabled={saving}
                >
                    {saving ? (
                        <CircularProgress size={22} color="inherit" />
                    ) : editingId !== null ? (
                        "Änderungen speichern"
                    ) : (
                        "Speichern"
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}