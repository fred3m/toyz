// astropyp.js
// Core and Utilities for all Astro Pypelines
// Copyright 2014 by Fred Moolekamp
// License: GPLv3

// Global Namespace for 
var Astropyp=Astropyp||{};
// Declare a namespace function to avoid namespace collisions
Astropyp.namespace=function(namespace){
    var spaces=namespace.split('.');
    var parent=Astropyp;
    if(spaces[0]=='Astropyp'){
        spaces=spaces.slice(1);
    };
    for(var i=0;i<spaces.length;i++){
        var ns=spaces[i];
        parent[ns]=parent[ns]||{};
        parent=parent[ns];
    };
    return parent;
};

// Define the core objects that all astropyp modules will require
Astropyp.namespace('Astropyp.Core');

// Maximum requestId of a request sent to the server during a single session before looping back to zero
Astropyp.Core.MAX_ID=Math.pow(2,40);
// Initialize websocket to connect with tornado webserver
Astropyp.Core.jobsocketInit=function(options){
    var jobsocket=$.extend(true,{
        ws:null,
        sendTask:function(task,callback,passParams){
            if(jobsocket.ws.readyState==1 && jobsocket.sessionId!=-1){
                task.id={
                    userId:jobsocket.userId,
                    sessionId:jobsocket.sessionId,
                    requestId:jobsocket.currentRequest++
                };
                // In case there are multiple requestId increments before reaching this line
                // we make sure to reset the counter with enough space to avoid duplicate id's
                if(jobsocket.currentRequest>Astropyp.Core.MAX_ID){
                    jobsocket.currentRequest=(currentRequest-Astropyp.Core.xMAX_ID)*10;
                };
                if(typeof callback!='undefined'){
                    var params=passParams||{};
                    jobsocket.requests[task.id.requestId.toString()]={func:callback,params:params};
                };
                jobsocket.ws.send(JSON.stringify(task));
            }else if(jobsocket.ws.readyState>1){
                // Websocket is closed, warn user the first time
                if(!jobsocket.closeWarning){
                    jobsocket.closeWarning=true;
                    alert("Websocket to server was disconnected, could not send task");
                };
                if(jobsocket.logger){
                    jobsocket.logger.log("Attempted to send "+task.task+" but connection is closed",true);
                }
            }else{
                //The connection hasn't opened yet, add the task to the queue
                console.log('stored task in queue:', {task:task, callback:callback, passParams:passParams});
                jobsocket.queue.push({task:task, callback:callback, passParams:passParams});
            };
        },
        userId:'guest',
        sessionId:-1,
        queue:[],
        closeWarning:false,
        job_url:"/jobsocket",
        recieveAction:function(){},
        currentRequest:0,
        requests:{},
        rcvError:function(errorMsg){
            alert('ERROR: '+errorMsg.error);
            console.log('Error',errorMsg);
        }
    },options);
    var url="ws://"+location.host+jobsocket.job_url;
	jobsocket.ws=new WebSocket(url);
    
    if(jobsocket.hasOwnProperty('onopen')){
        jobsocket.ws.onopen=jobsocket.onopen;
    }else{
        jobsocket.ws.onopen=function(){
            if(jobsocket.logger){
                jobsocket.logger.log("Connected to server",true);
            };
        };
    };
    jobsocket.ws.onclose=function(){
        if(jobsocket.logger){
            jobsocket.logger.log("Connection to server lost",true);
        };
    };
	jobsocket.ws.onmessage=function(event){
		result=JSON.parse(event.data);
        if(result.id=='ERROR'){
            jobsocket.rcvError(result);
            return;
        }else if(result.id=='initialize'){
            jobsocket.userId=result.userId;
            jobsocket.sessionId=result.sessionId;
            console.log('session:',result);
            for(var i=0;i<jobsocket.queue.length;i++){
                var task = jobsocket.queue[i];
                jobsocket.sendTask(task.task, task.callback, task.passParams);
            };
        };
        if(result.hasOwnProperty('requestId') && jobsocket.requests.hasOwnProperty(result.requestId.toString())){
            var f=jobsocket.requests[result.requestId.toString()].func;
            var params=jobsocket.requests[result.requestId.toString()].params;
            delete jobsocket.requests[result.requestId.toString()];
            f(result,params);
        }else{
            jobsocket.receiveAction(result);
        };
	};
    return jobsocket;
};

// Utilities that may be useful in multiple astropyp modules
Astropyp.namespace('Astropyp.Utils');

// Returns the object at the end of a namespace
// example: Astropyp.Utils.getNamespace('Mainviewer.loadFitsFile',window) returns the function loadFitsFile
// in the fitsviewer
Astropyp.Utils.getNamespace=function(functionName,context) {
    var namespaces=functionName.split(".");
    for(var i=0;i<namespaces.length;i++) {
        context=context[namespaces[i]];
    };
    return context;
};

// Keep track of which scripts have been dynamically loaded
Astropyp.Utils.loadedScripts={};

