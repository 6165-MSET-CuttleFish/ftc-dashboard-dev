import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import BaseView, { BaseViewHeading } from '@/components/views/BaseView';
import Field from './Field';
import AutoFitCanvas from '@/components/Canvas/AutoFitCanvas';

import OpModeStatus from '@/enums/OpModeStatus';


class FieldView extends React.Component {
  constructor(props) {
    super(props);

    this.canvasRef = React.createRef();
    this.field = null;
    this.renderField = this.renderField.bind(this);
    this.handleSaveToFile = this.handleSaveToFile.bind(this);
    this.handleClearData = this.handleClearData.bind(this);

    this.overlay = { ops: [] };
  }

  componentDidMount() {
    this.field = new Field(this.canvasRef.current);
    this.renderField();
  }

  componentDidUpdate(prevProps) {
    if (this.props.telemetry !== prevProps.telemetry) {
      this.overlay = this.props.telemetry.reduce(
        (acc, { field, fieldOverlay }) =>
          fieldOverlay.ops.length === 0
            ? acc
            : {
                ops: [...field.ops, ...fieldOverlay.ops],
              },
        this.overlay
      );
      this.field.setOverlay(this.overlay);
      this.renderField();
    }
    if (this.props.activeOpModeStatus !== prevProps.activeOpModeStatus) {
      if (this.props.activeOpModeStatus == OpModeStatus.STOPPED) {
        this.handleSaveToFile();
        console.error("Saved!");
      }
      else if (this.props.activeOpModeStatus == OpModeStatus.RUNNING) {
        this.handleClearData(prevProps);
        console.error("Cleared!");
      }
    }

  }

  renderField() {
    if (this.field) {
      this.field.render();
    }
  }

  handleSaveToFile() {
    if (this.field && this.field.getData()) {
      this.field.saveToFile('this gets overwritten why does this param even exist');
      console.log('Field data saved to file.');
    } else {
      console.error('No data available to save.');
    }
  }
  handleClearData(prevProps) {
      if (this.field) {
        this.field.clearData(prevProps.telemetry[0].timestamp);
      }
    }

  handleFileChange = (event) => {
    const files = event.target.files; // This will be a FileList
    this.field.addReplay(files);
  };

  render() {
      return (
        <BaseView isUnlocked={this.props.isUnlocked}>
          <BaseViewHeading isDraggable={this.props.isDraggable}>
            Field
          </BaseViewHeading>
            {/* Button Container */}
            <div className="button-container" style={{ textAlign: 'center' }}>
            {/* Save to File Button */}
            <button
              onClick={this.handleSaveToFile}
              className={`
                border border-yellow-200 bg-yellow-100 transition-colors
                dark:border-transparent dark:bg-yellow-500 dark:text-yellow-50 dark:highlight-white/30
                dark:hover:border-yellow-200 dark:focus:bg-yellow-600
                px-3 py-1 rounded-md cursor-pointer mr-2
                text-center
              `}
            >
              Save to File
            </button>

            {/* Clear Data Button */}
            <button
              onClick={this.handleClearData}
              className={`
                border border-yellow-200 bg-yellow-100 transition-colors
                dark:border-transparent dark:bg-yellow-500 dark:text-yellow-50 dark:highlight-white/30
                dark:hover:border-yellow-200 dark:focus:bg-yellow-600
                px-3 py-1 rounded-md cursor-pointer
                text-center
              `}
            >
              Clear Data
            </button>

          </div>
          {/* File Selector */}
          <div className="file-selector-container" style={{ textAlign: 'center', marginTop: '0.5em' }}>
            <input
              type="file"
              onChange={this.handleFileChange}
              style={{
                padding: '4px',
                border: '1px solid #ccc',
                borderRadius: '2px',
              }}
            multiple
            />
          </div>
          {/* Auto-fitting canvas */}
          <AutoFitCanvas
            ref={this.canvasRef}
            onResize={this.renderField}
            containerHeight="calc(100% - 3em)"
          />
        </BaseView>
      );
    }
  }

FieldView.propTypes = {
  telemetry: PropTypes.array.isRequired,
  isUnlocked: PropTypes.bool,
  activeOpModeStatus: PropTypes.string,
};
const mapStateToProps = (state) => ({
  telemetry: state.telemetry,
  activeOpModeStatus: state.status.activeOpModeStatus
});
// const mapStateToProps = (state) => {
//   return {
//     telemetry: state.telemetry,
//     activeOpModeStatus: state.status.activeOpMode ? state.status.activeOpModeStatus : null,
//   };
// };

export default connect(mapStateToProps)(FieldView);
