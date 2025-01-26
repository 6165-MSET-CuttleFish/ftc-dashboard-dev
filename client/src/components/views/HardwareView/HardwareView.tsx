import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/reducers';
import BaseView, { BaseViewHeading, BaseViewBody } from '../BaseView';

type HardwareViewProps = {
  isDraggable?: boolean;
  isUnlocked?: boolean;
};

const HardwareView = ({ isDraggable = false, isUnlocked = false }: HardwareViewProps) => {
  const [activeTab, setActiveTab] = useState<'motors' | 'servos'>('motors');
  const [hardwareState, setHardwareState] = useState({ motors: {}, servos: {} });
  const dispatch = useDispatch();
  const hardware = useSelector((state: RootState) => state.hardware);

  useEffect(() => {
    // Fetch hardware state from OpMode on mount
    dispatch({ type: 'REQUEST_HARDWARE_STATE' });
  }, [dispatch]);

  useEffect(() => {
    if (hardware.hardwareRoot) {
      setHardwareState(hardware.hardwareRoot);
    }
  }, [hardware.hardwareRoot]);

  const updateHardware = (type: 'motors' | 'servos', name: string, values: [number]) => {
    dispatch({
      type: 'UPDATE_HARDWARE',
      payload: { type, name, values},
    });
  };

  const renderControls = (type: 'motors' | 'servos') =>
      Object.keys(hardwareState[type] || {}).map((key) => (
          <div key={key} className="flex items-center space-x-4">
            <label className="w-24">{key}</label>
            <input
                type="range"
                min={type === 'motors' ? -1 : 0}
                max={1}
                step={0.1}
                value={hardwareState[type][key]}
                onChange={(e) => updateHardware(type, key, parseFloat(e.target.value))}
            />
            <span>{hardwareState[type][key].toFixed(2)}</span>
          </div>
      ));

  return (
      <BaseView isUnlocked={isUnlocked}>
        <BaseViewHeading isDraggable={isDraggable}>Hardware Control</BaseViewHeading>
        <div className="tabs">
          <button onClick={() => setActiveTab('motors')} className={activeTab === 'motors' ? 'active' : ''}>
            Motors
          </button>
          <button onClick={() => setActiveTab('servos')} className={activeTab === 'servos' ? 'active' : ''}>
            Servos
          </button>
        </div>
        <BaseViewBody>
          {activeTab === 'motors' && renderControls('motors')}
          {activeTab === 'servos' && renderControls('servos')}
        </BaseViewBody>
      </BaseView>
  );
};

export default HardwareView;
