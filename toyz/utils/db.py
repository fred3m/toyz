# Utilities that may be necessary for all database interfaces
# Copyright 2015 by Fred Moolekamp
# License: LGPLv3
"""
To keep Toyz database agnostic this module works as a stardard API to access 
any database interfaces written into the framework. Currently on the ``sqlite``
interface is supported. 
"""

from __future__ import print_function, division
import re
import importlib

from toyz.utils.errors import ToyzDbError

# Regex for all letters, numbers, and underscore
VALID_CHARS = '^[a-zA-z0-9_]+$'

# Types of users used in the Toyz Franework 
user_types = ['user_id', 'group_id']

# Required functions for a db interface
api_functions = [
    'init',
    'update_params',
    'get_params',
    'delete_params',
    'update_all_params',
    'get_all_ids',
    'get_path_info']

# Parameters for a Toyz User
user_fields = ['pwd', 'groups', 'paths', 'modules', 'toyz', 'shortcuts', 'workspaces']

# Parameters for a Toys Group
group_fields = ['pwd', 'users', 'paths', 'modules', 'toyz', 'workspaces']

# Formats for get/update/delete parameters functions
param_formats = {
    'pwd': {
        'get': 'pwd',
        'update': 'pwd',
        'tbl': 'users',
        'required': ['user_id', 'user_type'],
        'format': 'single',
    },
    'groups': {
        'get': 'group_id',
        'update': 'groups',
        'tbl': 'user_group_links',
        'required': ['user_id'],
        'format': 'list',
    },
    'users': {
        'get': 'user_id',
        'update': 'users',
        'tbl': 'user_group_links',
        'required': ['group_id'],
        'format': 'list',
    },
    'paths': {
        'get': ['path', 'permissions'],
        'update' : 'paths',
        'tbl': 'paths',
        'required': ['user_id', 'user_type'],
        'format': 'dict',
    },
    'modules': {
        'get': 'module',
        'update': 'modules',
        'tbl': 'modules',
        'required': ['user_id', 'user_type'],
        'format': 'list',
    },
    'toyz': {
        'get': ['toy_id', 'path'],
        'update': 'toyz',
        'tbl': 'toyz',
        'required': ['user_id', 'user_type'],
        'format': 'dict',
    },
    'shortcuts': {
        'get': ['short_id', 'path'],
        'update': 'shortcuts',
        'tbl': 'shortcuts',
        'required': ['user_id'],
        'format': 'dict',
    },
    'workspaces': {
        'get': ['work_id', 'work_settings'],
        'update': 'workspaces',
        'tbl': 'workspaces',
        'required': ['user_id', 'user_type'],
        'format': 'dict',
        'json': ['work_settings']
    },
    'ws_share_user': {
        'get': ['work_id','users'],
        'update': 'ws_share_user',
        'tbl': 'ws_share_user',
        'required': ['user_id'],
        'format': 'list',
        'json': ['users']
    },
    'ws_share_group': {
        'get': ['work_id','groups'],
        'update': 'ws_share_group',
        'tbl': 'ws_share_group',
        'required': ['user_id'],
        'format': 'dict',
        'json': ['groups']
    },
}

def check_chars(err_flag, *lists):
    """
    Check if every value in every list is alpha-numeric.
    
    Parameters
        - err_flag (*bool* ): 
            + If err_flag is True, an exception will be raised if the field is not alpha_numeric.
            + If err_flag is False, the function will return False
        - lists (*lists*): 
            + Each list in lists must be a list of strings, each one a 
              keyword to verify if it is alpha-numeric
    """
    import itertools
    keys = list(itertools.chain.from_iterable(lists))
    if not all(re.match(VALID_CHARS, key) for key in keys):
        if err_flag:
            raise ToyzDbError(
                "SQL parameters must only contain alpha-numeric characters or underscores")
        else:
            return False
    return True

def init(**params):
    """
    For some databases it might be necessary to initialize them on startup, so this function
    call ``init`` in the current database interface
    """
    db_module = importlib.import_module(db_settings.interface_name)
    return db_module.init(**params)

def create_toyz_database(db_settings):
    """
    Create a new Toyz database. This should only be done when creating a new
    instance of a Toyz application.
    """
    db_module = importlib.import_module(db_settings.interface_name)
    return db_module.create_toyz_database(db_settings)

def update_param(db_settings, param_type, **params):
    """
    Update a parameter with a single value, list of values, or dictionary.
    """
    db_module = importlib.import_module(db_settings.interface_name)
    return db_module.update_param(db_settings, param_type, **params)

def update_all_params(db_settings, param_type, **params):
    """
    Update a parameter with a single value, a list of values, or a dictionary.
    In the case of a list or a dictionary, this function also removes any entries
    in the database not contained in ``params`` .
    """
    db_module = importlib.import_module(db_settings.interface_name)
    return db_module.update_all_params(db_settings, param_type, **params)

def get_param(db_settings, param_type, **params):
    """
    Get a parameter from the database. This may be either a single value,
    dictionary, or list of values, depending on the parameter.
    """
    db_module = importlib.import_module(db_settings.interface_name)
    #print('module update in db_utils', param_formats['modules']['update'])
    return db_module.get_param(db_settings, param_type, **params)

def delete_param(db_settings, param_type, **params):
    """
    Delete a parameter from the database.
    """
    db_module = importlib.import_module(db_settings.interface_name)
    return db_module.delete_param(db_settings, param_type, **params)

def get_all_ids(db_settings, user_type):
    """
    Get all user_id's or group_id's in the database.
    """
    db_module = importlib.import_module(db_settings.interface_name)
    return db_module.get_all_ids(db_settings, user_type)

def get_path_info(db_settings, path):
    """
    Get the permissions for all users and groups for a given path.
    """
    db_module = importlib.import_module(db_settings.interface_name)
    return db_module.get_path_info(db_settings, path)

def get_table_names(db_settings):
    """
    Get the names of tables in the database (this can be useful when the user has
    changed versions)
    """
    db_module = importlib.import_module(db_settings.interface_name)
    return db_module.get_table_names(db_settings)

def get_db_info(db_settings):
    """
    Get the info for the database, including the version it was created with,
    updates made, and the latest version of toyz it was configured for
    """
    db_module = importlib.import_module(db_settings.interface_name)
    return db_module.get_db_info(db_settings)

def update_version(db_settings, params):
    """
    It may be necessary to update a database when the Toyz version changes. This function
    will be unique to each DB and describe how to implement a given version change
    """
    db_module = importlib.import_module(db_settings.interface_name)
    return db_module.update_version(db_settings, version, verstion_params)

def db_func(db_settings, func, **params):
    """
    Function from a database outside of the database API.
    """
    if func not in api_functions:
        raise ToyzDbError("Function is not part of the database interface")
    db_module = importlib.import_module(db_settings.interface_name)
    return getattr(db_settings, func)(db_settings, **params)