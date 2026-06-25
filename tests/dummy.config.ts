import type { SiteConfig } from "../server/core/types.js";

const config: SiteConfig = {
  name: "St. Elsewhere",
  slug: "ste",
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
      name: "Fast Track",
      type: "simple",
      superZone: "main",
      pitZone: true,
      triggerSkip: true,
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
    { name: "6 am - 3 pm", bonus: 2, joins: "main", reset: true },
    { name: "6 am - 3 pm APP", bonus: 1, joins: "main" },
    { name: "8 am - 5 pm", bonus: 2, joins: "main" },
    { name: "11 am - 8 pm", bonus: 2, joins: "main" },
    { name: "3 pm - 11 pm", bonus: 2, joins: "main" },
    { name: "3 pm - Midnight APP", bonus: 1, joins: "main" },
    { name: "7 pm - 3 am APP", bonus: 1, joins: "main" },
    { name: "5 pm - 1 am", bonus: 2, joins: "main" },
    { name: "11 pm - 6 am", bonus: 2, joins: "main" },
  ],
  providers: [
    { last: "Blake", first: "Kelly", role: "physician" },
    { last: "Bown", first: "Deanna", role: "app" },
    { last: "Carmack", first: "Brian", role: "physician" },
    { last: "Cheever", first: "Shelley", role: "app" },
    { last: "Christensen", first: "Mark", role: "physician" },
    { last: "Conca", first: "Rocco", role: "app" },
    { last: "Cross", first: "Taylor", role: "app" },
    { last: "Dastrup", first: "Brigham", role: "physician" },
    { last: "DeWeerd", first: "Pete", role: "physician" },
    { last: "Denson", first: "Dave", role: "physician" },
    { last: "Erbach", first: "Craig", role: "physician" },
  ],
  rooms: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
};

export default config;
