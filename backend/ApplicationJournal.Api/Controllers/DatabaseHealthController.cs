using ApplicationJournal.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApplicationJournal.Api.Controllers;

[ApiController]
[Route("api/health/database")]
public class DatabaseHealthController(
    ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Check(
        CancellationToken cancellationToken)
    {
        var canConnect = await dbContext.Database.CanConnectAsync(
            cancellationToken);

        if (!canConnect)
        {
            return StatusCode(503, new
            {
                status = "error",
                database = "unavailable"
            });
        }

        return Ok(new
        {
            status = "ok",
            database = "connected"
        });
    }
}