// settings.js
// Settings for Toyz
// Copyright 2014 by Fred Moolekamp
// License: GPLv3

Toyz.namespace('Toyz.Console.Settings');

Toyz.Console.Settings.getModuleSettings = function(params){
    var modules = {
        type: 'div',
        legend: params.legend,
        css: {
            'width': 600
        },
        params:{}
    };
    modules.params[params.param_name] = {
        type: 'list',
        format: 'list',
        newItem: {}
    };
    return modules;
}

Toyz.Console.Settings.getToyzSettings = function(params){
    var toyz = {
        type: 'div',
        legend: params.legend,
        css: {
            'width': 900
        },
        params: {}
    };
    toyz.params[params.param_name] = {
        type: 'list',
        format: 'dict',
        newItem: {
            type:'div',
            params:{
                key: {
                    lbl:'toy name'
                },
                value:{
                    lbl:'path',
                    file_dialog: params.file_dialog
                }
            }
        }
    };
    
    return toyz;
};

Toyz.Console.Settings.getThirdParty = function(params){
    var third_party = {
        type: 'div',
        legend: 'Third Party Libraries',
        params: {
            third_party: {
                type: 'list',
                format: 'dict',
                newItem: {
                    type:'div',
                    params:{
                        key: {
                            lbl:'Library name'
                        },
                        value:{
                            type: 'div',
                            params: {
                                version: {lbl: 'version'},
                                path: {
                                    lbl: 'path',
                                    file_dialog: params.file_dialog
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    return third_party;
};

Toyz.Console.Settings.getUserSettings = function(params, $user_div){
    var user_settings;
    var user_div = {
        type: 'div',
        legend: 'Users',
        params: {
            user_id: {
                type: 'select',
                options: params.users,
                func: {
                    change: function(){
                        return function(){
                            params.websocket.send_task(
                                task={
                                    module: 'toyz.web.tasks',
                                    task: 'load_user_info',
                                    parameters: {
                                        user_id: user_div.params.user_id.$input.val(),
                                        user_attr: ['groups', 'modules', 'toyz', 'paths'],
                                    }
                                },
                                callback=function(result){
                                    user_settings.setParams(
                                        user_settings.params, 
                                        result,
                                        true
                                    );
                                }
                            )
                        }
                    }(user_settings)
                }
            },
            groups_div: {
                type: 'div',
                legend: 'Groups',
                css: {
                    'width': 300
                },
                params: {
                    groups: {
                        type: 'list',
                        format: 'list',
                        newItem: {
                            type: 'select',
                            options: params.groups
                        }
                    }
                }
            },
            paths_div: {
                type: 'div',
                legend: 'Paths',
                css: {
                    'width': 900
                },
                params: {
                    paths: {
                        type: 'list',
                        format: 'dict',
                        newItem: {
                            type:'div',
                            params: {
                                value: {
                                    lbl: 'path permissions'
                                },
                                key: {
                                    lbl: 'path',
                                    file_dialog: params.file_dialog
                                }
                            }
                        }
                    }
                }
            },
            modules: Toyz.Console.Settings.getModuleSettings({
                legend:'Modules',
                param_name: 'modules'
            }),
            toyz: Toyz.Console.Settings.getToyzSettings({
                legend: 'Toyz',
                param_name: 'toyz',
                file_dialog: params.file_dialog
            }),
            reset_pwd: {
                type: 'button',
                prop: {
                    innerHTML: 'reset password'
                },
                func: {
                    click: function(){
                        console.log(user_div.params);
                        params.websocket.send_task({
                            module: 'toyz.web.tasks',
                            task: 'reset_pwd',
                            parameters: {
                                user_id: user_div.params.user_id.$input.val()
                            }
                        })
                    }
                }
            },
            delete_user: {
                type: 'button',
                prop: {
                    innerHTML: 'delete user'
                },
                func: {
                    click: function(){
                        
                    }
                }
            },
            new_user: {
                type: 'button',
                prop: {
                    innerHTML: 'new user'
                },
                func: {
                    click: function(new_user){
                        return function(){
                            new_user.params.$div.dialog('open');
                        }
                    }(params.new_user)
                }
            },
            save_user: {
                type: 'button',
                prop: {
                    innerHTML: 'save user'
                },
                func: {
                    click: function(){
                        params.websocket.send_task({
                            module: 'toyz.web.tasks',
                            task: 'save_user_info',
                            parameters: user_settings.getParams(user_settings.params)
                        })
                    }
                }
            }
        }
    };
    
    user_settings = Toyz.Gui.initParamList(
        user_div,
        options = {
            $parent: $user_div,
            default: {user_id: params.user_settings['user_id']}
        }
    )
    
    return user_settings;
}

Toyz.Console.Settings.getGroupSettings = function(params, $group_div){
    var group_settings;
    var group_div = {
        type: 'div',
        legend: 'Groups',
        params: {
            group_id: {
                type: 'select',
                options: params.groups,
                func: {
                    change: function(){
                        return function(){
                            params.websocket.send_task(
                                task={
                                    module: 'toyz.web.tasks',
                                    task: 'load_user_info',
                                    parameters: {
                                        group_id: group_div.params.group_id.$input.val(),
                                        user_attr: ['users', 'modules', 'toyz', 'paths'],
                                    }
                                },
                                callback=function(result){
                                    group_settings.setParams(
                                        group_settings.params, 
                                        result,
                                        true
                                    );
                                }
                            )
                        }
                    }(group_settings)
                }
            },
            users_div: {
                type: 'div',
                legend: 'Users',
                css: {
                    'width': 300
                },
                params: {
                    users: {
                        type: 'list',
                        format: 'list',
                        newItem: {
                            type: 'select',
                            options: params.users
                        }
                    }
                }
            },
            paths_div: {
                type: 'div',
                legend: 'Paths',
                css: {
                    'width': 900
                },
                params: {
                    paths: {
                        type: 'list',
                        format: 'dict',
                        newItem: {
                            type:'div',
                            params: {
                                value: {
                                    lbl: 'path permissions'
                                },
                                key: {
                                    lbl: 'path',
                                    file_dialog: params.file_dialog
                                }
                            }
                        }
                    }
                }
            },
            modules: Toyz.Console.Settings.getModuleSettings({
                legend:'Modules',
                param_name: 'modules'
            }),
            toyz: Toyz.Console.Settings.getToyzSettings({
                legend: 'Toyz',
                param_name: 'toyz',
                file_dialog: file_dialog
            }),
            delete_group: {
                type: 'button',
                prop: {
                    innerHTML: 'delete group'
                },
                func: {
                    click: function(){
                        
                    }
                }
            },
            new_group: {
                type: 'button',
                prop: {
                    innerHTML: 'new group'
                },
                func: {
                    click: function(new_group){
                        return function(){
                            new_group.params.$div.dialog('open');
                        }
                    }(params.new_group)
                }
            },
            save_group: {
                type: 'button',
                prop: {
                    innerHTML: 'save'
                },
                func: {
                    click: function(){
                        params.websocket.send_task({
                            module: 'toyz.web.tasks',
                            task: 'save_user_info',
                            parameters: group_settings.getParams(group_settings.params)
                        })
                    }
                }
            }
        }
    };
    
    group_settings = Toyz.Gui.initParamList(
        group_div,
        options = {
            $parent: $group_div,
            default: {group_id: result.group_settings['group_id']}
        }
    )
    
    return group_settings;
}

Toyz.Console.Settings.getAdminSettings = function(params, $admin_div){
    // unpack the congfiguration settings
    var admin_settings;
    var admin_default = {};
    var settings = ['config', 'db', 'web', 'security'];//
    for(var i=0; i<settings.length; i++){
        for(var key in result[settings[i]]){
            if(result[settings[i]].hasOwnProperty(key)){
                admin_default[key] = result[settings[i]][key];
            }
        }
    };
    
    var config_div = {
        type: 'div',
        legend: 'Toyz Configuration',
        params: {
            root_path: {
                lbl: 'toyz root path',
                prop: {
                    disabled: true
                }
            },
            config_path: {
                lbl: 'config file path',
                prop: {
                    disabled: true
                }
            }
        }
    };
    
    var db_div = {
        type: 'div',
        legend: 'Database',
        params: {
            db_type: {
                lbl:'database type',
                type:'select',
                options: {
                    sqlite: 'sqlite'
                }
            },
            db_path: {
                lbl:'db location (relative to root path)',
                file_dialog: params.file_dialog
            }
        }
    };
    
    var web_div = {
        type: 'div',
        legend: 'Web',
        params: {
            port: {
                lbl: 'default port',
                prop: {
                    type: 'Number'
                }
            },
            third_party: Toyz.Console.Settings.getThirdParty(params)
        }
    };
    
    var security_div = {
        type: 'div',
        legend: 'Security',
        params: {
            encrypt_db: {
                lbl: 'encrypt database <i>(' +
                    '<font color="red">requires SQLCipher install on server</font>,' +
                    ' not yet supported)</i>',
                prop: {
                    type: 'checkbox',
                    checked: true,
                    disabled: true
                },
            },
            user_login: {
                lbl: 'enable multiple users',
                prop: {
                    type: 'checkbox',
                    checked: false,
                }
            }
        }
    };
    
    function build_param_list(div){
        return Toyz.Gui.initParamList(
            div,
            options = {
                $parent: $admin_div,
                default: admin_default
            }
        )
    };
    
    var admin_settings = {
        config: build_param_list(config_div),
        db: build_param_list(db_div),
        web: build_param_list(web_div),
        security: build_param_list(security_div)
    };
    
    // submit button for admin div
    var $submit = $('<button/>')
        .html("Submit")
        .click(function(){
            var settings = {
                config: admin_settings.config.getParams(admin_settings.config.params),
                db: admin_settings.db.getParams(admin_settings.db.params),
                web: admin_settings.web.getParams(admin_settings.web.params),
                security: admin_settings.security.getParams(admin_settings.security.params)
            };
            for(var setting in settings){
                if(settings.hasOwnProperty(setting)){
                    delete settings[setting].conditions
                }
            }
            websocket.send_task({
                module: 'toyz.web.tasks',
                task: 'update_toyz_settings',
                parameters: settings
            });
        });
    $admin_div.append($submit);
    
    return admin_settings;
};

Toyz.Console.Settings.getAccountSettings = function(params){
    var account_settings = {
        account: {
            type: 'label',
            prop: {
                innerHTML: 'You are Logged in as <font color="red">'+params.user_id+'</font>'
            }
        },
        logout: {
            type: 'a',
            prop: {
                href: '/auth/logout/',
                innerHTML:'logout'
            },
        },
        change_pwd_btn: {
            type: 'button',
            prop: {
                innerHTML:'change password'
            },
            func:{
                click: function(change_pwd){
                    return function(){
                        change_pwd.params.$div.dialog('open');
                    }
                }(params.change_pwd)
            }
        },
        shortcuts_div: {
            type: 'div',
            legend: 'Shortcuts',
            css: {
                'width': 900
            },
            params: {
                shortcuts: {
                    type: 'list',
                    format: 'dict',
                    newItem: {
                        type:'div',
                        params: {
                            key: {
                                lbl: 'directory label'
                            },
                            value: {
                                lbl: 'path',
                                file_dialog: params.file_dialog
                            }
                        }
                    }
                }
            }
        },
    };
    
    return account_settings;
}