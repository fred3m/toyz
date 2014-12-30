// Core for Toyz
// Copyright 2014 by Fred Moolekamp
// License: MIT

// Global Namespace for Toyz scripts
var Toyz=Toyz||{};
// Declare a namespace function to avoid namespace collisions
Toyz.namespace=function(namespace){
    var spaces=namespace.split('.');
    var parent=Toyz;
    if(spaces[0]=='Toyz'){
        spaces=spaces.slice(1);
    };
    for(var i=0;i<spaces.length;i++){
        var ns=spaces[i];
        parent[ns]=parent[ns]||{};
        parent=parent[ns];
    };
    return parent;
};

// Define the core objects that all Toyz modules will require
Toyz.namespace('Toyz.Core');

// Returns the object at the end of a namespace
// example: Toyz.Core.getNamespace('Mainviewer.loadFitsFile',window) returns the function loadFitsFile
// in the fitsviewer
Toyz.Core.getNamespace=function(functionName, context) {
    var namespaces=functionName.split(".");
    for(var i=0;i<namespaces.length;i++) {
        context=context[namespaces[i]];
    };
    return context;
};

// Maximum requestId of a request sent to the server during a single session 
// before looping back to zero
Toyz.Core.MAX_ID=Math.pow(2,40);
// Initialize websocket to connect with tornado webserver
Toyz.Core.jobsocketInit=function(options){
    var jobsocket=$.extend(true,{
        ws:null,
        send_task:function(task,callback,passParams){
            if(jobsocket.ws.readyState==1 && jobsocket.session_id!=""){
                task.id={
                    user_id:jobsocket.user_id,
                    session_id:jobsocket.session_id,
                    request_id:jobsocket.current_request++
                };
                // In case there are multiple requestId increments before reaching this line
                // we make sure to reset the counter with enough space to avoid duplicate id's
                if(jobsocket.currentRequest>Toyz.Core.MAX_ID){
                    jobsocket.currentRequest=(currentRequest-Toyz.Core.xMAX_ID)*10;
                };
                if(typeof callback!='undefined'){
                    var params=passParams||{};
                    jobsocket.requests[task.id.request_id.toString()]={func:callback,params:params};
                };
                console.log("sending task:", task);
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
                console.log('readyState:',jobsocket.ws.readyState, 'session_id', jobsocket.session_id)
                console.log('stored task in queue:', {task:task, callback:callback, passParams:passParams});
                jobsocket.queue.push({task:task, callback:callback, passParams:passParams});
            };
        },
        user_id:"",
        session_id:"",
        queue:[],
        closeWarning:false,
        job_url:"/job",
        recieveAction:function(){},
        current_request:0,
        requests:{},
        rcvError:function(errorMsg){
            alert('ERROR: '+errorMsg.error);
            console.log('Error',errorMsg);
        },
        notify: function(result){
            alert(result.msg);
            console.log('notification:', result);
        },
        warn: function(result){
            alert(result.warning);
            console.log('warning:', result);
        }
    },options);
    var url="ws://"+location.host+jobsocket.job_url;
    console.log("websocket url", url);
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
        }else if(result.id=='notification'){
            jobsocket.notify(result);
            return;
        }else if(result.id=='warning'){
            jobsocket.warn(result);
            return;
        }else if(result.id=='initialize'){
            jobsocket.user_id=result.user_id;
            jobsocket.session_id=result.session_id;
            console.log('session:',result);
            for(var i=0;i<jobsocket.queue.length;i++){
                var task = jobsocket.queue[i];
                jobsocket.send_task(task.task, task.callback, task.passParams);
            };
        };
        if(result.hasOwnProperty('request_id') && jobsocket.requests.hasOwnProperty(result.request_id.toString())){
            var f=jobsocket.requests[result.request_id.toString()].func;
            var params=jobsocket.requests[result.request_id.toString()].params;
            if(!('progress_update' in result)){
                delete jobsocket.requests[result.request_id.toString()];
            }else{
                console.log('progres update', result);
            }
            f(result,params);
        }else{
            jobsocket.receiveAction(result);
        };
	};
    return jobsocket;
};

