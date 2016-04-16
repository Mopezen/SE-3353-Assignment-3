var canvas = new fabric.Canvas('canvas')
var mode = "SELECT";
var colour = "#0000ff";

var line, polyShape, objShape, Mdown, mightModify;

var copyObjects = new Array();
var _undo = new Array();
var _redo = new Array();
var savedCanvas;

function addUndo(){
	var _JSON = JSON.stringify(canvas);
	_undo.push(_JSON);

	_redo = new Array();
}

//Add a shape to the canvas based on the users selected mode
canvas.on('mouse:down', function(options){
	Mdown = true;
	if(mode === "LINE"){
		addUndo();
		var pointer = canvas.getPointer(options.e);
		var points = [pointer.x,pointer.y,pointer.x,pointer.y];
		line = new fabric.Line(points, {
			strokeWidth: 5,
			fill: colour,
			stroke: colour,
			originX: 'center',
			originY: 'center'
		});
		canvas.add(line);
	}else if(mode === "POLY"){
		addUndo();
		if(polyShape){
			var pointer = canvas.getPointer(options.e);
			var points = polyShape.get("points");
			points.push({
				x: pointer.x - polyShape.get("left"),
				y: pointer.y - polyShape.get("top")
			});
			polyShape.set({
				points: points
			});
			canvas.renderAll();
		}else{
			var pointer = canvas.getPointer(options.e);
			var newPoly = new fabric.Polygon([{
				x: pointer.x,
				y: pointer.y
			}, {
				x: pointer.x + 0.5,
				y: pointer.y + 0.5
			}], {
				fill: colour,
			});
			polyShape = newPoly;
			canvas.add(polyShape);
		}
	}else if(mode === "RECT" || mode === "SQUARE"){
		addUndo();
		var pointer = canvas.getPointer(options.e);
		var newShape = new fabric.Rect({
			left: pointer.x,
			top: pointer.y,
			width: 0,
			height: 0,
			fill: colour
		});
		objShape = newShape;
		canvas.add(objShape);
	}else if(mode === "CIRCLE"){
		addUndo();
		var pointer = canvas.getPointer(options.e);
		var newShape = new fabric.Circle({
			left: pointer.x,
			top: pointer.y,
			radius: 0,
			fill: colour
		});
		objShape = newShape;
		canvas.add(objShape);
	}else if(mode === "ELLIPSE"){
		addUndo();
		var pointer = canvas.getPointer(options.e);
		var newShape = new fabric.Ellipse({
			left: pointer.x,
			top: pointer.y,
			rx: 0,
			ry: 0,
			fill: colour
		});
		objShape = newShape;
		canvas.add(objShape);
	}
});

//Update the inital shape to the users mouse pointer as long as the mouse is held down
canvas.on('mouse:move', function(options){
	if(mode === "LINE"){
		if (!Mdown) return;
		var point = canvas.getPointer(options.e);
		line.set({ x2: point.x, y2: point.y });
		canvas.renderAll();
	}else if(mode === "POLY"){
		if(polyShape){
			var pointer = canvas.getPointer(event.e);
			var points = polyShape.get("points");
			points[points.length - 1].x = pointer.x - polyShape.get("left");
			points[points.length - 1].y = pointer.y - polyShape.get("top");
			polyShape.set({
				points: points,
			});
			canvas.renderAll();
		}
	}else if(mode === "RECT"){
		if(objShape){
			var pointer = canvas.getPointer(event.e);
			var _width = pointer.x - objShape.get("left");
			var _height = pointer.y - objShape.get("top") ;
			objShape.set({
				width: _width,
				height: _height,
				selectable: false
			});
			canvas.renderAll();
		}
	}else if(mode === "SQUARE"){
		if(objShape){
			var pointer = canvas.getPointer(event.e);
			var _width = pointer.x - objShape.get("left");
			var _height = pointer.y - objShape.get("top");

			if(Math.abs(_width) > Math.abs(_height)){
				_height = _width;
			}else{
				_width = _height;
			}			
			objShape.set({
				width: _width,
				height: _height,
				selectable: false
			});
			canvas.renderAll();
		}
	}else if(mode === "CIRCLE"){
		if(objShape){
			var pointer = canvas.getPointer(event.e);
			var _radius = Math.abs(pointer.x - objShape.get("left"));
			objShape.set({
				radius: _radius/2,
				selectable: false
			});
			canvas.renderAll();
		}
	}else if(mode === "ELLIPSE"){
		if(objShape){
			var pointer = canvas.getPointer(event.e);
			var _rx = Math.abs(pointer.x - objShape.get("left"));
			var _ry = Math.abs(pointer.y - objShape.get("top"));
			objShape.set({
				rx: _rx/2,
				ry: _ry/2,
				selectable: false
			});
			canvas.renderAll();
		}
	}
});

