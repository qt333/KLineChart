/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Nullable from '../common/Nullable'
import Coordinate from '../common/Coordinate'
import Point from '../common/Point'
import Bounding from '../common/Bounding'
import BarSpace from '../common/BarSpace'
import Precision from '../common/Precision'
import { OverlayStyle } from '../common/Styles'
import { EventHandler, EventName, MouseTouchEvent, MouseTouchEventCallback } from '../common/SyntheticEvent'
import { isBoolean } from '../common/utils/typeChecks'

import { CustomApi } from '../Options'

import Axis from '../component/Axis'
import XAxis from '../component/XAxis'
import YAxis from '../component/YAxis'
import Overlay, { OVERLAY_FIGURE_KEY_PREFIX, OverlayFigure, OverlayFigureIgnoreEventType, OverlayMode, getAllOverlayFigureIgnoreEventTypes } from '../component/Overlay'

import OverlayStore, { ProgressOverlayInfo, EventOverlayInfo, EventOverlayInfoFigureType } from '../store/OverlayStore'
import TimeScaleStore from '../store/TimeScaleStore'

import { PaneIdConstants } from '../pane/types'

import DrawWidget from '../widget/DrawWidget'
import DrawPane from '../pane/DrawPane'

import View from './View'

interface ColorEntry {
  hex: string
  rgba: string
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
]
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
    const pane = this.getWidget().getPane()
    const paneId = pane.getId()
    const overlayStore = pane.getChart().getChartStore().getOverlayStore()
    this.registerEvent('mouseMoveEvent', (event: MouseTouchEvent) => {
      const progressInstanceInfo = overlayStore.getProgressInstanceInfo()
      if (progressInstanceInfo !== null) {
        const overlay = progressInstanceInfo.instance
        let progressInstancePaneId = progressInstanceInfo.paneId
        if (overlay.isStart()) {
          overlayStore.updateProgressInstanceInfo(paneId)
          progressInstancePaneId = paneId
        }
        const index = overlay.points.length - 1
        const key = `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`
        if (overlay.isDrawing() && progressInstancePaneId === paneId) {
          overlay.eventMoveForDrawing(this._coordinateToPoint(progressInstanceInfo.instance, event))
          overlay.onDrawing?.({ overlay, figureKey: key, figureIndex: index, ...event })
        }
        return this._figureMouseMoveEvent(
          overlay,
          EventOverlayInfoFigureType.Point,
          key,
          index,
          0
        )(event)
      }
      overlayStore.setHoverInstanceInfo({
        paneId, instance: null, figureType: EventOverlayInfoFigureType.None, figureKey: '', figureIndex: -1, attrsIndex: -1
      }, event)
      return false
    }).registerEvent('mouseClickEvent', (event: MouseTouchEvent) => {
      const progressInstanceInfo = overlayStore.getProgressInstanceInfo()
      if (progressInstanceInfo !== null) {
        const overlay = progressInstanceInfo.instance
        let progressInstancePaneId = progressInstanceInfo.paneId
        if (overlay.isStart()) {
          overlayStore.updateProgressInstanceInfo(paneId, true)
          progressInstancePaneId = paneId
        }
        const index = overlay.points.length - 1
        const key = `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`
        if (overlay.isDrawing() && progressInstancePaneId === paneId) {
          overlay.eventMoveForDrawing(this._coordinateToPoint(overlay, event))
          overlay.onDrawing?.({ overlay, figureKey: key, figureIndex: index, ...event })
          overlay.nextStep()
          if (!overlay.isDrawing()) {
            overlayStore.progressInstanceComplete()
            overlay.onDrawEnd?.({ overlay, figureKey: key, figureIndex: index, ...event })
          }
        }
        return this._figureMouseClickEvent(
          overlay,
          EventOverlayInfoFigureType.Point,
          key,
          index,
          0
        )(event)
      }
      overlayStore.setClickInstanceInfo({
        paneId, instance: null, figureType: EventOverlayInfoFigureType.None, figureKey: '', figureIndex: -1, attrsIndex: -1
      }, event)
      return false
    }).registerEvent('mouseDoubleClickEvent', (event: MouseTouchEvent) => {
      const progressInstanceInfo = overlayStore.getProgressInstanceInfo()
      if (progressInstanceInfo !== null) {
        const overlay = progressInstanceInfo.instance
        const progressInstancePaneId = progressInstanceInfo.paneId
        if (overlay.isDrawing() && progressInstancePaneId === paneId) {
          overlay.forceComplete()
          if (!overlay.isDrawing()) {
            overlayStore.progressInstanceComplete()
            const index = overlay.points.length - 1
            const key = `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`
            overlay.onDrawEnd?.({ overlay, figureKey: key, figureIndex: index, ...event })
          }
        }
        const index = overlay.points.length - 1
        return this._figureMouseClickEvent(
          overlay,
          EventOverlayInfoFigureType.Point,
          `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`,
          index,
          0
        )(event)
      }
      return false
    }).registerEvent('mouseRightClickEvent', (event: MouseTouchEvent) => {
      const progressInstanceInfo = overlayStore.getProgressInstanceInfo()
      if (progressInstanceInfo !== null) {
        const overlay = progressInstanceInfo.instance
        if (overlay.isDrawing()) {
          const index = overlay.points.length - 1
          return this._figureMouseRightClickEvent(
            overlay,
            EventOverlayInfoFigureType.Point,
            `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`,
            index,
            0
          )(event)
        }
      }
      return false
    }).registerEvent('mouseUpEvent', (event: MouseTouchEvent) => {
      const { instance, figureIndex, figureKey } = overlayStore.getPressedInstanceInfo()
      if (instance !== null) {
        instance.onPressedMoveEnd?.({ overlay: instance, figureKey, figureIndex, ...event })
      }
      eval(`
        Object.keys(localStorage).forEach(key => {
        // console.log(instance?.id)
          if (key.includes(instance?.id)) {
            localStorage.setItem(key, JSON.stringify(instance));
          }
        })`)
      overlayStore.setPressedInstanceInfo({
        paneId, instance: null, figureType: EventOverlayInfoFigureType.None, figureKey: '', figureIndex: -1, attrsIndex: -1
      })
      return false
    }).registerEvent('pressedMouseMoveEvent', (event: MouseTouchEvent) => {
      const { instance, figureType, figureIndex, figureKey } = overlayStore.getPressedInstanceInfo()
      if (instance !== null) {
        if (!instance.lock) {
          if (!(instance.onPressedMoving?.({ overlay: instance, figureIndex, figureKey, ...event }) ?? false)) {
            const point = this._coordinateToPoint(instance, event)
            if (figureType === EventOverlayInfoFigureType.Point) {
              instance.eventPressedPointMove(point, figureIndex)
            } else {
              instance.eventPressedOtherMove(point, this.getWidget().getPane().getChart().getChartStore().getTimeScaleStore())
            }
          }
        }
        return true
      }
      return false
    })
  }

  private _createFigureEvents (
    overlay: Overlay,
    figureType: EventOverlayInfoFigureType,
    figureKey: string,
    figureIndex: number,
    attrsIndex: number,
    ignoreEvent?: boolean | OverlayFigureIgnoreEventType[]
  ): EventHandler | undefined {
    let eventHandler
    if (!overlay.isDrawing()) {
      let eventTypes: OverlayFigureIgnoreEventType[] = []
      if (ignoreEvent !== undefined) {
        if (isBoolean(ignoreEvent)) {
          if (ignoreEvent) {
            eventTypes = getAllOverlayFigureIgnoreEventTypes()
          }
        } else {
          eventTypes = ignoreEvent
        }
      }
      if (eventTypes.length === 0) {
        return {
          mouseMoveEvent: this._figureMouseMoveEvent(overlay, figureType, figureKey, figureIndex, attrsIndex),
          mouseDownEvent: this._figureMouseDownEvent(overlay, figureType, figureKey, figureIndex, attrsIndex),
          mouseClickEvent: this._figureMouseClickEvent(overlay, figureType, figureKey, figureIndex, attrsIndex),
          mouseRightClickEvent: this._figureMouseRightClickEvent(overlay, figureType, figureKey, figureIndex, attrsIndex),
          mouseDoubleClickEvent: this._figureMouseDoubleClickEvent(overlay, figureType, figureKey, figureIndex, attrsIndex)
        }
      }
      eventHandler = {}
      // [
      //   'mouseClickEvent', mouseDoubleClickEvent, 'mouseRightClickEvent',
      //   'tapEvent', 'doubleTapEvent', 'mouseDownEvent',
      //   'touchStartEvent', 'mouseMoveEvent', 'touchMoveEvent'
      // ]
      if (!eventTypes.includes('mouseMoveEvent') && !eventTypes.includes('touchMoveEvent')) {
        eventHandler.mouseMoveEvent = this._figureMouseMoveEvent(overlay, figureType, figureKey, figureIndex, attrsIndex)
      }
      if (!eventTypes.includes('mouseDownEvent') && !eventTypes.includes('touchStartEvent')) {
        eventHandler.mouseDownEvent = this._figureMouseDownEvent(overlay, figureType, figureKey, figureIndex, attrsIndex)
      }
      if (!eventTypes.includes('mouseClickEvent') && !eventTypes.includes('tapEvent')) {
        eventHandler.mouseClickEvent = this._figureMouseClickEvent(overlay, figureType, figureKey, figureIndex, attrsIndex)
      }
      if (!eventTypes.includes('mouseDoubleClickEvent') && !eventTypes.includes('doubleTapEvent')) {
        eventHandler.mouseDoubleClickEvent = this._figureMouseDoubleClickEvent(overlay, figureType, figureKey, figureIndex, attrsIndex)
      }
      if (!eventTypes.includes('mouseRightClickEvent')) {
        eventHandler.mouseRightClickEvent = this._figureMouseRightClickEvent(overlay, figureType, figureKey, figureIndex, attrsIndex)
      }
    }
    return eventHandler
  }

  private _figureMouseMoveEvent (overlay: Overlay, figureType: EventOverlayInfoFigureType, figureKey: string, figureIndex: number, attrsIndex: number): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      const pane = this.getWidget().getPane()
      const overlayStore = pane.getChart().getChartStore().getOverlayStore()
      overlayStore.setHoverInstanceInfo(
        { paneId: pane.getId(), instance: overlay, figureType, figureKey, figureIndex, attrsIndex }, event
      )
      return true
    }
  }

  private _figureMouseDownEvent (overlay: Overlay, figureType: EventOverlayInfoFigureType, figureKey: string, figureIndex: number, attrsIndex: number): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      const pane = this.getWidget().getPane()
      const paneId = pane.getId()
      const overlayStore = pane.getChart().getChartStore().getOverlayStore()
      overlay.startPressedMove(this._coordinateToPoint(overlay, event))
      overlay.onPressedMoveStart?.({ overlay, figureIndex, figureKey, ...event })
      overlayStore.setPressedInstanceInfo({ paneId, instance: overlay, figureType, figureKey, figureIndex, attrsIndex })
      return true
    }
  }

  private _figureMouseClickEvent (overlay: Overlay, figureType: EventOverlayInfoFigureType, figureKey: string, figureIndex: number, attrsIndex: number): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      const pane = this.getWidget().getPane()
      const paneId = pane.getId()
      const overlayStore = pane.getChart().getChartStore().getOverlayStore()
      overlayStore.setClickInstanceInfo({ paneId, instance: overlay, figureType, figureKey, figureIndex, attrsIndex }, event)
      return true
    }
  }

  private _figureMouseDoubleClickEvent (overlay: Overlay, _figureType: EventOverlayInfoFigureType, figureKey: string, figureIndex: number, _attrsIndex: number): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      const pageX = event.pageX
      const pageY = event.pageY
      overlay.onDoubleClick?.({ ...event, figureIndex, figureKey, overlay })
      // showColorPopup(event.pageX, event.pageY, )
      showColorPopup(pageX, pageY, (colorSelected) => {
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
      return true
    }
  }

  private _figureMouseRightClickEvent (overlay: Overlay, _figureType: EventOverlayInfoFigureType, figureKey: string, figureIndex: number, _attrsIndex: number): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      if (!(overlay.onRightClick?.({ overlay, figureIndex, figureKey, ...event }) ?? false)) {
        const pane = this.getWidget().getPane()
        const overlayStore = pane.getChart().getChartStore().getOverlayStore()
        overlayStore.removeInstance(overlay)
      }
      eval(`
        //remove localStorage keys by condition
        Object.keys(localStorage).forEach(key => {
          if (key.includes(overlay?.id)) {
            localStorage.removeItem(key);
          }
        });`)
      return true
    }
  }

  private _coordinateToPoint (overlay: Overlay, coordinate: Coordinate): Partial<Point> {
    const point: Partial<Point> = {}
    const pane = this.getWidget().getPane()
    const chart = pane.getChart()
    const paneId = pane.getId()
    const timeScaleStore = chart.getChartStore().getTimeScaleStore()
    if (this.coordinateToPointTimestampDataIndexFlag()) {
      const xAxis = chart.getXAxisPane().getAxisComponent()
      const dataIndex = xAxis.convertFromPixel(coordinate.x)
      const timestamp = timeScaleStore.dataIndexToTimestamp(dataIndex) ?? undefined
      point.dataIndex = dataIndex
      point.timestamp = timestamp
    }
    if (this.coordinateToPointValueFlag()) {
      const yAxis = pane.getAxisComponent()
      let value = yAxis.convertFromPixel(coordinate.y)
      if (overlay.mode !== OverlayMode.Normal && paneId === PaneIdConstants.CANDLE && point.dataIndex !== undefined) {
        const kLineData = timeScaleStore.getDataByDataIndex(point.dataIndex)
        if (kLineData !== null) {
          const modeSensitivity = overlay.modeSensitivity
          if (value > kLineData.high) {
            if (overlay.mode === OverlayMode.WeakMagnet) {
              const highY = yAxis.convertToPixel(kLineData.high)
              const buffValue = yAxis.convertFromPixel(highY - modeSensitivity)
              if (value < buffValue) {
                value = kLineData.high
              }
            } else {
              value = kLineData.high
            }
          } else if (value < kLineData.low) {
            if (overlay.mode === OverlayMode.WeakMagnet) {
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

  override dispatchEvent (name: EventName, event: MouseTouchEvent, other?: number): boolean {
    if (this.getWidget().getPane().getChart().getChartStore().getOverlayStore().isDrawing()) {
      return this.onEvent(name, event, other)
    }
    return super.dispatchEvent(name, event, other)
  }

  override checkEventOn (): boolean {
    return true
  }

  override drawImp (ctx: CanvasRenderingContext2D): void {
    const widget = this.getWidget()
    const pane = widget.getPane()
    const paneId = pane.getId()
    const chart = pane.getChart()
    const yAxis = pane.getAxisComponent() as unknown as Nullable<YAxis>
    const xAxis = chart.getXAxisPane().getAxisComponent()
    const bounding = widget.getBounding()
    const chartStore = chart.getChartStore()
    const customApi = chartStore.getCustomApi()
    const thousandsSeparator = chartStore.getThousandsSeparator()
    const timeScaleStore = chartStore.getTimeScaleStore()
    const dateTimeFormat = timeScaleStore.getDateTimeFormat()
    const barSpace = timeScaleStore.getBarSpace()
    const precision = chartStore.getPrecision()
    const defaultStyles = chartStore.getStyles().overlay
    const overlayStore = chartStore.getOverlayStore()
    const hoverInstanceInfo = overlayStore.getHoverInstanceInfo()
    const clickInstanceInfo = overlayStore.getClickInstanceInfo()
    const overlays = this.getCompleteOverlays(overlayStore, paneId)
    overlays.forEach(overlay => {
      if (overlay.visible) {
        this._drawOverlay(
          ctx, overlay, bounding, barSpace, precision,
          dateTimeFormat, customApi, thousandsSeparator,
          defaultStyles, xAxis, yAxis,
          hoverInstanceInfo, clickInstanceInfo, timeScaleStore
        )
      }
    })
    const progressInstanceInfo = overlayStore.getProgressInstanceInfo()
    if (progressInstanceInfo !== null) {
      const overlay = this.getProgressOverlay(progressInstanceInfo, paneId)
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (overlay !== null && overlay.visible) {
        this._drawOverlay(
          ctx, overlay, bounding, barSpace,
          precision, dateTimeFormat, customApi, thousandsSeparator,
          defaultStyles, xAxis, yAxis,
          hoverInstanceInfo, clickInstanceInfo, timeScaleStore
        )
      }
    }
  }

  private _drawOverlay (
    ctx: CanvasRenderingContext2D,
    overlay: Overlay,
    bounding: Bounding,
    barSpace: BarSpace,
    precision: Precision,
    dateTimeFormat: Intl.DateTimeFormat,
    customApi: CustomApi,
    thousandsSeparator: string,
    defaultStyles: OverlayStyle,
    xAxis: Nullable<XAxis>,
    yAxis: Nullable<YAxis>,
    hoverInstanceInfo: EventOverlayInfo,
    clickInstanceInfo: EventOverlayInfo,
    timeScaleStore: TimeScaleStore
  ): void {
    const { points } = overlay
    const coordinates = points.map(point => {
      let dataIndex = point.dataIndex
      if (point.timestamp !== undefined) {
        dataIndex = timeScaleStore.timestampToDataIndex(point.timestamp)
      }
      const coordinate = { x: 0, y: 0 }
      if (dataIndex !== undefined) {
        coordinate.x = xAxis?.convertToPixel(dataIndex) ?? 0
      }
      if (point.value !== undefined) {
        coordinate.y = yAxis?.convertToPixel(point.value) ?? 0
      }
      return coordinate
    })
    if (coordinates.length > 0) {
      const figures = new Array<OverlayFigure>().concat(
        this.getFigures(
          overlay, coordinates, bounding, barSpace, precision, thousandsSeparator, dateTimeFormat, defaultStyles, xAxis, yAxis
        )
      )
      this.drawFigures(
        ctx,
        overlay,
        figures,
        defaultStyles
      )
    }
    this.drawDefaultFigures(
      ctx,
      overlay,
      coordinates,
      bounding,
      precision,
      dateTimeFormat,
      customApi,
      thousandsSeparator,
      defaultStyles,
      xAxis,
      yAxis,
      hoverInstanceInfo,
      clickInstanceInfo
    )
  }

  protected drawFigures (ctx: CanvasRenderingContext2D, overlay: Overlay, figures: OverlayFigure[], defaultStyles: OverlayStyle): void {
    figures.forEach((figure, figureIndex) => {
      const { type, styles, attrs, ignoreEvent } = figure
      const attrsArray = [].concat(attrs)
      attrsArray.forEach((ats, attrsIndex) => {
        const events = this._createFigureEvents(overlay, EventOverlayInfoFigureType.Other, figure.key ?? '', figureIndex, attrsIndex, ignoreEvent)
        const ss = { ...defaultStyles[type], ...overlay.styles?.[type], ...styles }
        this.createFigure(
          type, ats, ss, events
        )?.draw(ctx)
      })
    })
  }

  protected getCompleteOverlays (overlayStore: OverlayStore, paneId: string): Overlay[] {
    return overlayStore.getInstances(paneId)
  }

  protected getProgressOverlay (info: ProgressOverlayInfo, paneId: string): Nullable<Overlay> {
    if (info.paneId === paneId) {
      return info.instance
    }
    return null
  }

  protected getFigures (
    overlay: Overlay,
    coordinates: Coordinate[],
    bounding: Bounding,
    barSpace: BarSpace,
    precision: Precision,
    thousandsSeparator: string,
    dateTimeFormat: Intl.DateTimeFormat,
    defaultStyles: OverlayStyle,
    xAxis: Nullable<XAxis>,
    yAxis: Nullable<YAxis>
  ): OverlayFigure | OverlayFigure[] {
    return overlay.createPointFigures?.({ overlay, coordinates, bounding, barSpace, precision, thousandsSeparator, dateTimeFormat, defaultStyles, xAxis, yAxis }) ?? []
  }

  protected drawDefaultFigures (
    ctx: CanvasRenderingContext2D,
    overlay: Overlay,
    coordinates: Coordinate[],
    _bounding: Bounding,
    _precision: Precision,
    _dateTimeFormat: Intl.DateTimeFormat,
    _customApi: CustomApi,
    _thousandsSeparator: string,
    defaultStyles: OverlayStyle,
    _xAxis: Nullable<XAxis>,
    _yAxis: Nullable<YAxis>,
    hoverInstanceInfo: EventOverlayInfo,
    clickInstanceInfo: EventOverlayInfo
  ): void {
    if (overlay.needDefaultPointFigure) {
      if (
        (hoverInstanceInfo.instance?.id === overlay.id && hoverInstanceInfo.figureType !== EventOverlayInfoFigureType.None) ||
        (clickInstanceInfo.instance?.id === overlay.id && clickInstanceInfo.figureType !== EventOverlayInfoFigureType.None)
      ) {
        const styles = overlay.styles
        const pointStyles = { ...defaultStyles.point, ...styles?.point }
        coordinates.forEach(({ x, y }, index) => {
          let radius = pointStyles.radius
          let color = pointStyles.color
          let borderColor = pointStyles.borderColor
          let borderSize = pointStyles.borderSize
          if (
            hoverInstanceInfo.instance?.id === overlay.id &&
            hoverInstanceInfo.figureType === EventOverlayInfoFigureType.Point &&
            hoverInstanceInfo.figureIndex === index
          ) {
            radius = pointStyles.activeRadius
            color = pointStyles.activeColor
            borderColor = pointStyles.activeBorderColor
            borderSize = pointStyles.activeBorderSize
          }
          this.createFigure(
            'circle',
            { x, y, r: radius + borderSize },
            { color: borderColor },
            this._createFigureEvents(overlay, EventOverlayInfoFigureType.Point, `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`, index, 0)
          )?.draw(ctx)
          this.createFigure(
            'circle',
            { x, y, r: radius },
            { color }
          )?.draw(ctx)
        })
      }
    }
  }
}
