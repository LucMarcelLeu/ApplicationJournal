using ApplicationJournal.Api.Data;
using ApplicationJournal.Api.DTOs;
using ApplicationJournal.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApplicationJournal.Api.Controllers;

[ApiController]
[Route("api/applications/{jobApplicationId:int}/activities")]
public class ApplicationActivitiesController(
    ApplicationDbContext dbContext) : ControllerBase
{
    // Aktivitäten einer Bewerbung abrufen
    [HttpGet]
    public async Task<ActionResult<List<ApplicationActivity>>> GetAll(
        int jobApplicationId,
        CancellationToken cancellationToken)
    {
        var applicationExists = await dbContext.JobApplications
            .AnyAsync(
                application => application.Id == jobApplicationId,
                cancellationToken);

        if (!applicationExists)
        {
            return NotFound("Bewerbung nicht gefunden.");
        }

        var activities = await dbContext.ApplicationActivities
            .Where(activity =>
                activity.JobApplicationId == jobApplicationId)
            .OrderByDescending(activity => activity.ActivityDate)
            .ToListAsync(cancellationToken);

        return Ok(activities);
    }

    // Neue Aktivität erstellen
    [HttpPost]
    public async Task<ActionResult<ApplicationActivity>> Create(
        int jobApplicationId,
        [FromBody] CreateApplicationActivityRequest request,
        CancellationToken cancellationToken)
    {
        var applicationExists = await dbContext.JobApplications
            .AnyAsync(
                application => application.Id == jobApplicationId,
                cancellationToken);

        if (!applicationExists)
        {
            return NotFound("Bewerbung nicht gefunden.");
        }

        if (string.IsNullOrWhiteSpace(request.Type) ||
            string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(
                "Aktivitätstyp und Titel müssen ausgefüllt sein.");
        }

        var type = request.Type.Trim();

        if (type == "PlannedAction" && request.DueDate is null)
        {
            return BadRequest(
                "Geplante Aktionen benötigen ein Fälligkeitsdatum.");
        }

        var activity = new ApplicationActivity
        {
            JobApplicationId = jobApplicationId,
            Type = type,
            Title = request.Title.Trim(),
            Description = request.Description,
            ActivityDate = request.ActivityDate ?? DateTime.UtcNow,
            DueDate = request.DueDate,
            Status = type == "PlannedAction" ? "Open" : "Completed",
            CreatedAt = DateTime.UtcNow
        };

        dbContext.ApplicationActivities.Add(activity);

        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetAll),
            new { jobApplicationId },
            activity);
    }

    // Geplante Aktion als erledigt markieren
    [HttpPatch("{id:int}/complete")]
    public async Task<IActionResult> Complete(
        int jobApplicationId,
        int id,
        CancellationToken cancellationToken)
    {
        var activity = await dbContext.ApplicationActivities
            .FirstOrDefaultAsync(
                activity =>
                    activity.Id == id &&
                    activity.JobApplicationId == jobApplicationId,
                cancellationToken);

        if (activity is null)
        {
            return NotFound("Aktivität nicht gefunden.");
        }

        if (activity.Type != "PlannedAction")
        {
            return BadRequest(
                "Nur geplante Aktionen können abgeschlossen werden.");
        }

        activity.Status = "Completed";

        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }


    [HttpGet("/api/activities/open")]
    public async Task<IActionResult> GetOpenActivities(
        CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;

        var activities = await dbContext.ApplicationActivities
            .Where(activity =>
                activity.Type == "PlannedAction" &&
                activity.Status == "Open")
            .OrderBy(activity => activity.DueDate)
            .Select(activity => new
            {
                activity.Id,
                activity.JobApplicationId,
                Company = activity.JobApplication.Company,
                Position = activity.JobApplication.Position,
                activity.Title,
                activity.Description,
                activity.ActivityDate,
                activity.DueDate,
                activity.Status,
                IsOverdue = activity.DueDate.HasValue &&
                            activity.DueDate.Value.Date < today
            })
            .ToListAsync(cancellationToken);

        return Ok(activities);
    }
}