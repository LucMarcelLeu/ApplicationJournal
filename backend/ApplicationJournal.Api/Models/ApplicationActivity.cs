namespace ApplicationJournal.Api.Models;

public class ApplicationActivity
{
    public int Id { get; set; }

    public int JobApplicationId { get; set; }

    public JobApplication JobApplication { get; set; } = null!;

    // EmailReceived, PhoneCall, Interview,
    // PlannedAction, Other
    public required string Type { get; set; }

    public required string Title { get; set; }

    public string? Description { get; set; }

    // Datum des Ereignisses
    public DateTime ActivityDate { get; set; } = DateTime.UtcNow;

    // Nur für geplante Aktionen relevant
    public DateTime? DueDate { get; set; }

    // Open oder Completed
    public string Status { get; set; } = "Completed";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}