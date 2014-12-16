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
    Format bash symbols like `~`, `.`, `..` into a full absolute path
    """
    return os.path.abspath(os.path.expanduser(path))

def str_2_bool(bool_str):
    """
    Case independent function to convert a string representation of a 
    boolean (true/false, yes/no) into a bool.
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
    prompt a user for a boolean expression and repeat until a valid boolean
    has been entered.
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
    ----------
    obj: object
        - Object to check
    instances: list
        - List of objects to crosscheck with obj
    
    Return
    ------
    is_instance: bool
        - True if the obj is an instances of one of the objects in the list, false otherwise
    """
    for i in instances:
        if obj is i:
            return False
    return True

def check_pwd(toyz_settings, user_id, pwd):
    """
    Check to see if a users password matches the one on file.
    
    Parameters
    ----------
    users: list of toyz.ToyzUser
        - Users for the current application
    toyz_settings: toyz.ToyzSettings
        - Settings for the current application
    user_id: string
        - Id of the user logging in
    pwd: string
        - password the user has entered
    
    Returns
    -------
    valid_login: bool
        - Return is True if the user name and password 
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
    Use the passlib module to create a hash for the given password
    
    Parameters
    ----------
    toyz_settings: toyz.ToyzSettings
        - Settings for the current application
    pwd: string
        - password the user has entered
    
    Returns
    -------
    pwd_hash: string
        - Password hash to be stored for the given password
    """
    from passlib.context import CryptContext
    pwd_context = CryptContext(**toyz_settings.security.pwd_context)
    return pwd_context.encrypt(pwd)

def check4keys(myDict,keys):
    """
    check4key
    
    Checks a dictionary for a set of required keys
    
    Parameters
    ---------
    myDict: dictionary
        -Dictionary to be searched
    keys: list
        -List of keys to search for in the dictionary
    Returns
    -------
    No returns but the function raises a JobError and lists all required keys missing 
    from the dictionary
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
    For example, if paths=['~/Documents/images/2014-6-5_data/'] and only the path 
    '~/Documents' exists, both '~/Documents/images/' and '~/Documents/images/2014-6-5_data/'
    are created.
    
    Parameters
    ----------
    paths: string or list of strings
        -If paths is a string, this is the path to search for and create. If paths is a list, 
        each one is a path to search for and create
    
    Returns
    -------
        -None
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
    Check that a user has all of the default shortcuts
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
    and flagged as an ToyzError and sent back to the client who initiated the job. 
    All job functions will take exactly 3 parameters: id,params,websocket. The id is the 
    user, session, and request id information (see below), params is a dictionary of 
    parameters sent by the client, and websocket is the current websocket processing the job. 
    Each job is run as a new process, so any modules imported should be removed from memory 
    when the job has completed.

    Parameters
    ----------
    toyz_settings: toyz.ToyzSettings
        - Settings for the application runnning the job (may be needed to load user info 
        or check permissions)
    job: dictionary
        - The job received from the user. The following keys are required:
            id: dictionary
                - dictionary that contains the following keys:
                    user_id: string
                        - Unique identifier of the current user
                    session_id: string
                        -Unique identifier of the current session
                    request_id: string
                        -Unique identifier for the current request sent by the client
            module: string
                - Python module that contains the function called by the client
            task: string
                - Function called by the client
            parameters: dictionary
                - Dictionary of required and optional parameters passed to the function
            }
            comms: object
                - For now this is always a WebSocketHandler, used to send
                responses to the client. In a possible future environment where
                the web app and job app are separate programs connect via a db,
                this would be an object that writes to a table in the db, triggering
                an event on the web server that sends the message to the client
        - Optional keys:
            batch: unknown
                - The presence of this key indicates that the job will be sent to an
                external job application for processing in a queue (not yet implemented).
                When implemented this will either be a boolean flag (job['batch']=True for
                a batch job) or a string containing either the name of a queue or a priority
                level (low, medium, high, etc).

    Returns
    -------
    There are no returns from the function but a dictionary is sent to the client.
    response: dictionary
        - Response is either an empty dictionary or one that contains (at a minimum) 
        the key 'id', which is used by the client to identify the type of response it is 
        receiving. Including the key `request_completed` with a `True` value tells the
        client that the current request has finished and may be removed from the queue.
        - An optional key 'update_app' may be included in the response if any attributes
        of the main application have been changed and need to be updated. The value of the
        field is a list of attributes from the main application that need to be updated
        once the job has completed.

    Example
    -------
    A client might send the following job to the server:
    .. code-block:: python
        job = {
            id : {
                userId : 'Fred',
                sessionId : '12',
                requestId : 305
            },
            module : 'fitsviewer',
            task : 'loadHeader',
            parameters : {
                fileId : 'fhv66yugjgvj*^&^$vjkvkfhfct%^%##$f$hgkjh',
                frame : 0
            }
        }

    In this case, after receiving the job, this function will import the 'fitsviewer' module 
    (if it has not been imported already) and run the function 
    'loadHeader(job['id'],job['parameters'],self)'. If there are any errors in loading the header,
    a response of the form
        ``response = {
            'id' : 'ERROR',
            'error' : 'Error message here for unable to lead header',
            'traceback' : traceback.format_exec()
        }``
    is sent. If the header is loaded correctly a rsponse of the form
        ``response = {
            'id' : 'fitsHeader',
            'fileId' : 'fhv66yugjgvj*^&^$vjkvkfhfct%^%##$f$hgkjh',
            'frame' : 0,
            'header' : python_list,
            'request_completed': True
        }``
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
    these objects to be pickled they must be as a defined class, so this is 
    simply a class that converts a dictionary into a class.
    """
    def __init__(self, dict_in):
        self.__dict__ = dict_in

class ToyzSettings:
    def __init__(self, config_root_path=None):
        """
        Check the current working directory for a config directory with a config.p file.
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
        Save the toyz settings to disk. If toyz_settings.security.encrypt_config is `True`, 
        the settings file will be encrypted (this requires a security key).
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
        Load settings. If toyz_settings.security.encrypt_config is `True`, 
        the settings file will be decrypted (this requires a securiity key).
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
        ----------
        config_root_path: string
            - Root path of the new Toyz instance
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
    User logged into the Toyz web application
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