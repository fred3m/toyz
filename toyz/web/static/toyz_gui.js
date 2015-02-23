// Graphical user interface tools
// Copyright 2015 by Fred Moolekamp
// License: LGPLv3

Toyz.namespace('Toyz.Gui');
// Add a parameters value(s) to a params list
Toyz.Gui.get_param = function(param){
    var params = {};
    if(param.type=='div' || param.type=='conditional' || param.type=='list'){
        params = param.get();
    }else if(param.type=='input' || param.type=='select' || param.type=='slider' ||
        param.type=='slider2d'
    ){
        params[param.name] = param.get();
    }else{
        //console.log('no get for',param.name, param);
    };
    return params;
};
// Toyz.Gui.set_param current options:
// param: Toyz.Gui.Param (or similar) parameter to set
// values: dict of values, key = gui param name, value = new value
// change: whether or not to call the params 'onchange' function after being set
// set_all: if set_all===true, the param will have it's values (and options) cleared,
// even if it isn't specified in values
Toyz.Gui.set_param = function(options){
    //console.log('options', options);
    if(!options.hasOwnProperty('values')){
        throw Error("set_param must be given a 'values' key");
    };
    if(options.param.type=='div' || options.param.type=='conditional'){
        var options = $.extend(true, {}, options);
        var param = options.param;
        delete options.param;
        param.set(options);
    }else if(options.values.hasOwnProperty(options.param.name)){
        options.param.set(options.values[options.param.name], {
            change: options.change,
            set_all: options.set_all
        });
    };
};
// Base Class for gui parameters. The constructor is used to build a div that
// holds an input DOM element and it's label (if one is specified).
Toyz.Gui.Param = function(param){
    this.init(param);
    var $input=$('<'+this.type+'/>');
    var $param_div=$('<div/>');
    // If the user defines a css class for the div, include it
    if(this.hasOwnProperty('div_class')){
        $param_div.addClass(this.div_class);
    }else{
        $param_div.addClass('param_div-default');
    };
    if(this.hasOwnProperty('div_css')){
        $param_div.css(this.div_css);
    };
    // If properties for the parameter have been defined
    if(this.hasOwnProperty('prop')){
        $input.prop(this.prop);
    };
    // If css specific to the parameter are defined
    if(this.hasOwnProperty('css')){
        $input.css(this.css);
    };
    // Functions, such as 'click' or 'over'
    if(this.hasOwnProperty('func')){
        var functions=this.func;
        for(var f in functions){
            $input.on(f, functions[f]);
        };
    };
    if(this.hasOwnProperty('input_class')){
        $input.addClass(this.input_class);
    }
    // Tooltip title
    if(this.hasOwnProperty('title')){
        $param_div.prop('title',this.title);
    };
    
    // Add a label
    var $lbl=$('<label/>')
        .html(this.name)
    if(this.hasOwnProperty('lbl')){
        $lbl.html(this.lbl);
        
        if(this.hasOwnProperty('lbl_class')){
           $lbl.addClass(this.lbl_class);
        }else{
            $lbl.addClass('lbl-default');
        };
        if(this.hasOwnProperty('lbl_css')){
            $lbl.css(this.lbl_css);
        };
        $param_div.append($lbl);
    };
    $param_div.append($input);
    
    // Some parameters may have units associated with them
    // Units are given as an array, which will be converted into a
    // dropdown box if there is more than one unit in the array
    if(this.hasOwnProperty('units')){
        if(this.units.length>1){
            this.$units=$('<select/>');
            for(var i=0; i<this.units.length; i++){
                var $option=$('<option/>')
                    .html(this.units[i]);
                    this.$units.append($option);
            }
        }else{
            this.$units=$('<label/>')
                .html(this.units);
        };
        if(this.hasOwnProperty('unit_class')){
            this.$units.addClass(this.unit_class);
        };
        $param_div.append(this.$units);
    };
    this.$lbl=$lbl;
    this.$input=$input;
    
    // Special types of parameters may also be used, for example
    // a path with a button to open a file dialog
    if(this.hasOwnProperty('file_dialog')){
        //console.log('file dialog:', param);
        if(!this.hasOwnProperty('css')){
            this.$input.prop('size',80);
        };
        
        var $btn = $('<button/>')
            .html('...')
            .css('margin-left','5px');
        $btn.click(function(){
            var file_dir = '$user$';
            if(this.$input.val() != ''){
                file_dir = this.$input.val();
            };
            this.gui.file_dialog.load_directory({
                path: file_dir,
                callback: function(){
                    var path = "";
                    if(!(this.gui.file_dialog.path===null)){
                        path = this.gui.file_dialog.path;
                    };
                    if(!(this.gui.file_dialog.files.$select.val()===null)){
                        path = path + this.gui.file_dialog.files.$select.val();
                    }
                    this.$input.val(path);
                }.bind(this)
            });
        }.bind(this));
        $param_div.append($btn);
        param.$btn = $btn;
    };
    
    this.$div = $param_div;
};
Toyz.Gui.Param.prototype.init = function(param){
    for(var p in param){
        this[p] = param[p];
    };
};
// For some odd reason the value of a checkbox is not true/false as one would expect. 
// This returns the 'correct' value of an element, even if it is a checkbox. 
// This also returns a number instead of a string if the input type='number'
Toyz.Gui.Param.prototype.get = function(){
    var val;
    if(this.$input.prop('type')=='checkbox'){
        val = this.$input.prop('checked');
    }else if(this.$input.prop('type')=='number'){
        val = Number(this.$input.val());
    }else if(this.type=='button'){
        // Do nothing
    }else{
        val = this.$input.val();
    };
    if(this.hasOwnProperty('units')){
        if(this.units.length>1){
            val=[val,this.$units.val()];
        }
    };
    return val;
};
// Define separate set_param and set functions so that inherited classes
// that overwrite set will still inherit set_params (for example, see Toyz.Gui.Select)
Toyz.Gui.Param.prototype.set = function(value, options){
    this.set_param(value, options);
};
Toyz.Gui.Param.prototype.set_param = function(value, options){
    options = $.extend(true, {
        change: true
    }, options);
    var val = value;
    if(this.hasOwnProperty('units')){
        val = value[0];
        this.$units.val(value[1]);
    };
    if(this.$input.prop('type')=='checkbox'){
        this.$input.prop('checked', val);
    }else{
        this.$input.val(val);
    };
    if(options.change===true){
        this.$input.change();
    };
};

