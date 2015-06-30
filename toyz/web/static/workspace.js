// Workspace utilities
// Copyright 2015 by Fred Moolekamp
// License: BSD 3-clause

Toyz.namespace('Toyz.Workspace');

Toyz.Workspace.load_api_dependencies = function(tile_api, namespace, url, callback){
    if(!Toyz.Core.exists(namespace) || 
            !Toyz.Core.get_var(namespace).dependencies_loaded()){
        Toyz.Core.load_dependencies(
            dependencies={
                js: [url]
            }, 
            callback = function(ns, callback){
                var namespace = Toyz.Core.get_var(ns);
                namespace.load_dependencies(callback);
            }.bind(null, namespace, callback)
        );
    }else{
        callback();
    };
};

Toyz.Workspace.contextMenu_items = function(workspace){
    var items = {
        "new": {
            name: "new",
            items: {
                "tile": {name: "tile", callback: workspace.new_tile.bind(workspace)},
                "source": {
                    name: "source", 
                    callback: function(){
                        this.load_src_dialog.open()
                    }.bind(workspace)
                }
            }
        },
        "sources": {name: "Data Sources", callback: function(){
            this.source_dialog.$div.dialog('open');
        }.bind(workspace)},
        "sep1": "--------------",
        "load_workspace": {name: "Load Workspace"},
        "save_workspace": {name: "Save Workspace", callback: function(){
            this.save_workspace();
        }.bind(workspace)},
        "save_ws_as": {name: "Save Workspace as", callback: function(){
            this.save_ws_as();
        }.bind(workspace)},
        "share_workspace": {name: "Share Workspace"},
        "show_logger": {name: "Show Logger", callback: function(){
            this.$logger.dialog('open');
        }.bind(workspace)},
        "logout": {name: "Logout", callback: function(){
            window.location = '/auth/logout/';
        }}
    }
    
    return items;
};

Toyz.Workspace.tile_contextMenu_items = function(options){
    var tile_types = $.extend(true, {
        highcharts: {
            name: 'Highcharts',
            namespace: 'Toyz.API.Highcharts',
            url: '/static/web/static/api/highcharts.js'
        },
        viewer: {
            name:'Image viewer',
            namespace: 'Toyz.Viewer',
            url: '/static/web/static/viewer.js'
        }
    }, options.custom_tiles);
    
    for(var tile in tile_types){
        tile_types[tile].callback = function(key, options){
            this.tiles[options.$trigger.prop('id')].load_api(key, options.commands[key]);
        }.bind(options.workspace)
    };
    
    var items = {
        "tile_type": {
            name: "Tile Type",
            items: tile_types
        },
        "remove_tile": {name:"Remove Tile"},
        "tile_sep": "--------------"
    }
    items = $.extend(true, items, Toyz.Workspace.contextMenu_items(workspace));
    return items;
};

