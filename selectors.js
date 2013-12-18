function is (x)    { return function (y) { return x == y; }; }
function isNot (x) { return function (y) { return x != y; }; }

var SELECTED_COLOR = [1,0,0];
var UNSELECTED_COLOR = [.5,.5,.5];

/////////// SELCTOR /////////////

function _mark_selected_   (v) { v.SEL = true; }
function _mark_unselected_ (v) { delete v.SEL; }
function _is_selected_     (v) { return v.SEL ? true : false; }

function _color_selected_v_   (v) { v.col =   SELECTED_COLOR; updateVertCol(v); }
function _color_unselected_v_ (v) { v.col = UNSELECTED_COLOR; updateVertCol(v); }

function _color_selected_e_   (e) { e.col =   SELECTED_COLOR; updateEdgeCol(e); }
function _color_unselected_e_ (e) { e.col = UNSELECTED_COLOR; updateEdgeCol(e); }

function _make_selected_v_(v) {
    _mark_selected_(v);
    _color_selected_v_(v);
};
function _make_unselected_v_(v) {
    _mark_unselected_(v);
    _color_unselected_v_(v);
};
function _make_selected_e_ (e) {
    _mark_selected_(e);
    _color_selected_e_(e);
}
function _make_unselected_e_ (e) {
    _mark_unselected_(e);
    _color_unselected_e_(e);
}

//---------------------------------------------------

// sel must implement:
// - _selected_()
// - _select_on_(vert)
// - _select_off_(vert)
// and optional:
// - _unselect_all_()
function SelectorInterface (sel) { this.sel = sel; }

SelectorInterface.prototype.toggleSelect = function (vert) {
    if( vert.SEL )
        this.sel._select_off_(vert);
    else
        this.sel._select_on_(vert);
    console.log(this.selected().toArr());
};

SelectorInterface.prototype.selected = function() { return this.sel._selected_(); };

SelectorInterface.prototype.unselectAll = function() {
    var sel = this.sel;
    if( sel._unselect_all_ )
        sel._unselect_all_();
    else {
        console.log("[WARNING] selector does not have unselectAll");
        this.selected().foreach(function (v) { sel._select_off_(v); });
    }
};

//---------------------------------------------------

function _BaseSelector_() { }

_BaseSelector_.prototype.vs = NIL;

_BaseSelector_.prototype._select_on_ = function (v) {
    _make_selected_v_(v);  this.vs = this.vs.prepend(v);
};
_BaseSelector_.prototype._select_off_ = function (v) {
    _make_unselected_v_(v); this.vs = this.vs.filter(isNot(v));
};
_BaseSelector_.prototype._selected_ = function () {
    return this.vs;
};
_BaseSelector_.prototype._unselect_all_ = function () {
    this._selected_().foreach(function (v) { _make_unselected_v_(v); });
    this.vs = NIL;
}

//---------------------------------------------------

SelVertices = function () { };
SelVertices.prototype = new _BaseSelector_;

//---------------------------------------------------

SelVertex = function () { };
SelVertex.prototype = new _BaseSelector_;

SelVertex.prototype._select_on_ = function (v) {
    this._unselect_all_();
    this.constructor.prototype._select_on_.call(this, v); 
};

//---------------------------------------------------

SelEdge = function () { };
SelEdge.prototype = new _BaseSelector_;

SelEdge.prototype._select_on_ = function (v) {
    var num = this._selected_().size();

    if( num >= 2 )
        return;
    if( num == 1 ) {
        var v0 = this._selected_().val;

        var edge = Arr.find( v0.allEdges(), function (e) {
            return e.vert === v;
        });

        if( edge ) {
            this.constructor.prototype._select_on_.call(this, v);
            _color_unselected_v_(v);
            _color_unselected_v_(v0);

            this.edge = edge;
            _make_selected_e_(edge);
        }
        else return;
    }
    else {  // no vertices selected before-hand
        this.constructor.prototype._select_on_.call(this, v);
    }
};

SelEdge.prototype._select_off_ = function (v) {
    var num = this._selected_().size();

    if( num == 0 )
        return;
    else if( num == 1 ) {
        this.constructor.prototype._select_off_.call(this, v); 
    }
    else {  // two vertices selected
        _make_unselected_e_( this.edge );
        delete this.edge;

        this.constructor.prototype._select_off_.call(this, v); 
        _color_selected_v_(this._selected_().val);

        if( this._selected_().size() != 1 ) throw "something went terribly wrong";
    }
}

SelEdge.prototype._unselect_all_ = function () {
    this.constructor.prototype._unselect_all_.call(this);
    if( this.edge ) {
        _make_unselected_e_(this.edge);
        delete this.edge;
    }
}

//---------------------------------------------------

// When the selector has a selected face,
// this.sel.edge is set to an edge belonging to this face.
// A face pointer isn't used so that a null (outside) face may be selected.
SelFace = function () { };
SelFace.prototype = new _BaseSelector_;

SelFace.prototype.getFace = function() {
    return this.edge ? this.edge.face : null;
};

SelFace.prototype._select_off_ = function (v) {
    console.log("[WARNING] cannot unselect vertices during face selection; restart selector.");
};

SelFace.prototype._select_on_ = function (v) {
    var sel = this;
    var num = sel._selected_().size();

    if( num == 0 ) {
        this.constructor.prototype._select_on_.call(this, v);
    }
    else if( num == 1 ) {
        var v0 = sel._selected_().val;

        var e = Arr.find( v0.allEdges(), function (e) {
            return e.vert == v;
        });

        if( e ) {
            sel.face1 = e.face;
            sel.face2 = e.opp.face;
            this.constructor.prototype._select_on_.call(this, v);

            console.log(sel.face1, sel.face2);
        }
        else return;
    }
    else if( num >= 2 ) {
        var v0 = sel._selected_().val;

        // find an edge belonging to one of the faces being selected attached to the new vertex
        var edge = Arr.find( v.allEdges(), function (e) {
            return e.face === sel.face1 || e.face === sel.face2;
        });

        if( edge ) {

            // New edge has an opposite face F. If all selected vertices are between edge.face
            // and F, we cannot make the decision regarding which face is being selected.
            if( sel.vs.map(function (v) {
                return Arr.find( v.allEdges(), function (e) {   // v -> v.edge which belongs to face
                    return e.face === edge.face;
                } );
            }).exists(function (e) { return e.opp.face !== edge.opp.face; })) {
                // complete face selection
                sel.edge = edge;
                delete sel.face1;
                delete sel.face2;

                edge.eachEdge(function (e) {
                    _make_selected_e_(e);
                    if( !_is_selected_(e.vert) ) {
                        sel.constructor.prototype._select_on_.call(sel, e.vert);
                    }
                });
                return;
            }
        } else return;
    }
}

SelFace.prototype._unselect_all_ = function () {
    this.constructor.prototype._unselect_all_.call(this);
    if( this.edge ) {
        this.edge.eachEdge(function (e) {
            _make_unselected_e_(e);
        })
        delete this.edge;
    }
}