// API for highcharts
// Copyright 2015 by Fred Moolekamp
// License: BSD 3-clause
Toyz.namespace('Toyz.API.Highcharts');

// Check to see if all of the API's dependencies have loaded
Toyz.API.Highcharts.dependencies_loaded = function(){
    try {
        var h = Highcharts;
        return true;
    } catch(e){
        return false;
    }
};
Toyz.API.Highcharts.load_dependencies = function(callback){
    // Check to see if highcharts loaded from the server, if not load from the web
    // Note: Highcharts has put a usage limit on its js files, so it is a good
    // idea to have the source code located on the server
    if(!Toyz.API.Highcharts.dependencies_loaded()){
        console.log('Loading Highcharts');
        $.ajax({
            type: 'GET',
            url: "/third_party/highcharts/highcharts.js",
            dataType: 'script',
            error: function(XMLHttpRequest, status, err){
                console.log("Highcharts not found on server "
                            + "loading Highcharts from external web site");
                $.ajax({
                    type: 'GET',
                    url: "https://code.highcharts.com/highcharts.js",
                    dataType: 'script',
                    error: function(){
                        alert('Unable to load highcharts from server or code.highcharts.com');
                    },
                    success: function(){
                        console.log('Highcharts successfully loaded from code.highcharts.com')
                        callback();
                    }.bind(null,callback)
                })
            }.bind(null,callback),
            success: function(){
                console.log('Highcharts loaded successfully');
                callback();
            }.bind(null,callback)
        })
    };
};

