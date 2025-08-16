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
import StadiaMaps from 'ol/source/StadiaMaps.js';


import Style from 'ol/style/Style.js';
import Stroke from 'ol/style/Stroke.js';
import Fill from 'ol/style/Fill.js';
import CircleStyle from 'ol/style/Circle.js';

import LayerSwitcher from 'ol-layerswitcher';

import Geocoder from 'ol-geocoder';

import Draw from 'ol/interaction/Draw.js';


// Get the role from localStorage
const userRole = localStorage.getItem('role');

//listing roles
const ROLE_ADMIN = 'ADMIN'
const ROLE_GROUP_ADMIN = 'GROUP_ADMIN'

console.log('userRole:',userRole)

// Redirect to login if not authenticated
if (!userRole || userRole === 'null' || userRole === 'undefined') {
        window.location.href = 'login.html';
    }
else{
////////////////////////////// Base layers///////////////////////////////////////
const osm = new TileLayer({
  title: 'OSM',
  type: 'base',
  visible: true,
  source: new OSM(),
});

const stamen_watercolor = new TileLayer({
      title: 'Stamen Watercolor',
      type: 'base',
      visible: false,
      source: new StadiaMaps({
        layer: 'stamen_watercolor',
        // apiKey: 'OPTIONAL'
      }),
    });

const baseMaps = new LayerGroup({
  title: 'Base Maps',
  layers: [osm, stamen_watercolor],
  fold: 'open',
});

////////////////////////////// WMS layers///////////////////////////////////////

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
geoserverLayer1.set('allowedRoles', [ROLE_ADMIN, ROLE_GROUP_ADMIN]);
console.log('geoserverLayer1 role:',geoserverLayer1.get('allowedRoles'))
const wmsLayersList = []

// Add geoserverLayer1 only if the user's role is in the allowed roles
if (geoserverLayer1.get('allowedRoles').includes(userRole)) {
  wmsLayersList.push(geoserverLayer1);
}

// Create the LayerGroup only if there are layers to add
let WMSLayers = null;
if (wmsLayersList.length > 0) {
  WMSLayers = new LayerGroup({
    title: 'WMS Layers',
    layers: wmsLayersList,
    fold: 'open',
  });
} else {
  // Optionally handle the case when no layers are allowed, e.g.:
  // WMSLayers = new LayerGroup({layers: []});
  // or leave WMSLayers as null and handle accordingly
}

////////////////////////////// WFS layers///////////////////////////////////////

// Define vector source to request WFS features based on current extent (bbox strategy)
const vectorSource = new VectorSource({
  format: new GeoJSON(),
  url: function (extent) {
    return (
      'http://localhost:8081/geoserver/wfs?service=WFS&' +
      'version=1.0.0&request=GetFeature&typename=GIS_PG_WS:geometries&' + 
      'outputFormat=application/json&srsname=EPSG:4326&' +
      'bbox=' + extent.join(',') 
    );
  },
  strategy: bboxStrategy,
});


// Create vector layer to display features
const vectorLayer = new VectorLayer({
  source: vectorSource,
  title: 'Geometries',
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

vectorLayer.set('allowedRoles', [ROLE_ADMIN]);
console.log('vectorLayer role:',vectorLayer.get('allowedRoles'))
// Add geoserverLayer1 only if the user's role is in the allowed roles
const wfsLayersList = []
if (vectorLayer.get('allowedRoles').includes(userRole)) {
  wfsLayersList.push(vectorLayer);
}

// Create the LayerGroup only if there are layers to add
let WFSLayers = null;
if (wmsLayersList.length > 0) {
  WFSLayers = new LayerGroup({
    title: 'WFS Layers',
    layers: wfsLayersList,
    fold: 'open',
  });
} else {
  // Optionally handle the case when no layers are allowed, e.g.:
  // WMSLayers = new LayerGroup({layers: []});
  // or leave WMSLayers as null and handle accordingly
}

////////////////////////////// Map ///////////////////////////////////////

// Initialize array with baseMaps layer(s) — usually always present
const layersArray = [baseMaps];

// Add WMSLayers if it exists and has layers
if (WMSLayers && WMSLayers.getLayers().getLength() > 0) {
  layersArray.push(WMSLayers);
}

// Add WFSLayers similarly if applicable
if (WFSLayers && WFSLayers.getLayers().getLength() > 0) {
  layersArray.push(WFSLayers);
}

// Create the map with conditional layer groups
const map = new Map({
  target: 'map',
  layers: layersArray,
  view: new View({
    projection: getProjection('EPSG:4326'),
    center: [82.7524871826172, 21.9159297943115],
    zoom: 4,
  }),
});

////////////////////////////// Layer Switcher ///////////////////////////////////////
const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  startActive: true,
  groupSelectStyle: 'group',
});

map.addControl(layerSwitcher);

////////////////////////////// Geocoder ///////////////////////////////////////

const geocoder = new Geocoder('nominatim', {
  provider: 'mapquest',
  key: '__some_key__',
  lang: 'en-US', //en-US, fr-FR
  placeholder: 'Search for ...',
  targetType: 'text-input',
  limit: 5,
  keepOpen: true
});

map.addControl(geocoder);



////////////////////////////// Draw feature ///////////////////////////////////////
document.getElementById('mapButton').onclick = function() {
  const options = document.getElementById('drawOptions');
  options.style.display = options.style.display === 'none' ? 'flex' : 'none';
};
const typeSelect = document.getElementById('type');
const source = new VectorSource({wrapX: false});

let draw; // global so we can remove it later

function addInteraction(drawType) {
  
  if (draw) {
    map.removeInteraction(draw);
  }
  if (drawType && drawType !== 'None') {
    console.log(drawType);
    draw = new Draw({
      source: source, // Make sure 'source' is defined and points to your vector source
      type: drawType,
    });
    map.addInteraction(draw);
    
    // Listen for the drawend event
    draw.on('drawend', function(event) {
      const feature = event.feature;
      // Convert to GeoJSON
      const geojson = new GeoJSON().writeFeature(feature);
      console.log('Drawn feature as GeoJSON:', geojson);
      // Here you can send geojson to your backend/database

      // Send GeoJSON to backend
    fetch('http://localhost:8082/api/save-geometry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: geojson
    })
    .then(response => response.json())
    .then(data => {
      console.log('Saved to database:', data);
      vectorSource.clear();      // Remove old features
      vectorSource.refresh();  // Reload features from server
    })
    .catch(error => {
      console.error('Error saving geometry:', error);
    });


    });
    
    // document.getElementById('undo').addEventListener('click', function () {
    //   draw.removeLastPoint();
    // });
  document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && draw) {
    map.removeInteraction(draw);
    draw = null;
  }
    });
  }
}

document.querySelectorAll('.draw-option').forEach(btn => {
  btn.onclick = function() {
    const drawType = btn.dataset.type;
    addInteraction(drawType);
    document.getElementById('drawOptions').style.display = 'none';
  };
});
}