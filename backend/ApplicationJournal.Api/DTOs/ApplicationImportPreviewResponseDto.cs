
namespace ApplicationJournal.Api.DTOs;

public class ApplicationImportPreviewResponseDto
{
    public string? ReportingMonth { get; set; }

    public int TotalEntries { get; set; }

    public int DuplicateCount { get; set; }

    public List<ApplicationImportPreviewDto> Applications { get; set; } = [];
}
