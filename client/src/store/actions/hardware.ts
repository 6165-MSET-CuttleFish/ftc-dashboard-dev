import { HardwareVarState } from '@/store/types/hardware';

export const preloadHardware = (hardwareRoot: HardwareVarState) => ({
    type: 'PRELOAD_HARDWARE',
    payload: { hardwareRoot },
});

export const getHardware = () => ({
    type: 'GET_HARDWARE',
});

export const updateHardware = (hardwareRoot: HardwareVarState) => ({
    type: 'UPDATE_HARDWARE',
    payload: { hardwareRoot },
});

export const saveHardware = (hardwareDiff: HardwareVarState) => ({
    type: 'SAVE_HARDWARE',
    payload: { hardwareDiff },
});

export const refreshHardware = () => ({
    type: 'REFRESH_HARDWARE',
});
