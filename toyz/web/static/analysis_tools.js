// Tools for analyzing data
// Copyright 2015 by Fred Moolekamp
// License: BSD 3-clause

Toyz.namespace('Toyz.Analysis');

// For now the surface plot uses Google visualization and Graph3d. 
// In the future this could/should be changed to d3.js, using code similar to the 
// Gist by Paul Brunt at https://gist.github.com/supereggbert/aff58196188816576af0

Toyz.Analysis.Histogram = function(options){
    options = $.extend(true, {
        min: 1,
        max: 100,
        step: 1,
        value: 10
    }, options);
    
    this.$div = $('<div/>');
    var elements = {
        type: 'div',
        params: {
            plot: ...,
            width: {
                type: 'slider',
                options: {
                    min: options.min,
                    max: options.max,
                    value: options.value,
                    slide: function(event, ui){
                        this.update({
                            width: ui.value
                        })
                    }.bind(this)
                }
            },
            stats: {
                type: 'div',
                legend: 'Stats',
                params: {}
            }
        }
    }
};