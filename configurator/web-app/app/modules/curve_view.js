'use strict';

class CurveView {
  constructor(element, large=false) {
    this.CURVE_LINEAR = 'Linear';
    this.CURVE_FIXED = 'Fixed value';
    this.CURVE_MIN_MAX = 'Min/Max';
    this.CURVE_ZERO_MAX = '0/Max';
    this.CURVE_GT_ZERO = '>0';
    this.CURVE_LT_ZERO = '<0';
    this.CURVE_ABSVAL = 'Absolute';
    this.CURVE_EXPO = 'Expo';
    this.CURVE_DEADBAND = 'Deadband';
    this.CURVE_3POINT = '3-Point';
    this.CURVE_5POINT = '5-Point';
    this.CURVE_7POINT = '7-Point';
    this.CURVE_9POINT = '9-Point';
    this.CURVE_11POINT = '11-Point';
    this.CURVE_13POINT = '13-Point';

    this.P100 = 100;
    this.CHANNEL_CENTER = 0;
    this.N100 = -100;

    this.el = element;
    this.path = this.el.querySelector('.mixer-curve--curve');
    this.circle = this.el.querySelector('.mixer-curve--position');

    this.min = -100;
    this.max = 100;
    // The "large" curve has a vertical range of 125%
    if (large) {
      this.min = -125;
      this.max = 125;
      this.el.viewBox.baseVal.height = 125 * 2;
    }

    // Set the 0 point to the center of the element. This way we can simply
    // draw values that correspond to positive and negative percentages.
    const translateX = this.el.viewBox.baseVal.width / 2;
    const translateY = this.el.viewBox.baseVal.height / 2;
    const g = this.el.querySelector('g');
    g.transform.baseVal.getItem(0).setTranslate(translateX, translateY);

    this.reset();
  }

  // ****************************************************************************
  reset() {
    // Use internal variables to set them without redraw
    this._liveX = 999;
    this._smoothing = false;
    this._scalar = 100;
    this._offset = 0;
    this._points = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // Use property to set the curve type and redraw
    this.type = this.CURVE_LINEAR;
  }

  // ****************************************************************************
  update() {
    let path_d = '';
    let command = 'M';
    for (let x = -100; x <= 100; x += 1) {
      let y = this.curveFunction(x) * this._scalar / this.P100 + this._offset;
      y *= -1;  // Flip on the horizontal axis as Y=0 is at the top

      // Clamp the curve to stay within the boundary box
      y = Math.min(y, this.max);
      y = Math.max(y, this.min);

      path_d += `${command} ${x} ${y} `;
      command = 'L';
    }

    this.path.setAttribute('d', path_d);
    this.live(this._liveX);
  }

  // ****************************************************************************
  get points() {
    return this._points;
  }

  set points(pointList) {
    if (Array.isArray(pointList)  &&
        pointList.length <= this._points.length) {
      for (let i = 0; i < pointList.length; i++) {
        this._points[i] = parseInt(pointList[i]);
      }
      this.update();
    }
  }

  // ****************************************************************************
  get type() {
    return this._type;
  }

  set type(newType) {
    this._type = newType;

    switch (this._type) {
    case this.CURVE_FIXED:
      this.curveFunction = this.fixed.bind(this);
      break;

    case this.CURVE_LINEAR:
      this.curveFunction = this.linear.bind(this);
      break;

    case this.CURVE_MIN_MAX:
      this.curveFunction = this.minMax.bind(this);
      break;

    case this.CURVE_ZERO_MAX:
      this.curveFunction = this.zeroMax.bind(this);
      break;

    case this.CURVE_GT_ZERO:
      this.curveFunction = this.gtZero.bind(this);
      break;

    case this.CURVE_LT_ZERO:
      this.curveFunction = this.ltZero.bind(this);
      break;

    case this.CURVE_ABSVAL:
      this.curveFunction = this.absval.bind(this);
      break;

    case this.CURVE_EXPO:
      this.curveFunction = this.expo.bind(this);
      break;

    case this.CURVE_DEADBAND:
      this.curveFunction = this.deadband.bind(this);
      break;

    case this.CURVE_3POINT:
      this.curveFunction = this.nPoints.bind(this, 3);
      break;

    case this.CURVE_5POINT:
      this.curveFunction = this.nPoints.bind(this, 5);
      break;

    case this.CURVE_7POINT:
      this.curveFunction = this.nPoints.bind(this, 7);
      break;

    case this.CURVE_9POINT:
      this.curveFunction = this.nPoints.bind(this, 9);
      break;

    case this.CURVE_11POINT:
      this.curveFunction = this.nPoints.bind(this, 11);
      break;

    case this.CURVE_13POINT:
      this.curveFunction = this.nPoints.bind(this, 13);
      break;

    default:
      break;
    }

    this.update();
  }

