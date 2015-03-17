# Core classes and functions for Toyz
# Copyright 2015 by Fred Moolekamp
# License: LGPLv3

from __future__ import division,print_function
import os
import sys
import importlib
import imp
import base64
import uuid
import cPickle as pickle
from collections import OrderedDict
import multiprocessing

from toyz.utils import db as db_utils
from toyz.utils.errors import ToyzError, ToyzDbError, ToyzWebError, ToyzJobError, ToyzWarning

# Path that toyz has been installed in
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__),os.pardir))

# Default settings for a new toyz instance (these can be modified later through the web app)
default_settings = {
    'config': {
        'root_path': os.path.join(ROOT_DIR),
        'config_path': os.path.join('config', 'toyz_config.p'),
        'approved_modules': ['toyz.web.tasks'],
        'enable_guest': True
    },
    'db': {
        'db_type': 'sqlite',
        'interface_name': 'toyz.utils.db_interfaces.sqlite_interface',
        'db_path': os.path.join('db', 'toyz.db')
    },
    'web': {
        'port': 8888,
        'cookie_secret': base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes),
        #'static_path': os.path.join(ROOT_DIR, 'web', 'static'),
        #'template_path': os.path.join(ROOT_DIR, 'web', 'templates'),
    },
    'security': {
        'encrypt_db': False,
        'user_login': True,
        'pwd_context': {
            'schemes': ['sha512_crypt','pbkdf2_sha512'],
            'default': "sha512_crypt",
            'sha512_crypt__default_rounds': 500000,
            'pbkdf2_sha512__default_rounds': 100000,
            'all__vary_rounds': 0.1  # vary rounds parameter randomly when creating new hashes
        }
    }
}

def normalize_path(path):
    """
    Format a path with bash symbols like '**~**' , '**.**' , '**..**' into a full absolute path.
    This simply returns ``os.path.abspath(os.path.expanduser(path))`` .
    """
    return os.path.abspath(os.path.expanduser(path))

def str_2_bool(bool_str):
    """
    Case independent function to convert a string representation of a 
    boolean (``'true'``/``'false'``, ``'yes'``/``'no'``) into a ``bool``. This is case 
    insensitive, and will also accept part of a boolean string 
    (``'t'``/``'f'``, ``'y'``/``'n'``).
    
    Raises a :py:class:`toyz.utils.errors.ToyzError` if an invalid expression is entered.
    """
    lower_str = bool_str.lower()
    if 'true'.startswith(lower_str) or 'yes'.startswith(lower_str):
        return True
    elif 'false'.startswith(lower_str) or 'no'.startswith(lower_str):
        return False
    else:
        raise ToyzError(
            "'{0}' did not match a boolean expression "
            " (true/false, yes/no, t/f, y/n)".format(bool_str))

def get_bool(prompt):
    """
    Prompt a user for a boolean expression and repeat until a valid boolean
    has been entered. ``prompt`` is the text to prompt the user with.
    """
    try:
        bool_str = str_2_bool(raw_input(prompt))
    except ToyzError:
        print(
            "'{0}' did not match a boolean expression "
            "(true/false, yes/no, t/f, y/n)".format(bool_str))
        return get_bool(prompt)
    return bool_str

# modified from https://www.xormedia.com/recursively-merge-dictionaries-in-python/
# changes: keep track of keys used (to avoid infinite loops) and make copy optional
def merge_dict(d1, d2, copy=False, keys=[]):
    """
    Python version of jQuery.extend that recursively merges two python
    dictionaries. If ``copy`` is ``True`` then the new object is a copy, otherwise
    d2 is merged into d1 (the same as $.extend). ``keys`` should never be passed
    on the first call as it is used to keep track of which elements have been
    used (to avoid infinite loops).
    
    """
    if not isinstance(d2, dict):
        return d2
    if copy:
        from copy import deepcopy
        d1 = deepcopy(d1)
    for key, value in d2.iteritems():
        if key in d1 and isinstance(d1[key], dict) and d1[key] not in keys:
            keys.append(key)
            d1[key] = merge_dict(d1[key], value)
        elif copy:
            d1[key] = deepcopy(value)
        else:
            d1[key] = value
    return d1

def check_instance(obj, instances):
    """
    Check if an object is an instance of another object
    
    Parameters
        - obj (*object* ): Object to check
        - instances (*list* ): List of objects to crosscheck with obj
    
    Returns
        - is_instance (*bool* ): *True* if the obj is an instances of one of the objects in 
          the list, *False* otherwise
    """
    for i in instances:
        if obj is i:
            return False
    return True

