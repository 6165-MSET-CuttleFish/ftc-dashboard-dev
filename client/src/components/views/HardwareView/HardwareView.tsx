import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/reducers';
import BaseView, { BaseViewHeading, BaseViewBody } from '../BaseView';

const HardwareView = () => {
    const [activeTab, setActiveTab] = useState<'motors' | 'servos'>('motors');
    const hardwareState = useSelector((state: RootState) => state.hardware);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch({ type: 'GET_HARDWARE_STATE' });
    }, [dispatch]);

    const updateHardware = (type: 'motors' | 'servos', name: string, value: number) => {
        dispatch({
            type: 'UPDATE_HARDWARE_STATE',
            payload: { type, name, value },
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
        <BaseView>
            <BaseViewHeading>Hardware Control</BaseViewHeading>
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
