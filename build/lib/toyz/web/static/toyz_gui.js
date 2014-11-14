// Two dimensional slider
Toyz.Core.initSlider2d=function(options){
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
Toyz.Core.initFileDialog=function(options){
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

Toyz.Core.buildParamDiv = function(param, $div, key){
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

Toyz.Core.initParams=function(param, $parent, key){
    var utils = Toyz.Core;
    
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
                    var utils = Toyz.Core;
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
                newSet = Toyz.Core.initParams(newSet, $div, pSet);
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

Toyz.Core.initParamList=function(pList,options){
    options=$.extend(true,{},options);
    var utils=Toyz.Core;
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

Toyz.Core.buildContextMenu = function(menu){
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

Toyz.Core.initContextMenu = function(params){
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