// Load js and css dependencies in order
Astropyp.Utils.loadDependencies=function(dependencies,callback,params){
    //console.log('dependencies',dependencies);
    for(d in dependencies){
        if(dependencies[d].wait){
            Astropyp.Utils.loadedScripts[d]=false;
        }
    };
    for(d in dependencies){
        var dependency=dependencies[d];
        //console.log('dependency',dependency);
        var ext=dependency.url.split('.').pop();
        if(ext=='js'){
            if(!window[dependency.isloaded]){
                var script=document.createElement('script');
                script.src=dependency.url;
                script.async=false;
                script.addEventListener('load', function(d,dependencies,callback,params) {
                    return function(){
                        //console.log('dependencies',dependencies);
                        Astropyp.Utils.loadedScripts[d]=true;
                        var all_loaded=true;
                        for(dep in dependencies){
                            if(Astropyp.Utils.loadedScripts[dep]==false){
                                all_loaded=false;
                                break;
                            }
                        };
                        //console.log('loaded:',Astropyp.Utils.loadedScripts);
                        if(all_loaded){
                            //console.log('all loaded');
                            return callback(params);
                        }
                    }
                }(d,dependencies,callback,params), false);
                document.head.appendChild(script);
            }
        }else if(ext=='css'){
            $('<link>')
                .appendTo('head')
                .attr({type:'text/css',rel:'stylesheet'})
                .attr('href',dependency.url);
        }
    };
    //return callback(params);
};

// Makes a deep copy of a JSON object
// Note: this does not work with a date type!
Astropyp.Utils.deepCopy=function(obj){
    return JSON.parse(JSON.stringify(obj));
};

// Add a child element to an HTML element with a given set of attributes
Astropyp.Utils.addElement=function(parent,childType,attributes){
	var newElement=document.createElement(childType);
	for(i=0;i<attributes.length;i++){
		newElement.setAttribute(attributes[i][0],attributes[i][1])
	};
	parent.appendChild(newElement);
    return newElement;
};

// Object to log server data to the user
// element: an HTML textarea element on the webpage
Astropyp.Utils.Logger=function(element){
    this.element=element;
    this.log=function(text,useTimestamp){
        if(useTimestamp){
            var timestamp=new Date()
            element.value=element.value+timestamp+"\n";
        };
        element.value=element.value+text+"\n\n";
        $(element).scrollTop(element.scrollHeight);
    };
};

// Canvas with multiple layers
Astropyp.Utils.initMultiCanvas=function(div,options){
    var $div;
    if(div instanceof jQuery){
        $div=div;
    }else{
        $div=$(div);
    };
    var multiCanvas=$.extend(true,{
        $div:$div,
        //layers:[],
        frames:[],
        nextId:0,
        current_frame:null,
        current_frame_idx:0,
        width:600,
        height:400,
        mousedown:false,
        canvasMouseDown:function(){},
        canvasMouseUp:function(){},
        canvasMouseMove:function(){},
        addFrame:function(options){
            var frame=$.extend(true,{
                layers:[],
                id:multiCanvas.nextId++,
            },options);
            multiCanvas.frames.push(frame);
            if(multiCanvas.current_frame!==null){
                multiCanvas.hide();
            };
            multiCanvas.current_frame=frame;
            multiCanvas.current_frame_idx=multiCanvas.frames.length-1;
            return frame;
        },
        setCurrentFrame:function(frame){
            multiCanvas.hide();
            if(isNaN(frame)){
                multiCanvas.current_frame=frame;
                multiCanvas.current_frame_idx=multiCanvas.frame.indexOf(frame);
            }else{
                multiCanvas.current_frame_idx=frame;
                multiCanvas.current_frame=multiCanvas.frames[multiCanvas.current_frame_idx];
            };
            if(multiCanvas.current_frame.image!==null){
                console.log('new file:',multiCanvas.current_frame.image.fileId);
                //console.log('image:',multiCanvas.current_frame.image);
            }
            multiCanvas.show();
        },
        removeFrame:function(frame){
            if(multiCanvas.frames.length>1){
                multiCanvas.clear();
                var index=0;
                if(isNaN(frame)){
                    index=multiCanvas.frames.indexOf(frame);
                }else{
                    index=multiCanvas.frames[frame];
                };
                multiCanvas.frames.splice(index,1);
                if(multiCanvas.current_frame_idx>index){
                    multiCanvas.current_frame=multiCanvas.frames[index-1];
                    setCurrentFrame(multiCanvas.current_frame);
                }else if(multiCanvas.current_frame_idx==index){
                    multiCanvas.current_frame=multiCanvas.frames[index-1];
                    setCurrentFrame(multiCanvas.current_frame);
                }
            }else{
                alert("MultiCanvas must have at least one frame");
            };
        },
        addLayer:function(options){
            options=options || {};
            var $canvas=$('<canvas/>')
                .mousedown(multiCanvas.canvasMouseDown)
                .mouseup(multiCanvas.canvasMouseUp)
                .mousemove(multiCanvas.canvasMouseMove);
            $canvas[0].mousedown=false;
            if(options.hasOwnProperty('canvas')){
                $canvas=$(options.canvas);
            };
            for(prop in options.props){
                $canvas.prop(prop,options.props[prop]);
            };
            for(style in options.css){
                $canvas.css(style,options.css[style]);
            };
            
            // Force all canvas' to be the same size and at the same location
            $canvas
                .prop('width',multiCanvas.width)
                .prop('height',multiCanvas.height)
                .css({
                    'position':'absolute',
                    'top':multiCanvas.$div.offset().top+'px',
                    'left':multiCanvas.$div.offset().left+'px'
                });
                
            var layer=$.extend(true,{
                canvas:$canvas[0],
                visible:true,
                // Objects to be displayed on the canvas
                // (each one requires a draw function to display it on the canvas)
                objects:[], 
                show:function(){
                    layer.visible=true;
                    layer.canvas.style.visibility='visible';
                },
                draw:function(){
                    layer.visible=true;
                    layer.canvas.style.visibility='visible';
                    for(var i=0;i<layer.objects.length;i++){
                        layer.objects[i].draw();
                    }
                },
                clear:function(){
                    ctx=layer.canvas.getContext('2d');
                    ctx.save();
                    ctx.setTransform(1,0,0,1,0,0);
                    ctx.clearRect(0,0,layer.canvas.width,layer.canvas.height);
                    ctx.restore();
                },
                clearAll:function(){
                    // This will completely reset the canvas state (transformations, stroke styles, etc.)
                    layer.canvas.width=layer.canvas.width;
                },
                hide:function(){
                    layer.visible=false;
                    layer.canvas.style.visibility='hidden';
                }
            },options.layer);
            //layer.hide();
            multiCanvas.$div.append($canvas[0]);
            multiCanvas.current_frame.layers.push(layer);
            return layer;
        },
        clear:function(){
            for(var i=0;i<multiCanvas.current_frame.layers.length;i++){
                multiCanvas.current_frame.layers[i].clear();
            }
        },
        clearAll:function(){
            for(var i=0;i<multiCanvas.current_frame.layers.length;i++){
                multiCanvas.current_frame.layers[i].clearAll();
            }
        },
        show:function(){
            for(var i=0;i<multiCanvas.current_frame.layers.length;i++){
                if(multiCanvas.current_frame.layers[i].visible){
                    multiCanvas.current_frame.layers[i].show();
                }
            }
        },
        showAll:function(){
            for(var i=0;i<multiCanvas.current_frame.layers.length;i++){
                multiCanvas.current_frame.layers[i].show();
            }
        },
        hide:function(){
            for(var i=0;i<multiCanvas.current_frame.layers.length;i++){
                //multiCanvas.current_frame.layers[i].hide();
                multiCanvas.current_frame.layers[i].canvas.style.visibility='hidden';
            }
        },
        changeProp:function(prop,value){
            multiCanvas.current_frame[prop]=value;
            for(var i=0;i<multiCanvas.current_frame.layers.length;i++){
                multiCanvas.current_frame.layers[i][prop]=value;
            };
        },
        changeCanvasProp:function(prop,value){
            multiCanvas.current_frame[prop]=value;
            for(var i=0;i<multiCanvas.current_frame.layers.length;i++){
                multiCanvas.current_frame.layers[i].canvas[prop]=value;
            };
        }
    },options);
    
    return multiCanvas;
};

