import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";

export class AgoraService {
  private client: IAgoraRTCClient;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private appId: string;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {
    this.appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    this.client = AgoraRTC.createClient({ 
      mode: "rtc", 
      codec: "vp8",
    });
  }

  async join(channelName: string, token: string, uid: string) {
    try {
      await this.client.join(this.appId, channelName, token, uid);
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: {
          sampleRate: 48000,
          stereo: false,
          bitrate: 48,
        }
      });
      await this.client.publish([this.localAudioTrack]);

      this.client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
        await this.client.subscribe(user, mediaType);
        if (mediaType === "audio" && user.audioTrack) {
          const remoteAudioTrack = user.audioTrack as IRemoteAudioTrack;
          remoteAudioTrack.play();
        }
      });

      return true;
    } catch (error) {
      console.error("Error joining channel:", error);
      throw error;
    }
  }

  async leave() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      if (this.localAudioTrack) {
        await this.localAudioTrack.close();
      }
      await this.client.leave();
    } catch (error) {
      console.error("Error leaving channel:", error);
    }
  }

  async muteAudio(mute: boolean) {
    if (this.localAudioTrack) {
      try {
        await this.localAudioTrack.setEnabled(!mute);
        return true;
      } catch (error) {
        console.error("Error toggling mute:", error);
        return false;
      }
    }
    return false;
  }

  async startRecording() {
    if (!this.localAudioTrack) return null;

    try {
      const mediaStream = new MediaStream([this.localAudioTrack.getMediaStreamTrack()]);
      
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      return mediaStream;
    } catch (error) {
      console.error("Error starting recording:", error);
      return null;
    }
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { 
          type: 'audio/webm;codecs=opus' 
        });
        this.recordedChunks = [];
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  getRecordedData(): Blob[] {
    return this.recordedChunks;
  }
}
