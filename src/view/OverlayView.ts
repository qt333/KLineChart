/**
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type Nullable from '../common/Nullable'
import type Coordinate from '../common/Coordinate'
import type Point from '../common/Point'
import type { EventHandler, EventName, MouseTouchEvent, MouseTouchEventCallback } from '../common/SyntheticEvent'
import { isFunction, isNumber, isValid } from '../common/utils/typeChecks'

import type { Axis } from '../component/Axis'
import type { YAxis } from '../component/YAxis'
import type { OverlayFigure, Overlay } from '../component/Overlay'
import type OverlayImp from '../component/Overlay'
import { checkOverlayFigureEvent, OVERLAY_FIGURE_KEY_PREFIX } from '../component/Overlay'

import type { EventOverlayInfoFigureType } from '../Store'

import { PaneIdConstants } from '../pane/types'

import type DrawWidget from '../widget/DrawWidget'
import type DrawPane from '../pane/DrawPane'

import View from './View'

// const basicColors: string[] = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080', '#000000']
// let selectedColor: string = basicColors[0] // Default selection

// /**
//  * Displays a color picker popup at a given position.
//  * @param x Horizontal screen coordinate
//  * @param y Vertical screen coordinate
//  * @param onApply Callback to handle the selected color
//  */
// export function showColorPopup (x: number, y: number, onApply: (color: string) => void): void {
//   const popup = document.getElementById('colorPopup')
//   const options = document.getElementById('colorOptions')
//   const applyButton = document.getElementById('applyColorBtn')

//   if (popup === null || options === null || applyButton === null) {
//     console.error('Popup elements not found in the DOM.')
//     return
//   }

//   // Clear previous swatches
//   options.innerHTML = ''

//   basicColors.forEach((color: string) => {
//     const swatch = document.createElement('div')
//     swatch.style.width = '12px'
//     swatch.style.height = '12px'
//     swatch.style.background = color
//     swatch.style.border = '2px solid transparent'
//     swatch.style.cursor = 'pointer'
//     swatch.style.borderRadius = '2px'

//     swatch.addEventListener('click', () => {
//       selectedColor = color

//       // Clear selection highlight
//       Array.from(options.children).forEach(child => {
//         (child as HTMLElement).style.border = '2px solid transparent'
//       })

//       swatch.style.border = '2px solid #333'
//     })

//     options.appendChild(swatch)
//   })

//   // Position and show popup
//   popup.style.left = `${x}px`
//   popup.style.top = `${y}px`
//   popup.style.display = 'block'

//   const outsideClickHandler = (e: MouseEvent) => {
//     if (!popup.contains(e.target as Node)) {
//       popup.style.display = 'none'
//       document.removeEventListener('click', outsideClickHandler)
//     }
//   }

//   // Delay binding to avoid hiding immediately on double click
//   setTimeout(() => {
//     document.addEventListener('click', outsideClickHandler)
//   }, 0)

//   applyButton.onclick = () => {
//     popup.style.display = 'none'
//     document.removeEventListener('click', outsideClickHandler)
//     onApply(selectedColor)
//   }
// }

// // // Hide popup on outside click
// // document.addEventListener('click', (e: MouseEvent) => {
// //   const popup = document.getElementById('colorPopup')
// //   if (popup === null) return

// //   if (!popup.contains(e.target as Node) && popup.style.display === 'block') {
// //     popup.style.display = 'none'
// //   }
// // })

// const basicColors: string[] = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080', '#000000', '#808080', '#FFFFFF']
interface ColorEntry {
  hex: string;
  rgba: string;
};

