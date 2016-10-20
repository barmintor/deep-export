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
 * A singleton service used by the rest of the application to make calls to the
 * Lovefield API.
 * @constructor
 */
var LovefieldService = function() {
  // Following member variables are initialized within getDbConnection().
  this.db_ = null;
  this.deep_ = null;
  this.deepAuthors_ = null;
  this.authors_ = null;
};


/**
 * Initializes member variables that can't be initialized before getting a
 * connection to the database.
 * @private
 */
LovefieldService.prototype.onConnected_ = function() {
  this.deep_ = this.db_.getSchema().table('Deep');
  this.deepAuthors_ = this.db_.getSchema().table('DeepAuthors');
  this.authors_ = this.db_.getSchema().table('Authors');
  console.log('DB connection established.');
};


/**
 * Instantiates the DB connection (re-entrant).
 * @return {!IThenable<!lf.Database>}
 */
LovefieldService.prototype.getDbConnection = function() {
  if (this.db_ != null) {
    console.log('returning initialized dbConnection');
    return this.db_;
  }

  var schemaBuilder = this.buildSchema_();
  console.log('built schema');
  // This is necessary for the app to run with no errors while codelab step1 has
  // not been implemented yet.
  if (schemaBuilder == null) {
    return Promise.resolve(null);
  }

  var connectOptions = {storeType: lf.schema.DataStoreType.INDEXED_DB};
  return schemaBuilder.connect(connectOptions).then(
      function(db) {
        this.db_ = db;
        this.onConnected_();
        return db;
      }.bind(this));
};


/**
 * Builds the database schema.
 * @return {!lf.schema.Builder}
 * @private
 */
LovefieldService.prototype.buildSchema_ = function() {
  var schemaBuilder = lf.schema.create('deep', 1);

  schemaBuilder.createTable('Deep').
  addColumn('deep_id', lf.Type.STRING).
  addColumn('bib_ind_and_in_coll', lf.Type.STRING).
  addColumn('title', lf.Type.STRING).
  addColumn('title_alternative_keywords').
  addColumn('pub_year', lf.Type.INTEGER).
  addColumn('pub_year_display', lf.Type.STRING).
  addColumn('first_production_date', lf.Type.STRING).
  addColumn('first_production_date_display', lf.Type.STRING).
  addColumn('first_publish_date', lf.Type.STRING).
  addColumn('record_type', lf.Type.STRING).
  addColumn('theater_type', lf.Type.STRING).
  addColumn('greg_number', lf.Type.STRING).
  addColumn('stc_or_wing', lf.Type.STRING).
  addColumn('stc_or_wing2', lf.Type.STRING).
  addColumn('play_edition_number', lf.Type.STRING).
  addColumn('book_edition_number', lf.Type.STRING).
  addColumn('variant_description', lf.Type.STRING).
  addColumn('edition', lf.Type.STRING).
  addColumn('total_editions', lf.Type.INTEGER).
  addColumn('leaves', lf.Type.STRING).
  addColumn('illustration_on_tp_or_frontis', lf.Type.STRING).
  addColumn('sr_entries', lf.Type.STRING).
  addColumn('format', lf.Type.STRING).
  addColumn('additional_notes', lf.Type.STRING).
  addColumn('transcript_title', lf.Type.STRING).
  addColumn('transcript_author', lf.Type.STRING).
  addColumn('transcript_performance', lf.Type.STRING).
  addColumn('transcript_latin', lf.Type.STRING).
  addColumn('transcript_imprint', lf.Type.STRING).
  addColumn('transcript_explicit', lf.Type.STRING).
  addColumn('transcript_colophon', lf.Type.STRING).
  addColumn('transcript_dedication', lf.Type.STRING).
  addColumn('transcript_commendatory_verses', lf.Type.STRING).
  addColumn('transcript_to_the_reader', lf.Type.STRING).
  addColumn('transcript_printed_license', lf.Type.STRING).
  addColumn('transcript_general_title', lf.Type.STRING).
  addColumn('transcript_woodcut', lf.Type.STRING).
  addColumn('transcript_character_list', lf.Type.STRING).
  addColumn('transcript_actor_list', lf.Type.STRING).
  addColumn('transcript_argument', lf.Type.STRING).
  addColumn('transcript_modern_spelling', lf.Type.STRING).
  addColumn('display_play_type', lf.Type.STRING).
  addColumn('display_authors', lf.Type.STRING).
  addColumn('display_genre', lf.Type.STRING).
  addColumn('display_booksellers', lf.Type.STRING).
  addColumn('display_printers', lf.Type.STRING).
  addColumn('display_publishers', lf.Type.STRING).
  addColumn('display_companies', lf.Type.STRING).
  addColumn('display_auspices', lf.Type.STRING).
  addColumn('errata', lf.Type.STRING).
  addColumn('imprintlocation', lf.Type.STRING).
  addPrimaryKey(['deep_id']).
  addIndex('idxAuthor', ['display_authors'], false, lf.Order.ASC).
  addIndex('idxPubYear', ['pub_year'], false, lf.Order.ASC);

  schemaBuilder.createTable('Authors').
  addColumn('id', lf.Type.STRING).
  addColumn('label', lf.Type.STRING).
  addPrimaryKey(['id']).
  addIndex('idxValue', ['label'], false, lf.Order.ASC);

  schemaBuilder.createTable('DeepAuthors').
  addColumn('deep_id', lf.Type.STRING).
  addColumn('author_id', lf.Type.STRING).
  addColumn('uncertain', lf.Type.BOOLEAN).
  addPrimaryKey(['deep_id','author_id']).
  addIndex('idxDeep', ['deep_id'], false, lf.Order.ASC).
  addIndex('idxAuthor', ['author_id'], false, lf.Order.ASC);

  return schemaBuilder;
};

