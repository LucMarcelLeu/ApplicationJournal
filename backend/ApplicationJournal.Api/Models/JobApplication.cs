namespace ApplicationJournal.Api.Models;

public class JobApplication
{
    public int Id { get; set; }

    public required string Company { get; set; }

    public required string Position { get; set; }

    public string? Location { get; set; }

    public string? Address { get; set; }

    public string? ContactPerson { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? JobUrl { get; set; }

    public DateOnly ApplicationDate { get; set; }

    public string Status { get; set; } = "Applied";

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}