// Base 10 logarithm
Astropyp.Utils.log10=function(x){
    return Math.log(x)/Math.log(10);
};
// Gaussian function
Astropyp.Utils.gaussian=function(x,amplitude,mean,stdDev){
    var gaussian=amplitude*Math.exp(-Math.pow((x-mean)/(2*stdDev),2));
    //console.log("gaussian:",x,amplitude,mean,stdDev,gaussian);
    return gaussian
};

// Check to see if required keys are present in an object
Astropyp.Utils.check4key=function(obj,keys,errorMsg){
    var msg=errorMsg||"Missing parameter ";
    for(i=0;i<keys.length;i++){
        if(!obj.hasOwnProperty(keys[i])){
            alert(msg+keys[i]);
            return false;
        }
    };
    return true;
};

// convert degrees to sexagesimal
Astropyp.Utils.deg2sex=function(x){
    var y=Math.abs(x);
    var sign=x?x<0?-1:1:0;
    var sex={
        deg:Math.floor(y)
    };
    sex.min=Math.floor((y-sex.deg)*60);
    sex.sec=(y-sex.deg-sex.min/60)*3600;
    sex.deg=sex.deg*sign;
    return sex;
};
// convert sexagesimal to degrees
Astropyp.Utils.sex2deg=function(sex){
    var sign=x?x<0?-1:1:0;
    return sign*(Math.abs(sex.deg)+sex.min/60+sex.sec/3600);
};
// convert sexagesimal to string
Astropyp.Utils.sex2string=function(sex,precision){
    var pow10=Math.pow(10,precision);
    var sec=Math.round(sex.sec*pow10)/pow10
    return sex.deg.toString()+"\xB0  "+sex.min.toString()+"'  "+sec.toString()+'"';
};
// Initial a set of wcs RA and DEC
Astropyp.Utils.initWCScoords=function(ra,dec){
    if(isNaN(ra) || isNaN(dec)){
        //alert("ra and dec must be in decimal form to initialize");
        return {}
    };
    wcsCoords={
        ra:ra,
        dec:dec,
        raSex:Astropyp.Utils.deg2sex(ra/15),
        decSex:Astropyp.Utils.deg2sex(dec),
        getRA:function(precision){
            var ra=wcsCoords.raSex;
            var pow10=Math.pow(10,precision);
            var sec=Math.round(ra.sec*pow10)/pow10;
            return ra.hours.toString()+"h "+ra.min.toString()+'m '+sec.toString()+"s";
        },
        getDEC:function(precision){
            return Astropyp.Utils.sex2string(wcsCoords.decSex,precision);
        }
    };
    wcsCoords.raSex.hours=wcsCoords.raSex.deg;
    wcsCoords.raSex.deg=wcsCoords.raSex.hours*15;
    return wcsCoords;
};

// Build Interactive table
// Numbers, strings, etc will be entered into the table
// If an array is contained as a datapoint:
//     dataPoint[0] is the text added to the cell
//     dataPoint[1] is the function
//     dataPoint[2] is the parameter passed to the function
Astropyp.Utils.buildInteractiveTable=function(dataArray,table){
    var rows=dataArray.length;
    var columns=dataArray[0].length;
    for(var i=0;i<rows;i++){
        var row=table.insertRow(i);
        for(var j=0;j<columns;j++){
            var cell=row.insertCell(j);
            var dataPoint=dataArray[i][j];
            if(Array.isArray(dataPoint)){
                cell.innerHTML=dataPoint[0];
                cell.onclick=function(){
                    dataPoint[1](dataPoint[2]);
                }
            }else{
                cell.innerHTML=dataPoint;
            }
        }
    }
};

