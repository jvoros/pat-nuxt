<patient-assignment-tool-guidelines>

# Patient Assignment Tools Guidelines

These are the guidelines for this specific application. The guiedelines should be followed to ensure the project stays in line with our main goals.


## Foundational Content

This application is used to assign patients to doctors and advance-practice providers (APPs) in a hospital emergency department. This is only for the staff on shift to know who is assigned which patient. There is no connection to the medical record. No patient-specific data is stored in this application.

The applicaiton is built around a "board." Each site, or Emergency Department, will have one board for each calendar day.

Each site has several key properties:
- access code: a shared password used by staff to access the board
- time zone: which standard time zone the department is in
- rooms: a list of rooms in that department
- providers: all the doctors and APPs that work at that site
- schedules: the various schedules for each day, including start and end times
- zones: the different zones of the department
- board: this is the core of the application and where patients are assigned to providers

### The Board

Each site has a board. The board exists for one calendar day. Each board contains many shifts. Each shift is a combination of a provider and a schedule. Each board contains several zones. Every board includes a zone for "Off Rotation". Each shift can belong to more than one zone.

Some zones are a rotation. A patient is assinged to a shift and the rotation advances so when the next patient arrives, staff know which provider will care for the next patient. 

Some zones are simply a list of providers and nothing rotates.

Some zones are a rotation for patient arrivals as well as a secondary supervisor rotation. Doctors will rotate who is up next to supervise APPs or residents.

Some zones are staffed only with APPs but use the supervisor rotation from another zone.

In the morning, when the first shift of the day is added to the board, the board will 'reset' and clear all the data from the previous day and start with a fresh board.

### Shifts

Some shifts have a 'bonus'. For example, if a shift has a bonus of 2 (2 more patients than usual) when the shift first joins the board, that shift will care for the first three patient arrivals before the rotation advances (1 patient for the usual turn, plus 2 bonus patients for the first turn). The bonus can vary for each schedule item.

### Providers

Some providers are doctors, some are APPs, some are residents. Only some providers can supervise other providers.

### Patients

The only data stored about patients are their mode of arrival (e.g. walk in, ambulance, fast track, police), their arrival time, and their room. Each patient is assigned to a shift. Each shift keeps track of how many patients they have been assigned and how many patients they have supervised.

Some shifts also keep track of how many patients they have 'triaged'. This is a count handled by the provider on their own by clicking a button on the board to log this activity.

### Events

The board keeps track of events that change the state of the board, e.g. when a provider joins the board, when a patient is assigned, when a provider triages a patient, when a provider switches zones, or when a provider logs out.

These events are displayed on the board so staff can see how things are happening.

The most recent event can be undone, reverting the board to the prior state before that event happened. There is no need for a redo action.

## Technical Goals

This app is developed by a single developer in their spare time. This app is being transitioned to Nuxt to use a tech stack that is more complete and has strong conventions and tools to avoid wiring together many different tech solutions into a single app.

Simplicity in code and code that is easy to reason about are the highest priority.

Being able to easily add and change features is more important that collecting and storing every granular detail about a site's activity.

## Current Tech Stack and Architecture

Currently the app is built in typescript and uses a Hono.js server and a Vue.js frontend. This required building an authentication layer, building API endpoints, implementing websockets. We are switching to Nuxt to avoid all this boilerplate overhead.

Communication between users and the server is two way, but is not complex. One user takes an action on the board, like assigning a patient to a shift, then the server broadcasts the updated board back to all the users logged in to that site. 

Only one action can occur at a time, enacted by one user.

### JSON State

The current app holds the board state in a single JSON object. Once any action occurs, the current state is saved as a previous state and the board is updated. The 'undo' action simply reverts to the previous state. From that state users can undo again, simply traversing back through previous states.

Here is an example of the current JSON state object:

