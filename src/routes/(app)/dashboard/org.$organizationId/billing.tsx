import { createFileRoute, redirect } from "@tanstack/react-router";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { useState } from "react";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/billing")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: OrganizationBillingPage,
});

function OrganizationBillingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
  <div className="h-screen overflow-y-auto">  
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 bg-background text-foreground">
        <section className="border-b border-border">
          <div className="flex space-x-6 text-sm font-medium">
            <button className="pb-3 text-primary border-b-2 border-primary">
              Billing
            </button>
            <button className="pb-3 text-muted-foreground hover:text-foreground transition-colors">
              Billing Details
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <h2 className="text-xl font-bold font-heading">Subscribe to your plan</h2>
            <span className={!isAnnual ? "text-primary font-bold" : "text-muted-foreground"}>Monthly</span>
            <div className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${
              isAnnual ? "bg-primary" : "bg-muted-foreground/30"}`}onClick={() => setIsAnnual(!isAnnual)}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  isAnnual ? "translate-x-5" : "translate-x-0"}`}>
              </div>
            </div>

            <span className={isAnnual ? "text-primary font-bold" : "text-muted-foreground"}> Annual 
              <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded ml-1">10% OFF</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            {/* Current use*/}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md  flex flex-col relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">Free</h3>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Essential basic sharing tools.</p>  
              <button className="w-full bg-muted text-muted-foreground font-medium py-2 mb-6">
                Current Plan
              </button>
              
              <ul className="space-y-3 text-sm text-foreground/80 flex-1">
                {['Image and document file uploads', 'Message delivery status indicators'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Starter Plan */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md  flex flex-col">
              <h3 className="font-semibold text-lg">Starter</h3>
              <div className="mt-2 mb-1">
                <span className="text-2xl font-bold">$149</span>
                <span className="text-muted-foreground text-sm"> / month</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Real-time messaging capabilities.</p>             
              <button className="w-full bg-primary text-primary-foreground font-medium py-2 mb-6">
                Subscribe
              </button>
              
              <ul className="space-y-3 text-sm text-foreground/80 flex-1">
                {['Real-time customer messaging', 'Image and document file uploads', 'Message delivery status indicators'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Explorer Plan (Highlighted) */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">Explorer</h3>
                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Popular</span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold">$349</span>
                <span className="text-muted-foreground text-sm"> / month</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Team and customer management.</p>
              <button className="w-full bg-primary text-primary-foreground font-medium py-2 mb-6">
                Subscribe
              </button>
              
              <ul className="space-y-3 text-sm text-foreground/80 flex-1">
                {['Real-time customer messaging', 'Image and document file uploads', 'Message delivery status indicators','Role based access control','Categorized quick response templates','Basic customer management panel'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md  flex flex-col">
              <h3 className="font-semibold text-lg">Pro</h3>
              <div className="mt-2 mb-1">
                <span className="text-2xl font-bold">$800</span>
                <span className="text-muted-foreground text-sm"> / month</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Advanced global support suite.</p>              
              <button className="w-full bg-primary text-primary-foreground font-medium py-2 transition-opacity mb-6">
                Subscribe
              </button>
                
              <ul className="space-y-3 text-sm text-foreground/80 flex-1">
                {['Real-time customer messaging', 'Image and document file uploads',
                'Message delivery status indicators','Role based access control',
                'Categorized quick response templates','Basic customer management panel',
                'Real-time AI language translation','Advanced Customer 360 view','CSV and PDF analytics exports'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>
      </div>
  </div>
);}