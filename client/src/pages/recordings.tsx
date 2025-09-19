import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Play, Download, FileText, Video, Mic, Trash2 } from "lucide-react";
import Header from "@/components/layout/header";
import VideoRecorder from "@/components/interview/video-recorder";
import AudioTranscriber from "@/components/interview/audio-transcriber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { recordingApi, interviewApi, queryClient } from "@/lib/api";
import type { Recording, Interview } from "@/lib/api";

export default function Recordings() {
  const [search, setSearch] = useState("");
  const [showRecorder, setShowRecorder] = useState(false);
  const [showTranscriber, setShowTranscriber] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string>("");
  const { toast } = useToast();

  const { data: recordings, isLoading } = useQuery<Recording[]>({
    queryKey: [recordingApi.getAll()],
  });

  const { data: interviews } = useQuery<Interview[]>({
    queryKey: [interviewApi.getAll()],
  });

  const transcribeMutation = useMutation({
    mutationFn: recordingApi.transcribe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
      toast({
        title: "Success",
        description: "Audio transcription completed",
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

  const handleNewRecording = () => {
    setShowRecorder(true);
  };

  const handleTranscribeAudio = () => {
    setShowTranscriber(true);
  };

  const handleRecordingComplete = (data: FormData) => {
    // Handle recording upload
    recordingApi.create(data).then(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
      setShowRecorder(false);
      toast({
        title: "Success",
        description: "Recording uploaded successfully",
      });
    }).catch((error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    });
  };

  const handleStartTranscription = (recordingId: string) => {
    transcribeMutation.mutate(recordingId);
  };

  const getInterviewTitle = (interviewId: string) => {
    const interview = interviews?.find(i => i.id === interviewId);
    return interview?.title || 'Unknown Interview';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown duration';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredRecordings = recordings?.filter(recording =>
    !search || 
    getInterviewTitle(recording.interviewId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header
        title="Recordings"
        description="Manage interview recordings and transcriptions."
        onSearch={setSearch}
        onNewAction={handleNewRecording}
        newActionLabel="New Recording"
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All Recordings</TabsTrigger>
                <TabsTrigger value="video">Video Only</TabsTrigger>
                <TabsTrigger value="audio">Audio Only</TabsTrigger>
                <TabsTrigger value="transcribed">Transcribed</TabsTrigger>
              </TabsList>
              
              <Button 
                variant="outline" 
                onClick={handleTranscribeAudio}
                data-testid="transcribe-audio-button"
              >
                <Mic className="w-4 h-4 mr-2" />
                Transcribe Audio
              </Button>
            </div>
            
            <TabsContent value="all" className="mt-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Skeleton className="h-32 w-full" />
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredRecordings && filteredRecordings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecordings.map((recording) => (
                    <Card 
                      key={recording.id}
                      className="hover:shadow-md transition-shadow"
                      data-testid={`recording-card-${recording.id}`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          {recording.videoPath && <Video className="w-5 h-5" />}
                          {recording.audioPath && <Mic className="w-5 h-5" />}
                          <span data-testid={`recording-interview-${recording.id}`}>
                            {getInterviewTitle(recording.interviewId)}
                          </span>
                        </CardTitle>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(recording.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                          {recording.transcription && (
                            <Badge variant="secondary">
                              <FileText className="w-3 h-3 mr-1" />
                              Transcribed
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Video/Audio Preview */}
                        {recording.videoPath && (
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                            <video 
                              controls 
                              className="w-full h-full rounded-lg"
                              data-testid={`video-player-${recording.id}`}
                            >
                              <source src={recording.videoPath} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                        
                        {recording.audioPath && !recording.videoPath && (
                          <div className="bg-muted rounded-lg p-4 flex items-center justify-center">
                            <audio 
                              controls 
                              className="w-full"
                              data-testid={`audio-player-${recording.id}`}
                            >
                              <source src={recording.audioPath} type="audio/mp3" />
                              Your browser does not support the audio tag.
                            </audio>
                          </div>
                        )}
                        
                        {/* Recording Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-medium" data-testid={`recording-duration-${recording.id}`}>
                              {formatDuration(recording.duration)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Size</p>
                            <p className="font-medium" data-testid={`recording-size-${recording.id}`}>
                              {formatFileSize(recording.size)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Transcription Preview */}
                        {recording.transcription && (
                          <div className="border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-2">Transcription</p>
                            <p className="text-sm line-clamp-3" data-testid={`recording-transcription-${recording.id}`}>
                              {recording.transcription}
                            </p>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex space-x-2">
                          {recording.audioPath && !recording.transcription && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStartTranscription(recording.id)}
                              disabled={transcribeMutation.isPending}
                              data-testid={`transcribe-button-${recording.id}`}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              {transcribeMutation.isPending ? 'Transcribing...' : 'Transcribe'}
                            </Button>
                          )}
                          
                          {(recording.videoPath || recording.audioPath) && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`download-button-${recording.id}`}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No recordings found</h3>
                  <p className="text-muted-foreground mb-6">
                    {search ? `No recordings match "${search}"` : "Start recording interviews to see them here."}
                  </p>
                  <Button onClick={handleNewRecording} data-testid="start-first-recording">
                    <Video className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Other tab contents would filter the recordings accordingly */}
            <TabsContent value="video">
              {/* Video-only recordings */}
            </TabsContent>
            <TabsContent value="audio">
              {/* Audio-only recordings */}
            </TabsContent>
            <TabsContent value="transcribed">
              {/* Transcribed recordings */}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={showRecorder} onOpenChange={setShowRecorder}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Record Interview</DialogTitle>
          </DialogHeader>
          <VideoRecorder
            interviewId={selectedInterviewId}
            onRecordingComplete={handleRecordingComplete}
            onCancel={() => setShowRecorder(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showTranscriber} onOpenChange={setShowTranscriber}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audio Transcription</DialogTitle>
          </DialogHeader>
          <AudioTranscriber
            recordings={recordings?.filter(r => r.audioPath && !r.transcription) || []}
            onTranscriptionComplete={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
              setShowTranscriber(false);
            }}
            onCancel={() => setShowTranscriber(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
