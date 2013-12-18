
//============================================//
//            LIST (RECURSIVE)                //
//============================================//

function List (val, tail) {
  this.val = val;
  this.tail = tail;
}

var NIL = new List(null, null);

function ListFill (num, filling) {
  var list = NIL;
  for (var i = 0; i < num; i++)
    list = new List(filling(), list);
  return list;
}

function ListFromArr (arr) {
  var list = NIL;
  for (var i = arr.length - 1; i >= 0; i--)
    list = new List(arr[i], list);
  return list;
}

List.prototype.toArr = function() {
  var arr = [];
  this.foreach(function (v) {
    arr.push(v);
  });
  return arr;
};

List.prototype.prepend = function(v) {
  return new List(v, this);
};

List.prototype.append = function(v) {
  if( this == NIL )
    return new List(v, NIL);
  return new List(this.val, this.tail.append(v));
};

List.prototype.filter = function(pred) {
  if( this == NIL )
    return NIL;
  else if( pred(this.val) )
    return new List(this.val, this.tail.filter(pred));
  else
    return this.tail.filter(pred);
};

List.prototype.findWhere = function(pred) {
  for(var l = this; l != NIL; l = l.tail)
    if(pred(l.val))
      return l;
  return NIL;
};

List.prototype.map = function(func) {
  if( this == NIL )
    return NIL;
  return new List(func(this.val), this.tail.map(func));
};

List.prototype.foreach = function(func) {
  for(var l = this; l != NIL; l = l.tail )
    func(l.val);
};

List.prototype.foreachIndexed = function(func) {
  var i = 0;
  for(var l = this; l != NIL; l = l.tail )
    func(l.val, i++);
};

List.prototype.forall = function(pred) {
  for(var l = this; l != NIL; l = l.tail )
    if( !pred(l.val) )
      return false;
  return true;
};

List.prototype.exists = function(pred) {
  for(var l = this; l != NIL; l = l.tail )
    if( pred(l.val) )
      return true;
  return false;
};

List.prototype.size = function(counter) {
  var n = 0;
  for(var l = this; l != NIL; l = l.tail ) n++;
  return n;
};

List.prototype.splitBy = function(pred, pair) {
  function makePair(first, second) {  var p = {};  p.first = first;  p.second = second;  return p;  }

  function dowork(list, pred) {
    if( list == NIL )  return makePair(NIL, NIL);

    var rem = dowork(list.tail, pred);
    if( pred(list.val) )    rem.first = new List(list.val, rem.first);
    else                    rem.second = new List(list.val, rem.second);
    return rem;
  }

  return dowork(this, pred);
};

//============================================//
//                  Arrays                    //
//============================================//

Arr = {};

Arr.exists = function (arr, pred) {
  for (var i = arr.length - 1; i >= 0; i--)
    if( pred(arr[i]) )
      return true;
  return false;
}

Arr.forall = function (arr, pred) {
  for (var i = arr.length - 1; i >= 0; i--)
    if( !pred(arr[i]) )
      return false;
  return true;
}

Arr.find = function (arr, pred) {
  for (var i = arr.length - 1; i >= 0; i--)
    if( pred(arr[i]) )
      return arr[i];
  return null;
}

Arr.foreach = function (arr, func) {
  for (var i = arr.length - 1; i >= 0; i--)
    func(arr[i]);
}

Arr.read = function (dest, src, offset, n) {
  for( var i = 0; i < n; i++ )
    dest[i] = src[offset + i];
  return dest;
}

Arr.copy = function (dest, src, offset_src, offset_dest, n) {
  for( var i = 0; i < n; i++ )
    dest[offset_dest + i] = src[offset_src + i];
  return dest;
}

//============================================//
//                   Set                      //
//============================================//

Set = function (comp) {
  this.contents = NIL;
  this.comp = comp;
  this.LT = function(b) {
    return function (a) {
      return comp(a, b) < 0;
    }
  }
  this.LE = function(b) {
    return function (a) {
      return comp(a, b) <= 0;
    }
  }
  this.EQ = function(b) {
    return function (a) {
      return comp(a, b) == 0;
    }
  }
  this.GE = function(b) {
    return function (a) {
      return comp(a, b) >= 0;
    }
  }
}

Set.prototype.put = function(e) {
  var place = this.contents.findWhere(this.GE(e));
  if( place == NIL )
    this.contents = this.contents.append(e);
  else {
    place.tail = new List(place.val, place.tail);
    place.val = e;
  }
};

Set.prototype.get = function(e) {
  var place = this.contents.findWhere(this.GE(e));
  if( place == NIL || this.comp(e, place.val) != 0 )
    return null;
  else
    return place.val;
};

Set.prototype.foreach = function(func) {
  this.contents.foreach(func);
};

// Set tester
(function () {
  function item(id, val) {
    this.id = id;
    this.val = (val || "val:" + id);
  }
  function comparator(a, b) { return a.id - b.id; }
  function show (set) { set.contents.foreach(function (v) { console.log(v); }); }

  var set = new Set(comparator);

  show(set);

  set.put(new item(5));
  set.put(new item(7));
  set.put(new item(9));
  set.put(new item(3));
  set.put(new item(6));

  show(set);

  console.log('--------');

  console.log('--- should find:');

  console.log(set.get(new item(3, 'xxx')));
  console.log(set.get(new item(7, 'xxx')));
  console.log(set.get(new item(9, 'xxx')));

  console.log('--- should not find:');

  console.log(set.get(new item(0, 'xxx')));
  console.log(set.get(new item(4, 'xxx')));
  console.log(set.get(new item(111, 'xxx')));

  console.log('--------');

  show(set);

})();
