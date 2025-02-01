import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { updateTelemetryOverlay, clearTelemetry, receiveTelemetry } from '@/store/actions/telemetry';

import BaseView, { BaseViewHeading } from '@/components/views/BaseView';
import AutoFitCanvas from '@/components/Canvas/AutoFitCanvas';

import OpModeStatus from '@/enums/OpModeStatus';

class RecorderView extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.telemetryHistory = [];
    this.playbackInterval = null;
    this.startTime = null;
    this.isRunning = false;
  }

  handleStartPlayback = () => {
    // Clear any existing playback interval
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null; // Reset the interval
      console.log("Previous playback cleared.");
    }

    // Start the new playback
    this.startPlayback();
  };

  startPlayback = () => {
    if (this.telemetryHistory.length === 0) return;

    let lastIndex = 0;
    let playbackComplete = false;

    this.startTime = Date.now();
    const firstTimestamp = this.telemetryHistory[0].timestamp;

    console.log(`Playback started at: ${this.startTime}`);
    console.log(`First timestamp: ${firstTimestamp}`);

    this.playbackInterval = setInterval(() => {
      const elapsedTime = Date.now() - this.startTime;
      const deltaTime = 50; // Time interval between updates
      const timeRangeStart = elapsedTime;
      const timeRangeEnd = elapsedTime + deltaTime / 2;

      console.log(`Elapsed time: ${elapsedTime}`);

      for (let i = lastIndex; i < this.telemetryHistory.length; i++) {
        const entry = this.telemetryHistory[i];

        if (entry.timestamp >= timeRangeStart && entry.timestamp <= timeRangeEnd) {
          // Only process if we have a matching entry
          this.props.receiveTelemetry([
            {
              data: { ops: [] }, // Placeholder for actual telemetry data
              field: { ops: [] },
              isReplay: true,
              fieldOverlay: { ops: [] }, // Placeholder for overlays
              log: [],
              timestamp: entry.timestamp,
            },
          ]);

          this.props.updateTelemetryOverlay({
            ops: entry.ops,
            isReplay: true,
          });

          lastIndex = i + 1; // Update lastIndex to prevent reprocessing this entry
        }

        // If we're still processing entries, don't stop the interval
        if (lastIndex >= this.telemetryHistory.length) {
          playbackComplete = true;
        }
      }

      // Stop the interval if playback is complete
      if (playbackComplete) {
        console.log("Playback completed.");
        clearInterval(this.playbackInterval);
        this.playbackInterval = null;
      }
    }, 50); // Update every 50ms
  };

  componentDidUpdate(prevProps) {
    if (this.props.telemetry.isReplay || this.props.telemetry === prevProps.telemetry) return;

    if (this.props.activeOpModeStatus == OpModeStatus.INIT && this.isRunning == false) {
      this.isRunning = true;
      this.startTime = Date.now();
      this.telemetryHistory = [];
    }
    if (this.props.activeOpModeStatus == OpModeStatus.STOPPED && this.isRunning == true) {
      this.isRunning = false;
    }

    this.overlay = this.props.telemetry.data.reduce(
      (acc, { field, fieldOverlay }) =>
        fieldOverlay.ops?.length === 0
          ? acc
          : {
              ops: [...(field.ops || []), ...(fieldOverlay.ops || [])],
            },
      { ops: [] }
    );

    if (!this.props.telemetry.isReplay) {
      const relativeTimestamp = Date.now() - this.startTime;

      this.telemetryHistory.push({
        timestamp: relativeTimestamp,
        ops: this.overlay.ops,
      });

      //       console.log(`Telemetry added at timestamp: ${relativeTimestamp}`);
    }
  }

  render() {
    return (
      <BaseView isUnlocked={this.props.isUnlocked}>
        <BaseViewHeading isDraggable={this.props.isDraggable}>
          Recorder
        </BaseViewHeading>

        <div className="canvas-container" style={{ marginBottom: '1.5em' }}>
          <AutoFitCanvas ref={this.canvasRef} containerHeight="calc(100% - 3em)" />
        </div>

        <div className="controls-container" style={{ textAlign: 'center' }}>
          <button
            onClick={this.handleStartPlayback}
            className="btn btn-play"
            style={{
              padding: '0.8em 1.5em',
              backgroundColor: '#4CAF50',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#45a049')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#4CAF50')}
          >
            <i className="fas fa-play-circle" style={{ marginRight: '10px' }}></i>
            Start Playback
          </button>
        </div>
      </BaseView>
    );
  }
}

RecorderView.propTypes = {
  telemetry: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.object),
  }),
  isDraggable: PropTypes.bool,
  isUnlocked: PropTypes.bool,
  updateTelemetryOverlay: PropTypes.func.isRequired, // Fixed prop name
  clearTelemetry: PropTypes.func.isRequired,         // Fixed prop name
  receiveTelemetry: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  telemetry: state.telemetry,
  activeOpModeStatus: state.status.activeOpModeStatus,
});

const mapDispatchToProps = {
  updateTelemetryOverlay, // Corrected function
  clearTelemetry,
  receiveTelemetry, // Corrected function
};

export default connect(mapStateToProps, mapDispatchToProps)(RecorderView);
