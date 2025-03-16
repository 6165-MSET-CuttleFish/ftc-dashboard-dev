export const SET_REPLAY_OVERLAY = 'SET_REPLAY_OVERLAY';

export type SetReplayOverlayAction = {
  type: typeof SET_REPLAY_OVERLAY;
  overlay: DrawOp[];
  fieldOps?: DrawOp[];
};

export type ReplayAction = SetReplayOverlayAction;
