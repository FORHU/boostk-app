"use client";

import { useForm } from "@tanstack/react-form";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFieldInvalid } from "@/lib/form-utils";
import type { TicketWithCustomer } from "@/modules/ticket/ticket.types";
import { type TicketTag, TicketTags } from "./ticket-tags";

const ticketDetailsFormSchema = z.object({
  assignee: z.string().min(1, "Assignee is required"),
  priority: z.string().min(1, "Priority is required"),
  status: z.string().min(1, "Status is required"),
  tags: z.array(z.string()),
});

export function TicketDetails({ ticket }: { ticket: TicketWithCustomer }) {
  const ticketDetailsForm = useForm({
    defaultValues: {
      assignee: "Alex Mercer",
      priority: (ticket.priority as string) || "LOW",
      status: (ticket.status as string) || "OPEN",
      tags: ["Support", "Urgent"] as string[],
    },
    validators: {
      onSubmit: ticketDetailsFormSchema,
    },
    onSubmit: async ({ value }) => {
      console.log("Changes saved:", value);
      toast.success("Ticket details updated", {
        description: (
          <pre className="mt-2 w-[320px] overflow-x-auto rounded-md bg-slate-950 p-4 text-white">
            <code>{JSON.stringify(value, null, 2)}</code>
          </pre>
        ),
      });
    },
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(ticket.id);
    toast.success("Ticket ID copied to clipboard");
  };

  return (
    <Card className="w-full ring-0 border-0 bg-transparent">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Ticket Details</CardTitle>
        <CardDescription>Update ticket details</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <form
          id="ticket-details-form"
          onSubmit={(e) => {
            e.preventDefault();
            ticketDetailsForm.handleSubmit();
          }}
          className="space-y-6"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Ticket ID</FieldLabel>
              <div className="flex items-center justify-between py-1 px-3 border rounded-md bg-muted/30">
                <span className="text-xs font-mono truncate mr-2 text-muted-foreground" title={ticket.id}>
                  {ticket.id}
                </span>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleCopyId} title="Copy Ticket ID">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Field>

            <ticketDetailsForm.Field name="tags">
              {(field) => {
                const isInvalid = getFieldInvalid(field, ticketDetailsForm);
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Tags</FieldLabel>
                    <TicketTags
                      ticketTags={field.state.value as TicketTag[]}
                      onUpdateTags={(tags) => field.handleChange(tags as string[])}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </ticketDetailsForm.Field>

            {/* TODO: change this to be the right value */}
            <ticketDetailsForm.Field name="assignee">
              {(field) => {
                const isInvalid = getFieldInvalid(field, ticketDetailsForm);
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Assigned Agent</FieldLabel>
                    <Select value={field.state.value} readOnly>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Select Assignee</SelectLabel>
                          {["Alex Mercer", "Support Josie"].map((assignee) => (
                            <SelectItem key={assignee} value={assignee}>
                              {assignee}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </ticketDetailsForm.Field>

            <ticketDetailsForm.Field name="priority">
              {(field) => {
                const isInvalid = getFieldInvalid(field, ticketDetailsForm);
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Priority</FieldLabel>
                    <Select value={field.state.value} onValueChange={field.handleChange}>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Select Priority</SelectLabel>
                          {["LOW", "NORMAL", "HIGH"].map((priority) => (
                            <SelectItem key={priority} value={priority} className="capitalize">
                              {priority.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </ticketDetailsForm.Field>

            <ticketDetailsForm.Field name="status">
              {(field) => {
                const isInvalid = getFieldInvalid(field, ticketDetailsForm);
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Current Status</FieldLabel>
                    <Select value={field.state.value} onValueChange={field.handleChange}>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Select Status</SelectLabel>
                          {["OPEN", "CLOSED"].map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">
                              {status.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </ticketDetailsForm.Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex gap-2 bg-transparent border-0">
        <Button type="button" variant="outline" onClick={() => ticketDetailsForm.reset()} className="flex-1">
          Reset
        </Button>
        <Button type="submit" form="ticket-details-form" className="flex-1">
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}