```json
{
  "slug": "smh",
  "date": 1773748680810,
  "zoneOrder": [
    "main",
    "ft",
    "off"
  ],
  "timeline": [
    "lcuito",
    "r2t8a1",
    "0ecqor",
    "b24b3v",
    "dj67nr",
    "881csg",
    "encbfe",
    "2q0gtp",
    "nvndu6",
    "t3mqbu",
    "6qf4ok",
    "4cie1o",
    "7iik49",
    "fhviuv",
    "ov87fk",
    "servfu",
    "plb04h",
    "qd10rt",
    "7l65ik",
    "2gff86",
    "j6s9mr",
    "5e3cdq",
    "6kb7m0",
    "gvhi0d",
    "luj6oj"
  ],
  "zones": {
    "main": {
      "slug": "main",
      "name": "Main Rotation",
      "type": "dual",
      "superZone": "main",
      "triggerSkip": false,
      "next": 3,
      "super": 3,
      "shifts": [
        "dp0fh9",
        "o0dlfm",
        "0ne1fj",
        "61668e"
      ]
    },
    "ft": {
      "slug": "ft",
      "name": "Orange - Fast Track",
      "type": "simple",
      "superZone": "main",
      "triggerSkip": true,
      "pitZone": true,
      "next": 0,
      "super": null,
      "shifts": []
    },
    "off": {
      "slug": "off",
      "name": "Off Rotation",
      "type": "list",
      "triggerSkip": false,
      "next": 0,
      "super": null,
      "shifts": [
        "620ht9",
        "fpvcsh",
        "3tlp54",
        "7volf3",
        "lb7mbc"
      ]
    }
  },
  "shifts": {
    "620ht9": {
      "id": "620ht9",
      "name": "6 am - 3 pm",
      "bonus": 2,
      "status": "active",
      "assigned": 9,
      "supervised": 7,
      "triaged": 0,
      "last": "Porter",
      "first": "Jacob",
      "role": "physician"
    },
    "fpvcsh": {
      "id": "fpvcsh",
      "name": "6 am - 3 pm APP",
      "bonus": 1,
      "status": "active",
      "assigned": 9,
      "supervised": 0,
      "triaged": 0,
      "last": "Bown",
      "first": "Deanna",
      "role": "app"
    },
    "3tlp54": {
      "id": "3tlp54",
      "name": "8 am - 5 pm",
      "bonus": 2,
      "status": "active",
      "assigned": 11,
      "supervised": 6,
      "triaged": 0,
      "last": "Hardin",
      "first": "Jeff",
      "role": "physician"
    },
    "7volf3": {
      "id": "7volf3",
      "name": "10 am - 6 pm",
      "bonus": 2,
      "status": "active",
      "assigned": 11,
      "supervised": 7,
      "triaged": 0,
      "last": "Stiles",
      "first": "Adam",
      "role": "physician"
    },
    "lb7mbc": {
      "id": "lb7mbc",
      "name": "11 am - 8 pm APP",
      "bonus": 0,
      "status": "skip",
      "assigned": 12,
      "supervised": 0,
      "triaged": 16,
      "last": "Cross",
      "first": "Taylor",
      "role": "app"
    },
    "61668e": {
      "id": "61668e",
      "name": "3 pm - 11 pm",
      "bonus": 2,
      "status": "active",
      "assigned": 6,
      "supervised": 4,
      "triaged": 0,
      "last": "Christensen",
      "first": "Mark",
      "role": "physician"
    },
    "o0dlfm": {
      "id": "o0dlfm",
      "name": "3 pm - Midnight APP",
      "bonus": 1,
      "status": "active",
      "assigned": 6,
      "supervised": 0,
      "triaged": 0,
      "last": "Kasavana",
      "first": "Brian",
      "role": "app"
    },
    "0ne1fj": {
      "id": "0ne1fj",
      "name": "5 pm - 1 am",
      "bonus": 2,
      "status": "active",
      "assigned": 5,
      "supervised": 2,
      "triaged": 0,
      "last": "Merchant",
      "first": "Azher",
      "role": "physician"
    },
    "dp0fh9": {
      "id": "dp0fh9",
      "name": "6 pm - 2 am",
      "bonus": 2,
      "status": "active",
      "assigned": 4,
      "supervised": 1,
      "triaged": 0,
      "last": "Hollifield",
      "first": "Matt",
      "role": "physician"
    }
  },
  "events": {
    "luj6oj": {
      "id": "luj6oj",
      "time": 1773787484630,
      "message": "Taylor Cross triaged a patient."
    },
    "gvhi0d": {
      "id": "gvhi0d",
      "time": 1773787655425,
      "message": "Jeff Hardin signed out"
    },
    "6kb7m0": {
      "id": "6kb7m0",
      "time": 1773787664577,
      "message": "Room 13 assigned to Brian Kasavana",
      "mode": "walkin",
      "room": "13",
      "assign": "o0dlfm",
      "super": "61668e"
    },
    "5e3cdq": {
      "id": "5e3cdq",
      "time": 1773788608321,
      "message": "Azher Merchant joined Main Rotation"
    },
    "j6s9mr": {
      "id": "j6s9mr",
      "time": 1773788615890,
      "message": "Room 4 assigned to Azher Merchant",
      "mode": "walkin",
      "room": "4",
      "assign": "0ne1fj"
    },
    "2gff86": {
      "id": "2gff86",
      "time": 1773789332674,
      "message": "Room 28 assigned to Azher Merchant",
      "mode": "ambo",
      "room": "28",
      "assign": "0ne1fj"
    },
    "7l65ik": {
      "id": "7l65ik",
      "time": 1773789372943,
      "message": "Room 16 assigned to Azher Merchant",
      "mode": "ambo",
      "room": "16",
      "assign": "0ne1fj"
    },
    "qd10rt": {
      "id": "qd10rt",
      "time": 1773789709158,
      "message": "Taylor Cross triaged a patient."
    },
    "plb04h": {
      "id": "plb04h",
      "time": 1773790063194,
      "message": "Room 103 assigned to Taylor Cross",
      "mode": "walkin",
      "room": "103",
      "assign": "lb7mbc",
      "super": "7volf3"
    },
    "servfu": {
      "id": "servfu",
      "time": 1773790431618,
      "message": "Room 101 assigned to Taylor Cross",
      "mode": "walkin",
      "room": "101",
      "assign": "lb7mbc",
      "super": "0ne1fj"
    },
    "ov87fk": {
      "id": "ov87fk",
      "time": 1773790688285,
      "message": "Room 6 assigned to Mark Christensen",
      "mode": "walkin",
      "room": "6",
      "assign": "61668e"
    },
    "fhviuv": {
      "id": "fhviuv",
      "time": 1773791473202,
      "message": "Room 23 assigned to Adam Stiles",
      "mode": "walkin",
      "room": "23",
      "assign": "7volf3"
    },
    "7iik49": {
      "id": "7iik49",
      "time": 1773792236977,
      "message": "Matt Hollifield joined Main Rotation"
    },
    "4cie1o": {
      "id": "4cie1o",
      "time": 1773792247131,
      "message": "Adam Stiles signed out"
    },
    "6qf4ok": {
      "id": "6qf4ok",
      "time": 1773792620198,
      "message": "Room 102 assigned to Taylor Cross",
      "mode": "walkin",
      "room": "102",
      "assign": "lb7mbc",
      "super": "61668e"
    },
    "t3mqbu": {
      "id": "t3mqbu",
      "time": 1773793305701,
      "message": "Room 2 assigned to Matt Hollifield",
      "mode": "walkin",
      "room": "2",
      "assign": "dp0fh9"
    },
    "nvndu6": {
      "id": "nvndu6",
      "time": 1773793614047,
      "message": "Room 11 assigned to Matt Hollifield",
      "mode": "walkin",
      "room": "11",
      "assign": "dp0fh9"
    },
    "2q0gtp": {
      "id": "2q0gtp",
      "time": 1773795102507,
      "message": "Room 12 assigned to Matt Hollifield",
      "mode": "walkin",
      "room": "12",
      "assign": "dp0fh9"
    },
    "encbfe": {
      "id": "encbfe",
      "time": 1773795391627,
      "message": "Room 20 assigned to Brian Kasavana",
      "mode": "walkin",
      "room": "20",
      "assign": "o0dlfm",
      "super": "dp0fh9"
    },
    "881csg": {
      "id": "881csg",
      "time": 1773795860556,
      "message": "Room 3 assigned to Azher Merchant",
      "mode": "walkin",
      "room": "3",
      "assign": "0ne1fj"
    },
    "dj67nr": {
      "id": "dj67nr",
      "time": 1773798402055,
      "message": "Room 30 assigned to Mark Christensen",
      "mode": "walkin",
      "room": "30",
      "assign": "61668e"
    },
    "b24b3v": {
      "id": "b24b3v",
      "time": 1773798533521,
      "message": "Room 10 assigned to Matt Hollifield",
      "mode": "walkin",
      "room": "10",
      "assign": "dp0fh9"
    },
    "0ecqor": {
      "id": "0ecqor",
      "time": 1773798985789,
      "message": "Room 23 assigned to Brian Kasavana",
      "mode": "walkin",
      "room": "23",
      "assign": "o0dlfm",
      "super": "0ne1fj"
    },
    "r2t8a1": {
      "id": "r2t8a1",
      "time": 1773799074593,
      "message": "Taylor Cross signed out"
    },
    "lcuito": {
      "id": "lcuito",
      "time": 1773799261274,
      "message": "Room 4 assigned to Azher Merchant",
      "mode": "walkin",
      "room": "4",
      "assign": "0ne1fj"
    }
  },
  "undo": 33853
}
```

