// API for Image Viewers
// Copyright 2015 by Fred Moolekamp
// License: MIT
Toyz.namespace('Toyz.Viewer');

Toyz.Core.set_debugger(['viewer']);

// Some API's require other dependencies to be loaed
Toyz.Viewer.dependencies_loaded = function(){
    return true;
};

Toyz.Viewer.scales = [-1,0.1,0.25,0.5,1,2,4,8,16,32,64];

Toyz.Viewer.load_dependencies = function(callback, params){
    callback();
};

Toyz.Viewer.Events = function(){
    this.mousedown = [];
    this.mouseup = [];
    this.mousemove = [];
    this.rx_datapoint = [];
    this.rx_img = [];
    this.update_viewer = [];
};

Toyz.Viewer.Types = function(tile_contents){
    this.img = {
        name:"image", 
        callback: function(key, options){
        }.bind(tile_contents)
    };
    this.large_img = {
        name: "large image",
        callback: function(key, options){
            
        }.bind(tile_contents)
    };
    this.mosaic = {
        name: "combined image",
        callback: function(key, options){
            
        }.bind(tile_contents)
    }
    this.thumbnails = {
        name: "image directory",
        callback: function(key, options){
            
        }.bind(tile_contents)
    };
};

Toyz.Viewer.Controls = function(parent){
    // Image controls
    this.load_img = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-img-btn viewer-ctrl-img-load',
        func: {
            click: function(){
                this.file_dialog.$div.dialog('open');
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'load image',
            value: ''
        },
    };
    this.first_frame = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-img-btn viewer-ctrl-first',
        func: {
            click: function(){
                var file_info = this.frames[this.viewer_frame].file_info;
                var all_frames = Object.keys(file_info.images);
                if(file_info.frame != all_frames[0]){
                    this.change_file_frame(all_frames[0]);
                };
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'skip to first image frame',
            value: ''
        },
    };
    this.previous_frame = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-img-btn viewer-ctrl-previous',
        func: {
            click: function(){
                var file_info = this.frames[this.viewer_frame].file_info;
                var all_frames = Object.keys(file_info.images);
                var frame = file_info.frame;
                if(all_frames.indexOf(frame)>0){
                    frame = all_frames[all_frames.indexOf(frame)-1];
                    this.change_file_frame(frame);
                };
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'go back one frame',
            value: ''
        },
    };
    this.input_frame = {
        type: 'select',
        options: [],
        inputClass: 'viewer-ctrl-img-btn viewer-ctrl-select',
        func: {
            change: function(event){
                if(event.currentTarget.value != this.frames[this.viewer_frame].file_info.frame){
                    this.change_file_frame(event.currentTarget.value);
                }
            }.bind(parent)
        },
        events: {
            rx_img: function(ctrl, event){
                var file_info = this.frames[this.viewer_frame].file_info;
                if(this.viewer_frame==event.viewer_frame && file_info.frame==event.file_frame){
                    ctrl.input_frame.$input.empty();
                    ctrl.input_frame.$input.val(file_info.frame);
                    var options = Object.keys(file_info.images);
                    for(var i=0; i<options.length; i++){
                        var $opt = $('<option/>')
                            .html(options[i])
                            .val(options[i]);
                        ctrl.input_frame.$input.append($opt)
                    };
                    ctrl.input_frame.$input.val(event.file_frame);
                };
            }.bind(parent, this),
            update_viewer: function(ctrl, event){
                if(event.updates.hasOwnProperty('file_frame')  &&
                    !(event.file_info===undefined)
                ){
                    ctrl.input_frame.$input.val(event.file_info.frame);
                }else if(event.updates.hasOwnProperty('viewer_frame') &&
                    !(event.file_info===undefined)
                ){
                    event.file_frame = event.file_info.frame;
                    ctrl.input_frame.events.rx_img(event);
                };
            }.bind(parent, this),
        }
    };
    this.next_frame = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-img-btn viewer-ctrl-next',
        func: {
            click: function(){
                var file_info = this.frames[this.viewer_frame].file_info;
                var all_frames = Object.keys(file_info.images);
                var frame = file_info.frame;
                if(all_frames.indexOf(frame)<all_frames.length-1){
                    frame = all_frames[all_frames.indexOf(frame)+1];
                    this.change_file_frame(frame);
                };
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'go to next frame',
            value: ''
        },
    };
    this.last_frame = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-img-btn viewer-ctrl-last',
        func: {
            click: function(){
                var file_info = this.frames[this.viewer_frame].file_info;
                var all_frames = Object.keys(file_info.images);
                if(file_info.frame != all_frames[all_frames.length-1]){
                    this.change_file_frame(all_frames[all_frames.length-1]);
                };
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'skip to last image frame',
            value: ''
        },
    };
    // Zoom controls
    this.zoom_input = {
        inputClass: 'viewer-ctrl-zoom-btn viewer-ctrl-input',
        func: {
            change: function(event){
                var file_info = this.frames[this.viewer_frame].file_info;
                if(event.currentTarget.value!=file_info.images[file_info.frame].viewer.scale){
                    this.set_scale(this.viewer_frame, event.currentTarget.value);
                };
            }.bind(parent)
        },
        events: {
            update_viewer: function(ctrl, event){
                if((event.updates.hasOwnProperty('scale') ||
                    event.updates.hasOwnProperty('file_frame') ||
                    event.updates.hasOwnProperty('viewer_frame')) &&
                    !(event.file_info===undefined) &&
                    !(event.file_info.images[event.file_info.frame].viewer===undefined)
                ){
                    var val = event.file_info.images[event.file_info.frame].viewer.scale;
                    ctrl.zoom_input.$input.val(Math.round(val*10000)/10000);
                };
            }.bind(parent, this),
            rx_img: function(ctrl, event){
                var file_info = this.frames[this.viewer_frame].file_info;
                if(this.viewer_frame==event.viewer_frame && file_info.frame==event.file_frame){
                    var val = file_info.images[file_info.frame].viewer.scale;
                    ctrl.zoom_input.$input.val(Math.round(val*10000)/10000);
                };
            }.bind(parent, this)
        }
    };
    this.zoom_out = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-zoom-btn viewer-ctrl-zoom-out',
        func: {
            click: function(zoom_input, event){
                this.press_zoom(this.viewer_frame, 'out', zoom_input.$input);
            }.bind(parent, this.zoom_input)
        },
        prop: {
            type: 'image',
            title: 'zoom out',
            value: ''
        },
    };
    this.zoom_in = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-zoom-btn viewer-ctrl-zoom-in',
        func: {
            click: function(zoom_input, event){
                this.press_zoom(this.viewer_frame, 'in', zoom_input.$input);
            }.bind(parent, this.zoom_input)
        },
        prop: {
            type: 'image',
            title: 'zoom in',
            value: ''
        }
    };
    this.zoom_bestfit = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-zoom-btn viewer-ctrl-zoom-bestfit',
        func: {
            click: function(){
                var file_info = this.frames[this.viewer_frame];
                var img_info = file_info.images[file_info.frame];
                x_scale = img_info.viewer.width/img_info.width*.97;
                y_scale = img_info.viewer.height/img_info.height*.97
                this.set_scale(this.viewer_frame, Math.min(y_scale, x_scale));
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'fit entire image in frame',
            value: ''
        },
    };
    this.zoom_fullsize = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-zoom-btn viewer-ctrl-zoom-fullsize',
        func: {
            click: function(){
                this.set_scale(this.viewer_frame, 1);
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'zoom to 100%',
            value: ''
        },
    };
    // Viewer controls
    this.add_viewer_frame = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-viewer-btn viewer-ctrl-viewer-add',
        func: {
            click: function(ctrl){
                this.frames.push({});
                this.viewer_frame=this.frames.length-1;
                $opt = $('<option/>')
                    .html(this.viewer_frame)
                    .val(this.viewer_frame);
                ctrl.input_viewer_frame.$input.append($opt);
                this.change_viewer_frame(this.viewer_frame);
            }.bind(parent, this)
        },
        prop: {
            type: 'image',
            title: 'add a frame to the viewer',
            value: ''
        },
    };
    this.remove_viewer_frame = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-viewer-btn viewer-ctrl-viewer-remove',
        func: {
            click: function(){
                if(this.frames.length>1){
                    var remove = confirm("Are you sure you want to remove this viewer frame?");
                    if(remove){
                        this.frames.splice(this.viewer_frame,1);
                        if(this.viewer_frame>this.frames.length-1){
                            this.viewer_frame--;
                        };
                        this.change_viewer_frame(this.viewer_frame);
                    };
                }else{
                    alert('View must always have one frame');
                }
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'remove the current frame from the viewer',
            value: ''
        },
    };
    this.first_viewer_frame = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-viewer-btn viewer-ctrl-first',
        func: {
            click: function(){
                if(this.viewer_frame!=0){
                    this.change_viewer_frame(0);
                };
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'skip to first viewer frame',
            value: ''
        },
    };
    this.previous_viewer_frame = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-viewer-btn viewer-ctrl-previous',
        func: {
            click: function(){
                if(this.viewer_frame>0){
                    this.change_viewer_frame(this.viewer_frame-1);
                }else{
                    this.change_viewer_frame(this.frames.length-1);
                }
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'go to previous viewer frame',
            value: ''
        },
    };
    this.input_viewer_frame = {
        type: 'select',
        options: [0],
        inputClass: 'viewer-ctrl-viewer-btn viewer-ctrl-select',
        func: {
            change: function(event){
                if(event.currentTarget.value != this.viewer_frame){
                    this.change_viewer_frame(event.currentTarget.value);
                };
            }.bind(parent)
        },
        events: {
            update_viewer: function(ctrl, event){
                if(event.updates.hasOwnProperty('viewer_frame')){
                    ctrl.input_viewer_frame.$input.val(event.updates.viewer_frame);
                };
            }.bind(parent, this)
        }
    };
    this.next_viewer_frame = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-viewer-btn viewer-ctrl-next',
        func: {
            click: function(){
                if(this.viewer_frame<this.frames.length-1){
                    this.change_viewer_frame(this.viewer_frame+1);
                }else{
                    this.change_viewer_frame(0);
                };
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'go to next viewer frame',
            value: ''
        },
    };
    this.last_viewer_frame = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-viewer-btn viewer-ctrl-last',
        func: {
            click: function(){
                if(this.viewer_frame != this.frames.length-1){
                    this.change_viewer_frame(this.frames.length-1);
                };
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'skip to last viewer frame',
            value: ''
        },
    };
    // Tool controls
    this.rect = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-tools-btn viewer-ctrl-tools-resize',
        func: {
            click: function(event){
                this.change_active_tool('rect', event.currentTarget);
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'select rectangle to zoom',
            value: ''
        },
        events: {
            mousedown: function(event){
                if(this.tools.active_tool=='rect'){
                    this.tools.rect.down_position = {
                        x: event.target.offsetLeft+event.offsetX,
                        y: event.target.offsetTop+event.offsetY
                    };
                    //console.log('down_position', this.tools.rect.down_position);
                    this.tools.rect.$rect = Toyz.Viewer.DrawingTools.draw_rect(
                        this.frames[this.viewer_frame].$viewer, 
                        this.tools.rect.down_position.x,
                        this.tools.rect.down_position.y,
                        1, 1
                    );
                }; 
            }.bind(parent),
            mousemove: function(event){
                if(this.mousedown && this.tools.rect.hasOwnProperty('down_position')){
                    var old_pos = this.tools.rect.down_position;
                    var new_pos = {
                        x: event.target.offsetLeft+event.offsetX,
                        y: event.target.offsetTop+event.offsetY
                    };
                    this.tools.rect.$rect.width(new_pos.x-old_pos.x);
                    this.tools.rect.$rect.height(new_pos.y-old_pos.y);
                }
            }.bind(parent),
            mouseup: function(event){
                if(this.tools.rect.hasOwnProperty('down_position')){
                    var old_pos = this.tools.rect.down_position;
                    var new_pos = {
                        x: event.target.offsetLeft+event.offsetX,
                        y: event.target.offsetTop+event.offsetY
                    };
                    var file_info = this.frames[this.viewer_frame].file_info;
                    var img_info = file_info.images[file_info.frame];
                    var x_scale = img_info.viewer.width/(new_pos.x-old_pos.x);
                    var y_scale = img_info.viewer.height/(new_pos.y-old_pos.y);
                    var scale = Math.min(x_scale, y_scale)*img_info.scale;
                    img_info.viewer.x_center = Math.round((new_pos.x+old_pos.x)/2);
                    img_info.viewer.y_center = Math.round((new_pos.y+old_pos.y)/2);
                    this.set_scale(this.viewer_frame, scale);
                    delete this.tools.rect.down_position;
                };
            }.bind(parent)
        }
    };
    this.center = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-tools-btn viewer-ctrl-tools-center',
        func: {
            click: function(event){
                this.change_active_tool('center', event.currentTarget);
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'center image on click',
            value: ''
        },
        events: {
            mousedown: function(event){
                if(this.tools.active_tool=='center'){
                    var x = event.target.offsetLeft+event.offsetX;
                    var y = event.target.offsetTop+event.offsetY;
                    var file_info = this.frames[this.viewer_frame].file_info;
                    var img_info = file_info.images[file_info.frame];
                    this.$tile_div.scrollLeft(x-Math.round(img_info.viewer.width/2));
                    this.$tile_div.scrollTop(y-Math.round(img_info.viewer.height/2));
                };
            }.bind(parent)
        }
    };
    this.hist = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-tools-btn viewer-ctrl-tools-hist',
        func: {
            click: function(){
                this.change_active_tool('hist', event.currentTarget);
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'get histogram',
            value: ''
        },
    };
    this.surface = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-tools-btn viewer-ctrl-tools-surface',
        func: {
            click: function(){
                this.change_active_tool('surface', event.currentTarget);
            }.bind(parent)
        },
        prop: {
            type: 'image',
            title: 'get surface plot',
            value: ''
        },
    };
    // Image Info
    this.img_coords = {
        type: 'lbl',
        lbl: 'Coordinates: ',
        inputClass: 'viewer-ctrl-info-btn viewer-ctrl-info-coord-div',
        events: {
            mousemove: function(ctrls, event){
                var $input = ctrls.img_coords.$input;
                var file_info = this.frames[this.viewer_frame].file_info;
                if(!(file_info===undefined) && file_info.hasOwnProperty('frame') &&
                    file_info.images[file_info.frame].hasOwnProperty('height')
                ){
                    var img_info = file_info.images[file_info.frame];
                    var x = event.target.offsetLeft+event.offsetX;
                    var y = event.target.offsetTop+event.offsetY;
                    var xy = this.get_coords(x, y, img_info);
                    x = xy[0];
                    y = xy[1];
                    var coords = 
                        (Math.round(x/img_info.scale*1000)/1000).toString()+','
                        +(Math.round(y/img_info.scale*1000)/1000).toString();
                    $input.text(coords);
                };
            }.bind(parent, this)
        }
    };
    this.physical_coords = {
        type: 'lbl',
        lbl: 'Physical Coords: ',
        inputClass: 'viewer-ctrl-info-btn viewer-ctrl-info-coord-div',
        events: {
            mousemove: function(ctrls, event){
                
            }.bind(parent, this)
        }
    };
    this.pixel_val = {
        type: 'lbl',
        lbl: 'Pixel Value: ',
        inputClass: 'viewer-ctrl-info-btn',
        events: {
            rx_datapoint: function(ctrls, event){
                this.pixel_val.$input.val(event.px_val);
            }.bind(parent, this)
        }
    };
};

