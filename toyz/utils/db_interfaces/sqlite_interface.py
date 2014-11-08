from __future__ import print_function, division

import os
import sqlite3
import json

from toyz.errors import ToyzDbError
from toyz.utils import db_utils

def init():
    """
    Because some databases might need to have their connections initialized, every 
    database interface is require to have an init function, even if it is empty, that
    is called when the application is first opened
    """
    pass

def check_admin(db_settings, user, **kwargs):
    """
    If the user is acting as an administrator, verify the admin password
    """
    # TODO: make check work
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
    user: object
        - Toyz user. These have no function in the SQLite framework, but other databases
        may need this information
    kwargs: optional
        - In case other db's need additional parameters, this ensures the function will run
        properly
    """
    try:
        db = sqlite3.connect(db_settings.path)
        db.commit()
        db.close()
    except:
        raise ToyzDbError('Error creating database')

def check_tbl_permissions(db_settings, user, table_name, permissions):
    """
    Check whether or not a user has permission to find (search), read, or write to a table.
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: object
        - Toyz user
    permissions: string
        - Permissions to check
    
    Returns
    -------
    result: boolean
        - True, if the user has all of the given permissions for the table, False otherwise
    """
    # This statement ensures that the `tbl_permisions` table can be created
    if table_name='tbl_permissions' and user.user_id = 'admin':
        return True
    try:
        db = sqlite3.connect(db_settings.path)
        tables = db.execute("select * from tbl_permissions where table_name=?;", table_name)
        db.close()
        if len(tables)>1:
            raise ToyzDbError("Multiple entries for {0} in tbl_permission".format(table_name))
        elif len(tables)==0:
            raise ToyzDbError("Table {0} not found in tbl_permissions".format(table_name))
        users = json.loads(tables[0][2])
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
    user: object
        - Toyz user, used to check which tables the user has permission to find
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
        tables = db.execute("select name from sqlite_master where type='table'")
        db.close()
        tables = [t[0] for t in tables 
            if check_tbl_permissions(db_settings, user, t[0], 'f')
        ]
    except:
        raise ToyzDbError('Error loading table names from database', db_settings.path)
    return tables

def create_index(db_settings, user, table_name, idx_name, columns, **kwargs):
    """
    Create an index for a subset of columns in a table
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: object
        - Toyz user
    table_name: string
        - name of table to be created
    columns: list of strings
        - Column names to be indexed
    kwargs: optional
        - In case other db's need additional parameters, this ensures the function will run
        properly
    """
    
    db = sqlite3.connect(db_settings.path)
    db_utils.check_chars(table_name, idx_name, columns)
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
    user: object
        - Toyz user (to ensure that the user has write access to the table)
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
    db_utils.check_chars(table_name, columns)
    
    col_names = ', '.join(columns)
    row_values = ', '.join(('('+', '.join(('?' for col in row))+')' for row in rows))
    
    insert_str = "insert into {0} ({1}) values ({2});".format(table_name, col_names, row_values)
    db.execute(insert_str, (val for key,val in columns.items()))
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
    user: object
        - Toyz user
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
    db_utils.check_chars(
        True, table_name, columns.keys(), [col for col in columns], keys, users.keys(), [u for u in users]
    )
    
    # Note, we could just use 'create table if not exists...' but I thought it would be useful
    # to let the user know if he/she tried to create an existing table in case the columns
    # are not the same
    if table_name not in get_table_names(db_settings, user):
        raise ToyzWarning('Table already exists')
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
            tbl_name='tbl_permissions', 
            columns=['table_name', permissions],
            rows=[(table_name,json.dumps(users))])
        
        # Wait for table to be inserted into tbl_permissions before committing its creation
        db.commit()
        db.close()
        
        for idx in indices:
            create_index(db_settings, table_name, idx, indices[idx])

def get_path_ids(db_settings, user, paths):
    """
    Get path ids for a list of paths
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: object
        - Toyz user
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
        cursor = db.execute("select path_id from paths where path=?;",path)
        path_ids[path] = cursor.fetchone()['path_id']
    db.close()
    return path_ids

def update_path_info(db_settings, user, paths):
    """
    Update user and group permissions for a path.
    """
    db = sqlite3.connect(db_settings.path)
    path_ids = get_path_ids(db_module, user, paths)
    
    for path in paths:
        for user_id in path['users']:
            db.execute(
                "update user_paths set path_id=?, user_id=?, permissions=? where path=?",
                (path_ids[path], user_id, path['users'][user_id]))
        if 'groups' in path:
            for group in path['groups']:
                db.execute(
                    "update group_paths set path_id=?, group=?, permissions=? where path=?",
                    (path_ids[path], group, path['groups'][group]))
            
    db.commit()
    db.close()

def get_path_info(db_settings, user, path):
    """
    Get the permissions of a path from the paths table
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    user: object
        - Toyz user
    path: string
        - Inquired path
    
    Returns
    -------
    path_info: dict
        - Permissions for the path
    """
    db = sqlite3.connect(db_settings.path)
    db.row_factory = sqlite3.Row
    cursor = db.execute("select path_id, owner from paths where path=?;", path)
    path_id, owner = cursor.fetchone()
    cursor = db.execute("select user_id, permissions from user_paths where path_id=?;", path_id)
    users = {row[0]: row[1] for row in cursor.fetchall()}
    cursor = db.execute("select group_id, permissions from group_paths where path_id=?;", path_id)
    groups = {row[0]: row[1] for row in cursor.fetchall()}
    path_info = {
        'owner': owner,
        'users': users,
        'groups': groups
    }
    db.close()
    return path_info

def query_db(db_settings, user, from, where, **kwargs):
    """
    Run a sql query on the database. Note: This should only be used when you can be sure that the
    query is comming from a trusted source or you will be open to an injection attack
    (see http://xkcd.com/327/ and https://docs.python.org/3.3/library/sqlite3.html).
    """
    if not os.path.isfile(db_settings.path):
        raise ToyzDbError('Database does not exist')
    db = sqlite3.connect(db_settings.path)
    c = db.cursor
    c.execute(query)
    db.commit()
    db.close()
    
    return c