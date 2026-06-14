const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadDashboardHelpers() {
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const helperSource = source.slice(0, source.indexOf("async function loadPeople"));
  const context = {
    document: {
      documentElement: {
        setAttribute() {}
      },
      querySelector() {
        return null;
      }
    },
    window: {
      localStorage: {
        getItem() {
          return null;
        },
        setItem() {}
      }
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
