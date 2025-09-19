import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Star, Calendar, Users, TrendingUp, Video, BarChart3 } from "lucide-react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsApi, interviewApi, candidateApi } from "@/lib/api";
import type { Metrics, Interview, Candidate } from "@/lib/api";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: [analyticsApi.getMetrics()],
  });

  const { data: recentInterviews, isLoading: interviewsLoading } = useQuery<Interview[]>({
    queryKey: [interviewApi.getAll()],
  });

  const { data: upcomingInterviews, isLoading: upcomingLoading } = useQuery<Interview[]>({
    queryKey: [interviewApi.getUpcoming(format(new Date(), 'yyyy-MM-dd'))],
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'scheduled':
        return 'status-scheduled';
      case 'in_progress':
        return 'status-in_progress';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const handleNewInterview = () => {
    // Navigate to interview creation or open modal
    console.log("Creating new interview");
  };

  return (
    <>
      <Header
        title="Dashboard"
        description="Welcome back, Sarah. Here's your interview overview."
        onNewAction={handleNewInterview}
        newActionLabel="New Interview"
      />
      
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="metric-total-interviews">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Interviews</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="total-interviews-count">
                      {metrics?.totalInterviews || 0}
                    </p>
                  )}
                  <p className="text-sm text-emerald-600">+12% from last month</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="metric-active-candidates">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Candidates</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="active-candidates-count">
                      {metrics?.activeCandidates || 0}
                    </p>
                  )}
                  <p className="text-sm text-emerald-600">+8% from last week</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="metric-weekly-interviews">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="weekly-interviews-count">
                      {metrics?.weeklyInterviews || 0}
                    </p>
                  )}
                  <p className="text-sm text-amber-600">3 scheduled today</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="metric-average-score">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Score</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="average-score">
                      {metrics?.averageScore || 0}
                    </p>
                  )}
                  <p className="text-sm text-emerald-600">+0.4 improvement</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Interviews */}
          <Card className="lg:col-span-2" data-testid="recent-interviews">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Interviews</CardTitle>
                <Button variant="ghost" size="sm" data-testid="view-all-interviews">
                  View all
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {interviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : recentInterviews && recentInterviews.length > 0 ? (
                <div className="space-y-4">
                  {recentInterviews.slice(0, 3).map((interview) => (
                    <div 
                      key={interview.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      data-testid={`interview-${interview.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {interview.title.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground" data-testid={`interview-title-${interview.id}`}>
                            {interview.title}
                          </h4>
                          <p className="text-sm text-muted-foreground" data-testid={`interview-type-${interview.id}`}>
                            {interview.type}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`interview-date-${interview.id}`}>
                            {format(new Date(interview.scheduledAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          className={getStatusBadgeClass(interview.status)}
                          data-testid={`interview-status-${interview.id}`}
                        >
                          {interview.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2" />
                  <p>No recent interviews</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Actions & Upcoming */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card data-testid="quick-actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-muted/30 hover:bg-muted/50"
                  data-testid="action-schedule-interview"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Schedule Interview</p>
                    <p className="text-xs text-muted-foreground">Book new candidate session</p>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-muted/30 hover:bg-muted/50"
                  data-testid="action-start-recording"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <Video className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Start Recording</p>
                    <p className="text-xs text-muted-foreground">Begin interview session</p>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-muted/30 hover:bg-muted/50"
                  data-testid="action-view-analytics"
                >
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">View Analytics</p>
                    <p className="text-xs text-muted-foreground">Performance insights</p>
                  </div>
                </Button>
              </CardContent>
            </Card>
            
            {/* Today's Schedule */}
            <Card data-testid="todays-schedule">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Today's Schedule</CardTitle>
                  <Button variant="ghost" size="sm" data-testid="view-calendar">
                    View calendar
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {upcomingLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 p-3">
                        <Skeleton className="w-2 h-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-20 mb-1" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : upcomingInterviews && upcomingInterviews.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingInterviews.map((interview) => (
                      <div 
                        key={interview.id}
                        className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg"
                        data-testid={`upcoming-interview-${interview.id}`}
                      >
                        <div className="w-2 h-8 bg-primary rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {interview.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {interview.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(interview.scheduledAt), 'h:mm a')} - {format(new Date(new Date(interview.scheduledAt).getTime() + interview.duration * 60000), 'h:mm a')}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          data-testid={`start-interview-${interview.id}`}
                        >
                          <Video className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2" />
                    <p>No interviews scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
