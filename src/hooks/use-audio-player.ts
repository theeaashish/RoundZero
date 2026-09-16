import { useStreamingAudioPlayer } from "./use-streaming-audio-player";

export interface AudioPlayerState {
  isPlaying: boolean;
  volume: number;
  playEncodedAudio: (audioUrl: string) => void;
  stop: () => void;
  setVolume: (volume: number) => void;
}

// URL playback facade over useStreamingAudioPlayer (legacy <audio> path).
export const useAudioPlayer = (): AudioPlayerState => {
  const { isPlaying, playEncodedAudio, stop, volume, setVolume } =
    useStreamingAudioPlayer();

  return {
    isPlaying,
    playEncodedAudio,
    stop,
    volume,
    setVolume,
  };
};
