"""
Settings for 3rd party web libraries, including jquery, jquery_ui, jquery_ui_themes.
These are the defaults for any third party libraries, containing version information
and a path to the source code.
"""
# Copyright 2014 by Fred Moolekamp
# License: MIT

from __future__ import division, print_function

import os
from toyz.utils import core

jquery = {
    '2.1.0': {
        'path': 'third_party/jquery-2.1.0.min.js'
    }
}

jquery_ui = {
    '1.11.2': {
        'path': 'third_party/jquery-ui-1.11.2/jquery-ui.js'
    }
}

jquery_ui_themes = {
    '1.11.0': {
        'path': 'third_party/jquery-ui-themes-1.11.0/themes/',
        'file_name': '/jquery-ui.min.css',
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
}

graph_3d = {
    '1.2': {
        'path' : 'third_party/graph3d-1.2/graph3d-min.js'
    }
}

highcharts = {
    '3.0.10': {
        'path': 'third_party/Highcharts-3.0.10/js/highcharts.js',
        'more_path': 'third_party/Highcharts-3.0.10/js/highcharts-more.js'
    }
}