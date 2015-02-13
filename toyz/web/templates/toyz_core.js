// Core for Toyz
// Copyright 2014 by Fred Moolekamp
// License: MIT

// Global Namespace for Toyz scripts
var Toyz=Toyz||{};
// Declare a namespace function to avoid namespace collisions
Toyz.namespace = function(namespace){
    var spaces = namespace.split('.');
    var parent = Toyz;
    if(spaces[0]=='Toyz'){
        spaces = spaces.slice(1);
    };
    for(var i=0;i<spaces.length;i++){
        var ns = spaces[i];
        parent[ns] = parent[ns]||{};
        parent = parent[ns];
    };
    return parent;
};

// Define the core objects that all Toyz modules will require
Toyz.namespace('Toyz.Core');

// Define some basic namespace functions //////////
// Check if a namespace exists
Toyz.Core.exists = function(namespace) {
    var parts = namespace.split('.');
    var obj = window;
    for(var i=0; i<parts.length; i++){
        if(obj[parts[i]]===undefined){
            return false
        };
        obj = obj[parts[i]];
    };
    return true;
};
// Get the variable represented by a namespace
Toyz.Core.get_var = function(namespace) {
    var parts = namespace.split('.');
    var obj = window;
    for(var i=0; i<parts.length; i++){
        obj = obj[parts[i]];
    };
    return obj;
};

// Parameters retrieved from the server when the page is rendered
Toyz.Core.core_js = [
    "/third_party/jquery_ui/jquery-ui.js",
    "/static/web/static/toyz_gui.js",
    "/static/web/static/toyz_visual.js",
    "/third_party/jquery-contextMenu/jquery.contextMenu.js",
    "/third_party/jquery-contextMenu/jquery.ui.position.js"
];

Toyz.Core.core_css = [
    "/third_party/jquery_ui_themes/{{user_theme}}/jquery-ui.min.css",
    "/static/web/static/toyz.css?=test",
    "/third_party/jquery-contextMenu/jquery.contextMenu.css"
];

// Returns the object at the end of a namespace
// example: Toyz.Core.getNamespace('Mainviewer.loadFitsFile',window) returns the function loadFitsFile
// in the fitsviewer
Toyz.Core.get_namespace=function(full_name, context) {
    var namespaces=full_name.split(".");
    for(var i=0;i<namespaces.length;i++) {
        context=context[namespaces[i]];
    };
    return context;
};

