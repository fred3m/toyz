# Copyright 2014 by Fred Moolekamp
# License: MIT
"""
Database interface to sqlite
"""

from __future__ import print_function, division

import os
import sys
import json
import sqlite3

from toyz.utils.errors import ToyzDbError
from toyz.utils import db as db_utils

########################################################
# Database API Functions
########################################################

def init(**params):
    """
    Because some databases might need to have their connections initialized, every 
    database interface is require to have an init function, even if it is empty, that
    is called when the application is first opened
    """
    pass

def check_user_type(param_type, params):
    """
    Set the user_type to either user_id or group_id depending on which
    parameter is contained in ``params``
    """
    required = db_utils.param_formats[param_type]['required']
    if 'user_type' in required and 'user_type' not in params:
        if 'user_id' in params:
            params['user_type'] = 'user_id'
        elif 'group_id' in params:
            params['user_id'] = params['group_id']
            params['user_type'] = 'group_id'
            del params['group_id']
        else:
            raise ToyzDbError("Requires either user_id or group_id")
    return params

def update_param(db_settings, param_type, **params):
    """
    Update a parameter. See :py:mod:`toyz.utils.db` for more info.
    """
    db = sqlite3.connect(db_settings.path)
    param_format = db_utils.param_formats[param_type]
    tbl = param_format['tbl']
    update = param_format['update']
    required = param_format['required']
    cols = list(param_format['required'])
    
    # If the user hasn't specified a user_type, calculate it from whether or not
    # user_id or group_id was sent
    params = check_user_type(param_type, params)
    
    # Check to see if any parameters need to be converted to a jsons string
    # (ie dictionaries or lists)
    if 'json' in param_format:
        if param_format['format'] == 'single' or param_format == 'list':
            for param in param_format['json']:
                params[param] = json.dumps(params[param])
        elif param_format['format'] == 'dict':
            if param_format['get'][0] in param_format['json']:
                params[update] = {json.dumps(p):v for p,v in params[update].items()}
            if param_format['get'][1] in param_format['json']:
                params[update] = {p: json.dumps(v) for p,v in params[update].items()}
    
    values = [params[key] for key in required]
    if param_format['format'] == 'single':
        cols.append(update)
        values.append(params[update])
        sql = "replace into {0} ({1}) values ({2})".format(
            tbl, ','.join(cols), ','.join(['?' for i in cols]))
        db.execute(sql,tuple(values))
    elif param_format['format'] == 'dict':
        cols += param_format['get']
        sql = "replace into {0} ({1}) values ({2})".format(
            tbl, ','.join(cols), ','.join(['?' for i in cols]))
        for p1, p2 in params[update].items():
            pvalues = values + [p1,p2]
            db.execute(sql,tuple(pvalues))
    elif param_format['format'] == 'list':
        cols.append(param_format['get'])
        sql = "replace into {0} ({1}) values ({2})".format(
            tbl, ','.join(cols), ','.join(['?' for i in cols]))
        for val in params[update]:
            lvalues = values + [val]
            db.execute(sql,tuple(lvalues))
    
    total_changes = db.total_changes
    db.commit()
    db.close()
    return total_changes

def update_all_params(db_settings, param_type, **params):
    """
    Update all parameters. See :py:mod:`toyz.utils.db` for more info.
    """
    params = check_user_type(param_type, params)
    param_format = db_utils.param_formats[param_type]
    tbl = param_format['tbl']
    cols = list(param_format['required'])
    if param_format['format'] == 'single':
        # There is only one record for a required set of parameters, so update_param
        # is sufficient
        return update_param(db_settings, param_type, **params)
    elif param_format['format'] == 'list':
        param_dict = dict(params)
        del param_dict[param_format['update']]
        deleted = 0
        old_dict = {p:params[p] for p in param_format['required']}
        old_params = get_param(db_settings, param_type, **old_dict)
        
        # delete all of the parameters found in the database but not in the
        # new list, then update all values in the new list
        for p in old_params:
            if p not in params[param_format['update']]:
                param_dict[param_format['get']] = p
                deleted += delete_param(db_settings, param_type, **param_dict)
        # Total updates is the number of records deleted + the number of rows updated
        return update_param(db_settings, param_type, **params) + deleted
    elif param_format['format'] == 'dict':
        param_dict = dict(params)
        del param_dict[param_format['update']]
        deleted = 0
        old_dict = {p:params[p] for p in param_format['required']} 
        old_params = get_param(db_settings, param_type, **old_dict)
        
        # delete all of the parameters found in the database but not in the
        # new dict, then update all values in the new dict
        for p in old_params:
            if p not in params[param_format['update']]:
                param_dict[param_format['get'][0]] = p
                deleted += delete_param(db_settings, param_type, **param_dict)
        # Total updates is the number of records deleted + the number of rows updated
        return update_param(db_settings, param_type, **params) + deleted