Toyz.API.Highcharts.Gui = function(params){
    this.$div = $('<div/>');
    this.$parent = params.$parent;
    this.$parent.append(this.$div);
    this.workspace = params.workspace;
    this.tile_contents = params.tile_contents;
    
    var sources = {};
    for(var src in this.workspace.sources){
        sources[src] = this.workspace.sources[src].name;
    };
    var gui = {
        type: 'div',
        params: {
            title: {
                lbl:'Title',
                prop: {
                    value: 'Plot'
                }
            },
            subtitle: {lbl: 'Subtitle'},
            selection: {
                lbl: 'Selection type',
                type: 'select',
                options: {
                    'selection': 'select points',
                    'xy': 'xy zoom',
                    'x': 'x zoom',
                    'y': 'y zoom',
                }
            },
            series_div: {
                type: 'div',
                legend: 'Series',
                params: {
                    series: {
                        type: 'list',
                        format: 'list',
                        items: [],
                        new_item: {
                            type: 'div',
                            init: function(new_item){
                                var idx = this.gui.get().series.length-1;
                                var params = this.gui.params.series.items[idx].params;
                                var data_source = params.data_source.$input.val();
                                params.data_source.$input[0].item_div = new_item;
                                var $x_input = params.x_div.params.x.$input;
                                var $y_input = params.y_div.params.y.$input;
                                this.update_columns(data_source, $x_input, $y_input);
                            }.bind(this),
                            params: {
                                chart_type: {
                                    type: 'select',
                                    options: ['scatter', 'line', 'spline', 'area', 'areaspline', 
                                                'bar', 'column', 'pie', 'polar']
                                },
                                series_name: {
                                    lbl: 'Series name',
                                    plot: {
                                        value: ''
                                    }
                                },
                                data_source: {
                                    type: 'select',
                                    lbl: 'data source',
                                    options: sources,
                                    func: {
                                        change: function(event){
                                            var item_div = event.currentTarget.item_div;
                                            var ds = item_div.params.data_source.$input.val();
                                            var $x = item_div.params.x_div.params.x.$input;
                                            var $y = item_div.params.y_div.params.y.$input;
                                            this.update_columns(ds, $x, $y)
                                        }.bind(this)
                                    }
                                },
                                x_div: {
                                    type: 'div',
                                    params: {
                                        x: {
                                            type: 'select',
                                            lbl: 'x column',
                                            options: []
                                        },
                                        x_reverse: {
                                            lbl: 'reverse x-axis',
                                            prop: {
                                                type: 'checkbox',
                                                checked: false
                                            }
                                        }
                                    },
                                    optional: {
                                        x_lbl: {lbl: 'x label'}
                                    }
                                },
                                y_div: {
                                    type: 'div',
                                    params: {
                                        y: {
                                            type: 'select',
                                            lbl: 'y column',
                                            options: []
                                        },
                                        y_reverse: {
                                            lbl: 'reverse y-axis',
                                            prop: {
                                                type: 'checkbox',
                                                checked: false
                                            }
                                        }
                                    },
                                    optional: {
                                        y_lbl: {lbl: 'y label'}
                                    }
                                },
                            },
                            optional: {
                                marker_div: {
                                    type: 'div',
                                    legend: 'Marker',
                                    params: {
                                        marker_lineWidth: {
                                            lbl: 'lineWidth',
                                            prop:{
                                                value: 1
                                            }
                                        },
                                        marker_symbol: {
                                            lbl: 'synmbol',
                                            type: 'select',
                                            options: ['circle', 'square', 'diamond', 
                                                    'triangle','triangle-down']
                                        },
                                        marker_radius: {
                                            lbl: 'radius',
                                            prop:{
                                                type: 'Number',
                                                value:4
                                            }
                                        },
                                        marker_enabled: {
                                            lbl: 'marker enabled',
                                            prop: {
                                                type: 'checkbox',
                                                checked: true
                                            }
                                        }
                                    },
                                    optional: {
                                        marker_fillColor: {
                                            lbl: 'fill color',
                                            prop: {
                                                value: 'rgba(100,10,10,.5)'
                                            }
                                        },
                                        marker_lineColor: {
                                            lbl: 'line color', 
                                            prop: {
                                                value: 'rgb(100,10,10)'
                                            }
                                        },
                                    }
                                }
                            }
                        }
                    }
                }
            },
            log_x: {
                lbl: 'log x',
                prop: {
                    type: 'checkbox',
                    checked: false
                }
            },
            log_y: {
                lbl: 'log_y',
                prop: {
                    type: 'checkbox',
                    checked: false
                }
            }
        },
        optional: {
            legend: {
                type: 'div',
                legend: 'Chart Legend',
                params: {
                    legend_align: {
                        type: 'select',
                        lbl: 'align',
                        options: ['left', 'center', 'right']
                    },
                    legend_borderWidth: {
                        lbl: 'borderWidth',
                        prop: {
                            type: 'Number',
                            value: 1
                        }
                    },
                    legend_enabled: {
                        lbl: 'enabled',
                        prop: {
                            type: 'checkbox',
                            checked: true
                        }
                    },
                    legend_floating: {
                        lbl: 'floating',
                        prop: {
                            type: 'checkbox',
                            checked: true
                        }
                    },
                    legend_layout: {
                        type: 'select', 
                        lbl: 'layout',
                        options: ['horizontal', 'vertical']
                    }
                },
                optional: {
                    legend_x: {
                        lbl: 'x',
                        prop: {
                            type: 'Number'
                        }
                    },
                    legend_y: {
                        lbl: 'y',
                        prop: {
                            type: 'Number'
                        }
                    }
                }
            },
            grid: {
                type: 'div',
                params: {
                    grid_gridLineWidth: {
                        lbl:'gridlineWidth',
                        prop: {
                            type: 'Number',
                            value: 1
                        }
                    },
                    grid_lineWidth: {
                        lbl:'lineWidth',
                        prop: {
                            type: 'Number',
                            value: 1
                        }
                    }
                }
            }
        }
    };
    this.gui = new Toyz.Gui.Gui({
        params: gui,
        $parent: this.$div
    });
};
// When the selected data source is changed, this updates the possible fields
// in the x/y columns
Toyz.API.Highcharts.Gui.prototype.update_columns = function(data_source, $x_input, $y_input){
    $x_input.empty();
    $y_input.empty();
    //console.log('data source', data_source);
    //console.log('workspace', this.workspace);
    cols = this.workspace.sources[data_source].columns.sort();
    for(var i=0; i<cols.length; i++){
        var col = cols[i];
        var x_opt = $('<option/>').val(col).html(col);
        var y_opt = $('<option/>').val(col).html(col);
        $x_input.append(x_opt);
        $y_input.append(y_opt);
    };
};