// Maximum requestId of a request sent to the server during a single session 
// before looping back to zero
Toyz.Core.MAX_ID=Math.pow(2,40);
// Initialize websocket to connect with tornado webserver
Toyz.Core.Websocket = function(options){
    this.user_id = "";
    this.session_id = "";
    this.queue = [];
    this.close_warning = false;
    this.job_url = "/job";
    this.rx_action = function(){};
    this.current_request = 0;
    this.requests = {};
    // Default functions for receiving errors, notifications, and warnings
    this.rx_error = function(error){
        alert('ERROR: '+error.error);
        console.log('Error',error);
        return true;
    };
    this.notify = function(result){
        alert(result.msg);
        console.log('notification:', result);
        return true;
    };
    this.warn = function(result){
        alert(result.warning);
        console.log('warning:', result);
        return true;
    };
    // Update the websocket with any options sent on initialization
    for(var opt in options){
        this[opt] = options[opt];
    };
    // Initialize the websocket
    var url="ws://"+location.host+this.job_url;
    this.ws=new WebSocket(url);
    if(this.hasOwnProperty('onopen')){
        this.ws.onopen = this.onopen;
        delete this.onopen;
    }else{
        this.ws.onopen=function(){
            if(this.logger){
                this.logger.log("Connected to server",true);
            };
        }.bind(this);
    };
    this.ws.onclose=function(){
        if(this.logger){
            this.logger.log("Connection to server lost",true);
        };
    }.bind(this);
	this.ws.onmessage=function(event){
        //console.log('event', event);
		var result = JSON.parse(event.data);
        var request = this.requests[result.request_id];
        // For initialization, there won't be a request stored
        if(request===undefined){
            request = {};
        };
        // Special cases of responses from the server
        var responses = {
            ERROR: 'rx_error',
            notification: 'notify',
            warning: 'warning',
            initialize: 'init_ws'
        };
        for(var response in responses){
            if(result.id==response){
                var exit;
                if(request.hasOwnProperty(response)){
                    exit = request[response](result);
                }else{
                    exit = this[responses[response]](result);
                };
                if(exit){
                    return;
                };
            };
        };
        if(request.hasOwnProperty('callback')){
            request.callback(result);
        }else{
            this.rx_action(result);
        };
        // Since some tasks will return notifications and warnings, only remove the
        // request if the 
        if(result.hasOwnProperty('finished') && result.finished===true){
            delete this.requests[result.request_id];
        };
	}.bind(this);
};
Toyz.Core.Websocket.prototype.send_task = function(request){
    var task = request.task;
    if(this.ws.readyState==1 && this.session_id!=""){
        task.id={
            user_id: this.user_id,
            session_id: this.session_id,
            request_id: this.current_request++
        };
        // In case there are multiple requestId increments before reaching this line
        // we make sure to reset the counter with enough space to avoid duplicate id's
        if(this.current_request>Toyz.Core.MAX_ID){
            this.current_request=(this.current_request-Toyz.Core.xMAX_ID)*10;
        };
        // send_task options can specify functions to execute when responses are
        // recieved from the server such as a callback, rx_error, notify, warn, etc.
        this.requests[task.id.request_id.toString()]=request;
        //console.log('sending', task);
        this.ws.send(JSON.stringify(task));
    }else if(this.ws.readyState>1){
        // TODO: Warn user connection was lost and give the option to reconnect
        if(this.logger){
            this.logger.log("Attempted to send "
                    +task.task+" but connection is closed",true);
        };
        // Websocket is closed, warn user the first time
        if(!this.close_warning){
            this.close_warning=true;
            alert("Websocket to server was disconnected, could not send task");
            throw Error("Websocket to server was disconnected, could not send task");
        };
    }else{
        //The connection hasn't opened yet, add the task to the queue
        //console.log('readyState:',
        //        this.ws.readyState, 'session_id', this.session_id)
        console.log('stored task in queue:', request);
        this.queue.push(request);
    };
};
Toyz.Core.Websocket.prototype.init_ws = function(result){
    this.user_id = result.user_id;
    this.session_id = result.session_id;
    //console.log('session:',result);
    // Run any tasks that were waiting for the websocket to load
    for(var i=0;i<this.queue.length;i++){
        console.log("sending task from queue", this.queue[i].task);
        this.send_task(this.queue[i]);
    };
    return true;
};

