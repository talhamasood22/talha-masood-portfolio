/** Copy for the interactive task-run graph demo (Proxima Fusion work sample). */
export const graphShowcase = {
  title: "Task-run graph: 1,388 nodes → 52",
  /** The experience entry this was built in; its logo, role and dates are shown. */
  companyId: "proxima-fusion",
  lede: "The task-run graph I redesigned and shipped at Proxima Fusion, rebuilt here on mock data so you can try it. Switch to Before to see the problem it solved.",
  points: [
    {
      label: "Problem",
      text: "One busy object could fan out into 100+ nodes. Every task run was drawn separately, and zoomed to fit, nothing was readable.",
    },
    {
      label: "Approach",
      text: "Runs of the same task type collapse into one node you can step through. Task groups are added on demand from a + menu, so you build the path you care about one step at a time.",
    },
    {
      label: "Result",
      text: "On the worst-case graph in Proxima's production data: 1,388 → 52 nodes and 1,888 → 53 edges.",
    },
  ],
};
