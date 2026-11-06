import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="hero-shell">
      <section className="hero-panel">
        <span className="eyebrow">Learning project</span>
        <h1>Build an EHR on AWS from a solid architectural foundation.</h1>
        <p>
          This project demonstrates the typical components of a healthcare application: authentication,
          patient records, clinical notes, medication workflows, billing, file storage, and the AWS
          infrastructure needed to run it safely and securely.
        </p>
        <div className="cta-row">
          <Link className="button primary" href="/login">
            Launch demo
          </Link>
          <Link className="button secondary" href="/dashboard">
            Open dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
