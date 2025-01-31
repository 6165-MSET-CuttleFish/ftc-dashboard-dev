import {
  ReceiveTelemetryAction,
  UpdateTelemetryAction,
  RECEIVE_TELEMETRY,
  UPDATE_TELEMETRY,
  Telemetry,
} from '@/store/types';

const initialState = {
  data: [], // Store telemetry ops here
  isReplay: false, // Flag to indicate replay mode
};

const telemetryReducer = (
  state = initialState,
  action: ReceiveTelemetryAction | UpdateTelemetryAction
) => {
  switch (action.type) {
    case RECEIVE_TELEMETRY:
      // Reset state to receive new telemetry
      return {
        ...state,
        data: action.telemetry, // Set new telemetry data
        isReplay: false, // Reset replay mode
      };

    case UPDATE_TELEMETRY:
      // When updating telemetry, add new ops to the existing telemetry data
      return {
        ...state,
        isReplay: action.overlay.isReplay !== undefined ? action.overlay.isReplay : state.isReplay, // Preserve isReplay if not set
        data: state.data.map((item) => ({
          ...item,
          fieldOverlay: {
            ...item.fieldOverlay,
            ops: [...item.fieldOverlay.ops, ...action.overlay.ops],
          },
        })),
      };

    default:
      return state;
  }
};

export default telemetryReducer;
