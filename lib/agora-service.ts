import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";

export class AgoraService {
  public client: IAgoraRTCClient;
  public localAudioTrack: IMicrophoneAudioTrack | null = null;
  private remoteAudioTracks: Map<string, IRemoteAudioTrack> = new Map();
  private appId: string;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isPublished: boolean = false;

  constructor() {
    if (typeof window === "undefined") {
      throw new Error(
        "AgoraService can only be instantiated in browser environment"
      );
    }

    this.appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    this.client = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    });
  }

  async join(channelName: string, token: string, uid: string | number) {
    try {
      if (!this.client) {
        console.error("No AgoraRTC client available");
        throw new Error("No AgoraRTC client available");
      }

      console.log("Joining channel:", { channelName, uid });
      await this.client.join(this.appId, channelName, token, Number(uid));

      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: {
          sampleRate: 48000,
          stereo: false,
          bitrate: 48,
        },
      });

      console.log("Local audio track created:", this.localAudioTrack);

      // Ensure track is enabled and published when joining
      await this.localAudioTrack.setEnabled(true);
      await this.client.publish([this.localAudioTrack]);
      this.isPublished = true;

      console.log("Successfully joined and published local track");
      this.setupRemoteUser();
      return true;
    } catch (error) {
      console.error("Error in join:", error);
      throw error;
    }
  }

  async leave() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      if (this.localAudioTrack) {
        await this.localAudioTrack.close();
      }
      await this.client?.leave();
    } catch (error) {
      console.error("Error leaving channel:", error);
    }
  }

  async muteAudio(mute: boolean): Promise<boolean> {
    if (!this.localAudioTrack || !this.client) {
      console.error("No local audio track or client available");
      return false;
    }

    try {
      console.log("Muting audio:", {
        mute,
        currentTrackEnabled: this.localAudioTrack.enabled,
      });

      if (!this.localAudioTrack.enabled) {
        await this.localAudioTrack.setEnabled(true);

        console.log("Audio mute success:", {
          newTrackEnabled: this.localAudioTrack.enabled,
        });
      } else {
        await this.localAudioTrack.setEnabled(false);

        console.log("Audio mute success:", {
          newTrackEnabled: this.localAudioTrack.enabled,
        });
      }

      return true;
    } catch (error) {
      console.error("Error in muteAudio:", error);
      return false;
    }
  }

  isLocalAudioMuted(): boolean {
    if (!this.localAudioTrack) {
      console.log("No local audio track available for mute check");
      return true;
    }
    const muted = !this.localAudioTrack.enabled;
    console.log("Local audio mute check:", { muted });
    return muted;
  }

  async startRecording() {
    if (!this.localAudioTrack) return null;

    try {
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      const localStream = new MediaStream([
        this.localAudioTrack.getMediaStreamTrack(),
      ]);
      const localSource = audioContext.createMediaStreamSource(localStream);
      localSource.connect(destination);

      this.remoteAudioTracks.forEach((track) => {
        const remoteStream = new MediaStream([track.getMediaStreamTrack()]);
        const remoteSource = audioContext.createMediaStreamSource(remoteStream);
        remoteSource.connect(destination);
      });

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000);
      return destination.stream;
    } catch (error) {
      console.error("Error starting recording:", error);
      return null;
    }
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: "audio/webm;codecs=opus",
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

  private setupRemoteUser() {
    this.client?.on(
      "user-published",
      async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
        await this.client?.subscribe(user, mediaType);
        if (mediaType === "audio" && user.audioTrack) {
          const remoteAudioTrack = user.audioTrack;
          this.remoteAudioTracks.set(user.uid.toString(), remoteAudioTrack);
          remoteAudioTrack.play();
        }
      }
    );

    this.client?.on(
      "user-unpublished",
      (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
        if (mediaType === "audio") {
          this.remoteAudioTracks.delete(user.uid.toString());
        }
      }
    );
  }
}
