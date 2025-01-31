import { cloneDeep } from 'lodash';
import { findDOMNode } from 'react-dom';


const SAVE_IGNORE = ["alpha", "image"]; //change this based on what you're displaying


// align coordinate to the nearest pixel, offset by a half pixel
// this helps with drawing thin lines; e.g., if a line of width 1px
// is drawn on an integer coordinate, it will be 2px wide
// x is assumed to be in *device* pixels
function alignCoord(x, scaling) {
  const roundX = Math.round(x * scaling);
  return (roundX + 0.5 * Math.sign(x - roundX)) / scaling;
}

function arrToDOMMatrix(arr) {
  return window.DOMMatrix.fromFloat64Array(Float64Array.from(arr));
}

CanvasRenderingContext2D.prototype.getScalingFactors = function () {
  let transform;
  if (typeof this.getTransform === 'function') {
    transform = this.getTransform();
  } else if (typeof this.mozCurrentTransform !== 'undefined') {
    transform = arrToDOMMatrix(this.mozCurrentTransform);
  } else {
    throw new Error('unable to find canvas transform');
  }

  const { a, b, c, d } = transform;
  const scalingX = Math.sqrt(a * a + c * c);
  const scalingY = Math.sqrt(b * b + d * d);

  return {
    scalingX,
    scalingY,
  };
};

// TODO: Avoid calling getScalingFactors() when we know the scale isn't changing.
CanvasRenderingContext2D.prototype.fineMoveTo = function (x, y) {
  const { scalingX, scalingY } = this.getScalingFactors();
  this.moveTo(alignCoord(x, scalingX), alignCoord(y, scalingY));
};

CanvasRenderingContext2D.prototype.fineLineTo = function (x, y) {
  const { scalingX, scalingY } = this.getScalingFactors();
  this.lineTo(alignCoord(x, scalingX), alignCoord(y, scalingY));
};

const images = {};
const fieldsToRender = [];

function loadImage(src) {
  if (images[src]) {
    return images[src];
  }

  const image = new Image();
  image.onload = function () {
    fieldsToRender.forEach((field) => field.render());
  };
  image.src = src;
  images[src] = image;
  return image;
}

// all dimensions in this file are *CSS* pixels unless otherwise stated
const DEFAULT_OPTIONS = {
  padding: 15,
  fieldSize: 12 * 12, // feet
  splineSamples: 250,
  gridLineWidth: 1, // device pixels
  gridLineColor: 'rgb(120, 120, 120)',
};


export default class Field {
  constructor(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.options = cloneDeep(DEFAULT_OPTIONS);
    Object.assign(this.options, options || {});

    this.overlay = {
      ops: [],
    };
    this.fileOutput = "";
    this.startTime = Date.now()
    this.replay = "";
    this.prevReplayLine = -1;
    this.prevElapsedTime = 0;
  }
  getData(){
    return(this.fileOutput);
  }

  clearData(){
      this.fileOutput = "";
      this.startTime = Date.now();
      this.prevReplayLine = -1;
    }

