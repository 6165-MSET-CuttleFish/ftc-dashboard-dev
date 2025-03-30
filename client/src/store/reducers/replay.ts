import { SetReplayOverlayAction, SET_REPLAY_OVERLAY } from '@/store/types/replay';

type ReplayState = {
  ops: DrawOp[];
};

const initialState: ReplayState = {
  ops: [],
};

const replayReducer = (state = initialState, action: SetReplayOverlayAction) => {
  switch (action.type) {
    case SET_REPLAY_OVERLAY:
      return {
        ...state,
        ops: action.overlay,
      };

    default:
      return state;
  }
};

export default replayReducer;
