import { io, Socket } from 'socket.io-client';

export class WebRTCService {
  private socket: Socket;
  private peerConnection: RTCPeerConnection | null = null;

  constructor(private callId: string) {
    this.socket = io('http://localhost:5200/webrtc', {
      auth: {
        token: `Bearer ${localStorage.getItem('token')}`,
      },
      query: {
        callId,
      },
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('offer', async (offer: RTCSessionDescriptionInit) => {
      if (!this.peerConnection) return;
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit('answer', answer);
    });

    this.socket.on('answer', async (answer: RTCSessionDescriptionInit) => {
      if (!this.peerConnection) return;
      await this.peerConnection.setRemoteDescription(answer);
    });

    this.socket.on('ice-candidate', async (candidate: RTCIceCandidate) => {
      if (!this.peerConnection) return;
      await this.peerConnection.addIceCandidate(candidate);
    });
  }

  async initializePeerConnection(stream: MediaStream) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream);
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', event.candidate);
      }
    };

    return this.peerConnection;
  }

  async createOffer() {
    if (!this.peerConnection) return;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.socket.emit('offer', offer);
  }

  disconnect() {
    this.socket.disconnect();
    this.peerConnection?.close();
  }
} 