Toyz.Workspace.DataSource = function(workspace, data, $parent, radio_group, info){
    this.workspace = workspace;
    this.idx = data.idx;
    this.id = data.id;
    this.name = data.name;
    this.params = data.params;
    this.columns = [];
    this.data = {};
    if(data.hasOwnProperty('selected')){
        this.selected = data.selected
    }else{
        this.selected = [];
    };
    // Add an entry to a list of data sources
    if(!($parent===undefined)){
        this.$parent = $parent;
        this.$div = $('<div/>');
        this.$input = $('<input value="'+this.id+'"></input>')
            .change(function(){
                this.name = event.currentTarget.value;
                console.log('changed data source to', this);
            }.bind(this));
        if(radio_group===undefined){
            radio_group = 'data_src';
        };
        this.$div
            .append('<input type="radio" name="'+radio_group+'" value='+this.id+'></input>')
            .append(this.$input);
        $parent.append(this.$div);
    }else{
        throw "$parent div required to initialize a data source"
    };
    // Update with any additionally added parameters
    if(!(info===undefined)){
        this.update(info);
    };
};
Toyz.Workspace.DataSource.prototype.update = function(info, info_val){
    // Allow user to either pass param_name, param_val to function or
    // dictionary with multiple parameters
    if(!(info_val===undefined)){
        var temp = info;
        info = {};
        info[temp] = info_val;
    };
    for(var prop in info){
        if(prop=='data'){
            // Organize columns and data depending on the data_type received
            // If 'rows_no_heading' is received, an automatic list of column names is
            // created and the data_type is changed to 'rows'.
            update = {
                from: {
                    tile:'',
                    series: 0
                },
                source: this.id, 
                info_type:'data update',
            };
            if(info.data_type=='columns'){
                for(var col in info.data){
                    this.data[col] = info.data[col];
                };
                update.columns = Object.keys(info.data);
            }else if(info.data_type=='append'){
                // If any new columns are being added, set the values of the
                // columns for the existing rows to null
                var len = this.data[Object.keys(this.data)[0]].length;
                for(var col in info.data){
                    if(!hasOwnProperty(this.data)){
                        this.data[col] = new Array(len);
                        for(var i; i<len; i++){
                            this.data[col][i] = null
                        };
                        this.columns.push(col);
                    };
                };
                // Append new rows to the data source and for any columns not included in the
                // row information, add NaN
                new_len = info.data[Object.keys(info.data)[0]].length;
                for(var col in this.data){
                    if(info.data.hasOwnProperty('col')){
                        for(var i=0; i<new_len; i++){
                            this.data[col].push(info.data[col][i]);
                        };
                    }else{
                        for(var i=0; i<new_len; i++){
                            this.data[col].push(null);
                        };
                    }
                };
                update.columns = this.data.columns;
            }else{
                var error = "You must initialize a data source with a data_type of "
                    + "'columns' or 'append'";
                throw error;
            };
            // Update tiles with the new data
            for(var tile_id in this.workspace.tiles){
                this.workspace.tiles[tile_id].contents.rx_info(update);
            };
        }else if(prop=='name'){
            this.name = info.name;
            this.$input.val(this.name);
        }else{
            this[prop] = info[prop];
        }
    };
};
Toyz.Workspace.DataSource.prototype.remove = function(){
    // Remove jQuery objects
    for(var param in this){
        if(param[0]=='$'){
            this[param].remove();
        };
    };
    // Remove references to this data source
    for(var tile in this.tiles){
        tile.remove_source(this.name);
    };
};
Toyz.Workspace.DataSource.prototype.save = function(){
    //console.log('this data source', this);
    var save_params = {
        params: this.params,
        tiles: this.tiles,
        name: this.name,
        idx: this.idx,
        selected: this.selected
    };
    return save_params;
};
Toyz.Workspace.DataSource.prototype.rx_info = function(options){
    // If any points are removed, remove them from the data source
    if(!options.hasOwnProperty('info_type') || !options.hasOwnProperty('from')){
        throw Error("rx_info options requires a 'from' field and an 'info_type' field");
    };
    if(options.info_type=='remove datapoints'){
        for(var col in this.data){
            for(var i=options.info.points.length-1; i>=0; i--){
                this.data[col].splice(options.info.points[i], 1);
            }
        };
        websocket.send_task({
            task: {
                module: 'toyz.web.tasks',
                task: 'remove_datapoints',
                parameters: {
                    src_id: this.id,
                    points: options.info.points
                }
            },
            callback:function(result){}
        })
    }else if(options.info_type=='select datapoints'){
        //console.log('selected', options.info.points);
        for(var i=0; i<options.info.points.length; i++){
            this.selected.push(options.info.points[i]);
        };
    }else if(options.info_type=='unselect datapoints'){
        for(var i=0; i<options.info.points.length; i++){
            var idx = this.selected.indexOf(options.info.points[i]);
            if(idx>-1){
                this.selected.splice(idx,1);
            };
        };
    };
    // Update tiles with the new information
    options = $.extend(true, options, {
        source: this.id
    })
    for(var tile_id in this.workspace.tiles){
        this.workspace.tiles[tile_id].contents.rx_info(options);
    };
};

