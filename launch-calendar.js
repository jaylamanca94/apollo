// A local calendar-file hand-off, never a subscription or a calendar write.
(function (root) {
  "use strict";
  const MAX_AGE_MS = 30 * 60000;
  const text = value => typeof value === "string" ? value.trim() : "";
  const timestamp = value => typeof value === "string" && /T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
    ? Date.parse(value) : NaN;
  function sourceUrl(value) {
    try {
      const url = new URL(value);
      return /^(https?:)$/.test(url.protocol) && !url.username && !url.password ? url.href : "";
    } catch { return ""; }
  }
  function unavailableReason(launch, checkedAt, now = new Date()) {
    const current = +new Date(now);
    const checked = timestamp(checkedAt);
    if (!Number.isFinite(current) || !Number.isFinite(checked) || checked > current || current - checked > MAX_AGE_MS)
      return "Refresh the schedule before saving a calendar file.";
    if (!/^[a-z0-9_-]{1,128}$/i.test(text(launch?.id)) || !text(launch?.name) || !sourceUrl(launch?.sourceUrl))
      return "Calendar saving needs a mission identity and source link.";
    if (![1, 8].includes(launch.statusId))
      return "Calendar saving is available once the source reports Go for Launch or To Be Confirmed.";
    if (!/^(second|minute)$/i.test(text(launch.datePrecision)))
      return "The source has not supplied a precise launch time yet.";
    if (!Number.isFinite(timestamp(launch.dateUtc)) || timestamp(launch.dateUtc) <= current)
      return "This target time has passed. Refresh for a new launch target.";
    return "";
  }
  function escapeText(value) {
    return String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
  }
  // RFC 5545 folds at 75 UTF-8 octets, without splitting a multibyte character.
  function foldLine(line) {
    const encoder = new TextEncoder();
    let result = "", length = 0;
    for (const character of line) {
      const size = encoder.encode(character).length;
      if (length + size > 75) { result += "\r\n "; length = 1; }
      result += character;
      length += size;
    }
    return result;
  }
  const utc = value => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  function build(launch, checkedAt, returnUrl, now = new Date()) {
    if (unavailableReason(launch, checkedAt, now)) return null;
    const target = timestamp(launch.dateUtc);
    const start = timestamp(launch.windowStart);
    const end = timestamp(launch.windowEnd);
    const validWindow = Number.isFinite(start) && Number.isFinite(end) && start <= target && end >= target && end - start <= 86400000;
    const description = [
      "Scheduled launch target. Times can change.",
      "This calendar file is a snapshot and will not update automatically. Recheck the mission source before watching.",
      `Schedule checked: ${new Date(checkedAt).toISOString()}`,
      `Source status: ${text(launch.status)}`,
      validWindow ? `Launch window (UTC): ${new Date(start).toISOString()} to ${new Date(end).toISOString()}` : "",
      `Source: ${sourceUrl(launch.sourceUrl)}`,
      sourceUrl(returnUrl) ? `Return to Apollo: ${sourceUrl(returnUrl)}` : ""
    ].filter(Boolean).join("\n");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Apollo//Launch calendar//EN", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT", `UID:apollo-launch-${launch.id}`, `DTSTAMP:${utc(now)}`, `DTSTART:${utc(target)}`,
      // Omit DTEND for an instantaneous/unknown window; never invent a duration.
      validWindow && end > target ? `DTEND:${utc(end)}` : "",
      `SUMMARY:${escapeText(`Launch target: ${launch.name}`)}`, "STATUS:TENTATIVE", "TRANSP:TRANSPARENT",
      `DESCRIPTION:${escapeText(description)}`,
      text(launch.location) ? `LOCATION:${escapeText(launch.location)}` : "",
      `URL:${sourceUrl(launch.sourceUrl)}`, "END:VEVENT", "END:VCALENDAR"];
    return lines.filter(Boolean).map(foldLine).join("\r\n") + "\r\n";
  }
  const api = { build, unavailableReason };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LaunchCalendar = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
