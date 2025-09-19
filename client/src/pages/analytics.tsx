import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Calendar, Star, BarChart3, PieChart } from "lucide-react";
import Header from "@/components/layout/header";
import PerformanceChart from "@/components/analytics/performance-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { analyticsApi, evaluationApi, candidateApi, interviewApi } from "@/lib/api";
import type { Metrics, Evaluation, Candidate, Interview } from "@/lib/api";

export default function Analytics() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: [analyticsApi.getMetrics()],
  });

  const { data: evaluations, isLoading: evaluationsLoading } = useQuery<Evaluation[]>({
    queryKey: [evaluationApi.getAll()],
  });

  const { data: candidates } = useQuery<Candidate[]>({
    queryKey: [candidateApi.getAll()],
  });

  const { data: interviews } = useQuery<Interview[]>({
    queryKey: [interviewApi.getAll()],
  });

  // Calculate performance insights
  const performanceData = evaluations?.map(evaluation => ({
    date: evaluation.createdAt,
    technicalScore: parseFloat(evaluation.technicalScore || "0"),
    communicationScore: parseFloat(evaluation.communicationScore || "0"),
    problemSolvingScore: parseFloat(evaluation.problemSolvingScore || "0"),
    overallScore: parseFloat(evaluation.overallScore || "0"),
  })) || [];

  // Calculate hiring funnel metrics
  const hiringFunnelData = [
    { stage: "Applied", count: candidates?.length || 0 },
    { stage: "Interviewed", count: interviews?.length || 0 },
    { stage: "Evaluated", count: evaluations?.length || 0 },
    { stage: "Hired", count: candidates?.filter(c => c.status === 'hired').length || 0 },
  ];

  // Top performers
  const topPerformers = evaluations
    ?.sort((a, b) => parseFloat(b.overallScore || "0") - parseFloat(a.overallScore || "0"))
    .slice(0, 5)
    .map(evaluation => {
      const candidate = candidates?.find(c => c.id === evaluation.candidateId);
      return {
        ...evaluation,
        candidateName: candidate?.name || 'Unknown',
        candidatePosition: candidate?.position || 'Unknown',
      };
    }) || [];

  // Interview type distribution
  const interviewTypeDistribution = interviews?.reduce((acc, interview) => {
    acc[interview.type] = (acc[interview.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Status distribution
  const statusDistribution = candidates?.reduce((acc, candidate) => {
    acc[candidate.status] = (acc[candidate.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <>
      <Header
        title="Analytics"
        description="Performance insights and hiring analytics dashboard."
      />
      
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="analytics-total-interviews">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Interviews</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="analytics-total-count">
                      {metrics?.totalInterviews || 0}
                    </p>
                  )}
                  <p className="text-sm text-emerald-600">This quarter</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="analytics-avg-score">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="analytics-avg-score-value">
                      {metrics?.averageScore || 0}/10
                    </p>
                  )}
                  <p className="text-sm text-emerald-600">All evaluations</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="analytics-completion-rate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="analytics-completion-rate-value">
                    {interviews && interviews.length > 0 
                      ? Math.round((interviews.filter(i => i.status === 'completed').length / interviews.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-emerald-600">Interview success</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="analytics-hire-rate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hire Rate</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="analytics-hire-rate-value">
                    {candidates && candidates.length > 0
                      ? Math.round((candidates.filter(c => c.status === 'hired').length / candidates.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-emerald-600">Successful hires</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance Trends</TabsTrigger>
            <TabsTrigger value="funnel">Hiring Funnel</TabsTrigger>
            <TabsTrigger value="distribution">Distributions</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Chart */}
              <Card className="lg:col-span-2" data-testid="performance-chart-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Interview Performance Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {evaluationsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <PerformanceChart data={performanceData} />
                  )}
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card data-testid="top-performers-card">
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  {evaluationsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-4 w-8" />
                        </div>
                      ))}
                    </div>
                  ) : topPerformers.length > 0 ? (
                    <div className="space-y-4">
                      {topPerformers.map((performer, index) => (
                        <div 
                          key={performer.id}
                          className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg"
                          data-testid={`top-performer-${index}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {performer.candidateName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {performer.candidatePosition}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">
                              {performer.overallScore}/10
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Star className="w-8 h-8 mx-auto mb-2" />
                      <p>No evaluations yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="funnel" className="space-y-6">
            <Card data-testid="hiring-funnel-card">
              <CardHeader>
                <CardTitle>Hiring Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {hiringFunnelData.map((stage, index) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{stage.stage}</span>
                        <span className="text-sm text-muted-foreground">{stage.count}</span>
                      </div>
                      <Progress 
                        value={hiringFunnelData[0].count > 0 ? (stage.count / hiringFunnelData[0].count) * 100 : 0}
                        className="h-2"
                        data-testid={`funnel-progress-${stage.stage.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Interview Type Distribution */}
              <Card data-testid="interview-type-distribution">
                <CardHeader>
                  <CardTitle>Interview Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(interviewTypeDistribution).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{type}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Candidate Status Distribution */}
              <Card data-testid="candidate-status-distribution">
                <CardHeader>
                  <CardTitle>Candidate Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(statusDistribution).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{status}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card data-testid="insights-recommendations">
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {evaluations && evaluations.length > 0 ? (
                      <>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            <strong>Strong Performance:</strong> Average interview score is {metrics?.averageScore || 0}/10
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Interview Volume:</strong> {interviews?.length || 0} interviews conducted
                          </p>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Hiring Success:</strong> {candidates?.filter(c => c.status === 'hired').length || 0} successful hires
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                        <p>Insights will appear as you conduct more interviews</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="insights-trends">
                <CardHeader>
                  <CardTitle>Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Weekly Interviews</span>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium">{metrics?.weeklyInterviews || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Active Candidates</span>
                      <span className="text-sm font-medium">{metrics?.activeCandidates || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Total Evaluations</span>
                      <span className="text-sm font-medium">{evaluations?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