Toyz.Workspace.Tile = function(workspace, info){
    this.workspace = workspace;
    this.contents = {
        save: function(){},
        remove: function(){},
        rx_info: function(){}
    };
    
    this.update(info);
};
Toyz.Workspace.Tile.prototype.load_api = function(tile_api, api_settings){
    Toyz.Workspace.load_api_dependencies(
        tile_api, 
        api_settings.namespace,
        api_settings.url,
        this.update.bind(this,{
            contents: {
                api: api_settings.namespace
            }
        })
    );
};
Toyz.Workspace.Tile.prototype.update = function(info, info_val){
    // Allow user to either pass param_name, param_val to function or
    // dictionary with multiple parameters
    if(!(info_val===undefined)){
        var temp = {}
        temp[info] = info_val;
        info = temp;
    };
    for(var prop in info){
        if(prop == 'contents'){
            //console.log('contents', info.contents);
            var namespace = Toyz.Core.get_var(info.contents.api);
            this.contents = new namespace.Contents({
                tile: this,
                $tile_div: this.$inner_div,
                workspace: this.workspace
            });
            if(info.contents.hasOwnProperty('settings')){
                this.contents.set_tile(info.contents.settings);
            };
        }else{
            this[prop] = info[prop];
        }
    };
};

Toyz.Workspace.SourceDialog = function(workspace, options){
    this.workspace = workspace;
    this.$div = $('<div/>').prop('title', 'Data Sources');
    this.editing = "";
    this.radio_group = "data_src";
    this.$div.dialog({
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: false,
        width: 'auto',
        height: '300',
        buttons: {
            New: function(){
                this.editing = '';
                this.workspace.load_src_dialog.open();
            }.bind(this),
            Remove: function(){
                this.workspace.remove_src();
            }.bind(this),
            Save: function(){
                var source = $("input:radio[ name='"+this.radio_group+"' ]:checked").val();
                websocket.send_task({
                    task: {
                        module: 'toyz.web.tasks',
                        task: 'save_data_file',
                        parameters: {
                            src_id: source,
                            save_paths: {}
                        }
                    },
                    callback: function(result){
                        if(result.status=='success'){
                            alert('Data file saved successfully');
                            var source = 
                                $("input:radio[ name='"+this.radio_group+"' ]:checked").val();
                            var src = this.workspace.sources[source];
                            var conditions = src.params.conditions;
                            src.params = result.new_file_options;
                            src.params.conditions = conditions;
                        }
                    }.bind(this)
                })
            }.bind(this),
            'Save As': function(){
                var source = $("input:radio[ name='"+this.radio_group+"' ]:checked").val();
                var src = this.workspace.sources[source];
                if(!(source===undefined)){
                    this.workspace.load_src_dialog.gui.set_params({
                        values: src.params,
                        set_all: false
                    });
                    this.workspace.save_src_dialog.open(src);
                };
            }.bind(this),
            Edit: function(){
                var source = $("input:radio[ name='"+this.radio_group+"' ]:checked").val();
                var src = this.workspace.sources[source];
                if(!(source===undefined)){
                    this.workspace.load_src_dialog.gui.set_params({
                        values: src.params,
                        set_all: false
                    });
                    this.workspace.load_src_dialog.open(src);
                };
            }.bind(this),
            Close: function(){
                this.$div.dialog('close');
            }.bind(this)
        }
    });
    for(var opt in options){
        this[opt] = options[opt]
    };
};

Toyz.Workspace.LoadSrcDialog = function(workspace, options){
    this.workspace = workspace;
    this.$div = $('<div/>')
        .prop('title', 'Open Data File')
        .addClass('open-dialog');
    this.gui = {};
    this.data_src = {};
    this.$div.dialog({
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: true,
        width: 'auto',
        height: '300',
        buttons: {
            Open: function(){
                //console.log('all params', this.gui.get());
                this.workspace.load_src(undefined, $.extend(this.data_src, {
                    params: this.gui.get()
                }))
            }.bind(this),
            Cancel: function(){
                this.$div.dialog('close');
            }.bind(this)
        }
    }).css("font-size", "12px");
    
    for(var opt in options){
        this[opt] = options[opt];
    };
};
Toyz.Workspace.LoadSrcDialog.prototype.open = function(data_src){
    if(data_src===undefined){
        this.data_src = {};
    } else{
        this.data_src = data_src;
    };
    this.$div.dialog('open');
};

