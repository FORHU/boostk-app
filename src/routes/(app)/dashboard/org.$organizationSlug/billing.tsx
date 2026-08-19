import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationSlug/billing")({
  // Billing was the only org admin page without this guard — teams, settings, usage and
  // integrations all had it. Any member, including an agent, could open it and act on
  // plans. `role` is resolved once by the parent org route.
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: OrganizationBillingPage,
});

// Define the Plan types
interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  isPopular?: boolean;
  features: string[];
}

// Extract plans into a configuration array
const PLAN_CONFIG: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Essential basic sharing tools.",
    features: ["Image and document file uploads", "Message delivery status indicators"],
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 149,
    annualPrice: 1699,
    description: "Real-time messaging capabilities.",
    features: ["Real-time customer messaging", "Image and document file uploads", "Message delivery status indicators"],
  },
  {
    id: "explorer",
    name: "Explorer",
    monthlyPrice: 349,
    annualPrice: 3999,
    description: "Team and customer management.",
    isPopular: true,
    features: [
      "Real-time customer messaging",
      "Image and document file uploads",
      "Message delivery status indicators",
      "Role based access control",
      "Categorized quick response templates",
      "Basic customer management panel",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 800,
    annualPrice: 9499,
    description: "Advanced global support suite.",
    features: [
      "Real-time customer messaging",
      "Image and document file uploads",
      "Message delivery status indicators",
      "Role based access control",
      "Categorized quick response templates",
      "Basic customer management panel",
      "Real-time AI language translation",
      "Advanced Customer 360 view",
      "CSV and PDF analytics exports",
    ],
  },
];

const DEFAULT_PLAN_ID = "free";

function getCurrentPlanId(organization: { metadata?: string | null } | undefined): string {
  if (!organization?.metadata) return DEFAULT_PLAN_ID;
  try {
    const parsed = JSON.parse(organization.metadata) as { plan?: string };
    return parsed.plan && PLAN_CONFIG.some((p) => p.id === parsed.plan) ? parsed.plan : DEFAULT_PLAN_ID;
  } catch {
    return DEFAULT_PLAN_ID;
  }
}

function OrganizationBillingPage() {
  const { organization } = Route.useRouteContext();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const currentPlanId = getCurrentPlanId(organization);

  return (
    <div className="h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 bg-background text-foreground">
        <section className="border-b border-border">
          <div className="flex space-x-6 text-sm font-medium">
            <button type="button" className="pb-3 text-primary border-b-2 border-primary">
              Billing
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <h2 className="text-xl font-bold font-heading">Subscribe to your plan</h2>
            <span className={!isAnnual ? "text-primary font-bold" : "text-muted-foreground"}>Monthly</span>
            <button
              type="button"
              role="switch"
              aria-checked={isAnnual}
              aria-label="Toggle annual billing"
              className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                isAnnual ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  isAnnual ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className={isAnnual ? "text-primary font-bold" : "text-muted-foreground"}>Annually</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {PLAN_CONFIG.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              return (
                <div
                  key={plan.id}
                  className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col relative"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    {plan.isPopular && (
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="mb-1">
                    <span className="text-2xl font-bold">${isAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                    <span className="text-muted-foreground text-sm">
                      {plan.monthlyPrice === 0 ? " / forever" : isAnnual ? " / year" : " / month"}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mb-6">{plan.description}</p>

                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full bg-muted text-muted-foreground font-medium py-2 mb-6 cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className="w-full bg-primary text-primary-foreground font-medium py-2 mb-6 transition-opacity"
                    >
                      Subscribe
                    </button>
                  )}

                  <ul className="space-y-3 text-sm text-foreground/80 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <svg
                          aria-hidden="true"
                          className="w-4 h-4 text-primary mt-0.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {selectedPlan && (
        <ConfirmDialog
          isOpen
          onClose={() => setSelectedPlan(null)}
          title={`Subscribe to ${selectedPlan.name}`}
          message={
            <>
              You're about to subscribe to the <strong>{selectedPlan.name}</strong> plan for{" "}
              <strong>
                {isAnnual ? `$${selectedPlan.annualPrice} / year` : `$${selectedPlan.monthlyPrice} / month`}
              </strong>
              . Self-serve checkout isn't available yet, so our sales team will reach out to finalize your subscription.
            </>
          }
          confirmLabel="Contact Sales"
          cancelLabel="Cancel"
          onConfirm={() => {
            setSelectedPlan(null);
            toast("Our sales team will reach out to you soon.", "info");
          }}
        />
      )}
    </div>
  );
}
