namespace ApplicationJournal.Api.DTOs;

public class CreateApplicationActivityRequest
{
    public required string Type { get; set; }

    public required string Title { get; set; }

    public string? Description { get; set; }

    public DateTime? ActivityDate { get; set; }

    public DateTime? DueDate { get; set; }
}