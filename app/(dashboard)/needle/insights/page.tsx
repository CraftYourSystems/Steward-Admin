export default function NeedleInsightsPage() {
  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Insights</h1>
        <p className="text-sm text-gray-400">Historical intelligence: Margins, Forecasts, and Performance.</p>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
        {/* We will populate DecisionCards here */}
      </div>
    </div>
  );
}
