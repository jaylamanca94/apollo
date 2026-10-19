// Source-date interpretation shared by the briefing and launch detail page.
(function (root) {
  "use strict";
  const precise = launch => /^(second|minute)$/i.test(launch?.datePrecision || "");
  const timestamp = value => typeof value === "string" && /T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? Date.parse(value) : NaN;
  function target(launch, compact = false) {
    const time = timestamp(launch?.dateUtc);
    if (!Number.isFinite(time)) return "Date and time unconfirmed";
    if (precise(launch)) return new Date(time).toLocaleString([], {
      month: "short", day: "numeric", ...(compact ? {} : { year: "numeric" }),
      hour: "numeric", minute: "2-digit", timeZoneName: "short"
    });
    const precision = (launch?.datePrecision || "").toLowerCase();
    if (!["day", "month", "year"].includes(precision)) return "Date and time unconfirmed";
    const date = new Date(time).toLocaleDateString([], { year: "numeric", timeZone: "UTC",
      ...(precision !== "year" ? { month: "short" } : {}), ...(precision === "day" ? { day: "numeric" } : {}) });
    return `${date} · ${precision === "day" ? "Time" : precision === "month" ? "Day" : "Date"} unconfirmed (source date)`;
  }
  function countdown(launch, now = Date.now()) {
    if (![1, 8].includes(launch?.statusId)) return launch?.statusId === 5 ? "On hold" : launch?.statusId === 6 ? "Scrubbed" : "Target unconfirmed";
    if (!precise(launch)) return "Time unconfirmed";
    const diff = timestamp(launch?.dateUtc) - +new Date(now);
    if (!Number.isFinite(diff)) return "Time unconfirmed";
    if (diff <= 0) return "Target time passed";
    const days = Math.floor(diff / 86400000), hours = Math.floor(diff % 86400000 / 3600000);
    if (days) return `T-${days}d ${hours}h`;
    if (hours) return `T-${hours}h`;
    const minutes = Math.floor(diff / 60000);
    return minutes ? `T-${minutes}m` : "T-<1m";
  }
  function upcoming(launch, now = Date.now()) {
    if (![1, 2, 8, 9].includes(launch?.statusId)) return false;
    const time = timestamp(launch?.dateUtc);
    if (!Number.isFinite(time)) return false;
    const date = new Date(time);
    const precision = (launch.datePrecision || "").toLowerCase();
    // Source placeholders are bounds, never exact local times. Keep the entire
    // supplied source day/month/year eligible until its UTC period ends.
    const end = precision === "day" ? Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)
      : precision === "month" ? Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
      : precision === "year" ? Date.UTC(date.getUTCFullYear() + 1, 0, 1) : time;
    return (precise(launch) || ["day", "month", "year"].includes(precision)) && end > +new Date(now);
  }
  const api = { precise, timestamp, target, countdown, upcoming };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LaunchTiming = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