def check_pwd(toyz_settings, user_id, pwd):
    """
    Check to see if a users password matches the one stored in the database.
    
    Parameters
        - toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings` ): Settings for the current 
          application
        - user_id (*string* ): Id of the user logging in
        - pwd: (*string* ): password the user has entered
    
    Returns
        - valid_login (*bool* ): True if the user name and password match
    """
    from passlib.context import CryptContext
    pwd_context = CryptContext(**toyz_settings.security.pwd_context)
    users = db_utils.get_all_ids(toyz_settings.db, user_type='user_id')
    if user_id not in users:
        # Dummy check to prevent a timing attack to guess user names
        pwd_context.verify('foo', 'bar')
        return False
    user_hash = db_utils.get_param(toyz_settings.db, 'pwd', user_id=user_id)
    return pwd_context.verify(pwd, user_hash)

def encrypt_pwd(toyz_settings, pwd):
    """
    Use the passlib module to create a hash for the given password.
    
    Parameters
        - toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings` ): Settings for the 
          current application
        - pwd (*string* ): password the user has entered
    
    Returns
        - pwd_hash (*string* ): Password hash to be stored for the given password. If passwords
          are not encrypted, this will just return the ``pwd`` passed to the function.
    """
    from passlib.context import CryptContext
    pwd_context = CryptContext(**toyz_settings.security.pwd_context)
    return pwd_context.encrypt(pwd)

def check4keys(myDict,keys):
    """
    Checks a dictionary for a set of required keys.
    
    Parameters
        - myDict (*dict* ): Dictionary to be searched
        - keys (*list* ): List of keys to search for in the dictionary
    
    Raises
        Raises a :py:class:`toyz.utils.errors.ToyzJobError` if any keys are missing from 
        ``myDict`` and lists all of the missing keys
    """
    error=""
    if any(key not in myDict for key in keys):
        for key in keys:
            if key not in myDict:
                error=error+key+", "
    if error!="":
        raise ToyzError("Missing parameters: "+error)

def is_number(str_in):
    """
    Check whether or not a string is a number
    """
    try:
        float(str_in)
        return True
    except ValueError:
        return False

def is_int(str_in):
    """
    Check whether or not a string is an integer.
    """
    try:
        int(str_in)
        return True
    except ValueError:
        return False

def create_paths(paths):
    """                                                                         
    Search for paths on the server. If a path does not exist, create the necessary directories.
    For example, if ``paths=['~/Documents/images/2014-6-5_data/']`` and only the path 
    *'~/Documents'* exists, both *'~/Documents/images/'* and 
    *'~/Documents/images/2014-6-5_data/'* are created.
    
    Parameters
        paths (*string* or *list* of strings): If paths is a string, this is the path to 
        search for and create. If paths is a list, each one is a path to search for and create
    """
    if isinstance(paths,basestring):
            paths=[paths]
    for path in paths:
        try:
            os.makedirs(path)
        except OSError:
            if not os.path.isdir(path):
                raise ToyzError("Problem creating new directory, check user permissions")

def get_user_type(params):
    """
    Since user properties and group properties are kept in the same table and use the same
    functions, many functions use the keyword `user_id` or `group_id` to figure out if
    they are operating on groups or users.
    
    Parameters
        - params (*dict* ): Dictionary of parameters sent to a function
    
    Returns
        - user (*dict* ): Dictionary with user_type. This is always either 
          ``{user_id: params['user_id']}`` or ``{group_id: params['group_id']}``
    """
    if 'user_id' in params:
        if 'group_id' in params:
            raise ToyzError("Must specify either a user_id OR group_id but not both")
        user = {'user_id': params['user_id']}
    elif 'group_id' in params:
        user = {'group_id': params['group_id']}
    else:
        raise ToyzError("Must specify either a user_id or group_id")
    return user

