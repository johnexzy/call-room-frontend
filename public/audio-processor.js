/**
 * @typedef {import('audioworklet').AudioWorkletProcessor} AudioWorkletProcessor
 */

/**
 * Audio processor for handling real-time audio processing in a separate thread.
 * @extends {AudioWorkletProcessor}
 */
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  /**
   * Process audio data in chunks.
   * @param {Float32Array[][]} inputs - Array of input channels
   * @returns {boolean} - Keep the processor alive
   */
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) {
      return true;
    }

    const inputChannel = input[0];
    
    // Copy input samples to our buffer
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex++] = inputChannel[i];

      // When buffer is full, send it to the main thread
      if (this.bufferIndex >= this.bufferSize) {
        this.port.postMessage(this.buffer.slice());
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor); 