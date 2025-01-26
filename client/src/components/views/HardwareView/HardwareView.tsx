import React from 'react';
import { useSelector } from 'react-redux';
import BaseView, {
    BaseViewHeading,
    BaseViewBody,
    BaseViewIcons,
    BaseViewIconButton,
} from '@/components/views/BaseView';
import { ReactComponent as SaveIcon } from '@/assets/icons/save.svg';
import { ReactComponent as RefreshIcon } from '@/assets/icons/refresh.svg';
import { RootState, useAppDispatch } from '@/store/reducers';
import CustomVariable from '../ConfigView/CustomVariable'; // Reuse as-is
import { HardwareVarState } from '@/store/types/hardware';
import { CustomVar } from '@/store/types/config';
import HardwareVariable from "@/components/views/HardwareView/HardwareVariable";

function validAndModified(state: HardwareVarState): HardwareVarState | null {
  if (state.__type === 'custom') {
    const value = state.__value;
    if (!value) return null;

    const filteredValue = Object.keys(value).reduce((acc, key) => {
      const child = validAndModified(value[key]);
      if (child !== null) {
        acc[key] = child;
      }
      return acc;
    }, {} as Record<string, HardwareVarState>);

    return Object.keys(filteredValue).length > 0
      ? { ...state, __value: filteredValue }
      : null;
  }

  return state; // Return as-is for leaf variables
}

const HardwareView = () => {
  const dispatch = useAppDispatch();
  const hardwareRoot = useSelector(
    (state: RootState) => state.hardware.hardwareRoot,
  ) as HardwareVarState;

  const rootValue = hardwareRoot.__value;
  if (!rootValue) return null;

  const sortedKeys = Object.keys(rootValue).sort();

  return (
    <BaseView>
      <div className="flex">
        <BaseViewHeading>Hardware Control</BaseViewHeading>
        <BaseViewIcons>
          <BaseViewIconButton
            title="Save Changes"
            onClick={() => {
              const hardwareDiff = validAndModified(hardwareRoot);
              if (hardwareDiff) {
                dispatch({
                  type: 'SAVE_HARDWARE',
                  payload: { hardwareDiff },
                });
              }
            }}
          >
            <SaveIcon className="h-6 w-6" />
          </BaseViewIconButton>
          <BaseViewIconButton
            title="Reload Values"
            onClick={() => dispatch({ type: 'REFRESH_HARDWARE' })}
          >
            <RefreshIcon className="h-6 w-6" />
          </BaseViewIconButton>
        </BaseViewIcons>
      </div>
      <BaseViewBody>
        {sortedKeys.map((key) => (
          <HardwareVariable
            key={key}
            name={key}
            state={rootValue[key]}
            onChange={(newState) =>
              dispatch({
                type: 'UPDATE_HARDWARE',
                payload: {
                  hardwareRoot: {
                    ...hardwareRoot,
                    __value: {
                      ...rootValue,
                      [key]: newState,
                    },
                  },
                },
              })
            }
            path={''}
            onSave={function (variable: CustomVar): void {
              throw new Error('Function not implemented.');
            }}
          />
        ))}
      </BaseViewBody>
    </BaseView>
  );
};

export default HardwareView;