def check_user_shortcuts(toyz_settings, user_id, shortcuts=None):
    """
    Check that a user has all of the default shortcuts.
    
    Parameters
        - toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings` ): Toyz Settings
        - user_id (*string* ): User id to check for shortcuts
        - shortcuts (*dict*, optional): Dictionary of shortcuts for a user. Shortcuts
          are always of the form ``shortcut_name:path`` .
    
    Returns
        - shortcuts: dictionary of shortcuts for the user
    """
    modified = False
    if shortcuts==None:
        shortcuts = db_utils.get_param(toyz_settings.db, 'shortcuts', user_id=user_id)
    if 'user' not in shortcuts:
        shortcuts['user'] = os.path.join(toyz_settings.config.root_path, 'users', user_id)
        db_utils.update_param(toyz_settings.db, 'shortcuts', user_id=user_id, 
            shortcuts={'user': shortcuts['user']})
        create_paths([shortcuts['user']])
        modified = True
    if 'temp' not in shortcuts:
        shortcuts['temp'] = os.path.join(shortcuts['user'], 'temp')
        db_utils.update_param(toyz_settings.db, 'shortcuts', user_id=user_id, 
            shortcuts={'temp': shortcuts['temp']})
        create_paths([shortcuts['temp']])
        modified = True
    if modified:
        db_utils.update_param(toyz_settings.db, 'shortcuts', user_id=user_id, 
            shortcuts=shortcuts)
        paths = db_utils.get_param(toyz_settings.db, 'paths', user_id=user_id)
        # Ensure that the user has full access to his/her home directory
        if shortcuts['user'] not in paths or paths[shortcuts['user']] !='frwx':
            db_utils.update_param(toyz_settings.db, 'paths', user_id=user_id, 
                paths={shortcuts['user']: 'frwx'})
    return shortcuts

def get_all_user_modules(toyz_settings, user_id):
    """
    Get all modules available for the user.
    
    Parameters
        toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings` ):
            - Settings for the application runnning the job (may be needed to load user info 
              or check permissions)
        user_id ( *string* ): id of the current user
    
    Returns
        user_modules ( *list* of *strings* ): 
            - list of all toyz modules that the user has access
              to, including permissions granted by member groups
    """
    groups = db_utils.get_param(toyz_settings.db, 'groups', user_id=user_id)
    user_modules = db_utils.get_param(toyz_settings.db, 'modules', user_id=user_id)
    user_modules.extend(toyz_settings.config.approved_modules)
    for group_id in groups:
        user_modules.extend(db_utils.get_param(toyz_settings.db, 'modules', group_id=group_id))
    return list(set(user_modules))

def check_user_modules(toyz_settings, user_id, module):
    """
    Check to see if a module is available for the user
    
    Parameters
        toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings` ):
            - Settings for the application runnning the job (may be needed to load user info 
              or check permissions)
        user_id ( *string* ): id of the current user
        module ( *string* ): name of the module to search for
    
    Returns
        module_present ( *bool* ): 
            - ``true`` if the user has access to the module, ``false``
              otherwise
    """
    user_modules = get_all_user_modules(toyz_settings, user_id)
    if (module in user_modules or 
            (module.endswith('.tasks') and module[:-6] in user_modules) or
            (module.endswith('.config') and module[:-7] in user_modules)):
        return True
    return False

def get_all_user_toyz(toyz_settings, user_id):
    """
    Get all available Toyz paths for the current user
    
    Parameters
        toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings` ):
            - Settings for the application runnning the job (may be needed to load user info 
              or check permissions)
        user_id ( *string* ): id of the current user
    
    Returns
        user_toyz ( *dict* ):
            - All of the local python directories that the user can use to run
              jobs.
    """
    groups = db_utils.get_param(toyz_settings.db, 'groups', user_id=user_id)
    user_toyz = {}
    for group_id in groups:
        user_toyz.update(db_utils.get_param(toyz_settings.db, 'toyz', group_id=group_id))
    user_toyz.update(db_utils.get_param(toyz_settings.db, 'toyz', user_id=user_id))
    return user_toyz

def get_user_toyz(toyz_settings, user_id, toy):
    """
    If a toy is contained in a users toyz paths, get the module and return it
    
    Parameters
        toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings` ):
            - Settings for the application runnning the job (may be needed to load user info 
              or check permissions)
        user_id ( *string* ): id of the current user
        toy ( *string* ): name of the toy to search for
    
    Returns
        toy ( *module* ): python module if it exists, otherwise ``None``.
    """
    user_toyz = get_all_user_toyz(toyz_settings, user_id)
    if toy in user_toyz:
        return imp.load_source(toy, user_toyz[toy])
    elif toy.endswith('.tasks') and toy[:-6] in user_toyz:
        return imp.load_source(toy, os.path.join(user_toyz[toy[:-6]], 'tasks.py'))
    elif toy.endswith('.config') and toy[:-7] in user_toyz:
        return imp.load_source(toy, os.path.join(user_toyz[toy[:-7]],'config.py'))
    return None

