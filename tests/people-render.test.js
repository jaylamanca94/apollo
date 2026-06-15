const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadDashboardHelpers({ elements = {}, fetchPayload = null } = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const helperSource = source.slice(0, source.indexOf("async function loadPeople"));
  const context = {
    AbortController,
    document: {
      documentElement: {
        setAttribute() {}
      },
      querySelector(selector) {
        return elements[selector] || null;
      }
    },
    fetch: async () => ({
      ok: true,
      status: 200,
      async json() {
        return fetchPayload;
      }
    }),
    window: {
      localStorage: {
        getItem() {
          return null;
        },
        setItem() {}
      },
      clearTimeout,
      setTimeout
    },
    URL
  };

  vm.createContext(context);
  vm.runInContext(helperSource, context);

  return context;
}

test("normalizePeople accepts spacecraft field from the live crew feed", () => {
  const { normalizePeople, summarizeCraftOccupancy } = loadDashboardHelpers();
  const people = normalizePeople({
    people: [
      {
        name: "Jessica Meir",
        spacecraft: "Crew-12 Dragon"
      },
      {
        name: "Sergey Mikayev",
        spacecraft: "Soyuz MS-28"
      },
      {
        name: "Sophie Adenot",
        craft: "ISS",
        spacecraft: "Crew-12 Dragon"
      }
    ]
  });

  assert.deepEqual(JSON.parse(JSON.stringify(people)), [
    {
      name: "Jessica Meir",
      craft: "Crew-12 Dragon"
    },
    {
      name: "Sergey Mikayev",
      craft: "Soyuz MS-28"
    },
    {
      name: "Sophie Adenot",
      craft: "Crew-12 Dragon"
    }
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(summarizeCraftOccupancy(people))), [
    {
      craft: "Crew-12 Dragon",
      count: 2
    },
    {
      craft: "Soyuz MS-28",
      count: 1
    }
  ]);
});

test("loadApod renders embeddable videos with direct media links", async () => {
  const apodBody = {
    innerHTML: ""
  };
  const { loadApod } = loadDashboardHelpers({
    elements: {
      "#apodBody": apodBody
    },
    fetchPayload: {
      apod: {
        date: "2026-06-10",
        explanation: "A solar eruption video.",
        mediaType: "video",
        mediaUrl: "https://www.youtube.com/watch?v=abc123XYZ_8",
        mediaEmbedUrl: "https://www.youtube.com/embed/abc123XYZ_8",
        sourceUrl: "https://apod.nasa.gov/apod/ap260610.html",
        title: "Solar eruption"
      }
    }
  });

  const status = await loadApod();

  assert.match(apodBody.innerHTML, /<iframe src="https:\/\/www\.youtube\.com\/embed\/abc123XYZ_8"/);
  assert.match(apodBody.innerHTML, /href="https:\/\/www\.youtube\.com\/watch\?v=abc123XYZ_8"/);
  assert.match(apodBody.innerHTML, /View video/);
  assert.equal(status.id, "apod");
  assert.equal(status.state, "ok");
  assert.match(status.detail, /^Video for/);
});

test("loadApod avoids iframe embeds for unknown media types", async () => {
  const apodBody = {
    innerHTML: ""
  };
  const { loadApod } = loadDashboardHelpers({
    elements: {
      "#apodBody": apodBody
    },
    fetchPayload: {
      apod: {
        date: "2026-06-11",
        explanation: "An interactive NASA media item.",
        mediaType: "other",
        mediaUrl: "https://example.com/apod-interactive",
        sourceUrl: "https://apod.nasa.gov/apod/ap260611.html",
        title: "Interactive sky view"
      }
    }
  });

  const status = await loadApod();

  assert.doesNotMatch(apodBody.innerHTML, /<iframe/);
  assert.match(apodBody.innerHTML, /NASA media preview is unavailable here/);
  assert.match(apodBody.innerHTML, /href="https:\/\/example\.com\/apod-interactive"/);
  assert.match(apodBody.innerHTML, /Open media/);
  assert.equal(status.id, "apod");
  assert.equal(status.state, "ok");
  assert.match(status.detail, /^Media for/);
});