Toyz.Workspace.SaveSrcDialog = function(workspace, options){
    this.workspace = workspace;
    this.$div = $('<div/>')
        .prop('title', 'Save Data File As')
        .addClass('open-dialog');
    this.gui = {};
    this.data_src = {};
    this.$div.dialog({
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: true,
        width: 'auto',
        height: '300',
        buttons: {
            Save: function(){
                var gui = this.gui.get();
                var toyz_module = gui.conditions.toyz_module;
                var io_module = gui.conditions.io_module;
                var file_type = gui.conditions.file_type;
                delete gui.conditions;
                var save_paths = {
                    data: {
                        toyz_module: toyz_module,
                        io_module: io_module,
                        file_type: file_type,
                        file_options: gui
                    }
                };
                //console.log('save_paths', save_paths);
                //console.log('src_id', this.data_src.id);
                websocket.send_task({
                    task: {
                        module: 'toyz.web.tasks',
                        task: 'save_data_file',
                        parameters: {
                            save_paths: save_paths,
                            src_id: this.data_src.id
                        }
                    },
                    callback: function(result){
                        //console.log('result', result);
                        if(result.status=='success'){
                            alert('Data file saved successfully');
                            var src = this.workspace.sources[this.data_src.id];
                            var conditions = src.params.conditions;
                            src.params = result.new_file_options;
                            src.params.conditions = conditions;
                        };
                        
                    }.bind(this)
                });
                this.$div.dialog('close');
            }.bind(this),
            Cancel: function(){
                this.$div.dialog('close');
            }.bind(this)
        }
    }).css("font-size", "12px");
    
    for(var opt in options){
        this[opt] = options[opt];
    };
};
Toyz.Workspace.SaveSrcDialog.prototype.open = function(data_src){
    if(data_src===undefined){
        this.data_src = {};
    } else{
        this.data_src = data_src;
    };
    this.$div.dialog('open');
};

