function Vert (loc, edge, norm) { this.loc = loc; this.edge = edge; this.norm = norm; }

function Face (edge) { this.edge = edge; }

function Edge (vert, next, opp, face) {
  this.vert = vert;
  this.next = next;
  this.opp = opp;
  this.face = face;
}

Vert.prototype.allEdges = function() {
  var es = [this.edge];
  for( var e = this.edge.next; e != this.edge; e = e.opp.next )
    es.push(e);
  return es;
};

Vert.prototype.eachEdge = function(func) {
  var e = this.edge;
  do {
    func(e);
    e = e.opp.next;
  } while( e != this.edge );
};

Face.prototype.allEdges = function() {
  var es = [this.edge];
  for( var e = this.edge.next; e != this.edge; e = e.next )
    es.push(e);
  return es;
};

Face.prototype.eachEdge = function(func) {
  var e = this.edge;
  do {
    func(e);
    e = e.next;
  } while( e != this.edge );
};

Face.prototype.eachVert = function(func) {
  var e = this.edge;
  do {
    func(e.vert);
    e = e.next;
  } while( e != this.edge );
};

Edge.prototype.split = function() {
  var loc = vec3.create();
  vec3.add( loc, this.vert.loc, this.opp.vert.loc );
  vec3.scale(loc, loc, .5);

  var e1 = new Edge(this.vert);
  var e2 = new Edge(this.opp.vert);

  var vert = new Vert(loc);
  vert.edge = this.face ? e2 : e1;

  this.vert = vert;
  this.opp.vert = vert;

  e1.next = this.next;
  e2.next = this.opp.next;
  e1.face = this.face;
  e2.face = this.opp.face;

  this.opp.opp = e1;  e1.opp = this.opp;
  this.opp = e2;      e2.opp = this;

  return [vert, e1, e2];
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

function Mesh (verts, edges, faces) {
  this.verts = verts;
  this.edges = edges;
  this.faces = faces;

  this.numVerts = verts.length;
  this.numEdges = edges.length;
  this.numFaces = faces.length;
}

Mesh.prototype.split = function(edge) {
  var res = edge.split();
  res[0].id = this.numVerts;  this.verts.push(res[0]);  this.numVerts++;
  this.edges.push(res[1], res[2]);  this.numEdges += 2;
  return res[0];
};

Mesh.prototype.splitAtVertex = function(vert) {
  var mesh = this;
  vert.eachEdge(function (e) {
    mesh.split(e.next);
  });
};

var Meshes = {};

Meshes.validate = function (mesh) {

  var verts = mesh.verts;
  var faces = mesh.faces;
  
  for( v in verts ) {
    if( !verts[v].edge ) {
      console.log(verts[v]);
      throw "vertex with no edge";
    }

    if( verts[v].edge.opp.vert != verts[v] ) {
      console.log(verts[v]);
      throw "vertex.edge.opp.vert != vertex";
    }
  }

  for( f in faces ) {
    var es = faces[f].allEdges();
    for( e in es ) {
      // all edges point to the same face
      if( es[e].face != faces[f] ) {
        console.log(es[e]);
        throw "face.allEdges don't all ponit to the same face";
      }

      // opposite of opposite edge is itself
      if( es[e].opp.opp != es[e] ) {
        console.log(es[e]);
        throw "edge.opp.opp != edge";
      }
    }
  }
}

Meshes.build = function (vertData, faceData) {

  /*
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
  */

  function getVertLocation (index) { return vertData[index * 2 + 1]; }
  function getFaceVertices (index) { return faceData[index * 2 + 1]; }

  var verts = [];
  for( var i = 0; i < vertData.length / 2; i++ ) {
    var v = new Vert(getVertLocation(i));
    v.id = i;

    v._out_ = NIL;

    verts.push(v);
  }

  var faces = [];
  var edges = [];
  var numEdges = 0;
  for( var i = 0; i < faceData.length / 2; i++ ) {
    var f = new Face();
    f.id = i;  f.level = 1;

    var vs = getFaceVertices(i);
    var lastId = vs[vs.length-1];
    for( id in vs ) {
      id = vs[id];
      var v0 = verts[lastId];
      var v1 = verts[id];

      var e = new Edge(v1, null, null, f);
      edges.push(e);
      e.id = numEdges;
      numEdges++;

      var opp = v1._out_.findWhere(function (e) { return e.vert == v0; });
      if( opp != NIL ) {
        e.opp = opp.val;    e.opp.opp = e;
      }

      verts[lastId]._out_ = verts[lastId]._out_.prepend(e);

      if( !f.edge ) {
        f.edge = e;
        f._first_edge_ = e;
      }
      else {
        f.edge.next = e;
        f.edge = e;
      }

      lastId = id;
    }

    f.edge.next = f._first_edge_;
    delete f._first_edge_;

    faces.push(f);
  }

  var outerRim = NIL;
  for (v in verts) {
    v = verts[v];
    var noOpp = v._out_.filter(function (e) {
      return e.opp == undefined;
    });

    if( noOpp != NIL ) {
      if( noOpp.size() > 1 )  throw "more than 1 rim edge at a vertex";

      var innerRim = noOpp.val;

      innerRim.opp = new Edge(v, null, innerRim, null);
      innerRim.vert.edge = innerRim.opp;
      outerRim = outerRim.prepend(innerRim.opp);
    }
    else {
      v.edge = v._out_.val;  // take the first edge
    }

    delete v._out_;
  };

  outerRim.foreach(function (e) {
    e.next = e.vert.edge;
  });

  return new Mesh(verts, edges, faces);
}