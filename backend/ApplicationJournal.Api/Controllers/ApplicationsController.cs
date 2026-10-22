using ApplicationJournal.Api.Data;
using ApplicationJournal.Api.DTOs;
using ApplicationJournal.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApplicationJournal.Api.Controllers;

[ApiController]
[Route("api/applications")]
public class ApplicationsController(
    ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<JobApplication>>> GetAll(
        CancellationToken cancellationToken)
    {
        var applications = await dbContext.JobApplications
            .AsNoTracking()
            .OrderByDescending(a => a.ApplicationDate)
            .ToListAsync(cancellationToken);

        return Ok(applications);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<JobApplication>> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var application = await dbContext.JobApplications
            .AsNoTracking()
            .FirstOrDefaultAsync(
                a => a.Id == id, cancellationToken);

        if (application is null)
            return NotFound();

        return Ok(application);
    }

    [HttpPost]
    public async Task<ActionResult<JobApplication>> Create(
        CreateJobApplicationRequest request,
        CancellationToken cancellationToken)
    {
        var application = new JobApplication
        {
            Company = request.Company,
            Position = request.Position,
            Location = request.Location,
            Address = request.Address,
            ContactPerson = request.ContactPerson,
            Email = request.Email,
            Phone = request.Phone,
            JobUrl = request.JobUrl,
            ApplicationDate = request.ApplicationDate,
            Notes = request.Notes
        };

        dbContext.JobApplications.Add(application);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = application.Id },
            application);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateJobApplicationRequest request,
        CancellationToken cancellationToken)
    {
        var application = await dbContext.JobApplications
            .FirstOrDefaultAsync(
                a => a.Id == id, cancellationToken);

        if (application is null)
            return NotFound();

        application.Company = request.Company;
        application.Position = request.Position;
        application.Location = request.Location;
        application.Address = request.Address;
        application.ContactPerson = request.ContactPerson;
        application.Email = request.Email;
        application.Phone = request.Phone;
        application.JobUrl = request.JobUrl;
        application.ApplicationDate = request.ApplicationDate;
        application.Status = request.Status;
        application.Notes = request.Notes;

        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        var application = await dbContext.JobApplications
            .FirstOrDefaultAsync(
                a => a.Id == id, cancellationToken);

        if (application is null)
            return NotFound();

        dbContext.JobApplications.Remove(application);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static readonly string[] AllowedStatuses =
    [
        "Draft",
        "Planned",
        "Applied",
        "ResponseReceived",
        "Interview",
        "Offer",
        "Rejected",
        "Withdrawn"
    ];

    public record UpdateStatusRequest(string Status);

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateStatusRequest request,
        CancellationToken cancellationToken)
    {
        if (!AllowedStatuses.Contains(request.Status))
        {
            return BadRequest(new { message = "Ungültiger Bewerbungsstatus." });
        }

        var application = await dbContext.JobApplications
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (application is null)
        {
            return NotFound();
        }

        application.Status = request.Status;

        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

}