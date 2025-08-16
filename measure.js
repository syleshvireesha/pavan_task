// measure.js

import {unByKey} from 'ol/Observable.js';
import Overlay from 'ol/Overlay.js';
import LineString from 'ol/geom/LineString.js';
import Polygon from 'ol/geom/Polygon.js';
import Draw from 'ol/interaction/Draw.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import {getArea, getLength} from 'ol/sphere.js';
import CircleStyle from 'ol/style/Circle.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';

let measureLayer, measureSource, draw, mapRef;
let helpTooltipElement, helpTooltip, measureTooltipElement, measureTooltip, sketch, listener;
let currentType = 'length'; // Default

function formatLength(line) {
  const length = getLength(line);
  return length > 100
    ? Math.round((length / 1000) * 100) / 100 + ' km'
    : Math.round(length * 100) / 100 + ' m';
}
function formatArea(polygon) {
  const area = getArea(polygon);
  return area > 10000
    ? Math.round((area / 1000000) * 100) / 100 + ' km²'
    : Math.round(area * 100) / 100 + ' m²';
}

function createHelpTooltip(map) {
  if (helpTooltipElement) helpTooltipElement.remove();
  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'ol-tooltip hidden';
  helpTooltip = new Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left',
  });
  map.addOverlay(helpTooltip);
}

function createMeasureTooltip(map) {
  if (measureTooltipElement) measureTooltipElement.remove();
  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
  measureTooltip = new Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center',
    stopEvent: false,
    insertFirst: false,
  });
  map.addOverlay(measureTooltip);
}

function addMeasureInteraction(type, map) {
  // Remove previous.
  if (draw) map.removeInteraction(draw);
  measureSource.clear();
  let geomType = type === 'area' ? 'Polygon' : 'LineString';
  
  draw = new Draw({
    source: measureSource,
    type: geomType,
    style: new Style({
      fill: new Fill({color: 'rgba(255,255,255,0.2)'}),
      stroke: new Stroke({color: '#ffcc33', width: 2}),
      image: new CircleStyle({radius: 7, fill: new Fill({color:'#ffcc33'})}),
    }),
  });
  map.addInteraction(draw);
  createMeasureTooltip(map);
  createHelpTooltip(map);

  draw.on('drawstart', function(evt) {
    sketch = evt.feature;
    let tooltipCoord;
    listener = sketch.getGeometry().on('change', function(evt) {
      const geom = evt.target;
      let output;
      if (geom instanceof Polygon) {
        output = formatArea(geom);
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof LineString) {
        output = formatLength(geom);
        tooltipCoord = geom.getLastCoordinate();
      }
      measureTooltipElement.innerHTML = output;
      measureTooltip.setPosition(tooltipCoord);
    });
  });
  
  draw.on('drawend', function () {
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
    measureTooltip.setOffset([0, -7]);
    sketch = null;
    measureTooltipElement = null;
    createMeasureTooltip(map);
    unByKey(listener);
  });
}

// **EXPORTS**
export function initializeMeasure(map) {
  mapRef = map;
  measureSource = new VectorSource();
  measureLayer = new VectorLayer({
    source: measureSource,
    style: new Style({
      fill: new Fill({color: 'rgba(255,255,255,0.2)'}),
      stroke: new Stroke({color: '#ffcc33', width: 2}),
      image: new CircleStyle({radius: 7, fill: new Fill({color:'#ffcc33'})}),
    }),
  });
  map.addLayer(measureLayer);
}

// Only when the user clicks (type: 'length'/'area'), start the interaction
export function startMeasure(type, map) {
    mapRef = map
    console.log('Starting measure interaction for type:', type);
    console.log(mapRef)
  if (!mapRef) return;

  // Remove previous interaction and clear previous measures
  if (draw) mapRef.removeInteraction(draw);
  measureSource.clear();

  let geomType = type
  console.log('Geometry type:', geomType);
  draw = new Draw({
    source: measureSource,
    type: geomType,
    // ... optional style
  });
  mapRef.addInteraction(draw);
  draw.on('drawend', function() {
    mapRef.removeInteraction(draw);
    draw = null;
  });
}
