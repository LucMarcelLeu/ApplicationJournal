import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import AppHeader from "./components/AppHeader";
import ApplicationActivitiesDialog from "./components/ApplicationActivitiesDialog";
import ApplicationDocumentsDialog from "./components/ApplicationDocumentsDialog";
import ApplicationImportDialog from "./components/ApplicationImportDialog";
import ApplicationFormDialog from "./components/ApplicationFormDialog";
import ApplicationsTable from "./components/ApplicationsTable";
import { createApplicationColumns } from "./components/applicationColumns";

import type { JobApplication } from "./types/jobApplication";
import type { ApplicationDocument } from "./types/applicationDocument";

import TasksPage from "./components/TasksPage";

import {
  Alert,
  Box,
  Container,
  Paper,
  Typography,
} from "@mui/material";

import {
  createApplication,
  getApplications,
  updateApplication,
  updateApplicationStatus,
} from "./services/applicationService";

import {
  getDocuments,
  getDocumentDownloadUrl,
  uploadDocument,
  deleteDocument
} from "./services/documentService";

import {
  previewApplications,
  saveImportedApplications,
} from "./services/applicationImportService";

import type {
  JobApplicationImportPreview,
} from "./services/applicationImportService";

import {
  getApplicationActivities,
  createApplicationActivity,
  completeApplicationActivity,
} from "./services/applicationActivityService";

import type { ApplicationActivity } from "./types/applicationActivity";

const statusLabels: Record<string, string> = {
  Draft: "Entwurf",
  Planned: "Geplant",
  Applied: "Beworben",
  ResponseReceived: "Rückmeldung",
  Interview: "Vorstellungsgespräch",
  Offer: "Angebot",
  Rejected: "Absage",
  Withdrawn: "Zurückgezogen",
};

const documentTypes = [
  "Stelleninserat",
  "Motivationsschreiben",
  "Lebenslauf",
  "Korrespondenz",
  "Sonstiges",
];

// Pflichtfelder eines Import-Eintrags: Firma, Stelle und Datum.
const isImportEntryInvalid = (entry: JobApplicationImportPreview) =>
  !entry.company?.trim() ||
  !entry.position?.trim() ||
  !entry.applicationDate;

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 10);
};

