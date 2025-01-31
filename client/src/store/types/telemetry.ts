export const RECEIVE_TELEMETRY = 'RECEIVE_TELEMETRY';
export const UPDATE_TELEMETRY = 'UPDATE_TELEMETRY';

export type Telemetry = TelemetryItem[];

export type Overlay = {
  ops: DrawOp[];
};

export type UpdateTelemetryAction = {
  type: typeof UPDATE_TELEMETRY;
};

export type TelemetryItem = {
  data: {
    [key: string]: string;
  };
  field: {
    ops: DrawOp[];
  };
  fieldOverlay: {
    ops: DrawOp[];
  };
  log: string[];
  timestamp: number;
};

export type ReceiveTelemetryAction = {
  type: typeof RECEIVE_TELEMETRY;
  telemetry: Telemetry;
};
