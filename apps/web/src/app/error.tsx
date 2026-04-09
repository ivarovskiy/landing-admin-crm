"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="ds-container error-page">
      <div className="ds-card error-page__card">
        <div className="ds-kicker">Something went wrong</div>
        <pre className="error-page__trace">{error.message}</pre>
        <button className="ds-pill error-page__retry" onClick={() => reset()}>
          Retry
        </button>
      </div>
    </div>
  );
}
