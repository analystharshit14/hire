import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight, User, MapPin } from "lucide-react";
import Header from "@/components/layout/header";
import InterviewForm from "@/components/forms/interview-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { interviewApi, candidateApi, queryClient } from "@/lib/api";
import type { Interview, Candidate } from "@/lib/api";

export default function Scheduling() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
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

  const getCandidateName = (candidateId: string) => {
    const candidate = candidates?.find(c => c.id === candidateId);
    return candidate?.name || 'Unknown Candidate';
  };

  const getInterviewsForDate = (date: Date) => {
    return interviews?.filter(interview =>
      isSameDay(parseISO(interview.scheduledAt), date)
    ) || [];
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

  // Calendar view helpers
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToPreviousWeek = () => {
    setSelectedDate(addDays(selectedDate, -7));
  };

  const goToNextWeek = () => {
    setSelectedDate(addDays(selectedDate, 7));
  };

  const todaysInterviews = getInterviewsForDate(new Date());
  const upcomingInterviews = interviews?.filter(interview => {
    const interviewDate = parseISO(interview.scheduledAt);
    return interviewDate > new Date() && interview.status === 'scheduled';
  }).sort((a, b) => parseISO(a.scheduledAt).getTime() - parseISO(b.scheduledAt).getTime()) || [];

  return (
    <>
      <Header
        title="Scheduling"
        description="Manage interview schedules and calendar view."
        onNewAction={handleNewInterview}
        newActionLabel="Schedule Interview"
      />
      
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
              data-testid="calendar-view-button"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              data-testid="list-view-button"
            >
              List View
            </Button>
          </div>

          {viewMode === "calendar" && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-4">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {viewMode === "calendar" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-3">
              <Card data-testid="calendar-view">
                <CardHeader>
                  <CardTitle>Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-4">
                    {weekDays.map((day) => (
                      <div
                        key={day.toISOString()}
                        className="min-h-32 border rounded-lg p-2 bg-background"
                        data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                      >
                        <div className="font-medium text-sm mb-2">
                          {format(day, 'EEE d')}
                        </div>
                        <div className="space-y-1">
                          {getInterviewsForDate(day).map((interview) => (
                            <div
                              key={interview.id}
                              className="text-xs p-1 rounded bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                              onClick={() => handleEditInterview(interview)}
                              data-testid={`calendar-interview-${interview.id}`}
                            >
                              <div className="font-medium truncate">
                                {format(parseISO(interview.scheduledAt), 'HH:mm')}
                              </div>
                              <div className="truncate">
                                {getCandidateName(interview.candidateId)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mini Calendar & Today's Schedule */}
            <div className="space-y-6">
              {/* Mini Calendar */}
              <Card data-testid="mini-calendar">
                <CardHeader>
                  <CardTitle className="text-base">Calendar</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border-0"
                  />
                </CardContent>
              </Card>

              {/* Today's Schedule */}
              <Card data-testid="todays-schedule">
                <CardHeader>
                  <CardTitle className="text-base">Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {todaysInterviews.length > 0 ? (
                    <div className="space-y-3">
                      {todaysInterviews.map((interview) => (
                        <div
                          key={interview.id}
                          className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50"
                          onClick={() => handleEditInterview(interview)}
                          data-testid={`today-interview-${interview.id}`}
                        >
                          <div className="w-2 h-8 bg-primary rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {getCandidateName(interview.candidateId)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {interview.type} • {interview.duration}min
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(interview.scheduledAt), 'h:mm a')}
                            </p>
                          </div>
                          <Badge className={getStatusColor(interview.status)}>
                            {interview.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No interviews today</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Interviews */}
            <Card className="lg:col-span-2" data-testid="upcoming-interviews-list">
              <CardHeader>
                <CardTitle>Upcoming Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-12 h-12 rounded-full bg-muted"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-24 mb-1"></div>
                          <div className="h-3 bg-muted rounded w-20"></div>
                        </div>
                        <div className="h-6 bg-muted rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : upcomingInterviews.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingInterviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleEditInterview(interview)}
                        data-testid={`upcoming-interview-${interview.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">
                              {getCandidateName(interview.candidateId)}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {interview.type} • {interview.title}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{format(parseISO(interview.scheduledAt), 'MMM d, yyyy h:mm a')}</span>
                              <span>({interview.duration} min)</span>
                            </div>
                            {interview.location && (
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{interview.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(interview.status)}>
                          {interview.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
                    <p>No upcoming interviews</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats & Actions */}
            <div className="space-y-6">
              <Card data-testid="schedule-stats">
                <CardHeader>
                  <CardTitle className="text-base">Schedule Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Today</span>
                    <span className="font-medium">{todaysInterviews.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">This Week</span>
                    <span className="font-medium">
                      {interviews?.filter(i => {
                        const date = parseISO(i.scheduledAt);
                        return date >= weekStart && date <= weekEnd;
                      }).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Upcoming</span>
                    <span className="font-medium">{upcomingInterviews.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="quick-schedule-actions">
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    onClick={handleNewInterview}
                    data-testid="quick-schedule-interview"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setViewMode("calendar")}
                    data-testid="view-calendar-button"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    View Calendar
                  </Button>
                </CardContent>
              </Card>
            </div>
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
