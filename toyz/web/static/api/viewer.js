// API for Image Viewers
// Copyright 2015 by Fred Moolekamp
// License: MIT
Toyz.namespace('Toyz.API.Viewer');

// Some API's require other dependencies to be loaed
Toyz.API.Viewer.dependencies_loaded = function(){
    return true;
};

Toyz.API.Viewer.load_dependencies = function(callback, params){
    callback();
};

Toyz.API.Viewer.Types = function(tile_contents){
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

Toyz.API.Viewer.Gui = function(params){
    this.$div = $('<div/>');
    this.$parent = params.$parent;
    this.$parent.append(this.$div);
    this.workspace = params.workspace;
    this.tile = params.tile;
    
    var options = new Toyz.API.Viewer.Types(this);
    for(var opt in options){
        if(options.hasOwnProperty(opt)){
            options[opt] = options[opt].name
        }
    };
    //console.log('options', options);
    
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
};

Toyz.API.Viewer.contextMenu_items = function(workspace, tile_contents, options){
    var items = $.extend(true,
        new Toyz.API.Viewer.Types(this),
        {img_sep: "--------------"},
        options, 
        Toyz.Workspace.tile_contextMenu_items(workspace));
    return items;
};

Toyz.API.Viewer.Contents = function(params){
    this.type = 'Viewer';
    this.tile = params.tile;
    this.$tile_div = params.$tile_div;
    this.$tile_div
        .removeClass('context-menu-tile')
        .addClass('context-menu-viewer')
    .addClass('image-viewer-div');
    this.$viewer = $('<div/>').addClass('image-viewer');
    this.$tile_div.append(this.$viewer);
    this.workspace = params.workspace;
    this.settings = {};
    //create tile context menu
    $.contextMenu({
        selector: '.context-menu-viewer',
        callback: function(workspace, key, options){
            workspace[key](options);
        }.bind(null, workspace),
        items: Toyz.API.Viewer.contextMenu_items(workspace, this)
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
            this.get_tile_map(this.file_info.frame);
        }.bind(this), 250))
    }.bind(this));
};
Toyz.API.Viewer.Contents.prototype.set_window = function(viewer_left, viewer_top){
    var img_info = this.file_info.images[this.file_info.frame];
    var viewer = img_info.viewer;
    viewer.x0 = viewer_left;
    viewer.xf = viewer.x0 + viewer.width;
    viewer.y0 = img_info.scaled_height-img_info.viewer.height-viewer_top;
    viewer.yf = viewer.y0 + img_info.viewer.height;
    viewer.x_center = viewer.x0 + Math.round(viewer.width/2);
    viewer.y_center = viewer.y0 + Math.round(viewer.height/2);
    //console.log('new viewer', this.file_info.images[this.file_info.frame].viewer);
};
Toyz.API.Viewer.Contents.prototype.update = function(params, param_val){
    // Allow user to either pass param_name, param_val to function or
    // dictionary with multiple parameters
    if(!(param_val===undefined)){
        params = {params:param_val};
    };
    for(var param in params){
        this[param] = params[param];
    }
};
Toyz.API.Viewer.Contents.prototype.rx_info = function(from, info_type, info){
    
};
Toyz.API.Viewer.Contents.prototype.save = function(){
    var tile = {
        type: this.type,
        settings: this.settings
    };
    return tile;
};
Toyz.API.Viewer.Contents.prototype.load_large_img = function(filepath){
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
                    x0: 0,
                    y0: 0,
                    xf: this.$tile_div.width(),
                    yf: this.$tile_div.height(),
                    x_center: Math.round(this.$tile_div.width()),
                    y_center: Math.round(this.$tile_div.width()),
                    scale: -1
                }
            }
        },
        function(result){
            //console.log('file info', result.file_info);
            this.file_info = result.file_info;
            var img_info = this.file_info.images[this.file_info.frame];
            this.$viewer.width(img_info.scaled_width);
            this.$viewer.height(img_info.scaled_height);
            this.get_img_tiles(this.file_info.frame, result.new_tiles);
        }.bind(this)
    )
};
Toyz.API.Viewer.Contents.prototype.get_best_fit = function(width, height){
    
};
Toyz.API.Viewer.Contents.prototype.get_tile_map = function(frame){
    var file_info = $.extend(true, {}, this.file_info);
    delete file_info['images'];
    this.workspace.websocket.send_task(
        {
            module: 'toyz.web.tasks',
            task: 'get_tile_info',
            parameters: {
                file_info: file_info,
                img_info: this.file_info.images[frame]
            }
        },
        function(frame, result){
            this.file_info.images[frame].tiles = $.extend(
                true, 
                this.file_info.images[frame].tiles,
                result.new_tiles
            );
            this.get_img_tiles(frame, result.new_tiles)
        }.bind(this, frame)
    )
};
Toyz.API.Viewer.Contents.prototype.get_img_tiles = function(current_frame, tiles){
    var img_info = $.extend(true, {}, this.file_info['images'][current_frame]);
    // No need to send a large json object with tile data that is not needed
    delete img_info['tiles'];
    var file_info = $.extend(true, {}, this.file_info);
    // No need to send a large json object with image data that is not needed
    delete file_info['images'];
    
    this.$tile_div.scrollTop(img_info.scaled_height-img_info.viewer.height-img_info.viewer.y0);
    this.$tile_div.scrollLeft(img_info.viewer.x0);
    for(var tile_idx in tiles){
        if(tiles.hasOwnProperty(tile_idx)){
            var current_frame = this.file_info['frame'];
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
                this.rx_tile_info.bind(this, current_frame, 
                    this.file_info['images'][current_frame], tile_idx
                )
            )
        }
    }
};
Toyz.API.Viewer.Contents.prototype.rx_tile_info = function(
        current_frame, img_info, tile_idx, result){
    //console.log('result', result);
    //console.log('img_info', img_info);
    //console.log('current_frame', current_frame);
    //console.log('tile_idx', tile_idx);
    //console.log('tile', img_info['tiles'][tile_idx]);
    
    // load image from data url
    var img = new Image();
    img.onload = function(img, img_info, tile_idx) {
        /*if(img_info.scale>1){
            img.width = img.width*img_info.scale;
        }*/
        var tile = img_info.tiles[tile_idx];
        var $img = $(img)
            .addClass('tile-img')
            .css({
                left: tile.left+'px',
                bottom: tile.bottom+'px'
            });
        this.$viewer.append($img);
    }.bind(this, img, img_info, tile_idx);
    img.src = '/file'+img_info.tiles[tile_idx].new_filepath;
};
Toyz.API.Viewer.Contents.prototype.set_tile = function(settings){
    if(settings.img_type == 'large_img'){
        this.load_large_img(settings.filename);
    };
};