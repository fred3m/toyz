// Workspace utilities
// Copyright 2014 by Fred Moolekamp
// License: MIT

Toyz.namespace('Toyz.Workspace');

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
            console.log('editing:', data_dialog.editing);
            // Create entry if the source is new (as opposed to one being edited)
            if(data_dialog.editing == ''){
                var data_name = 'data-'+(data_dialog.src_index++).toString();
                data_dialog.sources[data_name] = {
                    $div: $('<div/>'),
                    name: data_name,
                    $input: $('<input value="'+data_name+'"></input>'),
                    params: params
                };
                console.log('data name:', data_name);
                data_dialog.sources[data_name].$div
                    .append('<input type="radio" name="data_src" value='+data_name+'></input>')
                    .append(data_dialog.sources[data_name].$input);
                data_dialog.$div.append(data_dialog.sources[data_name].$div);
            
                console.log('src_params:', src_params);
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
            console.log('load sent');
        },
        add_src: function(result, params){
            data_dialog.sources[params.src].columns = result.columns;
            data_dialog.sources[params.src].data = result.data;
            workspace.$new_data_div.dialog('close');
            console.log('sources', data_dialog);
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

Toyz.Workspace.init = function(params){
    var workspace = {
        name: undefined,
        $div: $('<div/>').addClass("workspace-div context-menu-one box menu-injected"),
        $parent: params.$parent,
        $new_data_div: $('<div/>')
            .prop('title', 'Open Data File')
            .addClass('open-dialog'),
        params: $.extend(true,{},params),
        rx_msg: function(result){
            console.log('msg received:', result);
            if(result.id == 'io_info'){
                var param_div = $.extend(true,{},result.io_info);
                
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
            
            if(!workspace.params.hasOwnProperty('data_sources')){
                workspace.params.data_sources = {};
            };
            workspace.data_sources=Toyz.Workspace.init_data_dialog(workspace);
            
            // Create context menu
            $.contextMenu({
                selector: '.context-menu-one', 
                callback: function(key, options) {
                    var m = "clicked: " + key;
                    console.log(m, options);
                    workspace[key]();
                },
                items: {
                    "new": {
                        name: "new",
                        items: {
                            "tile": {name: "tile", callback: function(){}},
                            "source": {name: "source", callback: function(){
                                workspace.data_sources.editing = '';
                                workspace.$new_data_div.dialog('open')}
                            }
                        }
                    },
                    "sources": {name: "Data Sources", callback: function(){
                        workspace.data_sources.$div.dialog('open');
                    }},
                    "tiles": {name:"Tiles", callback: function(){
                    }},
                    "sep1": "--------------",
                    "load_workspace": {name: "Load Workspace"},
                    "save_workspace": {name: "Save Workspace"},
                    "save_ws_as": {name: "Save Workspace as", callback: function(){
                        workspace.save_ws_as();
                    }},
                    "share_workspace": {name: "Share Workspace"},
                    "logout": {name: "Logout", callback: function(){
                        window.location = '/auth/logout/';
                    }}
                }
            });
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
                    sources: sources
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
            workspace.save_workspace({overwrite:false});
        },
        load_workspace: function(){
            var work_id = prompt("workspace name");
            workspace.websocket.send_task(
                {
                    module: 'toyz.web.tasks',
                    task: 'load_workspace',
                    parameters: {work_id: work_id}
                },
                workspace.update_workspace
            )
        },
        update_workspace: function(result){
            console.log('result:', result);
            workspace.name = result.work_id;
            workspace.data_sources.update_sources(result.settings.sources, replace=true);
            console.log('workspace after update:', workspace);
        },
        share_workspace: function(){
        }
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

console.log('workspace.js loaded');