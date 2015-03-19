// settings.js
// Settings for Toyz
// Copyright 2015 by Fred Moolekamp
// License: LGPLv3

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
        new_item: {}
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
        new_item: {
            type:'div',
            params:{
                key: {
                    lbl:'toy name'
                },
                value:{
                    lbl:'path',
                    file_dialog: true
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
                new_item: {
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
                                    file_dialog: true
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    return third_party;
};
Toyz.Console.Settings.UserSettings = function(params){
    this.type = 'div';
    this.legend = 'Users';
    this.params = {
        user_id: {
            type: 'select',
            options: params.users,
            func: {
                change: function(){
                    websocket.send_task({
                        task: {
                            module: 'toyz.web.tasks',
                            task: 'load_user_info',
                            parameters: {
                                user_id: this.params.user_id.$input.val(),
                                user_attr: ['groups', 'modules', 'toyz', 'paths'],
                            }
                        },
                        callback: function(result){
                            this.gui.set_params({
                                values: result,
                                change: true,
                                set_all: true
                            });
                        }.bind(this)
                    })
                }.bind(this)
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
                    new_item: {
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
                    new_item: {
                        type:'div',
                        params: {
                            value: {
                                lbl: 'path permissions'
                            },
                            key: {
                                lbl: 'path',
                                file_dialog: true
                            }
                        }
                    }
                }
            }
        },
        modules: new Toyz.Console.Settings.getModuleSettings({
            legend:'Toyz Modules',
            param_name: 'modules'
        }),
        toyz: new Toyz.Console.Settings.getToyzSettings({
            legend: 'Toyz Paths',
            param_name: 'toyz',
            file_dialog: true
        }),
        reset_pwd: {
            type: 'button',
            prop: {
                innerHTML: 'reset password'
            },
            func: {
                click: function(){
                    websocket.send_task({
                        task: {
                            module: 'toyz.web.tasks',
                            task: 'reset_pwd',
                            parameters: {
                                user_id: this.gui.get().user_id
                            }
                        }
                    })
                }.bind(this)
            }
        },
        delete_user: {
            type: 'button',
            prop: {
                innerHTML: 'delete user'
            },
            func: {
                click: function(){
                    // TODO: Implement delete user
                }
            }
        },
        new_user: {
            type: 'button',
            prop: {
                innerHTML: 'new user'
            },
            func: {
                click: function(new_user_gui){
                    new_user_gui.root.$div.dialog('open');
                }.bind(this, params.new_user_gui)
            }
        },
        save_user: {
            type: 'button',
            prop: {
                innerHTML: 'save user'
            },
            func: {
                click: function(){
                    var params = this.gui.get();
                    delete params.conditions;
                    console.log('params before save', params);
                    websocket.send_task({
                        task: {
                            module: 'toyz.web.tasks',
                            task: 'save_user_info',
                            parameters: params
                        }
                    });
                }.bind(this)
            }
        }
    };
}
Toyz.Console.Settings.getUserSettings = function(params, $user_div){
    var user_settings = new Toyz.Console.Settings.UserSettings(params);
    var gui = new Toyz.Gui.Gui({
        params: user_settings,
        $parent: $user_div,
        default: {
            values:{
                user_id: params.user_settings['user_id']
            }
        }
    });
    return gui;
};

Toyz.Console.Settings.GroupSettings = function(params){
    this.type = 'div',
    this.legend = 'Groups',
    this.params = {
        group_id: {
            type: 'select',
            options: params.groups,
            func: {
                change: function(){
                    websocket.send_task({
                        task: {
                            module: 'toyz.web.tasks',
                            task: 'load_user_info',
                            parameters: {
                                group_id: this.params.group_id.$input.val(),
                                user_attr: ['users', 'modules', 'toyz', 'paths'],
                            }
                        },
                        callback: function(result){
                            this.gui.set_params({
                                values: result,
                                change: true,
                                set_all: true
                            });
                        }.bind(this)
                    });
                }.bind(this)
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
                    new_item: {
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
                    new_item: {
                        type:'div',
                        params: {
                            value: {
                                lbl: 'path permissions'
                            },
                            key: {
                                lbl: 'path',
                                file_dialog: true
                            }
                        }
                    }
                }
            }
        },
        modules: new Toyz.Console.Settings.getModuleSettings({
            legend:'Toyz Modules',
            param_name: 'modules'
        }),
        toyz: new Toyz.Console.Settings.getToyzSettings({
            legend: 'Toyz Paths',
            param_name: 'toyz',
            file_dialog: true
        }),
        delete_group: {
            type: 'button',
            prop: {
                innerHTML: 'delete group'
            },
            func: {
                click: function(){
                    // TODO: add delete group functionality
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
                    new_group.root.$div.dialog('open');
                }.bind(this, params.new_group)
            }
        },
        save_group: {
            type: 'button',
            prop: {
                innerHTML: 'save'
            },
            func: {
                click: function(){
                    websocket.send_task({
                        task: {
                            module: 'toyz.web.tasks',
                            task: 'save_user_info',
                            parameters: this.gui.get()
                        }
                    })
                }.bind(this)
            }
        }
    };
};

Toyz.Console.Settings.getGroupSettings = function(params, $group_div){
    var group_settings = new Toyz.Console.Settings.GroupSettings(params);
    var gui = new Toyz.Gui.Gui({
        params: group_settings,
        $parent: $group_div,
        default: {
            values:{
                group_id: params.group_settings['group_id']
            }
        }
    });
    return gui;
};

Toyz.Console.Settings.getAdminSettings = function(params, $admin_div){
    // unpack the congfiguration settings
    var admin_default = {};
    /*var settings = ['config', 'db', 'web', 'security'];//
    for(var i=0; i<settings.length; i++){
        for(var key in params[settings[i]]){
            if(params[settings[i]].hasOwnProperty(key)){
                admin_default[key] = params[settings[i]][key];
            }
        }
    };*/
    
    var config_params = {
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
    
    var db_params = {
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
                file_dialog: true
            }
        }
    };
    
    var web_params = {
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
    
    var security_params = {
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
    
    var admin_settings = {
        config: new Toyz.Gui.Gui({
            $parent:$admin_div,
            params:config_params,
            default: params.config
        }),
        db: new Toyz.Gui.Gui({
            $parent: $admin_div,
            params: db_params,
            default: params.db
        }),
        web: new Toyz.Gui.Gui({
            $parent: $admin_div,
            params: web_params,
            default: params.web
        }),
        security: new Toyz.Gui.Gui({
            $parent: $admin_div,
            params: security_params,
            default: params.security
        })
    };
    
    // submit button for admin div
    var $submit = $('<button/>')
        .html("Submit")
        .click(function(){
            var settings = {
                config: this.config.get(),
                db: this.db.get(),
                web: this.web.get(),
                security: this.security.get()
            };
            for(var setting in settings){
                delete settings[setting].conditions
            };
            websocket.send_task({
                task: {
                    module: 'toyz.web.tasks',
                    task: 'update_toyz_settings',
                    parameters: settings
                }
            });
        }.bind(admin_settings));
    $admin_div.append($submit);
    
    return admin_settings;
};

Toyz.Console.Settings.AccountSettings = function(options){
    var account_settings = {
        type: 'div',
        params: $.extend(true, {
            account: {
                type: 'label',
                prop: {
                    innerHTML: 'You are Logged in as <font color="red">'+options.user_id+'</font>'
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
                    click: function(){
                        this.root.$div.dialog('open');
                    }.bind(options.pwd_gui)
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
                        new_item: {
                            type:'div',
                            params: {
                                key: {
                                    lbl: 'directory label'
                                },
                                value: {
                                    lbl: 'path',
                                    file_dialog: true
                                }
                            }
                        }
                    }
                }
            },
            workspaces_div: {
                type: 'div',
                legend: 'Workspaces',
                css: {
                    'width': 900
                },
                params: {
                    workspace: {
                        type: 'select',
                        lbl: 'workspace',
                        options: options.workspaces.sort(),
                        func: {
                            change: function(event){
                                console.log('workspace', event.currentTarget.value);
                                websocket.send_task({
                                    task: {
                                        module: 'toyz.web.tasks',
                                        task: 'get_workspace_sharing',
                                        parameters: {
                                            work_id: event.currentTarget.value
                                        }
                                    },
                                    callback: function(result){
                                        console.log('result', result)
                                        this.gui.set_params({
                                            values: result,
                                        });
                                    }.bind(this)
                                })
                            }.bind(this)
                        }
                    },
                    ws_users_div: {
                        type: 'div',
                        legend: 'Users',
                        params: {
                            ws_users: {
                                type: 'list',
                                format: 'list',
                                new_item: {
                                    type: 'div',
                                    params: {
                                        share_id: {
                                            lbl:'user id',
                                            div_class: 'ws-user-div'
                                        },
                                        view: {
                                            lbl: 'view',
                                            div_class: 'ws-user-div',
                                            prop: {
                                                type: 'checkbox',
                                                checked: true
                                            }
                                        },
                                        modify: {
                                            lbl: 'modify',
                                            div_class: 'ws-user-div',
                                            prop: {
                                                type: 'checkbox',
                                                checked: false
                                            }
                                        },
                                        share: {
                                            lbl: 'share',
                                            div_class: 'ws-user-div',
                                            prop: {
                                                type: 'checkbox',
                                                checked: false
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    ws_groups_div: {
                        type: 'div',
                        legend: 'Groups',
                        params: {
                            ws_groups: {
                                type: 'list',
                                format: 'list',
                                new_item: {
                                    type: 'div',
                                    params: {
                                        share_id: {
                                            lbl:'group id',
                                            div_class: 'ws-user-div'
                                        },
                                        view: {
                                            lbl: 'view',
                                            div_class: 'ws-user-div',
                                            prop: {
                                                type: 'checkbox',
                                                checked: true
                                            }
                                        },
                                        modify: {
                                            lbl: 'modify',
                                            div_class: 'ws-user-div',
                                            prop: {
                                                type: 'checkbox',
                                                checked: false
                                            }
                                        },
                                        share: {
                                            lbl: 'share',
                                            div_class: 'ws-user-div',
                                            prop: {
                                                type: 'checkbox',
                                                checked: false
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    ws_delete: {
                        type: 'button',
                        prop: {
                            innerHTML: 'Delete',
                        },
                        func: {
                            click: function(event){
                                var delete_ws = confirm(
                                    'Are you sure you want to delete this workspace'
                                );
                                if(delete_ws){
                                    var settings = this.gui.get();
                                    websocket.send_task({
                                        task: {
                                            module: 'toyz.web.tasks',
                                            task: 'update_workspace',
                                            parameters: {
                                                type: 'delete',
                                                work_id: settings.workspace,
                                            }
                                        },
                                        callback: function(result){
                                            if(result.status=='success'){
                                                alert('Workspace removed successfully');
                                            };
                                        }.bind(this)
                                    })
                                };
                            }.bind(this)
                        }
                    },
                    ws_submit: {
                        type: 'button',
                        prop: {
                            innerHTML: 'Submit',
                            title: 'submit user/group workspace permissions'
                        },
                        func: {
                            click: function(event){
                                var settings = this.gui.get();
                                console.log('settings', settings);
                                var shared_users = settings.ws_users;
                                for(var i=0; i<shared_users.length;i++){
                                    delete shared_users[i].conditions;
                                };
                                var shared_groups = settings.ws_groups;
                                for(var i=0; i<shared_groups.length;i++){
                                    delete shared_groups[i].conditions;
                                };
                                websocket.send_task({
                                    task: {
                                        module: 'toyz.web.tasks',
                                        task: 'update_workspace',
                                        parameters: {
                                            type: 'update',
                                            work_id: settings.workspace,
                                            shared_users: shared_users,
                                            shared_groups: shared_groups,
                                        }
                                    },
                                    callback: function(result){
                                        if(result.msg=='success'){
                                            alert('Workspace added successfully');
                                        };
                                    }.bind(this)
                                })
                            }.bind(this)
                        }
                    }
                }
            }
        }, options.params)
    };
    
    this.gui = new Toyz.Gui.Gui({
        params: account_settings,
        $parent: options.$parent,
        default: options.default
    });
};

console.log('settings.js loaded');