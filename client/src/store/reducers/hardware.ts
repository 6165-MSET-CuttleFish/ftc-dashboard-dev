import {
  HardwareState,
  HardwareActions,
  HardwareVarState,
} from '@/store/types/hardware';

const initialState: HardwareState = {
  hardwareRoot: {
    __type: 'custom',
    __value: {},
  },
};

const hardwareReducer = (
    state: HardwareState = initialState,
    action: HardwareActions
): HardwareState => {
  switch (action.type) {
    case 'PRELOAD_HARDWARE':
      return {
        ...state,
        hardwareRoot: action.payload.hardwareRoot,
      };
    case 'RECEIVE_HARDWARE':
      return {
        ...state,
        hardwareRoot: action.payload.hardwareRoot,
      };
    case 'UPDATE_HARDWARE':
      return {
        ...state,
        hardwareRoot: action.payload.hardwareRoot,
      };
    case 'REFRESH_HARDWARE':
      return {
        ...state,
        hardwareRoot: {
          ...state.hardwareRoot,
          __value: { ...state.hardwareRoot.__value }, // Reset state
        },
      };
    default:
      return state;
  }
};

export default hardwareReducer;
