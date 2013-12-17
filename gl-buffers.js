var BOUND_BUFFER = null;

function ensureBoundBuffer(buf) {
  if( BOUND_BUFFER === buf )
    return;
  buf.bufferBind();
  BOUND_BUFFER = buf;
}

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

  this.itemSize = offset;
  this.fields = fields;

  this.dataBuffer = gl.createBuffer();
}

BFieldSet.prototype.put = function(data, fieldname, index, newdata) {
  var offset = index * this.itemSize + this[fieldname].offset;
  var n = this[fieldname].len;
  for( var i = 0; i < n; i++ )
    data[offset + i] = newdata[i];
};

BFieldSet.prototype.read = function(data, fieldname, index, out) {
  var offset = index * this.itemSize + this[fieldname].offset;
  var n = this[fieldname].len;
  for( var i = 0; i < n; i++ )
    out[i] = data[offset + i];
};

BFieldSet.prototype.glSet = function(bufType, index, elementOffset, data) {
  gl.bufferSubData(
    bufType,
    (index * this.itemSize + elementOffset) * Float32Array.BYTES_PER_ELEMENT,
    new Float32Array(data));
}

BFieldSet.prototype.bufferBind = function (bufType) {
  gl.bindBuffer(bufType, this.dataBuffer);
}

BFieldSet.prototype.bufferData = function(bufType, data, drawMode) {
  this.numItems = data.length / this.itemSize;
  this.bufferBind(bufType);
  gl.bufferData(bufType, data, drawMode);
};

var XXX = 0;

BFieldSet.prototype.bufferDraw = function(bufType, drawType) {
//  gl.bindBuffer(bufType, this.dataBuffer);
  ensureBoundBuffer(this);
  var stride = this.itemSize * Float32Array.BYTES_PER_ELEMENT;
  for( f in this.fields ) {
    f = this.fields[f];
    if( f.shaderAttr == null || f.shaderAttr == undefined )
      throw "field does not have a shader attribute"
    gl.vertexAttribPointer(f.shaderAttr, f.len, gl.FLOAT, false, stride, f.offset * Float32Array.BYTES_PER_ELEMENT);
  }
  gl.drawArrays(drawType, 0, this.numItems);
};

BLocField = function (name) { return new BField(name, 3); }
BColField = function (name) { return new BField(name, 3); }

//=========================================

BVertData = function () {
  var LOC = BLocField("LOC");
  var COL = BColField("COL");

  BFieldSet.call(this, [LOC, COL]);
}

BVertData.prototype = Object.create(BFieldSet.prototype);

BVertData.constructor = BVertData;

BVertData.prototype.getCol = function (data, index, out) {
  this.read(data, 'COL', index, out);
  return out;
}

BVertData.prototype.setCol = function (data, index, col) {
  this.put(data, 'COL', index, col);
}

BVertData.prototype.getLoc = function (data, index, out) {
  this.read(data, 'LOC', index, out);
  return out;
}

BVertData.prototype.setLoc = function (data, index, loc) {
  this.put(data, 'LOC', index, loc);
}

BVertData.prototype.glSetCol = function(index, col) {
  console.log("coloring...", BOUND_BUFFER.name, index, col);
  this.glSet(gl.ARRAY_BUFFER, index, this['COL'].offset, col);
};

BVertData.prototype.glSetLoc = function(bufType, index, loc) {
  gl.bufferSubData(
    bufType,
    (index * this.itemSize + this['LOC'].offset) * Float32Array.BYTES_PER_ELEMENT,
    new Float32Array(loc));
};

BVertData.prototype.bufferBind = function() {
  BFieldSet.prototype.bufferBind.call(this, gl.ARRAY_BUFFER);
};

BVertData.prototype.bufferData = function(data) {
  BFieldSet.prototype.bufferData.call(this, gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
};

BVertData.prototype.bufferDraw = function(drawingMode) {
  BFieldSet.prototype.bufferDraw.call(this, gl.ARRAY_BUFFER, drawingMode)
};

//=========================================

BEdgeData = function () {
  BVertData.call(this);
}

BEdgeData.prototype = Object.create(BVertData.prototype);

BEdgeData.constructor = BEdgeData;

delete BEdgeData.prototype.getLoc;

BEdgeData.prototype.getCol = function (data, index, out) {
  return BVertData.prototype.getCol.call(this, data, index * 2, out);
}

BEdgeData.prototype.setCol = function (data, index, col) {
  BVertData.prototype.setCol.call(this, data, index * 2,     col);
  BVertData.prototype.setCol.call(this, data, index * 2 + 1, col);
}

BEdgeData.prototype.getLoc1 = function (data, index, out) {
  return BVertData.prototype.getLoc.call(this, data, index * 2, out);
}

BEdgeData.prototype.getLoc2 = function (data, index, out) {
  return BVertData.prototype.getLoc.call(this, data, index * 2 + 1, out);
}

BEdgeData.prototype.setLoc1 = function (data, index, loc) {
  BVertData.prototype.setLoc.call(this, data, index * 2, loc);
}

BEdgeData.prototype.setLoc2 = function (data, index, loc) {
  BVertData.prototype.setLoc.call(this, data, index * 2 + 1, loc);
};

BEdgeData.prototype.glSetCol = function(index, col) {
  this.glSetCol1(index, col);
  this.glSetCol2(index, col);
};

BEdgeData.prototype.glSetCol1 = function(index, col) {
  BVertData.prototype.glSetCol.call(this, index * 2, col);
};

BEdgeData.prototype.glSetCol2 = function(index, col) {
  BVertData.prototype.glSetCol.call(this, index * 2 + 1, col);
};

BEdgeData.prototype.glSetLoc1 = function(index, loc) {
  BVertData.prototype.glSetLoc.call(this, index * 2, loc);
};

BEdgeData.prototype.glSetLoc2 = function(index, loc) {
  BVertData.prototype.glSetLoc.call(this, index * 2 + 1, loc);
};

BEdgeData.prototype.bufferBind = function() {
  BFieldSet.prototype.bufferBind.call(this, gl.ARRAY_BUFFER);
};

BEdgeData.prototype.bufferData = function(data) {
  BFieldSet.prototype.bufferData.call(this, gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
};

BEdgeData.prototype.bufferDraw = function(drawingMode) {
  BFieldSet.prototype.bufferDraw.call(this, gl.ARRAY_BUFFER, drawingMode)
};

