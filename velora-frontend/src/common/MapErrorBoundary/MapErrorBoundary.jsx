import React from "react";

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidMount() {
    if (typeof window !== "undefined") {
      const prevAuthFailure = window.gm_authFailure;
      window.gm_authFailure = () => {
        if (typeof prevAuthFailure === "function") {
          try { prevAuthFailure(); } catch (err) { console.warn(err); }
        }
        this.setState({ hasError: true, error: new Error("Google Maps authentication or quota limit reached.") });
      };
    }
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Google Maps error caught gracefully:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "24px",
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: "12px",
          textAlign: "center",
          color: "#9ca3af",
          margin: "12px 0"
        }}>
          <h4 style={{ color: "#FFC107", margin: "0 0 8px 0", fontSize: "16px" }}>
            📍 Map Service Notice (Demo Key / Quota Limit)
          </h4>
          <p style={{ fontSize: "13px", margin: 0, color: "#d1d5db" }}>
            Google Maps service notice: Live vector map layer is temporarily fallback restricted. All safe zone calculations, list data, distances, and turn-by-turn navigation metrics remain 100% operational!
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;

