import {
  ReceiveTelemetryAction,
  UpdateTelemetryAction,
  ClearTelemetryAction,
  RECEIVE_TELEMETRY,
  UPDATE_TELEMETRY,
  Telemetry,
} from '@/store/types';

type TelemetryAction = ReceiveTelemetryAction | UpdateTelemetryAction;

const initialState = {
  data: [], // Store telemetry ops here
  isReplay: false, // Flag to indicate replay mode
};
const telemetryReducer = (state = initialState, action: TelemetryAction) => {
  switch (action.type) {
    case RECEIVE_TELEMETRY:
      return {
        ...state,
        data: [...state.data, ...action.telemetry], // Append new telemetry data instead of replacing
        isReplay: false, // Reset replay mode
      };

    case UPDATE_TELEMETRY:
      return {
        ...state,
        isReplay: action.overlay.isReplay !== undefined ? action.overlay.isReplay : state.isReplay,
        data: state.data.map((item, index) => {
          const newOps = action.overlay.ops || []; // Ensure new ops exist
          return {
            ...item,
            fieldOverlay: {
              ...item.fieldOverlay,
              ops: item.fieldOverlay.ops ? [...item.fieldOverlay.ops, ...newOps] : [...newOps],
              // Ensures ops are added, not overwritten
            },
          };
        }),
      };

    default:
      return state;
  }
};

export default telemetryReducer;
