from __future__ import division,print_function

import tornado.web
import os.path
import copy
import cPickle as pickle

# astropyp modules
from ..utils import core
from . import manage

class BaseHandler(tornado.web.RequestHandler):
    """
    Base Class for all Web Handlers. This handles the security information and
    the path to the template on the server
    """
    def initialize(self, template_name, template_path, options={}):
        """
        Set the path, name of the template, and any options needed when a client loads a template
        
        Parameters
        ----------
        template_name: string
            - Name of the template
        template path: string
            - Path on the server where the template html or js file is being stored
        """
        self.template_path=os.path.join(*template_path)
        self.template_name=template_name
        self.options=options
    @tornado.web.authenticated
    @tornado.web.asynchronous
    def get(self):
        """
        Send the template page to the client
        """
        self.application.settings['template_path'] = self.template_path
        self.render(self.template_name, **self.options)
    
    def get_current_user(self):
        return self.get_secure_cookie("user")

def load_directory(id, params):
    core.check4key(params,['path'])
    showHidden=False
    if 'show hidden' in params and params['show hidden']:
        showHidden=True
    if params['path'][0]=='$' and params['path'][-1]=='$':
        path = params['path'][1:-1]
        params['path'] = core.active_users[id['userId']].stored_dirs[path]
    files = []
    dirs = []
    for f in os.listdir(params['path']):
        if(f[0]!='.' or showHidden):
            if os.path.isfile(os.path.join(params['path'],f)):
                files.append(str(f))
            elif os.path.isdir(os.path.join(params['path'],f)):
                dirs.append(str(f))
    files.sort(key=lambda v: v.lower())
    dirs.sort(key=lambda v: v.lower())
    stored_dirs=copy.deepcopy(core.active_users[id['userId']].stored_dirs)
    stored_dirs['session'] = stored_dirs['session'][id['sessionId']]
    response={
        'id': 'directory',
        'path': os.path.join(params['path'],''),
        'files': files,
        'dirs': dirs,
        'stored_dirs': stored_dirs,
        'parent': os.path.abspath(os.path.join(params['path'],os.pardir))
    }
    return response

def create_dir(id, params):
    core.check4key(params, ['path'])
    try:
        os.makedirs(params['path'])
    except OSError:
        if not os.path.isdir(params['path']):
            raise core.AstropypError("Problem creating new directory, check user permissions")

    response = {
        'id': 'create folder',
        'status': 'success',
        'path': params['path']
    }
    return response

def create_dirs(paths):
    """                                                                         
    createDirs                                                                  
                                                                                
    Search for paths on the server. If a path does not exist, create the necessary directories.                                                                
    For example, if paths=['~/Documents/astropyp_images/2014-6-5_data/'] and only the path                                                                     
    '~/Documents' exists, both '~/Documents/astropyp_images/' and '~/Documents/astropyp_images/2014-6-5_data/'                                                 
    are created.
    
    Parameters                                                                  
    ----------                                                                  
    paths: string or list of strings                                            
        -If paths is a string, this is the path to search for and create. If paths is a list, each one                                                         
        is a path to search for and create                                      
                                                                                
    Returns                                                                     
    -------                                                                     
        -None                                                                   
    """
    # Search the server for a path. If the path does not exist, create the necessary directories                        
    # Arguments:                                                                
    #   -paths: Either a single path (as a string) or a list of paths (strings)
    if isinstance(paths,basestring):
            paths=[paths]
    for path in paths:
        create_dir(id={}, params={'path': path})
        #try:
        #    os.makedirs(path)
        #except OSError:
        #    if not os.path.isdir(path):
        #        raise core.AstropypError("Problem creating new directory, check user permissions")

def load_all_users_settings():
    import web_settings
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        user_file = open(web_settings.USER_SETTINGS, 'rb')
        users = pickle.load(user_file)
        user_file.close()
    return users

def load_groups():
    import web_settings
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        group_file = open(web_settings.GROUPS_TABLE, 'rb')
        groups = pickle.load(group_file)
        group_file.close()
    return groups

def load_user_settings(id, params):
    user = core.active_users[id['userId']]
    account_settings = manage.get_default_account_settings({'id': id})
    for setting in user.account_settings:
        account_settings[setting] = user.account_settings[setting]
    
    response = {
        'id': 'user settings',
        'account_settings': account_settings
    }
    
    if id['userId'] == 'admin':
        users = load_all_users_settings()
        groups = load_groups()
        response['admin_settings'] = {
            'users': users,
            'groups': groups
        }
    return response