Toyz.Workspace.Workspace = function(params){
    if(typeof websocket == 'undefined'){
        this.$logger = $('<div/>').css({
            overflow: 'hidden'
        });
        this.$logger.dialog({
            title: 'Logger',
            resizable: true,
            draggable: true,
            autoOpen: false,
            modal: false,
            buttons: {}
        }).css('font-size', '12px');
        websocket = new Toyz.Core.Websocket({
            logger: new Toyz.Core.Logger({
                $parent: this.$logger
            })
        });
    };
    if(!(params.hasOwnProperty('$parent'))){
        throw "ERROR: You must initialize a workspace with a $'parent' div"
    };
    
    this.name = undefined;
    this.$div = $('<div/>').addClass("workspace-div context-menu-one box menu-injected");
    this.$ws_dropdown_div = $('<div/>').prop('title', 'Load Workspace');
    this.sources = {};
    this.src_index = 0;
    this.tiles = {};
    this.tile_index = 0;
    this.params = $.extend(true,{},params);
    
    this.$loader = $('<div/>').append('<label>Loading</label>');
    this.$loader.dialog({
        resizable: false,
        draggable: true,
        autoOpen: true,
        modal: true,
        buttons: {}
    });
    
    for(var param in params){
        this[param] = params[param];
    };
    
    Toyz.Core.load_dependencies(
        dependencies={
            core: true
        }, 
        callback=this.dependencies_onload.bind(this)
    );
    this.$parent.append(this.$div);
};
Toyz.Workspace.Workspace.prototype.dependencies_onload = function(){
    console.log('all_dependencies_loaded', this);
    
    websocket.send_task({
        task: {
            module: 'toyz.web.tasks',
            task: 'get_workspace_info',
            parameters: {}
        },
        callback: function(result){
            this.$loader.dialog('close');
            console.log('msg received:', result);
            this.load_src_dialog.gui = new Toyz.Gui.Gui({
                params: $.extend(true,{},result.load_src_info),
                $parent: this.load_src_dialog.$div,
            });
            this.save_src_dialog.gui = new Toyz.Gui.Gui({
                params: $.extend(true,{},result.save_src_info),
                $parent: this.save_src_dialog.$div,
            });
    
            this.load_src_dialog.$div.dialog('widget').position({
                my: "center",
                at: "center",
                of: window
            });
            this.save_src_dialog.$div.dialog('widget').position({
                my: "center",
                at: "center",
                of: window
            });
            
            // Create workspace context menu
            $.contextMenu({
                selector: '.context-menu-one', 
                callback: function(key, options) {
                    this[key](options);
                }.bind(this),
                items: Toyz.Workspace.contextMenu_items(this)
            });
    
            //create tile context menu
            var tile_menu = Toyz.Workspace.tile_contextMenu_items({
                workspace:this,
                custom_tiles: result.tiles
            });
            this.tile_types = tile_menu.tile_type.items;
            $.contextMenu({
                selector: '.context-menu-tile',
                callback: function(key, options){
                    this[key](options);
                }.bind(this),
                items: tile_menu
            });
            for(var error in result.import_error){
                console.log('WARNING: ', result.import_error[error])
            };
            if(this.hasOwnProperty('work_id')){
                websocket.send_task({
                    task: {
                        module: 'toyz.web.tasks',
                        task: 'load_workspace',
                        parameters: {
                            user_id: this.user_id,
                            work_id: this.work_id
                        }
                    },
                    callback: this.update_workspace.bind(this)
                });
            };
        }.bind(this)
    });
    
    if(!this.params.hasOwnProperty('sources')){
        this.params.sources = {};
    };
    this.source_dialog = new Toyz.Workspace.SourceDialog(this);
    this.load_src_dialog = new Toyz.Workspace.LoadSrcDialog(this);
    this.save_src_dialog = new Toyz.Workspace.SaveSrcDialog(this);
    
    // Load workspace dialog
    this.$ws_dropdown_input = $('<select/>');
    this.$ws_dropdown_div.append(this.$ws_dropdown_input);
    this.$ws_dropdown_div.dialog({
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: false,
        width: 'auto',
        height: 'auto',
        buttons: {
            Load: function(){
                work_id = this.$ws_dropdown_input.val();
                websocket.send_task({
                    task: {
                        module: 'toyz.web.tasks',
                        task: 'load_workspace',
                        parameters: {work_id: work_id}
                    },
                    callback: this.update_workspace.bind(this)
                });
                this.$ws_dropdown_div.dialog('close');
            }.bind(this),
            Cancel: function(){
                this.$ws_dropdown_div.dialog('close');
            }.bind(this)
        }
    });
};
Toyz.Workspace.Workspace.prototype.save_workspace = function(params){
    if(this.name===undefined){
        this.save_ws_as();
    }else{
        var sources = {};
        for(var src in this.sources){
            sources[src] = this.sources[src].save();
        };
        var ws_dict = {
            workspaces: {},
            overwrite: true
        };
        ws_dict.workspaces[this.name] = {
            sources: sources,
            tiles: this.save_tiles()
        };
        params = $.extend(true, ws_dict, params);
        if(this.hasOwnProperty('user_id')){
            params['user_id'] = this.user_id;
        };
        websocket.send_task({
            task: {
                module: 'toyz.web.tasks',
                task: 'save_workspace',
                parameters: params
            },
            callback: function(result){
                if(result.id=='verify'){
                    if(confirm("Workspace name already exists, overwrite?")){
                        this.save_workspace();
                    }
                }
            }.bind(this)
        });
    };
};
Toyz.Workspace.Workspace.prototype.save_ws_as = function(){
    this.name = prompt("New workspace name");
    if(this.name != null){
        this.save_workspace({overwrite:false});
    };
};
Toyz.Workspace.Workspace.prototype.load_workspace = function(){
    websocket.send_task({
        task: {
            module: 'toyz.web.tasks',
            task: 'load_user_info',
            parameters:{
                user_id: websocket.user_id,
                user_attr: ['workspaces'],
            }
        },
        callback: function(result){
            this.$ws_dropdown_input.empty();
            var workspaces = Object.keys(result.workspaces).sort();
            for(var i=0; i<workspaces.length; i++){
                var key = workspaces[i];
                var opt = $('<option/>')
                    .val(key)
                    .text(key);
                this.$ws_dropdown_input.append(opt);
            };
            this.$ws_dropdown_div.dialog('open');
        }.bind(this)
    });
};
// First load all of the data sources, then update the tiles once all of the
// data has been loaded from the server
Toyz.Workspace.Workspace.prototype.update_workspace = function(result){
    //console.log('load result', result);
    var sources = Object.keys(result.settings.sources);
    var src_list = [];
    for(var i=0; i<sources.length;i++){
        src_list.push(result.settings.sources[sources[i]]);
    };
    this.name = result.work_id;
    this.update_sources(
        src_list, 
        replace=true,
        callback = function(tiles){
            this.load_tiles(tiles);
        }.bind(this, result.settings.tiles)
    );
    console.log('done updating');
};
Toyz.Workspace.Workspace.prototype.share_workspace = function(){
    console.log('Workspace sharing has not been setup yet');
};

