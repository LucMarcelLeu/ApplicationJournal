import {
    useEffect,
    useState,
    type ChangeEvent,
    type RefObject,
} from "react";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";

import type { SelectChangeEvent } from "@mui/material";

import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import type { ApplicationDocument } from "../types/applicationDocument";
import type { JobApplication } from "../types/jobApplication";

interface ApplicationDocumentsDialogProps {
    open: boolean;
    application: JobApplication | null;
    documents: ApplicationDocument[];
    loading: boolean;
    error: string | null;
    uploading: boolean;
    documentType: string;
    documentTypes: string[];
    fileInputRef: RefObject<HTMLInputElement | null>;
    onClose: () => void;
    onDocumentTypeChange: (value: string) => void;
    onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
    onDelete: (documentId: number, fileName: string) => void;
    onDownload: (documentId: number) => void;
    onPreview: (documentId: number) => Promise<string>;
}

export default function ApplicationDocumentsDialog({
    open,
    application,
    documents,
    loading,
    error,
    uploading,
    documentType,
    documentTypes,
    fileInputRef,
    onClose,
    onDocumentTypeChange,
    onUpload,
    onDelete,
    onDownload,
    onPreview,
}: ApplicationDocumentsDialogProps) {
    const [previewDocument, setPreviewDocument] =
        useState<ApplicationDocument | null>(null);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // PDF-Vorschau laden und Blob-URL beim Wechsel freigeben.
    useEffect(() => {
        if (!previewDocument) {
            setPreviewUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return null;
            });
            setPreviewError(null);
            return;
        }

        let active = true;
        let createdUrl: string | null = null;

        setPreviewLoading(true);
        setPreviewError(null);

        if (!application) {
            setPreviewError("Keine Bewerbung ausgewählt.");
            setPreviewLoading(false);
            return;
        }

        onPreview(previewDocument.id)
            .then((url) => {
                createdUrl = url;

                if (active) {
                    setPreviewUrl(url);
                } else {
                    URL.revokeObjectURL(url);
                }
            })
            .catch((error: unknown) => {
                if (active) {
                    setPreviewError(
                        error instanceof Error
                            ? error.message
                            : "PDF-Vorschau konnte nicht geladen werden.",
                    );
                }
            })
            .finally(() => {
                if (active) {
                    setPreviewLoading(false);
                }
            });

        return () => {
            active = false;

            if (createdUrl) {
                URL.revokeObjectURL(createdUrl);
            }
        };
    }, [previewDocument, application, onPreview]);

    const closePreview = () => {
        setPreviewDocument(null);
        setPreviewUrl(null);
        setPreviewError(null);
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={() => {
                    if (!uploading) onClose();
                }}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    Dokumente
                    {application ? ` – ${application.company}` : ""}
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <DialogContentText>
                            Stelleninserate, Motivationsschreiben, Lebensläufe und
                            weitere Unterlagen zu dieser Bewerbung.
                        </DialogContentText>

                        {error && <Alert severity="error">{error}</Alert>}

                        <FormControl fullWidth>
                            <InputLabel id="document-type-label">
                                Dokumenttyp
                            </InputLabel>

                            <Select
                                labelId="document-type-label"
                                label="Dokumenttyp"
                                value={documentType}
                                onChange={(event: SelectChangeEvent) =>
                                    onDocumentTypeChange(event.target.value)
                                }
                            >
                                {documentTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                            hidden
                            onChange={onUpload}
                        />

                        <Button
                            variant="contained"
                            startIcon={
                                uploading ? (
                                    <CircularProgress size={18} color="inherit" />
                                ) : (
                                    <AttachFileIcon />
                                )
                            }
                            disabled={uploading || loading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading
                                ? "Wird hochgeladen …"
                                : "Dokument hochladen"}
                        </Button>

                        <Typography variant="caption" color="text.secondary">
                            Erlaubt: PDF, Word, TXT, PNG und JPG. Maximale
                            Dateigrösse: 10 MB.
                        </Typography>

                        {loading ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    p: 3,
                                }}
                            >
                                <CircularProgress />
                            </Box>
                        ) : documents.length === 0 ? (
                            <Typography color="text.secondary">
                                Noch keine Dokumente vorhanden.
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                {documents.map((document) => (
                                    <Paper
                                        key={document.id}
                                        variant="outlined"
                                        sx={{ p: 1.5 }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            sx={{ alignItems: "center" }}
                                        >
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        overflowWrap: "anywhere",
                                                    }}
                                                >
                                                    {document.originalFileName}
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {document.documentType}
                                                    {" · "}
                                                    {(
                                                        document.fileSize /
                                                        (1024 * 1024)
                                                    ).toFixed(2)} MB
                                                    {" · "}
                                                    {new Date(
                                                        document.uploadedAt,
                                                    ).toLocaleDateString("de-CH")}
                                                </Typography>
                                            </Box>

                                            <Tooltip title="PDF-Vorschau">
                                                <span>
                                                    <IconButton
                                                        aria-label={`PDF ${document.originalFileName} anzeigen`}
                                                        disabled={
                                                            document.contentType !==
                                                            "application/pdf"
                                                        }
                                                        onClick={() =>
                                                            setPreviewDocument(document)
                                                        }
                                                    >
                                                        <VisibilityOutlinedIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>

                                            <Tooltip title="Dokument herunterladen">
                                                <IconButton
                                                    aria-label={`Dokument ${document.originalFileName} herunterladen`}
                                                    onClick={() =>
                                                        onDownload(document.id)
                                                    }
                                                >
                                                    <DownloadOutlinedIcon />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Dokument löschen">
                                                <IconButton
                                                    color="error"
                                                    aria-label={`Dokument ${document.originalFileName} löschen`}
                                                    disabled={uploading}
                                                    onClick={() =>
                                                        onDelete(
                                                            document.id,
                                                            document.originalFileName,
                                                        )
                                                    }
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} disabled={uploading}>
                        Schliessen
                    </Button>
                </DialogActions>
            </Dialog>

            {/* PDF-Vorschau */}
            <Dialog
                open={previewDocument !== null}
                onClose={closePreview}
                fullWidth
                maxWidth="lg"
                sx={{
                    "& .MuiDialog-paper": {
                        height: "90vh",
                    },
                }}
            >
                <DialogTitle>
                    PDF-Vorschau
                    {previewDocument
                        ? ` – ${previewDocument.originalFileName}`
                        : ""}
                </DialogTitle>

                <DialogContent
                    dividers
                    sx={{
                        p: 0,
                        overflow: "hidden",
                    }}
                >
                    {previewLoading && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: "100%",
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}

                    {previewError && (
                        <Alert severity="error" sx={{ m: 2 }}>
                            {previewError}
                        </Alert>
                    )}

                    {previewUrl && (
                        <Box
                            component="iframe"
                            src={`${previewUrl}#toolbar=1&navpanes=0`}
                            title={previewDocument?.originalFileName}
                            sx={{
                                width: "100%",
                                height: "100%",
                                border: 0,
                            }}
                        />
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={closePreview}>
                        Schliessen
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}