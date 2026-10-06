const fs = require('fs');
const sets = {
  ten: { milestones: "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250" },
  empty: { milestones: "", footer: "" },
  long: { eventName: "Great Salterns Nature Reserve 5k Juniors", counts: { finishers: 1204, newPbs: 211, firstTimers: 96, visitors: 140, volunteers: 58, firstTimeVolunteers: 9 }, runNumber: 1043, milestones: "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 5xV25", footer: "Thanks to all 58 volunteers - see you next Saturday at 9am by the cafe" },
  maxed: { counts: { finishers: 9999, newPbs: 9999, firstTimers: 9999, visitors: 9999, volunteers: 9999, firstTimeVolunteers: 9999 }, runNumber: 9999, milestones: "1xR100" },
};
for (const [k, v] of Object.entries(sets)) fs.writeFileSync(`${k}.props.json`, JSON.stringify(v));
