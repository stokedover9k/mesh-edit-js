function Vert (loc, edge, norm) { this.loc = loc; this.edge = edge; this.norm = norm; }

function Face (edge) { this.edge = edge; }

function Edge (vert, next, opp, face) {
  this.vert = vert;
  this.next = next;
  this.opp = opp;
  this.face = face;
}

Face.prototype.allEdges = function() {
  var es = [this.edge];
  for( var e = this.edge.next; e != this.edge; e = e.next )
    es.push(e);
  return es;
};

Vert.prototype.toString = function() {
  if( this.id !== undefined )
    return "v<" + this.id + ">";
  else
    return "v<[" + this.loc[0] + " " + this.loc[1] + " " + this.loc[2] + "]>";
};

Edge.prototype.toString = function() {
  return "e<" + this.vert.toString() + ">";
};

Face.prototype.toString = function() {
  var es = this.allEdges();
  var str = "";
  for( e in es ) {
    str = str + es[e].vert.toString() + " ";
  }
  return str;
};

function buildMesh () {

  var vertData = [
    0,  [-1,-1,0],
    1,  [ 1,-1,0],
    2,  [ 1, 1,0],
    3,  [-1, 1,0]
  ];

  var faceData = [
    0,  [0,1,2],
    1,  [0,2,3]
  ];

  function getVertData (index) { return vertData[index * 2 + 1]; }
  function getFaceData (index) { return faceData[index * 2 + 1]; }

  var verts = [];
  for( var i = 0; i < vertData.length / 2; i++ ) {
    var v = new Vert(getVertData(i));
    v.id = i;

    v._inc_ = NIL;
    v._out_ = NIL;

    verts.push(v);
  }

  var faces = [];
  for( var i = 0; i < faceData.length / 2; i++ ) {
    var f = new Face();
    f.id = i;

    var vs = getFaceData(i);
    var lastId = vs[vs.length-1];
    for( id in vs ) {
      id = vs[id];
      var v0 = verts[lastId];
      var v1 = verts[id];

      console.log(v0, v1);

      var e = new Edge(v1, null, null, f)

      var opp = v1._out_.findWhere(function (e) { return e.vert == v0; });
      if( opp != NIL ) {
        e.opp = opp.val;    e.opp.opp = e;
      }

      verts[id]._inc_ = verts[id]._inc_.prepend(e);
      verts[lastId]._out_ = verts[lastId]._out_.prepend(e);

      if( !f.edge ) {
        f.edge = e;
        f._first_edge_ = e;
      }
      else {
        f.edge.next = e;
        f.edge = e;
      }

      console.log(e);

      lastId = id;
    }

    f.edge.next = f._first_edge_;
    delete f._first_edge_;

    faces.push(f);
  }
  for( f in faces )
    console.log(faces[f].toString());

  var outerRim = NIL;
  for (v in verts) {
    v = verts[v];
    var noOpp = v._out_.filter(function (e) {
      return e.opp == undefined;
    });

    if( noOpp != NIL ) {
      if( noOpp.size() > 1 )  throw "more than 1 rim edges at a vertex";

      var innerRim = noOpp.val;

      innerRim.opp = new Edge(v, null, innerRim, null);
      innerRim.vert.edge = innerRim.opp;
      outerRim = outerRim.prepend(innerRim.opp);
    }
    else {
      v.edge = v._out_.val;  // take the first edge
    }
  };

  outerRim.foreach(function (e) {
    e.next = e.vert.edge;
  });
}