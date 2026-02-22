import { createFileRoute } from "@tanstack/react-router";
import { Box, CheckCircle2, Database, GitBranch } from "lucide-react";

export const Route = createFileRoute("/(authenticated)/project/$projectId/")({
  component: ProjectOverviewComponent,
});

function ProjectOverviewComponent() {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#ecfdf5] flex items-center justify-center text-[#10b981]">
            <CheckCircle2 size={20} className="fill-[#10b981] text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">STATUS</p>
            <p className="text-sm font-semibold text-gray-900">Healthy</p>
          </div>
        </div>

        {/* Migrations */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
            <Database size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">LAST MIGRATION</p>
            <p className="text-sm font-semibold text-gray-900">No migrations</p>
          </div>
        </div>

        {/* Backups */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
            <Box size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">LAST BACKUP</p>
            <p className="text-sm font-semibold text-gray-900">No backups</p>
          </div>
        </div>

        {/* Branches */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
            <GitBranch size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">RECENT BRANCH</p>
            <p className="text-sm font-semibold text-gray-900">No branches</p>
          </div>
        </div>
      </div>

      {/* Empty State / Call to Action */}
      <div className="border border-dashed border-gray-300 rounded-xl p-12 bg-white flex flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-gray-600 mb-6">
          Ready to deploy? Connect your repository to get started.
        </p>
        <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          Connect Repository
        </button>
      </div>
    </div>
  );
}