function App() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bewerbungsformular
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [applicationDate, setApplicationDate] = useState(today());
  const [notes, setNotes] = useState("");

  // Dokumentenverwaltung
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [documentsForApplication, setDocumentsForApplication] =
    useState<JobApplication | null>(null);

  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState("Stelleninserat");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aktivitätenverwaltung
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [activitiesForApplication, setActivitiesForApplication] =
    useState<JobApplication | null>(null);

  const [activities, setActivities] = useState<ApplicationActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activitySaving, setActivitySaving] = useState(false);

  const [activityType, setActivityType] = useState("EmailReceived");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityDate, setActivityDate] = useState(today());
  const [activityDueDate, setActivityDueDate] = useState("");

  // RAV-PDF-Import
  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const [importApplications, setImportApplications] =
    useState<JobApplicationImportPreview[]>([]);

  const importFileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImportIndexes, setSelectedImportIndexes] =
    useState<number[]>([]);

  // Wird nach einem fehlgeschlagenen Speichern gesetzt, damit fehlende
  // Pflichtfelder rot markiert werden.
  const [importValidated, setImportValidated] = useState(false);

  const [activePage, setActivePage] = useState<"applications" | "tasks">(
    "applications",
  );

  // Bewerbungen laden
  useEffect(() => {
    let active = true;

    getApplications()
      .then((data) => {
        if (active) {
          setApplications(data);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "Die Bewerbungen konnten nicht geladen werden. " +
            "Prüfe, ob die .NET-API läuft.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Formular zurücksetzen
  const resetForm = () => {
    setCompany("");
    setPosition("");
    setLocation("");
    setAddress("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setJobUrl("");
    setApplicationDate(today());
    setNotes("");
    setFormError(null);
  };

  // Neue Bewerbung öffnen
  const handleNew = () => {
    resetForm();
    setEditingId(null);
    setDialogOpen(true);
  };

  // Bewerbung bearbeiten
  const handleEdit = (application: JobApplication) => {
    setEditingId(application.id);
    setCompany(application.company);
    setPosition(application.position);
    setLocation(application.location ?? "");
    setAddress(application.address ?? "");
    setContactPerson(application.contactPerson ?? "");
    setEmail(application.email ?? "");
    setPhone(application.phone ?? "");
    setJobUrl(application.jobUrl ?? "");
    setApplicationDate(application.applicationDate);
    setNotes(application.notes ?? "");
    setFormError(null);
    setDialogOpen(true);
  };

  const handleClose = () => {
    if (saving) return;

    setDialogOpen(false);
    setEditingId(null);
    resetForm();
  };

  // Bewerbung speichern oder aktualisieren
  const handleSave = async () => {
    if (!company.trim() || !position.trim() || !applicationDate) {
      setFormError(
        "Bitte fülle Unternehmen, Stelle und Bewerbungsdatum aus.",
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    const request = {
      company: company.trim(),
      position: position.trim(),
      location: location.trim() || null,
      address: address.trim() || null,
      contactPerson: contactPerson.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      jobUrl: jobUrl.trim() || null,
      applicationDate,
      notes: notes.trim() || null,
    };

    try {
      if (editingId !== null) {
        const existing = applications.find((a) => a.id === editingId);

        await updateApplication(editingId, {
          ...request,
          status: existing?.status ?? "Applied",
        });

        setApplications((current) =>
          current
            .map((application) =>
              application.id === editingId
                ? { ...application, ...request }
                : application,
            )
            .sort((a, b) =>
              b.applicationDate.localeCompare(a.applicationDate),
            ),
        );
      } else {
        const created = await createApplication(request);

        setApplications((current) =>
          [...current, created].sort((a, b) =>
            b.applicationDate.localeCompare(a.applicationDate),
          ),
        );
      }

      setDialogOpen(false);
      setEditingId(null);
      resetForm();
      setError(null);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Die Bewerbung konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Einzelne Felder eines Import-Eintrags ändern
  const updateImportField = (
    index: number,
    patch: Partial<JobApplicationImportPreview>,
  ) => {
    setImportApplications((current) =>
      current.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const handleOpenActivities = async (application: JobApplication) => {
    setActivitiesForApplication(application);
    setActivitiesOpen(true);
    setActivities([]);
    setActivityError(null);
    setActivitiesLoading(true);

    try {
      const result = await getApplicationActivities(application.id);
      setActivities(result);
    } catch (err) {
      setActivityError(
        err instanceof Error
          ? err.message
          : "Aktivitäten konnten nicht geladen werden.",
      );
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleCreateActivity = async () => {
    if (!activitiesForApplication || !activityTitle.trim()) {
      setActivityError("Bitte gib einen Titel ein.");
      return;
    }

    setActivitySaving(true);
    setActivityError(null);

    try {
      await createApplicationActivity(activitiesForApplication.id, {
        type: activityType,
        title: activityTitle.trim(),
        description: activityDescription.trim() || null,
        activityDate: new Date(`${activityDate}T12:00:00`).toISOString(),
        dueDate:
          activityType === "PlannedAction" && activityDueDate
            ? new Date(`${activityDueDate}T12:00:00`).toISOString()
            : null,
      });

      const result = await getApplicationActivities(
        activitiesForApplication.id,
      );
      setActivities(result);

      setActivityTitle("");
      setActivityDescription("");
      setActivityDate(today());
      setActivityDueDate("");
      setActivityType("EmailReceived");
    } catch (err) {
      setActivityError(
        err instanceof Error
          ? err.message
          : "Aktivität konnte nicht gespeichert werden.",
      );
    } finally {
      setActivitySaving(false);
    }
  };

  const handleCompleteActivity = async (activity: ApplicationActivity) => {
    if (!activitiesForApplication) {
      return;
    }

    setActivityError(null);

    try {
      await completeApplicationActivity(
        activitiesForApplication.id,
        activity.id,
      );

      const result = await getApplicationActivities(
        activitiesForApplication.id,
      );

      setActivities(result);
    } catch (err) {
      setActivityError(
        err instanceof Error
          ? err.message
          : "Aufgabe konnte nicht abgeschlossen werden.",
      );
    }
  };

  // RAV-PDF auswählen und Vorschau laden
  const handleImportFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setImportError("Bitte wähle eine PDF-Datei aus.");
      setImportOpen(true);
      return;
    }

    setImportOpen(true);
    setImportLoading(true);
    setImportError(null);
    setImportMessage(null);
    setImportValidated(false);
    setImportApplications([]);

    try {
      const result = await previewApplications(file);
      setImportApplications(result.applications);
      setSelectedImportIndexes(
        result.applications.map((_, index) => index),
      );

    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Die PDF-Vorschau konnte nicht geladen werden.",
      );
    } finally {
      setImportLoading(false);
    }
  };

  // Ausgewählte Bewerbungen speichern
  const handleSaveImportedApplications = async () => {
    const selectedApplications = importApplications.filter(
      (_, index) => selectedImportIndexes.includes(index),
    );

    if (selectedApplications.length === 0) {
      setImportError("Bitte wähle mindestens eine Bewerbung aus.");
      return;
    }

    const invalidIndexes = importApplications
      .map((application, index) => ({ application, index }))
      .filter(
        ({ application, index }) =>
          selectedImportIndexes.includes(index) &&
          isImportEntryInvalid(application),
      )
      .map(({ index }) => index);

    if (invalidIndexes.length > 0) {
      const numbers = invalidIndexes.map((index) => index + 1).join(", ");

      setImportValidated(true);
      setImportError(
        `Bewerbung ${numbers}: Firma, Stelle und Datum sind Pflichtfelder. ` +
        "Bitte ausfüllen oder den Eintrag abwählen.",
      );

      // Zum ersten fehlerhaften Eintrag scrollen.
      document
        .getElementById(`import-card-${invalidIndexes[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });

      return;
    }

    setImportSaving(true);
    setImportError(null);

    try {
      const result = await saveImportedApplications(
        selectedApplications,
      );

      setImportMessage(result.message);
      setImportOpen(false);
      setImportApplications([]);
      setSelectedImportIndexes([]);

      try {
        const updatedApplications = await getApplications();
        setApplications(updatedApplications);
      } catch {
        setError(
          "Der Import war erfolgreich, aber die Tabelle konnte nicht neu geladen werden.",
        );
      }
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Die Bewerbungen konnten nicht gespeichert werden.",
      );
    } finally {
      setImportSaving(false);
    }
  };

  // Status ändern und in der Datenbank speichern
  const handleStatusChange = async (
    application: JobApplication,
    newStatus: string,
  ) => {
    if (newStatus === application.status) return;

    try {
      await updateApplicationStatus(application.id, newStatus);

      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? { ...item, status: newStatus }
            : item,
        ),
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? `Status konnte nicht gespeichert werden: ${error.message}`
          : "Status konnte nicht gespeichert werden.",
      );
    }
  };

  // Dokumente einer Bewerbung laden
  const loadDocuments = useCallback(async (applicationId: number) => {
    setDocumentsLoading(true);
    setDocumentError(null);

    try {
      const result = await getDocuments(applicationId);
      setDocuments(result);
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "Dokumente konnten nicht geladen werden.",
      );
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  // Dokumentenverwaltung öffnen
  const handleOpenDocuments = async (application: JobApplication) => {
    setDocumentsForApplication(application);
    setDocuments([]);
    setDocumentType("Stelleninserat");
    setDocumentError(null);
    setDocumentsOpen(true);

    await loadDocuments(application.id);
  };

  // Dokument hochladen
  const handleUploadDocument = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    const application = documentsForApplication;

    // Erlaubt, dieselbe Datei später nochmals auszuwählen.
    event.target.value = "";

    if (!file || !application) return;

    setUploading(true);
    setDocumentError(null);

    try {
      await uploadDocument(application.id, file, documentType);
      await loadDocuments(application.id);
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "Der Upload ist fehlgeschlagen.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (
    documentId: number,
    fileName: string
  ) => {
    if (!documentsForApplication) return;

    const confirmed = window.confirm(
      `Möchtest du das Dokument "${fileName}" wirklich löschen?`
    );

    if (!confirmed) return;

    setDocumentError(null);

    try {
      await deleteDocument(documentsForApplication.id, documentId);

      setDocuments((current) =>
        current.filter((document) => document.id !== documentId)
      );
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "Dokument konnte nicht gelöscht werden."
      );
    }
  };

  // Tabellen-Spalten
  const columns = createApplicationColumns({
    statusLabels,
    onEdit: handleEdit,
    onStatusChange: handleStatusChange,
    onOpenDocuments: (application) => {
      void handleOpenDocuments(application);
    },
    onOpenActivities: (application) => {
      void handleOpenActivities(application);
    },
  });

  return (

    
    <Box
      sx={{
        minHeight: "100vh",
        // Ab "md" füllt die App genau das Fenster; die Tabelle nimmt den
        // Restplatz ein. Auf kleinen Bildschirmen scrollt die Seite normal.
        height: { md: "100vh" },
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        bgcolor: "#f5f6f8",
        py: { xs: 2, md: 3 },
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          maxWidth: 1800,
        }}
      >
        {/* Kopfbereich */}
        <AppHeader
          importFileInputRef={importFileInputRef}
          onImportFileChange={handleImportFileChange}
          onNewApplication={handleNew}
          activePage={activePage}
          onNavigate={setActivePage}
        />

        {/* Kennzahl */}
        {activePage === "applications" ? (
          <>
            {/* Kennzahl */}
            <Paper
              elevation={0}
              sx={{
                px: 3,
                py: 1.5,
                mb: 2,
                display: "flex",
                alignItems: "baseline",
                gap: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Typography
                variant="h4"
                component="p"
                sx={{ fontWeight: 700 }}
              >
                {applications.length}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Bewerbungen insgesamt
              </Typography>
            </Paper>

            {/* Bewerbungstabelle */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1, sm: 2 },
                flex: 1,
                minHeight: 420,
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Typography
                variant="h6"
                component="h2"
                sx={{ p: 1, mb: 1 }}
              >
                Bewerbungen
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <ApplicationsTable
                loading={loading}
                rows={applications}
                columns={columns}
              />
            </Paper>
          </>
        ) : (
          <TasksPage
            onBackToApplications={() => setActivePage("applications")}
            />
            
        )}

        {/* Dialog: Bewerbung erfassen / bearbeiten */}
        <ApplicationFormDialog
          open={dialogOpen}
          editingId={editingId}
          saving={saving}
          formError={formError}
          company={company}
          position={position}
          location={location}
          address={address}
          contactPerson={contactPerson}
          email={email}
          phone={phone}
          jobUrl={jobUrl}
          applicationDate={applicationDate}
          notes={notes}
          onClose={handleClose}
          onSave={() => void handleSave()}
          onCompanyChange={setCompany}
          onPositionChange={setPosition}
          onLocationChange={setLocation}
          onAddressChange={setAddress}
          onContactPersonChange={setContactPerson}
          onEmailChange={setEmail}
          onPhoneChange={setPhone}
          onJobUrlChange={setJobUrl}
          onApplicationDateChange={setApplicationDate}
          onNotesChange={setNotes}
        />

        {/* Dialog: RAV-PDF-Import */}
        <ApplicationImportDialog
          open={importOpen}
          loading={importLoading}
          saving={importSaving}
          error={importError}
          message={importMessage}
          applications={importApplications}
          selectedIndexes={selectedImportIndexes}
          validated={importValidated}
          statusLabels={statusLabels}
          onClose={() => {
            setImportOpen(false);
            setImportError(null);
          }}
          onCancel={() => {
            setImportOpen(false);
            setImportError(null);
          }}
          onSave={() => void handleSaveImportedApplications()}
          onSelectionChange={setSelectedImportIndexes}
          onUpdateField={updateImportField}
          isEntryInvalid={isImportEntryInvalid}
        />

        {/* Dialog: Dokumente */}
        <ApplicationDocumentsDialog
          open={documentsOpen}
          application={documentsForApplication}
          documents={documents}
          loading={documentsLoading}
          error={documentError}
          uploading={uploading}
          documentType={documentType}
          documentTypes={documentTypes}
          fileInputRef={fileInputRef}
          onClose={() => setDocumentsOpen(false)}
          onDocumentTypeChange={setDocumentType}
          onUpload={handleUploadDocument}
          onDelete={(documentId, fileName) =>
            void handleDeleteDocument(documentId, fileName)
          }
          getDownloadUrl={getDocumentDownloadUrl}
        />

        {/* Aktivitätenverwaltung */}
        <ApplicationActivitiesDialog
          open={activitiesOpen}
          application={activitiesForApplication}
          activities={activities}
          loading={activitiesLoading}
          error={activityError}
          saving={activitySaving}
          onClose={() => setActivitiesOpen(false)}
          onCreateActivity={() => void handleCreateActivity()}
          onCompleteActivity={(activity) =>
            void handleCompleteActivity(activity)
          }
          activityType={activityType}
          onActivityTypeChange={setActivityType}
          activityTitle={activityTitle}
          onActivityTitleChange={setActivityTitle}
          activityDescription={activityDescription}
          onActivityDescriptionChange={setActivityDescription}
          activityDate={activityDate}
          onActivityDateChange={setActivityDate}
          activityDueDate={activityDueDate}
          onActivityDueDateChange={setActivityDueDate}
        />

      </Container>
    </Box>
  );
}

export default App;