// For security reasons browsers do not have a control to load files from a server
// and you should be cautious in your use of this.
//
// When this dialog is opened a call is made to the server asking for the files
// and directories in the given path.
//
// After a file is selected the function "clickOpen" is called. By default this
// function does nothing, so initiate or declare this later on to tell the
// application what to do with the file.
Toyz.Core.FileDialog = function(options){
    options = $.extend(true, {}, options);
    // DOM objects in the file dialog
    this.$div = $('<div/>').prop('id','file-dialog').prop('title','Select file to open');
    var $new_folder = $('<div/>').prop('title','New Folder Name');
    var $path_outer_div = $('<div/>').addClass('file-dialog-path-div');
    var $path_lbl = $('<lbl/>').addClass("file-dialog-div-lbl").html('current path: ');
    this.$path_div = $('<div/>').css('display', 'inline-block');
    this.shortcuts = new Toyz.Core.FileSelect('shortcuts', this,
        function(){
            return '$'+this.shortcuts.$select.val()+'$'
        }.bind(this)
    );
    this.folders = new Toyz.Core.FileSelect('folders', this,
        function(){
            return this.path+this.folders.$select.val()
        }.bind(this)
    );
    this.files = new Toyz.Core.FileSelect('files', this);
    $('body').append(this.$div);
    $('body').append($new_folder);
    this.$div.append($path_outer_div);
    $path_outer_div.append($path_lbl); 
    $path_outer_div.append(this.$path_div);
    this.$div.append(this.shortcuts.$div);
    this.$div.append(this.folders.$div);
    this.$div.append(this.files.$div);
    // Other parameters
    this.path = "";
    this.hist = [];
    this.hist_index = 0;
    this.parent_folder = "";
    this.new_folder = {
        $div: $new_folder,
        $input: $('<input/>').prop('size',80).appendTo($new_folder)
    };
    // Attach websocket to file dialog
    if(!options.hasOwnProperty('websocket')){
        this.websocket = new Toyz.Core.Websocket({rx_action: function(){}});
    }else{
        this.websocket = options.websocket;
        delete options.websocket;
    };
    // Function to execute when the user clicks "open" after file is chosen
    this.click_open = function(){};
    this.default_buttons = {
        Open:function(){
            this.click_open();
            this.$div.dialog("close");
        }.bind(this),
        "New Folder":function(){
            this.new_folder.$div.dialog('open');
        }.bind(this),
        Cancel:function(){
            this.$div.dialog("close");
        }.bind(this)
    };
    // Navigation Buttons
    var $up_btn = $('<button/>').html("\u21B0").click(function(){
        this.load_directory({path: this.parent_folder});
    }.bind(this));
    var $back_btn = $('<button/>').html("\u25C0").click(function(){
        if(this.hist_index>0){
            this.hist_index--;
            this.load_directory({path: this.hist[this.hist_index]});
        }
    }.bind(this));
    var $fwd_btn = $('<button/>').html("\u25B6").click(function(){
        if(this.hist_index<this.hist.length-1){
            this.hist_index++;
            this.load_directory({path: this.hist[this.hist_index]});
        }
    }.bind(this));
    this.$div.append($up_btn);
    this.$div.append($back_btn);
    this.$div.append($fwd_btn);
    
    this.$div.dialog({
        resizable:true,
        draggable:true,
        width:600,
        height:400,
        autoOpen:false,
        modal:true,
        buttons: this.default_buttons,
    }).css("font-size", "12px");
    
    this.new_folder.$div.dialog({
        resizable:true,
        draggable:true,
        width:600,
        autoOpen:false,
        modal:true,
        buttons: {
            Create: function(){
                if(this.new_folder.$input.val()!=null && this.new_folder.$input.val()!=''){
                    this.new_folder.$div.dialog('close');
                    this.websocket.send_task({
                        task: {
                            module: 'toyz.web.tasks',
                            task: 'create_paths',
                            parameters: {
                                path: this.path,
                                new_folder: this.new_folder.$input.val()
                            }
                        },
                        callback: function(params, result){
                            this.load_directory(params);
                        }.bind({
                            path: this.path,
                            callback: this.click_open,
                            buttons: this.$div.dialog.buttons
                        }),
                    });
                }else{
                    alert('You must enter a path to create a new folder');
                }
                
            }.bind(this),
            Cancel: function(){
                this.new_folder.$div.dialog('close');
            }.bind(this)
        },
    }).css("font-size", "12px");
};
Toyz.Core.FileDialog.prototype.load_directory = function(options){
    if(!options.hasOwnProperty('path')){
        options.path = '';
    };
    if(this.hist.length==0){
        this.hist.push(options.path);
    };
    // Allow the user to customize the buttons displayed
    var buttons = this.default_buttons;
    if(options.hasOwnProperty('buttons')){
        buttons = options.buttons;
    }else;
    this.$div.dialog({
        buttons:this.default_buttons
    });
    this.websocket.send_task({
        task: {
            module:"toyz.web.tasks",
            task:"load_directory",
            parameters:{
                path: options.path
            }
        },
        callback: function(result){
            delete result.id;
            this.update(result);
            this.$div.dialog('open');
        }.bind(this)
    });
    if(options.hasOwnProperty('callback')){
        this.click_open = options.callback;
    };
};
Toyz.Core.FileDialog.prototype.update = function(params){
    this.path = params.path;
    this.$path_div.html(params.path);
    this.parent_folder = params.parent;
    this.shortcuts.update(params.shortcuts);
    this.folders.update(params.folders);
    this.files.update(params.files);
};

// Window for a specified type of file displayed in a Toyz.Core.FileDialog
Toyz.Core.FileSelect = function(div_name, file_dialog, get_path){
    this.file_dialog = file_dialog;
    this.$div = $('<div/>').prop('id', div_name+'-div').addClass('file-dialog-div');
    var $lbl_div = $('<div/>');
    var $lbl = $('<lbl/>')
        .addClass('file-dialog-div-lbl')
        .html(div_name);
    var $select_div = $('<div/>').addClass('file-dialog-select-div');
    this.$select = $('<select/>')
        .prop('multiple', 'multiple')
        .addClass('file-dialog-select');
    this.$div.append($lbl_div);
    $lbl_div.append($lbl);
    this.$div.append($select_div);
    $select_div.append(this.$select);
    // If clicking on an item should load a new path from the server, 
    // set the onchange event
    if(!(get_path===undefined)){
        this.get_path = get_path;
        this.$select.change(function(){
            var path = this.get_path();
            this.file_dialog.hist_index++;
            this.file_dialog.hist = this.file_dialog.hist.splice(0,this.file_dialog.hist_index);
            this.file_dialog.hist.push(path);
            this.file_dialog.load_directory({path: path});
        }.bind(this));
    };
};
Toyz.Core.FileSelect.prototype.update = function(values){
    this.$select.empty();
    for(var i=0; i<values.length; i++){
        var $option = $('<option/>')
            .html(values[i])
            .val(values[i]);
        this.$select.append($option);
    };
};

