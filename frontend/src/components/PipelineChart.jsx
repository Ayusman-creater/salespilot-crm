import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const PipelineChart = ({ data }) => {
  const chartData = (data || [])
    .map((d) => ({ stage: d._id, count: d.count, value: d.totalValue }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-6 flex items-center justify-center h-64 text-sm text-slate-400">
        No deals yet — pipeline chart will appear once deals are created.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Pipeline by Stage</h3>
      <p className="text-xs text-slate-500 mb-4">Deal value grouped by current stage</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E1" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => fmtCurrency(v)}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E4E1" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ fontSize: 12, fill: "#374151" }}
            axisLine={{ stroke: "#E5E4E1" }}
            tickLine={false}
            width={100}
          />
          <Tooltip
            formatter={(value, name) => (name === "value" ? [fmtCurrency(value), "Value"] : [value, "Deals"])}
            contentStyle={{ borderRadius: 6, border: "1px solid #E5E4E1", fontSize: 12 }}
          />
          <Bar dataKey="value" fill="#1F6F5C" radius={[0, 3, 3, 0]} barSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PipelineChart;