Toyz.Viewer.FileDialog = function(tile_contents){
    this.$div = $('<div/>');
    this.tile_contents = tile_contents;
    this.$parent = $('body');
    this.$parent.append(this.$div);
    
    var options = new Toyz.Viewer.Types(this);
    for(var opt in options){
        if(options.hasOwnProperty(opt)){
            options[opt] = options[opt].name
        }
    };
    
    var gui = {
        type: 'div',
        params: {
            img_type: {
                lbl: 'Viewer type',
                type: 'select',
                options: options
            },
            filepath: {
                lbl: 'filename',
                file_dialog: true
            }
        }
    };
    this.gui = Toyz.Gui.initParamList(
        gui,
        options = {
            $parent: this.$div
        }
    );
    
    this.$div.dialog({
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: false,
        width: 'auto',
        title: 'Open Image',
        maxHeight: $(window).height(),
        position: {
            my: "center top",
            at: "center top",
            of: window
        },
        buttons: {
            Open: function(tile_contents){
                var file_info = this.gui.getParams(this.gui.params);
                delete file_info.conditional;
                tile_contents.load_img({file_info:file_info}, tile_contents.viewer_frame);
                this.$div.dialog('close');
            }.bind(this, tile_contents),
            Cancel: function(){
                this.$div.dialog('close');
            }.bind(this)
        }
    });
};

