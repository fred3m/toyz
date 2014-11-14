"""
Interface to sqlite
Copyright 2014 by Fred Moolekamp
License: MIT
"""
from __future__ import print_function, division

import os
import sys
import json
import sqlite3

from toyz.utils.errors import ToyzDbError
from toyz.utils import db_utils

def init():
    """
    Because some databases might need to have their connections initialized, every 
    database interface is require to have an init function, even if it is empty, that
    is called when the application is first opened
    """
    pass

def create_database(db_settings, user, **kwargs):
    """
    Creates a new database. SQLite does not password protect its databases, so if you want
    the database itself protect (recommended in environments where the web app is shared and
    multiple users can create their own toyz) you will need to install a different database
    (mysql, postgresql, mongodb, etc) and use the appropriate interface.
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: ToyzUser
        - These have no function in the SQLite framework to create a database, but other databases
        need this information to check permissions
    kwargs: optional
        - In case other db's need additional parameters, this ensures the function will run
        properly
    """
    print('Creating database: {0}'.format(db_settings.path))
    db = sqlite3.connect(db_settings.path)
    db.commit()
    db.close()

def check_tbl_permissions(db_settings, user, table_name, permissions):
    """
    Check whether or not a user has permission to find (search), read, or write to a table.
    This prevents users from 
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: ToyzUser
    table_name: sting
        - Name of the table whose permissions are being checked
    permissions: string
        - Permissions to check
    
    Returns
    -------
    result: boolean
        - True, if the user has all of the given permissions for the table, False otherwise
    """
    # This statement ensures that the `tbl_permisions` table can be created
    if user.user_id=='admin':
        return True
    try:
        db = sqlite3.connect(db_settings.path)
        tables = db.execute("select * from tbl_permissions where table_name=?;", (table_name,))
        tables = tables.fetchall()
        if len(tables)>1:
            raise ToyzDbError("Multiple entries for {0} in tbl_permission".format(table_name))
        elif len(tables)==0:
            #raise ToyzDbError("Table {0} not found in tbl_permissions".format(table_name))
            # This may occur for tables automatically created by sqlite,
            # for example the `sqlite_sequence` table used to keep track of autoincrements
            print("Warning: table {0} not found in tbl_permissions".format(table_name))
            return False
        users = json.loads(tables[0][1])
        db.close()
        if user.user_id in users:
            user_permissions = users[user.user_id]
        else:
            user_permissions = users['*']
        for permission in permissions:
            if permission not in user_permissions:
                return False
    except:
        raise ToyzDbError('Error checking permissions')
    
    return True

def get_table_names(db_settings, user, **kwargs):
    """
    Get a list of all tables in the database
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: ToyzUser
        - Used to check which tables the user has permission to find
    kwargs: optional
        - In case other db's need additional parameters, this ensures the function will run
        properly
    
    Returns
    -------
    tables: list
        - List of table names in the current database
    """
    try:
        db = sqlite3.connect(db_settings.path)
        tables = db.execute("select name from sqlite_master where type='table';")
        tables = [t[0] for t in tables 
            if check_tbl_permissions(db_settings, user, t[0], 'f')
        ]
        db.close()
    except:
        raise ToyzDbError('Error loading table names from database: {0}'.format(db_settings.path))
    return tables

def create_index(db_settings, user, table_name, idx_name, columns, **kwargs):
    """
    Create an index for a subset of columns in a table
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: ToyzUser
    table_name: string
        - name of table to be created
    columns: list of strings
        - Column names to be indexed
    kwargs: optional
        - In case other db's need additional parameters, this ensures the function will run
        properly
    """
    
    db = sqlite3.connect(db_settings.path)
    db_utils.check_chars(True, [table_name, idx_name], columns)
    db.execute("create index {0} on {1} ({2});".format(idx_name, table_name, ', '.join(columns)))
    db.commit()
    db.close()

