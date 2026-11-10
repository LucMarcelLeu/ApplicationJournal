import { useState, type ChangeEvent, type RefObject } from "react";
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
    getDownloadUrl: (applicationId: number, documentId: number) => string;
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
    getDownloadUrl,
}: ApplicationDocumentsDialogProps) {

    const [previewDocument, setPreviewDocument] =
        useState<ApplicationDocument | null>(null);


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
                            {uploading ? "Wird hochgeladen …" : "Dokument hochladen"}
                        </Button>

                        <Typography variant="caption" color="text.secondary">
                            Erlaubt: PDF, Word, TXT, PNG und JPG. Maximale Dateigrösse:
                            10 MB.
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
                                                    {(document.fileSize / (1024 * 1024)).toFixed(2)} MB
                                                    {" · "}
                                                    {new Date(document.uploadedAt).toLocaleDateString(
                                                        "de-CH",
                                                    )}
                                                </Typography>
                                            </Box>

                                            <Tooltip title="PDF-Vorschau">
                                                <span>
                                                    <IconButton
                                                        aria-label={`PDF ${document.originalFileName} anzeigen`}
                                                        disabled={document.contentType !== "application/pdf"}
                                                        onClick={() => setPreviewDocument(document)}
                                                    >
                                                        <VisibilityOutlinedIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>

                                            <Tooltip title="Dokument öffnen oder herunterladen">
                                                <IconButton
                                                    component="a"
                                                    href={
                                                        application
                                                            ? getDownloadUrl(application.id, document.id)
                                                            : undefined
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    aria-label="Dokument öffnen oder herunterladen"
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
                                                        onDelete(document.id, document.originalFileName)
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

            <Dialog
                open={previewDocument !== null}
                onClose={() => setPreviewDocument(null)}
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
                    {previewDocument && application && (
                        <Box
                            component="iframe"
                            src={`${getDownloadUrl(
                                application.id,
                                previewDocument.id,
                            ).replace(/\/download$/, "/preview")}#toolbar=1&navpanes=0`}
                            title={previewDocument.originalFileName}
                            sx={{
                                width: "100%",
                                height: "100%",
                                border: 0,
                            }}
                        />
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setPreviewDocument(null)}>
                        Schliessen
                    </Button>
                </DialogActions>
            </Dialog>
        </>

    );
}
