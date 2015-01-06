// Workspace utilities
// Copyright 2014 by Fred Moolekamp
// License: MIT

Toyz.namespace('Toyz.Workspace');

Toyz.Workspace.contextMenu_items = function(workspace){
    var items = {
        "new": {
            name: "new",
            items: {
                "tile": {name: "tile", callback: workspace.new_tile},
                "source": {name: "source", callback: function(){
                    workspace.data_sources.editing = '';
                    workspace.$new_data_div.dialog('open')}
                }
            }
        },
        "sources": {name: "Data Sources", callback: function(){
            workspace.data_sources.$div.dialog('open');
        }},
        "sep1": "--------------",
        "load_workspace": {name: "Load Workspace"},
        "save_workspace": {name: "Save Workspace", callback: function(){
            workspace.save_workspace();
        }},
        "save_ws_as": {name: "Save Workspace as", callback: function(){
            workspace.save_ws_as();
        }},
        "share_workspace": {name: "Share Workspace"},
        "logout": {name: "Logout", callback: function(){
            window.location = '/auth/logout/';
        }}
    }
    
    return items;
};

Toyz.Workspace.init_data_dialog = function(workspace, sources){
    sources = {} || sources;
    var params = workspace.params.data_sources;
    
    if(!params.hasOwnProperty('options')){
        params.options={};
    };
    var data_dialog = $.extend(true, {
        $div: $('<div/>').prop('title', 'Data Sources'),
        src_index: 0,
        sources: {},
        editing: '',
        load_src: function(params){
            var src_params = $.extend(true, {}, params);
            // Create entry if the source is new (as opposed to one being edited)
            if(data_dialog.editing == ''){
                var data_name = 'data-'+(data_dialog.src_index++).toString();
                data_dialog.sources[data_name] = {
                    $div: $('<div/>'),
                    name: data_name,
                    $input: $('<input value="'+data_name+'"></input>'),
                    params: params
                };
                data_dialog.sources[data_name].$div
                    .append('<input type="radio" name="data_src" value='+data_name+'></input>')
                    .append(data_dialog.sources[data_name].$input);
                data_dialog.$div.append(data_dialog.sources[data_name].$div);
            }else{
                data_name = data_dialog.editing;
                data_dialog.sources[data_name].params = params;
                data_dialog.editing = '';
            };
            
            // Load data from server
            var io_module = src_params['conditions'].io_module;
            var file_type = src_params['conditions'].file_type;
            delete src_params['conditions']
            workspace.websocket.send_task(
                {
                    module: 'toyz.web.tasks',
                    task: 'load_data_file',
                    parameters: {
                        io_module: io_module,
                        file_type: file_type,
                        file_options: src_params
                    }
                },
                data_dialog.add_src,
                {
                    src: data_name
                }
            );
        },
        add_src: function(result, params){
            data_dialog.sources[params.src].columns = result.columns;
            data_dialog.sources[params.src].data = result.data;
            data_dialog.sources[params.src].tiles = [];
            workspace.$new_data_div.dialog('close');
            console.log('data:', params.src, data_dialog.sources[params.src]);
        },
        remove_src: function(source){
            if(source===undefined){
                source = $("input:radio[ name='data_src' ]:checked").val()
            };
            if(!(source===undefined)){
                for(var param in data_dialog.sources[source]){
                    if(param[0]=='$'){
                        data_dialog.sources[source][param].remove();
                    }
                }
            }
            delete data_dialog.sources[source];
        },
        remove_all_sources: function(sources){
            if(sources===undefined){
                sources = data_dialog.sources;
            };
            for(var src in sources){
                data_dialog.remove_src(src);
            };
        },
        edit_src: function(){
            var source = $("input:radio[ name='data_src' ]:checked").val()
            var src = data_dialog.sources[source];
            data_dialog.editing = source;
            if(!(source===undefined)){
                workspace.new_data_gui.setParams(workspace.new_data_gui.params, src.params, false);
                workspace.$new_data_div.dialog('open');
            }
        },
        update_sources: function(sources, replace){
            if(replace){
                data_dialog.remove_all_sources();
            };
            for(var src in sources){
                data_dialog.load_src(sources[src].params);
            };
        },
    }, params.options);
    
    data_dialog.$div.dialog({
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: false,
        width: 'auto',
        height: '300',
        buttons: {
            New: function(){
                data_dialog.editing = '';
                workspace.$new_data_div.dialog('open');
            },
            Remove: function(){
                data_dialog.remove_src();
            },
            Edit: function(){
                data_dialog.edit_src();
            },
            Close: function(){
                data_dialog.$div.dialog('close');
            }
        }
    });
    
    data_dialog.update_sources(sources);
    
    return data_dialog;
};