  // ****************************************************************************
  get smoothing() {
    return this._smoothing;
  }

  set smoothing(newSmoothing) {
    this._smoothing = Boolean(newSmoothing);
    this.update();
  }

  // ****************************************************************************
  get scalar() {
    return this._scalar;
  }

  set scalar(newScalar) {
    this._scalar = parseInt(newScalar);
    this.update();
  }

  // ****************************************************************************
  get offset() {
    return this._offset;
  }

  set offset(newOffset) {
    this._offset = parseInt(newOffset);
    this.update();
  }

  // ****************************************************************************
  live(x) {
    this._liveX = x;

    let y = this.curveFunction(x) * this._scalar / this.P100 + this._offset;
    y *= -1;  // Flip on the horizontal axis as Y=0 is at the top

    this.circle.cx.baseVal.value = x;
    this.circle.cy.baseVal.value = y;
  }

  // ****************************************************************************
  linear(value) {
    return value;
  }

  // ****************************************************************************
  fixed() {
    return this._points[0];
  }

  // ****************************************************************************
  expo(value) {
    const k = (value < 0) ? this.points[1] : this.points[0];
    const sign = (value < 0) ? -1 : 1;
    const absValue =  Math.abs(value);
    const absK =  Math.abs(k);
    const P100 = this.P100;

    // Exponential function:
    // f(x, k) = (x^3 * k) + (x * (1 - k))
    function exponential(x, k) {
      // Normalize x and k to be between 0..1
      k /= 100;
      x /= P100;

      let y = (Math.pow(x, 3) * k) + (x * (1 - k));

      return Math.floor(y * P100);
    }


    if (k === 0) {
      return value;
    }
    else if (k > 0) {
      let y = exponential(absValue, absK);
      return y * sign;
    }
    else {  // k < 0
      let y = this.P100 - exponential(this.P100 - absValue,  absK);
      return y * sign;
    }
  }

  // ****************************************************************************
  nPoints(numberOfPoints, value) {
    if (this._smoothing) {
      return this.hermiteCubicSpline(value, numberOfPoints);
    }
    return this.interpolate(value, numberOfPoints);
  }

  // ****************************************************************************
  interpolate(value, numberOfPoints) {
    const lastPointIndex = numberOfPoints - 1;
    const deltaX = (this.P100 - this.N100) / lastPointIndex;

    let i = Math.floor((value - this.N100) / deltaX);
    i = Math.max(i, 0);
    i = Math.min(i, lastPointIndex - 1);

    const x1 = this.N100 + i * deltaX;
    const y1 = this.points[i];
    const y2 = this.points[i + 1];
    const deltaY = (y2 - y1);

    return y1 + ((value - x1) * deltaY / deltaX) ;
  }