Toyz.Gui.Div = function(options){
    //console.log('options in DIV', options);
    if(!(options===undefined)){
        var param = options.param;
        this.init(param);
        
        // If a legend is given, create a fieldset to hold a group of parameters
        if(this.hasOwnProperty('legend')){
            this.$div = $('<fieldset/>');
            var $legend = $("<legend/>")
                .html(this.legend)
            if(this.hasOwnProperty('legend_class')){
                $legend.addClass(this.legend_class);
            }else{
                $legend.addClass('collapsible');
            };
            if(this.hasOwnProperty('legend_css')){
                $legend.css(this.legend_css);
            }
            this.$div.append($legend);
        }else{
            this.$div=$('<div/>');
        };

        if(this.hasOwnProperty('css')){
            this.$div.css(this.css);
        };
        if(this.hasOwnProperty('div_class')){
            this.$div.addClass(this.div_class);
        };
        // If properties for the parameter have been defined
        if(this.hasOwnProperty('prop')){
            this.$div.prop(this.prop);
        };
        // Functions, such as 'click' or 'over'
        if(this.hasOwnProperty('func')){
            var functions=this.func;
            for(var f in functions){
                this.$div[f](functions[f]);
            };
        };
        this.build_sub_params(options);
    };
};
Toyz.Gui.Div.prototype = new Toyz.Gui.Param();
Toyz.Gui.Div.prototype.constructor = Toyz.Gui.Div;
Toyz.Gui.Div.prototype.build_sub_params = function(options){
    for(var key in this.params){
        this.params[key] = this.gui.build_gui($.extend({}, options, {
            param: this.params[key],
            $parent: this.$div,
            key: key
        }));
    };
    for(var key in this.optional){
        var legend = this.optional[key].lbl;
        //delete param.optional[key].lbl;
        var opt_param = {
            type: 'conditional',
            selector: {},
            param_sets: {
                true: {
                    type: 'div',
                    params: {}
                },
                false: {type:'div', params:{}}
            }
        }
        opt_param.selector['use_'+key] = {
            lbl: 'set '+ key,
            prop: {
                type: 'checkbox',
                checked: false
            }
        }
        opt_param.param_sets[true].params[key] = this.optional[key];
        this.params[key] = this.gui.build_gui($.extend(true, {}, options, {
            param: opt_param,
            $parent: this.$div,
            key: key
        }));
    }
};
Toyz.Gui.Div.prototype.get = function(){
    var params = {conditions:{}};
    for(var p in this.params){
        params = $.extend(true, params, Toyz.Gui.get_param(this.params[p]));
    };
    //for(var p in this.optional){
    //    params = $.extend(true, params, Toyz.Gui.get_param(this.optional[p]));
    //};
    return params;
};
Toyz.Gui.Div.prototype.set = function(options){
    options = $.extend(true, {
        change: true,
        set_all: false
    },options)
    for(var p in this.params){
        Toyz.Gui.set_param($.extend(true,options, {
            param: this.params[p]
        }));
    };
    this.set_optional(options);
};
Toyz.Gui.Div.prototype.set_optional = function(options){
    for(var p in this.optional){
        var vals = options.values;
        if(options.values.hasOwnProperty('conditions')){
            vals = $.extend(true, vals, options.values.conditions);
        };
        Toyz.Gui.set_param($.extend(true, options, {
            params: this.optional[p], 
            values: vals
        }));
    };
};

