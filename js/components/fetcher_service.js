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
 * A Service used for populating the DB with real-world data.
 * @constructor
 *
 * @param {!angular.$http} $http
 * @param {!LovefieldService} LovefieldService
 */
var FetcherService = function($http, LovefieldService) {
  this.http_ = $http;
  this.lovefieldService_ = LovefieldService;

  this.db_ = null;

  // Populate DB with data.
  this.dataSources_ = {
    Deep: new CsvDataFetcher(this.http_, 'data/deep-export.csv'),
    DeepAuthors: new CsvDataFetcher(this.http_, 'data/transform/join_display_authors.csv'),
    Authors: new CsvDataFetcher(this.http_, 'data/transform/display_authors.csv')
  }
  this.whenInitialized_ = this.init_(this.dataSources_).then(
      function() {
        console.log('DB populated with data.');
      }.bind(this));
};


/**
 * Ensures that database is populated with data.
 * @return {!IThenable}
 * @private
 */
FetcherService.prototype.init_ = function(dataSources) {
  var promise = this.lovefieldService_.getDbConnection()
    .then(function(database) {
      this.db_ = database;
      window.db = database;
      return database;
    }.bind(this));
  for (tableName in dataSources) {
    promise = promise.then(this.insertIf_(tableName));
  }
  return promise;
};


/**
 * Ensures that database is populated with data (re-entrant).
 * @return {!IThenable}
 */
FetcherService.prototype.init = function() {
  return this.whenInitialized_;
};


/**
 * Checks if any data exists already in the DB.
 * @return {boolean}
 * @private
 */
FetcherService.prototype.checkForExistingData_ = function(tableName) {
  return function(db) {
    var table = db.getSchema().table(tableName);
    return new Promise(function(resolve, reject) {
      resolve(db.select().from(table).exec().then(
      function(rows) {
        console.log("checkForExistingData_ rows.length: " + rows.length);
        return rows.length > 0;
      }))
    });
  }
};

FetcherService.prototype.ifData_ = function(tableName) {
  return function(db) {
    var table = db.getSchema().table(tableName);
    this.insertData_(table, this.dataSources_[tableName]);
    return db;
  }.bind(this);
};

FetcherService.prototype.insertIf_ = function(tableName) {
  return function(db) {
    var checkForExistingData = this.checkForExistingData_(tableName);
    var insertData = this.ifData_(tableName);
    var status = Promise.resolve(checkForExistingData(db));
    return status.then(function(result) {
      return result ? db : insertData(db);
    });
  }.bind(this);
};


/**
 * Fetches the data from an external source and inserts it to the DB.
 * @return {!IThenable}
 * @private
 */
FetcherService.prototype.insertData_ = function(table, dataFetcher) {
  console.log(table);
  return dataFetcher.fetchDeep()
  .then(
      function(rawData) {
        return this.lovefieldService_.insertData(rawData, table);
      }.bind(this));
};