  // ****************************************************************************
  // Hermite cubic spline
  // http://en.wikipedia.org/wiki/Cubic_Hermite_spline
  hermiteCubicSpline(value, numberOfPoints) {
    const lastPointIndex = numberOfPoints - 1;
    const deltaX = (this.P100 - this.N100) / lastPointIndex;

    // Choose appropriate tangents for the curve point at a given index.
    function selectTangent(curve, pointIndex) {
      // First point: Compute the slope of the first and second point
      if (pointIndex === 0) {
        let y0 = curve.points[pointIndex];
        let y1 = curve.points[pointIndex + 1];

        return (y1 - y0) / deltaX;
      }

      // Last point: Compute the slope of the last and second-to-last point
      if (pointIndex === lastPointIndex) {
        let y0 = curve.points[pointIndex - 1];
        let y1 = curve.points[pointIndex];

        return (y1 - y0) / deltaX;
      }

      // All other points: Compute the tangent using 'cubic monotone rules'
      // as described in
      // http://en.wikipedia.org/wiki/Monotone_cubic_interpolation
      let y0 = curve.points[pointIndex - 1];
      let y1 = curve.points[pointIndex];
      let y2 = curve.points[pointIndex + 1];

      // Step 1: Compute the slopes of the secant lines between successive points
      let d0 = (y1 - y0) / deltaX;
      let d1 = (y2 - y1) / deltaX;

      // Step 2: Initialize the tangent as the average of the secants
      let m = (d0 + d1) / 2;

      // Step 3 and 4: If we are dealing with horizontal lines, or the lines
      // form either a 'v' or a '^', return a flat tangent.
      if (d0 == 0 || d1 == 0 || (d0 > 0 && d1 < 0) || (d0 < 0 && d1 > 0)) {
        return 0;
      }

      // Step 5: Prevent overshoot and ensure monotonicity by restricting
      // m = 3 * d0  when  (m / d0) > 3; and  m = 3 * d1  when  (m / d1) > 3
      if (m / d0 > 3) {
        return 3 * d0;
      }
      else if (m / d1 > 3) {
        return 3 * d1;
      }

      return m;
    }


    let i = Math.floor((value - this.N100) / deltaX);
    i = Math.max(i, 0);
    i = Math.min(i, lastPointIndex - 1);

    const m0 = selectTangent(this, i);
    const m1 = selectTangent(this, i + 1);

    const x0 = this.N100 + i * deltaX;
    const x1 = x0 + deltaX;
    const y0 = this.points[i];
    const y1 = this.points[i+1];

    const t = (value - x0) / deltaX;
    const t2 = t * t;
    const t3 = t2 * t;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    return (h00 * y0) + (h10 * deltaX * m0) + (h01 * y1) + (h11 * deltaX * m1);
  }

  // ****************************************************************************
  gtZero(value) {
    let threshold = this._points[0];

    if (value < threshold) {
       return 0;
    }

    let divisor = this.P100 - threshold;
    if (divisor <= 0) {
        return 0;
    }

    return this.P100 * (value - threshold) / divisor;
  }

  // ****************************************************************************
  ltZero(value) {
    let threshold = this._points[0];

    if (value > threshold) {
       return 0;
    }

    let divisor = this.N100 - threshold;
    if (divisor >= 0) {
        return 0;
    }

    return this.N100 * (value - threshold) / divisor;
  }

  // ****************************************************************************
  deadband(value) {
      if (value < 0) {
        return this.ltZero(value);
      }
      else {
        // Copy points[1] into points[0] to be able to use existing gtZero
        // function, then restore.
        const save = this._points[0];
        this._points[0] = this._points[1];
        const y = this.gtZero(value);
        this._points[0] = save;
        return y;
      }
  }

  // ****************************************************************************
  absval(value) {
    let threshold = this.points[0];
    let divisor;

    if (value < threshold) {
      divisor = (this.N100 - threshold);
      if (divisor >= 0) {
        return 0;
      }
    }
    else {
      divisor = (this.P100 - threshold);
      if (divisor <= 0) {
          return 0;
      }
    }

    return this.P100 * (value - threshold) / divisor;
  }

  // ****************************************************************************
  minMax(value) {
    let threshold = this.points[0];

    if (value < threshold) {
      return this.N100;
    }
    else {
      return this.P100;
    }
  }

  // ****************************************************************************
  zeroMax(value) {
    let threshold = this.points[0];

    if (value < threshold) {
      return 0;
    }
    else {
      return this.P100;
    }
  }
}

module.exports = CurveView;
