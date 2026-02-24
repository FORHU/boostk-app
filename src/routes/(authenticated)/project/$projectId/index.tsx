import { createFileRoute } from "@tanstack/react-router";
import { Clock, MessageSquare, PlusCircle, SmilePlus, Zap } from "lucide-react";

export const Route = createFileRoute("/(authenticated)/project/$projectId/")({
  component: ProjectOverviewComponent,
});

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  statusColor?: "green" | "gray" | "blue" | "orange";
}

function StatCard({ label, value, icon: Icon, statusColor = "gray" }: StatCardProps) {
  const colorMap = {
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    gray: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white flex items-center gap-4 transition-all hover:shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[statusColor]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function ProjectOverviewComponent() {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Live Status" value="Accepting Tickets" icon={Zap} statusColor="green" />
        <StatCard label="Open Tickets" value="12 Active" icon={MessageSquare} statusColor="blue" />
        <StatCard label="Avg. Response" value="14m 22s" icon={Clock} statusColor="gray" />
        <StatCard label="Customer Sat" value="98.2%" icon={SmilePlus} statusColor="orange" />
      </div>

      {/* Empty State / Call to Action */}
      <div className="border border-dashed border-gray-300 rounded-xl p-12 bg-white flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <PlusCircle className="text-gray-400" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No support widget detected</h3>
        <p className="max-w-sm text-sm font-medium text-gray-500 mb-6">
          Connect this project to your website by installing the Zendesk snippet. This will allow you to track tickets
          and chat with users in real-time.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Install Widget
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            View Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
