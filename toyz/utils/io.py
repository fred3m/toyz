# Copywrite 2014 Fred Moolekamp
# License: MIT
"""
Tools to read/write files
"""

from toyz.utils import core
from toyz.utils.errors import ToyzIoError

# TODO: Finish creating the interface for pandas and astropy

return_types = ['list', 'dict']

io_modules = {
    'python': {
        # https://docs.python.org/2/library/functions.html#open
        'all': {
            'name': {
                'lbl': 'filename',
                'file_dialog': True
            },
            'mode': {
                'lbl': 'mode',
                'type': 'select',
                'options': ['r','r+','rb','w','w+','wb','a','a+','ab']
            },
        },
        'file_types': {
            'csv-like': {
                'type': 'div',
                'params': {
                    'sep': {
                        'lbl': 'separator',
                        'prop': {
                            'value' : ','
                        }
                    }
                },
            }
        }
    },
    'numpy': {
        # "http://docs.scipy.org/doc/numpy/reference/generated/numpy.load.html#numpy.load"
        'all': {
            'file': {
                'lbl': 'filename',
                'file_dialog': True
            },
            # mmap_mode should not be needed
            #'mmap_mode': {
            #    'lbl': 'mmap_mode',
            #    'type': 'select',
            #    'options': ['r','r+', 'w+', 'c']
            #}
        },
        'file_types': {
            'load': {'type':'div', 'params':{}}
        }
    },
    'pandas': {
        'all': {
            # "http://pandas.pydata.org/pandas-docs/stable/io.html"
        },
        'file_types': {
            'csv': {
                'type': 'div',
                'params': {
                    'filepath_or_buffer': {
                        'lbl': 'filename',
                        'file_dialog': True
                    }
                },
                'optional': {
                    'sep': {'lbl':'sep'},
                    'delimiter': {'lbl':'delimiter'},
                    'delim_whitespace': {'lbl':'delim_whitespace'},
                    'compression': {
                        'type': 'select',
                        'options': ['gzip', 'bz2']
                    },
                    'dialect': {'lbl':'dialect'},
                    'dtype': {'lbl': 'dtype'},
                    'header':{'lbl': 'header'},
                    'skip_blank_lines': {
                        'lbl':'skip_blank_lines',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    },
                    'skiprows': {'lbl':'skiprows'},
                    #'index_col': Not supported (or necessary)
                    'names': {'lbl':'names'},
                    'na_values': {'lbl':'na_values'}, 
                    'true_values': {'lbl':'true_values'},
                    'false_values': {'lbl': 'false_values'},
                    'keep_default_na': {
                        'lbl': 'keep_default_na',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    },
                    'parse_dates': {
                        'lbl': 'parse_dates',
                        'prop': {
                            'type': 'chekcbox',
                            'checked': True
                        }
                    },
                    'keep_date_col': {
                        'lbl': 'keep_date_col',
                        'prop': {
                            'type': 'chekcbox',
                            'checked': True
                        }
                    },
                    'date_parser': {'lbl': 'date_parser'},
                    'dayfirst': {
                        'lbl': 'dayfirst',
                        'prop': {
                            'type': 'checkbox',
                            'checked': False
                        }
                    },
                    'thousands': {'lbl': 'thousands'},
                    'lineterminator': {'lbl':'lineterminator'},
                    'quotechar': {'lbl': 'quotechar'},
                    'quoting': {
                        'lbl':'quoting',
                        'prop': {
                            'type': 'Number',
                            'value': 1
                        }
                    },
                    'skipinitialspace': {
                        'lbl': 'skipinitialspace',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    },
                    'escapechar': {'lbl':'escapechar'},
                    'comment': {'lbl': 'comment'},
                    'nrows': {
                        'lbl': 'nrows',
                        'prop': {
                            'type': 'Number',
                        }
                    },
                    'iterator': {
                        'lbl': 'iterator',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    },
                    #'chunksize': Not supported
                    'skip_footer': {
                        'lbl': 'skip_footer',
                        'prop': {
                            'type': 'Number',
                            'value': 0
                        }
                    },
                    # 'converters': Not supported,
                    'encoding': {'lbl': 'encoding'},
                    'verbose': {
                        'lbl':'verbose',
                        'prop': {
                            'type': 'checkbox',
                            'checked': False
                        }
                    },
                    #'squeeze': Not supported (or necessary)
                    'error_bad_lines': {
                        'lbl': 'error_bad_lines',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    },
                    'use_cols': {'lbl': 'use_cols'},
                    'mangle_dupe_cols': {
                        'lbl': 'mangle_dupe_cols',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    },
                    'tuplesize_cols': {
                        'lbl': 'tuplesize_cols',
                        'prop': {
                            'type': 'checkbox',
                            'checked': False
                        }
                    },
                    'float_precision': {
                        'lbl': 'float_precision',
                        'type': 'select',
                        'options': ['high', 'round_trip']
                    }
                }
            },
            'hdf': {
                'type': 'div',
                'params': {
                    'path_or_buf': {
                        'lbl': 'path_or_buf',
                        'file_dialog': True
                    },
                    'key': {
                        'lbl': 'key',
                    }
                },
                'optional': {
                    'start': {
                        'lbl': 'start',
                        'prop': {
                            'type': 'Number'
                        }
                    },
                    'stop': {
                        'lbl': 'stop',
                        'prop': {
                            'type': 'Number'
                        }
                    },
                    'columns': {'lbl': 'columns'},
                    # 'iterator': Not supported (or necessary)
                    # 'chunksize': Not supported (or necessary)
                    # 'auto_close': Not supported (or necessary)
                    'where' : {'lbl': 'where'},
                    #'mode': Not supported (or necessary)
                    'complevel': {
                        'lbl': 'complevel',
                        'prop': {
                            'type': 'Number'
                        }
                    },
                    'complib': {
                        'lbl': 'complib',
                        'type': 'select',
                        'options': ['zlib', 'bzip2', 'lzo', 'blosc']
                    },
                    'fletcher32': {
                        'lbl': 'fletcher32',
                        'prop': {
                            'type': 'checkbox',
                            'checked': False
                        }
                    }
                }
            }
        }
    },
    #'astropy': {}
}

