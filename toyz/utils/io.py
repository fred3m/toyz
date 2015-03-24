# Copywrite 2015 Fred Moolekamp
# License: LGPLv3
"""
Tools to read/write files
"""

from toyz.utils import core
from toyz.utils.errors import ToyzIoError

# Modules and data types with API in Toyz to load data
# The keys of ``io_modules`` are the different modules available 
# (``python``, ``numpy``, ``pandas``).
# Each module also has a set of keys for each different type of file (for example
# ``csv``, ``hdf``, ``sql``, etc).
# Each of those has a ``load`` dict, which describes the load parameters,
# a ``save`` dict, which describes the save parameters,
# a ``load2save`` dict, which describes which ``load`` parameters are dropped or changed
# when saving a file, and
# a ``save2load`` dict which describes which ``save`` parameters are dropped or changed
# when the file is loaded again.
io_modules = {
    # Pure python load/save list (no external packages required)
    'python': {
        # https://docs.python.org/2/library/functions.html#open
        'csv': {
            'load': {
                'type': 'div',
                'params': {
                    'name': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                    'mode': {
                        'lbl': 'mode',
                        'type': 'select',
                        'options': ['r','r+','rb','w','w+','wb','a','a+','ab']
                    },
                    'sep': {
                        'lbl': 'separator',
                        'prop': {
                            'value' : ','
                        }
                    },
                    'columns': {
                        'lbl': 'use first row as column names',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    }
                },
            },
            'save': {
                'type': 'div',
                'params': {
                    'name': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                    'mode': {
                        'lbl': 'mode',
                        'type': 'select',
                        'options': ['r','r+','rb','w','w+','wb','a','a+','ab']
                    },
                    'sep': {
                        'lbl': 'separator',
                        'prop': {
                            'value' : ','
                        }
                    }
                },
            },
            'load2save': {
                #'ignore': ['columns'],
                'remove': [],
                'warn': {}
                'convert': {}
            },
            'save2load': {
                #'ignore': [],
                'remove': [],
                'warn': {},
                'convert': {}
            }
        }
    },
    
    # Numpy load/save ##################################################
    'numpy': {
        # "http://docs.scipy.org/doc/numpy/reference/generated/numpy.load.html#numpy.load"
        'numpy': {
            'load': {
                'type':'div', 
                'params':{
                    'file': {
                        'lbl': 'filename',
                        'file_dialog': True
                    }
                }
            }
            'save': {
                'type':'div', 
                'params':{
                    'file': {
                        'lbl': 'filename',
                        'file_dialog': True
                    }
                }
            },
            'load2save': {
                #'ignore': [],
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'save2load': {
                #'ignore': [],
                'remove': [],
                'warn': {},
                'convert': {}
            }
        }
    },
    # Pandas load/save ##################################################
    'pandas': {
        'csv': {
            # "http://pandas.pydata.org/pandas-docs/dev/generated/pandas.io.parsers.read_csv.html"
            'load': {
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
                    'delim_whitespace': {
                        'lbl':'delim_whitespace',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    },
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
                    'decimal': {'lbl': 'decimal'},
                    'lineterminator': {'lbl':'lineterminator'},
                    'quotechar': {'lbl': 'quotechar'},
                    'quoting': {'lbl':'quoting'},
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
            # "http://pandas.pydata.org/pandas-docs/dev/generated/pandas.DataFrame.to_csv.html"
            'save': {
                'type': 'div',
                'params': {
                    'path_or_buf': {
                        'lbl': 'filename',
                        'file_dialog': True
                    }
                },
                'optional': {
                    'sep': {'lbl':'sep'},
                    'na_rep': {'lbl': 'na_rep'},
                    'float_format': {'lbl': 'float_format'},
                    'columns':{'lbl': 'columns'},
                    'header':{'lbl': 'header'},
                    'index': {
                        'lbl': 'index',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    },
                    'index_label': {'lbl': 'index_label'},
                    'encoding': {
                        'lbl': 'encoding',
                        'type': 'select',
                        'options': ['ascii', 'utf-8']
                    },
                    'line_terminator': {'lbl': 'line_terminator'},
                    'quoting': {'lbl': 'quoting'},
                    'quotechar': {'lbl': 'quotechar'},
                    'doublequote': {
                        'lbl':'doublequote',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    },
                    'escapechar': {'lbl': 'escapechar'},
                    'tupleize_cols': {
                        'lbl': 'tupleize_cols',
                        'prop': {
                            'type': 'checkbox',
                            'checked': False
                        }
                    },
                    'date_format': {'lbl': 'date_format'},
                    'decimal': {'lbl': 'decimal'}
                }
            },
            'load2save': {
                #'ignore': ['float_precision', 'iterator', 'names', 'thousands', 'verbose'],
                'remove': [
                    'comment','compression','date_parser', 'dayfirst', 'delim_whitespace',
                    'delimiter', 'dialect', 'dtype', 'error_bad_lines', 'false_values',
                    'keep_date_col', 'keep_default_na', 'mangle_dupe_cols',
                    'nrows', 'parse_dates', 'skip_blank_lines', 'skip_footer', 
                    'skipinitialspace', 'skiprows', 'true_values', 'use_cols'
                ],
                'warn': {
                    'nrows': "You specified a limited number of rows when you loaded the"
                            "data, are you sure you want to save over your original data?", 
                    'use_cols': "You specified a limited number of columns when you loaded the"
                            "data, are you sure you want to save over your original data?", 
                    'compression': "You loaded your data from a compressed file. At this time"
                        "pandas does not support saving in that compressed format. Are you "
                        "sure you want to save over that file?",
                }
                'convert': {
                    'filepath_or_buffer': 'path_or_buf',
                    'lineterminator': 'line_terminator',
                    'na_values': 'na_rep'
                }
            },
            'save2load': {
                #'ignore': ['date_format', 'doublequote', 'float_format', 'index', 'index_label'],
                'remove': ['columns'],
                'warn': {
                    'columns': "You are only selecting a subset of columns to save, are you "
                        "sure you want to save over your original file?"
                },
                'convert': {
                    'path_or_buf': 'filepath_or_buffer',
                    'line_terminator': 'lineterminator',
                    'na_rep': 'na_values'
                }
            }
        },
        'hdf': {
            # "http://pandas.pydata.org/pandas-docs/dev/generated/pandas.io.pytables.read_hdf.html"
            'load': {
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
                }
            },
            # "http://pandas.pydata.org/pandas-docs/dev/generated/pandas.DataFrame.to_hdf.html"
            'save': {
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
                    'format': {
                        'lbl': 'format',
                        'type': 'select',
                        'options': ['fixed', 'table']
                    },
                    'mode': {
                        'lbl': 'mode',
                        'type': 'select',
                        'options': ['a', 'w', 'r', 'r+']
                    },
                    'append': {
                        'lbl': 'append',
                        'prop': {
                            'type': 'checkbox',
                            'checked': False
                        }
                    },
                    'complib': {
                        'lbl': 'complib',
                        'type': 'select',
                        'options': ['zlib', 'bzip2', 'izo', 'blosc']
                    },
                    'complevel': {
                        'lbl': 'complevel',
                        'type': 'select',
                        'options': range(1,10)
                    },
                    'fletcher32': {
                        'lbl': 'fletcher32',
                        'prop': {
                            'type': 'checkbox',
                            'checked': False
                        }
                    }
                }
            },
            'load2save': {
                #'ignore': [],
                'remove': ['start', 'stop', 'columns', 'where'],
                'warn': {
                    'start': "You specified a limited number of rows when you loaded the"
                            "data, are you sure you want to save over your original data?",
                    'stop': "You specified a limited number of rows when you loaded the"
                            "data, are you sure you want to save over your original data?",
                    'columns': "You specified a limited number of columns when you loaded the"
                            "data, are you sure you want to save over your original data?",
                }
                'conversion': {}
            },
            'save2load': {
                #'ignore': ['format', 'mode', 'append', 'complib', 'complevel', 'fletcher32'],
                'remove': [],
                'warn': {},
                'conversion': {}
            }
        },
        'sql': {
            # "http://pandas.pydata.org/pandas-docs/dev/generated/pandas.io.sql.read_sql.html"
            'load': {
                'type': 'div',
                'params': {
                    'con': {'lbl': 'SQLalchemy connection string'},
                    'sql': {
                        'lbl': 'SQL query or table name',
                        'db': True
                    },
                },
                'optional': {
                    'index_col': {'lbl': 'index_col'},
                    'coerce_float': {
                        'lbl': 'coerce_float',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    },
                    'parse_dates': {'lbl': 'pares_dates'},
                    'col_div': {
                        'type': 'div',
                        'legend': 'columns',
                        'params': {
                            'columns': {
                                'type': 'list',
                                'format': 'list',
                                'new_item': {
                                    'lbl': 'column name'
                                }
                            }
                        }
                    }
                }
            },
            # "http://pandas.pydata.org/pandas-docs/dev/generated/pandas.DataFrame.to_sql.html"
            'save': {
                'type': 'div',
                'params': {
                    'con': {'lbl': 'SQLalchemy connection string'},
                    'sql': {
                        'lbl': 'SQL query or table name',
                        'db': True
                    },
                },
                'optional': {
                    'schema': {'lbl': 'schema'},
                    'if_exists': {
                        'lbl': 'if_exists',
                        'type': 'select',
                        'options': ['fail', 'replace', 'append']
                    },
                    'index': {
                        'lbl': 'index',
                        'prop': {
                            'type': 'checkbox',
                            'checked': True
                        }
                    },
                    'index_label': {'lbl': 'index_label'}
                }
            },
            'load2save': {
                #'ignore': ['index_col', 'coerce_float', 'parse_dates'],
                'remove': ['columns'],
                'warn': {
                    'columns': "You specified a limited number of columns when you loaded the"
                            "data, are you sure you want to save over your original data?",
                },
                'conversion': {}
            },
            'save2load': {
                #'ignore': ['schema', 'if_exists','index', 'index_label'],
                'remove': [],
                'warn': {},
                'conversion': {}
            }
        }
    }
}

