// API for Image Viewers
// Copyright 2015 by Fred Moolekamp
// License: LGPLv3
Toyz.namespace('Toyz.Viewer');

Toyz.Core.set_debugger(['viewer']);

// Some API's require other dependencies to be loaed
Toyz.Viewer.dependencies_loaded = function(){
    return true;
};

Toyz.Viewer.scales = [-1,0.1,0.25,0.5,1,2,4,8,16,32,64];

Toyz.Viewer.load_dependencies = function(callback){
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

Toyz.Viewer.Controls = function(options){
    // Image controls
    this.load_img = {
        input_class: 'viewer-ctrl-button viewer-ctrl-img-btn',
        func: {
            click: function(){
                this.file_dialog.$div.dialog('open');
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'load image',
            src: "/static/web/static/button_icons/newfile.png"
        },
    };
    this.first_frame = {
        input_class: 'viewer-ctrl-button viewer-ctrl-img-btn',
        func: {
            click: function(){
                var file_info = this.frames[this.viewer_frame].file_info;
                var all_frames = Object.keys(file_info.images);
                if(file_info.frame != all_frames[0]){
                    this.change_file_frame(all_frames[0]);
                };
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'skip to first image frame',
            src: '/static/web/static/button_icons/first.png'
        },
    };
    this.previous_frame = {
        input_class: 'viewer-ctrl-button viewer-ctrl-img-btn',
        func: {
            click: function(){
                var file_info = this.frames[this.viewer_frame].file_info;
                var all_frames = Object.keys(file_info.images);
                var frame = file_info.frame;
                if(all_frames.indexOf(frame)>0){
                    frame = all_frames[all_frames.indexOf(frame)-1];
                    this.change_file_frame(frame);
                };
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'go back one frame',
            src: '/static/web/static/button_icons/previous.png'
        },
    };
    this.input_frame = {
        type: 'select',
        options: [],
        input_class: 'viewer-ctrl-img-btn viewer-ctrl-select',
        func: {
            change: function(event){
                if(event.currentTarget.value != this.frames[this.viewer_frame].file_info.frame){
                    this.change_file_frame(event.currentTarget.value);
                }
            }.bind(options.parent)
        },
        events: {
            rx_img: function(event){
                var ctrl = this.ctrl_panel.gui.params;
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
            }.bind(options.parent),
            update_viewer: function(event){
                var ctrl = this.ctrl_panel.gui.params;
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
            }.bind(options.parent),
        }
    };
    this.next_frame = {
        input_class: 'viewer-ctrl-button viewer-ctrl-img-btn',
        func: {
            click: function(){
                var file_info = this.frames[this.viewer_frame].file_info;
                var all_frames = Object.keys(file_info.images);
                var frame = file_info.frame;
                if(all_frames.indexOf(frame)<all_frames.length-1){
                    frame = all_frames[all_frames.indexOf(frame)+1];
                    this.change_file_frame(frame);
                };
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'go to next frame',
            src: '/static/web/static/button_icons/next.png'
        },
    };
    this.last_frame = {
        input_class: 'viewer-ctrl-button viewer-ctrl-img-btn',
        func: {
            click: function(){
                var file_info = this.frames[this.viewer_frame].file_info;
                var all_frames = Object.keys(file_info.images);
                if(file_info.frame != all_frames[all_frames.length-1]){
                    this.change_file_frame(all_frames[all_frames.length-1]);
                };
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'skip to last image frame',
            src: '/static/web/static/button_icons/last.png'
        },
    };
    // Zoom controls
    this.zoom_input = {
        input_class: 'viewer-ctrl-zoom-btn viewer-ctrl-input',
        prop: {
            type: 'Number'
        },
        func: {
            change: function(event){
                var file_info = this.frames[this.viewer_frame].file_info;
                if(event.currentTarget.value!=file_info.images[file_info.frame].viewer.scale){
                    this.set_scale(this.viewer_frame, event.currentTarget.value);
                };
            }.bind(options.parent)
        },
        events: {
            update_viewer: function(event){
                var ctrl = this.ctrl_panel.gui.params;
                if((event.updates.hasOwnProperty('scale') ||
                    event.updates.hasOwnProperty('file_frame') ||
                    event.updates.hasOwnProperty('viewer_frame')) &&
                    !(event.file_info===undefined) &&
                    !(event.file_info.images[event.file_info.frame].viewer===undefined)
                ){
                    var val = event.file_info.images[event.file_info.frame].viewer.scale;
                    ctrl.zoom_input.$input.val(Math.round(val*10000)/10000);
                };
            }.bind(options.parent),
            rx_img: function(event){
                var ctrl = this.ctrl_panel.gui.params;
                var file_info = this.frames[this.viewer_frame].file_info;
                if(this.viewer_frame==event.viewer_frame && file_info.frame==event.file_frame){
                    var val = file_info.images[file_info.frame].viewer.scale;
                    ctrl.zoom_input.$input.val(Math.round(val*10000)/10000);
                };
            }.bind(options.parent)
        }
    };
    this.zoom_out = {
        input_class: 'viewer-ctrl-button viewer-ctrl-zoom-btn',
        func: {
            click: function(event){
                var zoom_input = this.ctrl_panel.gui.params.zoom_input;
                this.press_zoom(this.viewer_frame, 'out', zoom_input.$input);
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'zoom out',
            src: '/static/web/static/button_icons/zoom_out.png'
        },
    };
    this.zoom_in = {
        input_class: 'viewer-ctrl-button viewer-ctrl-zoom-btn',
        func: {
            click: function(event){
                var zoom_input = this.ctrl_panel.gui.params.zoom_input;
                this.press_zoom(this.viewer_frame, 'in', zoom_input.$input);
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'zoom in',
            src: '/static/web/static/button_icons/zoom_in.png'
        }
    };
    this.zoom_bestfit = {
        input_class: 'viewer-ctrl-button viewer-ctrl-zoom-btn',
        func: {
            click: function(){
                var file_info = this.frames[this.viewer_frame].file_info;
                var img_info = file_info.images[file_info.frame];
                x_scale = img_info.viewer.width/img_info.width*.97;
                y_scale = img_info.viewer.height/img_info.height*.97
                this.set_scale(this.viewer_frame, Math.min(y_scale, x_scale));
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'fit entire image in frame',
            src: '/static/web/static/button_icons/bestfit.png'
        },
    };
    this.zoom_fullsize = {
        input_class: 'viewer-ctrl-button viewer-ctrl-zoom-btn',
        func: {
            click: function(){
                this.set_scale(this.viewer_frame, 1);
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'zoom to 100%',
            src: '/static/web/static/button_icons/fullsize.png'
        },
    };
    // Viewer controls
    this.add_viewer_frame = {
        input_class: 'viewer-ctrl-button viewer-ctrl-viewer-btn',
        func: {
            click: function(){
                var ctrl = this.ctrl_panel.gui.params;
                this.frames.push({});
                this.viewer_frame=this.frames.length-1;
                $opt = $('<option/>')
                    .html(this.viewer_frame)
                    .val(this.viewer_frame);
                ctrl.input_viewer_frame.$input.append($opt);
                this.change_viewer_frame(this.viewer_frame);
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'add a frame to the viewer',
            src: '/static/web/static/button_icons/add_frame.png'
        },
    };
    this.remove_viewer_frame = {
        input_class: 'viewer-ctrl-button viewer-ctrl-viewer-btn',
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
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'remove the current frame from the viewer',
            src: '/static/web/static/button_icons/delete_frame.png'
        },
    };
    this.first_viewer_frame = {
        input_class: 'viewer-ctrl-button viewer-ctrl-viewer-btn',
        func: {
            click: function(){
                if(this.viewer_frame!=0){
                    this.change_viewer_frame(0);
                };
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'skip to first viewer frame',
            src: '/static/web/static/button_icons/first.png'
        },
    };
    this.previous_viewer_frame = {
        input_class: 'viewer-ctrl-button viewer-ctrl-viewer-btn',
        func: {
            click: function(){
                if(this.viewer_frame>0){
                    this.change_viewer_frame(this.viewer_frame-1);
                }else{
                    this.change_viewer_frame(this.frames.length-1);
                }
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'go to previous viewer frame',
            src: '/static/web/static/button_icons/previous.png'
        },
    };
    this.input_viewer_frame = {
        type: 'select',
        options: [0],
        input_class: 'viewer-ctrl-viewer-btn viewer-ctrl-select',
        func: {
            change: function(event){
                if(event.currentTarget.value != this.viewer_frame){
                    this.change_viewer_frame(event.currentTarget.value);
                };
            }.bind(options.parent)
        },
        events: {
            update_viewer: function(event){
                var ctrl = this.ctrl_panel.gui.params;
                if(event.updates.hasOwnProperty('viewer_frame')){
                    ctrl.input_viewer_frame.$input.val(event.updates.viewer_frame);
                };
            }.bind(options.parent)
        }
    };
    this.next_viewer_frame = {
        input_class: 'viewer-ctrl-button viewer-ctrl-viewer-btn',
        func: {
            click: function(){
                if(this.viewer_frame<this.frames.length-1){
                    this.change_viewer_frame(this.viewer_frame+1);
                }else{
                    this.change_viewer_frame(0);
                };
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'go to next viewer frame',
            src: '/static/web/static/button_icons/next.png'
        },
    };
    this.last_viewer_frame = {
        input_class: 'viewer-ctrl-button viewer-ctrl-viewer-btn',
        func: {
            click: function(){
                if(this.viewer_frame != this.frames.length-1){
                    this.change_viewer_frame(this.frames.length-1);
                };
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'skip to last viewer frame',
            src: '/static/web/static/button_icons/last.png'
        },
    };
    // Tool controls
    this.rect = {
        input_class: 'viewer-ctrl-button viewer-ctrl-tools-btn',
        func: {
            click: function(event){
                this.change_active_tool('rect', event.currentTarget);
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'select rectangle to zoom',
            src: '/static/web/static/button_icons/rectangle.png'
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
            }.bind(options.parent),
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
            }.bind(options.parent),
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
            }.bind(options.parent)
        }
    };
    this.center = {
        input_class: 'viewer-ctrl-button viewer-ctrl-tools-btn',
        func: {
            click: function(event){
                this.change_active_tool('center', event.currentTarget);
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'center image on click',
            src: '/static/web/static/button_icons/center.png'
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
            }.bind(options.parent)
        }
    };
    this.colormap = {
        input_class: 'viewer-ctrl-button viewer-ctrl-tools-btn',
        prop:{
            type: 'image',
            title: 'open colormap editor',
            src: '/static/web/static/button_icons/colormap.png'
        },
        func:{
            click: function(event) {
                this.change_active_tool('surface', event.currentTarget);
                var file_info = $.extend(true, {}, this.frames[this.viewer_frame].file_info);
                var img_info = $.extend(true, {}, file_info.images[file_info.frame]);
                delete file_info.images;
                var x = img_info.viewer.x_center/img_info.viewer.scale;
                var y = img_info.viewer.y_center/img_info.viewer.scale;
                if(img_info.invert_x===true){
                    x = img_info.width-x;
                };
                if(img_info.invert_y===true){
                    y = img_info.height-y;
                }
                var params = {
                    data_type: 'data',
                    file_info: file_info,
                    img_info: img_info,
                    x: x,
                    y: y,
                    width: 400,
                    height: 200,
                    scale: true
                };
                websocket.send_task({
                    task: {
                        module: 'toyz.web.tasks',
                        task: 'get_img_data',
                        parameters: params
                    },
                    callback: function(options, params, result){
                        if(!this.workspace.hasOwnProperty('colorpad')){
                            this.workspace.colorpad = new Toyz.Viewer.Colorpad({
                                img_info: params.img_info,
                                data: result.data,
                                width: result.data[0].length,
                                height: result.data.length,
                                colorpad: {
                                    set: function(colormap) {
                                        var file_info = this.frames[this.viewer_frame].file_info;
                                        file_info.colormap = colormap;
                                        // Change the colormap for all frames, and 
                                        // clear the dict of loaded tiles
                                        for(var i in file_info.images){
                                            file_info.images[i].colormap = colormap;
                                            delete file_info.images[i].tiles;
                                        };

                                        this.get_img_info(this.viewer_frame, file_info.frame);
                                    }.bind(options.parent)
                                }
                            });
                        }else{
                            var file_info = 
                                options.parent.frames[options.parent.viewer_frame].file_info;
                                this.workspace.colorpad.$div.dialog('open');
                            this.workspace.colorpad.update({
                                colormap: file_info.images[file_info.frame].colormap,
                                img_info: file_info.images[file_info.frame],
                                data: result.data
                            });
                        };
                    }.bind(this, options, params)
                });
            }.bind(options.parent)
        }
    },
    // Image Info
    this.img_coords = {
        type: 'lbl',
        lbl: 'Coordinates: ',
        input_class: 'viewer-ctrl-info-btn viewer-ctrl-info-coord-div',
        events: {
            mousemove: function(event){
                var ctrls = this.ctrl_panel.gui.params;
                var $input = ctrls.img_coords.$input;
                var file_info = this.frames[this.viewer_frame].file_info;
                if(!(file_info===undefined) && file_info.hasOwnProperty('frame') &&
                    file_info.images[file_info.frame].hasOwnProperty('height')
                ){
                    var img_info = file_info.images[file_info.frame];
                    var xy = this.extract_coords(event, img_info);
                    var x = xy[0];
                    var y = xy[1];
                    var coords = 
                        (Math.round(x/img_info.scale*10)/10).toString()+','
                        +(Math.round(y/img_info.scale*10)/10).toString();
                    $input.text(coords);
                };
            }.bind(options.parent)
        }
    };
    this.pixel_val = {
        type: 'lbl',
        lbl: 'Pixel Value: ',
        input_class: 'viewer-ctrl-info-btn',
        pixel_timeout: undefined,
        events: {
            rx_datapoint: function(result){
                this.ctrl_panel.gui.params.pixel_val.$input.text(result.px_value)
            }.bind(options.parent)
        }
    };
    for(var ctrl in options.custom){
        this[ctrl] = options.custom[ctrl];
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
            },
            invert_x: {
                lbl: 'invert x axis',
                prop: {
                    type: 'checkbox',
                    checked: false
                }
            },
            invert_y: {
                lbl: 'invert y axis',
                prop: {
                    type: 'checkbox',
                    checked: false
                }
            }
        }
    };
    this.gui = new Toyz.Gui.Gui({
        params: gui,
        $parent: this.$div
    });
    
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
                var file_info = this.gui.get();
                console.log('file info to load', file_info);
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
    //In case an object is inheriting Toyz.Viewer.Contents, if there are no initial
    // params then return
    if(params===undefined){
        return;
    };
    this.type = 'viewer';
    this.tile = params.tile;
    this.$tile_div = params.$tile_div;
    this.$tile_div
        .removeClass('context-menu-tile')
        .addClass('context-menu-viewer')
        .addClass('viewer-main-div');
    this.$tile_div.width(this.tile.$div.width());
    this.$tile_div.height(this.tile.$div.height());
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
        this.onmousemove(event);
    }.bind(this));
    
    // Mouseup functions
    this.$tile_div.mouseup(function(event){
        this.mousedown = false;
        for(var i=0; i<this.events.mouseup.length; i++){
            this.events.mouseup[i](event);
        };
    }.bind(this));
    
    // Use default control panel unless another is specified
    if(!params.hasOwnProperty('groups')){
        params.groups = {
            Image: ['load_img', 'first_frame', 'previous_frame', 
                'input_frame', 'next_frame', 'last_frame'],
            Viewer: ['add_viewer_frame', 'remove_viewer_frame', 'first_viewer_frame',
                'previous_viewer_frame', 'input_viewer_frame', 'next_viewer_frame',
                'last_viewer_frame'],
            Zoom: ['zoom_out', 'zoom_in', 'zoom_bestfit', 'zoom_fullsize', 'zoom_input'],
            Tools: ['rect', 'center', 'colormap'],
            'Image Info': ['img_coords', 'pixel_val']
        };
    };
    // Setup variables used by different tools
    this.tools = {active_tool: ''};
    for(var i=0; i<params.groups.Tools.length; i++){
        this.tools[params.groups.Tools[i]] = {};
    };
    
    // Create control panel and bind any events to the viewer
    var ctrl = this.init_controls({
        groups: params.groups,
        controls: params.controls
    });
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
            this.get_img_info(viewer_frame, file_info.frame);
        }else if(updates.hasOwnProperty('position')){
            this.get_tile_map(viewer_frame, file_info.frame);
        };
    };
};
Toyz.Viewer.Contents.prototype.set_tile = function(settings){
    console.log('settings', settings);
    this.frames = [];
    var add_viewer_frame = this.ctrl_panel.gui.params['add_viewer_frame'];
    var input_viewer_frame = this.ctrl_panel.gui.params['input_viewer_frame'];
    input_viewer_frame.$input.empty();
    for(var i=0;i<settings.frames.length; i++){
        add_viewer_frame.$input.click();
        var file_info = settings.frames[i].file_info;
        this.load_img({
            file_info: file_info,
            img_info: file_info.images[file_info.frame]
        }, i);
    };
    this.change_viewer_frame(settings.viewer_frame);
};
Toyz.Viewer.Contents.prototype.rx_info = function(options){
};
Toyz.Viewer.Contents.prototype.save = function(){
    var frames = [];
    for(var i=0; i<this.frames.length; i++){
        var file_info = $.extend(true, {}, this.frames[i].file_info);
        var img_info = file_info.images[file_info.frame];
        img_info.tiles = {};
        if(img_info.hasOwnProperty('$img')){
            delete img_info.$img;
        };
        frames[i] = {
            file_info: file_info
        };
    };
    var tile = {
        type: this.type,
        settings: {
            viewer_frame: this.viewer_frame,
            frames: frames
        }
    };
    console.log('save tile', tile)
    return tile;
};
Toyz.Viewer.Contents.prototype.set_window = function(
        viewer_frame, viewer_left, viewer_top){
    var file_info = this.frames[viewer_frame].file_info;
    //console.log('set window viewer frame', viewer_frame);
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
Toyz.Viewer.Contents.prototype.load_img = function(settings, viewer_frame){
    //console.log('viewer frame in load_img', viewer_frame);
    //console.log('loading image', settings);
    if(settings.file_info.img_type=='img'){
        //console.log('single image');
        if(!settings.file_info.hasOwnProperty('images') ||
            !settings.file_info.images['0'].hasOwnProperty('viewer')
        ){
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
        }
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
        websocket.send_task({
            task: {
                module: 'toyz.web.tasks',
                task: 'get_file_info',
                parameters: {
                    file_info: settings.file_info,
                    img_info: settings.img_info
                }
            },
            callback: function(viewer_frame, result){
                //console.log('file info', result.file_info);
                this.frames[viewer_frame].file_info = result.file_info;
                var img_info = result.file_info.images[result.file_info.frame];
                this.frames[viewer_frame].$viewer = $('<div/>').addClass('viewer-div');
                if(viewer_frame==this.viewer_frame){
                    this.$tile_div.empty();
                    this.$tile_div.append(this.frames[viewer_frame].$viewer);
                };
                this.frames[viewer_frame].$viewer.width(img_info.scaled_width);
                this.frames[viewer_frame].$viewer.height(img_info.scaled_height);
                this.rx_img_info(viewer_frame, result.file_info.frame, img_info);
                this.get_img_tiles(viewer_frame, result.file_info.frame, result.new_tiles);
            }.bind(this, viewer_frame)
        })
    }else{
        alert('Image type is not supported yet');
    }
};
Toyz.Viewer.Contents.prototype.get_img_info = function(viewer_frame, file_frame){
    //console.log('viewer frame in get_img_info', viewer_frame);
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
    //console.log('img_info', img_info);
    websocket.send_task({
        task: {
            module: 'toyz.web.tasks',
            task: 'get_img_info',
            parameters: {
                file_info: file_info,
                img_info: img_info
            }
        },
        callback: function(viewer_frame, result){
            var file_info = this.frames[viewer_frame].file_info;
            file_info.frame = result.img_info.frame;
            file_info.images[file_info.frame] = result.img_info;
            if(!(this.frames[viewer_frame].hasOwnProperty('$viewer'))){
                this.frames[viewer_frame].$viewer = $('<div/>').addClass('viewer-div');
            };
            if(this.viewer_frame==viewer_frame){
                //this.$tile_div.empty();
                this.$tile_div.append(this.frames[viewer_frame].$viewer);
            };
            this.frames[viewer_frame].$viewer.width(result.img_info.scaled_width);
            this.frames[viewer_frame].$viewer.height(result.img_info.scaled_height);
            this.rx_img_info(viewer_frame, file_info.frame, result.img_info);
            this.get_img_tiles(viewer_frame, file_info.frame, result.new_tiles);
        }.bind(this, viewer_frame)
    });
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
    //console.log('viewer frame in get_tile_map', viewer_frame,file_info);
    delete file_info['images'];
    websocket.send_task({
        task: {
            module: 'toyz.web.tasks',
            task: 'get_tile_info',
            parameters: {
                file_info: file_info,
                img_info: this.frames[viewer_frame].file_info.images[file_frame]
            }
        },
        callback: function(viewer_frame, file_frame, result){
            this.frames[viewer_frame].file_info.images[file_frame].tiles = $.extend(
                true, 
                this.frames[viewer_frame].file_info.images[file_frame].tiles,
                result.new_tiles
            );
            this.get_img_tiles(viewer_frame, file_frame, result.new_tiles)
        }.bind(this, viewer_frame, file_frame)
    });
};
Toyz.Viewer.Contents.prototype.get_img_tiles = function(viewer_frame, file_frame, tiles){
    var file_info = $.extend(true, {}, this.frames[viewer_frame].file_info);
    //console.log('viewer frame in get_img_tiles', viewer_frame, file_info);
    var img_info = file_info.images[file_frame];
    // No need to send a large json object with unnecessary data
    delete file_info['images'];
    delete img_info['tiles'];
    
    if(this.viewer_frame==viewer_frame){
        //console.log('scrolling in img_tiles');
        this.$tile_div.scrollTop(img_info.viewer.top);
        this.$tile_div.scrollLeft(img_info.viewer.left);
    };
    
    for(var tile_idx in tiles){
        if(tiles.hasOwnProperty(tile_idx)){
            //console.log('tile', tiles[tile_idx]);
            websocket.send_task({
                task: {
                    module: 'toyz.web.tasks',
                    task: 'get_img_tile',
                    parameters: {
                        file_info: file_info,
                        img_info: img_info,
                        tile_info: tiles[tile_idx]
                    }
                },
                callback: this.rx_tile_info.bind(this, viewer_frame, file_frame, tile_idx)
            });
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
Toyz.Viewer.Contents.prototype.onmousemove = function(event){
    // Update the pixel value every 200ms
    var ctrl = this.ctrl_panel.gui.params;
    clearTimeout(this.mousemove_timeout);
    this.mousemove_timeout = setTimeout(function(event){
        this.mousemove_timeout = undefined;
        var file_info = this.frames[this.viewer_frame].file_info;
        if(file_info!==undefined && file_info.file_type=='img_array'){
            var img_info = file_info.images[file_info.frame];
            var xy = this.extract_coords(event, img_info);
            var x = Math.round(xy[0]/img_info.scale);
            var y = Math.round(xy[1]/img_info.scale);
            websocket.send_task({
                task: {
                    module: 'toyz.web.tasks',
                    task: 'get_img_data',
                    parameters: {
                        data_type: 'datapoint',
                        file_info: file_info,
                        img_info: img_info,
                        x: x,
                        y: y
                    }
                },
                callback: function(result){
                    this.rx_datapoint(result);
                }.bind(this)
            });
        };
    }.bind(this, event), 100);
};
Toyz.Viewer.Contents.prototype.rx_datapoint = function(result){
    for(var i=0; i<this.events.rx_datapoint.length; i++){
        this.events.rx_datapoint[i](result);
    };
};

Toyz.Viewer.Contents.prototype.init_controls = function(options){
    options = $.extend(true, {
        controls: {}
    }, options);
    var controls = new Toyz.Viewer.Controls({
        parent: this, 
        custom: options.controls
    });
    var gui = {
        type: 'div',
        params: {}
    };
    for(var div in options.groups){
        //console.log('group', div);
        var this_div = {
            type: 'div',
            legend: div,
            params: {}
        };
        for(var i=0; i<options.groups[div].length; i++){
            //console.log('control:', options.groups[div][i]);
            this_div.params[options.groups[div][i]] = controls[options.groups[div][i]];
        };
        gui.params[div] = this_div;
    };
    //console.log('controls', controls);
    //console.log('gui', gui);
    var $div = $('<div/>');
    gui = new Toyz.Gui.Gui({
        params: gui,
        $parent: $div
    });
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
    var viewer_frame = this.viewer_frame;
    var file_info = this.frames[viewer_frame].file_info;
    this.frames[viewer_frame].$viewer.empty();
    file_info.frame = new_frame;
    this.update(viewer_frame, 'file_frame', file_info.frame);
};
Toyz.Viewer.Contents.prototype.change_viewer_frame = function(new_frame){
    var options = [];
    this.viewer_frame = new_frame;
    this.$tile_div.empty();
    if(this.frames[new_frame].hasOwnProperty('$viewer')){
        var file_info = this.frames[new_frame].file_info;
        this.$tile_div.append(this.frames[new_frame].$viewer);
        if(file_info.hasOwnProperty('images')){
            //console.log('changing viewer frame', this.viewer_frame, new_frame);
            var img_info = file_info.images[file_info.frame];
            this.$tile_div.scrollTop(img_info.viewer.top);
            this.$tile_div.scrollLeft(img_info.viewer.left);
        };
    };
    this.update(new_frame, 'viewer_frame', new_frame);
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
    
    var old_scale = file_info.images[file_info.frame].viewer.scale;
    img_info.viewer.x_center = scale/old_scale*img_info.viewer.x_center;
    img_info.viewer.y_center = scale/old_scale*img_info.viewer.y_center;
    img_info.viewer.scale = Number(scale);
    
    if(file_info.img_type == 'img'){
        var $scaled_img = img_info.$img.clone();
        img_info.scale = img_info.viewer.scale;
        $scaled_img.css({
            width: $scaled_img[0].width*scale,
            height: $scaled_img[0].height*scale
        });
        this.frames[viewer_frame].$viewer.append($scaled_img);
        if(this.viewer_frame==viewer_frame){
            //console.log('scrolling in set scale');
            this.$tile_div.scrollLeft(img_info.viewer.x_center-img_info.viewer.width/2);
            this.$tile_div.scrollTop(img_info.viewer.y_center-img_info.viewer.height/2);
        };
    }else if(file_info.img_type=='large_img'){
        img_info.tiles = {};
    };
    this.update(viewer_frame, 'scale', img_info.viewer.scale);
};
Toyz.Viewer.Contents.prototype.extract_coords = function(event, img_info){
    if(typeof event.offsetX === "undefined" || 
        typeof event.offsetY === "undefined"
    ) {
       var targetOffset = $(event.target).offset();
       event.offsetX = event.pageX - targetOffset.left;
       event.offsetY = event.pageY - targetOffset.top;
    };
    var x = event.target.offsetLeft+event.offsetX;
    var y = event.target.offsetTop+event.offsetY;
    var xy = this.get_coords(x, y, img_info);
    return xy;
}
Toyz.Viewer.Contents.prototype.get_coords = function(x, y, img_info){
    if(img_info.invert_y===true){
        y = img_info.height*img_info.scale-y;
    };
    if(img_info.invert_x===true){
        x = img_info.width*img_info.scale-x;
    };
    return [x,y];
};
Toyz.Viewer.Contents.prototype.get_viewer_coords = function(x, y, img_info){
    y = y*img_info.scale;
    x = x*img_info.scale;
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
};
Toyz.Viewer.DrawingTools = {
    draw_circle: function($div, x, y, radius, options){
        options = $.extend(true, {
            css: {
                border: "1px solid red",
                width: 2*radius,
                height: 2*radius,
                left: x+'px',
                top: y+'px',
                'border-radius': '50%',
                position: 'absolute',
            },
            classes: []
        }, options);
        var $circle = $('<div/>')
            .addClass('viewer-circle-div')
            .css(options.css);
        for(var cls in options.classes){
            $circle.addClass(cls);
        };
        $div.append($circle);
        return $circle;
    },
    // Allow the user to specify classes to attach to the rectangle
    draw_rect: function($div, x, y, width, height, options){
        options = $.extend(true, {
            css: {
                border: "2px solid red",
                width: width,
                height: height,
                left: x+'px',
                top: y+'px',
                position: 'absolute'
            },
            classes: []
        }, options);
        var $rect = $('<div/>')
            .addClass('viewer-rect-div')
            .css(options.css);
        for(var cls in options.classes){
            $rect.addClass(cls);
        };
        $div.append($rect);
        return $rect;
    }
};
// Map a pixel on a 1D canvas context imageData array
Toyz.Viewer.set_pixel = function(image_data, x, y, r, g, b, a){
    index = (x+y*image_data.width)*4;
    image_data.data[index+0] = r;
    image_data.data[index+1] = g;
    image_data.data[index+2] = b;
    image_data.data[index+3] = a;
};
// Map a 2D image to a canvas context imageData object
Toyz.Viewer.map_image=function(image, ctx, img_info){
    var image_data = ctx.createImageData(image[0].length, image.length);
    var cmap = Toyz.Viewer.Colormaps[img_info.colormap.name].slice(0,
                Toyz.Viewer.Colormaps[img_info.colormap.name].length);
    if(img_info.colormap.invert_color===true){
        cmap = Toyz.Viewer.Colormaps[img_info.colormap.name+'_r'].slice(0,
                    Toyz.Viewer.Colormaps[img_info.colormap.name+'_r'].length);
    };
    
    for(var i=0;i<image.length;i++){
        for(var j=0; j<image[i].length; j++){
            var rgb;
            var rgb_idx;
            var x = j;
            var y = i;
            var pixel = image[i][j];
            // invert image if necessary
            if(img_info.invert_x){
                x = image[i].length-j;
            };
            if(img_info.invert_y){
                y = image.length-i;
            };
            if(pixel<=img_info.colormap.px_min){
                rgb_idx = 0
            }else if(pixel>=img_info.colormap.px_max){
                rgb_idx = 255
            }else{
                if(img_info.colormap.color_scale=='linear'){
                    var linearmap = 255/(img_info.colormap.px_max-img_info.colormap.px_min);
                    rgb_idx = Math.round(linearmap*(pixel-img_info.colormap.px_min));
                }else if(img_info.colormap.color_scale=='log'){
                    var shift = 1 - img_info.colormap.px_min;
                    var logscale = 255/Toyz.Core.log10(img_info.colormap.px_max+shift)
                    var rgb_idx = Math.round(Toyz.Core.log10(pixel+shift)* logscale);
                }else{
                    throw Error("Unrecognized colormap scale!")
                };
            };
            // in case of a rounding error in the mapping
            if(rgb_idx<0){
                rgb_idx = 0;
            }else if(rgb>255){
                rgb_idx = 255;
            };
            rgb = cmap[rgb_idx];
            Toyz.Viewer.set_pixel(image_data , x ,y , rgb[0], rgb[1], rgb[2], 255);
        }
    };
    return image_data;
};

Toyz.Viewer.Colorbar = function(options){
    this.type = 'custom';
    if(!options.hasOwnProperty('img_info')){
        throw Error("img_info required to create a colorbar")
    };
    if(!options.hasOwnProperty('width')){
        options.width = 400;
    };
    if(!options.hasOwnProperty('height')){
        options.height = 200;
    };
    this.$canvas = $('<canvas/>').prop({
        width: options.width,
        height: options.height
    });
    this.image = [];
    for(var opt in options){
        this[opt] = options[opt];
    };
    this.xmin = this.img_info.colormap.px_min;
    this.xmax = this.img_info.colormap.px_max;
    this.$div = $('<div/>').append(this.$canvas);
};
Toyz.Viewer.Colorbar.prototype.build = function(){
    this.image = [];
    for(var i=0; i<this.$canvas[0].height; i++){
        this.image.push([]);
        for(var j=0; j<this.$canvas[0].width; j++){
            this.image[i].push(0);
        };
    };
    for(var j=0; j<this.$canvas[0].width; j++){
        var pixel_bar = Math.round(this.xmin+j*(this.xmax-this.xmin)/this.$canvas[0].width);
        if(j<100){
            //console.log('pixel_bar', pixel_bar, j, this.xmin, this.xmax, this.$canvas[0].width);
        };
        for(var i=0;i<this.$canvas[0].height;i++){
            this.image[i][j] = pixel_bar;
        };
    };
};
Toyz.Viewer.Colorbar.prototype.set = function(values, options){
    //console.log('colorbar values', values);
    for(var v in values){
        this[v] = values[v];
    };
    var ctx = this.$canvas[0].getContext('2d');
    this.build();
    var img_data = Toyz.Viewer.map_image(
        this.image, 
        ctx, 
        this.img_info
    );
    ctx.putImageData(img_data, 0, 0);
};
Toyz.Viewer.Colorbar.prototype.get = function(){return undefined};

Toyz.Viewer.ColormapDialog = function(options){
    options = $.extend(true, {
        width: 255,
        height: 20,
        set: function(){alert("You haven't created a 'set' function yet")}
    }, options);
    this.$div = $('<div/>');
    this.set = options.set;
    for(var cmap in Toyz.Viewer.Colormaps){
        if(cmap.substr(cmap.length-2,2)!='_r'){
            var colorbar = new Toyz.Viewer.Colorbar({
                width: options.width,
                height: options.height,
                img_info: {
                    colormap: {
                        name: cmap,
                        px_min: 0,
                        px_max: 255,
                        color_scale: 'linear',
                        invert_color: false
                    }
                }
            });
            colorbar.set({});
            var $radio = $('<input/>')
                .prop({
                    type: 'radio',
                    value: cmap,
                    name: 'colormap_dialog'
                })
                .css('display','inline-block');
            var $lbl = $('<label/>')
                .text(cmap)
                .css({
                    display: 'inline-block',
                    'margin-left': 4,
                    'margin-right': 4
                });
            var $div = $('<div/>').css('clear', 'both');
            $div.append($radio)
                .append($lbl)
                .append(colorbar.$canvas.css('display', 'inline-block'));
            this.$div.append($div);
        };
    };
    
    this.$div.dialog({
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: true,
        width: 'auto',
        title: 'Colormaps',
        maxHeight: $(window).height(),
        position: {
            my: "left top",
            at: "left top",
            of: window
        },
        buttons: {
            Select: function(){
                var cmap = $('input[name="colormap_dialog"]:checked').val();
                this.set(cmap);
            }.bind(this),
            Cancel: function(){
                this.$div.dialog('close');
            }.bind(this)
        }
    }).css("font-size", "12px");
};

Toyz.Viewer.Colorpad = function(options){
    this.$div = $('<div/>');
    // set default options
    options = $.extend(true, {
        width: 600,
        height: 400,
        img_info: {
            colormap: {
                name: 'Spectral',
                px_min: 0,
                px_max: 10,
                color_scale: 'linear',
                invert_color: false
            }
        }
    },options);
    this.width = options.width;
    this.height = options.height;
    this.img_info = $.extend(true,{}, options.img_info);
    this.img_info.colormap.px_min = Math.floor(this.img_info.colormap.px_min);
    this.img_info.colormap.px_max = Math.ceil(this.img_info.colormap.px_max);
    this.set = function(img_info){alert("you never defined the set function")};
    // Set options for colorpad
    for(var opt in options.colorpad){
        this[opt] = options.colorpad[opt];
    };
    // Save the original img_info in case the user wants to reset
    this.original_info = this.img_info;
    // GUI in dialog
    this.gui = this.get_gui($.extend(true, {}, options, {
        $parent: this.$div
    }));
    // Colorpad dialog
    this.$div.dialog($.extend(true, {
        resizable: true,
        draggable: true,
        autoOpen: true,
        modal: false,
        width: 'auto',
        title: 'Colormap',
        maxHeight: $(window).height(),
        position: {
            my: "center top",
            at: "center top",
            of: window
        },
        buttons: {
            Colormap: function(){
                // clear the checked radio box
                $('input[name="colormap_dialog"]:checked').prop('checked', false);
                // check the selected colormap
                $('input[name="colormap_dialog"][value="'+this.img_info.colormap.name+'"]')
                    .prop('checked', true);
                this.colormap_dialog.$div.dialog('open');
            }.bind(this),
            Set: function(){
                console.log('this', this);
                this.set(this.img_info.colormap);
                this.$div.dialog("close");
            }.bind(this),
            Cancel: function(){
                this.$div.dialog("close");
            }.bind(this)
        }
    },options.dialog)).css("font-size", "12px");
    
    Toyz.Core.load_dependencies(
        {
            js: ['/static/web/static/cm.js'],
        },
        function(options){
            // Link the dialog to change the colormap
            this.colormap_dialog = new Toyz.Viewer.ColormapDialog({
                $parent: this.$div,
                set: function(colormap_name){
                    this.update({
                        colormap: {
                            name: colormap_name
                        }
                    });
                    this.colormap_dialog.$div.dialog('close');
                }.bind(this),
            });
            if(options.hasOwnProperty('data')){
                if(!options.hasOwnProperty('img_info')){
                    throw Error("img_info required to initialize image data");
                };
                this.update({
                    data: options.data,
                    img_info: this.img_info
                })
            };
        }.bind(this, options)
    );
    
    console.log('Colorpad', this);
};
Toyz.Viewer.Colorpad.prototype.update = function(update){
    var color_range_update = {};
    var color_slider_update = {};
    var colorbar_update = {};
    var update_colormap = false;
    
    if(update.hasOwnProperty('colormap')){
        if(update.colormap.hasOwnProperty('px_max') || update.colormap.hasOwnProperty('px_min')){
            this.img_info.colormap.set_bounds = true;
        };
        this.img_info.colormap = $.extend(true, {}, this.img_info.colormap, update.colormap);
        this.img_info.colormap.px_min = Math.floor(this.img_info.colormap.px_min);
        this.img_info.colormap.px_max = Math.ceil(this.img_info.colormap.px_max);
        if(this.img_info.hasOwnProperty('tiles')){
            delete this.img_info.tiles;
        };
        delete update.img_info;
        update_colormap = true;
    };
    if(update.hasOwnProperty('data')){
        this.data = update.data;
        delete update.data;
    };
    if(update.hasOwnProperty('xmin') || update.hasOwnProperty('xmax')){
        var color_slider = this.gui.params.color_slider;
        var xmin;
        var xmax;
        if(update.hasOwnProperty('xmin')){
            color_slider_update.xmin = update.xmin;
            colorbar_update.xmin = update.xmin;
            color_range_update.min = update.xmin;
            if(update.xmin>this.img_info.colormap.px_min){
                this.img_info.colormap.px_min = update.xmin;
                update_colormap = true;
            };
            xmin = update.xmin;
        }else{
            xmin = color_slider.xmin;
        };
        if(update.hasOwnProperty('xmax')){
            color_slider_update.xmax = update.xmax;
            colorbar_update.xmax = update.xmax;
            color_range_update.max = update.xmax;
            if(update.xmax<this.img_info.colormap.px_max){
                this.img_info.colormap.px_max = update.xmax;
                update_colormap = true;
            };
            xmax = update.xmax;
        }else{
            xmax = color_slider.xmax;
        };
        color_slider_update.ymax = (xmax-xmin)/2;
        this.img_info.colormap.set_bounds = true;
    };
    
    if(update_colormap===true){
        colorbar_update.img_info = this.img_info;
        // Store color_range values
        color_range_update.values = [
            this.img_info.colormap.px_min, 
            this.img_info.colormap.px_max
        ];
        // Calculate color_slider values
        var color_slider = this.gui.params.color_slider;
        color_slider_update = $.extend(true, color_slider_update, {
            x_value: (this.img_info.colormap.px_max+this.img_info.colormap.px_min)/2 
                            - color_slider.xmin,
            y_value: (this.img_info.colormap.px_max-this.img_info.colormap.px_min)/2
        });
        update.px_min = this.img_info.colormap.px_min;
        update.px_max = this.img_info.colormap.px_max;
    };
    
    // All current updates will cause the background image to change
    color_slider_update.background = Toyz.Viewer.map_image(
        this.data, 
        this.gui.params.color_slider.$canvas[0].getContext('2d'),
        this.img_info
    );
    
    if(Object.keys(color_slider_update).length>0){
        update.color_slider = color_slider_update;
    };
    if(Object.keys(colorbar_update).length>0){
        update.colorbar = colorbar_update;
    };
    if(Object.keys(color_range_update).length>0){
        update.color_range = color_range_update;
    };
    // Update all of the params
    this.gui.set_params({
        values: update,
        change: false
    });
};
Toyz.Viewer.Colorpad.prototype.change_image = function(options){
    if(!options.hasOwnProperty('img_info')){
        throw Error("img_info required to change image in Colorpad");
    };
    this.original_info = options.img_info;
    this.update({img_info: options.img_info});
    if(options.hasOwnProperty('set')){
        this.set = options.set;
    };
};
Toyz.Viewer.Colorpad.prototype.get_gui = function(options){
    if(!options.hasOwnProperty('$parent')){
        throw Error("Must specify a parent element")
    };
    var $parent = options.$parent;
    // Colorbar is the colorbar underneath the slider
    var colorbar = new Toyz.Viewer.Colorbar({
        width: Math.round(options.width),
        height: 20,
        img_info: this.img_info
    });
    var ctrls = {
        type: 'div',
        params: {
            color_slider:{
                type: 'slider2d',
                div_class: 'viewer-colormap-ctrl',
                width: options.width,
                height: options.height,
                xmin: this.img_info.colormap.px_min,
                xmax: this.img_info.colormap.px_max,
                ymin: 0,
                ymax: (this.img_info.colormap.px_max-this.img_info.colormap.px_min)/2,
                x_value: (this.img_info.colormap.px_max+this.img_info.colormap.px_min)/2 
                            - this.img_info.colormap.px_min,
                y_value: (this.img_info.colormap.px_max-this.img_info.colormap.px_min)/2,
                x_name: 'bias',
                y_name: 'contrast',
                onupdate: function(slider2d, params){
                    // If the cursor position was changed by the user, update the rest of the
                    // fields
                    this.update({
                        colormap: {
                            px_min: slider2d.xmin+Math.floor(slider2d.x_value-slider2d.y_value),
                            px_max: slider2d.xmin+Math.ceil(slider2d.x_value+slider2d.y_value)
                        }
                    });
                }.bind(this)
            },
            colorbar: colorbar,
            data_range_div: {
                type: 'div',
                div_class: 'viewer-colormap-ctrl',
                params: {
                    xmin: {
                        prop: {
                            type: 'Number',
                            value: this.img_info.colormap.px_min
                        },
                        div_css: {
                            float: 'left'
                        },
                        func: {
                            change: function(event){
                                this.update({
                                    xmin: Number(event.currentTarget.value)
                                });
                            }.bind(this)
                        }
                    },
                    xmax: {
                        prop: {
                            type: 'Number',
                            value: this.img_info.colormap.px_max
                        },
                        div_css: {
                            float: 'right'
                        },
                        func: {
                            change: function(event){
                                this.update({
                                    xmax: Number(event.currentTarget.value)
                                });
                            }.bind(this)
                        }
                    }
                }
            },
            pixel_div: {
                type: 'div',
                div_class: 'viewer-colormap-ctrl',
                params: {
                    px_min: {
                        lbl: 'Pixels values from',
                        prop: {
                            type: 'Number',
                            value: this.img_info.colormap.px_min
                        },
                        div_css: {
                            float: 'left'
                        },
                        func: {
                            change: function(event){
                                this.update({
                                    colormap: {
                                        px_min: Number(event.currentTarget.value)
                                    }
                                })
                            }.bind(this)
                        }
                    },
                    px_max: {
                        lbl: ' to ',
                        prop: {
                            type: 'Number',
                            value: this.img_info.colormap.px_max
                        },
                        div_css: {
                            float: 'left'
                        },
                        func: {
                            change: function(event){
                                this.update({
                                    colormap: {
                                        px_max: Number(event.currentTarget.value)
                                    }
                                })
                            }.bind(this)
                        }
                    }
                }
            },
            color_range: {
                type: 'slider',
                div_class: 'viewer-colormap-ctrl',
                options: {
                    range: true,
                    min: this.img_info.colormap.px_min,
                    max: this.img_info.colormap.px_max,
                    values: [this.img_info.colormap.px_min, this.img_info.colormap.px_max],
                    slide: function(event, ui){
                        this.update({
                            colormap: {
                                px_min: ui.values[0],
                                px_max: ui.values[1]
                            }
                        })
                    }.bind(this)
                }
            },
            colormap_div: {
                type: 'div',
                div_class: 'viewer-colormap-ctrl',
                params: {
                    color_scale: {
                        type: 'select',
                        lbl: 'Color scale',
                        options: ['linear', 'log'],
                        div_css: {
                            float: 'left'
                        },
                        default_val: this.img_info.colormap.color_scale,
                        func: {
                            change: function(event){
                                this.update({
                                    colormap: {
                                        color_scale: event.currentTarget.value
                                    }
                                })
                            }.bind(this)
                        }
                    },
                    invert_color: {
                        lbl: 'invert scale',
                        prop: {
                            type: 'checkbox',
                            checked: this.img_info.colormap.invert_color
                        },
                        div_css: {
                            float: 'right'
                        },
                        func: {
                            change: function(event){
                                var params = this.gui.get();
                                this.update({
                                    colormap: {
                                        invert_color: params.invert_color
                                    }
                                })
                            }.bind(this)
                        }
                    }
                }
            }
        }
    };
    var gui = new Toyz.Gui.Gui({
        params: ctrls,
        $parent: $parent
    });
    return gui;
};