function Vert (loc, edge, norm) { this.loc = loc; this.edge = edge; this.norm = norm; this.col = [0,0,0]; }

function Face (edge) { this.edge = edge; }

function Edge (vert, next, opp, face) {
  this.vert = vert;
  this.next = next;
  this.opp = opp;
  this.face = face;
}

Vert.prototype.allEdges = function() {
  var es = [];
  this.eachEdge(function (e) { es.push(e); });
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

Edge.prototype.prev = function() {
  edge = this.next;
  while( edge.next != this )
    edge = edge.next;
  return edge;
};

Edge.prototype.split = function() {
  var loc = vec3.create();
  vec3.add( loc, this.vert.loc, this.opp.vert.loc );
  vec3.scale(loc, loc, .5);

  var e1 = new Edge(this.vert);
  var e2 = new Edge(this.opp.vert);

  var vert = new Vert(loc);

  this.vert = vert;
  this.opp.vert = vert;

  e1.next = this.next;
  e2.next = this.opp.next;
  e1.face = this.face;
  e2.face = this.opp.face;

  vert.edge = this.face ? e2 : e1;

  this.opp.opp = e1;  e1.opp = this.opp;  this.opp.next = e2;
  this.opp = e2;      e2.opp = this;      this.next = e1;

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

Mesh.prototype.addVert = function(v) { v.id = this.numVerts;  this.numVerts++;  this.verts.push(v);  return v; };
Mesh.prototype.addEdge = function(e) { e.id = this.numEdges;  this.numEdges++;  this.edges.push(e);  return e; };
Mesh.prototype.addFace = function(f) { f.id = this.numFaces;  this.numFaces++;  this.faces.push(f);  return f; };

Mesh.prototype.split = function(edge) {
  var res = edge.split();
  this.addVert(res[0]);
  this.addEdge(res[1]);
  this.addEdge(res[2]);
  return res[0];
};

Mesh.prototype.splitAtVertex = function(vert) {
  var mesh = this;

  var edges = vert.allEdges();
  vert.eachEdge(function (e) {
    if( e.face != null ) {
      var vMid = mesh.split(e.next);

      var face = mesh.addFace( new Face() );

      var e1 = mesh.addEdge( new Edge(vert, e, null, e.face) );
      var e2 = mesh.addEdge( new Edge(vMid, e.next.next, e1, face ) );
      e1.opp = e2;

      e.prev().next = e2;
      e.next.next = e1;

      face.edge = e2;
      face.eachEdge(function (e) { e.face = face; });

      e.face.edge = e;
    }
  });
};

var Meshes = {};

Meshes.validate = function (mesh) {

  var verts = mesh.verts;
  var faces = mesh.faces;
  var edges = mesh.edges;
  
  for( v in verts ) {
    if( typeof verts[v].id != 'number' ) {
      console.log(verts[v]);
      throw "vertex does not have an id";
    }

    if( !verts[v].edge ) {
      console.log(verts[v]);
      throw "vertex with no edge";
    }

    if( verts[v].edge.opp.vert != verts[v] ) {
      console.log(verts[v]);
      throw "vertex.edge.opp.vert != vertex";
    }

    if( verts[v].edge.face ) {
      verts[v].eachEdge(function (e) {
        if( ! e.face ) {
          console.log(verts[v]);
          throw "vertex should be pointing to a boundary edge";
        }
      })
    }
  }

  for( f in faces ) {
    if( typeof faces[f].id != 'number' ) {
      console.log(faces[f]);
      throw "face does not have an id";
    }

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

  for( e in edges ) {
    if( typeof edges[e].id != 'number' ) {
      console.log(edges[e]);
      throw "edge does not have an id";
    }

    var e = edges[e];
    var n = 0;
    var ee = e;
    for( ; n < 100; n++ ) {
      ee = ee.next;
      if( ee == e )
        break;
    }
    if( ee == 100 )
      console.log(e, "too many edges in a ring");
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

  var mesh = new Mesh([], [], []);

  for( var i = 0; i < vertData.length / 2; i++ ) {
    var v = mesh.addVert( new Vert(getVertLocation(i)) );
    v._out_ = NIL;
  }

  var numEdges = 0;
  for( var i = 0; i < faceData.length / 2; i++ ) {
    var f = mesh.addFace( new Face() );
    f.level = 1;

    var vs = getFaceVertices(i);
    var lastId = vs[vs.length-1];
    for( id in vs ) {
      id = vs[id];
      var v0 = mesh.verts[lastId];
      var v1 = mesh.verts[id];

      var e = mesh.addEdge( new Edge(v1, null, null, f) );

      var opp = v1._out_.findWhere(function (e) { return e.vert == v0; });
      if( opp != NIL ) {
        e.opp = opp.val;    e.opp.opp = e;
      }

      mesh.verts[lastId]._out_ = mesh.verts[lastId]._out_.prepend(e);

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
  }

  var outerRim = NIL;
  for (v in mesh.verts) {
    v = mesh.verts[v];
    var noOpp = v._out_.filter(function (e) {
      return e.opp == undefined;
    });

    if( noOpp != NIL ) {
      if( noOpp.size() > 1 )  throw "more than 1 rim edge at a vertex";

      var innerRim = noOpp.val;

      innerRim.opp = mesh.addEdge( new Edge(v, null, innerRim, null) );
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

  return mesh;
}