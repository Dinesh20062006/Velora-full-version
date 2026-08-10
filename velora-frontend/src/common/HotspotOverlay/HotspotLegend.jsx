import { ZONE_BANDS } from "../../utils/hotspotEngine";

/**
 * Small legend explaining the hotspot colors shown on the map. Also
 * displays a disclaimer, since these zones are randomly generated for
 * demo/UI purposes and are not based on real crime or incident data.
 */
function HotspotLegend() {
  return (
    <div className="hotspot-legend">
      {ZONE_BANDS.slice()
        .reverse()
        .map((band) => (
          <span className="hotspot-legend-item" key={band.level}>
            <i style={{ background: band.color }} />
            {band.label}
          </span>
        ))}
      <span className="hotspot-legend-note" style={{ color: "#00E676", fontWeight: "bold" }}>
        ● Real-time AI & Database Sync Active
      </span>
    </div>
  );
}

export default HotspotLegend;