// Two dimensional slider
Astropyp.Utils.initSlider2d=function(options){
    var slider2d=$.extend(true,{
        xmin:0,
        xmax:10,
        ymin:0,
        ymax:10,
        xScale:1,
        yScale:1,
        cursor:{
            x:0,
            y:0,
            size:5,
            fill:'white',
            line:'black',
            lineWidth:2,
            visible:true
        },
        update:function(params){
            if(params.type=='cursorPos'){
                var rect=slider2d.canvas.getBoundingClientRect();
                slider2d.cursor.x=params['event'].clientX-rect.left;
                slider2d.cursor.y=params['event'].clientY-rect.top;
                slider2d.xValue=slider2d.cursor.x*slider2d.xScale;
                slider2d.yValue=slider2d.ymax-slider2d.cursor.y*slider2d.yScale;
            }else if(params.type=='value pair'){
                slider2d.xValue=params.xValue;
                slider2d.yValue=params.yValue;
                slider2d.cursor.x=params.xValue/slider2d.xScale;
                slider2d.cursor.y=(slider2d.ymax-params.yValue)/slider2d.yScale;
            };
            slider2d.drawCursor();
            slider2d.onupdate({
                xValue:slider2d.xValue,
                yValue:slider2d.yValue
            });
        },
        drawCursor:function(){
            if(slider2d.cursor.visible){
                var ctx=slider2d.canvas.getContext('2d');
                ctx.canvas.width=ctx.canvas.width;
                ctx.beginPath();
                ctx.arc(slider2d.cursor.x,slider2d.cursor.y,slider2d.cursor.size,0,2*Math.PI);
                ctx.fillStyle=slider2d.cursor.fill;
                ctx.fill();
                ctx.lineWidth=slider2d.cursor.lineWidth;
                ctx.strokeStyle=slider2d.cursor.line;
                ctx.stroke();  
            };
        },
        onupdate:function(values){}
    },options);
    
    slider2d.canvas=$.extend(slider2d.canvas,{
        mouseDown:false,
        onmousedown:function(event){
            slider2d.canvas.mouseDown=true;
            slider2d.update({
                type:'cursorPos',
                event:event
            });
        },
        onmouseup:function(event){
            slider2d.canvas.mouseDown=false;
        },
        onmousemove:function(event){
            if(slider2d.canvas.mouseDown){
                slider2d.update({
                    type:'cursorPos',
                    event:event
                });
            }
        }
    });
    
    slider2d.xScale=(slider2d.xmax-slider2d.xmin)/slider2d.canvas.width;
    slider2d.yScale=(slider2d.ymax-slider2d.ymin)/slider2d.canvas.height;
    slider2d.xValue=(slider2d.xmax-slider2d.xmin)/2;
    slider2d.yValue=(slider2d.ymax-slider2d.ymin)/2;
    slider2d.update({
        type:'value pair',
        xValue:slider2d.xValue,
        yValue:slider2d.yValue
    });
    return slider2d;
};

// Initialize an interactive surface plot and functions to modify and update it
// Note: for now this requires the use of Google Visualization API
Astropyp.Utils.initSurfacePlot=function(options){
    if(!options.hasOwnProperty('element')){
        alert("You must specify an html element to use for the plot!");
        return {};
    };
    
    var surfacePlot={
        data:[],
        plot:new links.Graph3d(options.element),
        diameter:20,
        options:$.extend(true,{
            width:"380px", 
            height:"330px",
            style:"surface",
            showPerspective:true,
            showGrid:true,
            showShadow:false,
            keepAspectRatio:true,
            verticalRatio:1
        },options),
        draw:function(){
            surfacePlot.plot.draw(surfacePlot.data,surfacePlot.options);
        },
        update:function(params){
            if(params.hasOwnProperty('data')){
                surfacePlot.data=params.data;
            };
            if(params.hasOwnProperty('options')){
                surfacePlot.options=$.extend(true,surfacePlot.options,params.options);
            };
            surfacePlot.draw();
        }
    };
    return surfacePlot;
};

// Initialize a histogram and functions to modify and update it
Astropyp.Utils.initHistogram=function(options){
    if(!options.hasOwnProperty('element')){
        alert("You must specify an html element to use for the plot!");
        return {};
    };
    var histogram={
        element:options.element,
        // See highcharts directory in astropyp/static/Highcharts-x.y.z/examples/bar-basic/index.html
        // or www.highcharts.com for more on Highcharts chart options
        options:options,
        draw:function(){
            $('#'+histogram.element).highcharts(histogram.options);
        },
        update:function(params){
            for(param in params){
                histogram.options[param]=params[param];
            }
            histogram.draw();
        }
    };
    return histogram;
};