Toyz.Gui.Conditional = function(options){
    Toyz.Gui.Div.call(this, options);
};
Toyz.Gui.Conditional.prototype = new Toyz.Gui.Div();
Toyz.Gui.Conditional.prototype.constructor = Toyz.Gui.Conditional;
Toyz.Gui.Conditional.prototype.build_sub_params = function(options){
    var key;
    var pVal;
    for(var p in this.selector){
        if(this.selector.hasOwnProperty(p)){
            key = p;
        };
    };
    this.selector = this.selector[key];
    if(!this.selector.hasOwnProperty('type')){
        this.selector.type = 'input';
    };
    this.selector = this.gui.build_gui($.extend({}, options, {
        param: this.selector,
        $parent: this.$div,
        key: key,
        add2root: false
    }));
    pVal = this.selector.get();
    this.selector.old_val = pVal;
    // Change the subset of parameters when the selector is changed
    this.selector.$input.change(function(){
        var old_set = this.param_sets[this.selector.old_val];
        pVal = this.selector.get();
        var new_set = this.param_sets[pVal];
        old_set.$div.css('display','none');
        new_set.$div.css('display',new_set.display);
        this.selector.old_val = pVal;
    }.bind(this));
    
    for(var pSet in this.param_sets){
        this.param_sets[pSet].$div = $('<div/>');
        this.param_sets[pSet] = this.gui.build_gui($.extend({}, options, {
            param: this.param_sets[pSet],
            $parent: this.$div,
            key: pSet,
            add2root: false
        }));
        this.param_sets[pSet].display = this.param_sets[pSet].$div.css('display');
        this.param_sets[pSet].$div.css('display','none');
    };
    
    var keyVal = this.selector.get();
    //console.log('conditional:',key,'selector:', selector, keyVal)
    var selected = this.param_sets[keyVal];
    selected.$div.css('display', selected.$div.css('display', selected.display));
};
Toyz.Gui.Conditional.prototype.get = function(){
    var params = {conditions:{}};
    var p_set = this.selector.get();
    params.conditions[this.selector.name] = p_set;
    params = $.extend(true, params, Toyz.Gui.get_param(this.param_sets[p_set]));
    return params;
};
Toyz.Gui.Conditional.prototype.set = function(options){
    if(options.values.hasOwnProperty('conditions') && 
        options.values.conditions.hasOwnProperty(this.selector.name)
    ){
        var value = options.values.conditions[this.selector.name];
        var opt = $.extend(true, {}, options);
        delete opt.values;
        this.selector.set(value, opt);
    };
    var selected = this.selector.get();
    // only set conditional values that are selected, unless select_all is true
    if(options.set_all){
        for(p in this.param_sets){
            Toyz.Gui.set_param($.extend(true,options, {
                param: this.param_sets[p]
            }));
        };
    }else if(this.param_sets.hasOwnProperty(selected)){
        Toyz.Gui.set_param($.extend(true,options, {
            param: this.param_sets[selected]
        }));
    };
    this.set_optional(options);
};