// Object to log server data to the user
// element: an HTML textarea element on the webpage
Toyz.Core.Logger=function(element){
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

// Dynamically load a list of scripts
Toyz.Core.load_js = function(scripts, callback){
    var script = scripts[0];
    if(scripts.length>0){
        console.log('loading', script);
        scripts.shift();
        var load_js = Toyz.Core.load_js.bind(undefined, scripts, callback);
        $.getScript(script, load_js);
    }else{
        callback();
    }
};

// Dynamically load a list of style sheets
Toyz.Core.load_css = function(styles, callback){
    var style = styles[0];
    if(styles.length>0){
        console.log('loading', style);
        styles.shift();
        var load_css = Toyz.Core.load_css.bind(undefined, styles, callback);
        $.getCSS(style, load_css);
    }else{
        callback();
    }
}

// Load js and css dependencies in order
Toyz.Core.load_dependencies=function(dependencies, callback){
    var core_js = [
        "/static/third_party/jquery-ui-1.11.2/jquery-ui.js",
        "/static/web/static/toyz_gui.js",
        "/static/web/static/toyz_visual.js",
        "/static/third_party/jquery-contextMenu/jquery.contextMenu.js",
        "/static/third_party/jquery-contextMenu/jquery.ui.position.js"
    ]
    
    var core_css = [
        '/static/third_party/jquery-ui-themes-1.11.0/themes/redmond/jquery-ui.css',
        "/static/web/static/toyz.css",
        "/static/third_party/jquery-contextMenu/jquery.contextMenu.css"
    ]
    
    var scripts = [];
    var style_sheets = [];
    
    if(dependencies.hasOwnProperty('core') && dependencies.core){
        scripts = core_js;
        style_sheets = core_css;
    }
    if(dependencies.hasOwnProperty('js')){
        scripts = scripts.concat(dependencies.js);
    }
    if(dependencies.hasOwnProperty('css')){
        style_sheets = style_sheets.concat(dependencies.css);
    }
    
    // Call the load_css function with the callback function and style sheets when
    // all scripts have loaded
    var css_callback = Toyz.Core.load_css.bind(undefined, style_sheets, callback);
    
    Toyz.Core.load_js(scripts, css_callback);
};

// Makes a deep copy of a JSON object
// Note: this does not work with a date type!
Toyz.Core.deepCopy=function(obj){
    return JSON.parse(JSON.stringify(obj));
};

// Base 10 logarithm
Toyz.Core.log10=function(x){
    return Math.log(x)/Math.log(10);
};
// Gaussian function
Toyz.Core.gaussian=function(x,amplitude,mean,stdDev){
    var gaussian=amplitude*Math.exp(-Math.pow((x-mean)/(2*stdDev),2));
    //console.log("gaussian:",x,amplitude,mean,stdDev,gaussian);
    return gaussian
};

// Check to see if required keys are present in an object
Toyz.Core.check4key=function(obj,keys,errorMsg){
    var msg=errorMsg||"Missing parameter ";
    for(i=0;i<keys.length;i++){
        if(!obj.hasOwnProperty(keys[i])){
            alert(msg+keys[i]);
            return false;
        }
    };
    return true;
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
Toyz.Core.initFileDialog = function(options){
    if(!options.hasOwnProperty('websocket')){
        alert("A websocket must be specified to open a file dialog!");
        return {};
    };
    
    var $div = $('<div/>').prop('id','file-dialog').prop('title','Select file to open');
    var $new_folder = $('<div/>').prop('title','New Folder Name');
    var $path_outer_div = $('<div/>').addClass('file-dialog-path-div');
    var $path_lbl = $('<lbl/>').addClass("file-dialog-div-lbl").html('current path: ');
    var $path_div = $('<div/>').css('display', 'inline-block');
    var shortcuts = Toyz.Core.initFileSelect('shortcuts');
    var folders = Toyz.Core.initFileSelect('folders');
    var files = Toyz.Core.initFileSelect('files');
    
    $('body').append($div);
    $('body').append($new_folder);
    $div.append($path_outer_div);
    $path_outer_div.append($path_lbl); 
    $path_outer_div.append($path_div);
    $div.append(shortcuts.$div);
    $div.append(folders.$div);
    $div.append(files.$div);
    
    var file_dialog = {
        $div: $div,
        $path_div: $path_div,
        shortcuts: shortcuts,
        folders: folders,
        files: files,
        hist: [],
        hist_index: 0,
        parent_folder:'',
        websocket: options.websocket,
        new_folder: {
            $div: $new_folder,
            $input: $('<input/>').prop('size',80).appendTo($new_folder)
        },
        load_directory: function(path, callback, buttons){
            if(file_dialog.hist.length==0){
                file_dialog.hist.push(path);
            }
            console.log("loading:", path);
            if(buttons){
                file_dialog.$div.dialog({
                    buttons:buttons
                });
            }else{
                file_dialog.$div.dialog({
                    buttons:file_dialog.default_buttons
                });
            };
            file_dialog.websocket.send_task(
                {
                    module:"toyz.web.tasks",
                    task:"load_directory",
                    parameters:{
                        path:path
                    }
                },
                function(result){
                    delete result.id;
                    file_dialog.update(result);
                    file_dialog.$div.dialog('open');
                }
            );
            if(callback){
                file_dialog.click_open=callback;
            }
        },
        update:function(params){
            file_dialog.path = params.path;
            file_dialog.$path_div.html(params.path);
            file_dialog.parent_folder = params.parent;
            file_dialog.shortcuts.update(params.shortcuts);
            file_dialog.folders.update(params.folders);
            file_dialog.files.update(params.files);
        },
        click_open:function(){},
        default_buttons:{
            "Open":function(){
                file_dialog.click_open();
                $(this).dialog("close");
            },
            "New Folder":function(){
                file_dialog.new_folder.$div.dialog('open');
            },
            "Cancel":function(){
                $(this).dialog("close");
            }
        }
    };
    
    // Set the onchange functions for shortcuts and folders
    file_dialog.shortcuts.$select.change(function(){
        var path = '$'+file_dialog.shortcuts.$select.val()+'$'
        file_dialog.hist_index++;
        file_dialog.hist = file_dialog.hist.splice(0,file_dialog.hist_index);
        file_dialog.hist.push(path);
        file_dialog.load_directory(path);
    });
    file_dialog.folders.$select.change(function(){
        var path = file_dialog.path+file_dialog.folders.$select.val()
        file_dialog.hist_index++;
        file_dialog.hist = file_dialog.hist.splice(0,file_dialog.hist_index);
        file_dialog.hist.push(path);
        file_dialog.load_directory(path);
    });
    
    // Navigation Buttons
    var $up_btn = $('<button/>').html("\u21B0").click(function(){
        file_dialog.load_directory(file_dialog.parent_folder);
    });
    var $back_btn = $('<button/>').html("\u25C0").click(function(){
        if(file_dialog.hist_index>0){
            file_dialog.hist_index--;
            file_dialog.load_directory(file_dialog.hist[file_dialog.hist_index]);
        }
    });
    var $fwd_btn = $('<button/>').html("\u25B6").click(function(){
        if(file_dialog.hist_index<file_dialog.hist.length-1){
            file_dialog.hist_index++;
            file_dialog.load_directory(file_dialog.hist[file_dialog.hist_index]);
        }
    });
    
    file_dialog.$div.append($up_btn);
    file_dialog.$div.append($back_btn);
    file_dialog.$div.append($fwd_btn);
    
    file_dialog.$div.dialog({
        resizable:true,
        draggable:true,
        width:600,
        height:400,
        autoOpen:false,
        modal:true,
        buttons:file_dialog.default_buttons,
    }).css("font-size", "12px");
    
    return file_dialog;
};

Toyz.Core.initFileSelect = function(div_name){
    var $file_div = $('<div/>').prop('id', div_name+'-div').addClass('file-dialog-div');
    var $lbl_div = $('<div/>');
    var $lbl = $('<lbl/>')
        .addClass('file-dialog-div-lbl')
        .html(div_name);
    var $select_div = $('<div/>').addClass('file-dialog-select-div');
    var $select = $('<select/>')
        .prop('multiple', 'multiple')
        .addClass('file-dialog-select');
    $file_div.append($lbl_div);
    $lbl_div.append($lbl);
    $file_div.append($select_div);
    $select_div.append($select);
    var file_select = {
        $div: $file_div,
        $select: $select,
        update: function(values){
            file_select.$select.html('');
            for(var i=0; i<values.length; i++){
                var $option = $('<option/>')
                    .html(values[i])
                    .val(values[i]);
                file_select.$select.append($option);
            }
        }
    }
    
    return file_select;
}

Toyz.Core.oldinitFileDialog=function(options){
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
                    module:"toyz.web.tasks",
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

// Build Interactive table
// Numbers, strings, etc will be entered into the table
// If an array is contained as a datapoint:
//     dataPoint[0] is the text added to the cell
//     dataPoint[1] is the function
//     dataPoint[2] is the parameter passed to the function
Toyz.Core.buildInteractiveTable=function(dataArray,table){
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

// jquery-getCSS by Dave Furero
// https://github.com/furf/jquery-getCSS
(function (window, document, jQuery) {

  var head = document.getElementsByTagName('head')[0],
      loadedCompleteRegExp = /loaded|complete/,
      callbacks = {},
      callbacksNb = 0,
      timer;

  jQuery.getCSS = function (url, options, callback) {

    if (jQuery.isFunction(options)) {
      callback = options;
      options  = {};
    }

    var link = document.createElement('link');

    link.rel   = 'stylesheet';
    link.type  = 'text/css';
    link.media = options.media || 'screen';
    link.href  = url;

    if (options.charset) {
      link.charset = options.charset;
    }

    if (options.title) {
      callback = (function (callback) {
        return function () {
          link.title = options.title;
          callback(link, "success");
        };
      })(callback);
    }

    // onreadystatechange
    if (link.readyState) {

      link.onreadystatechange = function () {
        if (loadedCompleteRegExp.test(link.readyState)) {
          link.onreadystatechange = null;
          callback(link, "success");
        }
      };

    // If onload is available, use it
    } else if (link.onload === null /* exclude Webkit => */ && link.all) {
      link.onload = function () {
        link.onload = null;
        callback(link, "success");
      };

    // In any other browser, we poll
    } else {

      callbacks[link.href] = function () {
        callback(link, "success");
      };

      if (!callbacksNb++) {
        // poll(cssPollFunction);

        timer = window.setInterval(function () {

          var callback,
              stylesheet,
              stylesheets = document.styleSheets,
              href,
              i = stylesheets.length;

          while (i--) {
            stylesheet = stylesheets[i];
            if ((href = stylesheet.href) && (callback = callbacks[href])) {
              try {
                // We store so that minifiers don't remove the code
                callback.r = stylesheet.cssRules;
                // Webkit:
                // Webkit browsers don't create the stylesheet object
                // before the link has been loaded.
                // When requesting rules for crossDomain links
                // they simply return nothing (no exception thrown)
                // Gecko:
                // NS_ERROR_DOM_INVALID_ACCESS_ERR thrown if the stylesheet is not loaded
                // If the stylesheet is loaded:
                //  * no error thrown for same-domain
                //  * NS_ERROR_DOM_SECURITY_ERR thrown for cross-domain
                throw 'SECURITY';
              } catch(e) {
                // Gecko: catch NS_ERROR_DOM_SECURITY_ERR
                // Webkit: catch SECURITY
                if (/SECURITY/.test(e)) {

                  // setTimeout(callback, 0);
                  callback(link, "success");

                  delete callbacks[href];

                  if (!--callbacksNb) {
                    timer = window.clearInterval(timer);
                  }

                }
              }
            }
          }
        }, 13);
      }
    }
    head.appendChild(link);
  };

})(window, window.document, window.jQuery);

console.log('toyz_core.js loaded');