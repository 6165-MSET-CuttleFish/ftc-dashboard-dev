import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setReplayOverlay, receiveTelemetry } from '@/store/actions/telemetry';

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
      this.playbackInterval = null;
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
      const deltaTime = 25; // Time interval between updates
      const timeRangeEnd = elapsedTime + deltaTime / 2;

      console.log(`Elapsed time: ${elapsedTime}`);

      for (let i = lastIndex; i < this.telemetryHistory.length; i++) {
        const entry = this.telemetryHistory[i];

        if (entry.timestamp <= timeRangeEnd) {
          // Reset telemetry data if op mode is stopped
//           if (this.props.activeOpModeStatus === OpModeStatus.STOPPED) {
//             this.props.receiveTelemetry([
//               {
//                 data: { ops: [] },
//                 field: { ops: [] },
//                 isReplay: true,
//                 fieldOverlay: { ops: [] },
//                 replayOverlay: { ops: [] },
//                 log: [],
//                 timestamp: entry.timestamp,
//               },
//             ]);
//           }
//
          // Set replay overlay

          this.props.setReplayOverlay(entry.ops);

          lastIndex = i + 1;
        } else {
          break;
        }
      }

      if (lastIndex + 1 >= this.telemetryHistory.length) {
        playbackComplete = true;
      }

      if (playbackComplete) {
        console.log("Playback completed.");
        clearInterval(this.playbackInterval);
        this.playbackInterval = null;
      }
    }, 25);
  };

  componentDidUpdate(prevProps) {
    if (this.props.telemetry.isReplay || this.props.telemetry === prevProps.telemetry) return;

    if (this.props.activeOpModeStatus === OpModeStatus.INIT && !this.isRunning) {
      this.isRunning = true;
      this.startTime = Date.now();
      this.telemetryHistory = [];
    }

    if (this.props.activeOpModeStatus === OpModeStatus.STOPPED && this.isRunning) {
      this.isRunning = false;
    }

    // Aggregate ops from both field and fieldOverlay (ensure both are arrays)
    const overlay = this.props.telemetry.reduce(
      (acc, { field, fieldOverlay }) => ({
        ops: [
          ...acc.ops,
          ...(field?.ops || []),            // Ensure field.ops is always an array
          ...(fieldOverlay?.ops || []),      // Ensure fieldOverlay.ops is always an array
        ],
      }),
      { ops: [] }
    );

    // Only record telemetry if it's not in replay mode
    if (!this.props.telemetry.isReplay) {
      const relativeTimestamp = Date.now() - this.startTime;

      this.telemetryHistory.push({
        timestamp: relativeTimestamp,
        ops: overlay.ops,
      });
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
  telemetry: PropTypes.array.isRequired,
  isUnlocked: PropTypes.bool,
  activeOpModeStatus: PropTypes.string,
  receiveTelemetry: PropTypes.func.isRequired,
  setReplayOverlay: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  telemetry: state.telemetry,
  activeOpModeStatus: state.status.activeOpModeStatus
});

const mapDispatchToProps = {
  setReplayOverlay,
  receiveTelemetry,
};

export default connect(mapStateToProps, mapDispatchToProps)(RecorderView);
