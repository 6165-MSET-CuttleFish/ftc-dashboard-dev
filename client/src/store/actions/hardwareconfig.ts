import { RECEIVE_HARDWARE_CONFIG_LIST, SET_HARDWARE_CONFIG, WRITE_HARDWARE_CONFIG, SetHardwareConfigAction, WriteHardwareConfigAction, ReceiveHardwareConfigListAction } from "../types/hardwareconfig";

export const setHardwareConfig = (hardwareConfigName: string): SetHardwareConfigAction => ({
    type: SET_HARDWARE_CONFIG,
    hardwareConfigName,
});

export const writeHardwareConfig = (hardwareConfigName: string, hardwareConfigContents: string): WriteHardwareConfigAction => ({
    type: WRITE_HARDWARE_CONFIG,
    hardwareConfigName,
    hardwareConfigContents,
});

export const receiveHardwareConfigList = (
    hardwareConfigList: string[],
    hardwareConfigFiles: string[],
    currentHardwareConfig: string,
): ReceiveHardwareConfigListAction => ({
    type: RECEIVE_HARDWARE_CONFIG_LIST,
    hardwareConfigList,
    hardwareConfigFiles,
    currentHardwareConfig,
}
)