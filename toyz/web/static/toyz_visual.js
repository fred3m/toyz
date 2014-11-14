// Visualization tools for Toyz applications
// Copyright 2014 by Fred Moolekamp
// License: MIT

Toyz.namespace('Toyz.Gui');

// Canvas with multiple layers
Toyz.Visual.initMultiCanvas=function(div,options){
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

// Initialize an interactive surface plot and functions to modify and update it
// Note: for now this requires the use of Google Visualization API
Toyz.Visual.initSurfacePlot=function(options){
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
Toyz.Visual.initHistogram=function(options){
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
Toyz.Visual.initPlotWindow=function(options){
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
        plotWindow.plot=Toyz.Visual.initSurfacePlot(plotOptions);
    }else if(options.plotType=='histogram'){
        plotOptions.element=options.element+"-plot";
        plotWindow.plot=Toyz.Visual.initHistogram(plotOptions);
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

console.log('toyz_visual.js loaded');