//Update that the mouse has been released & disable inital edits of new shapes
canvas.on('mouse:up', function(options){
	if(objShape !== null && mode !== "SELECT"){
		
	}
	Mdown = false;
	objShape = null;
});

//Handle various key clicks & preform the associated function for each key code.
fabric.util.addListener(window, 'keyup', function (e) {
	if (e.keyCode === 13) {//Enter: Remove the make poly mode.
		if (mode === "POLY") {
			addUndo();
			checkPolyMode();	
		}
	}else if(e.ctrlKey && e.keyCode === 67){//Ctrl+C: Copying selected items
		if(canvas.getActiveGroup()){
			for(var i in canvas.getActiveGroup().objects){
				var object = fabric.util.object.clone(canvas.getActiveGroup().objects[i]);
				console.log(canvas.getActiveGroup().objects[i].top);
				console.log(canvas.getActiveGroup().objects[i].left);
				object.set("top", 10);
				object.set("left", 10);
				copyObjects[i] = object;
			}                    
		}else if(canvas.getActiveObject()){
			var object = fabric.util.object.clone(canvas.getActiveObject());
			object.set("top", object.top + 5);
			object.set("left", object.left + object.width + 10);
			copyObjects = new Array();
			copyObjects[0] = object;
		}
	}else if(e.ctrlKey && e.keyCode === 86){//Ctrl+V: Paste items located on the clipboard currently
		if(copyObjects.length > 0){
			addUndo();
			for(var i in copyObjects){
				canvas.add(copyObjects[i]);
				copyObjects[i].setCoords();
			}
			canvas.renderAll();                      
		}	
	}else if(e.ctrlKey && e.keyCode === 88){//Ctrl+X: Cut the current selected item on the clipboard currently
		if(canvas.getActiveGroup()){
			for(var i in canvas.getActiveGroup().objects){
				var object = fabric.util.object.clone(canvas.getActiveGroup().objects[i]);
				console.log(canvas.getActiveGroup().objects[i].top);
				console.log(canvas.getActiveGroup().objects[i].left);
				object.set("top", 10);
				object.set("left", 10);
				copyObjects[i] = object;
			}
			canvas.getActiveGroup().forEachObject(function(o){ canvas.remove(o) });                    
		}else if(canvas.getActiveObject()){
			var object = fabric.util.object.clone(canvas.getActiveObject());
			object.set("top", object.top + 5);
			object.set("left", object.left + object.width + 10);
			copyObjects = new Array();
			copyObjects[0] = object;
			canvas.remove(canvas.getActiveObject());
		}
		canvas.deactivateAll().renderAll();
	}else if(e.ctrlKey && e.keyCode === 90){//Ctrl+Z: Undo Action 
		if(_undo.length > 0){
			var _JSON = JSON.stringify(canvas);
  			_redo.push(_JSON);

  			canvas.loadFromJSON(_undo.pop()); 
    		canvas.renderAll();
		}
	}else if(e.keyCode === 82){//R: Redo Action 
		if(_redo.length > 0){
			var _JSON = JSON.stringify(canvas);
			_undo.push(_JSON);

			canvas.loadFromJSON(_redo.pop()); 
			canvas.renderAll();
		}
	}else if(e.keyCode === 46){//DELETE: Deleting objects 
		if(canvas.getActiveGroup()){
			addUndo();
			canvas.getActiveGroup().forEachObject(function(o){ canvas.remove(o) });
			canvas.discardActiveGroup().renderAll();
		}else{
			if(canvas.getActiveObject().get('type')==="group"){
				addUndo();
				canvas.remove(canvas.getActiveObject());
			}else{
				addUndo();
				canvas.getActiveObject().remove();
			}
			canvas.renderAll();  
		}
	}else if(e.keyCode === 71){//G: Creating a group of objects
		if(canvas.getActiveGroup()){
			addUndo();
			var newGroup = new fabric.Group();
			canvas.getActiveGroup().forEachObject(function(o){
				if (fabric.util.getKlass(o.type).async) {
					o.clone(function (clone) {
						newGroup.addWithUpdate(clone);
						clone.setCoords();
					});
				}
				else {
					newGroup.addWithUpdate(o.clone());
					o.setCoords();
				}
				canvas.remove(o);
			});
			newGroup.set({left: 100, top: 100});
			canvas.setActiveObject(newGroup);
			canvas.add(newGroup);
			canvas.renderAll();
		}
	}else if(e.keyCode === 85){//U: Ungroup the selected Group 
		if(canvas.getActiveObject().get('type')==="group"){
			addUndo();
			items = canvas.getActiveObject()._objects;
			canvas.getActiveObject()._restoreObjectsState();
			canvas.remove(canvas.getActiveObject());
			for(var i = 0; i < items.length; i++) {
			  canvas.add(items[i]);
			}
			canvas.renderAll();
		}
	}
});

