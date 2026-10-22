namespace ApplicationJournal.Api.Models;

public class ApplicationDocument
{
    public int Id { get; set; }

    public int JobApplicationId { get; set; }

    public required string OriginalFileName { get; set; }

    public required string StoredFileName { get; set; }

    public required string ContentType { get; set; }

    public long FileSize { get; set; }

    public required string DocumentType { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
