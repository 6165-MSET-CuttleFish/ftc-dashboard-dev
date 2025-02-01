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

    this.replayUpdateInterval = 20;
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

    // Step 1: Get the current size of localStorage
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      totalSize += new Blob([localStorage.getItem(key)]).size;
    }
    console.log('Current total localStorage size:', totalSize);

    // Step 2: Calculate the size of the data you're about to save
    const dataToSave = JSON.stringify(this.telemetryRecording);
    const newDataSize = new Blob([dataToSave]).size;
    console.log('Size of data to save:', newDataSize);

    // Step 3: Check if saving this new data will exceed the localStorage quota (5MB)
    const maxStorageSize = 5 * 1024 * 1024; // 5MB in bytes
    if (totalSize + newDataSize > maxStorageSize) {
      console.error('Cannot save data. LocalStorage quota exceeded.');
      // Optionally, remove the oldest data or clear out old replays to free space
      // this.handleDeleteOldestReplay(); // Implement this function if needed
      return; // Prevent saving if exceeding quota
    }


    localStorage.setItem(storageKey, dataToSave);
    console.log(`Saved to localStorage with key: ${storageKey}`);


    this.loadSavedReplays(); // Refresh replay list
  };


  handleLoadTelemetryByFilename = (event) => {
    const selectedFiles = Array.from(event.target.selectedOptions, (option) => option.value);
    if (selectedFiles.length === 0) return;

    this.setState({
      selectedReplay: selectedFiles[0],  // Update selectedReplay here
    });

    this.telemetryReplay = []; // Reset the array to hold new telemetry data

    selectedFiles.forEach((filename) => {
      const savedTelemetry = localStorage.getItem(filename);
      if (savedTelemetry) {
        const parsedTelemetry = JSON.parse(savedTelemetry);
        this.telemetryReplay.push(parsedTelemetry); // Store each file's telemetry as a new array inside the 2D array
      }
    });
    this.setState({ selectedReplays: selectedFiles });
    console.log(`Loaded telemetry from ${selectedFiles.join(', ')}`);
  };

  handleDeleteReplay = () => {
    const { selectedReplay } = this.state;

    if (!selectedReplay) return; // No replay selected, do nothing

    localStorage.removeItem(selectedReplay);
    this.telemetryReplay = [];
    this.currOps = [[]];
    console.log(`Deleted replay: ${selectedReplay}`);

    this.setState((prevState) => ({
      savedReplays: prevState.savedReplays.filter((file) => file !== selectedReplay),
      selectedReplay: prevState.selectedReplay === selectedReplay ? '' : prevState.selectedReplay,
    }));
  };

  handleDeleteAllReplays = () => {
    const { savedReplays } = this.state;

    if (savedReplays.length === 0) return;

    savedReplays.forEach((filename) => localStorage.removeItem(filename));
    this.telemetryReplay = [];
    this.currOps = [[]];
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

    let lastIndex = new Array(this.telemetryReplay.length).fill(0);
    let playbackComplete = false;
    let ops = [[]];

    this.startReplayTime = Date.now();

    console.log(`Playback started at: ${this.startReplayTime}`);

    this.playbackInterval = setInterval(() => {

      const elapsedTime = Date.now() - this.startReplayTime;
      const timeRangeEnd = elapsedTime + this.replayUpdateInterval / 2;

      // Update the operations for each replay
      
      for (let replayIndex = 0; replayIndex < this.telemetryReplay.length; replayIndex++) {
        let isUpdated = false;
        for (let i = lastIndex[replayIndex]; i < this.telemetryReplay[replayIndex].length; i++) {
          const entry = this.telemetryReplay[replayIndex][i];

          if (entry.timestamp <= timeRangeEnd) {
            if (!isUpdated) {
              ops[replayIndex] = []; // Clear previous operations
              isUpdated = true;
            }
            ops[replayIndex].push(...entry.ops);
            lastIndex[replayIndex] = i + 1;
          } else {
            break;
          }
        }
      }


      // Push the current operations to the overlay
      this.currOps = ops.flat();


      if (JSON.stringify(this.currOps).length > 0) {
        this.props.setReplayOverlay(this.currOps);
      }

      if (lastIndex.every((index, idx) => index >= (this.telemetryReplay[idx]?.length || 0))) {
        playbackComplete = true;
      }

      if (playbackComplete) {
        this.clearPlayback();
        console.log('Playback completed.');

      }
    }, this.replayUpdateInterval);
  };

  clearPlayback() {
      this.isReplaying = false;
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
  }

  compareOverlays = (prevOverlay, currentOverlay) => {
    return JSON.stringify(currentOverlay.ops) !== JSON.stringify(prevOverlay.ops);
  };

  componentDidUpdate(prevProps) {
    if (this.props.activeOpModeStatus === OpModeStatus.STOPPED && this.isRunning) {
      this.isRunning = false;
      console.log("Stop detected! Saving telemetry...");
      this.handleSaveToLocalStorage();
    }

    if (this.props.telemetry === prevProps.telemetry) {
      return; // No changes, so return early
    }

    const overlay = this.props.telemetry.reduce(
      (acc, { fieldOverlay }) => ({
        ops: [...acc.ops, ...(fieldOverlay?.ops || [])],
      }),
      { ops: [] }
    );

    const prevOverlay = prevProps.telemetry.reduce(
      (acc, { fieldOverlay }) => ({
        ops: [...acc.ops, ...(fieldOverlay?.ops || [])],
      }),
      { ops: [] }
    );

    // Check if overlay has any undefined ops
    if (overlay.ops.some(op => op === undefined)) {
      console.error("Undefined operation found in current telemetry overlay!");
      return; // Do not continue if there are undefined operations
    }

    if (this.compareOverlays(prevOverlay, overlay)) {

      if (this.props.activeOpModeStatus === OpModeStatus.INIT && !this.isRunning) {
        this.isRunning = true;
        console.log("Start recording...");
        this.startRecordingTime = Date.now();
        this.telemetryRecording = [];
        this.currOps = [];

        if (this.replayOnStart) {
          this.handleStartPlayback();
        }
      }
    }

    if (this.isRunning) {
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
      const currOpsStr = JSON.stringify(this.currOps);
      if (replayOps.ops.length === 0 && currOpsStr !== JSON.stringify(replayOps.ops) && currOpsStr.length > 0) {
        this.props.setReplayOverlay(this.currOps);
        console.warn("setting replay overlay");
      }
    }
  }

  handleReplayUpdateIntervalChange = (event) => {
    const value = parseInt(event.target.value, 10);
    this.replayUpdateInterval = value;
    this.setState({ replayUpdateInterval: value });
  };

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
                  multiple
                  value={this.state.selectedReplays}
                  onChange={this.handleLoadTelemetryByFilename}
                  style={{
                    padding: '0.5em',
                    fontSize: '14px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    marginRight: '0.5em',
                    height: '100px',
                  }}
                >
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
          </div>
          <div style={{ marginTop: '1.5em' }}>
            <label htmlFor="replayOnStart" style={{ marginRight: '0.5em' }}>
              Start Replay with OpMode:
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
