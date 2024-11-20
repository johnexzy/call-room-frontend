import { Socket } from 'socket.io-client';

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private socket: Socket;
  private isOfferer = false;
  private pendingCandidates: RTCIceCandidate[] = [];

  constructor(socket: Socket) {
    this.socket = socket;
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN servers for production
      ],
    });

    this.setupPeerConnectionListeners();
  }

  private setupPeerConnectionListeners() {
    if (!this.peerConnection) return;

    this.peerConnection.ontrack = ({ streams: [stream] }) => {
      this.remoteStream = stream;
      window.dispatchEvent(
        new CustomEvent('remoteStreamUpdated', { detail: stream }),
      );
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(event.candidate);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      
      console.log('Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'failed') {
        console.log('Connection failed, restarting ICE');
        this.peerConnection.restartIce();
      }
    };

    this.peerConnection.onsignalingstatechange = () => {
      if (!this.peerConnection) return;
      console.log('Signaling state:', this.peerConnection.signalingState);

      // Process any pending candidates after remote description is set
      if (this.peerConnection.signalingState === 'stable' && this.pendingCandidates.length > 0) {
        this.processPendingCandidates();
      }
    };

    this.peerConnection.onicegatheringstatechange = () => {
      if (!this.peerConnection) return;
      console.log('ICE gathering state:', this.peerConnection.iceGatheringState);
    };
  }

  private async processPendingCandidates() {
    if (!this.peerConnection) return;

    while (this.pendingCandidates.length > 0) {
      const candidate = this.pendingCandidates.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(candidate);
          console.log('Added pending ICE candidate');
        } catch (error) {
          console.error('Error adding pending ICE candidate:', error);
        }
      }
    }
  }

  async startLocalStream() {
    try {
      if (this.localStream) {
        return this.localStream;
      }

      if (!this.peerConnection || this.peerConnection.connectionState === 'closed') {
        this.initializePeerConnection();
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.localStream.getTracks().forEach((track) => {
        if (this.localStream && this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createOffer() {
    try {
      if (!this.peerConnection) {
        throw new Error('PeerConnection not initialized');
      }

      this.isOfferer = true;
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      
      await this.peerConnection.setLocalDescription(offer);
      console.log('Set local description (offer)');
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      if (!this.peerConnection) {
        throw new Error('PeerConnection not initialized');
      }

      if (this.peerConnection.signalingState !== 'have-local-offer') {
        console.warn('Invalid state for handling answer:', this.peerConnection.signalingState);
        return;
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Set remote description (answer)');
      await this.processPendingCandidates();
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  async handleOffer(offer: RTCSessionDescriptionInit) {
    try {
      if (!this.peerConnection) {
        throw new Error('PeerConnection not initialized');
      }

      if (this.peerConnection.signalingState !== 'stable') {
        console.warn('Invalid state for handling offer:', this.peerConnection.signalingState);
        return;
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('Set remote description (offer)');

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('Set local description (answer)');

      await this.processPendingCandidates();
      return answer;
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      if (!this.peerConnection) {
        throw new Error('PeerConnection not initialized');
      }

      if (this.peerConnection.remoteDescription && this.peerConnection.signalingState === 'stable') {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Added ICE candidate');
      } else {
        console.log('Queuing ICE candidate');
        this.pendingCandidates.push(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ice candidate:', error);
      throw error;
    }
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.pendingCandidates = [];
  }

  onIceCandidate?: (candidate: RTCIceCandidate) => void;

  getStats() {
    return this.peerConnection?.getStats();
  }
} 