Toyz.Workspace.Workspace.prototype.load_src = function(callback, data_src){
    //console.log('loading source', data_src);
    if(!data_src.hasOwnProperty('idx')){
        data_src.idx = this.src_index++;
    }else if(this.src_index<=data_src.idx){
        this.src_index = data_src.idx+1;
    };
    if(!data_src.hasOwnProperty('id')){
        data_src.id = 'data-'+data_src.idx;
    };
    if(!data_src.hasOwnProperty('name')){
        data_src.name = 'data-'+data_src.idx.toString();
    };
    var src_params = $.extend(true, {}, data_src.params);
    
    // Load data from server
    var toyz_module = src_params['conditions'].toyz_module;
    var io_module = src_params['conditions'].io_module;
    var file_type = src_params['conditions'].file_type;
    delete src_params['conditions']
    //console.log('source params', src_params);
    //console.log('file_type', file_type);
    this.$loader.dialog('open');
    websocket.send_task({
        task: {
            module: 'toyz.web.tasks',
            task: 'load_data_file',
            parameters: {
                paths: {
                    data: {
                        toyz_module: toyz_module,
                        io_module: io_module,
                        file_type: file_type,
                        file_options: src_params,
                    }
                },
                src_id: data_src.id,
                src_name: data_src.name
            }
        },
        callback: this.add_src.bind(this, callback, data_src)
    });
};
Toyz.Workspace.Workspace.prototype.add_src = function(callback, data_src, result){
    //console.log('added source to workspace', this);
    //console.log('data src', data_src);
    this.$loader.dialog('close');
    delete result.id;
    if(!(this.sources.hasOwnProperty(data_src.id))){
        this.sources[data_src.id] = new Toyz.Workspace.DataSource(
            this,
            data_src,
            this.source_dialog.$div,
            this.source_dialog.radio_group
        );
    };
    result.name = data_src.name;
    //console.log('updating with', result);
    this.sources[data_src.id].update(result)
    this.load_src_dialog.$div.dialog('close');
    if(!(callback===undefined)){
        callback();
    };
};
Toyz.Workspace.Workspace.prototype.remove_src = function(source){
    if(source===undefined){
        source = $("input:radio[ name='"+this.source_dialog.radio_group+"' ]:checked").val()
    };
    if(!(source===undefined)){
        for(var param in this.sources[source]){
            if(param[0]=='$' && param!='$parent'){
                this.sources[source][param].remove();
            }
        }
    }
    delete this.sources[source];
};
Toyz.Workspace.Workspace.prototype.remove_all_sources = function(sources){
    if(sources===undefined){
        sources = this.sources;
    };
    for(var src in sources){
        this.remove_src(src);
    };
};
// Synchronously load sources
Toyz.Workspace.Workspace.prototype.update_sources = function(src_list, replace, callback){
    //console.log('sources:', src_list);
    if(replace){
        this.remove_all_sources();
    };
    if(src_list.length==0){
        callback();
    }else if(src_list.length==1){
        this.source_dialog.editing = src_list[0].id;
        this.load_src(callback, src_list[0]);
    }else{
        this.load_src(
            this.update_sources.bind(
                this, 
                src_list.slice(1, src_list.length),
                false,
                callback
            ),
            src_list[0]
        );
    };
};