def insert_rows(db_settings, user, table_name, columns, rows, **kwargs):
    """
    Insert a new row into an existing table
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: ToyzUser
    table_name: string
        - Name of the table
    columns: list of strings
        - Columns to be updated
    rows: list of tuples
        - Each tuple is a row and must have the same size as the number of columns
    kwargs: optional
        - In case other db's need additional parameters, this ensures the function will run
        properly
    """
    if not check_tbl_permissions(db_settings, user, table_name, 'w'):
        raise ToyzDbError("User does not have permission to write to this table")
    db = sqlite3.connect(db_settings.path)
    db_utils.check_chars(True, [table_name], columns)
    
    col_names = ', '.join(columns)
    row_values = ', '.join(('('+', '.join(('?' for col in row))+')' for row in rows))
    
    insert_str = "insert into {0} ({1}) values {2};".format(table_name, col_names, row_values)
    
    db.execute(insert_str, tuple([col for row in rows for col in row]))
    db.commit()
    db.close()
    
def update_row():
    pass

def create_table(db_settings, user, table_name, columns, keys=[], indices={}, 
                    users={'*':''}, **kwargs):
    """
    Create a table. This is a bit of a hack, since as of this time creating a table using parameter
    substitution in sqlite is unsupported. This means that without limitations the database is open
    to an injection attack (see http://xkcd.com/327/ and https://docs.python.org/3.3/library/sqlite3.html).
    As a result, we limit table names and column names to alpha-numeric strings only (a-z, 0-9).
    
    It would be nice to come up with a more thorough solution in the future that allows for spaces, 
    punctuation, and special characters for columns, as in general those are allowed.
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: ToyzUser
    table_name: string
        - name of table to be created
    column_prop: dict of lists
        - Keys are the names of the columns to be created. The values are dictionaries that contain the
        The value of each entry is a list of keywords for the column, beginning with the column
        datatype (see https://www.sqlite.org/datatype3.html). SQLite converts unsupported (but common)
        datatypes into supported datatypes (null, integer, real, text, blob).
        Note: you should use an OrderedDict (from the collections module) to preserve the order of the 
        columns in the table. For example:
        columns = OrderedDict([
            ('id', ['int', 'primary', 'key', 'not', 'null']),
            ('x', ['real']),
            ('y', ['real']),
            ('s', ['varchar'])
        ])
        Note: if there are multiple primary keys, do not include ['primary', 'key'] in the column list,
        instead use the `keys` parameter to list them
    keys: list of stings, optional
        - Names of columns used as primary keys
    indices: dict of lists, optional
        - Keys are the names of the indices to be created. The values are lists of columns used
        for the given index
    users: dict of strings, optional
        - Keys are Toyz users in the current database whose permissions will be explicitely set.
        Use '*' to set the permissions of all users (the default permission for other users is '',
        which does not allow them to find, read, or write to the table). The value of each entry is a
        string that contains the permission for the user chosen from the following:
            * `f`: User can find the table in the databse
            * `r`: User can read data from the table
            * `w`: User can write data to the table

    kwargs: optional
        - In case other db's need additional parameters, this ensures the function will run
        properly
    """
    if not os.path.isfile(db_settings.path):
        raise ToyzDbError('Database does not exist')
    
    #Make sure the table name and all of the fields only contain approved characters
    
    db_utils.check_chars(True, [table_name], columns.keys(), keys)
    
    print('Creating table: {0}'.format(table_name))
    
    # Note, we could just use 'create table if not exists...' but I thought it would be useful
    # to let the user know if he/she tried to create an existing table in case the columns
    # are not the same
    if table_name in get_table_names(db_settings, user):
        raise ToyzDbError('Table already exists')
    else:
        col_str = ', '.join([key+' '+' '.join(value) for key,value in columns.items()])
        if len(keys)>0:
            for key in keys:
                if key not in columns.keys():
                    ToyzDbError('{0} not found in columns'.format(key))
            key_str = 'primary key ({0})'.format(','.join(keys))
        else:
            key_str=None
        if key_str is None:
            create_tbl = '''create table {0} ({1});'''.format(table_name, col_str)
        else:
            create_tbl = '''create table {0} ({1}) {2};'''.format(table_name, col_str, key_str)
        db = sqlite3.connect(db_settings.path)
        
        # create the table
        db.execute(create_tbl)
        
        # crate an entry in `tbl_permissions` for the current table. By default, the user
        # who creates the table will have full access to it
        if user.user_id not in users:
            users[user.user_id] = 'frw'
        insert_rows(db_settings, user,
            table_name='tbl_permissions', 
            columns=['table_name', 'permissions'],
            rows=[(table_name,json.dumps(users))])
        
        # Wait for table to be inserted into tbl_permissions before committing its creation
        db.commit()
        db.close()
        for idx in indices:
            create_index(db_settings, user, table_name, idx, indices[idx])