Toyz.Gui.List = function(options){
    //console.log('new list', this);
    var param = options.param;
    this.init(param);
    this.$div=$('<div/>');
    if(this.hasOwnProperty('ordered') && this.ordered==true){
        this.$list=$('<ol/>');
    }else{
        this.$list=$('<ul/>');
    };
    if(!this.hasOwnProperty('items')){
        this.items = [];
    };
    if(!this.hasOwnProperty('format')){
        this.format = 'list';
    };
    
    var $button_div=$('<div/>');
    this.$div.append(this.$list);
    this.$div.append($button_div);
    this.current_idx = 0;
    this.key_name = this.name+'-';
    
    if(!this.hasOwnProperty('buttons')){
        this.buttons={
            add:{
                type:'button',
                lbl:'',
                prop:{
                    innerHTML:'+'
                },
                div_css:{
                    float: 'left'
                },
                func:{
                    click: this.add_item.bind(this)
                }
            },
            remove:{
                type:'button',
                lbl:'',
                prop:{
                    innerHTML:'-'
                },
                div_css:{
                    float:'left'
                },
                func:{
                    click:this.remove_item.bind(this)
                }
            }
        }
    };
    var btn_idx = 0;
    for(var button in this.buttons){
        this.buttons[button] = this.gui.build_gui($.extend(true, {}, options, {
            param: this.buttons[button],
            $parent: $button_div,
            key: param.name+'-btn-'+btn_idx++,
            add2root: false
        }));
    };
};
Toyz.Gui.List.prototype = new Toyz.Gui.Param();
Toyz.Gui.List.prototype.constructor = Toyz.Gui.List;
Toyz.Gui.List.prototype.get = function(){
    var params = {conditions:{}};
    console.log('list', this);
    if(this.format == 'dict'){
        params[this.name] = {};
        for(var i=0; i<this.items.length; i++){
            var item_values = {};
            item_values = Toyz.Gui.get_param(this.items[i]);
            if(item_values.hasOwnProperty('value')){
                params[this.name][item_values.key] = item_values.value;
            }else{
                var key = item_values.key;
                delete item_values.key;
                delete item_values.conditions;
                params[this.name][key] = item_values;
            }
        };
    }else if(this.format == 'list'){
        params[this.name] = [];
        for(var i=0; i<this.items.length; i++){
            var result = Toyz.Gui.get_param(this.items[i]);
            if(result.hasOwnProperty(this.items[i].name)){
                params[this.name].push(result[this.items[i].name]);
            }else{
                params[this.name].push(result);
            };
        };
    }else if(this.format == 'custom'){
        params[this.name] = this.get_val();
    }else{
        throw Error("Invalid parameter format for list "+this.name);
    };
    //console.log('params in list', this.name, params);
    return params;
};
Toyz.Gui.List.prototype.set = function(values, options){
    // remove the old items from the list
    for(var i=0; i<this.items.length; i++){
        this.items[i].$div.remove();
    };
    this.items = [];
    this.current_idx = 0;
    if(this.format == 'dict'){
        var p_index = 0;
        for(var key in values){
            this.add_item();
            Toyz.Gui.set_param($.extend(true, options, {
                param: this.items[p_index].params.key,
                values: {key: key}
            }));
            if(typeof values[key]==='object'){
                Toyz.Gui.set_param($.extend(true, options, {
                    param: this.items[p_index].params.value,
                    values: values[key]
                }));
            }else{
                Toyz.Gui.set_param($.extend(true, options, {
                    param: this.items[p_index].params.value,
                    values: {value: values[key]}
                }));
            };
            p_index++;
        };
    }else if(this.format == 'list'){
        for(var i=0; i<values.length; i++){
            this.add_item();
            if(typeof values[i]==='object'){
                Toyz.Gui.set_param($.extend(true, options, {
                    param: this.items[i],
                    values: values[i]
                }));
            }else{
                var val = {};
                val[this.items[i].name] = values[i];
                Toyz.Gui.set_param($.extend(true, options, {
                    param: this.items[i],
                    values: val
                }));
            };
        };
    };
};
Toyz.Gui.List.prototype.add_item = function(){
    var $li = $('<li/>');
    var $radio = $('<input/>')
        .prop('type', 'radio')
        .prop('name', this.name)
        .prop('checked', true)
        .css('float','left')
    if(!(this.hasOwnProperty('items'))){
        this.items=[];
    };
    
    var new_key = this.name + '-' + this.current_idx++;
    $radio.prop('value', new_key);
    $li.prop('id', new_key);
    var new_item = $.extend(true, {}, this.newItem);
    new_item = this.gui.build_gui({
        param: new_item,
        $parent: $li,
        key: new_key,
        add2root: false
    });
    new_item.$div.prepend($radio);
    $li.append(new_item.$div);
    new_item.$radio = $radio;
    new_item.$item = $li;
    // Select the current series if any item in the div is clicked
    new_item.$div.click(function(){
        this.$radio.prop('checked', true);
    }.bind(new_item));
    this.items.push(new_item);
    this.$list.append($li);
    if(new_item.hasOwnProperty('init')){
        new_item.init(new_item);
    };
};
Toyz.Gui.List.prototype.remove_item = function(){
    if(this.items.length==0){
        return;
    };
    var item_name = $('input[name='+this.name+']:checked').val();
    var item;
    for(var i=0; i<this.items.length;i++){
        if(this.items[i].$radio.val()==item_name){
            item = i;
        }
    };
    // remove all jquery objects from the page and
    // select the previous item in the list (if it exists)
    this.items[item].$item.remove();
    this.items.splice(item,1);
    if(item>0){
        this.items[item-1].$radio.prop('checked', true);
    }else if(this.items.length>0){
        this.items[item].$radio.prop('checked', true);
    };
};
Toyz.Gui.List.prototype.get_selected_id = function(){
    return $('input[name='+this.name+']:checked').val();
};
Toyz.Gui.List.prototype.get_selected_param = function(){
    var item_name = $('input[name='+this.name+']:checked').val();
    var item;
    for(var i=0; i<this.items.length;i++){
        if(this.items[i].$radio.val()==item_name){
            item = i;
        }
    };
    return this.items[item];
};

