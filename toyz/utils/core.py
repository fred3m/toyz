# Core classes and functions for Toyz
# Copyright 2014 by Fred Moolekamp
# License: MIT

from __future__ import division,print_function
import os
import sys
import importlib
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
        'static_path': os.path.join(ROOT_DIR, 'web', 'static'),
        'template_path': os.path.join(ROOT_DIR, 'web', 'templates'),
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
    Format a path with bash symbols like '**~**' , '**.**' , '**..**' into a full absolute path. This
    simply returns ``os.path.abspath(os.path.expanduser(path))`` .
    """
    return os.path.abspath(os.path.expanduser(path))

def str_2_bool(bool_str):
    """
    Case independent function to convert a string representation of a 
    boolean (*true*/*false*, *yes*/*no*) into a **bool**. This is case insensitive, and will
    also accept part of a boolean string (*t*/*f*, *y*/*n*).
    
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

def create_paths(paths):
    """                                                                         
    Search for paths on the server. If a path does not exist, create the necessary directories.
    For example, if ``paths=['~/Documents/images/2014-6-5_data/']`` and only the path 
    *'~/Documents'* exists, both *'~/Documents/images/'* and *'~/Documents/images/2014-6-5_data/'*
    are created.
    
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
    """
    modified = False
    if shortcuts==None:
        shortcuts = get_param(toyz_settings.db, 'shortcuts', user)
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
        db_utils.update_param(toyz_settings.db, 'shortcuts', user_id=user_id, shortcuts=shortcuts)
    
    return shortcuts

def run_job(toyz_settings, job):
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
    response={}
    try:
        module = job["module"]
        #base_module = module.split('.')[0]
        if module in toyz_settings.config.approved_modules:
            toyz_module = importlib.import_module(module)
            task = getattr(toyz_module, job["task"])
            response = task(toyz_settings, job['id'],job['parameters'])
        else:
            raise ToyzJobError("Module is not listed in approved modules")
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
    
        for key, val in default_settings.items():
            setattr(self, key, ToyzClass(val))
    
        # Create config directory if it does not exist
        print("\nToyz: First Time Setup\n----------------------\n")
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
        db_utils.update_param(self.db, 'pwd', user_id='*', pwd='*')
        db_utils.update_param(self.db, 'pwd', group_id='admin', pwd='')
        db_utils.update_param(self.db, 'pwd', group_id='modify_toyz', pwd='')
        
        self.save_settings()
        print("\nFirst Time Setup completed")

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

#TODO Currently ToyzUser isn't used. If this isn't implemented later, remove
class ToyzUser:
    """
    User logged into the Toyz web application.
    
    *No longer implemented*
    """
    def __init__(self, toyz_settings, **user_settings):
        """
        Initialize a Toyz User
        
        Parameters
        ----------
        toyz_settings: toyz.core.ToyzSettings
            - settings for the toyz web and job applications
        user_settings: key word arguments
            - Parameters passed to the function specific to the given user. The only 
            required field is the `user_id`, all other fields are optional and will be set 
            to the default values specified in the code.
        """
        check4keys(user_settings, ['user_id'])
        self.__dict__.update(user_settings)
        
        # Set default values for missing attributes
        defaults = {
            'groups': [],
            'user_sessions': {},
            'workspaces': {},
            'toyz': {},
            'modules': [],
            'shortcuts': {},
            'app': None
        }
        
        for setting, val in defaults.items():
            if not hasattr(self, setting):
                setattr(self, setting, val)
        
        # Ensure that required directories exist
        if 'user' not in self.shortcuts:
            self.shortcuts['user'] = os.path.join(
                toyz_settings.config.root_path, 'users', self.user_id)
        if 'temp' not in self.shortcuts:
            self.shortcuts['temp'] = os.path.join(self.shortcuts['user'], 'temp')
        create_paths([path for key, path in self.shortcuts.items()])
        
        # Set the users password (if it is a first time user)
        if not hasattr(self, 'pwd'):
            if toyz_settings.security.user_login:
                self.pwd = encrypt_pwd(toyz_settings, self.user_id)
            else:
                self.pwd = self.user_id
    
    def add_toyz(self, toyz, paths):
        """
        Add a toyz from a list of packages and/or a list of paths on the server

        Parameters
        ----------
        toyz: list
            - elements are either names of packages built on the toyz framework or dictionaries, 
            where the keys are names to identify each package and the values are
            package names.
        paths: dict of strings
            - Keys are names to identify each toy
            - Values are paths to modules that have not been packaged but fit the toyz framework

        Returns
        -------
        None
        """
        new_handlers = []

        for toy in toyz:
            if isinstance(toy, dict):
                module = importlib.import_module(toyz(toy))
                self.toyz[toy] = core.Toy(toyz(toy), module=module, key=toy)
            else:
                module = importlib.import_module(toy)
            self.toyz[toy] = core.Toy(toy, module=module)
                
        for toy, path in paths.items:
            contents = os.listdir(path)
            if 'toy_config.py' in contents:
                sys.path.insert(0, path)
                # Load the config file for the current package
                try:
                    reload(toy_config)
                except NameError:
                    import toy_config
                toy_name = toy_config.name
                self.toyz[toy] = core.Toy(toy_name, config=toy_config, path=path, key=toy)
            else:
                raise ToyzError("Config file not found for module {0} in {1}".format(toy, path))
    
    def __str__(self):
        """
        __str__
        String representation of the class
        Parameters
        ----------
        None
        
        Returns
        -------
        myStr: string
            -String with each attribute and its value
        """
        myStr=''
        for attr,value in self.__dict__.iteritems():
            myStr += attr+':'+str(value)+'\n'
        return myStr

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