def load2save(io_module, file_type, file_options):
    """
    For most python modules, loading and saving data often use slightly different parameters,
    so this function exists to convert load parameters to save parameters.
    """
    save_options = core.merge_dict({}, file_options)
    if io_module == 'python':
        if 'column' in save_options:
            del save_options['columns']
    elif io_module == 'numpy':
        pass
    elif io_module == 'pandas':
        if file_type == 'csv':
            remove_fields = 

def save2load(io_module, file_type, file_options, warned=False):
    """
    For most python modules, loading and saving data often use slightly different parameters,
    so this function exists to convert save parameters to load parameters.
    """

def load_dict(dict_str, str_ok=False):
    """
    load a dict from a string
    """
    if str_ok:
        try:
            mydict = json.loads(dict_str)
        except ValueError:
            mydict = dict_str
    else:
        my_dict = json.loads(dict_str)
    return dict_str

def load_list(csv, str_ok=False):
    """
    load a list from a string
    """
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
    """
    load a json string with an unknown type
    """
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

def load_data_file(io_module, file_type, file_options, io_func=None):
    """
    Loads a data file using a specified python module and a set of options. Currently
    only *numpy* and *pandas* are fully supported
    
    Parameters
        io_module ( *string* ):
            - name of python module to use for i/o
        file_type ( *string* ): 
            - type of file to open (for example 'hdf', 'csv', 'npy', etc.)
            - *Note*: the ``file_type`` must be supported by the given ``io_module``
        file_options ( *dict* ): 
            - dictionary of options as specified in the ``io_module``s documentation
        io_func ( *string* , optional):
            - name of custom i/o function
            - This is used if the io_module is not one of the modules currently supported by Toyz
              (for example, astropy.table.read)
    """
    meta = ''
    # Make a copy of the file_options to use
    file_options = core.merge_dict({}, file_options)
    if io_module == 'python':
        sep = file_options['sep']
        del file_options['sep']
        use_cols = file_options['columns']
        del file_options['columns']
        f = open(**file_options)
        data = []
        if file_type == 'csv-like':
            for line in f:
                no_cr = line.split('\n')[0]
                data.append(no_cr.split(sep))
        else:
            raise ToyzIoError("Invalid file type '{0}' for python open file".format(file_type))
    elif io_module == 'numpy':
        import numpy as np
        data = np.load(**file_options)
        #data = raw_data.astype(object).fillna(fillna)
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
        elif file_type == 'sql':
            from sqlalchemy import create_engine
            engine = create_engine(file_options['connection'])
            sql = file_options['sql']
            del file_options['connection']
            del file_options['sql']
            df = pd.read_sql(sql, engine, **file_options)
        else:
            raise ToyzIoError("File type is not yet supported")
        #df = df.astype(object).fillna(fillna)
        data = df
    elif io_func is not None:
        import importlib
        try:
            module = importlib.import_module(io_module)
        except ImportError:
            raise ToyzIoError("Could not import module '"+io_module+"'")
        try:
            data = getattr(module, io_func)(**file_options)
        except AttributeError:
            raise ToyzIoError(io_module+" did not have function '"+io_func+"'")
    else:
        raise ToyzIoError(
            "io_module not found in toyz.utils.io.load_modules.\n"
            "Please specify a set of alternative io_modules or check your module name")
    return data

def save_file_data(data, io_module, file_type, file_options, io_func=None, columns=None):
    """
    Save data to a file
    """
    if io_module=='python':
        if '+' not in file_options['mode'] and 'w' not in file_options['mode']:
            file_options['mode'] = file_options['mode']+'+'
        f = open(**file_options)
        if columns is not None:
            f.write(columns)
        f.write(data)
        f.close()
    elif io_module=='numpy':
        import numpy as np
        np.save(file_options['file'], data)
    elif io_module=='pandas':
        if file_type=='csv':
            if 'columns' in file_options:
                file_options['columns'] = load_list(file_options['columns'], False)
            data.to_csv(**file_options)
        elif file_type=='hdf':
            data.to_hdf(**file_options)
        elif file_type=='sql':
            data.to_sql(**file_options)
    elif io_func is not None:
        import importlib
        try:
            module = importlib.import_module(io_module)
        except ImportError:
            raise ToyzIoError("Could not import module '"+io_module+"'")
        try:
            getattr(module, io_func)(**file_options)
        except AttributeError:
            raise ToyzIoError(io_module+" did not have function '"+io_func+"'")
    else:
        raise ToyzIoError('IO_Module is not yet supported')