Toyz.Viewer.contextMenu_items = function(workspace, tile_contents, options){
    var items = $.extend(true,{
        controls: {
            name: 'Control Panel',
            callback: function(){
                this.ctrl_panel.$div.dialog('open');
            }.bind(tile_contents)
        },
        img_sep: "--------------"
    },options, Toyz.Workspace.tile_contextMenu_items(workspace));
    return items;
};

//  Viewer as contents of Workspace tile ////////////////////////////////////
Toyz.Viewer.Contents = function(params){
    this.type = 'Viewer';
    this.tile = params.tile;
    this.$tile_div = params.$tile_div;
    this.$tile_div
        .removeClass('context-menu-tile')
        .addClass('context-menu-viewer')
        .addClass('viewer-main-div');
    this.workspace = params.workspace;
    this.settings = {};
    //create tile context menu
    $.contextMenu({
        selector: '.context-menu-viewer',
        callback: function(workspace, key, options){
            workspace[key](options);
        }.bind(null, workspace),
        items: Toyz.Viewer.contextMenu_items(workspace, this, params.ctx_menu)
    })
    
    // Scroll stop
    this.$tile_div.scroll(function(event){
        if(this.$tile_div.data('scroll timeout')){
            clearTimeout(this.$tile_div.data('scroll timeout'));
        };
        this.$tile_div.data('scroll timeout', setTimeout(function(){
            //console.log('scroll:', this.$tile_div.scrollLeft(), this.$tile_div.scrollTop());
            //console.log('window:', this.file_info.images[this.file_info.frame].viewer);
            this.set_window(
                this.viewer_frame, this.$tile_div.scrollLeft(), this.$tile_div.scrollTop()
            );
        }.bind(this), 250))
    }.bind(this));
    
    // Mousedown functions
    this.mousedown = false;
    this.$tile_div.mousedown(function(event){
        this.mousedown = true;
        for(var i=0; i<this.events.mousedown.length; i++){
            this.events.mousedown[i](event);
        };
    }.bind(this));
    
    // Mousemove functions
    this.$tile_div.mousemove(function(event){
        for(var i=0; i<this.events.mousemove.length; i++){
            this.events.mousemove[i](event);
        };
    }.bind(this));
    
    // Mouseup functions
    this.$tile_div.mouseup(function(event){
        this.mousedown = false;
        for(var i=0; i<this.events.mouseup.length; i++){
            this.events.mouseup[i](event);
        };
    }.bind(this));
    
    // Use default control panel unless another is specified
    if(!params.hasOwnProperty('controls')){
        params.controls = {
            Image: ['load_img', 'first_frame', 'previous_frame', 
                'input_frame', 'next_frame', 'last_frame'],
            Viewer: ['add_viewer_frame', 'remove_viewer_frame', 'first_viewer_frame',
                'previous_viewer_frame', 'input_viewer_frame', 'next_viewer_frame',
                'last_viewer_frame'],
            Zoom: ['zoom_out', 'zoom_in', 'zoom_bestfit', 'zoom_fullsize', 'zoom_input'],
            Tools: ['rect', 'center', 'hist', 'surface'],
            'Image Info': ['img_coords', 'physical_coords', 'pixel_val']
        };
    };
    // Setup variables used by different tools
    this.tools = {active_tool: ''};
    for(var i=0; i<params.controls.Tools.length; i++){
        this.tools[params.controls.Tools[i]] = {};
    };
    
    // Create control panel and bind any events to the viewer
    var ctrl = this.init_controls({}, params.controls);
    this.ctrl_panel = ctrl[0];
    this.controls = ctrl[1];
    this.events = new Toyz.Viewer.Events();
    for(var ctrl in this.controls){
        if(this.controls[ctrl].hasOwnProperty('events')){
            for(var event in this.controls[ctrl].events){
                this.events[event].push(this.controls[ctrl].events[event]);
            }
        }
    };
    this.ctrl_panel.$div.dialog('open');
    
    this.file_dialog = new Toyz.Viewer.FileDialog(this);
    this.frames = [{}];
    this.change_viewer_frame(0);
};
// Trigger any functions waiting for an 'update_viewer' event
Toyz.Viewer.Contents.prototype.update = function(viewer_frame, updates, updates_val){
    //console.log('caller:', arguments.callee.caller);
    //console.log('viewer_frame:', viewer_frame);
    if(!(updates_val===undefined)){
        var temp = {}
        temp[updates] = updates_val;
        updates = temp;
    };
    //console.log('updates:', updates);
    for(var i=0; i<this.events.update_viewer.length; i++){
        var event = {
            file_info: undefined,
            viewer_frame: viewer_frame,
            updates: updates
        };
        if(this.frames[viewer_frame].hasOwnProperty('file_info')){
            var file_info = this.frames[viewer_frame].file_info;
            event['file_info'] = file_info;
        };
        this.events.update_viewer[i](event);
    };
    var file_info = this.frames[viewer_frame].file_info;
    if(!(file_info===undefined) && file_info.img_type=='large_img'){
        if(
            updates.hasOwnProperty('scale') ||
            updates.hasOwnProperty('colormap') ||
            updates.hasOwnProperty('file_frame')
        ){
            this.get_img_info(this.viewer_frame, file_info.frame);
        }else if(updates.hasOwnProperty('position')){
            this.get_tile_map(this.viewer_frame, file_info.frame);
        };
    };
};
Toyz.Viewer.Contents.prototype.set_window = function(
        viewer_frame, viewer_left, viewer_top){
            var file_info = this.frames[viewer_frame].file_info;
    if(!(file_info===undefined)){
        var img_info = file_info.images[file_info.frame];
        var viewer = img_info.viewer;
        viewer.left = viewer_left;
        viewer.right = viewer.left + viewer.width;
        viewer.x_center = viewer.left + Math.round(viewer.width/2);
        viewer.top = viewer_top;
        viewer.bottom = viewer.top+viewer.height;
        viewer.y_center = viewer.top + Math.round(viewer.height/2);
    };
    this.update(viewer_frame, 'position', viewer);
};
Toyz.Viewer.Contents.prototype.rx_info = function(from, info_type, info){
};
Toyz.Viewer.Contents.prototype.save = function(){
    var frames = [];
    for(var i=0; i<this.frames.length; i++){
        var file_info = $.extend(true, {}, this.frames[i].file_info);
        var img_info = file_info.images[file_info.frame];
        img_info.tiles = {};
        frames[i] = {
            file_info: file_info
        }
    };
    var tile = {
        type: this.type,
        settings: {
            viewer_frame: this.viewer_frame,
            frames: frames
        }
    };
    return tile;
};
Toyz.Viewer.Contents.prototype.load_img = function(settings, viewer_frame){
    //console.log('loading image', settings);
    if(settings.file_info.img_type=='img'){
        //console.log('single image');
        settings.file_info.images = {'0':{
            scale: 1,
            viewer: {
                width: this.$tile_div.width(),
                height: this.$tile_div.height(),
                top: 0,
                left: 0,
                right: this.$tile_div.width(),
                bottom: this.$tile_div.height(),
                x_center: Math.round(this.$tile_div.width()/2),
                y_center: Math.round(this.$tile_div.height()/2),
                scale: 1
            }
        }};
        this.frames[viewer_frame].file_info = settings.file_info;
        this.frames[viewer_frame].file_info.frame = '0';
        this.$tile_div.empty();
        this.frames[viewer_frame].$viewer = $('<div/>').addClass('viewer-div');
        this.$tile_div.append(this.frames[viewer_frame].$viewer);
        var img = new Image();
        img.onload = function(img, viewer_frame, img_info) {
            var $img = $(img)
                .addClass('viewer-tile-img')
            this.frames[viewer_frame].$viewer.append($img.clone());
            img_info.$img = $img;
            this.update(viewer_frame, 'scale', img_info.viewer.scale);
        }.bind(this, img, viewer_frame, settings.file_info.images['0']);
        img.src = '/file'+settings.file_info.filepath;
        img.ondragstart = function(){return false;};
    }else if(settings.file_info.img_type=='large_img'){
        if(!settings.hasOwnProperty('img_info')){
            settings.img_info = {
                viewer: {
                    width: this.$tile_div.width(),
                    height: this.$tile_div.height(),
                    scale: -1
                }
            }
        };
        this.workspace.websocket.send_task(
            {
                module: 'toyz.web.tasks',
                task: 'get_file_info',
                parameters: {
                    file_info: settings.file_info,
                    img_info: settings.img_info
                }
            },
            function(viewer_frame, result){
                //console.log('file info', result.file_info);
                this.frames[viewer_frame].file_info = result.file_info;
                var img_info = result.file_info.images[result.file_info.frame];
                this.$tile_div.empty();
                this.frames[viewer_frame].$viewer = $('<div/>').addClass('viewer-div');
                this.$tile_div.append(this.frames[viewer_frame].$viewer);
                this.frames[viewer_frame].$viewer.width(img_info.scaled_width);
                this.frames[viewer_frame].$viewer.height(img_info.scaled_height);
                this.rx_img_info(viewer_frame, result.file_info.frame, img_info);
                this.get_img_tiles(viewer_frame, result.file_info.frame, result.new_tiles);
            }.bind(this, viewer_frame)
        )
    }else{
        alert('Image type is not supported yet');
    }
};
Toyz.Viewer.Contents.prototype.get_img_info = function(viewer_frame, file_frame){
    var file_info = $.extend(true, {}, this.frames[viewer_frame].file_info);
    var viewer = {
        width: this.$tile_div.width(),
        height: this.$tile_div.height(),
        scale: -1
    };
    var img_info = {};
    if(file_info.images.hasOwnProperty(file_frame)){
        img_info = file_info.images[file_frame];
        if(!file_info.images[file_frame].hasOwnProperty('viewer')){
            img_info.viewer = viewer;
        };
    }else{
        img_info.viewer = viewer;
    };
    this.workspace.websocket.send_task(
        {
            module: 'toyz.web.tasks',
            task: 'get_img_info',
            parameters: {
                file_info: file_info,
                img_info: img_info
            }
        },
        function(viewer_frame, result){
            var file_info = this.frames[viewer_frame].file_info;
            file_info.frame = result.img_info.frame;
            file_info.images[file_info.frame] = result.img_info;
            if(!(this.frames[viewer_frame].hasOwnProperty('$viewer'))){
                this.frames[viewer_frame].$viewer = $('<div/>').addClass('viewer-div');
                this.$tile_div.append(this.frames[viewer_frame].$viewer);
            };
            this.frames[viewer_frame].$viewer.width(result.img_info.scaled_width);
            this.frames[viewer_frame].$viewer.height(result.img_info.scaled_height);
            this.rx_img_info(viewer_frame, file_info.frame, result.img_info);
            this.get_img_tiles(viewer_frame, file_info.frame, result.new_tiles);
        }.bind(this, viewer_frame)
    );
};
Toyz.Viewer.Contents.prototype.rx_img_info = function(viewer_frame, file_frame, img_info){
    for(var i=0; i<this.events['rx_img'].length; i++){
        this.events['rx_img'][i]({
            viewer_frame: viewer_frame,
            file_frame: file_frame,
            img_info: img_info
        });
    };
};
Toyz.Viewer.Contents.prototype.get_tile_map = function(viewer_frame, file_frame){
    var file_info = $.extend(true, {}, this.frames[viewer_frame].file_info);
    delete file_info['images'];
    //console.log('img_info', this.frames[viewer_frame].file_info.images[file_frame]);
    this.workspace.websocket.send_task(
        {
            module: 'toyz.web.tasks',
            task: 'get_tile_info',
            parameters: {
                file_info: file_info,
                img_info: this.frames[viewer_frame].file_info.images[file_frame]
            }
        },
        function(viewer_frame, file_frame, result){
            this.frames[viewer_frame].file_info.images[file_frame].tiles = $.extend(
                true, 
                this.frames[viewer_frame].file_info.images[file_frame].tiles,
                result.new_tiles
            );
            this.get_img_tiles(viewer_frame, file_frame, result.new_tiles)
        }.bind(this, viewer_frame, file_frame)
    )
};
Toyz.Viewer.Contents.prototype.get_img_tiles = function(viewer_frame, file_frame, tiles){
    var file_info = $.extend(true, {}, this.frames[viewer_frame].file_info);
    var img_info = file_info.images[file_frame];
    // No need to send a large json object with image data that is not needed
    delete file_info['images'];
    delete img_info['tiles'];
    
    this.$tile_div.scrollTop(img_info.viewer.top);
    this.$tile_div.scrollLeft(img_info.viewer.left);
    
    //console.log('scaled dims', img_info.scaled_width, img_info.scaled_height);
    //console.log('scrolling to',img_info.viewer.left,img_info.scaled_height-img_info.viewer.height-img_info.viewer.bottom);
    //console.log('viewer set for scrolling', img_info.viewer);
    for(var tile_idx in tiles){
        if(tiles.hasOwnProperty(tile_idx)){
            //console.log('tile', tiles[tile_idx]);
            this.workspace.websocket.send_task(
                {
                    module: 'toyz.web.tasks',
                    task: 'get_img_tile',
                    parameters: {
                        file_info: file_info,
                        img_info: img_info,
                        tile_info: tiles[tile_idx]
                    }
                },
                this.rx_tile_info.bind(this, viewer_frame, file_frame, tile_idx)
            )
        }
    };
};
Toyz.Viewer.Contents.prototype.rx_tile_info = function(
        viewer_frame, file_frame, tile_idx, result){
    if(result.success){
        var img_info = this.frames[viewer_frame].file_info.images[file_frame];
        img_info.tiles[tile_idx] = result.tile_info;
        // load image from data url
        var img = new Image();
        img.onload = function(viewer_frame, img, img_info, tile_idx) {
            var tile = img_info.tiles[tile_idx];
            var tile_pos = {};
            if(img_info.invert_x){
                tile_pos['right'] = tile.right+'px';
            }else{
                tile_pos['left'] = tile.left+'px';
            };
            if(img_info.invert_y){
                tile_pos['bottom'] = tile.bottom+'px';
            }else{
                tile_pos['top'] = tile.top+'px';
            }
            var $img = $(img)
                .addClass('viewer-tile-img')
                .css(tile_pos);
            this.frames[viewer_frame].$viewer.append($img);
            tile.loaded = true;
        }.bind(this, viewer_frame, img, img_info, tile_idx);
        img.src = '/file'+img_info.tiles[tile_idx].new_filepath;
        img.ondragstart = function(){return false;};
    }else{
        console.log('tile did not need to be created');
    };
};
Toyz.Viewer.Contents.prototype.set_tile = function(settings){
    
};
Toyz.Viewer.Contents.prototype.init_controls = function(controls, divs){
    var controls = $.extend(true, new Toyz.Viewer.Controls(this), controls);
    var gui = {
        type: 'div',
        params: {}
    };
    for(var div in divs){
        var this_div = {
            type: 'div',
            legend: div,
            params: {}
        };
        for(var i=0; i<divs[div].length; i++){
            this_div.params[divs[div][i]] = controls[divs[div][i]];
        };
        gui.params[div] = this_div;
    };
    var $div = $('<div/>');
    gui = Toyz.Gui.initParamList(
        gui,
        options = {
            $parent: $div
        }
    );
    //this.$tile_div.append($div);
    $('body').append($div);
    var ctrl_panel = {
        gui: gui,
        $div: $div
    };
    ctrl_panel.$div.dialog({
        title: 'Viewer Controls',
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: false,
        width: 300,
        height: 'auto',
        buttons: {},
        position: {
            my: 'left',
            at: 'right',
            of: this.$tile_div
        }
    }).css("font-size", "12px");
    
    return [ctrl_panel, controls];
};
Toyz.Viewer.Contents.prototype.change_file_frame = function(new_frame){
    var file_info = this.frames[this.viewer_frame].file_info;
    this.frames[this.viewer_frame].$viewer.empty();
    file_info.frame = new_frame;
    this.update(this.viewer_frame, 'file_frame', file_info.frame);
    //this.get_img_info(this.viewer_frame, new_frame);
};
Toyz.Viewer.Contents.prototype.change_viewer_frame = function(new_frame){
    var options = [];
    this.viewer_frame = new_frame;
    this.$tile_div.empty();
    if(this.frames[this.viewer_frame].hasOwnProperty('$viewer')){
        var file_info = this.frames[this.viewer_frame].file_info;
        this.$tile_div.append(this.frames[this.viewer_frame].$viewer);
        if(file_info.hasOwnProperty('images')){
            var img_info = file_info.images[file_info.frame];
            this.$tile_div.scrollTop(img_info.viewer.top);
            this.$tile_div.scrollLeft(img_info.viewer.left);
        };
    };
    this.update(this.viewer_frame, 'viewer_frame', this.viewer_frame);
};
Toyz.Viewer.Contents.prototype.get_scale_index = function(scale){
    var index={
        previous:Toyz.Viewer.scales[1],
        next:Toyz.Viewer.scales[Toyz.Viewer.scales.length-1]
    };
    for(var i=1;i<Toyz.Viewer.scales.length;i++){
        if(scale>Toyz.Viewer.scales[i]){
            index.previous=Toyz.Viewer.scales[i];
        }else if(scale<Toyz.Viewer.scales[i]){
            index.next=Toyz.Viewer.scales[i];
            return index;
        }else if(scale==Toyz.Viewer.scales[i]){
            if(i>0){
                index.previous=Toyz.Viewer.scales[i-1];
            }else{
                index.previous=Toyz.Viewer.scales[i];
            };
            if(i<Toyz.Viewer.scales.length-1){
                index.next=Toyz.Viewer.scales[i+1];
            }else{
                index.next=Toyz.Viewer.scales[i];
            };
            return index;
        }
    };
    return index;
};
Toyz.Viewer.Contents.prototype.press_zoom = function(viewer_frame, direction, $scale){
    var index = this.get_scale_index($scale.val());
    if(direction=='in'){
        $scale.val(index.next);
    }else if(direction=='out'){
        $scale.val(index.previous);
    }else{
        alert("ERROR: unexpected zoom direction, please check your code");
    };
    this.set_scale(viewer_frame, $scale.val());
};
Toyz.Viewer.Contents.prototype.set_scale = function(viewer_frame, scale){
    var file_info = this.frames[viewer_frame].file_info;
    var img_info = file_info.images[file_info.frame];
    this.frames[viewer_frame].$viewer.empty();
    if(file_info.img_type == 'img'){
        var $scaled_img = img_info.$img.clone();
        img_info.scale = scale;
        img_info.viewer.scale = scale;
        $scaled_img.css({
            width: $scaled_img[0].width*scale,
            height: $scaled_img[0].height*scale
        });
        this.frames[viewer_frame].$viewer.append($scaled_img);
    }else if(file_info.img_type=='large_img'){
        var old_scale = file_info.images[file_info.frame].viewer.scale;
        img_info.viewer.x_center = scale/old_scale*img_info.viewer.x_center;
        img_info.viewer.y_center = scale/old_scale*img_info.viewer.y_center;
        img_info.viewer.scale = Number(scale);
        img_info.tiles = {};
    };
    //console.log('scale', img_info.viewer.scale)
    this.update(viewer_frame, 'scale', img_info.viewer.scale);
};
Toyz.Viewer.Contents.prototype.get_coords = function(x, y, img_info){
    if(img_info.invert_y===true){
        y = img_info.height*img_info.scale-y;
    };
    if(img_info.invert_x===true){
        x = img_info.width*img_info.scale-x;
    };
    return [x,y];
};
Toyz.Viewer.Contents.prototype.change_active_tool = function(new_tool, new_btn){
    if(!(this.tools.$active_btn===undefined)){
        this.tools.$active_btn.css('background-color', '#DEDEDE');
    };
    this.tools.$active_btn = $(new_btn);
    this.tools.$active_btn.css('background-color', '#AAAAAA');
    this.tools.active_tool = new_tool;
}
Toyz.Viewer.DrawingTools = {
    draw_circle: function($div, x, y, radius, css, group){
        var style = $.extend(true, {
            border: "1px solid red",
            width: 2*radius,
            height: 2*radius,
            left: x+'px',
            top: y+'px',
            'border-radius': '50%',
            position: 'absolute'
        }, css);
        var $circle = $('<div/>')
            .addClass('viewer-circle-div')
            .css(style);
        if(!(group===undefined)){
            $circle.addClass(group);
        };
        $div.append($circle);
        return $circle;
    },
    draw_rect: function($div, x, y, width, height, css, group){
        var style = $.extend(true, {
            border: "2px solid red",
            width: width,
            height: height,
            left: x+'px',
            top: y+'px',
            position: 'absolute'
        }, css);
        var $rect = $('<div/>')
            .addClass('viewer-rect-div')
            .addClass('')
            .css(style);
        if(!(group===undefined)){
            $rect.addClass(group);
        };
        $div.append($rect);
        return $rect;
    }
};