The new stack should use something similar. Simpler is always better. A different structure is acceptable. 

### Database

The database has these tables:

- sites
- providers
- boards
- undos

This is the current structure but could be changed as needed.

### Sites

Currently each site uses a JSON configuration file. This is cumbersome. Here is an example config file:

```json
const config: SiteConfig = {
  name: "St. Mark's Hospital",
  slug: "smh",
  zones: {
    main: {
      slug: "main",
      name: "Main Rotation",
      type: "dual",
      superZone: "main",
      triggerSkip: false,
    },
    ft: {
      slug: "ft",
      name: "Orange - Fast Track",
      type: "simple",
      superZone: "main",
      triggerSkip: true,
      pitZone: true,
    },
    off: {
      slug: "off",
      name: "Off Rotation",
      type: "list",
      triggerSkip: false,
    },
  },
  zoneOrder: ["main", "ft", "off"],
  schedule: [
    {
      name: "6 am - 3 pm",
      bonus: 2,
      joins: "main",
      reset: true,
    },
    {
      name: "6 am - 3 pm APP",
      bonus: 1,
      joins: "main",
    },
    {
      name: "8 am - 5 pm",
      bonus: 2,
      joins: "main",
    },
    {
      name: "10 am - 6 pm",
      bonus: 2,
      joins: "main",
    },
    {
      name: "11 am - 8 pm",
      bonus: 2,
      joins: "main",
    },
    {
      name: "11 am - 8 pm APP",
      bonus: 0,
      joins: "ft",
    },
    {
      name: "3 pm - 11 pm",
      bonus: 2,
      joins: "main",
    },
    {
      name: "3 pm - Midnight APP",
      bonus: 1,
      joins: "main",
    },
    {
      name: "5 pm - 1 am",
      bonus: 2,
      joins: "main",
    },
    {
      name: "6 pm - 2 am",
      bonus: 2,
      joins: "main",
    },
    {
      name: "7 pm - 3 am APP",
      bonus: 1,
      joins: "main",
    },
    {
      name: "11 pm - 6 am",
      bonus: 2,
      joins: "main",
    },
  ],
  providers: [
    {
      last: "Anderson",
      first: "Allison",
      role: "app",
    },
    {
      last: "Baretela",
      first: "Tracie",
      role: "app",
    },
    {
      last: "Blake",
      first: "Kelly",
      role: "physician",
    },
    {
      last: "Bown",
      first: "Deanna",
      role: "app",
    },
    {
      last: "Carmack",
      first: "Brian",
      role: "physician",
    },
    {
      last: "Cheever",
      first: "Shelley",
      role: "app",
    },
    {
      last: "Christensen",
      first: "Mark",
      role: "physician",
    },
    {
      last: "Conca",
      first: "Rocco",
      role: "app",
    },
    {
      last: "Cross",
      first: "Taylor",
      role: "app",
    },
    {
      last: "Dastrup",
      first: "Brigham",
      role: "physician",
    },
    {
      last: "Doc - Not Listed",
      first: "",
      role: "physician",
    },
    {
      last: "APP - Not Listed",
      first: "",
      role: "app",
    },
  ],
  rooms: [
    "1",
    "2",
    "3",
    "4",
    "5",
    "Hall A",
    "Hall B",
    "Hall C",
    "Hall D",
    "Hall E",
    "Hall F",
    "Other",
  ],
};

export default config;

```

</patient-assignment-tool-guidelines>
