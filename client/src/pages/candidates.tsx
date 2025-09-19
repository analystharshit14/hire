import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Header from "@/components/layout/header";
import CandidateForm from "@/components/forms/candidate-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { candidateApi, queryClient } from "@/lib/api";
import type { Candidate } from "@/lib/api";

export default function Candidates() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const { toast } = useToast();

  const { data: candidates, isLoading } = useQuery<Candidate[]>({
    queryKey: [candidateApi.getAll({ search: search || undefined })],
  });

  const createMutation = useMutation({
    mutationFn: candidateApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Candidate created successfully",
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
    mutationFn: ({ id, ...data }: { id: string } & Partial<Candidate>) =>
      candidateApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      setShowForm(false);
      setSelectedCandidate(null);
      toast({
        title: "Success",
        description: "Candidate updated successfully",
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

  const handleNewCandidate = () => {
    setSelectedCandidate(null);
    setShowForm(true);
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowForm(true);
  };

  const handleSubmit = (data: any) => {
    if (selectedCandidate) {
      updateMutation.mutate({ id: selectedCandidate.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'hired':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  return (
    <>
      <Header
        title="Candidates"
        description="Manage candidate profiles and track their interview progress."
        onSearch={setSearch}
        onNewAction={handleNewCandidate}
        newActionLabel="New Candidate"
      />
      
      <main className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : candidates && candidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <Card 
                key={candidate.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEditCandidate(candidate)}
                data-testid={`candidate-card-${candidate.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-medium" data-testid={`candidate-initials-${candidate.id}`}>
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1" data-testid={`candidate-name-${candidate.id}`}>
                        {candidate.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1" data-testid={`candidate-position-${candidate.id}`}>
                        {candidate.position}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`candidate-email-${candidate.id}`}>
                        {candidate.email}
                      </p>
                      {candidate.experience && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {candidate.experience} years experience
                        </p>
                      )}
                      <Badge 
                        className={getStatusColor(candidate.status)}
                        data-testid={`candidate-status-${candidate.id}`}
                      >
                        {candidate.status}
                      </Badge>
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.skills.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{candidate.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No candidates found</h3>
            <p className="text-muted-foreground mb-6">
              {search ? `No candidates match "${search}"` : "Get started by adding your first candidate."}
            </p>
            <Button onClick={handleNewCandidate} data-testid="add-first-candidate">
              <Plus className="w-4 h-4 mr-2" />
              Add Candidate
            </Button>
          </div>
        )}
      </main>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCandidate ? 'Edit Candidate' : 'New Candidate'}
            </DialogTitle>
          </DialogHeader>
          <CandidateForm
            candidate={selectedCandidate}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
