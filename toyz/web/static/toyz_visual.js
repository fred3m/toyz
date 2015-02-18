// Visualization tools for Toyz applications
// Copyright 2015 by Fred Moolekamp
// License: LGPLv3

Toyz.namespace('Toyz.Visual');

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