// settings.js
// Settings for Toyz
// Copyright 2014 by Fred Moolekamp
// License: GPLv3

Toyz.namespace('Toyz.Console.Settings');

Toyz.Console.Settings.getAdminSettings = function(params){
    var user_names = {};
    var group_opts = {};
    for(var user_name in params.users){
        user_names[user_name] = user_name;
    };
    for(var i=0; i<params.groups.length; i++){
        group_opts[params.groups[i]] = params.groups[i];
    } ;
    console.log('group options:', group_opts);
    var admin_settings = {
        users_div: {
            type: 'div',
            legend: 'Users',
            params: {
                user: {
                    type: 'select',
                    options: user_names
                },
                user_groups: {
                    type: 'div',
                    legend: 'User Groups',
                    params: {
                        groups: {
                            type: 'list',
                            key_name: 'group-',
                            newItem: {
                                type: 'select',
                                lbl: '',
                                options: group_opts
                            }
                        }
                    }
                },
                reset_pwd: {
                    type: 'button',
                    lbl: '',
                    prop: {
                        innerHTML: 'reset password'
                    },
                    func: {
                        click: function(){
                            params.websocket.sendTask({
                                module: 'web_utils',
                                task: 'reset_pwd',
                                parameters: {
                                    userId: admin_settings.users_div.params.user.$input.val()
                                }
                            })
                        }
                    }
                },
                delete_user: {
                    type: 'button',
                    lbl: '',
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
                    lbl: '',
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
                }
            }
        }
    };
    
    return admin_settings;
};

Toyz.Console.Settings.getAccountSettings = function(params){
    var account_settings = {
        account: {
            type: 'label',
            lbl: '',
            prop: {
                innerHTML: 'You are Logged in as <font color="red">'+params.user_id+'</font>'
            }
        },
        logout: {
            type: 'a',
            lbl: '',
            prop: {
                href: '/auth/logout/',
                innerHTML:'logout'
            },
        },
        change_pwd_btn: {
            type: 'button',
            lbl: '',
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
        paths:{
            type: 'div',
            legend: 'Paths',
            css: {
                'width': 600
            },
            params: {
                paths: {
                    type: 'list',
                    radio: 'stored_dirs',
                    items: [],
                    key_name: 'path-',
                    newItem: {
                        type: 'div',
                        params: {
                            path_name: {
                                lbl:'directory label'
                            },
                            path: {
                                lbl: 'path',
                                prop: {
                                    size: 80
                                }
                            }
                        }
                    }
                },
            }
        },
        toyz:{
            type: 'div',
            legend: 'Toyz',
            css: {
                'width': 600
            },
            params: {
                toyz: {
                    type: 'list',
                    radio: 'toyz',
                    items: [],
                    key_name: 'toy-',
                    newItem: {
                        type:'div',
                        params:{
                            toy: {}
                        }
                    }
                },
            }
        }
    };
    
    return account_settings;
}

Toyz.Console.Settings.getImgViewerSettings = function(options){
    var params = {
        directory: {
            file_dialog: options.file_dialog
        },
        recursive: {
            prop: {
                type: 'checkbox',
                checked: false
            }
        },
        starts_div: {
            type: 'conditional',
            params: {
                use_starts: {
                    lbl: 'starts with',
                    prop: {
                        type: 'checkbox',
                        checked: false
                    }
                }
            },
            paramSets: {
                true: {
                    type: 'div',
                    params: {
                        starts_with: {
                            lbl: ''
                        }
                    }
                },
                false: {
                    type: 'div',
                    params: {}
                }
            }
        },
        ends_div: {
            type: 'conditional',
            params: {
                use_ends: {
                    lbl: 'ends with',
                    prop: {
                        type: 'checkbox',
                        checked: false
                    }
                }
            },
            paramSets: {
                true: {
                    type: 'div',
                    params: {
                        ends_with: {
                            lbl: ''
                        }
                    }
                },
                false: {
                    type: 'div',
                    params: {}
                }
            }
        },
        contains_div: {
            type: 'conditional',
            params: {
                use_contains: {
                    lbl: '',
                    prop: {
                        type: 'checkbox',
                        checked: false
                    }
                }
            },
            paramSets: {
                true: {
                    type: 'div',
                    params: {
                        contains: {}
                    }
                },
                false: {
                    type: 'div',
                    params: {}
                }
            }
        },
        image_ext: {
            lbl: 'image extensions',
            prop: {
                size: 60
            }
        }
    };
    
    return params;
}