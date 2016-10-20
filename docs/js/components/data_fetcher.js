/**
 * @license
 * Copyright 2015 The Lovefield Project Authors. All Rights Reserved.
 * Copyright 2016 Benjamin Armintor. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



/**
 * Fetches data by parsing a CSV with PapaParse
 * @constructor
 *
 * @param {!angular.$http} $http
 */
var CsvDataFetcher = function($http, $csv) {
  /** @private {!angular.$http} */
  this.http_ = $http;

  /** @private {string} */
  this.csv_ = $csv;
};


/** @override */
CsvDataFetcher.prototype.fetchDeep = function() {
  return new Promise(this.csvData.bind(this));
};

CsvDataFetcher.prototype.csvData = function(resolve, reject) {
  Papa.parse(this.csv_, {
    download: true,
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    // step function requires HTTP1.1 chunk support
    complete: function(results) {
      console.log("loading " + results.data.length + " rows...");
      resolve(results);
      console.log("All done!");
    }
  });
};

/**
 * @param {string} dateString The date string as returned from the server.
 * @return {!Date} The parsed date.
 * @private
 */
CsvDataFetcher.prototype.parseDate_ = function(dateString) {
  var tokens = dateString.split('-');
  return new Date(tokens[0] + '/' + tokens[1] + '/20' + tokens[2]);
};


/**
 * @param {string} csvString
 * @return {!Array<!Object>}
 * @private
 */
CsvDataFetcher.prototype.csvToObject_ = function(csvString) {
  var lines = csvString.split('\n');
  var headerLine = lines[0];
  var fields = headerLine.split(',');

  var objects = [];
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];

    // The csvString that comes from the server has an empty line at the end,
    // need to ignore it.
    if (line.length == 0) {
      continue;
    }

    var values = line.split(',');
    var obj = {};
    fields.forEach(function(field, index) {
      if (field == 'Date') {
        obj[field] = values[index];
      } else {
        obj[field] = parseFloat(values[index]);
      }
    });
    objects.push(obj);
  }

  return objects;
};
