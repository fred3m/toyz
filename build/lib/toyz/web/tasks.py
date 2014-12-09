"""
Job tasks sent from web client
Copyright 2014 by Fred Moolekamp
License: MIT
"""
from __future__ import print_function, division
import importlib

from toyz.utils import core
from toyz.utils import file_access
from toyz.utils.errors import ToyzJobError

def load_user_settings(toyz_settings, id, params):
    """
    Load settings for a given user
    """
    user = core.load_user(toyz_settings, id['user_id'])
    response = {
        'id':'user_settings',
        'shortcuts': user.shortcuts,
    }
    
    if user.user_id=='admin' or 'admin' in user.groups:
        users = [uid for uid in core.load_users(toyz_settings)]
        # Add the symbol representing all users in the database
        users.append('*')
        groups = core.load_groups(toyz_settings)
        user_settings = load_user_info(toyz_settings, id, {
            'user_id': 'admin',
            'user_attr': ['groups', 'modules', 'toyz'],
            'db_fields': ['paths']
        })
        del user_settings['id']
        user_settings['user_id'] = 'admin'
        response.update({
            'modules': user.modules,
            'toyz': user.toyz,
            'config': toyz_settings.config.__dict__,
            'db': toyz_settings.db.__dict__,
            'web': toyz_settings.web.__dict__,
            'security': toyz_settings.security.__dict__,
            'users': {uid:uid for uid in users},
            'groups': {g:g for g in groups},
            'user_settings': user_settings
        })
    else:
        if 'modify_toyz' in user.groups:
            response.update({
                'modules': user.modules,
                'toyz': user.toyz,
            })
    
    return response

def load_user_info(toyz_settings, id, params):
    """
    Load info for a given user from the database
    """
    core.check4keys(params, ['user_id'])
    user = core.load_user(toyz_settings, params['user_id'])
    response = {
        'id': 'user_info'
    }
    
    if 'user_attr' in params:
        for attr in params['user_attr']:
            response[attr] = getattr(user, attr)
    if 'db_fields' in params:
        if 'paths' in params['db_fields']:
            db_module = importlib.import_module(toyz_settings.db.interface_name)
            permissions = db_module.get_all_user_permissions(toyz_settings.db, user.user_id)
            response['paths'] = permissions
    return response

def save_user_info(toyz_settings, id, params):
    """
    Save user info
    """
    core.check4keys(params, ['user_id', 'groups', 'paths', 'modules', 'toyz'])
    user = core.load_user(toyz_settings, id['user_id'])
    
    if id['user_id'] != 'admin' and 'admin' not in user.groups:
        raise ToyzJobError("You must be an administrator to modify user settings")
    
    edit_user = core.load_user(toyz_settings, params['user_id'])
    edit_user.toyz = params['toyz']
    edit_user.modules = params['modules']
    edit_user.groups = params['groups']
    
    core.save_user(toyz_settings, edit_user)
    
    response = {
        'id': 'notification',
        'func': 'save_user_info',
        'msg': 'Settings saved for '+ edit_user.user_id
    }
    
    return response

def update_user_settings(toyz_settings, id, params):
    """
    Update and save settings for a user
    """
    import importlib
    core.check4keys(params,['shortcuts'])
    users = core.load_users(toyz_settings)
    user = users[id['user_id']]
    if 'toyz' in params:
        user.toyz = params['toyz']
    if 'modules' in params:
        user.modules = params['modules']
    
    # Check to make sure that the user has access to the given paths
    for path_name, path in params['shortcuts'].items():
        permissions = file_access.get_parent_permissions(toyz_settings.db, user, path)
        print(path_name, permissions)
        if permissions is None:
            raise ToyzJobError(
                "Either the path '{0}' does not exist or you do "
                "not have permission to access it".format(path)
            )
    
    user.shortcuts = params['shortcuts']
    core.save_user(toyz_settings, user)
    
    response = {
        'id':'notification',
        'func': 'update_user_settings',
        'msg': 'User settings updated successfully',
        'update_app': ['users']
    }
    return response

def add_new_user(toyz_settings, id, params):
    """
    Add a new user to the toyz application
    """
    core.check4keys(params, ['user_id'])
    user = core.ToyzUser(toyz_settings, user_id=params['user_id'])
    core.save_user(toyz_settings, user)
    
    response = {
        'id': 'notification',
        'func': 'add_new_user',
        'msg': 'User added correctly'
    }
    return response

def change_pwd(toyz_settings, id, params):
    """
    Change a users password.
    
    Params
    ------
    current_pwd: string
        - Users current password. Must match the password on file or an exception is raised
    new_pwd: string
        - New password
    confirm_pwd: string
        - Confirmation of the the new password. If new_pwd and confirm_pwd do not
        match, an exception is raised
    """
    core.check4keys(params, ['current_pwd', 'new_pwd', 'confirm_pwd'])
    users = core.load_users(toyz_settings)
    if core.check_pwd(toyz_settings, id['user_id'], params['current_pwd']):
        if params['new_pwd'] == params['confirm_pwd']:
            pwd_hash = core.encrypt_pwd(toyz_settings, params['new_pwd'])
        else:
            raise ToyzJobError("New passwords did not match")
    else:
        raise ToyzJobError("Invalid user_id or password")
    
    user = users[id['user_id']]
    user.pwd = pwd_hash
    core.save_user(toyz_settings, user)
    
    response = {
        'id': 'notification',
        'func': 'change_pwd',
        'msg': 'Password changed successfully',
        'update_app': 'users'
    }
    return response

def load_directory(app, id, params):
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

def create_dir(app, id, params):
    core.create_dirs(params['path'])
    response = {
        'id': 'create folder',
        'status': 'success',
        'path': params['path']
    }
    return response