LovefieldService.prototype.getTable = function(table) {
  if (table == 'Deep') return this.getDeep();
  if (table == 'DeepAuthors') return this.getDeepAuthors();
  if (table == 'Authors') return this.getAuthors();
  console.log("unknown table");
  console.log(table);
  return null;
}
LovefieldService.prototype.getDeep = function() {
  if (this.deep_ != null) {
    return this.deep_;
  } else {
    return Promise.resolve(null);
  }
};
LovefieldService.prototype.getDeepAuthors = function() {
  if (this.deepAuthors_ != null) {
    return this.deepAuthors_;
  } else {
    return Promise.resolve(null);
  }
};
LovefieldService.prototype.getAuthors = function() {
  if (this.authors_ != null) {
    return this.authors_;
  } else {
    return Promise.resolve(null);
  }
};


/**
 * Inserts data in the Deep table.
 * @param {!Array<!Csv>} rawData
 * @return {!IThenable} A promise that is resolved after table has been
 *     populated.
 */
LovefieldService.prototype.insertData = function(rawData, table) {
  console.log('insertData');
  if (table == null) table = this.getDeep();
  var db = this.db_;
  return new Promise(
    function(resolve, reject) {
      db.delete().from(table).exec();
      var rows = rawData.data.map(function(result) {
        var row = table.createRow(result);
        return row;
      });
      resolve(db.insertOrReplace().into(table).values(rows).exec());
    }
  );
};


/**
 * @return {!IThenable<!Array<!Object>>} The sorted list of distinct column values.
 */
LovefieldService.prototype.getList = function(columnSpec) {
  // Retrieve a list of all authors.
  var db = this.db_;
  var columnInfo = columnSpec.split('.');
  var table = this.getTable(columnInfo[0]);
  var field = columnInfo[1];
  var values = db.select(lf.fn.distinct(table[field])).from(table).orderBy(table[field]);
  return new Promise(function(resolve, reject) { resolve(values.exec()) });
};

/**
 * @return unexecuted Lovefield select statement
 */
LovefieldService.prototype.selector = function() {
  return function() {
    var deep = this.getDeep();
    return this.db_
    .select(
      deep.pub_year.as('pub_year'),
      deep.pub_year_display.as('pub_year_display'),
      deep.display_authors.as('display_authors'),
      deep.title.as('title'),
      deep.deep_id.as('deep_id'))
    .from(deep);
  }.bind(this);
};

LovefieldService.prototype.getRows = function(selector, conditions, sort) {
  console.log("getRows: [" + conditions[0] + "], [" + conditions[1] + "]");
  if (conditions == null) {
      return Promise.resolve([]);
  }
  var deep = this.getDeep();
  var db = this.db_;
  if (conditions.length > 1) {
    conditions = lf.op.and.apply(this,conditions);
  } else {
    conditions = conditions[0];
  }
  var rows = selector().where(conditions, deep).groupBy(deep.deep_id);
  if (sort) rows = rows.orderBy(deep[sort[0]], sort[1] ? lf.Order.ASC : lf.Order.DESC);
  return Promise.resolve(rows.exec());
};

