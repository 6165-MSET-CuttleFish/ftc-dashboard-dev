import {
  ReceiveTelemetryAction,
  UpdateTelemetryAction,
  ClearTelemetryAction, // ✅ Add this line
  RECEIVE_TELEMETRY,
  UPDATE_TELEMETRY,
  CLEAR_TELEMETRY,
  Telemetry,
} from '@/store/types';

type TelemetryAction = ReceiveTelemetryAction | UpdateTelemetryAction | ClearTelemetryAction; // ✅ Include CLEAR_TELEMETRY here

const initialState = {
  data: [], // Store telemetry ops here
  isReplay: false, // Flag to indicate replay mode
};

const telemetryReducer = (state = initialState, action: TelemetryAction) => { // ✅ Use the new type
  switch (action.type) {
    case RECEIVE_TELEMETRY:
      return {
        ...state,
        data: action.telemetry, // Set new telemetry data
        isReplay: false, // Reset replay mode
      };

    case UPDATE_TELEMETRY:
      return {
        ...state,
        isReplay: action.overlay.isReplay !== undefined ? action.overlay.isReplay : state.isReplay,
        data: state.data.map((item) => ({
          ...item,
          fieldOverlay: {
            ...item.fieldOverlay,
            ops: [...item.fieldOverlay.ops, ...action.overlay.ops],
          },
        })),
      };

    case CLEAR_TELEMETRY:
      return {
        ...state,
        data: [], // ✅ Clear the telemetry data
        isReplay: false,
      };

    default:
      return state;
  }
};

export default telemetryReducer;
