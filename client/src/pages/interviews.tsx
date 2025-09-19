import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, User, Video } from "lucide-react";
import Header from "@/components/layout/header";
import InterviewForm from "@/components/forms/interview-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { interviewApi, candidateApi, queryClient } from "@/lib/api";
import type { Interview, Candidate } from "@/lib/api";

export default function Interviews() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const { toast } = useToast();

  const { data: interviews, isLoading } = useQuery<Interview[]>({
    queryKey: [interviewApi.getAll()],
  });

  const { data: candidates } = useQuery<Candidate[]>({
    queryKey: [candidateApi.getAll()],
  });

  const createMutation = useMutation({
    mutationFn: interviewApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interviews'] });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Interview scheduled successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Interview>) =>
      interviewApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interviews'] });
      setShowForm(false);
      setSelectedInterview(null);
      toast({
        title: "Success",
        description: "Interview updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNewInterview = () => {
    setSelectedInterview(null);
    setShowForm(true);
  };

  const handleEditInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowForm(true);
  };

  const handleSubmit = (data: any) => {
    if (selectedInterview) {
      updateMutation.mutate({ id: selectedInterview.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'status-scheduled';
      case 'completed':
        return 'status-completed';
      case 'in_progress':
        return 'status-in_progress';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const getCandidateName = (candidateId: string) => {
    const candidate = candidates?.find(c => c.id === candidateId);
    return candidate?.name || 'Unknown Candidate';
  };

  const filteredInterviews = interviews?.filter(interview =>
    !search || 
    interview.title.toLowerCase().includes(search.toLowerCase()) ||
    getCandidateName(interview.candidateId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header
        title="Interviews"
        description="Schedule and manage candidate interviews."
        onSearch={setSearch}
        onNewAction={handleNewInterview}
        newActionLabel="Schedule Interview"
      />
      
      <main className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredInterviews && filteredInterviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInterviews.map((interview) => (
              <Card 
                key={interview.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEditInterview(interview)}
                data-testid={`interview-card-${interview.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg" data-testid={`interview-title-${interview.id}`}>
                      {interview.title}
                    </CardTitle>
                    <Badge className={getStatusColor(interview.status)} data-testid={`interview-status-${interview.id}`}>
                      {interview.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span data-testid={`interview-candidate-${interview.id}`}>
                      {getCandidateName(interview.candidateId)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span data-testid={`interview-date-${interview.id}`}>
                      {format(new Date(interview.scheduledAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span data-testid={`interview-time-${interview.id}`}>
                      {format(new Date(interview.scheduledAt), 'h:mm a')} ({interview.duration} min)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {interview.type}
                    </Badge>
                  </div>
                  
                  {interview.location && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate" data-testid={`interview-location-${interview.id}`}>
                        {interview.location}
                      </span>
                    </div>
                  )}
                  
                  {interview.status === 'scheduled' && (
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Start interview functionality
                        }}
                        data-testid={`start-interview-${interview.id}`}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Start Interview
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No interviews found</h3>
            <p className="text-muted-foreground mb-6">
              {search ? `No interviews match "${search}"` : "Get started by scheduling your first interview."}
            </p>
            <Button onClick={handleNewInterview} data-testid="schedule-first-interview">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Interview
            </Button>
          </div>
        )}
      </main>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInterview ? 'Edit Interview' : 'Schedule Interview'}
            </DialogTitle>
          </DialogHeader>
          <InterviewForm
            interview={selectedInterview}
            candidates={candidates || []}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
