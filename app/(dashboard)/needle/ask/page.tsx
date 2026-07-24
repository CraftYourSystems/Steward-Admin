export default function NeedleAskPage() {
  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Ask Needle</h1>
        <p className="text-sm text-gray-400">Chat with the operational system of your restaurant.</p>
      </div>
      <div className="flex-1 flex items-center justify-center border border-white/10 rounded-xl bg-black">
        {/* Chat UI goes here */}
        <p className="text-gray-500">How can I help you run Steward today?</p>
      </div>
    </div>
  );
}