// Initialize a dialog that will display a plot (for example a surface plot or histogram)
// The window also contains a parameter to set the width of the data that is connected to
// a slider. Changing either of these will call an update function that does nothing (by defualt)
// Passing an update function during initialization or decalring one later on can be used
// to update the plots.
Astropyp.Utils.initPlotWindow=function(options){
    var utils=Astropyp.Utils;
    if(!options.hasOwnProperty('plotType') || 
        !options.hasOwnProperty('element')
    ){
        alert("Plot type and html element must be specified to initialize a plot window!");
        return {};
    };
    var dialog=$('#'+options.element);
    var label=options.label || "width";
    
    var dialogOptions=$.extend(true,{
        resizable:false,
        draggable:true,
        width:400,
        autoOpen:false,
        modal:false,
        buttons:{
            "Cancel":function(){
                plotWindow.close();
            }
        }
    },options.dialogOpts);
    
    var plotWindow=$.extend(true,{
        element:options.element,
        active:false,
        fontSize:"12px",
        dialogName:options.dialog,
        plotName:options.element+"-plot",
        labelName:options.element+"-label",
        inputName:options.element+"-input",
        sliderName:options.element+"-slider",
        plot:{},
        update:function(){},
        close:function(){
            $('#'+plotWindow.element).dialog("close");
        }
    },options.opts);
    
    $('#'+options.element).append($('<div/>').attr('id',plotWindow.plotName));
    
    var plotOptions=$.extend(true,{
        element:document.getElementById(options.element+"-plot")
    },options.plotOpts);
    
    if(options.plotType=='surfacePlot'){
        plotWindow.plot=utils.initSurfacePlot(plotOptions);
    }else if(options.plotType=='histogram'){
        plotOptions.element=options.element+"-plot";
        plotWindow.plot=utils.initHistogram(plotOptions);
        if(!plotWindow.plot.hasOwnProperty('diameter')){
            plotWindow.plot.diameter=20;
        };
        plotWindow.plot.draw();
    }else{
        alert("Unrecognized plot type!");
        return {};
    };
    dialog.dialog(dialogOptions).css("font-size",plotWindow.fontSize);
    
    dialog.append(
        $('<label/>')
            .attr('id',plotWindow.labelName)
            .text(label)
    );
    dialog.append(
        $('<input/>')
            .attr('id',plotWindow.inputName)
            .val(plotWindow.plot.diameter)
            .change(function(){
                $('#'+plotWindow.sliderName).slider("option","value",$('#'+plotWindow.inputName).val());
                plotWindow.plot.diameter=Number($('#'+plotWindow.inputName).val());
                plotWindow.update();
            })
    );
    dialog.append($('<div/>').attr('id',plotWindow.sliderName));
    
    var sliderOptions=$.extend(true,{
        range:false,
        min:5,
        max:100,
        step:5,
        value:plotWindow.plot.diameter,
        slide:function(event,ui){
            plotWindow.plot.diamter=ui.value;
            $('#'+plotWindow.inputName).val(ui.value);
            plotWindow.plot.diameter=Number($('#'+plotWindow.inputName).val());
            plotWindow.update();
        }
    },options.sliderOpts);
    $('#'+plotWindow.sliderName).slider(sliderOptions);
    return plotWindow;
};

// Initialize a file dialog
// For security reasons browsers do not have a control to load files from a server
// and you should be cautious in your use of this.
//
// When this dialog is opened a call is made to the server asking for the files
// and directories in the given path.
//
// After a file is selected the function "clickOpen" is called. By default this
// function does nothing, so initiate or declare this later on to tell the
// application what to do with the file. 
Astropyp.Utils.initFileDialog=function(options){
    if(!options.hasOwnProperty('element') || !options.hasOwnProperty('websocket')){
        alert("An html element and websocket must be specified to open a file dialog!");
        return {};
    };
    $div=$('<div/>').prop('id','file-dialog').prop('title','Select file to open');
    $('body').append($div);
    
    $newFolder=$('<div/>')
        .prop('title','New Folder Name');
    
    var fileDialog=$.extend(true,{
        path:"",
        parent:"",
        dirs:[],
        files:[],
        element:options.element,
        websocket:options.websocket,
        pathLbl:options.element+'-lbl',
        fileInput:options.element+'-input',
        fileTbl:options.element+'-tbl',
        stored_dirs:{},
        newFolder:{
            $div:$newFolder,
            $input:$folderInput=$('<input/>').prop('size',40).appendTo($newFolder)
        },
        load_directory:function(path,callback,buttons){
            if(buttons){
                $('#'+fileDialog.element).dialog({
                    buttons:buttons
                });
            }else{
                $('#'+fileDialog.element).dialog({
                    buttons:fileDialog.defaultButtons
                });
            };
            fileDialog.websocket.sendTask(
                {
                    module:"web_utils",
                    task:"load_directory",
                    parameters:{
                        path:path
                    }
                },
                function(result){
                    delete result.id;
                    fileDialog.update(result);
                    $('#'+fileDialog.element).dialog('open');
                }
            );
            if(callback){
                fileDialog.clickOpen=callback;
            }
        },
        update:function(params){
            for(param in params){
                fileDialog[param]=params[param];
            };
            $('#'+fileDialog.pathLbl).text(fileDialog.path);
            var tbl=document.getElementById(fileDialog.fileTbl);
            tbl.innerHTML="";
            var row=tbl.insertRow(0);
            var cell=row.insertCell(0);
            row.style.cursor='pointer';
            cell.innerHTML="\u21B0";
            cell.onclick=function(){
                fileDialog.load_directory(fileDialog.parent);
                $('#'+fileDialog.fileInput).val('');
            };
            tbl_idx=0;
            for(var dir in params.stored_dirs){
                var row=tbl.insertRow(1+tbl_idx++);
                var cell=row.insertCell(0);
                row.style.color='#AA0000';
                row.style.cursor='pointer';
                cell.innerHTML=dir;
                cell.onclick=function(path){
                    return function(){
                        fileDialog.load_directory(path);
                    }
                }(fileDialog.stored_dirs[dir]);
            };
            for(i=0;i<fileDialog.dirs.length;i++){
                var row=tbl.insertRow(1+tbl_idx++);
                var cell=row.insertCell(0);
                row.style.color='#0000AA';
                row.style.cursor='pointer';
                cell.innerHTML=params.dirs[i];
                cell.onclick=function(){
                    fileDialog.load_directory(fileDialog.path+this.innerHTML);
                };
            };
            for(i=0;i<fileDialog.files.length;i++){
                var row=tbl.insertRow(1+tbl_idx++);
                var cell=row.insertCell(0);
                row.style.cursor='pointer';
                cell.innerHTML=params.files[i];
                cell.onclick=function(){
                    var size=Math.max(20,this.innerHTML.length);
                    $('#'+fileDialog.fileInput).val(this.innerHTML);
                    $('#'+fileDialog.fileInput).prop('size',size+2);
                    //$('#'+fileDialog.element).scrollTop(0);
                };
            };
        },
        clickOpen:function(){},
        defaultButtons:{
            "Open":function(){
                fileDialog.clickOpen();
                $(this).dialog("close");
            },
            "New Folder":function(){
                fileDialog.newFolder.$div.dialog('open');
            },
            "Cancel":function(){
                $(this).dialog("close");
            }
        }
    },options);
    $('#'+options.element).append($('<label/>').attr('id',fileDialog.pathLbl).text("/"));
    $('#'+options.element).append(
        $('<input/>')
            .prop('id',fileDialog.fileInput)
            .prop('type','text')
    );
    $('#'+options.element).append($('<table/>').attr('id',fileDialog.fileTbl));
    $('#'+options.element).dialog({
        resizable:true,
        draggable:true,
        width:400,
        height:400,
        autoOpen:false,
        modal:true,
        buttons:fileDialog.defaultButtons,
    }).css("font-size", "12px");
    
    $newFolder.dialog({
        resizable:true,
        draggable:true,
        width:200,
        autoOpen:false,
        modal:true,
        buttons:{
            'Create':function(){
                console.log('new folder',fileDialog.path+fileDialog.newFolder.$input.val());
                fileDialog.websocket.sendTask(
                    {
                        module:'web_utils',
                        task:'create_dir',
                        parameters:{
                            path:fileDialog.path+fileDialog.newFolder.$input.val()
                        }
                    },
                    function(result){
                        if(result.id=='create folder' && result.status=='success'){
                            fileDialog.load_directory(result.path);
                        }
                    }
                );
                $(this).dialog('close');
            },
            'Cancel':function(){
                $(this).dialog('close');
            }
        },
    }).css("font-size", "12px");;
    return fileDialog;
};