const colorMap: ColorEntry[] = [
  { hex: '#FF0000', rgba: 'rgba(255, 0, 0, 1)' },       // Red
  { hex: '#00FF00', rgba: 'rgba(0, 255, 0, 1)' },       // Green
  { hex: '#0000FF', rgba: 'rgba(0, 0, 255, 1)' },       // Blue
  { hex: '#FFA500', rgba: 'rgba(255, 165, 0, 1)' },     // Orange
  { hex: '#800080', rgba: 'rgba(128, 0, 128, 1)' },     // Purple
  { hex: '#000000', rgba: 'rgba(0, 0, 0, 1)' },         // Black
  { hex: '#808080', rgba: 'rgba(128, 128, 128, 1)' },   // Gray
  { hex: '#FFFFFF', rgba: 'rgba(255, 255, 255, 1)' },   // White
  { hex: '#F92855', rgba: 'rgba(249, 40, 85, 1)' },     // color.RED
  { hex: '#2DC08E', rgba: 'rgba(45, 192, 142, 1)' },    // color.GREEN
  { hex: '#1677FF', rgba: 'rgba(22, 119, 255, 1)' }     // color.BLUE
];
/**
 * Show minimal color picker.
 * @param x Horizontal position
 * @param y Vertical position
 * @param onSelect Callback immediately called with selected color
 */
export function showColorPopup (x: number, y: number, onSelect: (color: string) => void): void {
  const popup = document.getElementById('colorPopup')
  if (popup === null) return

  popup.innerHTML = ''
  popup.style.position = 'absolute'
  popup.style.left = `${x}px`
  popup.style.top = `${y}px`
  popup.style.display = 'flex' // Horizontal layout
  popup.style.gap = '4px'

  colorMap.forEach(color => {
    const swatch = document.createElement('div')
    swatch.style.width = '15px'
    swatch.style.height = '15px'
    swatch.style.backgroundColor = color.hex
    swatch.style.border = '1px solid #aaa'
    swatch.style.borderRadius = '2px'
    swatch.style.cursor = 'pointer'

    swatch.addEventListener('click', () => {
      onSelect(color.rgba)
      popup.style.display = 'none'
    })

    popup.appendChild(swatch)
  })

  // Delay adding outside click listener
  setTimeout((): void => {
    const outsideClickHandler = (e: MouseEvent): void => {
      if (!popup.contains(e.target as Node)) {
        popup.style.display = 'none'
        document.removeEventListener('click', outsideClickHandler)
      }
    }
    document.addEventListener('click', outsideClickHandler)
  }, 0)
}

export default class OverlayView<C extends Axis = YAxis> extends View<C> {
  constructor (widget: DrawWidget<DrawPane<C>>) {
    super(widget)
    this._initEvent()
  }

