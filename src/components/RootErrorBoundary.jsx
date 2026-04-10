import React from "react";

export default class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("RootErrorBoundary:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            maxWidth: "40rem",
            margin: "0 auto",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Something went wrong</h1>
          <p style={{ color: "#444", marginBottom: "1rem" }}>
            The app hit an error while rendering. Check the browser console (F12 → Console) for details.
          </p>
          <pre
            style={{
              fontSize: "0.8rem",
              background: "#f4f4f5",
              padding: "1rem",
              borderRadius: "8px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            type="button"
            style={{
              marginTop: "1.25rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
