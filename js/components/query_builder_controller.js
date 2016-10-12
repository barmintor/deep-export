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
 * @param {!angular.Scope} $scope
 * @param {!FetcherService} fetcherService
 * @param {!LovefieldService} lovefieldService
 * @constructor
 */
var QueryBuilderController = function(
    $scope, fetcherService, queryTypeService, lovefieldService) {
  this.scope_ = $scope;
  $scope.filters = [];
  $scope.orderBy = 'pub_year';
  $scope.sortAscending = true;
  this.lovefieldService_ = lovefieldService;
  this.queryTypes_ = queryTypeService;

  this.addFilter('');

  this.timeWindows = [
    '1512-1661',
    '1512-1519'
  ];
};

QueryBuilderController.prototype.queryLabels = function() {
  return this.queryTypes_.queryLabels();
};

QueryBuilderController.prototype.addFilter = function(queryType) {
  this.scope_.filters.push(
    new QueryBuilderController.Filter(this.scope_, this.lovefieldService_, this.queryTypes_, queryType));
}

QueryBuilderController.prototype.orderBy = function(orderBy) {
  if (this.scope_.orderBy == orderBy){
    this.scope_.sortAscending = !this.scope_.sortAscending;
  } else {
    this.scope_.orderBy = orderBy;
    this.scope_.sortAscending = true;
  }
  this.search();
}

/**
 * Searches for data between the specified dates and plots them in a graph.
 */
QueryBuilderController.prototype.search = function() {
  if (!this.scope_.filters.reduce(((pre, cur) =>  cur.itemSelection || pre )), false) {
    return;
  }
  var query = [];
  var selector = this.lovefieldService_.selector();
  for (var index in this.scope_.filters) {
    var filter = this.scope_.filters[index];
    if (filter.itemSelection) {
      selector = filter.query().joinToDeep(selector, index);
      query.push(filter.toPredicate(index));
    }
  }

  this.lovefieldService_.getRows(selector, query,[this.scope_.orderBy, this.scope_.sortAscending]).
    then(this.updateRows_.bind(this));
};


/**
 * Updates the rows with new data.
 * @param {!Array<!Object>} data
 * @private
 */
QueryBuilderController.prototype.updateRows_ = function(data) {
  console.log("updateRows_ " + data.length + "  rows of data");
  this.scope_.$apply(function () {this.scope_.rows = data}.bind(this));
};

QueryBuilderController.Filter = function(
    $scope, lovefieldService, queryService, queryType) {
  this.scope_ = $scope;
  this.lovefieldService_ = lovefieldService;
  this.queryService_ = queryService;
  this.itemSelection = null;
  this.queryType = queryType;
  this.dropDownList = [];
};

/**
 * Executes whenever the user changes between search modes.
 */
QueryBuilderController.Filter.prototype.onQueryTypeChanged = function() {
  // Clearing the drop-down selection.
  this.itemSelection = null;

  var valuesPromise = this.query().values();
  valuesPromise.then(this.populateUi_.bind(this));
};

/**
 * The QueryType associated with the current queryType.
 * @return {!QueryBuilderController.QueryType}
 */
QueryBuilderController.Filter.prototype.query = function() {
  return this.queryService_.for(this.queryType)
};

QueryBuilderController.Filter.prototype.toPredicate = function(suffix) {
  return this.query().toPredicate(this.itemSelection, suffix);
};

/**
 * Populates the drop down list with the given query results, pre-selects an
 * item in the drop-down list and plots its data.
 * @param {!Array<!Object>} queryResults
 * @private
 */
QueryBuilderController.Filter.prototype.populateUi_ = function(values) {
  this.dropDownList = values;
  this.scope_.$apply();
};

var QueryTypeService = function($http, LovefieldService) {
  this.http_ = $http;
  this.lovefieldService_ = LovefieldService;
  this.queryTypes_ = [
    new QueryTypeService.QueryType(this.lovefieldService_, 'Genres','Deep.display_genre','List'),
    new QueryTypeService.QueryType(this.lovefieldService_, 'Authors','Authors.label','List'),
    new QueryTypeService.QueryType(this.lovefieldService_, 'Title','Deep.title','Text')
  ];
};

/**
 * @return {!IThenable}
 */
QueryTypeService.prototype.init = function() {
  return Promise.resolve(null);
};

QueryTypeService.prototype.for = function(label) {
  return this.queryTypes_.reduce(function(pre,cur) { return pre ? pre : (cur.label_ == label) ? cur : null }, null);
}

QueryTypeService.prototype.queryLabels = function() {
  return this.queryTypes_.map(function(mode) {return mode.label_});
};

QueryTypeService.QueryType = function(lovefieldService, label, column, type) {
  this.lovefieldService_ = lovefieldService;
  this.label_ = label;
  this.column_ = column;
  this.type_ = (type == undefined) ? 'Text' : type;
  this.values_ = null;
};

QueryTypeService.QueryType.prototype.type = function() {
  return this.type_;
};

QueryTypeService.QueryType.prototype.values = function() {
  if (this.values_ == null) {
    if (this.type_ == 'List') {
      return this.lovefieldService_.getList(this.column_)
      .then(function(results) {
        this.values_ = results.map(QueryTypeService.QueryType.firstValue);
        return Promise.resolve(this.values_);
      }.bind(this));
    } else {
      this.values_ = [];
    }
  }
  return Promise.resolve(this.values_);
};

QueryTypeService.QueryType.prototype.toPredicate = function(value, suffix) {
  suffix = suffix ? suffix : '';
  var columnInfo = this.column_.split('.');
  var table = this.lovefieldService_.getTable(columnInfo[0]);
  if (columnInfo[0] != 'Deep') table = table.as(columnInfo[0] + suffix);
  var column = columnInfo[1];
  if (this.type_ == 'List') {
    return table[column].eq(value);
  }
  if (this.type_ == 'Text') {
    return table[column].match(new RegExp(value, 'i'));
  }
  return null;
};

QueryTypeService.QueryType.prototype.joinToDeep = function(queryProducer, suffix) {
  var columnInfo = this.column_.split('.');
  if (columnInfo[0] == 'Deep') return queryProducer;
  suffix = suffix ? suffix : '';
  var deep = this.lovefieldService_.getTable('Deep');
  var joinTable = this.lovefieldService_.getTable('Deep' + columnInfo[0]).as('Deep' + columnInfo[0] + suffix);
  var toTable = this.lovefieldService_.getTable(columnInfo[0]).as(columnInfo[0] + suffix);
  var joinId = columnInfo[0].toLowerCase().replace(/s$/,'') + '_id';
  return function() {
    return queryProducer()
    .innerJoin(joinTable, deep.deep_id.eq(joinTable.deep_id))
    .innerJoin(toTable, joinTable[joinId].eq(toTable.id));
  }
};

QueryTypeService.QueryType.firstValue = function(obj) {
  return obj[Object.keys(obj)[0]]; // just get the single value
};
