export interface HardwareVar {
    __type: 'custom'; // 'motor' or 'servo'
    __value: Record<string, HardwareVar>; // Numeric or nested
}

export interface HardwareVarState {
    __type: 'custom';
    __value: Record<string, HardwareVar>;
}

export interface HardwareState {
    hardwareRoot: HardwareVarState;
}

export interface PreloadHardwareAction {
    type: 'PRELOAD_HARDWARE';
    payload: {
        hardwareRoot: HardwareVarState;
    };
}

export interface GetHardwareAction {
    type: 'GET_HARDWARE';
    payload: {
        hardwareRoot: HardwareVarState;
    };
}


export interface ReceiveHardwareAction {
    type: 'RECEIVE_HARDWARE';
    payload: {
        hardwareRoot: HardwareVarState;
    };
}

export interface UpdateHardwareAction {
    type: 'UPDATE_HARDWARE';
    payload: {
        hardwareRoot: HardwareVarState;
    };
}

export interface SaveHardwareAction {
    type: 'SAVE_HARDWARE';
    payload: {
        hardwareDiff: HardwareVarState;
    };
}

export interface RefreshHardwareAction {
    type: 'REFRESH_HARDWARE';
}

export type HardwareActions =
    | PreloadHardwareAction
    | ReceiveHardwareAction
    | UpdateHardwareAction
    | SaveHardwareAction
    | RefreshHardwareAction;