Toyz.Workspace.Workspace.prototype.new_tile = function(key, options, my_idx){
    if(my_idx===undefined){
        my_idx = this.tile_index++;
    }else if(this.tile_index<=my_idx){
        this.tile_index = my_idx+1;
    };
    my_idx = my_idx.toString();
    var inner_id = 'tile-'+my_idx;
    var my_id = 'tile-div'+my_idx;
    
    var $inner_div = $('<div/>')
        .prop('id',inner_id)
        .addClass('ws-inner-div context-menu-tile box menu-injected');
    
    var $div = $('<div/>')
        .prop('id',my_id)
        .addClass('ws-tile context-menu-tile box menu-injected')
        .draggable({
            stack: '#'+my_id,
            cancel: '#'+inner_id,
            grid: [5,5],
            containment: 'parent'
        })
        .resizable({
            autoHide: true,
            handles: "ne,se,nw,sw",
            grid: [5,5]
        })
        .css({
            position: 'absolute',
            top: Math.floor(window.innerHeight/2),
            left: Math.floor(window.innerWidth/2),
        })
        .resize(function($inner_div, $div, event){
            var $div = $(event.originalElement);
            $inner_div.width($div.width());
            $inner_div.height($div.height());
        }.bind(this, $inner_div))
    $div.append($inner_div);
    this.$div.append($div);
    $inner_div.width($div.width());
    $inner_div.height($div.height());
    this.tiles[inner_id] = new Toyz.Workspace.Tile(this, {
        id: inner_id,
        $div: $div,
        $inner_div: $inner_div,
    });
    // Make sure the new tile is on top
    var topZ = 0;
    this.$div.each(function(){
      var thisZ = parseInt($(this).css('zIndex'), 10);
      if (thisZ > topZ){
        topZ = thisZ;
      }
    });
    $div.css('zIndex', topZ+1);
    return this.tiles[inner_id];
};
Toyz.Workspace.Workspace.prototype.remove_tile = function(options){
    var my_id = options.$trigger.prop('id');
    this.tiles[my_id].$div.remove();
    
    // tile.remove() is a function that may differ depending on the
    // type of object displayed in the tile
    this.tiles[my_id].contents.remove();
    delete this.tiles[my_id];
};
Toyz.Workspace.Workspace.prototype.save_tiles = function(){
    var tiles = {};
    for(var tile_id in this.tiles){
        var tile = this.tiles[tile_id];
        tiles[tile_id] = {
            tile_id: tile_id,
            top: tile.$div.offset().top,
            left: tile.$div.offset().left,
            width: tile.$div.width(),
            height: tile.$div.height()
        };
        tiles[tile_id].contents = tile.contents.save();
    };
    return tiles;
};
Toyz.Workspace.Workspace.prototype.load_tiles = function(tiles){
    //console.log('load tiles', tiles);
    var api_list = [];
    for(var tile_id in tiles){
        if(api_list.indexOf(tiles[tile_id].contents.type)==-1){
            api_list.push(tiles[tile_id].contents.type);
        };
    };
    this.load_tile_apis(api_list, tiles);
};
Toyz.Workspace.Workspace.prototype.load_tile_apis = function(api_list, tiles){
    var callback;
    if(api_list.length==1){
        callback = this.update_all_tiles.bind(this, tiles);
    }else{
        callback = this.load_tile_apis.bind(
            this,
            api_list.slice(1,api_list.length),
            tiles
        );
    };
    var all_apis = this.tile_types;
    //console.log('all apis', all_apis);
    //console.log('api', api_list[0]);
    if(api_list.length>0){
        if(!all_apis.hasOwnProperty(api_list[0])){
            alert("API not found in toyz")
            throw "API not found in toyz"
        };
        Toyz.Workspace.load_api_dependencies(
            tile_api=api_list[0],
            namespace=all_apis[api_list[0]].namespace,
            url=all_apis[api_list[0]].url,
            callback
        )
    };
};
// Load Tile API's synchronously, then update all of the tiles
Toyz.Workspace.Workspace.prototype.update_all_tiles = function(tiles){
    var new_tiles = {};
    for(var tile_id in tiles){
        new_tiles[tile_id] = this.new_tile(this, null, tile_id.split('-')[1]);
        new_tiles[tile_id].$div.css({
            top: tiles[tile_id].top,
            left: tiles[tile_id].left,
            width: tiles[tile_id].width,
            height: tiles[tile_id].height
        });
        var all_apis = this.tile_types;
        new_tiles[tile_id].update({
            contents: {
                workspace: this,
                api: all_apis[tiles[tile_id].contents.type].namespace,
                settings: tiles[tile_id].contents.settings
            }
        });
    };
    this.tiles = new_tiles;
};

console.log('workspace.js loaded');