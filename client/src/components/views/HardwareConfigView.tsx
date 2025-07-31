import { Component, ChangeEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { RootState } from '@/store/reducers';
import OpModeStatus from '@/enums/OpModeStatus';
import BaseView, {
  BaseViewHeading,
  BaseViewBody,
  BaseViewProps,
  BaseViewHeadingProps,
} from './BaseView';

import { setHardwareConfig } from '@/store/actions/hardwareconfig';
import { writeHardwareConfig } from '@/store/actions/hardwareconfig';
import { STOP_OP_MODE_TAG } from '@/store/types';

type HardwareConfigViewState = {
  selectedHardwareConfig: string;
  editedConfigText: string;
};

const mapStateToProps = ({ status, hardwareConfig }: RootState) => ({
  ...status,
  ...hardwareConfig,
});

const mapDispatchToProps = {
  setHardwareConfig: (hardwareConfig: string) => setHardwareConfig(hardwareConfig),
  writeHardwareConfig: (hardwareConfig: string, hardwareConfigContents: string) => writeHardwareConfig(hardwareConfig, hardwareConfigContents),
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type HardwareConfigViewProps = ConnectedProps<typeof connector> &
  BaseViewProps &
  BaseViewHeadingProps;

const ActionButton = ({
  children,
  className,
  ...props
}: JSX.IntrinsicElements['button']) => (
  <button
    className={`ml-2 rounded-md border py-1 px-3 shadow-md ${className}`}
    {...props}
  >
    {children}
  </button>
);

class HardwareConfigView extends Component<HardwareConfigViewProps, HardwareConfigViewState> {
  constructor(props: HardwareConfigViewProps) {
    super(props);

    this.state = {
      selectedHardwareConfig: '',
      editedConfigText: '',
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(evt: ChangeEvent<HTMLSelectElement>) {
    const selected = evt.target.value;
    const index = this.props.hardwareConfigList.indexOf(selected);
    const text = index !== -1 ? this.props.hardwareConfigFiles[index] : '';
    this.setState({
      selectedHardwareConfig: selected,
      editedConfigText: text,
    });
  }


  componentDidUpdate(prevProps: Readonly<HardwareConfigViewProps>) {
    if (prevProps.currentHardwareConfig !== this.props.currentHardwareConfig) {
      const index = this.props.hardwareConfigList.indexOf(this.props.currentHardwareConfig);
      const newText = index !== -1 ? this.props.hardwareConfigFiles[index] : '';
      this.setState({
        selectedHardwareConfig: this.props.currentHardwareConfig,
        editedConfigText: newText,
      });
    }
    // When selecting from dropdown
    if (prevProps.hardwareConfigFiles !== this.props.hardwareConfigFiles && this.state.selectedHardwareConfig) {
      const idx = this.props.hardwareConfigList.indexOf(this.state.selectedHardwareConfig);
      if (idx !== -1) {
        this.setState({ editedConfigText: this.props.hardwareConfigFiles[idx] });
      }
    }
  }


  renderSetButton() {
    return (
      <ActionButton
        className={`
          border-blue-300 bg-blue-200 transition-colors
          dark:border-transparent dark:bg-blue-600 dark:text-blue-50 dark:highlight-white/30
          dark:hover:border-blue-400/80 dark:focus:bg-blue-700
        `}
        onClick={() => this.props.setHardwareConfig(this.state.selectedHardwareConfig)}
      >
        Set
      </ActionButton>
    );
  }

  renderSaveButton() {
    const { selectedHardwareConfig, editedConfigText } = this.state;
    const save = (editedConfigText?.length ?? 0) !== 0 ? editedConfigText : "<Robot type=\"FirstInspires-FTC\">\n</Robot>"
    return (
      <ActionButton
        className="
          mt-2 border-green-400 bg-green-300 transition-colors
          dark:border-transparent dark:bg-green-600 dark:text-white
          dark:hover:border-green-400/80 dark:focus:bg-green-700
        "
        onClick={() => this.props.writeHardwareConfig(selectedHardwareConfig, save)}
      >
        Save
      </ActionButton>
    );
  }

  renderButtons() {
    const { activeOpModeStatus, hardwareConfigList, activeOpMode } = this.props;

    if (hardwareConfigList.length === 0) {
      return null;
    } else if (activeOpModeStatus === OpModeStatus.STOPPED || activeOpMode === STOP_OP_MODE_TAG) {
      return (
            <div className="flex flex-wrap items-center">
              {this.renderSetButton()}
              {this.renderSaveButton()}
            </div>
          );
    }
  }

  render() {
    const {
      available,
      activeOpModeStatus,
      hardwareConfigList,
      hardwareConfigFiles,
      activeOpMode,
    } = this.props;

    if (!available) {
      return (
        <BaseView isUnlocked={this.props.isUnlocked}>
          <BaseViewHeading isDraggable={this.props.isDraggable}>
          Hardware Config
          </BaseViewHeading>
          <BaseViewBody className="flex-center">
            <h3 className="text-md text-center">
            Hardware Config controls have not initialized
            </h3>
          </BaseViewBody>
        </BaseView>
      );
    }

    return (
      <BaseView isUnlocked={this.props.isUnlocked}>
        <div className="flex">
          <BaseViewHeading isDraggable={this.props.isDraggable}>
            Hardware Config
          </BaseViewHeading>
        </div>
        <BaseViewBody>
          <span
            style={
              this.state.selectedHardwareConfig === this.props.currentHardwareConfig
                ? {
                    userSelect: 'none',
                    opacity: 0.0,
                  }
                : {
                    userSelect: 'auto',
                    opacity: 1.0,
                  } 
            }
          >
            *
          </span>
          <select
            className={`
              m-1 mr-2 rounded border border-gray-300 bg-gray-200 p-1 pr-6 
              shadow-md transition focus:border-primary-500
              focus:ring-primary-500 disabled:text-gray-600 disabled:shadow-none
              dark:border-slate-500/80 dark:bg-slate-700 dark:text-slate-200
            `}
            value={this.state.selectedHardwareConfig}
            disabled={
              activeOpModeStatus !== OpModeStatus.STOPPED && activeOpMode !== STOP_OP_MODE_TAG
            }
            onChange={this.onChange}
          >
            {hardwareConfigList.length === 0 ? (
              <option>Loading...</option>
            ) : (
              hardwareConfigList
                .sort()
                .map((opMode: string) => <option key={opMode}>{opMode}</option>)
            )}
          </select>
          {this.renderButtons()}



          {this.state.selectedHardwareConfig && hardwareConfigFiles?.[hardwareConfigList.indexOf(this.state.selectedHardwareConfig)] && (
            <div className="mt-4 rounded bg-gray-100 p-3 text-sm dark:bg-slate-800 dark:text-slate-200">
              <h4 className="mb-2 font-semibold">Selected Config Details:</h4>
              <textarea
                className="w-full rounded border bg-white p-2 font-mono text-xs shadow-inner dark:bg-slate-700 dark:text-slate-100"
                rows={15}
                value={this.state.editedConfigText}
                onChange={(e) => this.setState({ editedConfigText: e.target.value })}
              />
            </div>
          )}
        </BaseViewBody>
      </BaseView>
    );
  }
}

export default connector(HardwareConfigView);
