// API for highcharts
// Copyright 2014 by Fred Moolekamp
// License: MIT
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
Toyz.API.Highcharts.load_dependencies = function(callback, params){
    // Check to see if highcharts loaded from the server, if not load from the web
    // Note: Highcharts has put a usage limit on its js files, so it is a good
    // idea to have the source code located on the server
    console.log('callback in api load_dependencies', callback);
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
    this.tile = params.tile;
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
            series_div: {
                type: 'div',
                legend: 'Series',
                params: {
                    series: {
                        type: 'list',
                        format: 'none',
                        items: [],
                        newItem: {
                            type: 'div',
                            init: function(new_item){
                                this.update_columns();
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
                                    options: Object.keys(this.workspace.data_sources.sources),
                                    func: {
                                        change: this.update_columns.bind(this)
                                    }
                                },
                                x: {
                                    type: 'select',
                                    lbl: 'x column',
                                    options: []
                                },
                                y: {
                                    type: 'select',
                                    lbl: 'y column',
                                    options: []
                                },
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
Toyz.API.Highcharts.Gui.prototype.update_columns = function(event){
    //var data_source = event.currentTarget.value;
    var idx = $("input:radio[ name='series' ]:checked").val();
    idx = Number(idx.split('-')[1]);
    var params = this.gui.params.params.series_div.params.series.items[idx].params;
    var data_source = params.data_source.$input.val();
    params.x.$input.empty();
    params.y.$input.empty();
    for(var col in workspace.data_sources.sources[data_source].data){
        var x_opt = $('<option/>').val(col).html(col);
        var y_opt = $('<option/>').val(col).html(col);
        params.x.$input.append(x_opt);
        params.y.$input.append(y_opt);
    };
};

Toyz.API.Highcharts.Contents = function(params){
    this.type = 'Highcharts';
    this.tile = params.tile;
    this.$tile_div = params.$tile_div;
    this.workspace = params.workspace;
    this.settings = {};
    this.selected_pts = [];
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
Toyz.API.Highcharts.Contents.prototype.rx_info = function(info_type, info){
};
Toyz.API.Highcharts.Contents.prototype.create_chart = function(settings){
    //var settings = this.param_list.getParams(this.param_list.params);
    this.settings = settings;
    console.log('chart settings', this.settings);
    var chart_params = {
        title: {text: this.settings.title},
        chart: {
            zoomType: 'xy',
            events: {}
        },
        series: [],
    };
    
    if(!(this.settings.subtitle===undefined || this.settings.subtitle=='') || this.settings.subtitle===null){
        chart_params.subtitle={text: this.settings.subtitle};
    };
    for(var i=0; i<this.settings.series.length; i++){
        var data_source = this.settings.series[i].data_source;
        var data = this.workspace.data_sources.sources[data_source].data;
        var x = this.settings.series[i].x;
        var y = this.settings.series[i].y;
        var this_data = [];
        for(var j=0; j<data[x].length; j++){
            this_data.push({
                x:data[x][j], 
                y:data[y][j],
                idx: j
            });
        };
        var marker = {};
        for(var setting in this.settings.series[i]){
            if(setting.indexOf('marker_')>-1){
                marker[setting.slice(7,setting.length)] = this.settings.series[i][setting];
            };
        };
        chart_params.series.push({
            type: this.settings.series[i].chart_type,
            name: this.settings.series[i].series_name,
            data: this_data,
            marker: marker
        });
        
        if(this.settings.selection=='selection'){
            // Change the selection behavior of a point to update other plots
            chart_params.plotOptions = {
                series: {
                    allowPointSelect: true,
                    point: {
                        events: {
                            select: function(event){
                                var point = event.currentTarget;
                                var contents = this;
                                // If user is holding down shift or ctrl (depends on system),
                                // add point to existing array, otherwise clear all selected
                                // points before adding the new point
                                if(event.accumulate){
                                    this.selected_pts.push(point.idx);
                                }else{
                                    this.selected_pts = [point.idx];
                                };
                                this.update_selected([point.idx], !event.accumulate)
                            }.bind(this)
                        }
                    }
                }
            };
            // If a range is selected, select all of the points in the range
            // TODO: Improve this algorithm to work in log(n) time using a
            // binary search
            chart_params.chart.events.selection = function(event){
                for(var s=0; s<this.series.length; s++){
                    for(var i=0; i<this.series[s].data.length; i++){
                        var point = this.series[s].data[i];
                        if (point.x > event.xAxis[0].min &&
                            point.x < event.xAxis[0].max &&
                            point.y > event.yAxis[0].min &&
                            point.y < event.yAxis[0].max
                        ){
                            point.select(true, true);
                        };
                    };
                };
                return false;
            };
        }else{
            chart_params.chart.zoomType = this.settings.selection;
        };
    };
    console.log('chart_params', chart_params);
    this.$tile_div.highcharts(chart_params);
};
Toyz.API.Highcharts.Contents.prototype.set_tile = function(settings){
    this.create_chart(settings);
};
Toyz.API.Highcharts.Contents.prototype.update_selected = function(selected_points, clear_all){
    console.log('selected points', selected_points);
};
Toyz.API.Highcharts.Contents.prototype.save = function(){
    var tile = {
        type: this.type,
        settings: this.settings
    };
    return tile;
};

console.log('Toyz Highcharts API loaded');