/* 
For some odd reason the value of a checkbox is not true/false as one would expect. This returns the
'correct' value of an element, even if it is a checkbox. This also returns a number instead of a
string if the input type='number'
*/
Astropyp.Utils.val=function($e){
    if(!($e instanceof jQuery)){
        $e=$($e);
    };
    
    if($e.prop('type')=='checkbox'){
        return $e.prop('checked');
    }else if($e.prop('type')=='number'){
        return Number($e.val());
    }else{
        return $e.val();
    }
};

Astropyp.Utils.buildParamDiv = function(param, $div, key){
    var $input=$('<'+param.type+'/>');
    var $paramDiv=$('<div/>');
    if(param.hasOwnProperty('divClass')){
        $paramDiv.addClass(param.divClass);
    }else{
        $paramDiv.addClass('paramDiv-default');
    };
    if(param.hasOwnProperty('prop')){
        $input.prop(param.prop);
    };
    if(param.hasOwnProperty('css')){
        $input.css(param.css);
    };
    if(param.hasOwnProperty('func')){
        var functions=param.func;
        for(var f in functions){
            $input[f](functions[f]);
        };
    };
    if(param.hasOwnProperty('title')){
        $paramDiv.prop('title',param.title);
    };
    
    if(param.type=='select'){
        for(var opt in param.options){
            $option=$('<option/>')
                .html(param.options[opt])
                .val(opt)
            $input.append($option);
        };
        if(param.hasOwnProperty('defaultVal')){
            $input.val(param.defaultVal);
        };
    };
    
    var $lbl=$('<label/>')
        .html(key)
    if(param.hasOwnProperty('lbl')){
        $lbl.html(param.lbl);
    };
    if(param.hasOwnProperty('lblClass')){
       $lbl.addClass(param.lblClass);
    }else{
        $lbl.addClass('lbl-default');
    };
    $paramDiv.append($lbl);
    $paramDiv.append($input);
    
    $div.append($paramDiv);
    if(param.hasOwnProperty('units')){
        if(param.units.length>1){
            param.$units=$('<select/>');
            for(var i=0;i<param.units.length;i++){
                var $option=$('<option/>')
                    .html(param.units[i]);
                    param.$units.append($option);
            }
        }else{
            param.$units=$('<label/>')
                .html(param.units);
        };
        if(param.hasOwnProperty('unitClass')){
            param.$units.addClass(param.unitClass);
        };
        $paramDiv.append(param.$units);
    };
    param.$lbl=$lbl;
    param.$input=$input;
    
    if(param.hasOwnProperty('file_dialog')){
        if(!param.hasOwnProperty('css')){
            param.$input.prop('size',80);
        };
        
        var $btn = $('<button/>');
        $btn.click(function(param) {
            return function(){
                var file_dir = '$project$';
                if(param.$input.val() != ''){
                    file_dir = param.$input.val();
                };
                param.file_dialog.load_directory(file_dir,function(){
                    param.$input.val(file_dialog.path+$('#'+file_dialog.fileInput).val());
                });
            }
        }(param));
        $paramDiv.append($btn);
        param.$btn = $btn;
    };
    
    return param;
}