def get_toyz_module(toyz_settings, user_id, module):
    """
    Get a toyz module from either installed modules or one in a users toyz paths.
    An uninstalled toy will take precedence if it is in the toy paths as opposed to installed
    modules.
    
    Parameters
        toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings` ):
            - Settings for the application runnning the job (may be needed to load user info 
              or check permissions)
        user_id ( *string* ): id of the current user
        module ( *string* ): name of the module to search for
    
    Returns
        toyz_module ( *module* ): python module if it exists, otherwise ``None``.
    
    Raises
        Raises a :py:class:`toyz.utils.errors.ToyzJobError` if the module is not found
        in the users approved modules
    """
    toyz_module = get_user_toyz(toyz_settings, user_id, module)
    if toyz_module is not None:
        return toyz_module
    if toyz_module is None and check_user_modules(toyz_settings, user_id, module):
        return importlib.import_module(module)
    else:
        raise ToyzJobError(module+" not found in " +user_id+"'s approved modules")

def run_job(toyz_settings, pipe, job):
    """
    Loads modules and runs a job (function) sent from a client. Any errors will be trapped 
    and flagged as a :py:class:`toyz.utils.errors.ToyzError` and sent back to the client who 
    initiated the job. 
    
    All job functions will take exactly 3 parameters: **toyz_settings**, **tid**, **params**. 
    The **tid** is the task id (*user*, *session*, and *request_id* ) information (see below), 
    and **params** is a dictionary of parameters sent by the client. 
    
    Each job is run as a new process, so any modules imported should be removed from memory 
    when the job has completed.
    
    Parameters
        toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings` ):
            - Settings for the application runnning the job (may be needed to load user info 
              or check permissions)
        pipe: *multiprocessing.Pipe*
            - Communication with the parent process.
            - It may be useful to pass progress notifications to a client as a job
              is run. To send a notifaction the pipe requires a dictionary that is of the
              same form as the result (see Returns below), but usually with 
              ``id='notification'``.
        job: *dict*
            - The job received from the user. Each job will contain the following keys:
            - ``id`` (*dict*): Unique values for the given job. These are the
              **user_id**, the id of the user loaded from a secure cookie; the
              **session_id**, a unique identifier for the websocket; and the
              **request_id**, a unique identifier for the current request, sent from the client
            - ``module`` (*str*): Name of the Python module that contains the function called 
              by the client. In order for a module to work for a user, he/she must either have
              permissions set to view the module or belong to a group with permissions set
              to view the module (including *all_users*).
            - ``task`` (*str*): Name of the function called by the client
            - ``parameters`` (*dict*): Required and optional parameters passed to the function.
    
    Returns
        result: *dict*
            - The result is returned to the application running the job and is composed
              of two keys: an ``id``: the job id for the completed job, and a ``response``
              that is sent to the client.
            - The response is either an empty dictionary or one that contains (at a minimum) 
              the key **id**, which is used by the client to identify the type of response it is 
              receiving. Including the key **request_completed** with a *True* value tells the
              client that the current request has finished and may be removed from the queue.
    
    Example
    
        A client might send the following job to the server:
        
        .. code-block:: javascript
        
            job = {
                id : {
                    user_id : 'Iggy',
                    session_id : '12',
                    request_id : 305
                },
                module : 'toyz.web.tasks',
                task : 'load_directory',
                parameters : {
                    path: '~/images'
                }
            }
        
        In this case, after receiving the job, this function will import 
        the :py:mod:`toyz.web.tasks` module 
        (if it has not been imported already) and run the function 
        ``load_directory(toyz_settings, job['id'],job['parameters'])``. 
        If there are any errors in loading the directory, a response of the form
    
        .. code-block:: python
        
            response = {
                'id' : 'ERROR',
                'error' : 'Error message here for unable to lead directory',
                'traceback' : traceback.format_exec()
            }
        
        is sent. If the directory is loaded correctly a response of the form
        
        .. code-block:: python
    
                response={
                    'id': 'directory',
                    'path': '~/images/proj1',
                    'shortcuts': ['user', 'temp', 'home'],
                    'folders': ['proj1', 'proj2'],
                    'files': [],
                    'parent': '~/images'
                }
    
        is sent to the client.
    """
    # TODO: Eventually a job should be added to the jobs dictionary and removed after the response has been sent
    import traceback
    from toyz.web import session_vars
    session_vars.pipe = pipe
    response={}
    try:
        try:
            if job['module'].split('.')[-1] == 'tasks': 
                toyz_module = get_toyz_module(toyz_settings,job['id']['user_id'],job['module'])
            else:
                raise ImportError()
        except ImportError:
            ToyzJobError(job['module']+" not found in " + 
                job['id']['user_id']+"'s approved modules")
        task = getattr(toyz_module, job["task"])
        response = task(toyz_settings, job['id'], job['parameters'])
    except ToyzJobError as error:
        response = {
            'id':"ERROR",
            'error':error.msg,
            'traceback':traceback.format_exc()
        }
    except Exception as error:
        response = {
            'id':"ERROR",
            'error':"PYTHON ERROR:"+type(error).__name__+str(error.args),
            'traceback':traceback.format_exc()
        }
        print(traceback.format_exc())
    if response != {}:
        response['request_id'] = job['id']['request_id']
        #self.write_message(response)
    
    result = {
        'id': job['id'],
        'response': response,
    }
    
    #logging.info("sent message:%r",response['id'])
    return result

