
namespace ApplicationJournal.Api.DTOs;

public class ApplicationImportPreviewDto
{
    public string Company { get; set; } = string.Empty;

    public string Position { get; set; } = string.Empty;

    public string? Location { get; set; }

    public DateOnly ApplicationDate { get; set; }

    public string Status { get; set; } = "Applied";

    public string? Notes { get; set; }

    public bool IsDuplicate { get; set; }

    public string? DuplicateReason { get; set; }

    public bool IsSelected { get; set; } = true;
}
