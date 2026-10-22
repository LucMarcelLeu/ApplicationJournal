namespace ApplicationJournal.Api.DTOs;

public record CreateJobApplicationRequest(
    string Company,
    string Position,
    string? Location,
    DateOnly ApplicationDate,
    string? Notes,
    string? Address = null,
    string? ContactPerson = null,
    string? Email = null,
    string? Phone = null,
    string? JobUrl = null);