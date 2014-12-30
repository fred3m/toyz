// Workspace utilities
// Copyright 2014 by Fred Moolekamp
// License: MIT

Toyz.namespace('Toyz.Workspace');

Toyz.Workspace.init = function(params){
    var workspace = {
        $div: $('<div/>').addClass("workspace-div context-menu-one box menu-injected"),
        $parent: params.$parent,
        rx_msg: function(result){
            console.log('msg received:', result);
            if(result.id == 'io_info'){
                var param_div = $.extend(true,{},result.io_info);
                workspace.$open_data_div = $('<div/>')
                    .prop('title', 'Open Data File')
                    .addClass('open-dialog');
                    
                // recursively search for file_dialogs and set them to the file_dialog
                // of the workspace
                function set_file_dialogs(obj){
                    for(var key in obj){
                        if(obj.hasOwnProperty(key) && typeof obj[key]==='object'){
                            obj[key] = set_file_dialogs(obj[key]);
                        }
                    };
                    if(obj.hasOwnProperty('file_dialog')){
                        obj['file_dialog'] = workspace.file_dialog;
                    };
                    return obj;
                };
                param_div = set_file_dialogs(param_div);
                
                workspace.$open_data_div.dialog({
                    resizable: true,
                    draggable: true,
                    autoOpen: false,
                    modal: true,
                    width: 'auto',
                    height: '300',
                    buttons: {
                        Open: function(){
                            var params = workspace.open_data_gui.getParams(
                                workspace.open_data_gui.params
                            );
                            console.log('params', params);
                            var io_module = params['conditions'].io_module;
                            var file_type = params['conditions'].file_type;
                            delete params['conditions']
                            workspace.websocket.send_task({
                                module: 'toyz.web.tasks',
                                task: 'load_data_file',
                                parameters: {
                                    io_module: io_module,
                                    file_type: file_type,
                                    file_options: params
                                }
                            });
                            console.log('load sent');
                        },
                        Cancel: function(){
                            workspace.$open_data_div.dialog('close');
                        }
                    }
                });
                
                workspace.open_data_gui = Toyz.Gui.initParamList(
                    param_div,
                    options = {
                        $parent: workspace.$open_data_div,
                    }
                );
                
                workspace.$open_data_div.dialog('widget').position({
                    my: "center",
                    at: "center",
                    of: window
                });
            }
        },
        dependencies_onload: function(){
            console.log('all_dependencies_loaded');
            workspace.file_dialog = Toyz.Core.initFileDialog({
                websocket: workspace.websocket
            });
            
            workspace.websocket.send_task({
                module: 'toyz.web.tasks',
                task: 'get_io_info',
                parameters: {}
            });
            
            // Create context menu
            $.contextMenu({
                selector: '.context-menu-one', 
                callback: function(key, options) {
                    var m = "clicked: " + key;
                    window.console && console.log(m) || alert(m); 
                },
                items: {
                    "new": {
                        name: "new",
                        items: {
                            "tile": {name: "tile"},
                            "source": {name: "source", callback: function(){
                                return workspace.$open_data_div.dialog('open')}
                            }
                        }
                    },
                    "sources": {name: "Data Sources", callback: function(){
                    }},
                    "tiles": {name:"Tiles", callback: function(){
                    }},
                    "sep1": "--------------",
                    "load_ws": {name: "Load Workspace"},
                    "save_ws": {name: "Save Workspace"},
                    "save_ws_as": {name: "Save Workspace as"},
                    "logout": {name: "Logout", callback: function(){
                        window.location = '/auth/logout/';
                    }}
                }
            });
        },
    };
    
    workspace.websocket = Toyz.Core.jobsocketInit({
        receiveAction: workspace.rx_msg,
        //logger:new Toyz.Core.Logger(document.getElementById("logger")),
    });
    
    Toyz.Core.load_dependencies(
        dependencies={
            core: true,
            css: ["/static/web/static/workspace.css"]
        }, 
        callback=workspace.dependencies_onload
    );
    
    params.$parent.append(workspace.$div);
    
    return workspace;
}

Toyz.Workspace.oldinit = function(options){
    // required options:
    // $parent: jquery object that is a parent-div for the workspace
    
    var ws = $.extend(true, {
        data: {},
        data_index: 0,
        tiles: {},
        tile_index: 0,
        $parent: null,
        new_tile: function(){
            var my_idx = (tile_index++).toString();
            var my_id = 'tile-'+my_idx;
            var inner_id = 'tile-div-'+my_idx;
            var $inner_div = $('<div/>')
                .prop('id',inner_id)
                .addClass('ws-inner-div');
            var $div = $('<div/>')
                .prop('id',my_id)
                .addClass('ws-tile')
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
                });
            $div.append($inner_div);
            ws.$parent.append($div);
        }
    }, options);
    
    var data_gui = {
        type: 'div',
        params: {
            
        }
    }
    
    ws.$data_dialog = $('<div/>');
    ws.$data_dialog.dialog({
        resizable:true,
        draggable:true,
        width:400,
        height:400,
        autoOpen:true,
        modal:true,
    });
    
    return ws;
}

Toyz.Workspace.init_data = function(params){
    var data_dialog = {
        
    }
}

console.log('workspace.js loaded');