Astropyp.Utils.initParams=function(param, $parent, key){
    var utils = Astropyp.Utils;
    
    if(!param.hasOwnProperty('type')){
        param.type = 'input';
    };
    if(param.type == 'custom'){
        $parent.append(param.$div);
    }else if(param.type=='div' || param.type=='conditional'){
        var $div;
        param.$div=$('<div/>');
        
        // If a legend is given, create a fieldset to hold a group of parameters
        if(param.hasOwnProperty('legend')){
            var $fieldset = $('<fieldset/>');
            var $legend = $("<legend/>")
                .html(param.legend)
            if(param.hasOwnProperty('legendClass')){
                $legend.addClass('legendClass');
            }else{
                $legend.addClass('collapsible');
            };
            $div = $('<div/>');
            $fieldset.append($legend);
            $fieldset.append($div);
            param.$div.append($fieldset);
        }else{
            $div = param.$div
        };

        if(param.hasOwnProperty('css')){
            param.$div.css(param.css);
        };
        if(param.hasOwnProperty('divClass')){
            param.$div.addClass(param.divClass);
        };
    
        if(param.type == 'conditional'){
            var pKey;
            var pVal;
            for(var p in param.params){
                if(param.params.hasOwnProperty(p)){
                    pKey = p;
                };
            };
            var condition = param.params[pKey];
        
            if(!condition.hasOwnProperty('type')){
                condition.type = 'input';
            };
        
            condition = utils.buildParamDiv(condition,$div,pKey);
            pVal = utils.val(condition.$input);
            condition.old_val = pVal;
            condition.$input.change(function(condition,param){
                return function(){
                    var utils = Astropyp.Utils;
                    var old_set = param.paramSets[condition.old_val];
                    var pVal = utils.val(condition.$input);
                    var new_set = param.paramSets[pVal];
                    old_set.old_display = old_set.$div.css('display');
                    old_set.$div.css('display','none');
                    new_set.$div.css('display',new_set.old_display);
                    condition.old_val = pVal;
                }
            }(condition,param));
        
            for(var pSet in param.paramSets){
                //console.log(key,paramSet);
                var newSet = param.paramSets[pSet];
                newSet.$div = $('<div/>');
                newSet = Astropyp.Utils.initParams(newSet, $div, pSet);
                // TODO: The next line may not be necessary
                //$div.append(newSet.$div);
                newSet.old_display = newSet.$div.css('display');
                newSet.$div.css('display','none');
            };
        
            var keyVal = utils.val(condition.$input);
            var selected = param.paramSets[keyVal];
            selected.$div.css('display', selected.$div.css('display', selected.old_display));
        }else{
            for(var key in param.params){
                param.params[key] = utils.initParams(param.params[key], $div, key);
            };
        };
        
        $parent.append(param.$div);
    }else if(param.type=='list'){
        param.$div=$('<div/>');
        if(param.hasOwnProperty('ordered') && param.ordered==true){
            param.$list=$('<ol/>');
        }else{
            param.$list=$('<ul/>');
        };
        var $button_div=$('<div/>');
        param.$div.append(param.$list);
        param.$div.append($button_div);
        param.current_idx = 0;
        
        if(param.hasOwnProperty('radio') && param.radio!=''){
            var group = param.radio;
            if(param.newItem.hasOwnProperty('group')){
                group = param.newItem.group;
            };
            param.getSelectedName = function(){
                return $('input[name='+group+']:checked').val();
            };
            param.getSelectedParam = function(param){
                return function(){
                    var item_name = $('input[name='+param.radio+']:checked').val();
                    var item;
                    for(var i=0; i<param.items.length;i++){
                        if(param.items[i].$radio.val()==item_name){
                            item = i;
                        }
                    };
                    return param.items[item];
                }
            }(param);
        };
        
        if(!param.hasOwnProperty('buttons')){
            param.buttons={
                add:{
                    type:'button',
                    lbl:'',
                    prop:{
                        innerHTML:'+'
                    },
                    func:{
                        click:function(param){
                            return function(){
                                var $li = $('<li/>');
                                var $radio;
                                var group = param.radio;
                                if(param.hasOwnProperty('radio') && param.radio!=''){                                    
                                    if(param.newItem.hasOwnProperty('group')){
                                        group = param.newItem.group;
                                    };
                                    $radio = $('<input/>')
                                        .prop('type', 'radio')
                                        .prop('name', group)
                                        .prop('checked', true)
                                };
                                if(!(param.hasOwnProperty('items'))){
                                    param.items=[];
                                };
                                
                                var new_key = group + '-' + param.current_idx++;
                                $radio.prop('value', new_key);
                                $li.prop('id', new_key);
                                var new_item = $.extend(true, {}, param.newItem);
                                //new_item.$div = $('<div/>');
                                new_item = utils.initParams(new_item, $li, new_key);
                                new_item.$div.prepend($radio);
                                $li.append(new_item.$div);
                                new_item.$radio = $radio;
                                new_item.$item = $li;
                                param.items.push(new_item);
                                param.$list.append($li);
                            }
                        }(param)
                    }
                },
                remove:{
                    type:'button',
                    lbl:'',
                    prop:{
                        innerHTML:'-'
                    },
                    func:{
                        click:function(param){
                            return function(){
                                if(param.items.length==0){
                                    return;
                                };
                                var item_name = $('input[name='+param.radio+']:checked').val();
                                var item;
                                for(var i=0; i<param.items.length;i++){
                                    if(param.items[i].$radio.val()==item_name){
                                        item = i;
                                    }
                                };
                                // remove all jquery objects from the page and
                                // select the previous item in the list (if it exists)
                                param.items[item].$item.remove();
                                //delete param.items[item];
                                param.items.splice(item,1);
                                if(item>0){
                                    param.items[item-1].$radio.prop('checked', true);
                                }else if(param.items.length>0){
                                    param.items[item].$radio.prop('checked', true);
                                };
                            }
                        }(param)
                    }
                }
            }
        };
        for(var button in param.buttons){
            param.buttons[button]=utils.buildParamDiv(param.buttons[button],$button_div,button);
        };
        $parent.append(param.$div);
    }else{
        param=utils.buildParamDiv(param, $parent,key);
    };

    return param;
};

