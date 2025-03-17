import { SetReplayOverlayAction, SET_REPLAY_OVERLAY } from '@/store/types/replay';

export const setReplayOverlay = (overlay: DrawOp[], field: DrawOp[]): SetReplayOverlayAction => ({
  type: SET_REPLAY_OVERLAY,
  overlay,
  field,
});

