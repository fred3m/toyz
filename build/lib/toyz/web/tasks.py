"""
Job tasks sent from web client
Copyright 2014 by Fred Moolekamp
License: MIT
"""
from __future__ import print_function, division

from toyz.utils import core
from toyz.utils import file_access
from toyz.utils.errors import ToyzJobError

def load_user_settings(toyz_settings, id, params):
    """
    Load settings for a given user
    """
    users = core.load_user(toyz_settings)
    user = users[id['user_id']]
    response = {
        'id':'user_settings',
        'paths': user.paths,
        'toyz': user.toyz
    }
    return response

def update_user_settings(toyz_settings, id, params):
    """
    Update and save settings for a user
    """
    import importlib
    core.check4keys(params,['paths', 'toyz'])
    users = core.load_users(toyz_settings)
    user = users[id['user_id']]
    user.toyz = [t['toy'] for t in params['toyz']]
    new_paths = {p['path_name']:p['path'] for p in params['paths']}
    
    # Check to make sure that the user has access to the given paths
    for path_name, path in new_paths.items():
        permissions = file_access.get_parent_permissions(toyz_settings.db, user, path)
        print(path_name, permissions)
        if permissions is None:
            raise ToyzJobError(
                "Either the path '{0}' does not exist or you do "
                "not have permission to access it".format(path)
            )
    
    user.paths = new_paths
    core.save_user(toyz_settings, user)
    
    response = {
        'id':'notification',
        'func': 'update_user_settings',
        'msg': 'User settings updated successfully',
        'update_app': ['users']
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
    core.check4key(params, ['current_pwd', 'new_pwd', 'confirm_pwd'])
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

