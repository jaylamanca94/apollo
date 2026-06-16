const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadDashboardHelpers({ elements = {}, fetchPayload = null } = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const helperSource = source.slice(0, source.indexOf("async function loadLaunches"));
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
  const { normalizeCrewRoster, normalizePeople, summarizeCraftOccupancy } = loadDashboardHelpers();
  const roster = normalizeCrewRoster({
    iss_expedition: 74,
    number: 3,
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

  assert.equal(roster.sourceCount, 3);
  assert.equal(roster.expedition, "74");
  assert.deepEqual(JSON.parse(JSON.stringify(roster.people)), JSON.parse(JSON.stringify(people)));
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

test("loadPeople renders source roster count and expedition context", async () => {
  const peopleBody = {
    innerHTML: ""
  };
  const { loadPeople } = loadDashboardHelpers({
    elements: {
      "#peopleBody": peopleBody
    },
    fetchPayload: {
      iss_expedition: 74,
      number: 2,
      people: [
        {
          name: "Maya Chen",
          spacecraft: "Crew Dragon"
        },
        {
          name: "Rafael Ortiz",
          spacecraft: "Soyuz MS-28"
        }
      ]
    }
  });

  const status = await loadPeople();

  assert.match(peopleBody.innerHTML, /Source roster count/);
  assert.match(peopleBody.innerHTML, /2 declared/);
  assert.match(peopleBody.innerHTML, /2 listed below/);
  assert.match(peopleBody.innerHTML, /Expedition 74/);
  assert.equal(status.id, "people");
  assert.equal(status.state, "ok");
  assert.match(status.detail, /2 people across 2 crew locations listed; Expedition 74\./);
});

test("loadPeople flags mismatched source roster counts", async () => {
  const peopleBody = {
    innerHTML: ""
  };
  const { loadPeople } = loadDashboardHelpers({
    elements: {
      "#peopleBody": peopleBody
    },
    fetchPayload: {
      iss_expedition: 74,
      number: 3,
      people: [
        {
          name: "Maya Chen",
          spacecraft: "Crew Dragon"
        },
        {
          name: "Rafael Ortiz",
          spacecraft: "Soyuz MS-28"
        }
      ]
    }
  });

  const status = await loadPeople();

  assert.match(peopleBody.innerHTML, /2 listed below; source reports 3/);
  assert.equal(status.id, "people");
  assert.equal(status.state, "attention");
  assert.match(status.detail, /Source reports 3 people but 2 roster entries loaded/);
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
