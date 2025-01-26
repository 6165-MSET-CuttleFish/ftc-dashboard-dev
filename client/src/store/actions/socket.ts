import { Dispatch } from 'redux';

import {
  ReceiveConnectionStatusAction,
  ReceiveOpModeListAction,
  ReceivePingTimeAction,
  RECEIVE_CONNECTION_STATUS,
  RECEIVE_PING_TIME,
} from '@/store/types';
import { receiveOpModeList } from './status';

export const receivePingTime = (pingTime: number): ReceivePingTimeAction => ({
  type: RECEIVE_PING_TIME,
  pingTime,
});

export const receiveConnectionStatus =
  (isConnected: boolean) =>
  (
    dispatch: Dispatch<ReceiveConnectionStatusAction | ReceiveOpModeListAction>,
  ) => {
    dispatch({
      type: RECEIVE_CONNECTION_STATUS,
      isConnected,
    });

    if (!isConnected) {
      dispatch(receiveOpModeList([]));
    }
  };

export const requestHardwareState = () => ({
  type: 'REQUEST_HARDWARE_STATE',
});

export const updateHardware = (type: 'motors' | 'servos', name: string, value: number) => ({
  type: 'UPDATE_HARDWARE',
  payload: { type, name, value },
});