Toyz.Gui.Select = function(param){
    Toyz.Gui.Param.call(this, param);
    
    // If the user has specified an order, use it
    if(this.hasOwnProperty('order')){
        for(var i=0; i<this.order.length; i++){
            var opt = this.order[i];
            var $option=$('<option/>')
                .html(this.options[opt])
                .val(opt)
            this.$input.append($option);
        }
    }else{
        if($.isArray(this.options)){
            for(var i=0;i<this.options.length; i++){
                var $option=$('<option/>')
                    .html(this.options[i])
                    .val(this.options[i])
                this.$input.append($option);
            }
        }else{
            for(var opt in this.options){
                var $option=$('<option/>')
                    .html(this.options[opt])
                    .val(opt)
                this.$input.append($option);
            };
        };
    };
    if(this.hasOwnProperty('default_val')){
        this.$input.val(this.default_val);
    };
};
Toyz.Gui.Select.prototype = new Toyz.Gui.Param();
Toyz.Gui.Select.prototype.constructor = Toyz.Gui.Select;
Toyz.Gui.Select.prototype.set = function(value, options){
    if(value.hasOwnProperty('options')){
        this.$input.empty();
        if($.isArray(value.options)){
            for(var i=0;i<value.options.length; i++){
                $option=$('<option/>')
                    .html(value.options[i])
                    .val(value.options[i])
                this.$input.append($option);
            }
        }else{
            for(var opt in value.options){
                $option=$('<option/>')
                    .html(value.options[opt])
                    .val(opt)
                this.$input.append($option);
            };
        };
        if(value.hasOwnProperty('value')){
            this.set_param(value.value, options);
        };
    }else{
        this.set_param(value, options);
    };
};