    /* Old addreplay
  addReplay(files){
    this.replay = ""
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const reader = new FileReader();
        reader.onload = (e) => {
          const fileContent = e.target.result; // This will contain the content of the file
  //         console.log(file.name, fileContent);
          this.replay = (this.replay || "") + "\n" + fileContent;
        };

        reader.readAsText(file);
      }
  }
*/





addReplay(files) {
  let allLines = [];

//  // Add current replay lines
//  if (this.replay) {
//    const replayLines = this.replay.split('\n');
//    replayLines.forEach(line => {
//      const timestamp = parseInt(line.split('@')[0]);
//      if (!isNaN(timestamp)) {
//        allLines.push({ line, timestamp });
//      }
//    });
//  }

  // Read lines from the files and add them to allLines
  let filesLoaded = 0;

  for (const file of files) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      const fileLines = fileContent.split('\n');

      fileLines.forEach(line => {
        const timestamp = parseInt(line.split('@')[0]);
        if (!isNaN(timestamp)) {
          allLines.push({ line, timestamp });
        }
      });

      filesLoaded++;

      // When all files are loaded, sort and update the replay
      if (filesLoaded === files.length) {
        // Sort lines by timestamp
        allLines.sort((a, b) => a.timestamp - b.timestamp);

        // Join the sorted lines back into a single string
        this.replay = allLines.map(item => item.line).join('\n');
        console.error(this.replay);  // This will show the updated replay
      }
    };
    reader.readAsText(file);
  }
}



  loadReplaysWithField(width, height, fieldSize, fileContent, currTime, deltaTime) {
    const lines = fileContent.split('\n');
    let replayOps = [];
    let maxIndex = 0;
    let stop = false;
    for (let i = this.prevReplayLine + 1; i < lines.length && !stop; i++) {
      stop = false;
      let line = lines[i];
      if (parseInt(line.split('@')[0]) - currTime < deltaTime/2) {
        replayOps.push(JSON.parse(line.split('@')[1]));
        maxIndex = i;
      } else { stop = true; }
      this.prevReplayLine = maxIndex;
    }

    console.error(deltaTime);

    console.error("prev: " + this.prevReplayLine);
//    console.log("Operations to render:", this.overlay.ops);  //debug
    // console.log("Replay Operations to render:", replayOps); //debug
//    console.log("time: " ,currTime);

    for (let op of this.overlay.ops) {
      if (!(SAVE_IGNORE.includes(op.type))){
        this.fileOutput = (this.fileOutput || '') + (currTime) + "@" + JSON.stringify(op) + '\n';
      }
    }


    this.renderField(
      (width - fieldSize) / 2,
      (height - fieldSize) / 2,
      fieldSize,
      fieldSize,
      replayOps.concat(this.overlay.ops),
      currTime,
    );

  }

  saveToFile(filename) {
    const now = new Date();

    const month = now.getMonth() + 1; // getMonth() is 0-indexed, so we add 1
    const day = now.getDate();
    const year = now.getFullYear().toString().slice(-2); // Get last 2 digits of the year

    const formattedDate = `${month}_${day}_${year}`;

    const hours = now.getHours().toString().padStart(2, '0');   // Get hours in 24-hour format
    const minutes = now.getMinutes().toString().padStart(2, '0'); // Get minutes
    const seconds = now.getSeconds().toString().padStart(2, '0'); // Get seconds

    const formattedTime = `${hours}_${minutes}_${seconds}`;

    filename = "field_replay_" + formattedDate + "_" + formattedTime;


    const data = this.getData(); // this.fileOutput // also this.fileOutput doesnt work correctly it should add to a string not like overwrite but whatever
    let newData = "";
    let initialTime = parseInt(data.split("\n")[0].split('@')[0]);
    data.split("\n").forEach((line, index) => {

        const timestamp = parseInt(line.split('@')[0]);
        const newTime = timestamp - initialTime;
        newData += newTime + "@" + line.split('@')[1] + "\n";
    });

    this.clearData();

    // Create a Blob with the data
    const blob = new Blob([newData], { type: 'text/plain' });

    // Create an anchor element and set its href to the Blob URL
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Programmatically click the anchor element to trigger the download
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  setOverlay(overlay) {
    this.overlay = overlay;
  }

  render() {
    // eslint-disable-next-line
    this.canvas.width = this.canvas.width; // clears the canvas

    // scale the canvas to facilitate the use of CSS pixels
    this.ctx.scale(devicePixelRatio, devicePixelRatio);

    const width = this.canvas.width / devicePixelRatio;
    const height = this.canvas.height / devicePixelRatio;
    const smallerDim = width < height ? width : height;
    const fieldSize = smallerDim - 2 * this.options.padding;

    if (fieldsToRender.indexOf(this) === -1) {
      fieldsToRender.push(this);
    }


    let elapsedTime = Date.now() - this.startTime;

    let deltaTime = elapsedTime - this.prevElapsedTime;

    this.prevElapsedTime = elapsedTime;


//    this.renderField(
//          (width - fieldSize) / 2,
//          (height - fieldSize) / 2,
//          fieldSize,
//          fieldSize,
//          this.overlay.ops,
//          [],
//          elapsedTime,
//        );
    this.loadReplaysWithField(width, height, fieldSize, this.replay, elapsedTime, deltaTime);
  }

  renderField(x, y, width, height, ops) {
    const o = this.options;
    this.ctx.save();

    this.ctx.translate(x, y);
    this.ctx.scale(width / o.fieldSize, height / o.fieldSize);
    const pageTransform = this.ctx.getTransform();

    this.ctx.restore();

    const originX = x + width / 2;
    const originY = y + height / 2;
    const rotation = Math.PI / 2;

    this.ctx.translate(originX, originY);
    this.ctx.scale(width / o.fieldSize, -height / o.fieldSize);
    this.ctx.rotate(rotation);

    const fieldTransform = this.ctx.getTransform();

    let userOriginX = 0,
      userOriginY = 0;
    let userRotation = 0;
    let userScaleX = 1,
      userScaleY = 1;

    const ctx = this.ctx;
    function setUserTransform() {
      ctx.setTransform(fieldTransform);

      ctx.translate(userOriginX, userOriginY);
      ctx.rotate(userRotation);
      ctx.scale(userScaleX, userScaleY);
    }

    this.ctx.lineCap = 'butt';

    for (let op of ops) {
      switch (op.type) {
        case 'scale':
          userScaleX = op.scaleX;
          userScaleY = op.scaleY;
          setUserTransform();
          break;
        case 'rotation':
          userRotation = op.rotation;
          setUserTransform();
          break;
        case 'translate':
          userOriginX = op.x;
          userOriginY = op.y;
          setUserTransform();
          break;
        case 'fill':
          this.ctx.fillStyle = op.color;
          break;
        case 'stroke':
          this.ctx.strokeStyle = op.color;
          break;
        case 'strokeWidth':
          this.ctx.lineWidth = op.width;
          break;
        case 'circle':
          this.ctx.beginPath();
          this.ctx.arc(op.x, op.y, op.radius, 0, 2 * Math.PI);

          if (op.stroke) {
            this.ctx.stroke();
          } else {
            this.ctx.fill();
          }
          break;
        case 'polygon': {
          this.ctx.beginPath();
          const { xPoints, yPoints, stroke } = op;
          this.ctx.fineMoveTo(xPoints[0], yPoints[0]);
          for (let i = 1; i < xPoints.length; i++) {
            this.ctx.fineLineTo(xPoints[i], yPoints[i]);
          }
          this.ctx.closePath();

          if (stroke) {
            this.ctx.stroke();
          } else {
            this.ctx.fill();
          }
          break;
        }
        case 'polyline': {
          this.ctx.beginPath();
          const { xPoints, yPoints } = op;
          this.ctx.fineMoveTo(xPoints[0], yPoints[0]);
          for (let i = 1; i < xPoints.length; i++) {
            this.ctx.fineLineTo(xPoints[i], yPoints[i]);
          }
          this.ctx.stroke();
          break;
        }
        case 'spline': {
          this.ctx.beginPath();
          const { ax, bx, cx, dx, ex, fx, ay, by, cy, dy, ey, fy } = op;
          this.ctx.fineMoveTo(fx, fy);
          for (let i = 0; i <= o.splineSamples; i++) {
            const t = i / o.splineSamples;
            const sx =
              (ax * t + bx) * (t * t * t * t) +
              cx * (t * t * t) +
              dx * (t * t) +
              ex * t +
              fx;
            const sy =
              (ay * t + by) * (t * t * t * t) +
              cy * (t * t * t) +
              dy * (t * t) +
              ey * t +
              fy;

            this.ctx.lineTo(sx, sy);
          }
          this.ctx.stroke();
          break;
        }
        case 'image': {
          const image = loadImage(op.path);

          this.ctx.save();
          if (op.usePageFrame) {
            this.ctx.setTransform(pageTransform);
          }

          this.ctx.translate(op.x, op.y);

          // Flipped to match text behavior.
          if (!op.usePageFrame) {
            this.ctx.scale(1, -1);
          }

          this.ctx.rotate(op.theta);
          this.ctx.drawImage(
            image,
            -op.pivotX,
            -op.pivotY,
            op.width,
            op.height,
          );

          this.ctx.restore();
          break;
        }
        case 'text': {
          this.ctx.save();

          this.ctx.font = op.font;
          if (op.usePageFrame) {
            this.ctx.setTransform(pageTransform);
          }

          this.ctx.translate(op.x, op.y);

          // I dislike this conceptually, but it makes things easier for users.
          if (!op.usePageFrame) {
            this.ctx.scale(1, -1);
          }

          this.ctx.rotate(op.theta);
          if (op.stroke) {
            this.ctx.strokeText(op.text, 0, 0);
          } else {
            this.ctx.fillText(op.text, 0, 0);
          }

          this.ctx.restore();
          break;
        }
        case 'grid': {
          this.ctx.save();
          if (op.usePageFrame) {
            this.ctx.setTransform(pageTransform);
          }

          this.ctx.translate(op.x, op.y);

          // Flipped to match text behavior.
          if (!op.usePageFrame) {
            this.ctx.scale(1, -1);
          }

          this.ctx.rotate(op.theta);
          this.ctx.translate(op.X, op.Y);

          this.ctx.strokeStyle = this.options.gridLineColor;

          const horSpacing = op.width / (op.numTicksX - 1);
          const vertSpacing = op.height / (op.numTicksY - 1);

          const { scalingX, scalingY } = this.ctx.getScalingFactors();

          // TODO: is this calculation valid now that rotation can be set?
          this.ctx.lineWidth =
            this.options.gridLineWidth / (scalingY * devicePixelRatio);

          for (let i = 0; i < op.numTicksX; i++) {
            const lineX = -op.pivotX + horSpacing * i;
            this.ctx.beginPath();
            this.ctx.fineMoveTo(lineX, -op.pivotY);
            this.ctx.fineLineTo(lineX, -op.pivotY + op.height);
            this.ctx.stroke();
          }

          this.ctx.lineWidth =
            this.options.gridLineWidth / (scalingX * devicePixelRatio);

          for (let i = 0; i < op.numTicksY; i++) {
            const lineY = -op.pivotY + vertSpacing * i;
            this.ctx.beginPath();
            this.ctx.fineMoveTo(-op.pivotX, lineY);
            this.ctx.fineLineTo(-op.pivotX + op.width, lineY);
            this.ctx.stroke();
          }

          this.ctx.restore();

          break;
        }
        case 'alpha': {
          this.ctx.globalAlpha = op.alpha;
          break;
        }
        default:
          throw new Error(`unknown operation: ${op.type}`);
      }
    }
    this.ctx.restore();
  }
}

