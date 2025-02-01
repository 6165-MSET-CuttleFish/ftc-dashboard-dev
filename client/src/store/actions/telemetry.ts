import {
  Telemetry,
  RECEIVE_TELEMETRY,
  UPDATE_TELEMETRY,
  CLEAR_TELEMETRY,
} from '@/store/types';

export const receiveTelemetry = (telemetry: Telemetry) => ({
  type: RECEIVE_TELEMETRY,
  telemetry,
});

export const updateTelemetryOverlay = (overlay: any) => ({
  type: UPDATE_TELEMETRY,
  overlay,
});

export const clearTelemetry = () => ({
  type: CLEAR_TELEMETRY,
});
