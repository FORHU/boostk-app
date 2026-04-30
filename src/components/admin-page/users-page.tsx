import { useForm } from "@tanstack/react-form";
import { ChevronDown, Copy, EllipsisVertical, Headset, Plus, Search, Settings, Shield, User } from "lucide-react";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getFieldInvalid } from "@/lib/form-utils";

type RoleType = "ADMIN" | "AGENT" | "MEMBER";
type TabType = "all" | "admin" | "agent" | "member";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  status: "ACTIVE" | "INACTIVE";
  org?: string;
  joined: string;
  lastActive?: string;
}

const MOCK_USERS: UserData[] = [
  {
    id: "user_1",
    name: "Alice Admin",
    email: "alice@acme.com",
    role: "ADMIN",
    status: "ACTIVE",
    org: "Acme Corp",
    joined: "12 Mar 26",
  },
  {
    id: "user_2",
    name: "Bob Builder",
    email: "bob@buildit.com",
    role: "ADMIN",
    status: "ACTIVE",
    org: "BuildIt LLC",
    joined: "15 Mar 26",
  },
  { id: "mem_1", name: "John Doe", email: "john@acme.com", role: "MEMBER", status: "ACTIVE", joined: "10 Apr 26" },
  { id: "mem_2", name: "Jane Smith", email: "jane@acme.com", role: "MEMBER", status: "INACTIVE", joined: "11 Apr 26" },
  {
    id: "agent_1",
    name: "Support Sam",
    email: "sam@boostk.com",
    role: "AGENT",
    status: "ACTIVE",
    lastActive: "5 mins ago",
    joined: "01 Jan 26",
  },
  {
    id: "agent_2",
    name: "Agent Alex",
    email: "alex@boostk.com",
    role: "AGENT",
    status: "ACTIVE",
    lastActive: "2 hours ago",
    joined: "05 Jan 26",
  },
];

export function UsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");

  const createUserForm = useForm({
    defaultValues: { name: "", email: "", role: "MEMBER" as RoleType },
    onSubmit: async ({ value }) => {
      // TODO: Implement user creation backend
      console.log("Creating user:", value);
      toast.success("User invitation sent successfully");
    },
  });

  const filteredUsers = MOCK_USERS.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());

    if (activeTab === "all") return matchesSearch;

    // Empty logic for role-based tabs as requested
    // TODO: Add backend/role-based filtering soon
    return false;
  });

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("User ID copied to clipboard");
  };

  const getRoleIcon = (role: RoleType) => {
    switch (role) {
      case "ADMIN":
        return <Shield size={14} />;
      case "AGENT":
        return <Headset size={14} />;
      case "MEMBER":
        return <User size={14} />;
    }
  };

  const getRoleColor = (role: RoleType) => {
    switch (role) {
      case "ADMIN":
        return "text-blue-600 bg-blue-50";
      case "AGENT":
        return "text-teal-600 bg-teal-50";
      case "MEMBER":
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="w-full">
      <Toaster position="top-center" expand={true} richColors />

      <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Users Management</h2>
            <p className="text-muted-foreground">Control access levels and manage system users across your platform.</p>
          </div>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#1549e6] text-white rounded-[5px] shadow-sm transition-all hover:bg-[#2563eb] active:scale-95 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    Add User
                  </button>
                }
              />
              <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Add New User</SheetTitle>
                  <SheetDescription>Invite a new user to join your organization or support team.</SheetDescription>
                </SheetHeader>
                <div className="p-4 h-full flex flex-col">
                  <form
                    className="space-y-6 pt-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await createUserForm.handleSubmit();
                    }}
                  >
                    <createUserForm.Field name="name">
                      {(field) => {
                        const isInvalid = getFieldInvalid(field, createUserForm);
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              aria-invalid={isInvalid}
                              placeholder="e.g. John Doe"
                              className="rounded-[5px]"
                            />
                            <FieldError />
                          </Field>
                        );
                      }}
                    </createUserForm.Field>

                    <createUserForm.Field name="email">
                      {(field) => {
                        const isInvalid = getFieldInvalid(field, createUserForm);
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              type="email"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              aria-invalid={isInvalid}
                              placeholder="john@example.com"
                              className="rounded-[5px]"
                            />
                            <FieldError />
                          </Field>
                        );
                      }}
                    </createUserForm.Field>

                    <div className="flex gap-4 pt-4">
                      <Button type="submit" className="flex-1 bg-[#1549e6] text-white rounded-[5px] hover:bg-[#2563eb]">
                        Send Invitation
                      </Button>
                    </div>
                  </form>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-gray-200/50 rounded-[5px] w-fit">
              {[
                { id: "all", label: "All Users" },
                { id: "admin", label: "Admin" },
                { id: "agent", label: "Agent" },
                { id: "member", label: "Member" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[5px] transition-all ${
                    activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1549e6]/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-[5px] shadow-sm overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-12 items-center px-6 py-3 bg-gray-50/50 border-b border-gray-100">
              <div className="col-span-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                User / Role <ChevronDown size={10} className="text-gray-300" />
              </div>
              <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Status
              </div>
              <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Email
              </div>
              <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                Joined <ChevronDown size={10} className="rotate-180 text-gray-300" />
              </div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-12 items-center px-6 py-5 hover:bg-gray-50/50 transition-all cursor-pointer group"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-[5px] flex items-center justify-center ${getRoleColor(user.role)}`}
                      >
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#1549e6] transition-colors">
                          {user.name}
                        </h3>
                        <span className="text-[10px] text-gray-400 font-medium mt-0.5 truncate uppercase tracking-wider">
                          {user.role} {user.org ? `• ${user.org}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                          user.status === "ACTIVE"
                            ? "bg-green-50 border-green-100 text-green-600"
                            : "bg-gray-50 border-gray-100 text-gray-500"
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>

                    <div className="col-span-3 text-center text-xs text-gray-500 font-medium truncate px-4">
                      {user.email}
                    </div>

                    <div className="col-span-2 text-center text-[11px] text-gray-500 font-medium">{user.joined}</div>

                    <div className="col-span-1 flex justify-end relative">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              type="button"
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-[5px] hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                            >
                              <EllipsisVertical size={18} />
                            </button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-40 rounded-[5px]">
                          <DropdownMenuItem className="rounded-[5px]" onClick={() => handleCopyId(user.id)}>
                            <Copy size={14} className="mr-2" />
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-[5px]">
                            <Settings size={14} className="mr-2" />
                            Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                    <Search size={24} />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No users found for this role.</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">
                    Logic for this role will be added soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
