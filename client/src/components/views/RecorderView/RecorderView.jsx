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
    this.startReplayTime = null;
    this.startRecordingTime = null;
    this.isRunning = false;
    this.isReplaying = false;


    this.replayUpdateInterval = 100;

    this.currOps = [];
  }

  handleSaveToLocalStorage = () => {
    const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const storageKey = `telemetryHistory_${currentDate}`;

    localStorage.setItem(storageKey, JSON.stringify(this.telemetryHistory));
    console.log(`Saved to localStorage with key: ${storageKey}`);
  };

  handleLoadFromLocalStorage = () => {
    const keys = Object.keys(localStorage);
    const telemetryKeys = keys.filter((key) => key.startsWith("telemetryHistory_"));

    if (telemetryKeys.length === 0) {
      console.log("No telemetry history found.");
      return;
    }

    // Get the latest saved telemetry key
    const latestKey = telemetryKeys.sort().reverse()[0]; // Sort descending, pick the latest
    const savedTelemetry = localStorage.getItem(latestKey);

    if (savedTelemetry) {
      this.telemetryHistory = JSON.parse(savedTelemetry);
      console.log(`Loaded telemetry from ${latestKey}`);
    }
  };

  handleListSavedTelemetry = () => {
    const keys = Object.keys(localStorage);
    const telemetryKeys = keys.filter((key) => key.startsWith("telemetryHistory_"));

    return telemetryKeys;
  };

  handleLoadTelemetryByDate = (filename) => {
    const storageKey = filename;
    const savedTelemetry = localStorage.getItem(storageKey);
  
      this.telemetryHistory = JSON.parse(savedTelemetry);

  };

  handleStartPlayback = () => {
    // Clear any existing playback interval
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
      console.log("Previous playback cleared.");
    }

    // Start the new playback
    this.isReplaying = true;
    this.startPlayback();
  };

  startPlayback = () => {
    if (this.telemetryHistory.length === 0) return;

    let lastIndex = 0;
    let playbackComplete = false;

    this.startReplayTime = Date.now();
    const firstTimestamp = this.telemetryHistory[0].timestamp;

    console.log(`Playback started at: ${this.startReplayTime}`);
    console.log(`First timestamp: ${firstTimestamp}`);

    this.playbackInterval = setInterval(() => {
      const elapsedTime = Date.now() - this.startReplayTime;
      const timeRangeEnd = elapsedTime + this.replayUpdateInterval / 2;

//       console.log(`Elapsed time: ${elapsedTime}`);

      for (let i = lastIndex; i < this.telemetryHistory.length; i++) {
        const entry = this.telemetryHistory[i];

        if (entry.timestamp <= timeRangeEnd) {

          // Set replay overlay

          this.props.setReplayOverlay(entry.ops);
          this.currOps = entry.ops;

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
        this.isReplaying = false;
        clearInterval(this.playbackInterval);
        this.playbackInterval = null;
      }
    }, this.replayUpdateInterval);
  };

  componentDidUpdate(prevProps) {
    if (this.props.telemetry === prevProps.telemetry) return;

    if (this.props.activeOpModeStatus === OpModeStatus.INIT && !this.isRunning) {
      this.isRunning = true;
      this.startRecordingTime = Date.now();
      this.telemetryHistory = [];
    }

    if (this.props.activeOpModeStatus === OpModeStatus.STOPPED && this.isRunning) {
      this.isRunning = false;
    }

    // Aggregate ops from both field and fieldOverlay (ensure both are arrays)
    const overlay = this.props.telemetry.reduce(
      (acc, { fieldOverlay }) => ({
        ops: [
          ...acc.ops,
          ...(fieldOverlay?.ops || []),
        ],
      }),
      { ops: [] }
    );

    // Only record telemetry if it's not in replay mode
    if (overlay.ops.length > 0) {
      const relativeTimestamp = Date.now() - this.startRecordingTime;

      this.telemetryHistory.push({
        timestamp: relativeTimestamp,
        ops: overlay.ops,
      });
    }


    if (this.isReplaying) {
        const replayOps = this.props.telemetry.reduce(
              (acc, { replayOverlay }) => ({
                ops: [
                  ...(replayOverlay?.ops || []),
                ],
              }),
              { ops: [] }
            );
        if (replayOps.ops.length === 0 && JSON.stringify(this.currOps) !== JSON.stringify(replayOps.ops)) {
          this.props.setReplayOverlay(this.currOps);
          console.error("setting currOps");
        }

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
