// API for Benchmarking
// Copyright 2015 by Fred Moolekamp
// License: BSD 3-clause
Toyz.namespace('Toyz.Benchmark');

Toyz.Benchmark.Gui = function(params){
    this.$div = $('<div/>');
    this.$parent = params.$parent;
    this.$parent.append(this.$div);
    this.workspace = params.workspace;
    
    var gui = {
        type: 'div',
        params: {
            sys_info: {
                type: 'div',
                legend: 'System Info',
                params: {
                    server: {
                        lbl: 'server info',
                        type: 'textarea',
                        prop: {
                            'rows': 4,
                            'cols': 90
                        }
                    },
                    client: {
                        lbl: 'client info',
                        type: 'textarea',
                        prop: {
                            'rows': 4,
                            'cols': 90,
                            value: navigator.userAgent
                        }
                    }
                }
            },
            data_div: {
                type: 'div',
                legend: 'Data',
                params: {
                    loops: {
                        lbl: 'number of loops',
                        prop: {
                            value: 1
                        }
                    },
                    log_filename: {
                        lbl: 'log filename',
                        file_dialog: true
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