Toyz.Core.set_debugger = function(groups, clearall){
    if(typeof groups==='string'){
        groups = [groups];
    };
    clearall = clearall || false;
    if(clearall===true || !Toyz.Core.hasOwnProperty('debug_groups')){
        Toyz.Core.debug_groups = [];
    };
    for(var i=0; i<groups.length; i++){
        Toyz.Core.debug_groups.push(groups[i]);
    };
};

Toyz.Core.Debug = function(groups){
    if(typeof groups==='string'){
        groups = [groups];
    };
    for(var i=0; i<groups.length; i++){
        if(Toyz.Core.debug_groups.indexOf(groups[i])>-1){
            console.log('caller ', Toyz.Core.Debug.caller.name);
            console.log('arguments', Toyz.Core.Debug.caller.arguments);
        };
    };
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
        //$.getScript(script, load_js);
        $.getScript(script)
            .done(function( script, textStatus ) {
                load_js();
            })
            .fail(function( jqxhr, settings, exception ) {
                console.log('jqxhr', jqxhr);
                console.log('settings', settings);
                console.log('exception', exception);
                throw exception.stack;
            });
    }else{
        callback();
    }
};

// Dynamically load a list of style sheets
Toyz.Core.load_css = function(styles, callback){
    // There is no css equivalent to $.getScript. so we create one if it doesn't
    // already exist
    if(!jQuery.hasOwnProperty('getCss')){
        jQuery.getCss = function (url, callback){
            return $.ajax({
                url: url,
                dataType: "text",
                success: function(url, callback){
                    $('<link/>').prop({
                        href: url,
                        rel: "stylesheet",
                        type: "text/css",
                    }).appendTo("head");
                    if(!(callback===undefined)){
                        callback();
                    };
                }.bind(null, url, callback)
            });
        };
    };
    
    var style = styles[0];
    if(styles.length>0){
        console.log('loading', style);
        styles.shift();
        var load_css = Toyz.Core.load_css.bind(undefined, styles, callback);
        //$.getCSS(style, load_css);
        //console.log('getCss', $.getCss);
        $.getCss(style)
            .done(function( script, textStatus ) {
                load_css();
            })
            .fail(function( jqxhr, settings, exception ) {
                console.log('jqxhr', jqxhr);
                console.log('settings', settings);
                console.log('exception', exception);
                throw exception.stack;
            });
    }else{
        callback();
    }
}

// Load js and css dependencies in order
Toyz.Core.load_dependencies=function(dependencies, callback){
    var scripts = [];
    var style_sheets = [];
    
    if(dependencies.hasOwnProperty('core') && dependencies.core){
        scripts = Toyz.Core.core_js;
        style_sheets = Toyz.Core.core_css;
    };
    if(dependencies.hasOwnProperty('js')){
        scripts = scripts.concat(dependencies.js);
    };
    if(dependencies.hasOwnProperty('css')){
        style_sheets = style_sheets.concat(dependencies.css);
    };
    
    // Call the load_css function with the callback function and style sheets when
    // all scripts have loaded
    var css_callback = Toyz.Core.load_css.bind(undefined, style_sheets, callback);
    //console.log('scripts', scripts);
    //console.log('styles', style_sheets);
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

// Sort an array filled with numbers
Toyz.Core.sort_num = function(a,b){return a-b};
// Sort an array filled with numbers as strings
Toyz.Core.sort_num_str = function(a,b){return Number(a)-Number(b)};

// Sort an array that contains json objects. To use call:
//     my_array.sort(Toyz.Core.sort_num_key.bind(null, key_name))
Toyz.Core.sort_num_key = function(key, a,b){return a[key]-b[key]};

// Sort an array that contains json objects. To use call:
//     my_array.sort(Toyz.Core.sort_num_key.bind(null, [key1, key2, key3, ...keyN])),
// where the list of keys is in decreasing sort priority.
Toyz.Core.sort_num_keys = function(keys, a, b){
    for(var i=0, key=keys[i]; i<keys.length; i++){
        if(a[key]!=b[key]){
            return a[key]-b[key];
        }
    };
    return 0;
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

console.log('toyz_core.js loaded');