"""
Settings for 3rd party web libraries, including jquery, jquery_ui, jquery_ui_themes.
These are the packages for any third party libraries, containing version information
and a path to the source code.
"""
# Copyright 2014 by Fred Moolekamp
# License: MIT

from __future__ import division, print_function
from collections import OrderedDict

import os
from toyz.utils import core
from toyz.utils.errors import ToyzWarning, ToyzError

class ObsoleteWarning(ToyzWarning):
    def __init__(self, pkg_name):
        msg = ("You are not using the current version of '{0}'.\n"
            "If you are using an older version it may be discontinued in a future release\n"
            "If you require this version it is recommended that you save the 3rd party "
            "source code to your toyz path and modify your toyz settings "
            "(see docs for more).". format(pkg_name))
        ToyzWarning(self, msg)

def std_get_gui(pkg_name, defaults={}):
    """
    Get GUI for 3rd party packages with a standard structure (single js or css file)
    """
    pkg = packages[pkg_name]
    
    if 'version' not in defaults:
        if 'path' not in defaults:
            defaults['version'] = pkg['version']
            defaults['path'] = pkg['versions'][defaults['version']]['path']
        else:
            defaults['version'] = 'other'
    else:
        if 'path' not in defaults:
            defaults['path'] = pkg['versions'][defaults['version']]['path']
    
    versions = sorted(pkg['versions'].keys())
    param_sets = {v: {
        'type':'div',
        'params': {
            'path' : {
                'prop': {
                    'value': pkg['versions'][v]['path'],
                    'disabled': True}}}} for v in versions}
    versions.append('other')
    param_sets['other'] = {
        'type': 'div',
        'params': {
            'path': {
                'prop':{
                    'value': defaults['path']
                },
                'file_dialog': True}}}
    
    gui = {
        'pkg': {
            'type': 'conditional',
            'legend': pkg_name,
            'selector': {
                'version': {
                    'type': 'select',
                    'options': versions,
                    'prop':{
                        'value': defaults['version']
                    }
                }
            },
            'paramSets': param_sets
        }
    }
    return gui, defaults

def get_themes_gui(pkg_name, defaults):
    pass

def get_gui(defaults={}):
    """
    Create a GUI for third party module settings
    """
    gui_list = []
    for pkg_name, pkg in packages.items():
        if pkg_name not in defaults:
            defaults[pkg_name] = {}
        pkg_gui, defaults[pkg_name] = std_get_gui(pkg_name, defaults[pkg_name])
        item = {
            'type': 'div',
            'params': {
                'pkg_name': {
                    'lbl': 'Package name',
                    'prop': {
                        'disabled': True
                    }
                },
                'pkg_settings': {
                    'type': 'div',
                    'legend': 'Package Settings',
                    'params': pkg_gui
                }
            }
        }
        gui_list.append(item)
    
    gui = {
        'type': 'list',
        'format': 'none',
        'newItem': {},
        'buttons':{},
        'items': gui_list
    }
    return gui, defaults

# Default values for third party libraries
packages = {
    'jquery': {
        'version': '2.1.0',
        'versions': {
            '2.1.0': {
                'path': os.path.join(core.ROOT_DIR,'third_party','jquery', 'jquery-2.1.0'),
                'filename': 'jquery.min.js'
            }
        },
        'get_gui': std_get_gui
    },
    'jquery_ui': {
        'version': '1.11.2',
        'versions': {
            '1.11.2': {
                'path': os.path.join(core.ROOT_DIR, 'third_party','jquery-ui','jquery-ui-1.11.2'),
                'filename': 'jquery-ui.js'
            }
        },
        'get_gui': std_get_gui
    },
    'jquery_ui_themes': {
        'version': '1.11.0',
        'theme': 'redmond',
        'versions': {
            '1.11.0': {
                'path': os.path.join(core.ROOT_DIR, 'third_party','jquery-ui-themes',
                        'jquery-ui-themes-1.11.0','themes'),
                'filename': 'jquery-ui.min.css',
                'themes': [
                    'black-tie',
                    'blitzer',
                    'cupertino',
                    'dark-hive',
                    'dot-luv',
                    'eggplant',
                    'excite-bike',
                    'flick',
                    'hot-sneaks',
                    'humanity',
                    'le-frog',
                    'mint-choc',
                    'overcast',
                    'pepper-grinder',
                    'redmond',
                    'smoothness',
                    'south-street',
                    'start',
                    'sunny',
                    'swanky-purse',
                    'trontastic',
                    'ui-darkness',
                    'ui-lightness',
                    'vader'
                ]
            }
        },
        'gui': get_themes_gui
    },
    'graph_3d': {
        'version': '1.2',
        'versions': {
            '1.2': {
                'path' : os.path.join(core.ROOT_DIR,'third_party','graph3d','graph3d-1.2'),
                'filename': 'graph3d-min.js'
            }
        },
        'get_gui': std_get_gui
    },
    'highcharts': {
        'version': '3.0.10',
        'versions': {
            '3.0.10': {
                'path': os.path.join(core.ROOT_DIR,'third_party','Highcharts-3.0.10','js'),
                'filename': 'highcharts.js',
                'more_filename': 'highcharts-more.js'
            }
        },
        'get_gui': std_get_gui
    },
    'jquery-contextMenu': {
        'version': '1.6.6',
        'versions': {
            '1.6.6': {
                'path': os.path.join(core.ROOT_DIR, 'third_party', 'jquery-contextMenu',
                        'jquery-contextMenu-1.6.6'),
                'filename': 'jquery.contextMenu.js'
            }
        },
        'get_gui': std_get_gui
    }
}