Toyz.Gui.Gui = function(options){
    if(!options.hasOwnProperty('$parent')){
        throw Error("Toyz Gui requires a '$parent' div to hold the parameters");
    };
    if(!options.hasOwnProperty('params')){
        throw Error("Toyz Gui requires parameters");
    };
    if(!options.params.type=='div'){
        throw Error("Toyz Gui requires the root level of the gui to be a 'div' type")
    };
    // A key to all of the parameters, so that an individual parameter can be
    // easily accessed
    for(var opt in options){
        this[opt] = options[opt];
    };
    this.params = {};
    this.events = {};
    // If a file dialog wasn't specified in options, create a file dialog for all of the
    // file parameters
    if(!this.hasOwnProperty('file_dialog')){
        this.file_dialog = new Toyz.Core.FileDialog();
    };
    this.build_gui({
        param: options.params,
        $parent: this.$parent,
        key: 'root'
    });
    this.root = this.params.root;
    if(options.hasOwnProperty('default')){
        this.set_params({values:options.default});
    };
    console.log('Toyz.Gui.Gui', this);
};
// Parse a parameter (param) to see if it is a div containing a subset of parameters
// param: parameter JSON object
// $parent: jquery object that is the parent for the new parameter
// key: name of the parameter
// add to root: whether or not to add element to the root list of parameters
// (for example, the items in a list should not be included in the root as 
// they can be retrieved by using list.items[item_key] for a Toyz.Gui.List type)
Toyz.Gui.Gui.prototype.build_gui = function(options){
    //console.log('Toyz.Gui.Gui in build', this);
    //console.log('build_gui options:', options);
    if(!options.hasOwnProperty('add2root')){
        options.add2root = true;
    };
    var param = options.param;
    //console.log('param:', key, param);
    // Check to make sure that multiple parameters don't have the same key
    //console.log('key: ',options.key);
    if(this.params.hasOwnProperty(options.key)){
        throw Error("Multiple entries found for "+options.key)
    };
    // The default type of a parameter is an input
    if(!param.hasOwnProperty('type')){
        param.type = 'input';
    };
    param.name = options.key;
    param.gui = this;
    if(param.hasOwnProperty('events')){
        for(var event in param.events){
            if(!this.events.hasOwnProperty(event)){
                this.events[event] = [];
            };
            this.events[event].push(this.events[event]);
        };
    };
    var gui_param = {};
    // Allow for custom parameters to be inserted
    //console.log('about to create param', param.name, param);
    if(param.type == 'custom'){
        if(!param.hasOwnProperty('get') && !param.__proto__.hasOwnProperty('get')){
            param.get = function(){return undefined};
        };
        if(!param.hasOwnProperty('set') && !param.__proto__.hasOwnProperty('set')){
            param.set = function(){return undefined};
        };
        gui_param = param;
    }else if(param.type=='div'){
        gui_param = new Toyz.Gui.Div(options);
    }else if(param.type=='conditional'){
        gui_param = new Toyz.Gui.Conditional(options);
    }else if(param.type=='list'){
        gui_param = new Toyz.Gui.List(options);
    }else if(param.type=='select'){
        gui_param = new Toyz.Gui.Select(param);
    }else if(param.type=='slider'){
        gui_param = new Toyz.Gui.Slider(param);
    }else if(param.type=='slider2d'){
        gui_param = new Toyz.Gui.Slider2d(param);
    }else{
        gui_param = new Toyz.Gui.Param(param);
    };
    options.$parent.append(gui_param.$div);
    if(options.add2root===true){
        //console.log('addding', gui_param.name,'to root')
        this.params[gui_param.name] = gui_param;
    }else{
        //console.log('not adding',gui_param.name, 'to root')
    };
    return gui_param;
};
Toyz.Gui.Gui.prototype.get = function(){
    var params = {conditions:{}};
    for(var param in this.params){
        if(param!='root'){
            //console.log(this.params[param].name, Toyz.Gui.get_param(this.params[param]),
            //    this.params[param]);
            params = $.extend(true, params, Toyz.Gui.get_param(this.params[param]));
        };
    };
    //console.log('parameters', params);
    return params;
};
// Toyz.Gui.set_params current options:
// values: dict of values, key = gui param name, value = new value
// change: whether or not to call the params 'onchange' function after being set
// set_all: if set_all===true, the param will have it's values (and options) cleared,
// even if it isn't specified in values
Toyz.Gui.Gui.prototype.set_params = function(options){
    if(!options.hasOwnProperty('values')){
        throw Error("You must include values to set!");
    };
    var options = $.extend(true, {
        change: true,
        set_all: false
    }, options);
    this.root.set(options);
};

