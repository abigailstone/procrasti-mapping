/*
For use in the Google Earth Engine Code Editor
Creates an animated GIF of NDVI values over one year
*/

// state boundaries
var tigerStates = ee.FeatureCollection("TIGER/2018/States");

// region to create a border around the clipped state data
var  region = ee.Geometry.Polygon(
        [[[-74.02785355951598, 45.202862815584226],
          [-74.02785355951598, 42.50199095056364],
          [-71.27028520014098, 42.50199095056364],
          [-71.27028520014098, 45.202862815584226]]], null, false);


// MODIS Terra Vegetation Indices
var col = ee.ImageCollection('MODIS/006/MOD13A2').select('NDVI');

// Define a mask to clip the NDVI data by.
var mask = tigerStates.filter(ee.Filter.eq('NAME', 'Vermont'));


// group images by composite date
col = col.map(function(img) {
  var doy = ee.Date(img.get('system:time_start')).getRelative('day', 'year');
  return img.set('doy', doy);
});

// distinct day-of-year dates
var distinctDOY = col.filterDate('2018-01-01', '2019-01-01');

// filter the collection to contain only distinct day-of-year images
var filter = ee.Filter.equals({leftField: 'doy', rightField: 'doy'});

// join to the image collection
var join = ee.Join.saveAll('doy_matches');
var joinCol = ee.ImageCollection(join.apply(distinctDOY, col, filter));

// median across matching day-of-year
var comp = joinCol.map(function(img) {
  var doyCol = ee.ImageCollection.fromImages(
    img.get('doy_matches')
  );
  return doyCol.reduce(ee.Reducer.median());
});


// visualization parameters
var visParams = {
  min: 0.0,
  max: 9000.0,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};

// create frames
var rgbVis = comp.map(function(img) {
  return img.visualize(visParams).clip(mask);
});

// Define GIF visualization parameters.
var gifParams = {
  'region': region,
  'dimensions': 600,
  'crs': 'EPSG:3857',
  'framesPerSecond': 5
};

//view animation in the console
print(ui.Thumbnail(rgbVis, gifParams));
