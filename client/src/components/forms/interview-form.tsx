import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { Interview, Candidate } from "@/lib/api";

const interviewSchema = z.object({
  candidateId: z.string().min(1, "Candidate is required"),
  title: z.string().min(1, "Title is required"),
  scheduledAt: z.date({ required_error: "Date and time is required" }),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  type: z.enum(["technical", "behavioral", "final", "phone"]),
  location: z.string().optional(),
  interviewerEmail: z.string().email("Invalid email address"),
  notes: z.string().optional(),
});

type InterviewFormData = z.infer<typeof interviewSchema>;

interface InterviewFormProps {
  interview?: Interview | null;
  candidates: Candidate[];
  onSubmit: (data: InterviewFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function InterviewForm({ 
  interview, 
  candidates, 
  onSubmit, 
  onCancel, 
  isLoading 
}: InterviewFormProps) {
  const form = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      candidateId: interview?.candidateId || "",
      title: interview?.title || "",
      scheduledAt: interview ? new Date(interview.scheduledAt) : new Date(),
      duration: interview?.duration || 60,
      type: interview?.type as any || "technical",
      location: interview?.location || "",
      interviewerEmail: interview?.interviewerEmail || "",
      notes: interview?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="candidateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Candidate *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="interview-candidate-select">
                      <SelectValue placeholder="Select candidate" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {candidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name} - {candidate.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interview Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Technical Interview - Frontend Developer" {...field} data-testid="interview-title-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date & Time *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="interview-datetime-picker"
                      >
                        {field.value ? (
                          format(field.value, "PPP 'at' p")
                        ) : (
                          <span>Pick a date and time</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Input
                        type="time"
                        value={field.value ? format(field.value, "HH:mm") : ""}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDate = new Date(field.value || new Date());
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                          field.onChange(newDate);
                        }}
                        data-testid="interview-time-input"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="60" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                    data-testid="interview-duration-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interview Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="interview-type-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="phone">Phone Screen</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interviewerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interviewer Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="interviewer@company.com" {...field} data-testid="interview-interviewer-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Conference Room A or https://meet.google.com/xyz" {...field} data-testid="interview-location-input" />
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
                  placeholder="Additional notes or preparation instructions..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  data-testid="interview-notes-input"
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
            data-testid="interview-form-cancel"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            data-testid="interview-form-submit"
          >
            {isLoading ? "Saving..." : interview ? "Update" : "Schedule"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