Toyz.API.Highcharts.Contents = function(params){
    this.type = 'highcharts';
    this.tile = params.tile;
    this.$tile_div = params.$tile_div;
    this.$tile_div.width(this.tile.$div.width());
    this.$tile_div.height(this.tile.$div.height());
    this.$tile_div
        .removeClass('context-menu-tile')
        .addClass('context-menu-highcharts');
    this.workspace = params.workspace;
    this.settings = {};
    this.selected_pts = [];
    this.current_point = -1;
    //create tile context menu
    $.contextMenu({
        selector: '#'+this.$tile_div.prop('id'),
        callback: function(workspace, key, options){
            workspace[key](options);
        }.bind(null, workspace),
        items: this.contextMenu_items()
    })
    
    this.$div = $('<div/>').prop('title','Edit Tile');
    this.gui_div = new Toyz.API.Highcharts.Gui({
        $parent: this.$div,
        workspace: workspace,
        tile_contents: this
    });
    this.$div.dialog({
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: false,
        width: 'auto',
        maxHeight: $(window).height(),
        position: {
            my: "left top",
            at: "center top",
            of: window
        },
        buttons: {
            Set: function(){
                var gui = this.gui_div.gui.get();
                this.set_tile(gui);
                this.$div.dialog('close');
            }.bind(this),
            Cancel: function(){
                this.$div.dialog('close');
            }.bind(this)
        }
    });
};
Toyz.API.Highcharts.Contents.prototype.contextMenu_items = function(){
    var items = $.extend(true,{
        remove: {
            name: "Remove selected points", 
            callback: function(key, options){
                this.remove_points();
            }.bind(this)
        },
        edit: {
            name: "Edit chart",
            callback: function(key, options){
                this.gui_div.gui.set_params({
                    values: this.settings,
                    set_all: false
                })
                this.$div.dialog('open');
            }.bind(this)
        },
        high_sep: "--------------",
    }, Toyz.Workspace.tile_contextMenu_items(this.workspace));
    return items;
};
Toyz.API.Highcharts.Contents.prototype.update = function(params, param_val){
    // Allow user to either pass param_name, param_val to function or
    // dictionary with multiple parameters
    if(!(param_val===undefined)){
        params = {params:param_val};
    };
    for(var param in params){
        this[param] = params[param];
    }
};
Toyz.API.Highcharts.Contents.prototype.rx_info = function(options){
    //console.log(this.tile.id, 'rx_info', options);
    var chart = this.$tile_div.highcharts();
    if(options.info_type=='select datapoints' || options.info_type=='unselect datapoints'){
        for(var s=0; s<this.settings.series.length; s++){
            if(options.hasOwnProperty('source') &&
                this.settings.series[s].data_source==options.source &&
                //(this.tile.id != options.from.tile || s!= options.from.series)
                // Highcharts changes the selected point AFTER these functions run, which
                // causes points in the same chart to be unselected. 
                this.tile.id != options.from.tile
            ){
                var points = options.info.points;
                if(this.settings.series[s].sorted){
                    points = options.info.points.map(function(v, idx){
                        return this.settings.series[s].argsort.src2series[v];
                    }.bind(this));
                };
                for(var p=0;p<points.length;p++){
                    this.current_point = points[p];
                    // If one of the series columns is null or NaN, this point will
                    // be undefined. Only select the point if it is not undefined
                    if(points[p]!==undefined){
                        if(options.info_type=='select datapoints'){
                            chart.series[s].data[points[p]].select(true, true);
                        }else{
                            chart.series[s].data[points[p]].select(false, true);
                        }
                    };
                };
            };
        };
    }else if(options.info_type=='remove datapoints'){
        this.create_chart(this.settings);
    }else if(options.info_type=='data update'){
        // Check the first series to see if the source is present
        // If it is, the data must have been updated
        // If not, the source is new
        var data_source = this.workspace.sources[options.source];
        var params = this.gui_div.gui.params.series.items[0].params;
        // The source must have been updated, so update the chart
        if(params.data_source.options.hasOwnProperty(options.source)){
            for(var s in this.settings.series){
                var plt_series = this.settings.series[s];
                if(options.hasOwnProperty('source') && plt_series.data_source==options.source){
                    if(options.hasOwnProperty('columns') &&
                            (options.columns.indexOf(plt_series.x)>-1 ||
                            options.columns.indexOf(plt_series.y)>-1)){
                        this.create_chart(this.settings);
                    }
                };
            };
            if(params.data_source.options[data_source] != data_source.name){
                delete params.data_source.options[data_source];
                params.data_source.$input.find('[value='+data_source.id+']').remove();
            }
        };
        // If the data source is a new source, or the name has changed, add it to the available sources
        if(!params.data_source.options.hasOwnProperty(data_source)){
            var $opt = $('<option/>')
                .html(data_source.name)
                .val(data_source.id);
            params.data_source.$input.append($opt);
            params.data_source.options[data_source.id] = data_source.name;
            params.data_source.$input.change();
        };
    };
};
Toyz.API.Highcharts.Contents.prototype.save = function(){
    var tile = {
        type: this.type,
        settings: this.settings
    };
    return tile;
};
Toyz.API.Highcharts.Contents.prototype.create_chart = function(settings){
    var time1 = new Date().getTime();
    this.settings = settings;
    //console.log('chart settings', this.settings);
    this.sorted_series = false;
    var chart_params = {
        title: {text: this.settings.title},
        chart: {
            zoomType: 'xy',
            events: {}
        },
        series: [],
    };
    var x_lbls = [];
    var y_lbls = [];
    
    if(!(this.settings.subtitle===undefined || 
        this.settings.subtitle=='') || 
        this.settings.subtitle===null
    ){
        chart_params.subtitle={text: this.settings.subtitle};
    };
    for(var i=0; i<this.settings.series.length; i++){
        var data_source = this.settings.series[i].data_source;
        var data = this.workspace.sources[data_source].data;
        
        //console.log('data', data);
        
        // Add data points to chart
        var x = this.settings.series[i].x;
        var y = this.settings.series[i].y;
        var this_data = new Array(data[x].length);
        var series2src = [];
        for(var j=0; j<data[x].length; j++){
            var point = {
                x:parseFloat(data[x][j]), 
                y:parseFloat(data[y][j])
            };
            this_data[j] = point;
            if(isNaN(point.x) || isNaN(point.y)){
                //console.log('remove point', point);
            }else{
                series2src.push(j);
            };
        };
        
        // Sort series data and create index to and from data_source
        series2src.sort(function(a,b){
            return this_data[a]['x']-this_data[b]['x'];
        });
        // Create the map from the data source to the series data
        // Note that for NaN values the index will be undefined. This is
        // necessary because Highcharts doesn't plot any points if there are
        // a lot of NaN values.
        var src2series = new Array(data[x].length);
        for(var j=0; j<series2src.length; j++){
            src2series[series2src[j]] = j;
        };
        
        var new_data = series2src.map(function(v, i){
            return this_data[v];
        });
        
        this_data = new_data;
        this.settings.series[i].argsort = {
            series2src: series2src,
            src2series: src2series
        };
        this.settings.series[i].sorted=true;
        
        // Label Axes
        var x_lbl = x;
        var y_lbl = y;
        if(this.settings.series[i].conditions.use_x_lbl && 
                !(this.settings.series[i].x_lbl===undefined) &&
                !(this.settings.series[i].x_lbl===null)){
            x_lbl = this.settings.series[i].x_lbl;
        };
        if(this.settings.series[i].conditions.use_y_lbl && 
                !(this.settings.series[i].y_lbl===undefined) &&
                !(this.settings.series[i].y_lbl===null)){
            y_lbl = this.settings.series[i].y_lbl;
        };
        if(x_lbls.indexOf(x_lbl)==-1){
            x_lbls.push(x_lbl);
        };
        if(y_lbls.indexOf(y_lbl)==-1){
            y_lbls.push(y_lbl);
        };
        
        var this_series = {
            type: this.settings.series[i].chart_type,
            name: this.settings.series[i].series_name,
            data: this_data,
            turboThreshold: this_data.length+10
        }
        // Add marker settings
        if(this.settings.series[i].conditions.use_marker_div){
            this_series.marker = {
                states:{
                    hover: {
                        radius: this.settings.series[i].marker_radius*1.5,
                        lineWidth: this.settings.series[i].marker_lineWidth
                    }
                }
            };
            for(var setting in this.settings.series[i]){
                if(setting.indexOf('marker_')>-1){
                    this_series.marker[setting.slice(7,setting.length)] = 
                        this.settings.series[i][setting];
                };
            };
        };
        chart_params.series.push(this_series);
        // Change the selection behavior of a point so that it updates other points
        chart_params.plotOptions = {
            series: {
                allowPointSelect: true,
                point: {
                    events: {
                        select: function(event){
                            var point = event.currentTarget;
                            var series_idx = point.series.index;
                            var point_idx = point.series.data.indexOf(point);
                            if(this.current_point!=point_idx){
                                if(this.settings.series[series_idx].sorted){
                                    point_idx = 
                                        this.settings.series[series_idx]
                                                .argsort.series2src[point_idx];
                                };
                                this.update_selected(
                                    series_idx, 
                                    [point_idx], 
                                    'select datapoints'
                                );
                            };
                            this.current_point=-1;
                        }.bind(this),
                        unselect: function(event){
                            var point = event.currentTarget;
                            var series_idx = point.series.index;
                            var point_idx = point.series.data.indexOf(point);
                            if(this.current_point!=point_idx){
                                if(this.settings.series[series_idx].sorted){
                                    point_idx = 
                                        this.settings.series[series_idx]
                                                .argsort.series2src[point_idx];
                                };
                                this.update_selected(
                                    series_idx, 
                                    [point_idx], 
                                    'unselect datapoints'
                                );
                            };
                            this.current_point=-1;
                        }.bind(this)
                    }
                }
            }
        };
        
        // By default highcharts will zoom in to a selected area. If the user has
        // instead chosen to select points, this changes the behavior.
        // The `return false` prevents the code from zooming
        if(this.settings.selection=='selection'){
            // TODO: Improve this algorithm to work in log(n) time using a
            // binary search
            chart_params.chart.events.selection = function(event){
                var selected_one = false;
                for(var s=0; s<this.series.length; s++){
                    for(var i=0; i<this.series[s].data.length; i++){
                        var point = this.series[s].data[i];
                        if (point.x > event.xAxis[0].min &&
                            point.x < event.xAxis[0].max &&
                            point.y > event.yAxis[0].min &&
                            point.y < event.yAxis[0].max
                        ){
                            if(selected_one){
                                point.select(true, true);
                            }else{
                                point.select(true, false);
                                selected_one = true;
                            }
                        };
                    };
                };
                return false;
            };
        }else{
            chart_params.chart.zoomType = this.settings.selection;
        };
    };
    // Update the labels for the chart
    if(x_lbls.length==1){
        chart_params.xAxis = {
            title: {
                text: x_lbls[0]
            }
        };
        if(settings.series[0].x_reverse){
            chart_params.xAxis.reversed = true;
        };
    }else{
        // TODO: add axis for each series
        chart_params.xAxis = {
            title: {
                text: x_lbls[0]
            }
        };
        if(settings.series[0].x_reverse){
            chart_params.xAxis.reversed = true;
        };
    };
    if(y_lbls.length==1){
        chart_params.yAxis = {
            title: {
                text: y_lbls[0]
            }
        };
        if(settings.series[0].y_reverse){
            chart_params.yAxis.reversed = true;
        };
    }else{
        //TODO: add axis for each series
        chart_params.yAxis = {
            title: {
                text: y_lbls[0]
            }
        };
        if(settings.series[0].y_reverse){
            chart_params.yAxis.reversed = true;
        };
    };
    // Set the grid
    if(settings.conditions.use_grid===true){
        for(var setting in settings){
            if(setting.indexOf('grid_')>-1){
                chart_params.xAxis[setting.slice(5,setting.length)] = settings[setting]
                chart_params.yAxis[setting.slice(5,setting.length)] = settings[setting]
            }
        }
    };
    // Log scale?
    if(settings.log_x){
        chart_params.xAxis.type = 'logarithmic'
    };
    if(settings.log_y){
        chart_params.yAxis.type = 'logarithmic'
    }
    
    // Set the legend
    if(settings.conditions.use_legend===true){
        chart_params.legend = {};
        for(var setting in settings){
            if(setting.indexOf('legend_')>-1){
                chart_params.legend[setting.slice(7,setting.length)] = settings[setting];
            }
        }
    };
    
    if(settings.hasOwnProperty('benchmark')){
        var $div = $('<div/>');
        $div.highcharts(chart_params);
        var time2 = new Date().getTime();
        return (time2-time1)/1000.0;
    };
    //console.log('chart_params', chart_params);
    this.$tile_div.highcharts(chart_params);

    var chart = this.$tile_div.highcharts();
    // Select points that have been selected in the data source
    for(var s=0; s<this.settings.series.length; s++){
        var ds = this.settings.series[s].data_source;
        var data_source = this.workspace.sources[ds];
        var points = data_source.selected;
        if(this.settings.series[s].sorted){
            points = points.map(function(v, idx){
                return this.settings.series[s].argsort.src2series[v];
            }.bind(this));
        };
        for(var p=0;p<points.length;p++){
            this.current_point = points[p];
            // If one of the series columns is null or NaN, this point will
            // be undefined. Only select the point if it is not undefined
            if(points[p]!==undefined){
                chart.series[s].data[points[p]].select(true, true);
            };
        };
    };
};
Toyz.API.Highcharts.Contents.prototype.set_tile = function(settings){
    console.log('Highcharts settings', settings);
    var params = {};
    var load_columns = false;
    this.$div.dialog('close');
    // Make sure that all of the columns in the chart have been loaded locally into the
    // DataSource object
    for(var i=0; i<settings.series.length; i++){
        var ds_name = settings.series[i].data_source;
        var data_source = this.workspace.sources[ds_name];
        if(!params.hasOwnProperty(ds_name)){
            // Load source params in case connection to server was lost
            // and the source needs to be reloaded
            var src_params = $.extend(true, {}, data_source.params);
            var toyz_module = src_params['conditions'].toyz_module;
            var io_module = src_params['conditions'].io_module;
            var file_type = src_params['conditions'].file_type;
            delete src_params['conditions']
            params[ds_name] = {
                columns: [],
                params: {
                    paths: {
                        data: {
                            toyz_module: toyz_module,
                            io_module: io_module,
                            file_type: file_type,
                            file_options: src_params
                        }
                    },
                    src_id: data_source.id,
                    src_name: data_source.name
                }
            };
        };
        if(!data_source.data.hasOwnProperty(settings.series[i].x)){
            params[ds_name].columns.push(settings.series[i].x)
            load_columns = true;
        };
        if(!data_source.data.hasOwnProperty(settings.series[i].y)){
            load_columns = true;
            params[ds_name].columns.push(settings.series[i].y)
        };
    };
    if(load_columns){
        this.workspace.$loader.dialog('open');
        websocket.send_task({
            task: {
                module: 'toyz.web.tasks',
                task: 'get_src_columns',
                parameters: params
            },
            callback: function(settings, result){
                this.workspace.$loader.dialog('close');
                for(var src in result.sources){
                    this.workspace.sources[src].update(result.sources[src]);
                };
                this.create_chart(settings);
            }.bind(this, settings)
        })
    }else{
        this.create_chart(settings);
    };
    
    this.gui_div.gui.set_params({
        values: settings,
        set_all: false
    });
};
Toyz.API.Highcharts.Contents.prototype.update_selected = 
        function(series_idx, points, info_type){
    //console.log('update selected', series_idx, points, info_type);
    var data_source = this.settings.series[series_idx].data_source;
    this.workspace.sources[data_source].rx_info({
        from: {
            tile: this.tile.id,
            series: series_idx
        },
        info_type: info_type,
        info: {
            points: points,
        }
    });
};
Toyz.API.Highcharts.Contents.prototype.remove_points = function(){
    var pts = [];
    var data = this.$tile_div.highcharts().series[0].data;
    for(var i=0;i<data.length; i++){
        if(data[i].selected){
            pts.push(i);
        }
    };
    if(this.settings.series[0].sorted){
        pts = pts.map(function(v,i){
            return this.settings.series[0].argsort.series2src[v];
        }.bind(this));
        pts.sort(function(a,b){return a-b});
    };
    
    this.workspace.sources[this.settings.series[0].data_source].rx_info({
        from: '',
        info_type: 'remove datapoints',
        info: {
            points: pts
        }
    });
}

console.log('Toyz Highcharts API loaded');