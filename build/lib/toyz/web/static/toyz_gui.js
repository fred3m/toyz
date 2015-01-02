// Graphical user interface tools
// Copyright 2014 by Fred Moolekamp
// License: MIT

Toyz.namespace('Toyz.Gui');

// For some odd reason the value of a checkbox is not true/false as one would expect. 
// This returns the 'correct' value of an element, even if it is a checkbox. 
// This also returns a number instead of a string if the input type='number'
Toyz.Gui.val=function($e){
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

// Given a parameter, its parent div, and a key,
// build a parameter div object that can be used
// later to find the value of the parameter
Toyz.Gui.buildParamDiv = function(param, $div){
    var $input=$('<'+param.type+'/>');
    var $paramDiv=$('<div/>');
    // If the user defines a css class for the div, include it
    if(param.hasOwnProperty('divClass')){
        $paramDiv.addClass(param.divClass);
    }else{
        $paramDiv.addClass('paramDiv-default');
    };
    if(param.hasOwnProperty('divCss')){
        $paramDiv.css(param.divCss);
    };
    // If properties for the parameter have been defined
    if(param.hasOwnProperty('prop')){
        $input.prop(param.prop);
    };
    // If css specific to the parameter are defined
    if(param.hasOwnProperty('css')){
        $input.css(param.css);
    };
    // Functions, such as 'click' or 'over'
    if(param.hasOwnProperty('func')){
        var functions=param.func;
        for(var f in functions){
            $input[f](functions[f]);
        };
    };
    // Tooltip title
    if(param.hasOwnProperty('title')){
        $paramDiv.prop('title',param.title);
    };
    // For select boxes, populate the drop down list an default value
    if(param.type=='select'){
        // If the user has specified an order, use it
        if(param.hasOwnProperty('order')){
            for(var i=0; i<param.order.length; i++){
                var opt = param.order[i];
                $option=$('<option/>')
                    .html(param.options[opt])
                    .val(opt)
                $input.append($option);
            }
        }else{
            if($.isArray(param.options)){
                for(var i=0;i<param.options.length; i++){
                    $option=$('<option/>')
                        .html(param.options[i])
                        .val(param.options[i])
                    $input.append($option);
                }
            }else{
                for(var opt in param.options){
                    $option=$('<option/>')
                        .html(param.options[opt])
                        .val(opt)
                    $input.append($option);
                };
            };
        };
        if(param.hasOwnProperty('defaultVal')){
            $input.val(param.defaultVal);
        };
    };
    
    // Add a label
    var $lbl=$('<label/>')
        .html(param.name)
    if(param.hasOwnProperty('lbl')){
        $lbl.html(param.lbl);
        
        if(param.hasOwnProperty('lblClass')){
           $lbl.addClass(param.lblClass);
        }else{
            $lbl.addClass('lbl-default');
        };
        if(param.hasOwnProperty('lblCss')){
            $lbl.css(param.lblCss);
        };
        $paramDiv.append($lbl);
    };
    $paramDiv.append($input);
    $div.append($paramDiv);
    
    // Some parameters may have units associated with them
    // Units are given as an array, which will be converted into a
    // dropdown box if there is more than one unit in the array
    if(param.hasOwnProperty('units')){
        if(param.units.length>1){
            param.$units=$('<select/>');
            for(var i=0; i<param.units.length; i++){
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
    
    // Special types of parameters may also be used, for example
    // a path with a button to open a file dialog
    if(param.hasOwnProperty('file_dialog')){
        //console.log('file dialog:', param);
        if(!param.hasOwnProperty('css')){
            param.$input.prop('size',80);
        };
        
        var $btn = $('<button/>')
            .html('...')
            .css('margin-left','5px');
        $btn.click(function(param) {
            return function(){
                var file_dir = '$user$';
                if(param.$input.val() != ''){
                    file_dir = param.$input.val();
                };
                param.file_dialog.load_directory(file_dir,function(){
                    param.$input.val(param.file_dialog.path+param.file_dialog.files.$select.val());
                });
            }
        }(param));
        $paramDiv.append($btn);
        param.$btn = $btn;
    };
    param.$div = $paramDiv;
    return param;
}

// Parse a parameter (param) to see if it is a div containing a subset of parameters
// param: parameter JSON object
// $parent: jquery object that is the parent for the new parameter
// key: name of the parameter
Toyz.Gui.initParams=function(param, $parent, key){
    //console.log('param:', key, param);
    // The default type of a parameter is an input
    if(!param.hasOwnProperty('type')){
        param.type = 'input';
    };
    param.name = key;
    // Allow for custom parameters to be inserted
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
                $legend.addClass(param.legendClass);
            }else{
                $legend.addClass('collapsible');
            };
            if(param.hasOwnProperty('legendCss')){
                $legend.css(param.legendCss);
            }
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
        // If properties for the parameter have been defined
        if(param.hasOwnProperty('prop')){
            param.$div.prop(param.prop);
        };
        // Functions, such as 'click' or 'over'
        if(param.hasOwnProperty('func')){
            var functions=param.func;
            for(var f in functions){
                param.$div[f](functions[f]);
            };
        };
        if(param.type == 'conditional'){
            //console.log('conditional ',key,'found')
            var pKey;
            var pVal;
            for(var p in param.selector){
                if(param.selector.hasOwnProperty(p)){
                    pKey = p;
                };
            };
            var selector = param.selector[pKey];
        
            if(!selector.hasOwnProperty('type')){
                selector.type = 'input';
            };
            
            //selector = Toyz.Gui.buildParamDiv(selector,$div);
            selector = Toyz.Gui.initParams(selector,$div,pKey);
            pVal = Toyz.Gui.val(selector.$input);
            selector.old_val = pVal;
            selector.$input.change(function(selector,param){
                return function(){
                    var old_set = param.paramSets[selector.old_val];
                    var pVal = Toyz.Gui.val(selector.$input);
                    var new_set = param.paramSets[pVal];
                    old_set.old_display = old_set.$div.css('display');
                    old_set.$div.css('display','none');
                    new_set.$div.css('display',new_set.old_display);
                    selector.old_val = pVal;
                }
            }(selector,param));
        
            for(var pSet in param.paramSets){
                //console.log(key,paramSet);
                var newSet = param.paramSets[pSet];
                newSet.$div = $('<div/>');
                newSet = Toyz.Gui.initParams(newSet, $div, pSet);
                newSet.old_display = newSet.$div.css('display');
                newSet.$div.css('display','none');
            };
            
            var keyVal = Toyz.Gui.val(selector.$input);
            //console.log('conditional:',key,'selector:', selector, keyVal)
            var selected = param.paramSets[keyVal];
            selected.$div.css('display', selected.$div.css('display', selected.old_display));
        }else{
            for(var key in param.params){
                param.params[key] = Toyz.Gui.initParams(param.params[key], $div, key);
            };
            for(var key in param.optional){
                var legend = param.optional[key].lbl;
                //delete param.optional[key].lbl;
                var opt_param = {
                    type: 'conditional',
                    selector: {},
                    paramSets: {
                        true: {
                            type: 'div',
                            params: {}
                        },
                        false: {type:'div', params:{}}
                    }
                }
                opt_param.selector['use_'+key] = {
                    lbl: 'set '+ key,
                    prop: {
                        type: 'checkbox',
                        checked: false
                    }
                }
                opt_param.paramSets[true].params[key] = param.optional[key]
                param.params[key] = Toyz.Gui.initParams(opt_param, $div, key);
            }
        };
        
        $parent.append(param.$div);
    }else if(param.type=='list'){
        param.$div=$('<div/>');
        if(param.hasOwnProperty('ordered') && param.ordered==true){
            param.$list=$('<ol/>');
        }else{
            param.$list=$('<ul/>');
        };
        if(!param.hasOwnProperty('items')){
            param.items = [];
        };
        if(!param.hasOwnProperty('format')){
            param.format = 'list';
        };
        
        var $button_div=$('<div/>');
        param.$div.append(param.$list);
        param.$div.append($button_div);
        param.current_idx = 0;
        param.key_name = param.name+'-';
        
        param.getSelectedName = function(){
            return $('input[name='+param.name+']:checked').val();
        };
        param.getSelectedParam = function(param){
            return function(){
                var item_name = $('input[name='+param.name+']:checked').val();
                var item;
                for(var i=0; i<param.items.length;i++){
                    if(param.items[i].$radio.val()==item_name){
                        item = i;
                    }
                };
                return param.items[item];
            }
        }(param);
        
        if(!param.hasOwnProperty('buttons')){
            param.buttons={
                add:{
                    type:'button',
                    lbl:'',
                    prop:{
                        innerHTML:'+'
                    },
                    divCss:{
                        float: 'left'
                    },
                    func:{
                        click:function(param){
                            return function(){
                                var $li = $('<li/>');
                                var $radio = $('<input/>')
                                    .prop('type', 'radio')
                                    .prop('name', param.name)
                                    .prop('checked', true)
                                    .css('float','left')
                                if(!(param.hasOwnProperty('items'))){
                                    param.items=[];
                                };
                                
                                var new_key = param.name + '-' + param.current_idx++;
                                $radio.prop('value', new_key);
                                $li.prop('id', new_key);
                                var new_item = $.extend(true, {}, param.newItem);
                                new_item = Toyz.Gui.initParams(new_item, $li, new_key);
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
                    divCss:{
                        float:'left'
                    },
                    func:{
                        click:function(param){
                            return function(){
                                if(param.items.length==0){
                                    return;
                                };
                                var item_name = $('input[name='+param.name+']:checked').val();
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
            param.buttons[button]=Toyz.Gui.buildParamDiv(param.buttons[button],$button_div);
        };
        $parent.append(param.$div);
    }else{
        param=Toyz.Gui.buildParamDiv(param, $parent);
    };

    return param;
};

// Given a list of parameters, parse the list and build a gui for the user
// to set parameters
Toyz.Gui.initParamList=function(pList,options){
    options=$.extend(true,{},options);
    var param_list=$.extend(true,{
        params:Toyz.Gui.initParams(pList, options.$parent, 'param-list'),
        // Find the value of every parameter and subset of parameters in the param_list
        parseParam:function(params, param_name, param){
            if(param.type == 'custom'){
                params[param_name] = param.getVal();
            }else if(param.type=='div' || param.type=='conditional'){
                params = $.extend(true, params, param_list.getParams(param));
            }else if(param.type == 'list'){
                if(param.format == 'dict'){
                    params[param_name] = {};
                    for(var i=0; i<param.items.length; i++){
                        var item_values = {};
                        param_list.parseParam(item_values, param.items[i].name, param.items[i]);
                        params[param_name][item_values.key] = item_values.value;
                    }
                }else if(param.format == 'list'){
                    var local_list = [];
                    for(var i=0; i<param.items.length; i++){
                        var val = param_list.parseParam({}, param.items[i].name, param.items[i]);
                        //console.log('item_values:',val);
                        local_list.push(val);
                    };
                    params[param_name] = local_list;
                }else if(param.format == 'none'){
                    params[param_name] = [];
                    for(var i=0; i<param.items.length; i++){
                        var item_values = {};
                        param_list.parseParam(item_values, param_name, param.items[i]);
                        params[param_name].push(item_values);
                    };
                }else if(param.format == 'custom'){
                    params[param_name] = param.getVal();
                }else{
                    throw Error("Invalid parameter format");
                };
            }else if(param.type== 'button'){
                // do nothing, no need to get button parameters
            }else{
                var val=Toyz.Gui.val(param.$input);
                if(param.hasOwnProperty('units')){
                    if(param.units.length>1){
                        val=[val,param.$units.val()];
                    }
                };
                params[param_name]=val;
                return val;
            };
        },
        // Load the values of every parameter in the list
        getParams:function(paramDiv){
            // Extract only the parameters that are visible (in the case of conditional or optional parameters)
            //console.log('paramDiv:', paramDiv);
            
            var params = {conditions:{}};
            //console.log('paramDiv:',paramDiv);
            if(paramDiv.type == 'conditional'){
                var pKey;
                for(var param in paramDiv.selector){
                    if(paramDiv.selector.hasOwnProperty(param)){
                        pKey = param;
                    };
                };
                params.conditions[pKey] = Toyz.Gui.val(paramDiv.selector[pKey].$input);
                var subset = param_list.getParams(
                    paramDiv.paramSets[Toyz.Gui.val(paramDiv.selector[pKey].$input)]
                );
                for(var subParam in subset){
                    params[subParam] = subset[subParam];
                };
                params['conditions'][pKey] = Toyz.Gui.val(paramDiv.selector[pKey].$input);
            };
            for(var param_name in paramDiv.params){
                var param = paramDiv.params[param_name];
                param_list.parseParam(params, param_name, param);
            };
            
            return params;
        },
        // Get the value of a single parameter in the list
        getParam: function(target_param){
            function findParam(param){
                var subset = {};
                if(param.type == 'div'){
                    subset = param.params;
                }else if(param.type == 'conditional'){
                    subset = param.params;
                    subset = $.extend({}, subset, param.paramSets);
                }else if(param.type == 'list'){
                    if(param.format=='none'){
                        subset = param.items;
                    };
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
        setInput: function(param, value){
            if(param.$input.prop('type') == 'checkbox'){
                param.$input.prop('checked', value);
                param.$input.change();
            }else{
                param.$input.val(value);
                param.$input.change();
            };
        },
        // Given a set of parameter values, set the appropriate fields for each parameter
        setParams: function(param, param_values, set_all){
            if(set_all===undefined){
                throw 'set_all must be specified';
            };
            //console.log('param_values:', param_values);
            if(param.type == 'div'){
                for(p in param.params){
                    param_list.setParams(param.params[p], param_values, set_all);
                };
                for(p in param.optional){
                    param_list.setParams(param.optional[p], param_values.conditions, set_all);
                };
            }else if (param.type == 'conditional'){
                // There will only be one entry here, but we don't know its name
                var pKey;
                for(p in param.selector){
                    if(param.selector.hasOwnProperty(p)){
                        pKey=p;
                    };
                };
                param_list.setParams(param.selector[pKey], param_values.conditions, set_all);
                var selected = Toyz.Gui.val(param.selector[pKey].$input);
                
                // only set conditional values that are selected, unless select_all is true
                if(set_all){
                    for(p in param.paramSets){
                        param_list.setParams(param.paramSets[p], param_values, true);
                    };
                }else if(param.paramSets.hasOwnProperty(selected)){
                    param_list.setParams(param.paramSets[selected], param_values, false);
                }else{
                };
                
                for(p in param.optional){
                    if(param.optional.hasOwnProperty(p)){
                        param_list.setParams(param.optional[p], param_values.conditions, set_all);
                    };
                };
            }else if(param.type == 'list'){
                if(param_values.hasOwnProperty(param.name)){
                    // remove the old items from the list
                    for(var i=0; i<param.items.length; i++){
                        param.items[i].$div.remove();
                    };
                    param.items = [];
                    
                    if(param.format == 'dict'){
                        var p_index = 0;
                        for(var key in param_values[param.name]){
                            param.buttons.add.$input.click();
                            param_list.setInput(param.items[p_index].params['key'], key);
                            param_list.setInput(
                                param.items[p_index++].params['value'], 
                                param_values[param.name][key]
                            );
                        }
                    }else if(param.format == 'list'){
                        for(var i=0; i<param_values[param.name].length; i++){
                            param.buttons.add.$input.click();
                            param_list.setInput(
                                param.items[i],
                                param_values[param.name][i]
                            );
                        }
                    }else if(param.format == 'div'){
                        for(var i=0; i<param_values[param.name].length; i++){
                            param.buttons.add.$input.click();
                            for(item_key in param_values[key][i]){
                                param_list.setParams(param.items[i],param_values[key][i],set_all);
                            }
                        }
                    };
                };
            }else if(param.type == 'input' || param.type == 'select'){
                if(param_values.hasOwnProperty(param.name)){
                    param_list.setInput(param, param_values[param.name]);
                };
            }
        }
    },options);
    
    if(options.hasOwnProperty('default')){
        console.log('default:',options.default)
        param_list.setParams(param_list.params, options.default, true);
    };
    
    return param_list;
};

// Two dimensional slider
Toyz.Gui.initSlider2d=function(options){
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

// Build a context menu when the user "right-clicks"
Toyz.Gui.buildContextMenu = function(menu){
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

// Initialize a right click context menu
Toyz.Gui.initContextMenu = function(params){
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

console.log('toyz_gui.js loaded');