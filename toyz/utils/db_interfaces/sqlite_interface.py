from __future__ import print_function, division

import os
import sqlite3

from ..errors import ToyzDbError
import db_utils

def init():
    """
    Because some databases might need to have their connections initialized, every 
    database interface is require to have an init function, even if it is empty, that
    is called when the application is first opened
    """
    pass

def check_admin(db_settings, user_settings):
    """
    If the user is acting as an administrator, verify the admin password
    """
    if user=='admin':
        db = sqlite3.connect(db_settings.path)
        user_info = db.execute("select user_dict from users where user_id='admin'")
        user_info = [row for row in user_info]
        if len(user_info)>1:
            raise ToyzDbError('Multiple Admin accounts found, this must be corrected')
        pwd = user_info[0][0]
        
    else:
        # TODO Check if user is in the admin group and if so, check his/her pwd
        return False

def create_database(db_settings, user_settings):
    """
    Creates a new database. SQLite does not password protect its databases 
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    """
    try:
        db = sqlite3.connect(db_settings.path)
        db.commit()
        db.close()
    except:
        raise ToyzDbError('Error creating database')

def get_table_names(db_settings):
    """
    Get a list of all tables in the database
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    
    Returns
    -------
    tables: list
        - List of table names in the current database
    """
    try:
        db = sqlite3.connect(db_settings.path)
        tables = db.execute("select name from sqlite_master where type='table'")
        db.close()
        tables = [t[0] for t in tables]
    except:
        raise ToyzDbError('Error loading table names from database', db_settings.path)
    return tables

def create_index(db_settings, table_name, idx_name, columns):
    """
    Create an index for a subset of columns in a table
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    table_name: string
        - name of table to be created
    columns: list of strings
        - Column names to be indexed
    """
    
    db = sqlite3.connect(db_settings.path)
    db_utils.check_chars(table_name, idx_name, columns)
    db.execute("create index {0} on {1} ({2})".format(idx_name, table_name, ', '.join(columns)))
    db.commit()

def insert_row(db_settings, table_name, columns):
    """
    Insert a new row into an existing table
    
    Parameters
    ----------
    db_settings: object
        - Database settings
    table_name: string
        - Name of the table
    columns: dict of strings
        - Keys are the columns that have non-null entries, values are the values of the columns
    """
    db = sqlite3.connect(db_settings.path)
    db_utils.check_chars(table_name)
    insert_str = "insert into {0} ({1}) values ({2});".format(
        table_name, ', '.join([col for col in columns]), ','.join(['?' for col in columns])
    )
    db.execute(insert_str, (val for key,val in columns.items()))

def update_row(db_settings, table_name, columns):
    pass

def create_table(db_settings, table_name, columns, keys=[], indices={}, users={'*':''}):
    """
    Create a table. This is a bit of a hack, since as of this time creating a table using parameter
    substitution in sqlite is unsupported. This means that without limitations the database is open
    to an injection attack (see http://xkcd.com/327/ and https://docs.python.org/3.3/library/sqlite3.html).
    As a result, we limit table names and column names to alpha-numeric strings only (a-z, 0-9).
    
    It would be nice to come up with a more thorough solution in the future that allows for spaces, 
    punctuation, and special characters.
    
    Parameters
    ----------
    db_settings: object
        - Database settings
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
            (('id'), ['int', 'primary', 'key', 'not', 'null']),
            (('x'), ['real']),
            (('y'), ['real'])
        ])
        Note: if there are multiple primary keys, do not include ['primary', 'key'] in the column list,
        instead use the `keys` parameter to list them
    keys: list of stings
        - Names of columns used as primary keys
    indices: dict of lists
        - Keys are the names of the indices to be created. The values are lists of columns used
        for the given index
    users: dict of strings
        - Keys are Toyz users in the current database whose permissions will be explicitely set.
        Use '*' to set the permissions of all users (the default permission for other users is '',
        which does not allow them to find, read, or write to the table). The value of each entry is a
        string that contains the permission for the user chosen from the following:
            * `f`: User can find the table in the databse
            * `r`: User can read data from the table
            * `w`: User can write data to the table
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
    if t in get_table_names(db_settings):
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
        db.commit()
        db.close()
        
        # crate an entry in `all_tables` with the given permissions
        
        
        for idx in indices:
            create_index(db_settings, table_name, idx, indices[idx])

def query_db(db_settings, query):
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