def progress_log(msg):
    from toyz.web import session_vars
    print(msg)
    if hasattr(session_vars, 'pipe'):
        notification = {
            'id': 'notification',
            'msg': msg
        }
        session_vars.pipe.send(notification)

class ToyzClass:
    """
    I often prefer to work with classes rather than dictionaries. To allow
    these objects to be pickled they must be defined as a class, so this is 
    simply a class that converts a dictionary into a class.
    """
    def __init__(self, dict_in):
        """
        Converts a dictionary into a set of class methods.
        """
        self.__dict__ = dict_in

class ToyzSettings:
    """
    Settings for the current toyz application.
    """
    def __init__(self, config_root_path=None):
        """
        Check the current working directory for a config directory with a ``config.p`` file.
        This allows users to have a custom Toyz directory with their own configuration
        separate from the master install in the python directory.
        """
        config_filename = default_settings['config']['config_path']
        if config_root_path is None:
            if os.path.isfile(os.path.join(os.getcwd(), config_filename)):
                config_root_path = os.getcwd()
            else:
                config_root_path = default_settings['config']['root_path']
        
        config_path = os.path.join(config_root_path, config_filename)
        if not os.path.isfile(config_path):
            self.first_time_setup(config_root_path)
        else:
            self.load_settings(config_path)
    
    def save_settings(self, security_key=None):
        """
        Save the toyz settings to disk. If toyz_settings.security.encrypt_config is *True*, 
        the settings file will be encrypted (this requires a security key).
        
        *Security not yet implemented*
        """
        toyz_settings = self
        #if self.security.encrypt_config:
        #    import getpass
        #    from toyz.utils.security import encrypt_pickle
        #    self.security.key = security_key
        #    toyz_settings = encrypt_pickle(self.__dict__, security_key)
        print('config path', self.config.path)
        pickle.dump(toyz_settings, open(self.config.path, 'wb'))
    
    def load_settings(self, config_path, security_key=None):
        """
        Load settings. If ``toyz_settings.security.encrypt_config`` is *True*, 
        the settings file will be decrypted (this requires a securiity key).
        
        *Security not yet implemented*
        """
        toyz_settings = pickle.load(open(config_path, 'rb'))
        if hasattr(toyz_settings, 'encrypted_settings'):
            # Decrypt the config file if it is encrypted
            from toyz.utils.security import decrypt_pickle
            if security_key is None:
                import getpass
                security_key = getpass.getpass('security key: ')
            toyz_settings = decrypt_pickle(toyz_settings, security_key)
        self.__dict__ = toyz_settings.__dict__
    
    def first_time_setup(self, config_root_path):
        """
        Initial setup of the Toyz application and creation of files the first time it's run.
    
        Parameters
            - config_root_path (*string* ): Default root path of the new Toyz instance
        """
        from toyz.utils import file_access
        from toyz.utils import third_party
        
        # Set default settings
        default_settings['web']['third_party'] = third_party.get_defaults()
        for key, val in default_settings.items():
            setattr(self, key, ToyzClass(val))
    
        # Create config directory if it does not exist
        print("\nToyz: First Time Setup\n----------------------\n")
        self.config.root_path = normalize_path(os.getcwd())
        while not get_bool(
                "Create new Toyz configuration in '{0}'? ".format(self.config.root_path)):
            self.config.root_path = normalize_path(raw_input("new path: "))
        self.config.path = os.path.join(
            self.config.root_path,
            self.config.config_path
        )
        create_paths([self.config.root_path, os.path.join(self.config.root_path, 'config')])
        
        # Create database for toyz settings and permissions
        self.db.path = os.path.join(self.config.root_path, 
                                            self.db.db_path)
        create_paths(os.path.dirname(self.db.path))
        db_utils.create_toyz_database(self.db)
        
        # Create default users and groups
        admin_pwd = 'admin'
        if self.security.user_login:
            admin_pwd = encrypt_pwd(self, admin_pwd)
        db_utils.update_param(self.db, 'pwd', user_id='admin', pwd=admin_pwd)
        db_utils.update_param(self.db, 'pwd', group_id='all', pwd='')
        db_utils.update_param(self.db, 'pwd', group_id='admin', pwd='')
        db_utils.update_param(self.db, 'pwd', group_id='modify_toyz', pwd='')
        db_utils.update_param(self.db, 'paths', group_id='all', paths={
            os.path.join(ROOT_DIR, 'web','static'): 'fr',
            os.path.join(ROOT_DIR, 'web','templates'): 'fr',
            os.path.join(ROOT_DIR, 'third_party'): 'fr',
        })
        
        self.save_settings()
        print("\nFirst Time Setup completed")

