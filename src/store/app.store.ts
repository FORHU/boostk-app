import { create } from "zustand";

interface Project {
  id: string;
  name: string;
  apiKey: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  userAuth: any | null; // Replace 'any' with your actual user type if available
  selectedOrganization: string | null;
  selectedProject: Project | null;
  setUserAuth: (user: any | null) => void;
  setSelectedOrganization: (orgId: string | null) => void;
  setSelectedProject: (project: Project | null) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  userAuth: null,
  selectedOrganization: null,
  selectedProject: null,
  setUserAuth: (user) => set({ userAuth: user }),
  setSelectedOrganization: (orgId) => set({ selectedOrganization: orgId }),
  setSelectedProject: (project) => set({ selectedProject: project }),
}));
