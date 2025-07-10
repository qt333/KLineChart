import { isNumber, isValid } from '../../common/utils/typeChecks'
import type {
  OverlayTemplate,
  OverlayFigure,
  OverlayCreateFiguresCallback,
  OverlayCreateFiguresCallbackParams,
} from '../../component/Overlay'
import type DeepPartial from '../../common/DeepPartial'
import type Coordinate from '../../common/Coordinate'
import type { RectAttrs } from '../../extension/figure/rect'
import type { TextStyle, LineStyle, RectStyle, OverlayStyle } from '../../common/Styles'

export interface PositionOverlayExtend {
  hovered: boolean 
  selected: boolean 
}

export interface PositionOverlayStyle {
  point: OverlayStyle
  target: RectStyle 
  loss: RectStyle 
  targetText: TextStyle 
  lossText: TextStyle 
  midLine: LineStyle 
}

function getDefaultPositionStyle (): DeepPartial<PositionOverlayStyle> {
  return {
    point: {
      borderSize: 0,
      radius: 0,
      activeBorderSize: 0,
      activeRadius: 0
    }, 
    target: { color: '#279d8233' },
    loss: { color: '#f2385a33' },
    targetText: {
      backgroundColor: '#279d82',
    },
    lossText: {
      backgroundColor: '#f2385a',
    },
  } 
}

function createRect (start: Coordinate, end: Coordinate): RectAttrs {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(start.x - end.x),
    height: Math.abs(start.y - end.y),
  } 
}

function isLong(points: any[]): Boolean {
  const v1 = points[0].value || points[0].y 
  const v2 = points[1].value || points[1].y 
  // console.log(`IsLong test: ${v1} ${v2}`)
  return v2 > v1 
}

function createPositionRects (): (
  params: OverlayCreateFiguresCallbackParams<PositionOverlayExtend>
) => OverlayFigure[] {
  return ({ coordinates, overlay, yAxis, xAxis }) => {
    if (!isValid(yAxis) || !isValid(xAxis)) return [] 
    if (coordinates.length < 2) return [] 
    const figures: OverlayFigure[] = [] 
    figures.push({
      type: 'rect',
      attrs: createRect(coordinates[0], coordinates[1]),
      styles: !isLong(coordinates)
        ? overlay.styles?.target
        : overlay.styles?.loss,
    }) 

    return figures 
  } 
}

function createPositionInfo (): (
  params: OverlayCreateFiguresCallbackParams<PositionOverlayExtend>
) => OverlayFigure[] {
  return ({ coordinates, overlay, yAxis, xAxis }) => {
    if (!isValid(yAxis) || !isValid(xAxis)) return [] 
    if (coordinates.length < 2) return [] 
    // if (overlay.currentStep !== -1) return [] 
    if (!overlay.extendData.hovered && !overlay.extendData.selected) return [] 
    const points = overlay.points 
    if (
      !isNumber(points[0].value) ||
      !isNumber(points[1].value) ||
      !isNumber(points[0].timestamp) ||
      !isNumber(points[1].timestamp)
    ) {
      return [] 
    }

    // let precision1 = 0 
    // if (yAxis.isInCandle()) {
    //   precision1 = precision.price 
    // } else {
    //   const indicators = chart.getIndicators({ paneId: overlay.paneId }) 
    //   indicators.forEach((indicator) => {
    //     precision = Math.max(precision, indicator.precision) 
    //   }) 
    // }
    const figures: OverlayFigure[] = [] 
    const xText =
      (xAxis.convertTimestampToPixel(points[0].timestamp) +
        xAxis.convertTimestampToPixel(points[1].timestamp)) /
      2 

    // const priceDelta = chart
    //   .getDecimalFold()
    //   .format(
    //     chart
    //       .getThousandsSeparator()
    //       .format((points[1].value - points[0].value).toFixed(precision))
    //   ) 
    const percent = 100 * (points[1].value / points[0].value - 1)
    // const percent = ((points[1].value - points[0].value) / points[0].value) * 100;
    const  isLongg = isLong(points) 

    const y = coordinates[1].y 
    figures.push({
      type: 'text',
      attrs: {
        x: xText,
        y: y,
        text: `(${percent.toFixed(2)}%)`,
        baseline: 'bottom',
        align: 'center',
      },
      styles: isLongg ? overlay.styles?.targetText : overlay.styles?.lossText,
    }) 

    return figures 
  } 
}

function createPositionCallback (): OverlayCreateFiguresCallback<PositionOverlayExtend> {
  return (params) => {
    const rects = createPositionRects()(params) 
    const infos = createPositionInfo()(params) 
    return [...rects, ...infos] 
  } 
}

let overlayClickedOff = false;

const positionTemplate: Omit<
  OverlayTemplate<PositionOverlayExtend>,
  'name' | 'createPointFigures'
> = {
  styles: getDefaultPositionStyle(),
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  extendData: { hovered: true, selected: false },
  // onMouseEnter: ({ overlay }) => {
  //   overlay.extendData.hovered = true 
  //   return true 
  // },
  // onMouseLeave: ({ overlay }) => {
  //   overlay.extendData.selected = false 
  //   return true 
  // },
  // // onSelected: ({ overlay }) => {
  // //   overlay.extendData.selected = true 
  // //   return true 
  // // },
  // onDeselected: ({ chart, overlay }) => {
  //   overlay.extendData.selected = false
  //   // console.log(3)
  //   if (overlayClickedOff) return true;
  //   // Wait for the next click, then remove the overlay
  //   const handleClick = () => {
  //     // console.log(4)
  //     chart.removeOverlay({ id: overlay.id });
  //     overlayClickedOff = false;
  //     document.removeEventListener('click', handleClick);
  //   };
  //   overlayClickedOff = true;
  //   // Slight delay to avoid removing overlay on the same click that finished the draw
  //   setTimeout(() => {
  //     // console.log(5)
  //     document.addEventListener('click', handleClick, { once: true });
  //   }, 0); 
  //   return true 
  // }
  onMouseLeave: ({ overlay }) => {
    overlay.extendData.selected = false
    // console.log(3)
    if (overlayClickedOff) return true;
    // Wait for the next click, then remove the overlay
    const handleClick = () => {
      // console.log(4)
      // chart.removeOverlay({ id: overlay.id });
      overlayClickedOff = false;
      document.removeEventListener('click', handleClick);
    };
    overlayClickedOff = true;
    // Slight delay to avoid removing overlay on the same click that finished the draw
    setTimeout(() => {
      // console.log(5)
      document.addEventListener('click', handleClick, { once: true });
    }, 0); 
    return true 
  }
} 

const ruler: OverlayTemplate<PositionOverlayExtend> = {
  name: 'ruler',
  createPointFigures: createPositionCallback(),
  ...positionTemplate,
} 

export default ruler