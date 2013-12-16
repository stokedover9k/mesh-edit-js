function is (x)    { return function (y) { return x == y; }; }
function isNot (x) { return function (y) { return x != y; }; }

/////////// SELCTOR /////////////

function _make_selected_(v) {
    v.SEL = true;  v.col = [1,1,1];
    vertsToUpdate = vertsToUpdate.prepend(v);
};
function _make_unselected_(v) {
    console.log("unselecting", v);
    delete v.SEL;  v.col = [0,0,0];
    vertsToUpdate = vertsToUpdate.prepend(v);
};
function _is_selected_ (v) {
    return v.SEL ? true : false;
};

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

function _BaseSelector_() { this.vs = NIL; }

_BaseSelector_.prototype._select_on_ = function (v) {
    _make_selected_(v);  this.vs = this.vs.prepend(v);
};
_BaseSelector_.prototype._select_off_ = function (v) {
    _make_unselected_(v); this.vs = this.vs.filter(isNot(v));
};
_BaseSelector_.prototype._selected_ = function () {
    return this.vs;
};
_BaseSelector_.prototype._unselect_all_ = function () {
    this._selected_().foreach(function (v) { _make_unselected_(v); });
    this.vs = NIL;
}

//---------------------------------------------------

function SelVertices () {
    var sel = new _BaseSelector_();
    return new SelectorInterface( sel );
}

//---------------------------------------------------

function SelVertex () {
    var sel = new _BaseSelector_();

    sel._select_on_ = function (v) {
        sel._unselect_all_();
        _make_selected_(v);
        sel.vs = sel.vs.prepend(v);
    };

    return new SelectorInterface( sel );
}

//---------------------------------------------------

function SelEdge () {
    var sel = new _BaseSelector_();

    function numSelected () { return sel._selected_().size(); }

    sel._select_on_ = function (v) {
        var num = numSelected();

        if( num >= 2 )
            return;
        if( num == 1 ) {
            var v0 = sel._selected_().val;
            var ok = false;
            v.eachEdge(function (e) { if( e.vert == v0 ) ok = true; })
            if( !ok )
                return;
        }

        _make_selected_(v);
        sel.vs = sel.vs.prepend(v);
    };

    return new SelectorInterface( sel );
}

//---------------------------------------------------

function SelFace () {
    var sel = new _BaseSelector_();

    sel._select_off_ = function (v) {
        console.log("[WARNING] cannot unselect vertices during face selection; restart selector.");
    };

    sel._select_on_ = function (v) {
        var num = sel._selected_().size();

        if( num == 0 ) {
            // do nothing
        }
        else if( num == 1 ) {
            var v0 = sel._selected_().val;

            var e = Arr.find( v0.allEdges(), function (e) {
                return e.vert == v;
            });

            if( e ) {
                sel.face1 = e.face;
                sel.face2 = e.opp.face;
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
                    sel.face = edge.face;
                    delete sel.face1;
                    delete sel.face2;

                    edge.eachEdge(function (e) {
                        if( !_is_selected_(e.vert) ) {
                            _make_selected_(e.vert);
                            sel.vs = sel.vs.prepend(e.vert);
                        }
                    });
                    return;
                }
            } else return;
        }

        _make_selected_(v);
        sel.vs = sel.vs.prepend(v);
    }

    return new SelectorInterface( sel );
}