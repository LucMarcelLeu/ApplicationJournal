namespace ApplicationJournal.Api.DTOs;

public record UpdateJobApplicationRequest(
    string Company,
    string Position,
    string? Location,
    DateOnly ApplicationDate,
    string Status,
    string? Notes,
    string? Address = null,
    string? ContactPerson = null,
    string? Email = null,
    string? Phone = null,
    string? JobUrl = null);