  private _initEvent (): void {
    const widget = this.getWidget()
    const pane = widget.getPane()
    const paneId = pane.getId()
    const chart = pane.getChart()
    const chartStore = chart.getChartStore()
    this.registerEvent('mouseMoveEvent', event => {
      const progressOverlayInfo = chartStore.getProgressOverlayInfo()
      if (progressOverlayInfo !== null) {
        const overlay = progressOverlayInfo.overlay
        let progressOverlayPaneId = progressOverlayInfo.paneId
        if (overlay.isStart()) {
          chartStore.updateProgressOverlayInfo(paneId)
          progressOverlayPaneId = paneId
        }
        const index = overlay.points.length - 1
        if (overlay.isDrawing() && progressOverlayPaneId === paneId) {
          overlay.eventMoveForDrawing(this._coordinateToPoint(overlay, event))
          overlay.onDrawing?.({ chart, overlay, ...event })
        }
        return this._figureMouseMoveEvent(
          overlay,
          'point',
          index,
          { key: `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`, type: 'circle', attrs: {} }
        )(event)
      }
      chartStore.setHoverOverlayInfo(
        {
          paneId,
          overlay: null,
          figureType: 'none',
          figureIndex: -1,
          figure: null
        },
        (o, f) => this._processOverlayMouseEnterEvent(o, f, event),
        (o, f) => this._processOverlayMouseLeaveEvent(o, f, event)
      )
      widget.setForceCursor(null)
      return false
    }).registerEvent('mouseClickEvent', event => {
      const progressOverlayInfo = chartStore.getProgressOverlayInfo()
      if (progressOverlayInfo !== null) {
        const overlay = progressOverlayInfo.overlay
        let progressOverlayPaneId = progressOverlayInfo.paneId
        if (overlay.isStart()) {
          chartStore.updateProgressOverlayInfo(paneId, true)
          progressOverlayPaneId = paneId
        }
        const index = overlay.points.length - 1
        if (overlay.isDrawing() && progressOverlayPaneId === paneId) {
          overlay.eventMoveForDrawing(this._coordinateToPoint(overlay, event))
          overlay.onDrawing?.({ chart, overlay, ...event })
          overlay.nextStep()
          if (!overlay.isDrawing()) {
            chartStore.progressOverlayComplete()
            overlay.onDrawEnd?.({ chart, overlay, ...event })
          }
        }
        return this._figureMouseClickEvent(
          overlay,
          'point',
          index,
          {
            key: `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`,
            type: 'circle',
            attrs: {}
          }
        )(event)
      }
      chartStore.setClickOverlayInfo(
        {
          paneId,
          overlay: null,
          figureType: 'none',
          figureIndex: -1,
          figure: null
        },
        (o, f) => this._processOverlaySelectedEvent(o, f, event),
        (o, f) => this._processOverlayDeselectedEvent(o, f, event)
      )
      return false
    }).registerEvent('mouseDoubleClickEvent', event => {
      const progressOverlayInfo = chartStore.getProgressOverlayInfo()
      if (progressOverlayInfo !== null) {
        const overlay = progressOverlayInfo.overlay
        const progressOverlayPaneId = progressOverlayInfo.paneId
        if (overlay.isDrawing() && progressOverlayPaneId === paneId) {
          overlay.forceComplete()
          if (!overlay.isDrawing()) {
            chartStore.progressOverlayComplete()
            overlay.onDrawEnd?.({ chart, overlay, ...event })
          }
        }
        const index = overlay.points.length - 1
        return this._figureMouseClickEvent(
          overlay,
          'point',
          index,
          {
            key: `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`,
            type: 'circle',
            attrs: {}
          }
        )(event)
      }
      return false
    }).registerEvent('mouseRightClickEvent', event => {
      const progressOverlayInfo = chartStore.getProgressOverlayInfo()
      if (progressOverlayInfo !== null) {
        const overlay = progressOverlayInfo.overlay
        if (overlay.isDrawing()) {
          const index = overlay.points.length - 1
          return this._figureMouseRightClickEvent(
            overlay,
            'point',
            index,
            {
              key: `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`,
              type: 'circle',
              attrs: {}
            }
          )(event)
        }
      }
      return false
    }).registerEvent('mouseUpEvent', event => {
      const { overlay, figure } = chartStore.getPressedOverlayInfo()
      if (overlay !== null) {
        if (checkOverlayFigureEvent('onPressedMoveEnd', figure)) {
          overlay.onPressedMoveEnd?.({ chart, overlay, figure: figure ?? undefined, ...event })
        }
      }
      chartStore.setPressedOverlayInfo({
        paneId,
        overlay: null,
        figureType: 'none',
        figureIndex: -1,
        figure: null
      })
      eval(`Object.keys(localStorage).forEach(key => {
        // console.log(overlay?.id)
        if (key.includes(overlay?.id)) {
          localStorage.setItem(key, JSON.stringify(overlay));
        }
      })`)
      return false
    }).registerEvent('pressedMouseMoveEvent', event => {
      const { overlay, figureType, figureIndex, figure } = chartStore.getPressedOverlayInfo()
      if (overlay !== null) {
        if (checkOverlayFigureEvent('onPressedMoving', figure)) {
          if (!overlay.lock) {
            const point = this._coordinateToPoint(overlay, event)
            if (figureType === 'point') {
              overlay.eventPressedPointMove(point, figureIndex)
            } else {
              overlay.eventPressedOtherMove(point, this.getWidget().getPane().getChart().getChartStore())
            }
            let prevented = false
            overlay.onPressedMoving?.({ chart, overlay, figure: figure ?? undefined, ...event, preventDefault: () => { prevented = true } })
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore
            if (prevented) {
              this.getWidget().setForceCursor(null)
            } else {
              this.getWidget().setForceCursor('pointer')
            }
          }
          return true
        }
      }
      this.getWidget().setForceCursor(null)
      return false
    })
  }