Toyz.Workspace.init_tile_dialog = function(workspace){
    var $div = $('<div/>').prop('title','Edit Tile');
    var tile_dialog = {
        $div: $div,
        editing: '',
        edit: function(tile_id){
            tile_dialog.editing = tile_id;
            tile_dialog.$div.dialog('open');
        }
    };
    
    tile_dialog.$div.dialog({
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: false,
        width: 'auto',
        height: '300',
        buttons: {
            Set: function(){
                console.log('Set tile has not yet been implemented');
                tile_dialog.$div.dialog('close');
            },
            Cancel: function(){
                tile_dialog.$div.dialog('close');
            }
        }
    });
    
    return tile_dialog;
};

Toyz.Workspace.init = function(params){
    var workspace = {
        name: undefined,
        $div: $('<div/>').addClass("workspace-div context-menu-one box menu-injected"),
        $parent: params.$parent,
        $new_data_div: $('<div/>')
            .prop('title', 'Open Data File')
            .addClass('open-dialog'),
        $ws_dropdown_div: $('<div/>').prop('title', 'Load Workspace'),
        tiles: {},
        tile_index: 0,
        params: $.extend(true,{},params),
        dependencies_onload: function(){
            console.log('all_dependencies_loaded');
            file_dialog = Toyz.Core.initFileDialog({
                websocket: workspace.websocket
            });
            workspace.file_dialog = file_dialog;
            
            workspace.websocket.send_task({
                module: 'toyz.web.tasks',
                task: 'get_io_info',
                parameters: {}
            });
            
            if(!workspace.params.hasOwnProperty('data_sources')){
                workspace.params.data_sources = {};
            };
            workspace.data_sources=Toyz.Workspace.init_data_dialog(workspace);
            workspace.$ws_dropdown_input = $('<select/>');
            
            workspace.$ws_dropdown_div.append(workspace.$ws_dropdown_input);
            workspace.$ws_dropdown_div.dialog({
                resizable: true,
                draggable: true,
                autoOpen: false,
                modal: false,
                width: 'auto',
                height: 'auto',
                buttons: {
                    Load: function(){
                        work_id = workspace.$ws_dropdown_input.val();
                        workspace.websocket.send_task(
                            {
                                module: 'toyz.web.tasks',
                                task: 'load_workspace',
                                parameters: {work_id: work_id}
                            },
                            workspace.update_workspace
                        );
                        workspace.$ws_dropdown_div.dialog('close');
                    },
                    Cancel: function(){
                        workspace.$ws_dropdown_div.dialog('close');
                    }
                }
            });
            
            // Initialize dialog to edit a tile's type and settings
            workspace.tile_dialog = Toyz.Workspace.init_tile_dialog(workspace);
            
            // Create workspace context menu
            $.contextMenu({
                selector: '.context-menu-one', 
                callback: function(key, options) {
                    workspace[key](options);
                },
                items: Toyz.Workspace.contextMenu_items(workspace)
            });
            
            //create tile context menu
            $.contextMenu({
                selector: '.context-menu-tile',
                callback: function(key, options){
                    workspace[key](options);
                },
                items: $.extend(true, {
                    "edit_tile": {name:"Edit Tile"},
                    "remove_tile": {name:"Remove Tile"},
                    "tile_sep": "--------------"
                }, Toyz.Workspace.contextMenu_items(workspace))
            })
        },
        rx_msg: function(result){
            console.log('msg received:', result);
            if(result.id == 'io_info'){
                var param_div = $.extend(true,{},result.io_info);
                
                workspace.$new_data_div.dialog({
                    resizable: true,
                    draggable: true,
                    autoOpen: false,
                    modal: true,
                    width: 'auto',
                    height: '300',
                    buttons: {
                        Open: function(){
                            var params = workspace.new_data_gui.getParams(
                                workspace.new_data_gui.params
                            );
                            console.log('params', params);
                            workspace.data_sources.load_src(params);
                        },
                        Cancel: function(){
                            workspace.$new_data_div.dialog('close');
                        }
                    }
                });
                
                workspace.new_data_gui = Toyz.Gui.initParamList(
                    param_div,
                    options = {
                        $parent: workspace.$new_data_div,
                    }
                );
                
                workspace.$new_data_div.dialog('widget').position({
                    my: "center",
                    at: "center",
                    of: window
                });
            }
        },
        save_workspace: function(params){
            if(workspace.name===undefined){
                workspace.save_ws_as();
            }else{
                var sources = {};
                for(var src in workspace.data_sources.sources){
                    console.log('src:', src, workspace.data_sources.sources[src]);
                    sources[src] = {params:workspace.data_sources.sources[src].params};
                };
                var ws_dict = {
                    workspaces: {},
                    overwrite: true
                };
                ws_dict.workspaces[workspace.name] = {
                    sources: sources,
                    tiles: workspace.save_tiles()
                }
                params = $.extend(true,ws_dict,params);
                workspace.websocket.send_task(
                    {
                        module: 'toyz.web.tasks',
                        task: 'save_workspace',
                        parameters: params
                    },
                    function(result){
                        if(result.id=='verify'){
                            if(confirm("Workspace name already exists, overwrite?")){
                                workspace.save_workspace();
                            }
                        }
                    }
                );
            }
        },
        save_ws_as: function(){
            workspace.name = prompt("New workspace name");
            if(workspace.name != null){
                workspace.save_workspace({overwrite:false});
            }
        },
        load_workspace: function(){
            workspace.websocket.send_task(
                {
                    module: 'toyz.web.tasks',
                    task: 'load_user_info',
                    parameters:{
                        user_id: workspace.websocket.user_id,
                        user_attr: ['workspaces'],
                    }
                },
                function(result){
                    workspace.$ws_dropdown_input.empty();
                    for(var key in result.workspaces){
                        var opt = $('<option/>')
                            .val(key)
                            .text(key);
                        workspace.$ws_dropdown_input.append(opt);
                    }
                    workspace.$ws_dropdown_div.dialog('open');
                }
            )
        },
        update_workspace: function(result){
            workspace.name = result.work_id;
            workspace.data_sources.update_sources(result.settings.sources, replace=true);
            workspace.tiles = workspace.load_tiles(result.settings.tiles);
            console.log('workspace tiles:',workspace.tiles);
        },
        share_workspace: function(){
        },
        new_tile: function(){
            var my_idx = (workspace.tile_index++).toString();
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
                });
            $div.append($inner_div);
            workspace.$div.append($div);
            workspace.tiles[inner_id] = {
                tile_id: inner_id,
                type: undefined,
                info: {},
                $div: $div,
                $inner_div: $inner_div,
                remove: function(){},
                save: function(){return {};},
                update: function(){}
            }
            
            return workspace.tiles[inner_id];
        },
        remove_tile: function(options){
            var my_id = options.$trigger.prop('id');
            workspace.tiles[my_id].$div.remove();
            
            // tile.remove() is a function that may differ depending on the
            // type of object displayed in the tile
            workspace.tiles[my_id].remove();
            delete workspace.tiles[my_id];
        },
        edit_tile: function(options){
            workspace.tile_dialog.edit(options.$trigger.prop('id'))
        },
        save_tiles: function(){
            var tiles = {};
            for(var tile_id in workspace.tiles){
                var tile = workspace.tiles[tile_id];
                tiles[tile_id] = {
                    tile_id: tile_id,
                    top: tile.$div.offset().top,
                    left: tile.$div.offset().left,
                    width: tile.$div.width(),
                    height: tile.$div.height()
                };
                tiles[tile_id] = $.extend(true, tiles[tile_id], tile.save());
            };
            return tiles;
        },
        load_tiles: function(tiles){
            var new_tiles = {};
            for(var tile_id in tiles){
                new_tiles[tile_id] = workspace.new_tile();
                new_tiles[tile_id].$div.css({
                    top: tiles[tile_id].top,
                    left: tiles[tile_id].left,
                    width: tiles[tile_id].width,
                    height: tiles[tile_id].height
                });
                // Code here to modify the new tiles type and properties
            };
            return new_tiles;
        }
    };
    
    workspace.websocket = Toyz.Core.jobsocketInit({
        receiveAction: workspace.rx_msg,
        //logger:new Toyz.Core.Logger(document.getElementById("logger")),
    });
    
    Toyz.Core.load_dependencies(
        dependencies={
            core: true,
        }, 
        callback=workspace.dependencies_onload
    );
    
    params.$parent.append(workspace.$div);
    
    return workspace;
};

console.log('workspace.js loaded');