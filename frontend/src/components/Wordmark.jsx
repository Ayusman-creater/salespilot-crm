const Wordmark = ({ size = "text-2xl", light = false }) => (
  <span className={`font-heading font-bold ${size}`}>
    <span className={light ? "text-white" : "text-ink-900"}>Sales</span>
    <span className="text-indigo-600">Pilot</span>
  </span>
);

export default Wordmark;