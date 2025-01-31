import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { updateTelemetryOverlay } from '@/store/actions/telemetry';

import BaseView, { BaseViewHeading } from '@/components/views/BaseView';
import AutoFitCanvas from '@/components/Canvas/AutoFitCanvas';

class RecorderView extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();


    // Store the ops history with timestamps
    this.telemetryHistory = [];
    this.playbackInterval = null;
    this.startTime = null;
  }

  // Function to add a telemetry overlay
  addTelemetryOverlay = () => {
    const newOverlay = {
      ops: [
        {
          type: 'stroke',
          color: 'red',
        },
        {
          color: 'red',
          type: 'circle',
          x: 100,
          y: 100,
          radius: 50,
        },
      ],
    };

    // Save the current ops to history with a timestamp


    // Dispatch action to update telemetry overlay
    this.props.updateTelemetryOverlay(newOverlay);
  };

  // Function to play back the recorded ops
  startPlayback = () => {
    if (this.telemetryHistory.length === 0) return;

    this.startTime = Date.now();
    const firstTimestamp = this.telemetryHistory[0].timestamp; // Get first recorded time

    this.playbackInterval = setInterval(() => {
      const elapsedTime = Date.now() - this.startTime;

      // Get the ops that should be played at this point in time
      const opsToPlay = this.telemetryHistory.filter(
        (entry) => entry.timestamp - firstTimestamp <= elapsedTime // Compare relative to first timestamp
      );

      if (opsToPlay.length > 0) {
        const lastOps = opsToPlay[opsToPlay.length - 1];
        this.props.updateTelemetryOverlay({
          ops: lastOps.ops,
          isReplay: true,
        });
      }

      // Stop playback once we reach the last recorded event
      if (elapsedTime >= this.telemetryHistory[this.telemetryHistory.length - 1].timestamp - firstTimestamp) {
        clearInterval(this.playbackInterval);
        this.playbackInterval = null;
      }
    }, 50); // Update every 50ms
  };


  componentDidUpdate(prevProps) {
    if (this.props.telemetry === prevProps.telemetry) return;

    if (this.props.telemetry.some((item) => item.isReplay)) return;

    const newOps = this.props.telemetry.reduce(
        (acc, { field, fieldOverlay }) => ({
          ops: [...acc.ops, ...field.ops, ...fieldOverlay.ops],
        }),
        { ops: [] }
      );

    this.telemetryHistory.push({
      timestamp: Date.now(),
      ops: newOps.ops,
    });



    console.error(this.telemetryHistory); // Log telemetry to see changes
  }

  render() {
    return (
      <BaseView isUnlocked={this.props.isUnlocked}>
        <BaseViewHeading isDraggable={this.props.isDraggable}>
          Recorder View
        </BaseViewHeading>
        <AutoFitCanvas
          ref={this.canvasRef}
          containerHeight="calc(100% - 3em)"
        />
        <button onClick={this.addTelemetryOverlay}>Add Telemetry Overlay</button>
        <button onClick={this.startPlayback}>Start Playback</button>
      </BaseView>
    );
  }
}

RecorderView.propTypes = {
  telemetry: PropTypes.arrayOf(PropTypes.object).isRequired,
  isDraggable: PropTypes.bool,
  isUnlocked: PropTypes.bool,
  updateTelemetryOverlay: PropTypes.func.isRequired,
};

const mapStateToProps = ({ telemetry }) => ({
  telemetry,
});

const mapDispatchToProps = {
  updateTelemetryOverlay,
};

export default connect(mapStateToProps, mapDispatchToProps)(RecorderView);