  private _createFigureEvents (
    overlay: OverlayImp,
    figureType: EventOverlayInfoFigureType,
    figureIndex: number,
    figure: OverlayFigure
  ): Nullable<EventHandler> {
    if (overlay.isDrawing()) {
      return null
    }
    return {
      mouseMoveEvent: this._figureMouseMoveEvent(overlay, figureType, figureIndex, figure),
      mouseDownEvent: this._figureMouseDownEvent(overlay, figureType, figureIndex, figure),
      mouseClickEvent: this._figureMouseClickEvent(overlay, figureType, figureIndex, figure),
      mouseRightClickEvent: this._figureMouseRightClickEvent(overlay, figureType, figureIndex, figure),
      mouseDoubleClickEvent: this._figureMouseDoubleClickEvent(overlay, figureType, figureIndex, figure)
    }
  }

  private _processOverlayMouseEnterEvent (overlay: OverlayImp, figure: Nullable<OverlayFigure>, event: MouseTouchEvent): boolean {
    if (isFunction(overlay.onMouseEnter) && checkOverlayFigureEvent('onMouseEnter', figure)) {
      overlay.onMouseEnter({ chart: this.getWidget().getPane().getChart(), overlay, figure: figure ?? undefined, ...event })
      return true
    }
    return false
  }

  private _processOverlayMouseLeaveEvent (overlay: OverlayImp, figure: Nullable<OverlayFigure>, event: MouseTouchEvent): boolean {
    if (isFunction(overlay.onMouseLeave) && checkOverlayFigureEvent('onMouseLeave', figure)) {
      overlay.onMouseLeave({ chart: this.getWidget().getPane().getChart(), overlay, figure: figure ?? undefined, ...event })
      return true
    }
    return false
  }

  private _processOverlaySelectedEvent (overlay: OverlayImp, figure: Nullable<OverlayFigure>, event: MouseTouchEvent): boolean {
    if (checkOverlayFigureEvent('onSelected', figure)) {
      overlay.onSelected?.({ chart: this.getWidget().getPane().getChart(), overlay, figure: figure ?? undefined, ...event })
      // alert(`onSelected \n${figure} \n${event} \n${overlay} \n${this.getWidget().getPane().getChart()}`)
      // eval('alert(`onSelected`)')
      return true
    }
    return false
  }

  private _processOverlayDeselectedEvent (overlay: OverlayImp, figure: Nullable<OverlayFigure>, event: MouseTouchEvent): boolean {
    if (checkOverlayFigureEvent('onDeselected', figure)) {
      overlay.onDeselected?.({ chart: this.getWidget().getPane().getChart(), overlay, figure: figure ?? undefined, ...event })
      return true
    }
    return false
  }

  private _figureMouseMoveEvent (overlay: OverlayImp, figureType: EventOverlayInfoFigureType, figureIndex: number, figure: OverlayFigure): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      const pane = this.getWidget().getPane()
      const check = !overlay.isDrawing() && checkOverlayFigureEvent('onMouseMove', figure)
      if (check) {
        let prevented = false
        overlay.onMouseMove?.({ chart: pane.getChart(), overlay, figure, ...event, preventDefault: () => { prevented = true } })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore
        if (prevented) {
          this.getWidget().setForceCursor(null)
        } else {
          this.getWidget().setForceCursor('pointer')
        }
      }