Astropyp.Utils.initParamList=function(pList,options){
    options=$.extend(true,{},options);
    var utils=Astropyp.Utils;
    var param_list=$.extend(true,{
        params:utils.initParams(pList, options.$parent, 'param-list'),
        parseParam:function(params, param_name, param){
            if(param.type == 'custom'){
                if(param.hasOwnProperty('val')){
                    params[param_name] = param.val;
                }
            }else if(param.type=='div' || param.type=='conditional'){
                var subset = param_list.getParams(param);
                for(subParam in subset){
                    params[subParam] = subset[subParam];
                }
            }else if(param.type == 'list'){
                params[param_name] = [];
                for(var i=0; i<param.items.length; i++){
                    var item_values = {};
                    param_list.parseParam(item_values, param_name, param.items[i]);
                    params[param_name].push(item_values);
                };
            }else{
                var val=utils.val(param.$input);
                if(param.hasOwnProperty('units')){
                    if(param.units.length>1){
                        val=[val,param.$units.val()];
                    }
                };
                params[param_name]=val;
            };
        },
        getParams:function(paramDiv){
            // Extract only the parameters that are visible (in the case of conditional or optional parameters)
            var params = {};
            //console.log('paramDiv:',paramDiv);
            if(paramDiv.type == 'conditional'){
                var pKey;
                for(var param in paramDiv.params){
                    if(paramDiv.params.hasOwnProperty(param)){
                        pKey = param;
                    };
                };
                var subset = param_list.getParams(paramDiv.paramSets[utils.val(paramDiv.params[pKey].$input)]);
                for(var subParam in subset){
                    params[subParam] = subset[subParam];
                };
            };
            for(var param_name in paramDiv.params){
                var param = paramDiv.params[param_name];
                param_list.parseParam(params, param_name, param);
            };
            
            return params;
        },
        getParam: function(target_param){
            function findParam(param){
                var subset = {};
                if(param.type == 'div'){
                    subset = param.params;
                }else if(param.type == 'conditional'){
                    subset = param.params;
                    subset = $.extend({}, subset, param.paramSets);
                }else if(param.type == 'list'){
                    subset = param.items;
                };
                //console.log('param', param);
                //console.log('subset', subset);
                var result = {};
                for(p in subset){
                    if(p==target_param){
                        return subset[p];
                    };
                    result = findParam(subset[p]);
                    if(!($.isEmptyObject(result))){
                        return result;
                    }
                };
                
                return result;
            };
            var param = findParam(param_list.params);
            if($.isEmptyObject(param)){
                alert('Could not find '+target_param+' in getParam');
            };
            return param;
        },
        setParams: function(param, key, param_values){
            if(param.type == 'div'){
                for(p in param.params){
                    param_list.setParams(param.params[p], p, param_values);
                };
            }else if (param.type == 'conditional'){
                for(p in param.params){
                    param_list.setParams(param.params[p], p, param_values);
                };
                for(p in param.paramSets){
                    param_list.setParams(param.paramSets[p], p, param_values);
                };
            }else if(param.type == 'list'){
                if(param_values.hasOwnProperty(key)){
                    param.items = [];
                    for(var i=0; i<param_values[key].length; i++){
                        param.buttons.add.$input.click();
                        for(item_key in param_values[key][i]){
                            param_list.setParams(param.items[i], item_key, param_values[key][i]);
                        }
                    }
                };
            }else if(param.type == 'input' || param.type == 'select'){
                if(param.$input.prop('type') == 'checkbox'){
                    if(param_values.hasOwnProperty(key)){
                        param.$input.prop('checked', param_values[key]);
                        param.$input.change();
                    };
                }else{
                    if(param_values.hasOwnProperty(key)){
                        param.$input.val(param_values[key]);
                        param.$input.change();
                    }
                };
            }
        }
    },options);
    
    if(options.hasOwnProperty('default')){
        param_list.setParams(param_list.params, '', options.default);
    };
    
    return param_list;
};

Astropyp.Utils.buildContextMenu = function(menu){
    var ctx_menu = {
        type: 'list',
        items: {
            settings:{
                func: {
                    click: function(){
                        window.location.href = '/';
                    }
                }
            },
        }
    }
};

Astropyp.Utils.initContextMenu = function(params){
    var ctx_menu = $.extend(true,{
        
    }, params.options);
    
    $(document).bind("contextmenu", function(event) { 
        event.preventDefault();
        $("<div class='custom-menu'>Custom menu</div>")
            .appendTo("body")
            .css({top: event.pageY + "px", left: event.pageX + "px"});
    })//.bind("click", function(event) {
    //    $("div.custom-menu").hide();
    //});
}

console.log('astropyp.js loaded');