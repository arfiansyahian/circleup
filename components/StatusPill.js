export default function StatusPill({ status }) {
  const map = {
    approved: { label: "Approved", cls: "pill-approved" },
    waitlist: { label: "Waitlist", cls: "pill-waitlist" },
    pending: { label: "Under Review", cls: "pill-pending" },
    rejected: { label: "Rejected", cls: "pill-rejected" },
    active: { label: "Active", cls: "pill-active" },
    completed: { label: "Completed", cls: "pill-approved" },
  };
  const s = map[status] || { label: status, cls: "pill-pending" };
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}