def save_user_settings(userId, settings):
    import web_settings
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        users = load_all_users_settings()
        users[userId] = settings
        user_file = open(web_settings.USER_SETTINGS, 'wb')
        pickle.dump(users, user_file)
        user_file.close()
        f = open(web_settings.USER_SETTINGS, 'rb')
        test=pickle.load(f)

def update_account_settings(id, params):
    save_user_settings(id['userId'], params)
    user = core.active_users[id['userId']]
    user.update_account_settings(params)
    
    response = {
        'id': 'update account settings',
        'status': 'success'
    }
    return response

def load_users():
    import web_settings
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        user_file = open(web_settings.USER_TABLE, 'rb')
        users = pickle.load(user_file)
        user_file.close()
    return users

def update_user(userId, field, value):
    import web_settings
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        users = load_users()
        if field == 'pwd':
            users[userId]['pwd'] = web_settings.pwd_context.encrypt(value)
        else:
            users[userId][field] = value
        user_file = open(web_settings.USER_TABLE, 'wb')
        pickle.dump(users, user_file)
        user_file.close()

def load_user(userId):
    return load_users()[userId]

def add_new_user(id, params):
    import web_settings
    user_pwd = load_users()
    user_settings = load_all_users_settings()
    if params['userId'] in user_pwd and params['userId'] in user_settings:
        raise core.AstropypError('User name already exists')
    
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        if params['userId'] not in user_pwd:
            user_pwd[params['userId']] = {}
            f = open(web_settings.USER_TABLE, 'wb')
            pickle.dump(user_pwd, f)
            f.close()
            update_user(params['userId'], 'pwd', value=params['userId'])
        if params['userId'] not in user_settings:
            user_settings[params['userId']] = {}
            f = open(web_settings.USER_SETTINGS, 'wb')
            pickle.dump(user_settings, f)
            f.close()
    
    response = {
        'id': 'new user',
        'status': 'success'
    }
    return response

def check_pwd(userId, pwd):
    import web_settings
    try:
        user = load_user(userId)
    except KeyError:
        return False
    user_hash = user['pwd']
    return web_settings.pwd_context.verify(pwd, user_hash)

def change_pwd(id, params):
    import web_settings
    core.check4key(params,['current_pwd','new_pwd','confirm_pwd'])
    if check_pwd(id['userId'],params['current_pwd']):
        if params['new_pwd'] == params['confirm_pwd']:
            update_user(id['userId'], 'pwd', params['new_pwd'])
        else:
            raise core.AstropypError('New passwords must match')
    else:
        raise core.AstropypError('Invalid password')
    response = {
        'id': 'change pwd',
        'status': 'success'
    }
    return response

def reset_pwd(id, params):
    import web_settings
    core.check4key(params,['userId'])
    update_user(params['userId'], 'pwd', params['userId'])
    response = {
        'id': 'change pwd',
        'status': 'success'
    }
    return response

def check_img_file(filename, starts_with=None, ends_with=None, contains=None,
                    extensions=None):
    if starts_with is not None:
        if not filename.startswith(starts_with):
            return False
    if ends_with is not None:
        if not filename.endswith(ends_with):
            return False
    if contains is not None:
        if not contains in filename:
            return False
    if extensions is not None:
        is_valid = False
        for ext in extensions:
            if filename.endswith(ext):
                is_valid = True
        if not is_valid:
            return False
    return True

def load_img_dir(id, params):
    if not os.path.isdir(params['directory']):
        response = {
            'id': 'ERROR',
            'error': 'You must choose a valid directory'
        }
        return response
    img_files = {}
    if params['recursive']:
        for root, dirs, files in os.walk(params['directory']):
            for file in files:
                if check_img_file(file, **params['checks']):
                    img_files[file] = os.path.join(root, file)
    else:
        for file in os.listdir(params['directory']):
            if check_img_file(file, **params['checks']):
                img_files[file] = os.path.join(params['directory'], file)
    
    response = {
        'id': 'img files',
        'path': params['directory'],
        'files': img_files
    }
    return response

def copy_img2temp(id, params):
    import shutil
    user = core.active_users[id['userId']]
    path, filename = os.path.split(params['filename'])
    print('filename:', filename)
    temp_path = os.path.join(user.stored_dirs['temp'], filename)

    shutil.copyfile(params['filename'], temp_path)
    response = {
        'id': 'img location',
        'imgId': filename,
        'img_src': os.path.relpath(temp_path,core.ROOT_DIR)
    }
    return response