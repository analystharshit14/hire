import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Candidate } from "@/lib/api";

const candidateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  experience: z.number().min(0, "Experience must be 0 or greater").optional(),
  skills: z.array(z.string()).default([]),
  resume: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "hired", "rejected", "withdrawn"]).default("active"),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

interface CandidateFormProps {
  candidate?: Candidate | null;
  onSubmit: (data: CandidateFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CandidateForm({ candidate, onSubmit, onCancel, isLoading }: CandidateFormProps) {
  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: candidate?.name || "",
      email: candidate?.email || "",
      phone: candidate?.phone || "",
      position: candidate?.position || "",
      experience: candidate?.experience || 0,
      skills: candidate?.skills || [],
      resume: candidate?.resume || "",
      notes: candidate?.notes || "",
      status: candidate?.status as any || "active",
    },
  });

  const handleSkillsChange = (skillsString: string) => {
    const skills = skillsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
    form.setValue('skills', skills);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} data-testid="candidate-name-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} data-testid="candidate-email-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} data-testid="candidate-phone-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position *</FormLabel>
                <FormControl>
                  <Input placeholder="Software Engineer" {...field} data-testid="candidate-position-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Experience</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="5" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="candidate-experience-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="candidate-status-select">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <FormControl>
                <Input 
                  placeholder="JavaScript, React, Node.js (comma separated)"
                  value={field.value.join(', ')}
                  onChange={(e) => handleSkillsChange(e.target.value)}
                  data-testid="candidate-skills-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resume"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resume URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/resume.pdf" {...field} data-testid="candidate-resume-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes about the candidate..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  data-testid="candidate-notes-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="candidate-form-cancel"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            data-testid="candidate-form-submit"
          >
            {isLoading ? "Saving..." : candidate ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