      pane.getChart().getChartStore().setHoverOverlayInfo(
        { paneId: pane.getId(), overlay, figureType, figure, figureIndex },
        (o, f) => this._processOverlayMouseEnterEvent(o, f, event),
        (o, f) => this._processOverlayMouseLeaveEvent(o, f, event)
      )
      return check
    }
  }

  private _figureMouseDownEvent (overlay: OverlayImp, figureType: EventOverlayInfoFigureType, figureIndex: number, figure: OverlayFigure): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      const pane = this.getWidget().getPane()
      const paneId = pane.getId()
      overlay.startPressedMove(this._coordinateToPoint(overlay, event))
      if (checkOverlayFigureEvent('onPressedMoveStart', figure)) {
        overlay.onPressedMoveStart?.({ chart: pane.getChart(), overlay, figure, ...event })
        pane.getChart().getChartStore().setPressedOverlayInfo({ paneId, overlay, figureType, figureIndex, figure })
        return !overlay.isDrawing()
      }
      return false
    }
  }

  private _figureMouseClickEvent (overlay: OverlayImp, figureType: EventOverlayInfoFigureType, figureIndex: number, figure: OverlayFigure): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      const pane = this.getWidget().getPane()
      const paneId = pane.getId()
      const check = !overlay.isDrawing() && checkOverlayFigureEvent('onClick', figure)
      if (check) {
        overlay.onClick?.({ chart: this.getWidget().getPane().getChart(), overlay, figure, ...event })
      }
      pane.getChart().getChartStore().setClickOverlayInfo(
        { paneId, overlay, figureType, figureIndex, figure },
        (o, f) => this._processOverlaySelectedEvent(o, f, event),
        (o, f) => this._processOverlayDeselectedEvent(o, f, event)
      )
      return check
    }
  }

  private _figureMouseDoubleClickEvent (overlay: OverlayImp, _figureType: EventOverlayInfoFigureType, _figureIndex: number, figure: OverlayFigure): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      const pageX = event.pageX
      const pagey = event.pageY
      if (checkOverlayFigureEvent('onDoubleClick', figure)) {
        overlay.onDoubleClick?.({ ...event, chart: this.getWidget().getPane().getChart(), figure, overlay })
        // showColorPopup(event.pageX, event.pageY, )
        showColorPopup(pageX, pagey, (colorSelected) => {
          console.log('Color selected:', colorSelected)
          // Update overlay color, e.g.:
          overlay.styles = {
            line: {
              // 'solid' | 'dashed'
              style: 'solid',
              smooth: false,
              color: colorSelected,
              size: 1,
              dashedValue: [4, 4]
            },
            rect: {
              // 'fill' | 'stroke' | 'stroke_fill'
              style: 'fill',
              color: colorSelected.replace('1)', '0.35)'),
              borderColor: colorSelected,
              borderSize: 1,
              borderRadius: 0,
              // 'solid' | 'dashed'
              borderStyle: 'solid',
              borderDashedValue: [2, 2]
            },
            polygon: {
              // 'fill' | 'stroke' | 'stroke_fill'
              style: 'fill',
              color: colorSelected.replace('1)', '0.35)'),
              borderColor: colorSelected,
              borderSize: 1,
              // 'solid' | 'dashed'
              borderStyle: 'solid',
              borderDashedValue: [2, 2]
            },
            point: {
              color: colorSelected,
              borderColor: colorSelected.replace('1)', '0.35)'),
              borderSize: 1,
              radius: 5,
              activeColor: colorSelected,
              activeBorderColor: colorSelected.replace('1)', '0.35)'),
              activeBorderSize: 3,
              activeRadius: 5
            }
          }
          eval(`Object.keys(localStorage).forEach(key => {
            // console.log(overlay?.id)
            if (key.includes(overlay?.id)) {
              localStorage.setItem(key, JSON.stringify(overlay));
            }
          })`)
        })
        return !overlay.isDrawing()
      }
      return false
    }
  }

  private _figureMouseRightClickEvent (overlay: OverlayImp, _figureType: EventOverlayInfoFigureType, _figureIndex: number, figure: OverlayFigure): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      if (checkOverlayFigureEvent('onRightClick', figure)) {
        let prevented = false
        overlay.onRightClick?.({ chart: this.getWidget().getPane().getChart(), overlay, figure, ...event, preventDefault: () => { prevented = true } })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore
        if (!prevented) {
          this.getWidget().getPane().getChart().getChartStore().removeOverlay(overlay)
        }
        eval(`
        //remove localStorage keys by condition
        Object.keys(localStorage).forEach(key => {
          if (key.includes(overlay?.id)) {
            localStorage.removeItem(key);
          }
        });`)
        return !overlay.isDrawing()
      }
      return false
    }
  }

  private _coordinateToPoint (o: Overlay, coordinate: Coordinate): Partial<Point> {
    const point: Partial<Point> = {}
    const pane = this.getWidget().getPane()
    const chart = pane.getChart()
    const paneId = pane.getId()
    const chartStore = chart.getChartStore()
    if (this.coordinateToPointTimestampDataIndexFlag()) {
      const xAxis = chart.getXAxisPane().getAxisComponent()
      const dataIndex = xAxis.convertFromPixel(coordinate.x)
      const timestamp = chartStore.dataIndexToTimestamp(dataIndex) ?? undefined
      point.timestamp = timestamp
      point.dataIndex = dataIndex
    }
    if (this.coordinateToPointValueFlag()) {
      const yAxis = pane.getAxisComponent()
      let value = yAxis.convertFromPixel(coordinate.y)
      if (o.mode !== 'normal' && paneId === PaneIdConstants.CANDLE && isNumber(point.dataIndex)) {
        const kLineData = chartStore.getDataByDataIndex(point.dataIndex)
        if (kLineData !== null) {
          const modeSensitivity = o.modeSensitivity
          if (value > kLineData.high) {
            if (o.mode === 'weak_magnet') {
              const highY = yAxis.convertToPixel(kLineData.high)
              const buffValue = yAxis.convertFromPixel(highY - modeSensitivity)
              if (value < buffValue) {
                value = kLineData.high
              }
            } else {
              value = kLineData.high
            }
          } else if (value < kLineData.low) {
            if (o.mode === 'weak_magnet') {
              const lowY = yAxis.convertToPixel(kLineData.low)
              const buffValue = yAxis.convertFromPixel(lowY - modeSensitivity)
              if (value > buffValue) {
                value = kLineData.low
              }
            } else {
              value = kLineData.low
            }
          } else {
            const max = Math.max(kLineData.open, kLineData.close)
            const min = Math.min(kLineData.open, kLineData.close)
            if (value > max) {
              if (value - max < kLineData.high - value) {
                value = max
              } else {
                value = kLineData.high
              }
            } else if (value < min) {
              if (value - kLineData.low < min - value) {
                value = kLineData.low
              } else {
                value = min
              }
            } else if (max - value < value - min) {
              value = max
            } else {
              value = min
            }
          }
        }
      }
      point.value = value
    }
    return point
  }

  protected coordinateToPointValueFlag (): boolean {
    return true
  }

  protected coordinateToPointTimestampDataIndexFlag (): boolean {
    return true
  }

  override dispatchEvent (name: EventName, event: MouseTouchEvent): boolean {
    if (this.getWidget().getPane().getChart().getChartStore().isOverlayDrawing()) {
      return this.onEvent(name, event)
    }
    return super.dispatchEvent(name, event)
  }

  override drawImp (ctx: CanvasRenderingContext2D): void {
    const overlays = this.getCompleteOverlays()
    overlays.forEach(overlay => {
      if (overlay.visible) {
        this._drawOverlay(ctx, overlay)
      }
    })
    const progressOverlay = this.getProgressOverlay()
    if (isValid(progressOverlay) && progressOverlay.visible) {
      this._drawOverlay(ctx, progressOverlay)
    }
  }

  private _drawOverlay (
    ctx: CanvasRenderingContext2D,
    overlay: OverlayImp
  ): void {
    const { points } = overlay
    const pane = this.getWidget().getPane()
    const chart = pane.getChart()
    const chartStore = chart.getChartStore()
    const yAxis = pane.getAxisComponent() as unknown as Nullable<YAxis>
    const xAxis = chart.getXAxisPane().getAxisComponent()
    const coordinates = points.map(point => {
      let dataIndex: Nullable<number> = null
      if (isNumber(point.timestamp)) {
        dataIndex = chartStore.timestampToDataIndex(point.timestamp)
      }
      const coordinate = { x: 0, y: 0 }
      if (isNumber(dataIndex)) {
        coordinate.x = xAxis.convertToPixel(dataIndex)
      }
      if (isNumber(point.value)) {
        coordinate.y = yAxis?.convertToPixel(point.value) ?? 0
      }
      return coordinate
    })
    if (coordinates.length > 0) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ignore
      // @ts-expect-error
      const figures = [].concat(this.getFigures(overlay, coordinates))
      this.drawFigures(
        ctx,
        overlay,
        figures
      )
    }
    this.drawDefaultFigures(
      ctx,
      overlay,
      coordinates
    )
  }

  protected drawFigures (ctx: CanvasRenderingContext2D, overlay: OverlayImp, figures: OverlayFigure[]): void {
    const defaultStyles = this.getWidget().getPane().getChart().getStyles().overlay
    figures.forEach((figure, figureIndex) => {
      const { type, styles, attrs } = figure
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ignore
      // @ts-expect-error
      const attrsArray = [].concat(attrs)
      attrsArray.forEach((ats) => {
        const events = this._createFigureEvents(overlay, 'other', figureIndex, figure)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ignore
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ignore
        const ss = { ...defaultStyles[type], ...overlay.styles?.[type], ...styles }
        this.createFigure({
          name: type, attrs: ats, styles: ss
        }, events ?? undefined)?.draw(ctx)
      })
    })
  }

  protected getCompleteOverlays (): OverlayImp[] {
    const pane = this.getWidget().getPane()
    return pane.getChart().getChartStore().getOverlaysByPaneId(pane.getId())
  }

  protected getProgressOverlay (): Nullable<OverlayImp> {
    const pane = this.getWidget().getPane()
    const info = pane.getChart().getChartStore().getProgressOverlayInfo()
    if (isValid(info) && info.paneId === pane.getId()) {
      return info.overlay
    }
    return null
  }

  protected getFigures (
    o: Overlay,
    coordinates: Coordinate[]
  ): OverlayFigure | OverlayFigure[] {
    const widget = this.getWidget()
    const pane = widget.getPane()
    const chart = pane.getChart()
    const yAxis = pane.getAxisComponent() as unknown as Nullable<YAxis>
    const xAxis = chart.getXAxisPane().getAxisComponent()
    const bounding = widget.getBounding()
    return o.createPointFigures?.({ chart, overlay: o, coordinates, bounding, xAxis, yAxis }) ?? []
  }

  protected drawDefaultFigures (
    ctx: CanvasRenderingContext2D,
    overlay: OverlayImp,
    coordinates: Coordinate[]
  ): void {
    if (overlay.needDefaultPointFigure) {
      const chartStore = this.getWidget().getPane().getChart().getChartStore()
      const hoverOverlayInfo = chartStore.getHoverOverlayInfo()
      const clickOverlayInfo = chartStore.getClickOverlayInfo()
      if (
        (hoverOverlayInfo.overlay?.id === overlay.id && hoverOverlayInfo.figureType !== 'none') ||
        (clickOverlayInfo.overlay?.id === overlay.id && clickOverlayInfo.figureType !== 'none')
      ) {
        const defaultStyles = chartStore.getStyles().overlay
        const styles = overlay.styles
        const pointStyles = { ...defaultStyles.point, ...styles?.point }
        coordinates.forEach(({ x, y }, index) => {
          let radius = pointStyles.radius
          let color = pointStyles.color
          let borderColor = pointStyles.borderColor
          let borderSize = pointStyles.borderSize
          if (
            hoverOverlayInfo.overlay?.id === overlay.id &&
            hoverOverlayInfo.figureType === 'point' &&
            hoverOverlayInfo.figure?.key === `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`
          ) {
            radius = pointStyles.activeRadius
            color = pointStyles.activeColor
            borderColor = pointStyles.activeBorderColor
            borderSize = pointStyles.activeBorderSize
          }

          this.createFigure(
            {
              name: 'circle',
              attrs: { x, y, r: radius + borderSize },
              styles: { color: borderColor }
            },
            this._createFigureEvents(
              overlay,
              'point',
              index,
              {
                key: `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`,
                type: 'circle',
                attrs: { x, y, r: radius + borderSize },
                styles: { color: borderColor }
              }
            ) ?? undefined
          )?.draw(ctx)
          this.createFigure({
            name: 'circle',
            attrs: { x, y, r: radius },
            styles: { color }
          })?.draw(ctx)
        })
      }
    }
  }
}
