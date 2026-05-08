import { Download, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TabType = "details" | "data";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [orgName, setOrgName] = useState("Boostk");
  const [tempOrgName, setTempOrgName] = useState("Boostk");

  const handleEdit = () => {
    setTempOrgName(orgName);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setOrgName(tempOrgName);
      toast.success("Organization settings updated.");
      setIsSaving(false);
      setIsEditing(false);
    }, 1000);
  };

  const handleExport = () => {
    setIsExporting(true);
    toast.info("Preparing full system export...");
    setTimeout(() => {
      toast.success("System-wide export complete! Your download should start shortly.");
      setIsExporting(false);
    }, 2000);
  };

  return (
    <div className="w-full">
      <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Admin Settings</h2>
            <p className="text-muted-foreground">Global configuration and platform preferences.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-gray-200/50 rounded-[5px] w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[5px] transition-all ${
              activeTab === "details" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Organization Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[5px] transition-all ${
              activeTab === "data" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Data Management
          </button>
        </div>

        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === "details" && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal">General Information</h2>
              <Card className="rounded-[5px] border-border overflow-hidden shadow-none">
                <form onSubmit={handleSave}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border-b border-border">
                      <div className="space-y-1">
                        <p className="text-base font-medium">Organization name</p>
                        <p className="text-sm text-muted-foreground">The public name of your platform.</p>
                      </div>
                      <div className="md:max-w-[400px] w-full">
                        {isEditing ? (
                          <Input
                            value={tempOrgName}
                            onChange={(e) => setTempOrgName(e.target.value)}
                            placeholder="e.g. Boostk"
                            className="rounded-[5px]"
                          />
                        ) : (
                          <p className="text-base font-medium text-gray-900">{orgName}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-6">
                      <div className="space-y-1">
                        <p className="text-base font-medium">System Logo</p>
                        <p className="text-sm text-muted-foreground">Used for emails and dashboards.</p>
                      </div>
                      <div className="md:max-w-[400px] w-full">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col gap-2">
                            {isEditing && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  type="button"
                                  className="rounded-[5px] font-medium text-xs h-8 border-border"
                                >
                                  <Upload size={14} className="mr-2" /> Upload Logo
                                </Button>
                              </div>
                            )}
                            <p className="text-[11px] text-muted-foreground leading-tight">
                              SVG or PNG recommended. Max 2MB.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="justify-end py-4 px-6 bg-muted/10 border-t border-border gap-3">
                    {isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={handleCancel}
                          className="rounded-[5px] font-medium text-xs h-9 px-6 text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSaving || !tempOrgName.trim()}
                          className="bg-[#1549e6] text-white hover:bg-[#2563eb] rounded-[5px] font-normal h-9 px-6 shadow-none"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              Saving...
                            </>
                          ) : (
                            "Save changes"
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={handleEdit}
                        className="rounded-[5px] font-medium text-xs h-9 px-6 border-border"
                      >
                        Edit details
                      </Button>
                    )}
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal">Maintenance & Exports</h2>
              <Card className="rounded-[5px] border-border overflow-hidden shadow-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-muted/50">
                      <Download className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Export all system data</p>
                      <p className="text-[13px] text-muted-foreground">
                        Download a full backup of all organizations, users, and tickets.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                    className="h-9 px-6 rounded-[5px] font-medium whitespace-nowrap"
                  >
                    {isExporting ? "Exporting..." : "Export all data"}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