def load_dict(dict_str, str_ok=False):
    if str_ok:
        try:
            mydict = json.loads(dict_str)
        except ValueError:
            mydict = dict_str
    else:
        my_dict = json.loads(dict_str)
    return dict_str

def load_list(csv, str_ok=False):
    if csv[0] == '[' and csv[-1] == ']':
        csv = csv[1:-1]
    my_list = csv.split(',')
    for n, val in enumerate(my_list):
        if core.is_number(val):
            if core.is_int(val):
                my_list[n] = int(n)
            else:
                my_list[n] = float(n)
    if str_ok:
        if len(my_list)==1:
            my_list = my_list[0]
    return my_list

def load_unknown(str_in, single_ok=False):
    try:
        # This will work for a dictionary or a list='[1,2,"a",...]' but not a string or a number
        # or a csv list='1,2,3,"a",...'
        val_out = json.loads(str_in)
    except (ValueError, TypeError) as e:
        if single_ok:
            if core.is_number(str_in):
                if core.is_int(str_in):
                    val_out = int(str_in)
                else:
                    val_out = float(str_in)
            else:
                val_out = str_in
        else:
            raise ToyzIoError("Toyz expected a dict or list for "+str_in)
    
    return val_out

def load_data_file(io_module, file_type, file_options, io_modules=None, 
        io_func=None, format='dict'):
    meta = ''
    if io_module == 'python':
        sep = file_options['sep']
        del file_options['sep']
        f = open(**file_options)
        raw_data = []
        if file_type == 'csv-like':
            for line in f:
                no_cr = line.split('\n')[0]
                raw_data.append(no_cr.split(sep))
        else:
            raise ToyzIoError("Invalid file type '{0}' for python open file".format(file_type))
        columns = raw_data[0]
        del raw_data[0]
        data = {col: [raw_data[m][n] for m in range(len(raw_data))] 
            for n,col in enumerate(columns)}
    elif io_module == 'numpy':
        import numpy as np
        raw_data = np.load(**file_options)
        if len(raw_data.dtype) == 0:
            columns = ['col-'+str(n) for n in range(raw_data.shape[1])]
            data = {col: raw_data[:,n].tolist() for n,col in enumerate(columns)}
        else:
            columns = raw_data.dtype.names
            data = {col: raw_data[col].tolist() for col in columns}
    elif io_module == 'pandas':
        import pandas as pd
        if file_type == 'csv':
            if 'dtype' in file_options:
                file_options['dtype'] = load_dict(file_options['dtype'], True)
            if 'header' in file_options:
                file_options['header'] = load_list(file_options['header'], True)
            if 'skiprows' in file_options:
                file_options['skiprows'] = load_list(file_options['skiprows'], True)
            if 'names' in file_options:
                file_options['names'] = load_list(file_options['names'], False)
            if 'na_values' in file_options:
                file_options['na_values'] = load_unknown(file_options['na_values'], False)
            if 'true_values' in file_options:
                file_options['true_values'] = load_list(file_options['true_values'], False)
            if 'false_values' in file_options:
                file_options['false_values'] = load_list(file_options['false_values'], False)
            if 'date_parser' in file_options:
                module = file_options['date_parser'].split('.')[0]
                func = file_options['date_parser'].split('.')[1:]
                import importlib
                module = importlib.import_module(module)
                file_options['date_parser'] = getattr(module, func)
            if 'usecols' in file_options:
                file_options['usecols'] = load_list(file_options['usecols'], False)
            df = pd.read_csv(**file_options)
        elif file_type == 'hdf':
            if 'columns' in file_options:
                file_options['columns'] = load_list(file_options['columns'], False)
            df = pd.read_hdf(**file_options)
        else:
            raise ToyzIoError("File type is not yet supported")
        columns = df.columns.values.tolist()
        #data = df.values.tolist()
        data = {col: df[col].values.tolist() for col in columns}
        
    elif io_module == 'astropy':
        response = {
            'id':'notification',
            'func': '',
            'msg': 'astropy file i/o not supported yet'
        }
                    
    elif io_modules is not None:
        if io_module not in io_modules:
            raise ToyzIoError(
                "io_module not found in toyz.utils.io.io_modules or in specified "
                "io_modules.\n Please check your module name or io_modules")
        else:
            # Code here to load data from external module
            pass
    else:
        raise ToyzIoError(
            "io_module not found in toyz.utils.io.io_modules.\n"
            "Please specify a set of alternative io_modules or check your module name")
    
    return columns, data, meta
                