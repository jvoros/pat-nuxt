export const modes = {
  walkin: { tool: "Walk In", slug: "walkin", icon: "fa7-solid:user-plus" },
  ft: { tool: "Fast Track", slug: "ft", icon: "fa7-solid:bolt-lightning" },
  ambo: { tool: "Ambulance", slug: "ambo", icon: "fa7-solid:truck-medical" },
  police: { tool: "Police", slug: "police", icon: "fa7-solid:shield" },
  heli: { tool: "Helicopter", slug: "heli", icon: "fa7-solid:helicopter" },
};

export const timelineModes = {
  ...modes,
  info: { tool: "Information", slug: "info", icon: "fa7-solid:circle" },
};
