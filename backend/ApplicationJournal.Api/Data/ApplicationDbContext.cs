using ApplicationJournal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ApplicationJournal.Api.Data;

public class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options)
    : DbContext(options)
{
    public DbSet<JobApplication> JobApplications =>
        Set<JobApplication>();

    public DbSet<ApplicationDocument> ApplicationDocuments =>
        Set<ApplicationDocument>();


    public DbSet<ApplicationActivity> ApplicationActivities =>
        Set<ApplicationActivity>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationDocument>()
            .HasOne<JobApplication>()
            .WithMany()
            .HasForeignKey(d => d.JobApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ApplicationDocument>()
            .HasIndex(d => d.JobApplicationId);

        modelBuilder.Entity<ApplicationActivity>()
            .HasOne(a => a.JobApplication)
            .WithMany()
            .HasForeignKey(a => a.JobApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ApplicationActivity>()
            .HasIndex(a => a.JobApplicationId);

        modelBuilder.Entity<ApplicationActivity>()
            .HasIndex(a => new { a.Status, a.DueDate });
    }
}