def get_path_ids(db_settings, user, paths):
    """
    Get path ids for a list of paths
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: ToyzUser
    paths: dict of path names
        
    Returns
    -------
    path_ids: dict of strings
        - Keys are the paths, values are the path id's for each path
    """
    db = sqlite3.connect(db_settings.path)
    db.row_factory = sqlite3.Row
    path_ids = {}
    for path in paths:
        cursor = db.execute("select path_id from paths where path=?;",(path,))
        path_ids[path] = cursor.fetchone()['path_id']
    db.close()
    return path_ids

def update_path_info(db_settings, user, paths):
    """
    Update user and group permissions for a path.
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: ToyzUser
    paths: dict of dicts
        - The keys of the top level dictionary are the paths
        - Each path has a dictionary with 1 mandatory and two optional keys:
            * users: dict
                - permissions for the folder
                - Each key is a user, with values for that users permisions
                -Notes:
                    * '*' represents all users, and defaults to '' (no permissions)
                    * The admin account has 'frwx' permissions for all paths unless explicitely forbidden
            * groups: dict
                - Same as users but contains group permissions
            * owner: string, optional
                - owner of the folder
                - defaults to the user supplied above
            * recursive: boolean, optional
                - whether or not the children of the folder will inherit permissions
                - defaults to True
        - Example:
            paths = {
                '~/toyz/folder1': {
                    'users': {
                        '*': 'fr',          # all unspecified users can find and read files from the path 
                        'usr1': 'frwx       # usr1 has full access to the path
                    },
                    'recursive': True       # all sub-directories will be set to the same permissions
                },
                '~/toyz/folder1/secret.txt': {
                    'users': {
                        '*': '',            # all unspecified users have no access to the file
                        'admin': ''         # even the admin user has no access to this file
                    },
                    'groups': {
                        'trusted': 'fr'     # all members of this group can find and read the file
                    }
                    'owner': 'usr2'         # usr2 will automatically have full access
                }
            }
    """
    db = sqlite3.connect(db_settings.path)
    path_ids = get_path_ids(db_module, user, paths)
    
    for path, permissions in paths.items():
        for user_id in path['users']:
            db.execute(
                "update user_paths set permissions=? where path_id=? and user_id=?;",
                (path['users'][user_id], path_ids[path], user_id))
        if 'groups' in path:
            for group in path['groups']:
                db.execute(
                    "update group_paths set permissions=? where path_id=? and group_id=?;",
                    (path, path_ids[path], group, path['groups'][group]))
            
    db.commit()
    db.close()

def get_path_info(db_settings, user, path):
    """
    Get the permissions of a path from the paths table
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: ToyzUser
    path: string
        - Inquired path
    
    Returns
    -------
    path_info: dict
        - Permissions for the path
    """
    db = sqlite3.connect(db_settings.path)
    db.row_factory = sqlite3.Row
    cursor = db.execute("select path_id, owner from paths where path=?;", (path,))
    path_info = cursor.fetchone()
    if path_info is None:
        return None
    path_id, owner = path_info
    cursor = db.execute(
        "select user_id, permissions from user_paths where path_id=?;", 
            (path_id,))
    users = {row[0]: row[1] for row in cursor.fetchall()}
    cursor = db.execute(
        "select group_id, permissions from group_paths where path_id=?;", 
        (path_id,))
    groups = {row[0]: row[1] for row in cursor.fetchall()}
    path_info = {
        'owner': owner,
        'users': users,
        'groups': groups
    }
    db.close()
    return path_info