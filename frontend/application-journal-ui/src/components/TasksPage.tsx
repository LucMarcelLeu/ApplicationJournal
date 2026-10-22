import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import {
    getOpenApplicationActivities,
    completeApplicationActivity,
} from "../services/applicationActivityService";

import type {
    OpenApplicationActivity,
} from "../services/applicationActivityService";

interface TasksPageProps {
    onBackToApplications: () => void;
}

export default function TasksPage({
    onBackToApplications,
}: TasksPageProps) {
    const [tasks, setTasks] = useState<OpenApplicationActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [completingId, setCompletingId] = useState<number | null>(null);

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await getOpenApplicationActivities();
            setTasks(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Aufgaben konnten nicht geladen werden.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadTasks();
    }, [loadTasks]);

    const handleComplete = async (task: OpenApplicationActivity) => {
        setCompletingId(task.id);
        setError(null);

        try {
            await completeApplicationActivity(
                task.jobApplicationId,
                task.id,
            );

            setTasks((current) =>
                current.filter((item) => item.id !== task.id),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Aufgabe konnte nicht abgeschlossen werden.",
            );
        } finally {
            setCompletingId(null);
        }
    };

    return (
        <Stack spacing={3}>
            <Box>
                <Button
                    onClick={onBackToApplications}
                    sx={{ mb: 1 }}
                >
                    ← Zurück zu den Bewerbungen
                </Button>

                <Typography variant="h5" component="h1">
                    Aufgaben
                </Typography>

                <Typography color="text.secondary">
                    Offene Aufgaben zu deinen Bewerbungen
                </Typography>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => void loadTasks()}
                        >
                            Erneut versuchen
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        p: 4,
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : tasks.length === 0 ? (
                <Alert severity="success">
                    Du hast aktuell keine offenen Aufgaben.
                </Alert>
            ) : (
                <>
                    <Typography color="text.secondary">
                        {tasks.length} offene{" "}
                        {tasks.length === 1 ? "Aufgabe" : "Aufgaben"}
                    </Typography>

                    {tasks.map((task) => (
                        <Paper
                            key={task.id}
                            variant="outlined"
                            sx={{ p: 2 }}
                        >
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2}
                                sx={{ alignItems: { sm: "center" } }}
                            >
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1">
                                        {task.title}
                                    </Typography>

                                    <Typography variant="body2">
                                        {task.company} — {task.position}
                                    </Typography>

                                    {task.description && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1 }}
                                        >
                                            {task.description}
                                        </Typography>
                                    )}

                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{ mt: 1, alignItems: "center" }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Fällig am:{" "}
                                            {task.dueDate
                                                ? new Date(
                                                    task.dueDate,
                                                ).toLocaleDateString("de-CH")
                                                : "Kein Datum"}
                                        </Typography>

                                        {task.isOverdue && (
                                            <Chip
                                                label="Überfällig"
                                                color="error"
                                                size="small"
                                            />
                                        )}
                                    </Stack>
                                </Box>

                                <Button
                                    variant="contained"
                                    size="small"
                                    disabled={completingId === task.id}
                                    onClick={() => void handleComplete(task)}
                                >
                                    {completingId === task.id
                                        ? "Wird erledigt …"
                                        : "Erledigt"}
                                </Button>
                            </Stack>
                        </Paper>
                    ))}
                </>
            )}
        </Stack>
    );
}