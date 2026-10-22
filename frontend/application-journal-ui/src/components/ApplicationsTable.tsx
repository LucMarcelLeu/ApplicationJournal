import { Box, CircularProgress } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import type { JobApplication } from "../types/jobApplication";

interface ApplicationsTableProps {
    loading: boolean;
    rows: JobApplication[];
    columns: GridColDef[];
}

interface ApplicationsTableProps {
    loading: boolean;
    rows: JobApplication[];
    columns: GridColDef[];
}

export default function ApplicationsTable({
    loading,
    rows,
    columns,
}: ApplicationsTableProps) {
    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: 6,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ flex: 1, minHeight: 0 }}>
            <DataGrid
                rows={rows}
                columns={columns}
                getRowHeight={() => "auto"}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                    pagination: {
                        paginationModel: {
                            page: 0,
                            pageSize: 25,
                        },
                    },
                }}
                sx={{
                    height: "100%",
                    "& .MuiDataGrid-cell": {
                        display: "flex",
                        alignItems: "center",
                        py: 1,
                    },
                }}
                localeText={{
                    noRowsLabel: "Noch keine Bewerbungen vorhanden",
                    footerRowSelected: (count) =>
                        `${count} Zeile(n) ausgewählt`,
                }}
            />
        </Box>
    );
}