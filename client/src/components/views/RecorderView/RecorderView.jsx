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
    this.playbackInterval = null;
    this.startReplayTime = null;
    this.startRecordingTime = null;
    this.isRunning = false;
    this.isReplaying = false;

    this.telemetryRecording = [];
    this.telemetryReplay = [];
    this.currOps = [];

    this.replayUpdateInterval = 100;
    this.replayOnStart = false;

    this.state = {
      savedReplays: [],
      selectedReplay: '',
      replayUpdateInterval: this.replayUpdateInterval,
      replayOnStart: this.replayOnStart,
    };
  }

  componentDidMount() {
    this.loadSavedReplays();
  }

  loadSavedReplays = () => {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith('field_replay_')
    );
    this.setState({ savedReplays: keys });
  };

  handleSaveToLocalStorage = () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('.')[0]; // Removing milliseconds
    const storageKey = `field_replay_${formattedDate}`;

    localStorage.setItem(storageKey, JSON.stringify(this.telemetryRecording));
    console.log(`Saved to localStorage with key: ${storageKey}`);

    this.loadSavedReplays(); // Refresh replay list
  };

  handleLoadTelemetryByFilename = (event) => {
    const filename = event.target.value;
    if (!filename) return;

    const savedTelemetry = localStorage.getItem(filename);
    if (savedTelemetry) {
      this.telemetryReplay = JSON.parse(savedTelemetry);
      this.setState({ selectedReplay: filename });
      console.log(`Loaded telemetry from ${filename}`);
    }
  };

  handleDeleteReplay = (filename) => {
    localStorage.removeItem(filename);
    console.log(`Deleted replay: ${filename}`);

    this.setState((prevState) => ({
      savedReplays: prevState.savedReplays.filter((file) => file !== filename),
      selectedReplay: prevState.selectedReplay === filename ? '' : prevState.selectedReplay,
    }));
  };

  handleDeleteAllReplays = () => {
    const { savedReplays } = this.state;

    if (savedReplays.length === 0) return;

    savedReplays.forEach((filename) => localStorage.removeItem(filename));
    console.log("Deleted all saved replays.");

    this.setState({ savedReplays: [], selectedReplay: '' });
  };

  handleStartPlayback = () => {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
      console.log('Previous playback cleared.');
    }

    this.isReplaying = true;
    this.startPlayback();
  };

  startPlayback = () => {
    if (this.telemetryReplay.length === 0) return;

    let lastIndex = 0;
    let playbackComplete = false;

    this.startReplayTime = Date.now();
    const firstTimestamp = this.telemetryReplay[0].timestamp;

    console.log(`Playback started at: ${this.startReplayTime}`);
    console.log(`First timestamp: ${firstTimestamp}`);

    this.playbackInterval = setInterval(() => {
      const elapsedTime = Date.now() - this.startReplayTime;
      const timeRangeEnd = elapsedTime + this.replayUpdateInterval / 2;

      for (let i = lastIndex; i < this.telemetryReplay.length; i++) {
        const entry = this.telemetryReplay[i];

        if (entry.timestamp <= timeRangeEnd) {
          this.props.setReplayOverlay(entry.ops);
          this.currOps = entry.ops;
          lastIndex = i + 1;
        } else {
          break;
        }
      }

      if (lastIndex + 1 >= this.telemetryReplay.length) {
        playbackComplete = true;
      }

      if (playbackComplete) {
        console.log('Playback completed.');
        this.isReplaying = false;
        clearInterval(this.playbackInterval);
        this.playbackInterval = null;
      }
    }, this.replayUpdateInterval);
  };

  componentDidUpdate(prevProps) {
      if (this.props.activeOpModeStatus !== prevProps.activeOpModeStatus){
          if (this.props.activeOpModeStatus === OpModeStatus.RUNNING && !this.isRunning) {
              this.isRunning = true;
              console.log("Start recording...");
              this.startRecordingTime = Date.now();
              this.telemetryRecording = [];

              if (this.replayOnStart) {
                  this.handleStartPlayback();
              }
          }

          if (this.props.activeOpModeStatus === OpModeStatus.STOPPED && this.isRunning) {
              this.isRunning = false;
              console.log("Stop detected! Saving telemetry...");
              this.handleSaveToLocalStorage();
          }
      }
      if (this.props.telemetry === prevProps.telemetry) {
          return; // No changes, so return early
      }

      if (this.isRunning) {
          // Process telemetry data
          const overlay = this.props.telemetry.reduce(
              (acc, { fieldOverlay }) => ({
                  ops: [...acc.ops, ...(fieldOverlay?.ops || [])],
              }),
              { ops: [] }
          );

          if (overlay.ops.length > 0) {
              const relativeTimestamp = Date.now() - this.startRecordingTime;
              this.telemetryRecording.push({
                  timestamp: relativeTimestamp,
                  ops: overlay.ops,
              });
          }
      }

      // Handle replay overlay
      if (this.isReplaying) {
          const replayOps = this.props.telemetry.reduce(
              (acc, { replayOverlay }) => ({
                  ops: [...(replayOverlay?.ops || [])],
              }),
              { ops: [] }
          );
          if (replayOps.ops.length === 0 && JSON.stringify(this.currOps) !== JSON.stringify(replayOps.ops)) {
              this.props.setReplayOverlay(this.currOps);
              console.log('Setting currOps');
          }
      }
  }

  // Handle changes for replay update interval
  handleReplayUpdateIntervalChange = (event) => {
    const value = parseInt(event.target.value, 10);
    this.replayUpdateInterval = value;
    this.setState({ replayUpdateInterval: value });
  };

  // Handle checkbox for replay on start
  handleReplayOnStartChange = (event) => {
    const checked = event.target.checked;
    this.replayOnStart = checked;
    this.setState({ replayOnStart: checked });
  };

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
              padding: '0.5em 1em',
              backgroundColor: '#4CAF50',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#45a049')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#4CAF50')}
          >
            <i className="fas fa-play-circle" style={{ marginRight: '0px' }}></i>
            Start Playback
          </button>

          <div style={{ marginTop: '1em' }}>
            <label htmlFor="replaySelector" style={{ fontWeight: 'bold', marginRight: '0.5em' }}>
              Select Replay:
            </label>
            <select
              id="replaySelector"
              value={this.state.selectedReplay}
              onChange={this.handleLoadTelemetryByFilename}
              style={{
                padding: '0.5em',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                cursor: 'pointer',
                marginRight: '0.5em',
              }}
            >
              <option value="">-- Choose a Replay --</option>
              {this.state.savedReplays.map((filename) => (
                <option key={filename} value={filename}>
                  {filename.replace('field_replay_', '')}
                </option>
              ))}
            </select>

            <button
              onClick={() => this.handleDeleteReplay(this.state.selectedReplay)}
              disabled={!this.state.selectedReplay}
              style={{
                padding: '0.5em 1em',
                backgroundColor: this.state.selectedReplay ? '#d9534f' : '#ccc',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '4px',
                cursor: this.state.selectedReplay ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.3s ease',
                marginLeft: '0.5em',
              }}
            >
              Delete
            </button>

            <button
              onClick={this.handleDeleteAllReplays}
              disabled={this.state.savedReplays.length === 0}
              style={{
                padding: '0.5em 1em',
                backgroundColor: this.state.savedReplays.length > 0 ? '#d9534f' : '#ccc',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '4px',
                cursor: this.state.savedReplays.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.3s ease',
                marginLeft: '0.5em',
              }}
            >
              Delete All Replays
            </button>
          </div>

          <div style={{ marginTop: '1.5em' }}>
            <label htmlFor="replayUpdateInterval" style={{ marginRight: '0.5em' }}>
              Replay Update Interval (ms):
            </label>
            <input
              type="number"
              id="replayUpdateInterval"
              value={this.state.replayUpdateInterval}
              onChange={this.handleReplayUpdateIntervalChange}
              style={{
                padding: '0.5em',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                marginRight: '0.5em',
              }}
            />
            <label htmlFor="replayOnStart" style={{ marginRight: '0.5em' }}>
              Start Replay on Load:
            </label>
            <input
              type="checkbox"
              id="replayOnStart"
              checked={this.state.replayOnStart}
              onChange={this.handleReplayOnStartChange}
              style={{
                marginRight: '0.5em',
              }}
            />
          </div>

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
  activeOpModeStatus: state.status.activeOpModeStatus,
});

const mapDispatchToProps = {
  setReplayOverlay,
  receiveTelemetry,
};

export default connect(mapStateToProps, mapDispatchToProps)(RecorderView);
