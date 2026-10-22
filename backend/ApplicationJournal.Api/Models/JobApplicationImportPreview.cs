namespace ApplicationJournal.Api.Models;

public class JobApplicationImportPreview
{
    public DateOnly ApplicationDate { get; set; }

    public string? Company { get; set; }

    public string? Position { get; set; }

    public string? Location { get; set; }

    public string? Address { get; set; }

    public string? ContactPerson { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? JobUrl { get; set; }

    public string SuggestedStatus { get; set; } = "Applied";

    public string? Notes { get; set; }

    public string RawText { get; set; } = string.Empty;

    public List<string> Warnings { get; set; } = [];
}
