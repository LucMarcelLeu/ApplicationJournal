using ApplicationJournal.Api.Services;
using Microsoft.AspNetCore.Mvc;
using ApplicationJournal.Api.Data;
using ApplicationJournal.Api.Models;

using Microsoft.EntityFrameworkCore;

namespace ApplicationJournal.Api.Controllers;

[ApiController]
[Route("api/applications/import")]
public class ApplicationImportController : ControllerBase
{
    private readonly ApplicationPdfImportService _importService;
    private readonly ApplicationDbContext _dbContext;

    public ApplicationImportController(
        ApplicationPdfImportService importService,
        ApplicationDbContext dbContext)
    {
        _importService = importService;
        _dbContext = dbContext;
    }

    [HttpPost("text-preview")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public async Task<IActionResult> PreviewText(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("Die Datei ist leer.");
        }

        if (!Path.GetExtension(file.FileName)
                .Equals(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Bitte eine PDF-Datei hochladen.");
        }

        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest("Die PDF-Datei darf maximal 10 MB gross sein.");
        }

        try
        {
            await using var stream = file.OpenReadStream();

            var text = _importService.ExtractText(stream);
            var applications = _importService.ExtractApplications(text);

            return Ok(new
            {
                FileName = file.FileName,
                Text = text,
                ApplicationCount = applications.Count,
                Applications = applications
            });
        }
        catch (Exception ex) when (
            ex is not OperationCanceledException)
        {
            return BadRequest(
                "Die PDF-Datei konnte nicht gelesen werden.");
        }
    }

    [HttpPost("layout-preview")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public IActionResult PreviewLayout(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("Die Datei ist leer.");
        }

        if (!Path.GetExtension(file.FileName)
                .Equals(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Bitte eine PDF-Datei hochladen.");
        }

        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest("Die PDF-Datei darf maximal 10 MB gross sein.");
        }

        try
        {
            using var stream = file.OpenReadStream();
            var layout = _importService.InspectPdfLayout(stream);

            return Ok(layout);
        }
        catch (Exception ex) when (
            ex is not OperationCanceledException)
        {
            return BadRequest("Das PDF-Layout konnte nicht gelesen werden.");
        }
    }

    [HttpPost("structured-preview")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public IActionResult PreviewStructured(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("Die Datei ist leer.");
        }

        if (!Path.GetExtension(file.FileName)
                .Equals(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Bitte eine PDF-Datei hochladen.");
        }

        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest("Die PDF-Datei darf maximal 10 MB gross sein.");
        }

        try
        {
            using var stream = file.OpenReadStream();

            var applications =
                _importService.ExtractStructuredApplications(stream);

            return Ok(new
            {
                FileName = file.FileName,
                ApplicationCount = applications.Count,
                Applications = applications
            });
        }
        catch (Exception ex) when (
            ex is not OperationCanceledException)
        {
            return BadRequest(
                "Die strukturierte PDF-Vorschau konnte nicht erstellt werden.");
        }
    }

    [HttpPost("save")]
    public async Task<IActionResult> Save(
        [FromBody] List<JobApplicationImportPreview> applications,
        CancellationToken cancellationToken)
    {
        if (applications is null || applications.Count == 0)
        {
            return BadRequest("Keine Bewerbungen zum Speichern vorhanden.");
        }

        var jobApplications = applications.Select(application =>
            new JobApplication
            {
                Company = application.Company?.Trim() ?? string.Empty,
                Position = application.Position?.Trim() ?? string.Empty,
                Location = application.Location,
                Address = application.Address,
                ContactPerson = application.ContactPerson,
                Email = application.Email,
                Phone = application.Phone,
                JobUrl = application.JobUrl,
                ApplicationDate = application.ApplicationDate,
                Status = application.SuggestedStatus,
                Notes = application.Notes
            })
            .ToList();

        if (jobApplications.Any(application =>
                string.IsNullOrWhiteSpace(application.Company) ||
                string.IsNullOrWhiteSpace(application.Position)))
        {
            return BadRequest(
                "Firma und Position müssen für alle Bewerbungen ausgefüllt sein.");
        }

        static string Normalize(string value) =>
            string.Join(
                " ",
                value.Split(
                    (char[]?)null,
                    StringSplitOptions.RemoveEmptyEntries))
            .ToUpperInvariant();

        // Bewerbungen aus demselben Import prüfen.
        var duplicateGroups = jobApplications
            .GroupBy(application =>
                (Company: Normalize(application.Company),
                 application.ApplicationDate))
            .Where(group => group.Count() > 1)
            .ToList();

        foreach (var group in duplicateGroups)
        {
            var positions = group
                .Select(application => Normalize(application.Position))
                .Distinct()
                .ToList();

            if (positions.Count > 1)
            {
                return Conflict(new
                {
                    Message = "Mehrere unterschiedliche Positionen bei " +
                              "derselben Firma am selben Datum gefunden.",
                    Company = group.First().Company,
                    ApplicationDate = group.Key.ApplicationDate,
                    Positions = group
                        .Select(application => application.Position)
                        .Distinct()
                        .ToList()
                });
            }
        }

        // Identische Einträge innerhalb des Imports zusammenfassen.
        var uniqueApplications = jobApplications
            .DistinctBy(application =>
                (Company: Normalize(application.Company),
                 Position: Normalize(application.Position),
                 application.ApplicationDate))
            .ToList();

        // Bereits vorhandene Bewerbungen anhand des Datums laden.
        var dates = uniqueApplications
            .Select(application => application.ApplicationDate)
            .Distinct()
            .ToList();

        var existingApplications = await _dbContext.JobApplications
            .Where(application =>
                dates.Contains(application.ApplicationDate))
            .ToListAsync(cancellationToken);

        // Firma und Datum vergleichen; unterschiedliche Positionen
        // werden als Konflikt gemeldet.
        foreach (var application in uniqueApplications)
        {
            var existing = existingApplications
                .Where(item =>
                    Normalize(item.Company) == Normalize(application.Company) &&
                    item.ApplicationDate == application.ApplicationDate)
                .ToList();

            if (existing.Any(item =>
                    Normalize(item.Position) != Normalize(application.Position)))
            {
                return Conflict(new
                {
                    Message = "Für diese Firma existiert bereits eine " +
                              "Bewerbung am selben Datum mit einer anderen Position.",
                    Company = application.Company,
                    ApplicationDate = application.ApplicationDate,
                    NewPosition = application.Position,
                    ExistingPositions = existing
                        .Select(item => item.Position)
                        .Distinct()
                        .ToList()
                });
            }
        }

        // Exakt gleiche Bewerbungen aus der Datenbank ausschliessen.
        var newApplications = uniqueApplications
            .Where(application =>
                !existingApplications.Any(existing =>
                    Normalize(existing.Company) == Normalize(application.Company) &&
                    Normalize(existing.Position) == Normalize(application.Position) &&
                    existing.ApplicationDate == application.ApplicationDate))
            .ToList();

        if (newApplications.Count == 0)
        {
            return Ok(new
            {
                SavedCount = 0,
                DuplicateCount = jobApplications.Count,
                Message = "Alle Bewerbungen existieren bereits."
            });
        }

        _dbContext.JobApplications.AddRange(newApplications);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            SavedCount = newApplications.Count,
            DuplicateCount = jobApplications.Count - newApplications.Count,
            Message = $"{newApplications.Count} Bewerbungen wurden gespeichert. " +
                      $"{jobApplications.Count - newApplications.Count} " +
                      "Duplikate wurden übersprungen."
        });
    }

}