def check_version(db_settings):
    """
    Since version changes may update the API or the database, check that the current version
    is compatible with the users configuration and database
    """
    from toyz.version import version as toyz_version
    db_info = db_utils.get_db_info(db_settings)
    db_version = db_info['current']['value']
    if toyz_version!=db_version:
        print('New version of toyz, checking for database upgrades')
        db.update_version(db_settings, {
            'toyz_version': toyz_version,
            'db_version': db_version
        })

def get_workspace_permissions(toyz_settings, tid, params):
    groups = db_utils.get_param(toyz_settings.db, 'groups', user_id=tid['user_id'])
    shared_workspaces = db_utils.get_workspace_sharing(
        toyz_settings.db, user_id=params['user_id'], work_id=params['work_id'])
    permissions = {
        'view': False,
        'modify': False,
        'share': False
    }
    if tid['user_id']=='admin' or 'admin' in groups:
        for p in permissions:
            permissions[p] = True
    else:
        if len(shared_workspaces)>0:
            for shared_user in shared_workspaces:
                if (shared_user['share_id_type']=='user_id' and 
                        shared_user['share_id']==tid['user_id']):
                    for p in permissions:
                        permissions[p] = permissions[p] or shared_user[p]
                elif (shared_user['share_id_type']=='group_id' and
                        shared_user['share_id'] in groups):
                    for p in permissions:
                        permissions[p] = permissions[p] or shared_user[p]
    return permissions

class Toy:
    """
    A toy built on the toyz framework.
    
    *This class has not yet been setup*
    """
    def __init__(self, toy, module=None, path=None, config=None, key=None):
        self.name = toy
        self.module = module
        self.path = path
        self.config = config
        self.key = key
        if self.config is None:
            self.config = module.config
        if self.key is None:
            self.key = self.name
    
    def reload(self, module):
        reload(self.name)

#TODO Currently ToyzJobQueue isn't used. If this isn't implemented later, remove
class ToyzJobQueue:
    """
    An environment for a single user to run tasks.
    
    *No longer implemented, but may be in the future*
    """
    def __init__(self, queue_name, process_count):
        self.queue_name = queue_name
        self.processes = []
        self.queue = multiprocessing.Queue()
        self.initialize()
    
    def initialize(self):
        print('Initializing processes')
        for p in range(process_count):
            process = multiprocessing.Process(
                name=queue_name+'-'+str(p),
                target=self.job_worker,
                args=(self.queue,)
            )
            process.daemon = True
            process.start()
            self.processes.append(process)
    
    def add_job(self, job):
        self.queue.put(job)
    
    def close_env(self, interrupt_jobs=False):
        self.queue.put({'close_env': True})
    
    def job_worker(self, queue):
        msg = {}
        while 'EXIT' not in msg:
            msg = queue.get()
            self.run_job(msg)
            
        print("{0} closed".format(multiprocessing.current_process().name))