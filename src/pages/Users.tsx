export default function Users({ tenantId: _tenantId }: { tenantId: string }) {
  return (
    <div>
      <div className="section-header">
        <h2>Users</h2>
      </div>

      <div className="empty-state">
        <p>User management requires the SCIM endpoint (coming soon).</p>
        <p style={{ marginTop: '8px' }}>
          <a
            href="https://github.com/saidevulapalli/authcore/blob/main/docs/ROADMAP.md"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-link"
          >
            View Roadmap
          </a>
        </p>
      </div>
    </div>
  )
}