//If an object has been selected it may be modified which needs to be added to the undo. 

canvas.on('object:selected', function(e){
	mightModify = JSON.stringify(canvas);
});

//Verify that the selected object has been modified 
canvas.on('object:modified',function(e){
	if(mightModify){
		_undo.push(mightModify);
	}
})

function checkPolyMode(){
	if(mode === "POLY"){
		if(!polyShape){
			return;
		}
		var points = polyShape.get("points");
		points.pop();
		polyShape.set({
			points: points
		});

		var oldC = polyShape.getCenterPoint();
		polyShape._calcDimensions();

		var xx = polyShape.get("minX");
		var yy = polyShape.get("minY");
		polyShape.set({
			left: polyShape.get('left') + xx,
			top: polyShape.get('top') + yy
		});

		var pCenter = polyShape.getCenterPoint();
		var adjPoints = polyShape.get("points").map(function(p) {
			return {
				x: p.x - pCenter.x + oldC.x,
				y: p.y - pCenter.y + oldC.y
			};
		});
		polyShape.set({
			points: adjPoints,
			selectable: true
		});

		canvas.setActiveObject(polyShape);
		polyShape.setCoords();
		mode = "SELECT";
		polyShape = null;
		canvas.renderAll();
	}
}

/////////////////// Change the draw mode depending on what the button the user clicked ///////////////////////

function modeFree(){
	checkPolyMode();
	mode = "FREE";
	canvas.isDrawingMode = true; 
}

function modeLine(){
	checkPolyMode();
	mode = "LINE";
	canvas.selection = false;
	canvas.isDrawingMode = false;
}

function modeSelect(){
	checkPolyMode();
	mode = "SELECT";
	canvas.forEachObject(function(o){
		o.selectable = true;
		o.setCoords();

	});
	canvas.selection = true;
	canvas.isDrawingMode = false;
}

function modePoly(){
	checkPolyMode();
	mode = "POLY";
	canvas.selection = false;
	canvas.isDrawingMode = false;
}


function addRectange(){
	checkPolyMode();
	mode = "RECT";
	canvas.forEachObject(function(o){
		o.selectable = false;
	});
	canvas.isDrawingMode = false;
}

function addSquare(){
	checkPolyMode();
	mode = "SQUARE";
	canvas.forEachObject(function(o){
		o.selectable = false;
	});
	canvas.isDrawingMode = false;
}

function addCircle(){
	checkPolyMode();
	mode = "CIRCLE";
	canvas.forEachObject(function(o){
		o.selectable = false;
	});
	canvas.isDrawingMode = false;	
}

function addEllipse(){

	checkPolyMode();
	mode = "ELLIPSE";
	canvas.forEachObject(function(o){
		o.selectable = false;
	});
	canvas.isDrawingMode = false;
}

//When the colour selector's value has been changed update the value variable
function changeColour(){
	var clrPicker = document.getElementById("html5colorpicker");
	colour = clrPicker.value;
	canvas.freeDrawingBrush.color = colour;
}

//Save the current canvas in a JSON object
function saveCanvas() {

	if(savedCanvas){
		var r = confirm("A saved canvas exists! Would you like to overwrite it?");
		if(r === true){
			savedCanvas = JSON.stringify(canvas);
		}else{
			return;
		}
	}else{
		savedCanvas = JSON.stringify(canvas);
	}
};

//Load the current canvas to the saved JSON object
function loadCanvas() {

	if(savedCanvas){
		canvas.loadFromJSON(savedCanvas);
	}else{
		alert("No saved file exists!");
	}
};

//Clear the canvas
function clearCanvas() {
	canvas.clear().renderAll();
};

//Setup the canvas options
canvas.backgroundColor = 'rgb(245,242,240)';
canvas.renderAll();
changeColour();