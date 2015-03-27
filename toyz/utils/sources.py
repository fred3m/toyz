"""
Functions and classes for workspace data sources and image sources
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
    def __init__(self, data=None, data_type=None, data_kwargs={}, paths={}, 
        user_id='', **kwargs):
        # default settings
        if not all([k in ['data', 'meta', 'log'] for k in paths]):
            raise ToyzDataError(
                "'paths' must be a dict of file parameters with the keys "
                "'data', 'meta', 'log'")
        path_options = {
            'toyz_module': '',
            'io_module': '',
            'file_type': '',
            'file_options': {}
        }
        default_paths = {f: dict(path_options) for f in ['data', 'meta', 'log']}
        self.user_id = user_id
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
            'links': {},
            'log': [],
            'fillna': 'NaN'
        }
        options = core.merge_dict(default_options, kwargs, True)
        for k,v in options.items():
            setattr(self, k, v)
    
    def name_columns(self, columns=None):
        if columns is not None:
            self.columns = columns
        elif self.data_type=='pandas.core.frame.DataFrame':
            self.columns = self.data.columns.values.tolist()
        elif self.data_type=='numpy.ndarray':
            if len(self.data.dtype) == 0:
                columns = ['col-'+str(n) for n in range(self.data.shape[1])]
            else:
                columns = list(self.data.dtype.names)
        elif 'set_columns' in self.paths['data']['io_module']:
            module = core.get_toyz_module(
                session_vars.toyz_settings,
                self.user_id,
                self.paths['data']['set_columns']['module'])
            self.columns = getattr(module, self.paths['data']['set_columns']['fn'])(self.data)
        elif self.data_type!='list':
            raise ToyzDataError(
                'Could not recognize set_columns function for data type {0}'.format(
                    self.data_type))
        return self.columns
    
    def set_data(self, data=None, data_type=None, data_kwargs={}):
        """
        Set the data for the given source based on the data type or a user specified type
        """
        import toyz.utils.io
        self.data_type = None
        if data is None:
            if self.paths['data']['io_module']=='':
                raise ToyzDataError(
                    'You must supply a data object or file info to initialize a DataSource')
            else:
                self.data = toyz.utils.io.load_data(**self.paths['data'])
                if data_type is None:
                    self.data_type = type(self.data).__module__+'.'+type(self.data).__name__
                else:
                    self.data_type = data_type
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
                        self.data_type = 'pandas.core.frame.DataFrame'
            else:
                self.data_type = data_type
                if data_type == 'pandas.core.frame.DataFrame':
                    from pandas import DataFrame
                    self.data = DataFrame(data, **data_kwargs)
                elif data_type == 'numpy.ndarray':
                    self.data = numpy.ndarray(data, **data_kwargs)
                elif data_type == 'list':
                    self.data = list(data)
                    if 'columns' in data_kwargs:
                        self.columns = data_kwargs['columns']
                    else:
                        self.columns = ['col-'+n for n in range(len(self.data))]
                else:
                    self.data_type = None
        # If the data_type was not found in the Toyz standard data types look in 
        # user defined toyz
        if self.data_type is None:
            import toyz.utils.core
            user_modules = toyz.utils.core.get_all_user_modules(
                session_vars.toyz_settings, self.user_id)
            data_types = {}
            for module in user_modules:
                toy = toyz.utils.core.get_user_toyz(
                    session_vars.toyz_settings, self.user_id, module)
                if hasattr(toy.config.data_types):
                    for k,v in toy.config.data_types.items():
                        data_types[k] = v
            for dt, obj in data_types.items():
                if (data_type is None and obj.check_instance(data) or
                        data_type is not None and dt==data_type):
                    obj.set_data(data, data_type, data_kwargs)
                    self.data_type = dt
                    break
            if self.data_type is None:
                raise ToyzDataError(
                    "Could not find data type {0} in users approved modules".format(dt))
        # Set the column names based on the data type
        self.name_columns()
    
    def to_dict(self, columns=None):
        """
        Convert columns of a data object into a dictionary with column names as the keys
        and a python list as the values. This is useful for json encoding the dataset
        so that it can be sent to the client.
        """
        def isnan(x):
            if np.isnan(x):
                return 'NaN'
            else:
                return x
        if columns is None:
            columns = self.columns
        if self.data_type=='pandas.core.frame.DataFrame':
            data_dict = {col: self.data[col].astype(object).fillna(self.fillna).values.tolist() 
                for col in columns}
        elif self.data_type=='numpy.ndarray':
            import numpy as np
            data_dict = {col: map(isnan, data[col].tolist()) for col in columns}
        elif self.data_type=='list':
            col_indices = [self.columns.index(col) for col in columns]
            data_dict = {col: [isnan(self.data[i][col_indices[n]]) for i in range(len(self.data))] 
                for n,col in enumerate(columns)}
        else:
            data_dict = self.data_module.data_types[self.data_type].to_dict(self.data, columns)
        return data_dict
    
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
                    save_info = core.merge_dict(file_info, save_paths[data_type], True)
                else:
                    save_info = dict(file_info)
                toyz.utils.io.save_file_data(save_info['iomodule'], save_info['file_type'],
                    save_info['file_options'])

class ImageSource:
    pass

data_types = ['pandas.core.frame.DataFrame', 'numpy.ndarray', 'list']
image_types = ['fits', 'hdf', 'other']

src_types = {
    'DataSource': DataSource,
    'ImageSource': ImageSource
}