def get_param(db_settings, param_type, wildcards=False, **params):
    """
    Get a parameter from the database. See :py:mod:`toyz.utils.db` for more info.
    """
    db = sqlite3.connect(db_settings.path)
    param_format = db_utils.param_formats[param_type]
    check_user_type(param_type, params)
    if param_format['format'] == 'single' or param_format['format'] == 'list':
        select = param_format['get']
    elif param_format['format'] == 'dict':
        select = ','.join(param_format['get'])
    else:
        raise ToyzDbError("Invalid format")
    
    tbl = param_format['tbl']
    condition = []
    values = []
    pvalues = []
    for p, value in params.items():
        condition.append(p)
        values.append(value)
    if wildcards:
        condition = ' like ? and '.join(condition)
        condition += ' like ?'
        sql = "select distinct {0} from {1} where {2};".format(select, tbl, condition)
    else:
        condition = '=? and '.join(condition)
        condition += '=?'
        sql = "select {0} from {1} where {2};".format(select, tbl, condition)
    cursor = db.execute(sql, tuple(values))
    results = cursor.fetchall()
    db.close()
    if param_format['format'] == 'single':
        if 'json' in param_format:
            return json.loads(results[0][0])
        else:
            return results[0][0]
    elif param_format['format'] == 'dict':
        param = {r[0]:r[1] for r in results}
        if 'json' in param_format:
            if param_format['get'][0] in param_format['json']:
                param = {json.loads(p):v for p,v in param.items()}
            if param_format['get'][1] in param_format['json']:
                param = {p: json.loads(v) for p,v in param.items()}
        return param
    elif param_format['format'] == 'list':
        if 'json' in param_format:
            return [json.loads(r[0]) for r in results]
        else:
            return [r[0] for r in results]

def delete_param(db_settings, param_type, wildcards=False, **params):
    """
    Delete a parameter entry from the database.
    See :py:mod:`toyz.utils.db` for more info.
    """
    db = sqlite3.connect(db_settings.path)
    check_user_type(param_type, params)
    param_format = db_utils.param_formats[param_type]
    tbl = param_format['tbl']
    values = []
    condition = []
    for param in params:
        values.append(params[param])
        condition.append(param)
    if wildcards:
        condition = ' like ? and '.join(condition)
        condition += ' like ?'
    else:
        condition = '=? and '.join(condition)
        condition += '=?'
    sql = "delete from {0} where {1};".format(tbl, condition)
    db.execute(sql, tuple(values))
    
    total_changes = db.total_changes
    db.commit()
    db.close()
    return total_changes

def create_toyz_database(db_settings):
    """
    Creates a new toyz database with all of the necessary tables needed.
    
    See :py:mod:`toyz.utils.db` for more info.
    """
    if os.path.isfile(db_settings.path):
        raise ToyzDbError("Database already exists")
    db = sqlite3.connect(db_settings.path)
    
    # TODO: Implement version control
    #from toyz import version
    #version = version.version
    #db.execute("create table db_info (info_key text not null, info_value text not null);")
    #db.execute("create unique index db_info_idx on db_info (info_key);")
    #db.execute("insert into db_info (info_key, info_value) values ('version',?)",(version,))
    
    db.execute("create table users ("
        "user_id text not null, "
        "user_type text not null, "
        "pwd text not null);")
    db.execute("create unique index users_idx on users (user_id, user_type);")
    
    db.execute("create table user_group_links (user_id text not null, group_id text not null);")
    db.execute("create unique index user_group_idx on user_group_links (user_id, group_id);")
    
    db.execute("create table paths ("
        "user_id text not null, "
        "user_type text not null, "
        "path text not null, "
        "permissions text not null);")
    db.execute("create unique index paths_idx on paths "
        "(user_id, user_type, path);")
    
    db.execute("create table modules ("
        "user_id text not null, "
        "user_type text not null, "
        "module text not null);")
    db.execute("create unique index modules_idx on modules (user_id, user_type, module);")
    
    db.execute("create table toyz ("
        "user_id text not null, "
        "user_type text not null, "
        "toy_id text not null, "
        "path text not null);")
    db.execute("create unique index toyz_idx on toyz (toy_id, user_id, user_type, toy_id);")
    
    db.execute("create table shortcuts ("
        "user_id text not null, "
        "short_id text not null, "
        "path text not null);")
    db.execute("create unique index shortcuts_idx on shortcuts (user_id, short_id);")
    
    db.execute("create table workspaces ("
        "user_id text not null, "
        "user_type text not null, "
        "work_id text not null, "
        "work_settings text not null);")
    db.execute("create unique index workspaces_idx on workspaces (user_id, user_type, work_id);")
    
    db.commit()
    db.close()
    print("New toyz database created at '{0}'".format(db_settings.path))

def get_all_ids(db_settings, user_type):
    """
    Get all user_ids or group_ids depending on ``user_type``.
    
    See :py:mod:`toyz.utils.db` for more info.
    """
    db = sqlite3.connect(db_settings.path)
    users = db.execute('select user_id from users where user_type=?;', (user_type,))
    users = users.fetchall()
    db.close()
    return [u[0] for u in users]

def get_path_info(db_settings, path):
    """
    Get all of the users and permissions for a given path.
    
    See :py:mod:`toyz.utils.db` for more info.
    """
    db = sqlite3.connect(db_settings.path)
    cursor = db.execute('select user_id, permissions, user_type from paths where path=?', (path,))
    all_info = cursor.fetchall()
    if len(all_info) == 0:
        return None
    user_info = {p[0]:p[1] for p in all_info if p[2]=='user_id'}
    group_info = {p[0]:p[1] for p in all_info if p[2]=='group_id'}
    return {'users': user_info, 'groups':group_info}

########################################################
# Non API Functions
########################################################

def get_table_names(db_settings):
    """
    Get a list of all tables in the database. This is not a required part of the API but
    can be very useful for debugging purposes.
    
    Parameters
        - db_settings (*object( ): Database settings
    
    Returns
        tables (*list*): List of table names in the current database
    """
    try:
        db = sqlite3.connect(db_settings.path)
        tables = db.execute("select name from sqlite_master where type='table';")
        tables = tables.fetchall()
        db.close()
    except:
        raise ToyzDbError('Error loading table names from database: {0}'.format(db_settings.path))
    return tables