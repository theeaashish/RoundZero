import { useStreamingAudioPlayer } from "./useStreamingAudioPlayer";

export interface AudioPlayerState {
  isPlaying: boolean;
  volume: number;
  playEncodedAudio: (audioUrl: string) => void;
  stop: () => void;
  setVolume: (volume: number) => void;
}

// Hook for playing audio from URLs
// Wraps useStreamingAudioPlayer for unified Web Audio / legacy playback
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
