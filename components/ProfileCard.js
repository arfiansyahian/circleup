export default function ProfileCard({ profile, interests = [], prompt }) {
  if (!profile) return null;
  return (
    <div className="card">
      <div
        style={{
          width: "100%",
          height: 220,
          borderRadius: 16,
          background: profile.photo_url ? `url(${profile.photo_url}) center/cover` : "#eadfca",
          marginBottom: 14,
        }}
      />
      <h2 style={{ marginBottom: 2 }}>
        {profile.nickname}
        {profile.age ? `, ${profile.age}` : ""}
      </h2>
      <p className="muted" style={{ marginTop: 0 }}>
        {[profile.occupation, profile.city].filter(Boolean).join(" • ")}
      </p>
      {interests.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {interests.map((i) => (
            <span key={i} className="chip">
              {i}
            </span>
          ))}
        </div>
      )}
      {prompt && (
        <div className="card" style={{ background: "#f5efe5", marginTop: 14, marginBottom: 0 }}>
          <p className="muted" style={{ margin: 0, fontWeight: 600 }}>
            {prompt}
          </p>
        </div>
      )}
    </div>
  );
}
