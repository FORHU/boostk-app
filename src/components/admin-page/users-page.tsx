import { useForm } from "@tanstack/react-form";
import {
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  EllipsisVertical,
  Headset,
  Plus,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
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
type TabType = "all" | "admin" | "agent" | "member" | "history";

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

const MOCK_DEPARTMENTS = ["Customer Support", "Technical", "Billing", "Sales", "Onboarding"];

const ROLE_OPTIONS: { id: RoleType; title: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: "ADMIN",
    title: "Admin",
    desc: "Full access to all settings, user management, and data.",
    icon: <Shield className="h-6 w-6" />,
  },
  {
    id: "AGENT",
    title: "Agent",
    desc: "Can manage tickets and view customer data. Cannot change settings.",
    icon: <Headset className="h-6 w-6" />,
  },
  {
    id: "MEMBER",
    title: "Viewer",
    desc: "Can view tickets and customer data. Cannot edit or change settings.",
    icon: <BookOpen className="h-6 w-6" />,
  },
];

const ROLE_BUTTON_LABELS: Record<RoleType, string> = {
  ADMIN: "Change Role to Admin",
  AGENT: "Change Role to Agent",
  MEMBER: "Change Role to Viewer",
};

export function UsersPage() {
  const [users, setUsers] = useState<UserData[]>(MOCK_USERS);
  const [history, setHistory] = useState<{ id: string; action: string; timestamp: string }[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");

  const logAction = (action: string) => {
    setHistory((prev) => [
      { id: Math.random().toString(36).substr(2, 9), action, timestamp: new Date().toLocaleString() },
      ...prev,
    ]);
  };

  // Edit Role wizard state
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState<UserData | null>(null);
  const [editRoleStep, setEditRoleStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<RoleType>("MEMBER");
  const [agentPermissions, setAgentPermissions] = useState<string[]>(["View Tickets"]);
  const [agentDepartment, setAgentDepartment] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Deactivation Sidebar state
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState<UserData | null>(null);
  const [deactivateConfirmed, setDeactivateConfirmed] = useState(false);

  const handleOpenDeactivate = (user: UserData) => {
    setDeactivateUser(user);
    setDeactivateOpen(true);
    setDeactivateConfirmed(false);
  };

  const confirmDeactivation = () => {
    if (!deactivateUser) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === deactivateUser.id) {
          //TODO: to add api call
          logAction(`{Session admin} deactivated user ${u.name}`);
          return { ...u, status: "INACTIVE" };
        }
        return u;
      }),
    );
    toast.success(`User ${deactivateUser.name} deactivated successfully`);
    setDeactivateOpen(false);
  };

  // Reactivation Sidebar state
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [reactivateUser, setReactivateUser] = useState<UserData | null>(null);

  const handleOpenReactivate = (user: UserData) => {
    setReactivateUser(user);
    setReactivateOpen(true);
  };

  const confirmReactivation = () => {
    if (!reactivateUser) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === reactivateUser.id) {
          logAction(`{Session admin} reactivated user ${u.name}`);
          return { ...u, status: "ACTIVE" };
        }
        return u;
      }),
    );
    toast.success(`User ${reactivateUser.name} reactivated successfully`);
    setReactivateOpen(false);
  };

  const handleOpenEditRole = (user: UserData) => {
    setEditRoleUser(user);
    setEditRoleOpen(true);
    setEditRoleStep(1);
    setSelectedRole(user.role);
    setAgentPermissions(["View Tickets"]);
    setAgentDepartment("");
    setAdminPassword("");
  };

  const createUserForm = useForm({
    defaultValues: { name: "", email: "", role: "MEMBER" as RoleType },
    onSubmit: async ({ value }) => {
      // TODO: Implement user creation backend
      console.log("Creating user:", value);
      toast.success("User invitation sent successfully");
    },
  });

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "admin") return user.role === "ADMIN" && matchesSearch;
    if (activeTab === "agent") return user.role === "AGENT" && matchesSearch;
    if (activeTab === "member") return user.role === "MEMBER" && matchesSearch;

    // Empty logic for role-based tabs as requested
    // TODO: Add backend/role-based filtering soon
    return false;
  });

  const handleToggleStatus = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (user.status === "ACTIVE") {
      handleOpenDeactivate(user);
    } else {
      handleOpenReactivate(user);
    }
  };

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
        return <BookOpen size={14} />;
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
      <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
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
                { id: "history", label: "History" },
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
                autoComplete="off"
                name="user-search-input"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1549e6]/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {activeTab === "history" ? (
            <div className="bg-white border border-gray-200 rounded-[5px] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Audit Logs</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <Shield size={16} />
                        </div>
                        <p className="text-sm font-medium text-gray-700">{item.action}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {item.timestamp}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <p className="text-sm font-medium text-gray-500">No history available yet.</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">
                      Perform administrative actions to see logs here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
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
                            <DropdownMenuItem className="rounded-[5px]" onClick={() => handleOpenEditRole(user)}>
                              <Settings size={14} className="mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <div className="h-px bg-gray-100 my-1" />
                            <DropdownMenuItem
                              className={`rounded-[5px] font-bold ${user.status === "ACTIVE" ? "text-red-600 focus:text-red-700 focus:bg-red-50" : "text-green-600 focus:text-green-700 focus:bg-green-50"}`}
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              <Shield size={14} className="mr-2" />
                              {user.status === "ACTIVE" ? "Deactivate User" : "Activate User"}
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
          )}
        </div>
      </div>
      {/* Edit Role Wizard Sheet */}
      <Sheet open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <SheetContent side="right" className="sm:max-w-md p-0 overflow-y-auto">
          <div className="flex flex-col h-full bg-white">
            <SheetHeader className="p-6 border-b border-gray-100">
              <SheetTitle className="text-xl font-bold">Edit User Role: Step {editRoleStep}</SheetTitle>
              <SheetDescription>Update role and permissions for {editRoleUser?.name}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 p-6 space-y-8">
              <div className="flex items-center justify-center gap-16 relative mb-12">
                <div className="absolute top-4 left-[30%] right-[30%] h-0.5 bg-gray-100 -z-10" />

                {/* Step 1: Role */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      editRoleStep === 1
                        ? "bg-white border-[#1549e6] text-[#1549e6]"
                        : "bg-[#1549e6] border-[#1549e6] text-white"
                    }`}
                  >
                    {editRoleStep === 1 ? 1 : <Check size={14} />}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      editRoleStep === 1 ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    Role
                  </span>
                </div>

                {/* Step 2: Review */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      editRoleStep === 2
                        ? "bg-white border-[#1549e6] text-[#1549e6]"
                        : "bg-white border-gray-200 text-gray-400"
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      editRoleStep === 2 ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    Review
                  </span>
                </div>
              </div>

              {/* Step 1: Role Selection */}
              {editRoleStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Select Role</h3>
                    <p className="text-xs text-gray-500">Choose the level of access for this user.</p>
                  </div>

                  <div className="space-y-4">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={`w-full text-left p-4 rounded-[5px] border-2 transition-all flex items-start gap-4 ${
                          selectedRole === role.id
                            ? "border-[#1549e6] bg-[#1549e6]/5 shadow-md shadow-[#1549e6]/10"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-[5px] ${
                            selectedRole === role.id ? "bg-[#1549e6] text-white" : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          {role.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{role.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{role.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Agent permissions */}
              {editRoleStep === 2 && selectedRole === "AGENT" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Role & Permissions</h3>
                    <p className="text-xs text-gray-500">Customize what this agent can do.</p>
                  </div>

                  <div className="space-y-3">
                    {["View Tickets", "Manage Tickets", "Chat Support"].map((perm) => {
                      const permId = `perm-${perm.replace(/\s+/g, "-").toLowerCase()}`;
                      return (
                        <label
                          key={perm}
                          htmlFor={permId}
                          className="flex items-center gap-3 p-3 rounded-[5px] border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all"
                        >
                          <input
                            id={permId}
                            type="checkbox"
                            checked={agentPermissions.includes(perm)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAgentPermissions([...agentPermissions, perm]);
                              } else {
                                setAgentPermissions(agentPermissions.filter((p) => p !== perm));
                              }
                            }}
                            className="w-4 h-4 rounded-[3px] border-gray-300 text-[#1549e6] focus:ring-[#1549e6]"
                          />
                          <span className="text-sm font-medium text-gray-700">{perm}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="dept-selection"
                      className="text-xs font-bold text-gray-400 uppercase tracking-widest"
                    >
                      Department Assignment
                    </label>
                    <select
                      id="dept-selection"
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1549e6]/20 transition-all"
                      value={agentDepartment}
                      onChange={(e) => setAgentDepartment(e.target.value)}
                    >
                      <option value="">Select a department</option>
                      {MOCK_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-400 italic">
                      Assign the agent to their primary department for ticket routing.
                    </p>
                    {agentDepartment === "" && (
                      <p className="text-[10px] text-red-500 font-bold">Please assign a department</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Admin security */}
              {editRoleStep === 2 && selectedRole === "ADMIN" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Security & Review</h3>
                    <p className="text-xs text-gray-500">Confirm administrative privileges.</p>
                  </div>

                  <div className="p-5 rounded-[5px] border-2 border-amber-100 bg-amber-50/30 space-y-4">
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="admin-password-confirm"
                        className="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                      >
                        Account Password
                      </label>
                      <Input
                        id="admin-password-confirm"
                        type="password"
                        placeholder="Enter your account password to confirm"
                        autoComplete="new-password"
                        className="rounded-[5px] h-10 border-amber-200 focus:ring-amber-500/20"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                      />
                      <p className="text-[10px] text-amber-600 font-medium">
                        This action requires your administrative password for security purposes.
                      </p>
                      {adminPassword === "" && (
                        <p className="text-[10px] text-red-500 font-bold">Password is required to confirm</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Viewer confirmation */}
              {editRoleStep === 2 && selectedRole === "MEMBER" && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <BookOpen size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Review Changes</h3>
                    <p className="text-xs text-gray-500">Updating {editRoleUser?.name} to Viewer role.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <Button
                variant="outline"
                className="flex-1 rounded-[5px] font-bold"
                onClick={() => {
                  if (editRoleStep === 2) {
                    setEditRoleStep(1);
                  } else {
                    setEditRoleOpen(false);
                  }
                }}
              >
                {editRoleStep === 2 ? "Back" : "Cancel"}
              </Button>
              <Button
                className="flex-1 bg-[#1549e6] text-white rounded-[5px] font-bold hover:bg-[#2563eb]"
                disabled={
                  editRoleStep === 2 &&
                  ((selectedRole === "AGENT" && !agentDepartment) || (selectedRole === "ADMIN" && !adminPassword))
                }
                onClick={() => {
                  if (editRoleStep === 1) {
                    setEditRoleStep(2);
                  } else {
                    logAction(`Admin updated ${editRoleUser?.name} role to ${selectedRole}`);
                    toast.success("User role updated successfully");
                    setEditRoleOpen(false);
                  }
                }}
              >
                {editRoleStep === 1 ? "Next" : ROLE_BUTTON_LABELS[selectedRole]}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Deactivation Confirmation Sidebar */}
      <Sheet open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <SheetContent side="right" className="sm:max-w-md p-0 overflow-y-auto">
          <div className="flex flex-col h-full bg-white">
            <SheetHeader className="p-6 border-b border-gray-100 bg-red-50/30">
              <SheetTitle className="text-xl font-bold text-red-600">Deactivate User</SheetTitle>
              <SheetDescription>Review the impact of deactivating {deactivateUser?.name}.</SheetDescription>
            </SheetHeader>

            <div className="flex-1 p-6 space-y-8">
              <div className="p-4 rounded-[5px] bg-red-50 border border-red-100">
                <p className="text-sm text-red-800 font-medium leading-relaxed">
                  Deactivating this user will immediately revoke their access to the system. Their data will be
                  preserved, but they will no longer be able to perform administrative tasks.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Impact of Deactivation</h4>
                <div className="space-y-3">
                  {[
                    "Immediate logout from all active sessions",
                    "Revocation of all API keys and access tokens",
                    "Removal from active ticket assignment queues",
                    "Disabled response capabilities in chat support",
                    "Blocked access to organization settings and reports",
                  ].map((impact) => (
                    <div key={impact} className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                        <Check size={10} strokeWidth={4} />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{impact}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <label className="flex items-center gap-3 p-4 rounded-[5px] border-2 border-red-100 bg-red-50/10 cursor-pointer hover:bg-red-50/30 transition-all">
                  <input
                    type="checkbox"
                    checked={deactivateConfirmed}
                    onChange={(e) => setDeactivateConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded-[3px] border-red-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-bold text-red-700">I understand the consequences of deactivation.</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <Button
                variant="outline"
                className="flex-1 rounded-[5px] font-bold"
                onClick={() => setDeactivateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 text-white rounded-[5px] font-bold hover:bg-red-700 disabled:opacity-50"
                disabled={!deactivateConfirmed}
                onClick={confirmDeactivation}
              >
                Confirm Deactivation
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reactivation Confirmation Sidebar */}
      <Sheet open={reactivateOpen} onOpenChange={setReactivateOpen}>
        <SheetContent side="right" className="sm:max-w-md p-0 overflow-y-auto">
          <div className="flex flex-col h-full bg-white">
            <SheetHeader className="p-6 border-b border-gray-100 bg-green-50/30">
              <SheetTitle className="text-xl font-bold text-green-600">Reactivate User</SheetTitle>
              <SheetDescription>Restore full system access for {reactivateUser?.name}.</SheetDescription>
            </SheetHeader>

            <div className="flex-1 p-6 space-y-8">
              <div className="p-4 rounded-[5px] bg-green-50 border border-green-100">
                <p className="text-sm text-green-800 font-medium leading-relaxed">
                  Reactivating this user will immediately restore their ability to log in and perform their assigned
                  duties. All previously revoked permissions will be re-enabled.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Restored Access</h4>
                <div className="space-y-3">
                  {[
                    "Full login access restored",
                    "API keys and access tokens re-enabled",
                    "Return to ticket assignment queues",
                    "Full response capabilities in chat support",
                    "Access to organization settings and reports",
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                        <Check size={10} strokeWidth={4} />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <Button
                variant="outline"
                className="flex-1 rounded-[5px] font-bold"
                onClick={() => setReactivateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 text-white rounded-[5px] font-bold hover:bg-green-700 transition-all active:scale-95"
                onClick={confirmReactivation}
              >
                Confirm Reactivation
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
