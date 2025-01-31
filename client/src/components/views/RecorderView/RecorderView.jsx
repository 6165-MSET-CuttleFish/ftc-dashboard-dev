import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { updateTelemetryOverlay } from '@/store/actions/telemetry';

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
    this.lastIndex = 0; // Keeps track of the last index of displayed telemetry
    this.isRunning = false;
  }



  // Start playback of the recorded ops
  startPlayback = () => {
    if (this.telemetryHistory.length === 0) return;

    this.startTime = Date.now(); // Record the start time of playback
    const firstTimestamp = this.telemetryHistory[0].timestamp; // Get first recorded time

    console.log(`Playback started at: ${this.startTime}`);
    console.log(`First timestamp: ${firstTimestamp}`);

    this.playbackInterval = setInterval(() => {
      const elapsedTime = Date.now() - this.startTime; // Calculate how much time has passed
      const deltaTime = 100; // Set a fixed deltaTime value (adjustable if needed)

      console.log(`Elapsed time: ${elapsedTime}`); // Log the elapsed time

      // Check the ops within the time range of the current time + deltaTime / 2
      for (let i = this.lastIndex; i < this.telemetryHistory.length; i++) {
        const entry = this.telemetryHistory[i];
        const timeRangeStart = elapsedTime - deltaTime / 2;
        const timeRangeEnd = elapsedTime + deltaTime / 2;

        console.log(`Checking entry at index ${i}: ${entry.timestamp}`);
        console.log(`Time range: ${timeRangeStart} - ${timeRangeEnd}`);

        // Log the timestamp and compare with the time range
        console.log(`Comparing timestamp: ${entry.timestamp} with time range: ${timeRangeStart} - ${timeRangeEnd}`);

        if (entry.timestamp >= timeRangeStart && entry.timestamp <= timeRangeEnd) {
          // If the timestamp is within the current range, display the ops
          console.log(`Displaying ops: ${JSON.stringify(entry.ops)}`);

          this.props.updateTelemetryOverlay({
            ops: entry.ops,
            isReplay: true,  // Set isReplay flag when playing back
          });

          // Update lastIndex to prevent checking the same ops again
          this.lastIndex = i + 1;
        }
        if (this.lastIndex >= this.telemetryHistory.length) {
            break;
            }
      }

      // Stop playback once we reach the last recorded event
      if (elapsedTime >= this.telemetryHistory[this.telemetryHistory.length - 1].timestamp - firstTimestamp) {
        clearInterval(this.playbackInterval);
        this.playbackInterval = null;
      }
    }, 100); // Update every 100ms
  };

  // Track telemetry data and adjust the timestamp
  componentDidUpdate(prevProps) {
    if (this.props.telemetry.isReplay || this.props.telemetry === prevProps.telemetry) return;

    if (this.props.activeOpModeStatus == OpModeStatus.INIT && this.isRunning == false) {
        this.isRunning = true;
        this.startTime = Date.now();

    }



    // Combine ops from telemetry data into the overlay
    this.overlay = this.props.telemetry.data.reduce(
      (acc, { field, fieldOverlay }) =>
        fieldOverlay.ops?.length === 0
          ? acc
          : {
              ops: [...(field.ops || []), ...(fieldOverlay.ops || [])],
            },
      { ops: [] }
    );

    // Store the current ops into the telemetryHistory with adjusted timestamps
    if (!this.props.telemetry.isReplay) {
      // Ensure that the timestamp is relative to the start of the recording
      const relativeTimestamp = Date.now() - this.startTime; // Subtract start time from current time

      this.telemetryHistory.push({
        timestamp: relativeTimestamp,
        ops: this.overlay.ops,
      });

      console.log(`Telemetry added at timestamp: ${relativeTimestamp}`);
    }
  }
render() {
  return (
    <BaseView isUnlocked={this.props.isUnlocked}>
      <BaseViewHeading isDraggable={this.props.isDraggable}>
        Recorder
      </BaseViewHeading>

      {/* Canvas for displaying field */}
      <div className="canvas-container" style={{ marginBottom: '1.5em' }}>
        <AutoFitCanvas
          ref={this.canvasRef}
          containerHeight="calc(100% - 3em)"
        />
      </div>

      {/* Controls Section */}
      <div className="controls-container" style={{ textAlign: 'center' }}>
        {/* Start Playback Button */}
        <button
          onClick={this.startPlayback}
          className="btn btn-play"
          style={{
            padding: '0.8em 1.5em',
            backgroundColor: '#4CAF50', // Green color
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#45a049')} // Darker green on hover
          onMouseOut={(e) => (e.target.style.backgroundColor = '#4CAF50')} // Back to original green
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
    data: PropTypes.arrayOf(PropTypes.object), // Ensure data is an array of objects
  }),
  isDraggable: PropTypes.bool,
  isUnlocked: PropTypes.bool,
  updateTelemetryOverlay: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
   telemetry: state.telemetry,
   activeOpModeStatus: state.status.activeOpModeStatus
 });

const mapDispatchToProps = {
  updateTelemetryOverlay,
};

export default connect(mapStateToProps, mapDispatchToProps)(RecorderView);
