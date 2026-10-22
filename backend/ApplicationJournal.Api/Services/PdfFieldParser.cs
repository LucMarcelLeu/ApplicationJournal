using System.Text.RegularExpressions;
using UglyToad.PdfPig.Content;

namespace ApplicationJournal.Api.Services;

// Typisiertes Wort mit Position. Ersetzt die dynamic-Objekte in
// ExtractStructuredApplications (Tippfehler fallen so beim Kompilieren auf).
public sealed record PdfWordInfo(
    string Text,
    double X,
    double Y,
    double Right,
    double Top);

public sealed record CompanyColumnInfo(
    string Company,
    string? Address,
    string? Location,
    string? ContactPerson,
    string? Email,
    string? Phone);

public static class PdfFieldParser
{
    // Spalte "Firma / Adresse / Kontaktperson / E-Mail / Telefon".
    private const double CompanyColumnStart = 100;
    private const double CompanyColumnEnd = 280;

    private static readonly Regex EmailRegex = new(
        @"[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // +41 44 878 82 76, 0041 44 ..., 044 878 82 76
    private static readonly Regex PhoneRegex = new(
        @"(?<!\d)(?:\+41|0041|0)\s?\d{2}(?:\s?\d{2,3}){2,3}(?!\d)",
        RegexOptions.Compiled);

    // "Werdstrasse 21, CH-8004 Zürich" oder nur "CH-8001 Zürich"
    private static readonly Regex AddressRegex = new(
        @"^(?<street>.*?),?\s*CH-(?<zip>\d{4})\s+(?<city>.+)$",
        RegexOptions.Compiled);

    private static readonly Regex FooterRegex = new(
        @"^(Pensum\b|Hinweis|Seite\s+\d+\s+von)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    /// <summary>
    /// Liest die Firmenspalte eines Bewerbungsblocks zeilenweise.
    /// Reihenfolge im Formular: Firma, Adresse, Kontaktperson, E-Mail, Telefon.
    /// Einzelne Felder können fehlen, deshalb werden E-Mail und Telefon per
    /// Regex erkannt, nicht über die Zeilenposition.
    /// </summary>
    public static CompanyColumnInfo ParseCompanyColumn(
        IEnumerable<List<PdfWordInfo>> blockLines)
    {
        var companyParts = new List<string>();
        string? address = null;
        string? location = null;
        string? contactPerson = null;
        string? email = null;
        string? phone = null;

        foreach (var line in blockLines)
        {
            var text = string.Join(" ", line
                .Where(w => w.X >= CompanyColumnStart && w.X < CompanyColumnEnd)
                .OrderBy(w => w.X)
                .Select(w => w.Text));

            if (string.IsNullOrWhiteSpace(text))
            {
                continue;
            }

            if (FooterRegex.IsMatch(text.Trim()))
            {
                break;
            }

            var emailMatch = EmailRegex.Match(text);
            if (emailMatch.Success)
            {
                email ??= emailMatch.Value;
                text = text.Replace(emailMatch.Value, " ");
            }

            var phoneMatch = PhoneRegex.Match(text);
            if (phoneMatch.Success)
            {
                phone ??= Regex.Replace(phoneMatch.Value, @"\s+", " ");
                text = text.Replace(phoneMatch.Value, " ");
            }

            text = Regex.Replace(text, @"\s+", " ").Trim();

            if (text.Length == 0)
            {
                continue;
            }

            if (address is null)
            {
                var addressMatch = AddressRegex.Match(text);

                if (addressMatch.Success)
                {
                    address = text;
                    location = addressMatch.Groups["city"].Value.Trim();
                }
                else
                {
                    // Alles vor der Adresse gehört zum Firmennamen
                    // (Firmennamen können umbrechen).
                    companyParts.Add(text);
                }
            }
            else
            {
                // Erste Restzeile nach der Adresse = Kontaktperson.
                contactPerson ??= text;
            }
        }

        var company = address is null
            ? companyParts.FirstOrDefault() ?? string.Empty
            : string.Join(" ", companyParts);

        return new CompanyColumnInfo(
            company, address, location, contactPerson, email, phone);
    }

    /// <summary>
    /// Der Link steht im PDF gekürzt ("https://ohws.prospective.ch/pu...").
    /// Die vollständige URL steckt meist in der Link-Annotation der Seite.
    /// Wir suchen die Annotation, die über dem sichtbaren Linktext liegt.
    /// Gibt es keine, wird der gekürzte Text zurückgegeben und markiert.
    /// </summary>
    public static (string? Url, bool IsTruncated) ResolveUrl(
        IEnumerable<List<PdfWordInfo>> blockLines,
        IReadOnlyList<Hyperlink> pageHyperlinks)
    {
        var word = blockLines
            .SelectMany(line => line)
            .FirstOrDefault(w => w.Text.StartsWith(
                "http", StringComparison.OrdinalIgnoreCase));

        if (word is null)
        {
            return (null, false);
        }

        var centerX = (word.X + word.Right) / 2;
        var centerY = (word.Y + word.Top) / 2;

        // Eigener Vergleich statt PdfRectangle.Contains, dessen Signatur
        // sich zwischen PdfPig-Versionen unterscheidet.
        var link = pageHyperlinks.FirstOrDefault(h =>
            !string.IsNullOrWhiteSpace(h.Uri) &&
            centerX >= h.Bounds.Left && centerX <= h.Bounds.Right &&
            centerY >= h.Bounds.Bottom && centerY <= h.Bounds.Top);

        if (link?.Uri is not null)
        {
            return (link.Uri, false);
        }

        var truncated = word.Text.EndsWith("...", StringComparison.Ordinal) ||
                        word.Text.EndsWith("…", StringComparison.Ordinal);

        return (word.Text, truncated);
    }
}