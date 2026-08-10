import React from "react";

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
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
            📍 Map Service Notice (Demo Quota Reached)
          </h4>
          <p style={{ fontSize: "13px", margin: 0, color: "#d1d5db" }}>
            Google Maps demo API key limit reached. All safe zone calculations, 10 km list data, distances, and turn-by-turn navigation remain fully functional below!
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;
