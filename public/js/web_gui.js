var manager = null;
var lin = 0.0;
var ang = 0.0;
var linvel = 0.5;
var angvel = 1.0;
var ros;
var cmd_vel;
var twist;
var cameratopic = "/realsense_right/color/image_raw";
var video;
var logmsg;

function rosconnection() {
    logmsg = document.getElementById("logmsg");
    // Connecting to ROS
     ros = new ROSLIB.Ros({
        url : 'ws://localhost:9089'
    });
         
    ros.on('connection', function() {
        console.log('Connected to websocket server.');
        logmsg.innerHTML += "<br /> Connected to websocket server.";
    });
         
    ros.on('error', function(error) {
        console.log('Error connecting to websocket server: ', error);
        logmsg.innerHTML += "<br /> Error connecting to websocket server";
    });
         
    ros.on('close', function() {
        console.log('Connection to websocket server closed.');
        logmsg.innerHTML += "<br /> Connection to websocket server closed.";
    });
    
}

function createJoystick() {
    if (manager == null) {
        joystickContainer = document.getElementById('joystick');
        var options = {
            zone: joystickContainer,
            color: "#f0e2ff",
            size: 175,
            position: { top: 525 + 'px', left: 15 + '%'},
            mode: 'static',
            restJoystick: true

        };

        manager = nipplejs.create(options);

        manager.on('move', function (evt, data) {
        try {
            var dist = data.distance;
            var angle = data.angle.degree;
        }
        catch(error){
            createJoystick();
            console.error(error);
        }

        lin = Math.sin(angle / 57.29) * dist/100.0 * linvel;
        ang = Math.cos(angle / 57.29) * dist/100.0 * -angvel;
        move();
        }); 

        manager.on('end', function () {
            lin = 0.0;
            ang = 0.0;
            move();
        });     
        
    }
}

function initvelocitypublisher() {
    cmdVel = new ROSLIB.Topic({
        ros : ros,
        name : '/cmd_vel',
        messageType : 'geometry_msgs/Twist'
    });

    twist = new ROSLIB.Message({
        linear : {
            x : 0.0,
            y : 0.0,
            z : 0.0
            },
        angular : {
            x : 0.0,
            y : 0.0,
            z : 0.0
            }
    });
   
}
  
function move() {
    twist.linear.x = lin;
    twist.angular.z = ang;
    cmdVel.publish(twist);
}

function buttons() {
    var bl1 = document.getElementById("bl1");
    var bl2 = document.getElementById("bl2");
    var ba1 = document.getElementById("ba1");
    var ba2 = document.getElementById("ba2");

    var lindisp= document.getElementById("lindisp");
    var angdisp= document.getElementById("angdisp");

    bl1.addEventListener("click", function() {
        linvel = linvel*(1.1);
        lindisp.textContent = linvel;
    });
    bl2.addEventListener("click", function() {
        linvel = linvel*(0.9);
        lindisp.textContent = linvel;
    });
    ba1.addEventListener("click", function() {
        angvel = angvel*(1.1);
        angdisp.textContent = angvel;
    });
    ba2.addEventListener("click", function() {
        angvel = angvel*(0.9);
        angdisp.textContent = angvel;
    });

}

function videoon() {
    var topic = document.querySelector("input");
    topic.addEventListener("change", function (){
        cameratopic = topic.value;
        //console.log(cameratopic);
    })

    video = document.getElementById("video");
    
    var lv = document.getElementById("lv");
    
    lv.addEventListener("click", function() {
        logmsg.innerHTML += "<br /> Video loaded on the camera topic: " + cameratopic;
        video.src = "http://localhost:8080/stream?topic=" + cameratopic +"&type=mjpeg&width=600&height=400";
    })
    
    
}

