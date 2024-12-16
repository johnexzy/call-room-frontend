import { ILocalAudioTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { WS_EVENTS, WS_NAMESPACES } from '@/constants/websocket.constants';

export class AudioProcessor {
  private readonly audioContext: AudioContext;
  private audioWorklet: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private socket: Socket | null = null;
  private isProcessing = false;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly sessionId: string,
    private readonly callId: string,
    private readonly userId: string | number,
  ) {
    this.audioContext = new AudioContext();
  }

  async init(): Promise<void> {
    console.log('Initializing AudioProcessor');
    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');
      this.setupWebSocket();
    } catch (error) {
      console.error('Failed to initialize AudioProcessor:', error);
      throw error;
    }
  }

  private setupWebSocket(): void {
    const token = Cookies.get('token');
    if (!token) {
      throw new Error('Token not found');
    }

    const apiUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!apiUrl) {
      throw new Error('API URL not configured');
    }

    this.socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/${WS_NAMESPACES.TRANSCRIPTION}`, {
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        query: {
          sessionId: this.sessionId,
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to transcription server');
      this.retryCount = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from transcription server');
    });

    this.socket.on(WS_EVENTS.TRANSCRIPTION.ERROR, (error: Error) => {
      console.error('Transcription error:', error);
    });
  }

  async processTrack(track: ILocalAudioTrack | IRemoteAudioTrack): Promise<void> {
    if (this.isProcessing) {
      await this.stopProcessing();
    }

    try {
      this.isProcessing = true;
      const mediaStream = new MediaStream();
      mediaStream.addTrack(track.getMediaStreamTrack());

      this.sourceNode = this.audioContext.createMediaStreamSource(mediaStream);
      this.audioWorklet = new AudioWorkletNode(this.audioContext, 'audio-processor');

      this.audioWorklet.port.onmessage = async (event) => {
        try {
          if (!this.isProcessing || !this.socket) return;

          const audioData = event.data;
          const base64Data = this.float32ArrayToBase64(audioData);
          
          this.socket.emit(WS_EVENTS.TRANSCRIPTION.AUDIO_DATA, {
            callId: this.callId,
            audioData: base64Data,
            userId: String(this.userId),
          });

          this.retryCount = 0;
        } catch (error) {
          console.error('Error processing audio data:', error);
          if (this.retryCount < this.MAX_RETRIES) {
            this.retryCount++;
            await this.reconnect(track);
          } else {
            await this.stopProcessing();
            throw error;
          }
        }
      };

      this.sourceNode.connect(this.audioWorklet);
      this.audioWorklet.connect(this.audioContext.destination);

      this.audioContext.onstatechange = async () => {
        if (this.audioContext.state === 'suspended' && this.isProcessing) {
          await this.reconnect(track);
        }
      };
    } catch (error) {
      console.error('Failed to process audio track:', error);
      this.isProcessing = false;
      throw error;
    }
  }

  private float32ArrayToBase64(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      int16Array[i] = Math.max(-32768, Math.min(32767, float32Array[i] * 32768));
    }

    const buffer = new ArrayBuffer(int16Array.length * 2);
    new Int16Array(buffer).set(int16Array);
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...Array.from(bytes)));
  }

  private async reconnect(track: ILocalAudioTrack | IRemoteAudioTrack): Promise<void> {
    try {
      await this.stopProcessing();
      await this.processTrack(track);
    } catch (error) {
      console.error('Failed to reconnect audio processor:', error);
      throw error;
    }
  }

  async stopProcessing(): Promise<void> {
    this.isProcessing = false;
    
    if (this.audioWorklet) {
      this.audioWorklet.port.onmessage = null;
      this.audioWorklet.disconnect();
      this.audioWorklet = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.error('Error closing audio context:', error);
      }
    }
  }

  onTranscript(callback: (transcript: string) => void): void {
    this.socket?.on(WS_EVENTS.TRANSCRIPTION.TRANSCRIPT, ({ transcript }: { transcript: string }) => {
      callback(transcript);
    });
  }
} 