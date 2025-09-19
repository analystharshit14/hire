import { useState, useRef, useCallback } from "react";
import { Video, Mic, Square, Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface VideoRecorderProps {
  interviewId?: string;
  onRecordingComplete: (data: FormData) => void;
  onCancel: () => void;
}

export default function VideoRecorder({ interviewId, onRecordingComplete, onCancel }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  // Get available devices
  const getDevices = useCallback(async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(mediaDevices);
      
      // Set default devices
      const videoDevice = mediaDevices.find(device => device.kind === 'videoinput');
      const audioDevice = mediaDevices.find(device => device.kind === 'audioinput');
      
      if (videoDevice) setSelectedCamera(videoDevice.deviceId);
      if (audioDevice) setSelectedMicrophone(audioDevice.deviceId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get media devices",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Start media stream
  const startStream = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCamera ? { deviceId: selectedCamera } : true,
        audio: selectedMicrophone ? { deviceId: selectedMicrophone } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access camera and microphone",
        variant: "destructive",
      });
      throw error;
    }
  }, [selectedCamera, selectedMicrophone, toast]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await startStream();
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        stopStream();
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [startStream]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setIsPaused(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Pause/Resume recording
  const togglePause = useCallback(() => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  }, [isPaused]);

  // Stop stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Save recording
  const saveRecording = useCallback(() => {
    if (recordedBlob && interviewId) {
      const formData = new FormData();
      formData.append('video', recordedBlob, `interview-${interviewId}-${Date.now()}.webm`);
      formData.append('interviewId', interviewId);
      
      onRecordingComplete(formData);
    }
  }, [recordedBlob, interviewId, onRecordingComplete]);

  // Download recording
  const downloadRecording = useCallback(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [recordedBlob]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize devices on mount
  useState(() => {
    getDevices();
  });

  return (
    <div className="space-y-6" data-testid="video-recorder">
      {/* Device Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Camera</label>
          <Select value={selectedCamera} onValueChange={setSelectedCamera}>
            <SelectTrigger data-testid="camera-select">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {devices
                .filter(device => device.kind === 'videoinput')
                .map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Microphone</label>
          <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone}>
            <SelectTrigger data-testid="microphone-select">
              <SelectValue placeholder="Select microphone" />
            </SelectTrigger>
            <SelectContent>
              {devices
                .filter(device => device.kind === 'audioinput')
                .map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Video Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Video Preview</span>
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono" data-testid="recording-timer">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              data-testid="video-preview"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!isRecording && !recordedBlob && (
          <Button
            size="lg"
            onClick={startRecording}
            className="bg-red-600 hover:bg-red-700 text-white"
            data-testid="start-recording-button"
          >
            <Video className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <>
            <Button
              size="lg"
              variant="outline"
              onClick={togglePause}
              data-testid="pause-recording-button"
            >
              {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Square className="w-5 h-5 mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>

            <Button
              size="lg"
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="stop-recording-button"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          </>
        )}

        {recordedBlob && (
          <>
            <Button
              size="lg"
              onClick={downloadRecording}
              variant="outline"
              data-testid="download-recording-button"
            >
              <Download className="w-5 h-5 mr-2" />
              Download
            </Button>

            <Button
              size="lg"
              onClick={saveRecording}
              data-testid="save-recording-button"
            >
              Save Recording
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setRecordedBlob(null);
                setRecordingTime(0);
              }}
              data-testid="reset-recording-button"
            >
              Record Again
            </Button>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel} data-testid="cancel-recording">
          Cancel
        </Button>
      </div>
    </div>
  );
}