// Slider control
Toyz.Gui.Slider = function(param){
    this.$div = $('<div/>');
    for(var p in param){
        this[p] = param[p];
    };
    // If the user defines a css class for the div, include it
    if(this.hasOwnProperty('div_class')){
        this.$div.addClass(this.div_class);
    };
    if(this.hasOwnProperty('div_css')){
        this.$div.css(this.div_css);
    };
    this.$inner = $('<div/>');
    this.$inner.slider($.extend(true,{
        range: false,
        min: 0,
        max: 10
    }, this.options));
    this.$div.append(this.$inner);
};
Toyz.Gui.Slider.prototype.get = function(){
    var new_val = this.$inner.slider('option', 'value');
    this.onupdate(new_val);
    return new_val;
};
Toyz.Gui.Slider.prototype.set = function(values, options){
    //this.$inner.slider('option', 'values', value);
    this.$inner.slider('option', values);
};
Toyz.Gui.Slider.prototype.onupdate = function(){};

// 2d slider control
Toyz.Gui.Slider2d = function(param){
    console.log('Slider2d param', param);
    // set default options
    this.background = undefined;
    this.width = 400;
    this.height = 200;
    this.xmin = 0;
    this.ymin = 0;
    this.xmax = 10;
    this.ymax = 10;
    this.x_value = 0;
    this.y_value = 0;
    this.x_name = 'x';
    this.y_name = 'y';
    this.cursor = {
        x: 5,
        y: 5,
        size: 5,
        fill: 'white',
        line: 'black',
        line_width: 2,
        visible: true
    };
    this.onupdate = function(){};
    // Set kwargs
    for(var opt in param){
        this[opt] = param[opt];
    };
    // Build canvas to display cursor (and background, if specified)
    this.$canvas = $('<canvas/>')
        .prop({
            width: this.width,
            height: this.height
        })
        .mousedown(function(event){
            this.mouse_down = true;
            this.set({
                cursor_event:event
            });
        }.bind(this))
        .mouseup(function(event){
            this.mouse_down = false;
        }.bind(this))
        .mousemove(function(event){
            if(this.mouse_down){
                this.set({
                    cursor_event: event
                });
            }
        }.bind(this));
    this.mouse_down = false;
    
    // Set the initial position of the cursor
    // pass x_value so that the cursor x and y will be set
    // pass xmin so that the x and y scale will be set
    this.set({
        x_value: this.x_value,
        xmin: this.xmin
    });
    
    this.$div = $('<div/>').append(this.$canvas);
};
Toyz.Gui.Slider2d.prototype.get = function(){
    result = {};
    result[this.name] = {};
    result[this.name][this.x_name] = this.x_value;
    result[this.name][this.y_name] = this.y_value;
    return result;
};
Toyz.Gui.Slider2d.prototype.set = function(values, options){
    var update_cursor = false;
    var update_values = false;
    var update_scale = false;
    
    if(values.hasOwnProperty('cursor_event')){
        var rect = this.$canvas[0].getBoundingClientRect();
        //console.log('rect',rect);
        //console.log('client X,Y: ', values.cursor_event.clientX, values.cursor_event.clientY);
        this.cursor.x = values.cursor_event.clientX-rect.left;
        this.cursor.y = values.cursor_event.clientY-rect.top;
        delete values.cursor_event;
        update_values = true;
    };
    if(values.hasOwnProperty(this.x_name)){
        this.x_value = values[this.x_name];
        delete values[this.x_name];
    };
    if(values.hasOwnProperty(this.y_name)){
        this.y_value = values[this.y_name];
        delete vvalues[this.y_name];
    };
    if(values.hasOwnProperty('x_value') || values.hasOwnProperty('y_value') ||
        values.hasOwnProperty('x_scale') || values.hasOwnProperty('y_scale') ||
        values.hasOwnProperty('xmin') || values.hasOwnProperty('xmax') ||
        values.hasOwnProperty(this.x_name) || values.hasOwnProperty(this.y_name) ||
        values.hasOwnProperty('background')
    ){
        update_cursor = true;
    };
    if(values.hasOwnProperty('xmin') || values.hasOwnProperty('xmax') ||
        values.hasOwnProperty('ymin') || values.hasOwnProperty('ymax')
    ){
        update_scale = true;
    };
    
    if(update_values===true && (update_cursor===true || update_scale===true)){
        console.log('values', values);
        throw Error("Received cursor_event and values in the same set command");
    };
    
    // Update specified values
    for(var v in values){
        this[v] = values[v];
    };
    
    // update the scale based on the bounds
    if(update_scale===true){
        this.x_scale = (this.xmax-this.xmin)/this.width;
        this.y_scale = (this.ymax-this.ymin)/this.height;
    };
    // update the cursor position and redraw it
    if(update_cursor===true){
        this.cursor.x = this.x_value/this.x_scale;
        this.cursor.y = (this.ymax-this.y_value)/this.y_scale;
        this.draw_cursor();
    };
    // Cursor moved, so update the values and notify other controls of an update
    if(update_values===true){
        this.x_value = this.cursor.x*this.x_scale;
        this.y_value = this.ymax-this.cursor.y*this.y_scale;
        this.draw_cursor();
        this.onupdate(this, values);
    };
};
Toyz.Gui.Slider2d.prototype.draw_cursor = function(){
    if(this.cursor.visible){
        var ctx=this.$canvas[0].getContext('2d');
        // fastest way to clear the canvas is to set the width = itself
        this.$canvas[0].width = this.$canvas[0].width;
        //console.log('cursor', this.cursor);
        if(!(this.background===undefined)){
            ctx.putImageData(this.background,0,0);
        };
        ctx.beginPath();
        ctx.arc(this.cursor.x,this.cursor.y,this.cursor.size,0,2*Math.PI);
        ctx.fillStyle = this.cursor.fill;
        ctx.fill();
        ctx.lineWidth = this.cursor.line_width;
        ctx.strokeStyle=this.cursor.line;
        ctx.stroke();  
    };
};

console.log('toyz_gui.js loaded');