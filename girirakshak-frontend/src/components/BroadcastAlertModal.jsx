import { useState } from "react";
import {
  X,
  Radio,
  CheckCircle2,
  Smartphone,
  MessageSquare,
  Shield,
  Volume2,
} from "lucide-react";

export default function BroadcastAlertModal({ isOpen, onClose, zones = [], onBroadcast }) {
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || "z7");
  const [severity, setSeverity] = useState("critical");
  const [headline, setHeadline] = useState("");
  const [channels, setChannels] = useState({
    sms: true,
    whatsapp: true,
    cap: true,
    siren: false,
  });
  const [targetAudience, setTargetAudience] = useState({
    dm: true,
    ndrf: true,
    bro: true,
    public: true,
  });
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const activeZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  const handleSend = async (e) => {
    e.preventDefault();
    setIsSending(true);

    const alertPayload = {
      zoneId: activeZone?.id || "z1",
      severity,
      message:
        headline.trim() ||
        `CAP ALERT [${severity.toUpperCase()}]: Severe landslide threat detected in ${activeZone?.name}. Immediate precautionary measures advised.`,
      state: activeZone?.state || "NER Regional",
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      channels: Object.keys(channels).filter((k) => channels[k]),
      audience: Object.keys(targetAudience).filter((k) => targetAudience[k]).join(", "),
    };

    if (onBroadcast) {
      await onBroadcast(alertPayload);
    }

    setIsSending(false);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-panel-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-risk-critical/15 text-risk-critical ring-1 ring-risk-critical/30">
              <Radio size={18} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
                CAP Multi-Channel Emergency Alert Dispatch
                <span className="rounded-full bg-risk-critical/15 px-2 py-0.5 font-mono text-[10px] text-risk-critical font-bold">
                  NDMA CAP-v1.2
                </span>
              </h2>
              <p className="text-[11px] text-muted">
                Broadcast instant landslide advisories across Cell Broadcast SMS, WhatsApp, and DDMA Radio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-panel hover:text-ink transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSend} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Target Zone & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 font-mono uppercase text-[11px]">
                Target Disaster Sector / Corridor
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-xs text-ink focus:border-teal focus:outline-none"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.state}) - AI Risk {z.riskScore}/100
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 font-mono uppercase text-[11px]">
                Alert Urgency & Severity Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSeverity("critical")}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-bold text-center transition cursor-pointer ${
                    severity === "critical"
                      ? "bg-risk-critical text-white border-risk-critical"
                      : "bg-panel border-line text-muted"
                  }`}
                >
                  RED (Critical)
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity("high")}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-bold text-center transition cursor-pointer ${
                    severity === "high"
                      ? "bg-risk-high text-white border-risk-high"
                      : "bg-panel border-line text-muted"
                  }`}
                >
                  ORANGE (High)
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity("moderate")}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-bold text-center transition cursor-pointer ${
                    severity === "moderate"
                      ? "bg-amber text-white border-amber"
                      : "bg-panel border-line text-muted"
                  }`}
                >
                  YELLOW (Watch)
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Channels */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 font-mono uppercase text-[11px]">
              Multi-Channel Broadcast Channels
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-line bg-panel-2 p-2.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                  className="accent-teal"
                />
                <Smartphone size={15} className="text-teal" />
                <span>Cell SMS Broadcast</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-line bg-panel-2 p-2.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.whatsapp}
                  onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })}
                  className="accent-teal"
                />
                <MessageSquare size={15} className="text-risk-low" />
                <span>WhatsApp Bot</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-line bg-panel-2 p-2.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.cap}
                  onChange={(e) => setChannels({ ...channels, cap: e.target.checked })}
                  className="accent-teal"
                />
                <Shield size={15} className="text-amber" />
                <span>CAP Feed & API</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-line bg-panel-2 p-2.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.siren}
                  onChange={(e) => setChannels({ ...channels, siren: e.target.checked })}
                  className="accent-teal"
                />
                <Volume2 size={15} className="text-risk-critical" />
                <span>VHF Audio Siren</span>
              </label>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 font-mono uppercase text-[11px]">
              Target Recipients & Authorities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label className="flex items-center gap-2 rounded-lg border border-line bg-panel p-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetAudience.dm}
                  onChange={(e) => setTargetAudience({ ...targetAudience, dm: e.target.checked })}
                  className="accent-teal"
                />
                <span>DM & DDMA</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-line bg-panel p-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetAudience.ndrf}
                  onChange={(e) => setTargetAudience({ ...targetAudience, ndrf: e.target.checked })}
                  className="accent-teal"
                />
                <span>NDRF / SDRF</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-line bg-panel p-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetAudience.bro}
                  onChange={(e) => setTargetAudience({ ...targetAudience, bro: e.target.checked })}
                  className="accent-teal"
                />
                <span>BRO & PWD</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-line bg-panel p-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetAudience.public}
                  onChange={(e) => setTargetAudience({ ...targetAudience, public: e.target.checked })}
                  className="accent-teal"
                />
                <span>Local Public</span>
              </label>
            </div>
          </div>

          {/* Alert Message Text */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1 font-mono uppercase text-[11px]">
              Alert Headline & Evacuation Directive
            </label>
            <textarea
              rows={3}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={`e.g. CAP ALERT: Severe landslide danger on ${activeZone?.name}. Immediate road closure and evacuation of vulnerable slopes ordered.`}
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-ink placeholder-faint focus:border-teal focus:outline-none resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            {sentSuccess ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-risk-low/20 border border-risk-low/40 p-3 text-xs font-semibold text-risk-low">
                <CheckCircle2 size={16} /> Emergency alert successfully broadcasted across all selected channels!
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-risk-critical py-3 text-xs font-bold text-white shadow-lg shadow-risk-critical/20 hover:bg-risk-critical/90 active:scale-95 transition cursor-pointer"
              >
                {isSending ? "Broadcasting CAP Alert…" : "🚨 Broadcast Emergency Disaster Alert"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
