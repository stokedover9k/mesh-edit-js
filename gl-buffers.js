
BField = function (name, len, offset) {
  this.name = name;
  this.len = len;
  this.offset = offset;
}

BFieldSet = function (fields) {
  var offset = 0, len = fields.length;
  for( var i = 0; i < len; i++ ) {
    fields[i].offset = offset;
    this[fields[i].name] = fields[i];
    offset += fields[i].len;
  }

  this.len = offset;
  this.fields = fields;
}

BFieldSet.prototype.put = function(data, fieldname, index, newdata) {
  var offset = index * this.len + this[fieldname].offset;
  var n = this[fieldname].len;
  for( var i = 0; i < n; i++ )
    data[offset + i] = newdata[i];
};

BFieldSet.prototype.read = function(data, fieldname, index, out) {
  var offset = index * this.len + this[fieldname].offset;
  var n = this[fieldname].len;
  for( var i = 0; i < n; i++ )
    out[i] = data[offset + i];
};

BLocField = function (name) { return new BField(name, 3); }
BColField = function (name) { return new BField(name, 3); }

//=========================================

BVertData = (function () {
  var LOC = BLocField("LOC");
  var COL = BColField("COL");

  return new BFieldSet([LOC, COL]);
})();

BVertData.getCol = function (data, index, out) {
  BVertData.read(data, 'COL', index, out);
  return out;
}

BVertData.setCol = function (data, index, col) {
  BVertData.put(data, 'COL', index, col);
}

BVertData.getLoc = function (data, index, out) {
  BVertData.read(data, 'LOC', index, out);
  return out;
}

BVertData.setLoc = function (data, index, loc) {
  BVertData.put(data, 'LOC', index, loc);
}

//=========================================

BEdgeData = (function () {
  var LOC_1 = BLocField("LOC1");
  var LOC_2 = BLocField("LOC2");
  var COL_1 = BColField("COL1");
  var COL_2 = BColField("COL2");

  return new BFieldSet([LOC_1, COL_1, LOC_2, COL_2]);
})();

BEdgeData.getCol = function (data, index, out) {
  BEdgeData.read(data, 'COL1', index, out);
  return out;
}

BEdgeData.setCol = function (data, index, col) {
  BEdgeData.put(data, 'COL1', index, col);
  BEdgeData.put(data, 'COL2', index, col);
}

BEdgeData.getLoc1 = function (data, index, out) {
  BEdgeData.read(data, 'LOC1', index, out);
}

BEdgeData.getLoc2 = function (data, index, out) {
  BEdgeData.read(data, 'LOC2', index, out);
}

BEdgeData.setLoc1 = function (data, index, loc) {
  BEdgeData.put(data, 'LOC1', index, loc);
}

BEdgeData.setLoc2 = function (data, index, loc) {
  BEdgeData.put(data, 'LOC2', index, loc);
};

//========================================

// --- test ---
(function () {

  console.log("doing stuff")

  function makeEdge(i) {
    var a = i * 4, b = a+1, c = b+1, d = c+1;
    return [a,a,a, b,b,b, c,c,c, d,d,d];
  }

  var data = [];
  data = data.concat(makeEdge(0));
  data = data.concat(makeEdge(1));

  console.log(data);

  var out = new Array(3);
  BEdgeData.getCol(data, 1, out);
  console.log(out);

  BEdgeData.getLoc1(data, 1, out);
  console.log(out);

  BEdgeData.getLoc2(data, 1, out);
  console.log(out);

  BEdgeData.setCol(data, 1, [9,9,9]);
  console.log(data);

})();
