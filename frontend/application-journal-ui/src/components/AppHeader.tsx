import type { ChangeEvent, RefObject } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import AddIcon from "@mui/icons-material/Add";

interface AppHeaderProps {
    importFileInputRef: RefObject<HTMLInputElement | null>;
    onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onNewApplication: () => void;
    activePage: "applications" | "tasks";
    onNavigate: (page: "applications" | "tasks") => void;
}

export default function AppHeader({
    importFileInputRef,
    onImportFileChange,
    onNewApplication,
    activePage,
    onNavigate,
}: AppHeaderProps)  {
    return (
        <Box
            sx={{
                mb: 2,
                display: "flex",
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                flexDirection: { xs: "column", lg: "row" },
                gap: 2,
            }}
        >
            <Box>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: 700 }}
                >
                    ApplicationJournal
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Übersicht deiner Stellenbewerbungen
                </Typography>
            </Box>

            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                useFlexGap
                sx={{
                    flexWrap: "wrap",
                    alignItems: "center",
                    width: { xs: "100%", lg: "auto" },
                }}
            >
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        width: { xs: "100%", sm: "auto" },
                    }}
                >
                    <Button
                        fullWidth
                        variant={
                            activePage === "applications"
                                ? "contained"
                                : "outlined"
                        }
                        onClick={() => onNavigate("applications")}
                    >
                        Bewerbungen
                    </Button>

                    <Button
                        fullWidth
                        variant={
                            activePage === "tasks"
                                ? "contained"
                                : "outlined"
                        }
                        onClick={() => onNavigate("tasks")}
                    >
                        Aufgaben
                    </Button>
                </Stack>

                <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    hidden
                    onChange={onImportFileChange}
                />

                <Button
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    onClick={() => importFileInputRef.current?.click()}
                >
                    RAV-PDF importieren
                </Button>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onNewApplication}
                >
                    Neue Bewerbung
                </Button>
            </Stack>
        </Box>
    );
}