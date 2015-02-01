// API for Image Viewers
// Copyright 2015 by Fred Moolekamp
// License: MIT
Toyz.namespace('Toyz.Viewer');

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
    this.set_viewer = [];
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
            rx_img: function(event){
                var values = {conditions:{}, input_frame: {
                    options: Object.keys(this.frames[event.viewer_frame].file_info.images),
                    value: this.frames[event.viewer_frame].file_info.frame
                }};
                this.ctrl_panel.gui.setParams(this.ctrl_panel.gui.params, values, false);
            }.bind(parent)
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
                if(this.change_scale===true){
                    this.set_scale(event.currentTarget.value);
                };
            }.bind(parent)
        },
    };
    this.zoom_out = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-zoom-btn viewer-ctrl-zoom-out',
        func: {
            click: function(zoom_input, event){
                this.press_zoom('out', zoom_input.$input);
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
                this.press_zoom('in', zoom_input.$input);
            }.bind(parent, this.zoom_input)
        },
        prop: {
            type: 'image',
            title: 'zoom in',
            value: ''
        },
    };
    this.zoom_bestfit = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-zoom-btn viewer-ctrl-zoom-bestfit',
        func: {
            click: function(){
                this.set_scale(-1);
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
                this.set_scale(1);
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
            click: function(){
                this.frames.push({});
                this.viewer_frame++;
                this.change_viewer_frame(this.viewer_frame);
            }.bind(parent)
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
        options: [],
        inputClass: 'viewer-ctrl-viewer-btn viewer-ctrl-select',
        func: {
            change: function(event){
                if(event.currentTarget.value != this.viewer_frame){
                    this.change_viewer_frame(event.currentTarget.value);
                };
            }.bind(parent)
        }
    };
    this.next_viewer_frame = {
        inputClass: 'viewer-ctrl-button viewer-ctrl-viewer-btn viewer-ctrl-next',
        func: {
            click: function(){
                if(this.viewer_frame<this.frames.length-1){
                    this.change_viewer_frame(this.viewer_frame+1);
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
                    console.log('down_position', this.tools.rect.down_position);
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
                    this.set_scale(scale);
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
            mousemove: function(ctrls, event){
                
            }.bind(parent, this)
        }
    };
};

Toyz.Viewer.FileDialog = function(tile_contents){
    this.$div = $('<div/>');
    this.tile_contents = tile_contents;
    //this.$parent = this.tile_contents.$tile_div;
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
            filename: {
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
                tile_contents.set_tile(this.gui.getParams(this.gui.params));
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
    //this.$viewer = $('<div/>').addClass('viewer-div');
    //this.$tile_div.append(this.$viewer);
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
            this.set_window(this.$tile_div.scrollLeft(), this.$tile_div.scrollTop())
            if(!(this.frames[this.viewer_frame].file_info===undefined)){
                this.get_tile_map(
                    this.viewer_frame, 
                    this.frames[this.viewer_frame].file_info.frame
                );
            };
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
    //this.viewer_frame = 0;
    this.change_viewer_frame(0);
};
Toyz.Viewer.Contents.prototype.set_window = function(viewer_left, viewer_top){
    var file_info = this.frames[this.viewer_frame].file_info;
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
};
Toyz.Viewer.Contents.prototype.update = function(params, param_val){
    // Allow user to either pass param_name, param_val to function or
    // dictionary with multiple parameters
    if(!(param_val===undefined)){
        params = {params:param_val};
    };
    for(var param in params){
        this[param] = params[param];
    }
};
Toyz.Viewer.Contents.prototype.rx_info = function(from, info_type, info){
    
};
Toyz.Viewer.Contents.prototype.save = function(){
    var tile = {
        type: this.type,
        settings: this.settings
    };
    return tile;
};
Toyz.Viewer.Contents.prototype.load_large_img = function(filepath){
    //console.log('loading image');
    this.workspace.websocket.send_task(
        {
            module: 'toyz.web.tasks',
            task: 'get_file_info',
            parameters: {
                filepath: filepath,
                viewer: {
                    width: this.$tile_div.width(),
                    height: this.$tile_div.height(),
                    left: 0,
                    bottom: 0,
                    right: this.$tile_div.width(),
                    top: this.$tile_div.height(),
                    x_center: Math.round(this.$tile_div.width()),
                    y_center: Math.round(this.$tile_div.width()),
                    scale: -1
                },
            }
        },
        function(frame, result){
            //console.log('file info', result.file_info);
            this.frames[frame].file_info = result.file_info;
            var img_info = result.file_info.images[result.file_info.frame];
            this.$tile_div.empty();
            this.frames[frame].$viewer = $('<div/>').addClass('viewer-div');
            this.$tile_div.append(this.frames[frame].$viewer);
            this.frames[frame].$viewer.width(img_info.scaled_width);
            this.frames[frame].$viewer.height(img_info.scaled_height);
            this.get_img_tiles(this.viewer_frame, result.file_info.frame, result.new_tiles);
        }.bind(this, this.viewer_frame)
    )
};
Toyz.Viewer.Contents.prototype.get_best_fit = function(width, height){
    
};
Toyz.Viewer.Contents.prototype.get_img_info = function(viewer_frame, file_frame){
    var file_info = $.extend(true, {}, this.frames[viewer_frame].file_info);
    var img_viewer = {
        width: this.$tile_div.width(),
        height: this.$tile_div.height(),
        scale: -1
    };
    if(file_info.images.hasOwnProperty(file_frame) && file_info.images[file_frame].viewer){
        img_viewer = file_info.images[file_frame].viewer;
        //console.log('changing window', img_viewer);
    }else{
        console.log('file frame, img_info', file_frame, file_info.images[file_frame]);
    };
    this.workspace.websocket.send_task(
        {
            module: 'toyz.web.tasks',
            task: 'get_img_info',
            parameters: {
                file_info: file_info,
                viewer: img_viewer,
                frame: file_frame
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
            this.get_img_tiles(viewer_frame, file_info.frame, result.new_tiles);
        }.bind(this, viewer_frame)
    );
};
Toyz.Viewer.Contents.prototype.get_tile_map = function(viewer_frame, file_frame){
    var file_info = $.extend(true, {}, this.frames[viewer_frame].file_info);
    delete file_info['images'];
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
    var img_info = $.extend(
        true, {}, 
        this.frames[viewer_frame].file_info['images'][file_frame]
    );
    // No need to send a large json object with tile data that is not needed
    delete img_info['tiles'];
    var file_info = $.extend(true, {}, this.frames[viewer_frame].file_info);
    // No need to send a large json object with image data that is not needed
    delete file_info['images'];
    
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
    for(var i=0; i<this.events['rx_img'].length; i++){
        this.events['rx_img'][i]({
            viewer_frame: viewer_frame,
            file_frame: file_frame
        });
    };
    // Avoid a loop since changing the scale triggers the viewer to reload the image
    this.change_scale = false;
    this.ctrl_panel.gui.setParams(this.ctrl_panel.gui.params, {
        zoom_input: Number(Math.round(img_info.viewer.scale*10000)/10000)
    }, false);
    this.change_scale = true;
};
Toyz.Viewer.Contents.prototype.rx_tile_info = function(
        viewer_frame, file_frame, tile_idx, result){
    if(result.success){
        var img_info = this.frames[viewer_frame].file_info.images[file_frame];
        // load image from data url
        var img = new Image();
        img.onload = function(img, viewer_frame, img_info, tile_idx) {
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
        }.bind(this, img, viewer_frame, img_info, tile_idx);
        img.src = '/file'+img_info.tiles[tile_idx].new_filepath;
        img.ondragstart = function(){return false;};
    }else{
        console.log('tile did not need to be created');
    };
};
Toyz.Viewer.Contents.prototype.set_tile = function(settings){
    if(settings.img_type == 'large_img'){
        this.load_large_img(settings.filename);
    };
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
    file_info.frame = event.currentTarget.value;
    this.get_img_info(this.viewer_frame, new_frame);
    
};
Toyz.Viewer.Contents.prototype.change_viewer_frame = function(new_frame){
    var options = [];
    this.viewer_frame = new_frame;
    for(var i=0; i<this.frames.length; i++){
        options.push(i);
    };
    var values = {
        conditions:{}, 
        input_viewer_frame: {
            options: options,
            value: new_frame
        }
    };
    if(this.frames[this.viewer_frame].hasOwnProperty('file_info')){
        values.input_frame = {
            options: Object.keys(this.frames[new_frame].file_info.images),
            value: this.frames[new_frame].file_info.frame
        };
    }
    //console.log('values', values);
    this.ctrl_panel.gui.setParams(this.ctrl_panel.gui.params, values, false);
    this.$tile_div.empty();
    if(this.frames[this.viewer_frame].hasOwnProperty('$viewer')){
        var file_info = this.frames[this.viewer_frame].file_info;
        var img_info = file_info.images[file_info.frame];
        this.$tile_div.append(this.frames[this.viewer_frame].$viewer);
        this.$tile_div.scrollTop(img_info.viewer.top);
        this.$tile_div.scrollLeft(img_info.viewer.left);
    };
}
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
Toyz.Viewer.Contents.prototype.press_zoom = function(direction, $scale){
    var index = this.get_scale_index($scale.val());
    if(direction=='in'){
        $scale.val(index.next);
    }else if(direction=='out'){
        $scale.val(index.previous);
    }else{
        alert("ERROR: unexpected zoom direction, please check your code");
    };
    this.set_scale($scale.val());
};
Toyz.Viewer.Contents.prototype.set_scale = function(scale){
    var file_info = this.frames[this.viewer_frame].file_info;
    var old_scale = file_info.images[file_info.frame].viewer.scale;
    this.frames[this.viewer_frame].$viewer.empty();
    file_info.images[file_info.frame].viewer.x_center = 
        scale/old_scale*file_info.images[file_info.frame].viewer.x_center;
    file_info.images[file_info.frame].viewer.y_center = 
        scale/old_scale*file_info.images[file_info.frame].viewer.y_center;
    file_info.images[file_info.frame].viewer.scale = Number(scale);
    this.get_img_info(this.viewer_frame, file_info.frame);
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
        console.log('rect style', style);
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