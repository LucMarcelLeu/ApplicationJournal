using System.Globalization;
using System.Text.RegularExpressions;
using UglyToad.PdfPig;
using ApplicationJournal.Api.Models;

namespace ApplicationJournal.Api.Services;

public class ApplicationPdfImportService
{
    private static readonly Regex ApplicationStartRegex = new(
        @"(?<date>\d{2}\.\d{2}\.\d{4})\s*gespeichert\s+am\s+\d{2}\.\d{2}\.\d{4}",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public string ExtractText(Stream pdfStream)
    {
        using var document = PdfDocument.Open(pdfStream);

        var pages = document.GetPages();

        return string.Join(
            Environment.NewLine + Environment.NewLine,
            pages.Select((page, index) =>
                $"--- Seite {index + 1} ---{Environment.NewLine}{page.Text}"));
    }

    public List<PdfApplicationEntry> ExtractApplications(string text)
    {
        var entries = new List<PdfApplicationEntry>();

        text = CleanTextForParsing(text);
        var matches = ApplicationStartRegex.Matches(text);

        for (var i = 0; i < matches.Count; i++)
        {
            var match = matches[i];

            var contentStart = match.Index + match.Length;

            var contentEnd = i + 1 < matches.Count
                ? matches[i + 1].Index
                : text.Length;

            var rawText = text[contentStart..contentEnd].Trim();

            var date = DateOnly.ParseExact(
                match.Groups["date"].Value,
                "dd.MM.yyyy",
                CultureInfo.InvariantCulture);

            entries.Add(new PdfApplicationEntry
            {
                ApplicationDate = date,
                RawText = rawText
            });
        }

        return entries;
    }

    public List<JobApplicationImportPreview> ExtractStructuredApplications(
        Stream pdfStream)
    {
        using var document = PdfDocument.Open(pdfStream);

        var results = new List<JobApplicationImportPreview>();

        var dateRegex = new Regex(
            @"^\d{2}\.\d{2}\.\d{4}$",
            RegexOptions.Compiled);

        foreach (var page in document.GetPages())
        {
            var hyperlinks = page.GetHyperlinks();

            var words = page.GetWords()
                .Select(word => new PdfWordInfo(
                    word.Text,
                    word.BoundingBox.Left,
                    word.BoundingBox.Bottom,
                    word.BoundingBox.Right,
                    word.BoundingBox.Top))
                .OrderByDescending(word => word.Y)
                .ThenBy(word => word.X)
                .ToList();

            // Wörter anhand ihrer Y-Koordinate zu Zeilen gruppieren.
            var lines = new List<List<PdfWordInfo>>();

            foreach (var word in words)
            {
                if (lines.Count == 0 ||
                    Math.Abs(lines[^1][0].Y - word.Y) > 2.0)
                {
                    lines.Add([]);
                }

                lines[^1].Add(word);
            }


            // Bewerbungszeilen erkennen.
            // Datum und Firmenname reichen als Startpunkt,
            // weil die Stellenbezeichnung auch in der Folgezeile stehen kann.
            // Echte Bewerbungszeilen erkennen.
            var starts = new List<(int LineIndex, string DateText)>();

            for (var i = 0; i < lines.Count; i++)
            {
                var line = lines[i];

                var date = line.FirstOrDefault(word =>
                    word.X < 60 &&
                    dateRegex.IsMatch((string)word.Text));

                if (date is null)
                {
                    continue;
                }

                var hasCompany = line.Any(word =>
                    word.X >= 100 && word.X < 280);

                var hasPosition = line.Any(word =>
                    word.X >= 280 && word.X < 440 &&
                    !((string)word.Text).StartsWith(
                        "http",
                        StringComparison.OrdinalIgnoreCase));

                if (hasCompany && hasPosition)
                {
                    starts.Add((i, (string)date.Text));
                }
            }

            for (var i = 0; i < starts.Count; i++)
            {
                var start = starts[i].LineIndex;
                var end = i + 1 < starts.Count
                    ? starts[i + 1].LineIndex
                    : lines.Count;

                var block = lines
                    .Skip(start)
                    .Take(end - start)
                    .Select(line => line
                        .OrderBy(word => word.X)
                        .ToList())
                    .ToList();

                var companyInfo = PdfFieldParser.ParseCompanyColumn(block);
                var (jobUrl, urlTruncated) =
                    PdfFieldParser.ResolveUrl(block, hyperlinks);

                var company = companyInfo.Company;
                var location = companyInfo.Location;

                var warnings = new List<string>
                {
                    "Bitte die importierten Felder und den Status kontrollieren."
                };

                if (urlTruncated)
                {
                    warnings.Add(
                        "Der Stellenlink ist im PDF gekürzt und unvollständig.");
                }

                // Position aus der Positionsspalte zusammensetzen.
                var positionParts = new List<string>();

                foreach (var line in block)
                {
                    // In der linken Spalte stehen innerhalb der Tabelle nur
                    // Datum, "gespeichert" und "am". Jedes andere Wort dort
                    // gehört zum Hinweistext am Seitenende und beendet den Block.
                    // (Eine feste Y-Grenze trifft sonst auch Einträge, die
                    // unten auf der Seite stehen, und leert deren Stelle.)
                    if (line.Any(word =>
                        word.X < 100 &&
                        !IsDateColumnToken(word.Text)))
                    {
                        break;
                    }

                    var columnWords = line
                        .Where(word => word.X >= 280 && word.X < 440)
                        .Select(word => (string)word.Text)
                        .ToList();

                    if (columnWords.Count == 0)
                    {
                        continue;
                    }

                    var value = string.Join(" ", columnWords);

                    if (Regex.IsMatch(
                        value,
                        @"zu vermeiden oder zu verkürzen|Insbesondere der Arbeitslosigkeit|Bewerbungsschreiben oder Absagebriefen",
                        RegexOptions.IgnoreCase))
                    {
                        break;
                    }

                    if (value.StartsWith(
                        "http",
                        StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    if (Regex.IsMatch(value, @"^\d{2}\.\d{2}\.\d{4}$") ||
                        Regex.IsMatch(value, @"^\d+\s*%$") ||
                        value.Equals("gespeichert", StringComparison.OrdinalIgnoreCase) ||
                        value.Equals("am", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    positionParts.Add(value);
                }

                var position = string.Join(" ", positionParts);

                // Formularhinweise und Absagetexte bleiben ausserhalb der
                // Positionsspalte; die Statuszuordnung erfolgt später.
                results.Add(new JobApplicationImportPreview
                {
                    ApplicationDate = DateOnly.ParseExact(
                        starts[i].DateText,
                        "dd.MM.yyyy",
                        CultureInfo.InvariantCulture),

                    Company = company,
                    Position = position,
                    Location = location,
                    Address = companyInfo.Address,
                    ContactPerson = companyInfo.ContactPerson,
                    Email = companyInfo.Email,
                    Phone = companyInfo.Phone,
                    JobUrl = jobUrl,
                    SuggestedStatus = "Applied",
                    RawText = string.Join(" ", block.SelectMany(line => line)
                        .Where(word => word.X >= 100 && word.X < 440)
                        .Select(word => word.Text)),
                    Warnings = warnings
                });
            }
        }

        return results;
    }

    public object InspectPdfLayout(Stream pdfStream)
    {
        using var document = PdfDocument.Open(pdfStream);

        return document.GetPages()
            .Select((page, index) => new
            {
                Page = index + 1,
                Width = page.Width,
                Height = page.Height,
                Words = page.GetWords()
                    .Select(word => new
                    {
                        word.Text,
                        X = Math.Round(word.BoundingBox.Left, 1),
                        Y = Math.Round(word.BoundingBox.Bottom, 1),
                        Right = Math.Round(word.BoundingBox.Right, 1),
                        Top = Math.Round(word.BoundingBox.Top, 1)
                    })
                    .ToList()
            })
            .ToList();
    }

    private static bool IsDateColumnToken(string text) =>
        Regex.IsMatch(text, @"^\d{2}\.\d{2}\.\d{4}$") ||
        text.Equals("gespeichert", StringComparison.OrdinalIgnoreCase) ||
        text.Equals("am", StringComparison.OrdinalIgnoreCase);

    private static string CleanTextForParsing(string text)
    {
        // Seitenmarkierungen entfernen.
        text = Regex.Replace(
            text,
            @"--- Seite \d+ ---",
            string.Empty);

        // Wiederholte Tabellenkopfzeile entfernen.
        text = Regex.Replace(
            text,
            @"Datum der BewerbungFirmaAdresseKontaktpersonE-MailTelefon-Nr\." +
            @"StellenbezeichnungLink zum Online-FormularZuweisung RAV" +
            @"VollzeitTeilzeit \(%\)Brieflich /elektronischPersönlichTelefonisch" +
            @"Noch offenVorstellungs-gesprächAnstellungAbsageAbsagegrund",
            string.Empty);

        // Die erste Seite enthält zusätzlich diese Tabellen-Fusszeile.
        text = Regex.Replace(
            text,
            @"Pensum\s*Bewerbung\s*Ergebnis\s*der\s*Bewerbung" +
            @"(?:\s*Seite\s*\d+\s*von\s*\d+)?",
            string.Empty,
            RegexOptions.IgnoreCase);

        // Formularhinweise am Ende sind keine Bewerbungsdaten.
        var footerIndex = text.IndexOf(
            "HinweisDie versicherte Person",
            StringComparison.Ordinal);

        if (footerIndex >= 0)
        {
            text = text[..footerIndex];
        }

        return text;
    }

}

public class PdfApplicationEntry
{
    public DateOnly ApplicationDate { get; set; }

    public string RawText { get; set; } = string.Empty;
}
