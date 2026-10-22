using ApplicationJournal.Api.Data;
using ApplicationJournal.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApplicationJournal.Api.Controllers;

[ApiController]
[Route("api/applications/{applicationId:int}/documents")]
public class ApplicationDocumentsController(
    ApplicationDbContext dbContext,
    IWebHostEnvironment environment,
    IConfiguration configuration) : ControllerBase
{
    private const long MaxFileSize = 10 * 1024 * 1024;

    private static readonly Dictionary<string, string> AllowedExtensions = new()
    {
        [".pdf"] = "application/pdf",
        [".doc"] = "application/msword",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".txt"] = "text/plain",
        [".png"] = "image/png",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg"
    };

    private static readonly string[] AllowedDocumentTypes =
    [
        "Stelleninserat",
        "Motivationsschreiben",
        "Lebenslauf",
        "Korrespondenz",
        "Sonstiges"
    ];

    private string StoragePath =>
        configuration["DocumentStorage:Path"]
        ?? Path.GetFullPath(
            Path.Combine(
                environment.ContentRootPath,
                "..", "..", "storage", "documents"));

    [HttpGet]
    public async Task<IActionResult> GetAll(
        int applicationId,
        CancellationToken cancellationToken)
    {
        var applicationExists = await dbContext.JobApplications
            .AnyAsync(a => a.Id == applicationId, cancellationToken);

        if (!applicationExists)
        {
            return NotFound();
        }

        var documents = await dbContext.ApplicationDocuments
            .AsNoTracking()
            .Where(d => d.JobApplicationId == applicationId)
            .OrderByDescending(d => d.UploadedAt)
            .Select(d => new
            {
                d.Id,
                d.OriginalFileName,
                d.ContentType,
                d.FileSize,
                d.DocumentType,
                d.UploadedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(documents);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        int applicationId,
        IFormFile? file,
        [FromForm] string? documentType,
        CancellationToken cancellationToken)
    {
        var applicationExists = await dbContext.JobApplications
            .AnyAsync(a => a.Id == applicationId, cancellationToken);

        if (!applicationExists)
        {
            return NotFound(new { message = "Bewerbung nicht gefunden." });
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "Bitte wähle eine Datei aus." });
        }

        if (file.Length > MaxFileSize)
        {
            return BadRequest(new
            {
                message = "Die Datei darf maximal 10 MB gross sein."
            });
        }

        if (string.IsNullOrWhiteSpace(documentType)
            || !AllowedDocumentTypes.Contains(documentType))
        {
            return BadRequest(new
            {
                message = "Ungültiger Dokumenttyp."
            });
        }

        var originalFileName = Path.GetFileName(file.FileName);
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();

        if (!AllowedExtensions.TryGetValue(extension, out var contentType))
        {
            return BadRequest(new
            {
                message = "Erlaubt sind PDF, Word, TXT, PNG und JPG-Dateien."
            });
        }

        var storedFileName = $"{Guid.NewGuid():N}{extension}";
        Directory.CreateDirectory(StoragePath);

        var filePath = Path.Combine(StoragePath, storedFileName);

        try
        {
            await using (var stream = new FileStream(
                filePath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                81920,
                useAsync: true))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            var document = new ApplicationDocument
            {
                JobApplicationId = applicationId,
                OriginalFileName = originalFileName,
                StoredFileName = storedFileName,
                ContentType = contentType,
                FileSize = file.Length,
                DocumentType = documentType,
                UploadedAt = DateTime.UtcNow
            };

            dbContext.ApplicationDocuments.Add(document);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                document.Id,
                document.OriginalFileName,
                document.ContentType,
                document.FileSize,
                document.DocumentType,
                document.UploadedAt
            });
        }
        catch
        {
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            throw;
        }
    }

    [HttpGet("{documentId:int}/download")]
    public async Task<IActionResult> Download(
        int applicationId,
        int documentId,
        CancellationToken cancellationToken)
    {
        var document = await dbContext.ApplicationDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(
                d => d.Id == documentId
                     && d.JobApplicationId == applicationId,
                cancellationToken);

        if (document is null)
        {
            return NotFound();
        }

        var filePath = Path.Combine(StoragePath, document.StoredFileName);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new
            {
                message = "Die gespeicherte Datei wurde nicht gefunden."
            });
        }

        return PhysicalFile(
            filePath,
            document.ContentType,
            document.OriginalFileName);
    }

    [HttpDelete("{documentId:int}")]
    public async Task<IActionResult> DeleteDocument(
        int applicationId,
        int documentId,
        CancellationToken cancellationToken)
    {
        var document = await dbContext.ApplicationDocuments
            .FirstOrDefaultAsync(
                d => d.Id == documentId &&
                     d.JobApplicationId == applicationId,
                cancellationToken);

        if (document is null)
        {
            return NotFound();
        }

        var filePath = Path.Combine(StoragePath, document.StoredFileName);

        // Zuerst die Datei löschen, sofern sie vorhanden ist.
        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }

        // Danach den Datenbankeintrag entfernen.
        dbContext.ApplicationDocuments.Remove(document);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

}