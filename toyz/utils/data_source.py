"""
Functions for workspace data sources
"""
# Copyright 2015 by Fred Moolekamp
# License: LGPLv3
from __future__ import print_function, division
import numpy as np
from datetime import datetime

import toyz.utils.io
from toyz.utils import core
from toyz.utils.errors import ToyzDataError
from toyz.web import session_vars

class DataSource:
    def __init__(self, data=None, data_type=None, data_kwargs={}, paths={}, **kwargs):
        # default settings
        if not all([k in ['data', 'meta', 'log'] for k in paths]):
            raise ToyzDataError(
                "'paths' must be a dict of file parameters with the keys "
                "'data', 'meta', 'log'")
        path_options = {
            'io_module': '',
            'file_type': '',
            'file_options': {}
        }
        default_paths = {f: dict(path_options) for f in ['data', 'meta', 'log']}
        self.paths = core.merge_dict(default_paths, paths)
        self.set_data(data, data_type, data_kwargs)
        default_options = {
            'selected': [],
            'meta': {
                'creation': {
                    'time': datetime.now(),
                    'software': 'unknown'
                }
            },
            'log': []
        }
        options = core.merge_dict(default_options, kwargs, True)
        for k,v in options.items():
            setattr(self, k, v)
    
    def set_columns(columns=None):
        if columns is not None:
            self.columns = columns
        elif self.data_type=='pandas.DataFrame':
            self.columns = self.data.columns.values.tolist()
        elif self.data_type=='astropy.table.Table':
            self.columns = self.data.columns.keys()
        elif self.data_type=='numpy.ndarray':
            if len(self.data.dtype) == 0:
                columns = ['col-'+str(n) for n in range(self.data.shape[1])]
            else:
                columns = list(self.data.dtype.names)
        elif 'set_columns' in self.paths['data']['io_module']:
            module = core.get_toyz_module(
                session_vars.toyz_settings,
                session_vars.tid['user_id'],
                self.paths['data']['set_columns']['module'])
            self.columns = getattr(module, self.paths['data']['set_columns']['fn'])(self.data)
        elif self.data_type!='list':
            raise ToyzDataError(
                'Could not recognize set_columns function for data type {0}'.format(
                    self.data_type))
    
    def set_data(data=None, data_type=None, data_kwargs={}):
        """
        Set the data for the given source based on the data type or a user specified type
        """
        if data is None:
            if self.paths['data']['io_module']=='':
                raise ToyzDataError(
                    'You must supply a data object or file info to initialize a DataSource')
            else:
                self.data = toyz.utils.io.load_data_file(**self.paths['data'])
        else:
            if data_type is None:
                # Attempt to detect the data_type
                if isinstance(data, np.ndarray):
                    self.data = np.ndaray(data, **data_kwargs)
                    self.data_type = 'numpy.ndarray'
                elif isinstance(data, list):
                    self.data = data
                    self.data_type = 'list'
                else:
                    # Check optional installed modules to see if data type matches
                    try:
                        from pandas import DataFrame
                        pandas_installed=True
                    except ImportError:
                        pandas_installed=False
                    if pandas_installed and isinstance(data, DataFrame):
                        self.data = DataFrame(data, **data_kwargs)
                        self.data_type = 'pandas.DataFrame'
                    else:
                        try:
                            from astropy.tables import Table
                            astropy_installed=True
                        except ImportError:
                            astropy_installed=False
                        if astropy_installed and isinstance(data, Table):
                            self.data = Table(data, **data_kwargs)
                            self.data_type = 'astropy.table.Table'
                        else:
                            self.data = data
                            self.data_type = 'unknown'
            else:
                self.data_type = data_type
                if data_type == 'pandas.DataFrame':
                    from pandas import DataFrame
                    self.data = DataFrame(data, **data_kwargs)
                elif data_type == 'astropy.table.Table':
                    from astropy import Table
                    self.data = Table(data, **data_kwargs)
                elif data_type == 'numpy.ndarray':
                    self.data = numpy.ndarray(data, **data_kwargs)
                elif data_type == 'list':
                    self.data = list(data)
                    if 'columns' in data_kwargs:
                        self.columns = data_kwargs['columns']
                    else:
                        self.columns = ['col-'+n for n in range(len(self.data))]
        
        # Set the column names based on the data type
        self.set_columns()
    
    def save(self, save_paths={}):
        """
        Save the DataSource and, if applicable, the metadata and log.
        """
        for data_type, file_info in self.paths.items():
            if (file_info['iomodule']=='' or file_info['file_type']=='' or 
                    file_info['file_options']==''):
                # It's ok to not save the log or meta data, but the user must supply file
                # path info for the data file
                if data_type == 'data':
                    raise ToyzDataError(
                        "You must supply an 'iomodule', 'file_type', and 'file_options' to save")
            else:
                if data_type in save_paths:
                    save_info = save_paths[data_type]
                    
                else:
                    
                toyz.utils.io.save_file_data(save_info['iomodule'], save_info['file_type'],
                    save_info['file_options'])