function nav() {
    var viewer = new ROS2D.Viewer({
        divID : 'map',
        width : 700,
        height : 700,
	background : '#FFFFFF'
    });

    var gridClient = new NAV2D.OccupancyGridClientNav({
        ros : ros,
        rootObject : viewer.scene,
        viewer : viewer,
        serverName : '/move_base',
        withOrientation : true
    });

    logmsg.innerHTML += "<br /> Map Loaded";

    // ------------------------------------------------------Zoom and Pan options------------------------------------------------------

    var zoomView = new ROS2D.ZoomView({
        rootObject : viewer.scene
    });
            
    var panView = new ROS2D.PanView({
        rootObject : viewer.scene
    });
        
    function registerMouseHandlers() {
                
            var mouseDown = false;
            var zoomKey = false;
            var panKey = false;
            var startPos = new ROSLIB.Vector3();
            
            viewer.scene.addEventListener('stagemousedown', function(event) {
                if (event.nativeEvent.ctrlKey === true && add_poly.disabled == false) {
                    zoomKey = true;
                    zoomView.startZoom(event.stageX, event.stageY);
                }
                else if (event.nativeEvent.shiftKey === true && add_poly.disabled == false) {
                    panKey = true;
                    panView.startPan(event.stageX, event.stageY);
                }
                startPos.x = event.stageX;
                startPos.y = event.stageY;
                mouseDown = true;
            });
            
            viewer.scene.addEventListener('stagemousemove', function(event) {
                if (mouseDown === true) {
                    if (zoomKey === true) {
                        var dy = event.stageY - startPos.y;
                        var zoom = 1 + 10*Math.abs(dy) / viewer.scene.canvas.clientHeight;
                        if (dy < 0)
                            zoom = 1 / zoom;
                        zoomView.zoom(zoom);
                    }
                    else if (panKey === true) {
                        panView.pan(event.stageX, event.stageY);
                    }
                }
            });
    
            viewer.scene.addEventListener('stagemouseup', function(event) {
                if (mouseDown === true) {
                    zoomKey = false;
                    panKey = false;
                    mouseDown = false;
                }
            });
        }
        registerMouseHandlers();

	    
    //--------------------------------------------------------draw the planned path---------------------------------------------------------

    targetPath = new ROS2D.PathShape({
            strokeSize: 0.05,
            strokeColor: createjs.Graphics.getRGB(0, 255, 0)
    });

    
      
    var listenerforPath = new ROSLIB.Topic ({
          ros : ros,
          name : '/move_base/GlobalPlanner/plan',
          messageType : 'nav_msgs/Path'
    });

    var show = false;

    var goal = document.getElementById("go");
    goal.addEventListener("click", function() {
        show = true;
    });
    
    var gotostat = document.getElementById("gotostat");
    gotostat.addEventListener("click", function() {
        show = true;
    });

    listenerforPath.subscribe(function(message) {
    	//console.log(show);
        if(show == true && goal.disabled == false){
        viewer.scene.addChild(targetPath);
    	}
        targetPath.setPath(message);
        
    });	


    // -------------------------------------------------------------draw polygon---------------------------------------------------

    var add_poly = document.getElementById("add_poly");
    var done_poly = document.getElementById("done_poly");

    add_poly.addEventListener("click", function() {
        add_poly.disabled = true;
        done_poly.disabled = false;
        logmsg.innerHTML += "<br /> Drawing Polygon";
    });

	var clickedPolygon = false;
	var selectedPointIndex = null;

	var pointCallBack = function(type, event, index) {
		if (type === 'mousedown' && add_poly.disabled == true) {
			if ((event.nativeEvent.shiftKey === true)) {
				polygon.remPoint(index);
			}
			else {
				selectedPointIndex = index;
			}
		}
		clickedPolygon = true;
	};

	var lineCallBack = function(type, event, index) {
		if (type === 'mousedown'&& add_poly.disabled == true) {
			if (event.nativeEvent.ctrlKey === true) {
				polygon.splitLine(index);
			}
		}
		clickedPolygon = true;
	}

	// Create the polygon
	var polygon = new ROS2D.PolygonMarker({
		lineSize: 0.3,
		lineColor : createjs.Graphics.getRGB(100, 100, 150, 0.6),
		pointSize: 0.3,
		pointCallBack : pointCallBack,
		lineCallBack : lineCallBack
	});

	// Add the polygon to the viewer
	viewer.scene.addChild(polygon);

	viewer.scene.addEventListener('stagemousemove', function(event) {
		// Move point when it's dragged
		if (selectedPointIndex !== null && add_poly.disabled == true) {
			var pos = viewer.scene.globalToRos(event.stageX, event.stageY);
			polygon.movePoint(selectedPointIndex, pos);
		}
	});

	viewer.scene.addEventListener('stagemouseup', function(event) {
		// Add point when not clicked on the polygon
		if (selectedPointIndex !== null) {
			selectedPointIndex = null;
		}
		else if (viewer.scene.mouseInBounds === true && clickedPolygon === false && add_poly.disabled == true) {
			var pos = viewer.scene.globalToRos(event.stageX, event.stageY);
			polygon.addPoint(pos);
		}
		clickedPolygon = false;
	});
	

	done_poly.addEventListener("click", function() {
        done_poly.disabled = true;
        add_poly.disabled = false;

        var arr = new Array();
        var j = 0;

        var numPoints = polygon.pointContainer.getNumChildren();

        for(i=0; i<numPoints; i++){
        	var x = polygon.pointContainer.getChildAt(i).x;
        	var y = polygon.pointContainer.getChildAt(i).y;
        	arr[j] = x;
        	j = j+1;
        	arr[j] = y;
        	j = j+1;
        	//console.log(i);
        	//console.log(x);
        	//console.log(y);
        	//console.log("-------------");
        }
       	//console.log(arr);
        

        var polypointpub = new ROSLIB.Topic({
	  	     ros : ros,
	  	     name : '/poly_points',
	  	     messageType : 'std_msgs/Float64MultiArray'
  	    });
   
  	   var polypoint = new ROSLIB.Message({
  	   		data : arr
  	    });
  	   polypointpub.publish(polypoint);

       logmsg.innerHTML += "<br /> Done drawing Polygon, Restart the move_base node.";
   	});


    //-------------------------------------------------------------------------cancel goal----------------------------------
    cancelpub = new ROSLIB.Topic({
    	ros : ros,
    	name: '/move_base/cancel',
    	messageType : 'actionlib_msgs/GoalID'
    });

	var cancel = document.getElementById("cancel");
    var goal = document.getElementById("go");

    cancel.addEventListener("click", function() {
    	cancel.disabled = true;

        cancelmsg = new ROSLIB.Message({
        	stamp: 0,
			id: ''

	    });

        cancelpub.publish(cancelmsg);
        show = false;
        viewer.scene.removeChild(targetPath);

        logmsg.innerHTML += "<br /> Goal Cancelled !";
        goal.disabled = false;
    });
}



function statussub() {

    var listener = new ROSLIB.Topic({
       ros : ros,
       name : '/move_base/status',
       messageType : 'actionlib_msgs/GoalStatusArray'
    });
   
   var flag = true;

   var updstat = document.getElementById("updstat");

    listener.subscribe(function(message) {
        if(message.status_list[0] != null){
            updstat.innerHTML = message.status_list[0].text;

            if(message.status_list[0].text == "Failed to find a valid plan. Even after executing recovery behaviors."){
                if(flag == true){
                window.alert("Goal cannot be reached !");
                flag = false;
            	}
            }
            else{
            	flag = true;
            }
        }
    });

}


window.onload = function () {
    rosconnection();
    initvelocitypublisher();
    createJoystick();
    buttons();
    videoon();
    nav();
    statussub();
 }
