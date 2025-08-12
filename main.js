import 'ol/ol.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import LayerGroup from 'ol/layer/Group';
import ImageLayer from 'ol/layer/Image.js';
import ImageWMS from 'ol/source/ImageWMS.js';
import {get as getProjection} from 'ol/proj.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import {bbox as bboxStrategy} from 'ol/loadingstrategy.js';
import VectorLayer from 'ol/layer/Vector.js';

import Style from 'ol/style/Style.js';
import Stroke from 'ol/style/Stroke.js';
import Fill from 'ol/style/Fill.js';
import CircleStyle from 'ol/style/Circle.js';

import LayerSwitcher from 'ol-layerswitcher';

// Base layers
const osm = new TileLayer({
  title: 'OSM',
  type: 'base',
  visible: true,
  source: new OSM(),
});

const satellite = new TileLayer({
  title: 'Satellite',
  type: 'base',
  visible: false,
  source: new OSM(),
});

const baseMaps = new LayerGroup({
  title: 'Base Maps',
  layers: [osm, satellite],
  fold: 'open',
});

const geoserverLayer1 = 
  new ImageLayer({
    title: 'India ADM',
    extent: [68.09347534179688, 6.754367828369141, 97.4114990234375, 37.077491760253906],
    source: new ImageWMS({
      url: 'http://localhost:8081/geoserver/GIS_PG_WS/wms',
      params: {'LAYERS': 'GIS_PG_WS:India_ADM1'},
      ratio: 1,
      serverType: 'geoserver',
    }),
  })


// Define vector source to request WFS features based on current extent (bbox strategy)
const vectorSource = new VectorSource({
  format: new GeoJSON(),
  url: function (extent) {
    return (
      'http://localhost:8081/geoserver/wfs?service=WFS&' +
      'version=1.0.0&request=GetFeature&typename=GIS_PG_WS:india_cities_with_state&' + 
      'outputFormat=application/json&srsname=EPSG:4326&' +
      'bbox=' + extent.join(',') 
    );
  },
  strategy: bboxStrategy,
});


// Create vector layer to display features
const vectorLayer = new VectorLayer({
  source: vectorSource,
  title: 'India Cities',
  style: new Style({
    image: new CircleStyle({
      radius: 2,
      fill: new Fill({ color: 'rgba(0, 0, 255, 0.6)' }),
      stroke: new Stroke({ color: 'blue', width: 1 }),
    }),
    stroke: new Stroke({
      color: 'blue',
      width: 1,
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.1)',
    }),
  }),
});

// console.log(vectorLayer)

const WMSLayers = new LayerGroup({
  title: 'WMS Layers',
  layers: [geoserverLayer1],
  fold: 'open',
});

const WFSLayers = new LayerGroup({
  title: 'WFS Layers',
  layers: [ vectorLayer],
  fold: 'open',
});


const map = new Map({
  target: 'map',
  layers: [baseMaps, WMSLayers, WFSLayers],
  view: new View({
    projection: getProjection('EPSG:4326'),
    center: [82.7524871826172, 21.9159297943115],
    zoom: 4,
  }),
});

const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  startActive: true,
  groupSelectStyle: 'group',
});

map.addControl(layerSwitcher);
