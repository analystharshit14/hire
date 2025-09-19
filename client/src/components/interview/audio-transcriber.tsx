import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileAudio, Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { recordingApi } from "@/lib/api";
import type { Recording } from "@/lib/api";

interface AudioTranscriberProps {
  recordings: Recording[];
  onTranscriptionComplete: () => void;
  onCancel: () => void;
}

export default function AudioTranscriber({ 
  recordings, 
  onTranscriptionComplete, 
  onCancel 
}: AudioTranscriberProps) {
  const [selectedRecording, setSelectedRecording] = useState<string>("");
  const [transcriptionResult, setTranscriptionResult] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const transcribeMutation = useMutation({
    mutationFn: recordingApi.transcribe,
    onSuccess: (data) => {
      setTranscriptionResult(data.transcription || "");
      toast({
        title: "Success",
        description: "Audio transcription completed",
      });
      onTranscriptionComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadTranscribeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('interviewId', 'temp-upload'); // Temporary ID for uploaded files
      
      const response = await recordingApi.create(formData);
      // Then transcribe the uploaded recording
      return recordingApi.transcribe(response.id);
    },
    onSuccess: (data) => {
      setTranscriptionResult(data.transcription || "");
      toast({
        title: "Success",
        description: "Audio uploaded and transcribed successfully",
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/webm'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please upload a valid audio file (MP3, WAV, M4A, WebM)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 100MB",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
    }
  };

  const handleStartTranscription = () => {
    if (selectedRecording) {
      transcribeMutation.mutate(selectedRecording);
    } else {
      toast({
        title: "Error",
        description: "Please select a recording to transcribe",
        variant: "destructive",
      });
    }
  };

  const handleUploadAndTranscribe = () => {
    if (uploadedFile) {
      uploadTranscribeMutation.mutate(uploadedFile);
    } else {
      toast({
        title: "Error",
        description: "Please select an audio file to upload",
        variant: "destructive",
      });
    }
  };

  const isTranscribing = transcribeMutation.isPending || uploadTranscribeMutation.isPending;

  return (
    <div className="space-y-6" data-testid="audio-transcriber">
      {/* Existing Recordings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileAudio className="w-5 h-5" />
            <span>Select Recording</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Choose from existing recordings
            </label>
            <Select value={selectedRecording} onValueChange={setSelectedRecording}>
              <SelectTrigger data-testid="recording-select">
                <SelectValue placeholder="Select a recording to transcribe" />
              </SelectTrigger>
              <SelectContent>
                {recordings.map((recording) => (
                  <SelectItem key={recording.id} value={recording.id}>
                    Recording from {new Date(recording.createdAt).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleStartTranscription}
            disabled={!selectedRecording || isTranscribing}
            className="w-full"
            data-testid="transcribe-existing-button"
          >
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            {isTranscribing ? 'Transcribing...' : 'Start Transcription'}
          </Button>
        </CardContent>
      </Card>

      {/* Upload New Audio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Audio File</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Upload audio file for transcription
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
              data-testid="audio-file-input"
            />
            {uploadedFile && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button
            onClick={handleUploadAndTranscribe}
            disabled={!uploadedFile || isTranscribing}
            className="w-full"
            data-testid="upload-transcribe-button"
          >
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isTranscribing ? 'Processing...' : 'Upload & Transcribe'}
          </Button>
        </CardContent>
      </Card>

      {/* Transcription Result */}
      {transcriptionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Transcription Result</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={transcriptionResult}
              readOnly
              className="min-h-32"
              placeholder="Transcription will appear here..."
              data-testid="transcription-result"
            />
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      {isTranscribing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Processing audio... This may take a few minutes.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel} data-testid="cancel-transcription">
          Cancel
        </Button>
        {transcriptionResult && (
          <Button onClick={onTranscriptionComplete} data-testid="complete-transcription">
            Complete
          </Button>
        )}
      </div>
    </div>
  );
}
