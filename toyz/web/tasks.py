# Job tasks sent from web client
# Copyright 2015 by Fred Moolekamp
# License: LGPLv3
"""
While each toy may contain a large number of functions, only the functions located in the
``tasks.py`` file will be callable from the job queue.
"""

from __future__ import print_function, division
import importlib
import os

from toyz.utils import core
from toyz.utils import file_access
from toyz.utils import db as db_utils
from toyz.utils.errors import ToyzJobError
from toyz.web import session_vars
import six

def load_user_settings(toyz_settings, tid, params):
    """
    Load settings for a given user
    
    Parameters
        - toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings`): Settings for the toyz 
          application
        - tid (*string* ): Task ID of the client user running the task
        - params (*dict* ): Any parameters sent by the client (**None** for this function)
    
    Response for all users
        - id: 'user_settings'
        - shortcuts (*dict* ): Dictionary of ``shortcut_name: shortcut_path`` 's for the user
        - workspaces (*dict* ): Dictionary of ``workspace_name: workspace_settings`` for the
          user
    
    Additional response keys for users in the **modify_toyz** group
        - modules (*list* ): List of toyz modules the user can run
        - toyz (*dict* ): Dictionary of ``toy_name: path_to_toy`` 's that the user can run
    
    Additional reponse keys for admins
        - config (*dict* ): Configuration settings for the application
        - db (*dict* ): Database settings
        - web (*dict*): Web settings
        - security (*dict* ): Security settings
        - users (*list* ): list of all users in the database
        - groups (*list* ): list of all groups in the database
        - user_settings (*dict* ): Settings for a specified user (initially the *admin*)
        - group_settings (*dict* ): Settings for a specified group (initially the *admin* group)
    """
    from toyz.utils import third_party
    dbs = toyz_settings.db
    old_shortcuts = db_utils.get_param(dbs, 'shortcuts', user_id=tid['user_id'])
    shortcuts = core.check_user_shortcuts(toyz_settings, tid['user_id'], old_shortcuts)
    workspaces = db_utils.get_param(dbs, 'workspaces', user_id=tid['user_id'])
    
    response = {
        'id':'user_settings',
        'shortcuts': shortcuts,
        'workspaces': workspaces
    }
    # set the default workspace sharing options
    if len(workspaces)>0:
        response['workspace'] = sorted(workspaces.keys())[0]
    
    groups = db_utils.get_param(toyz_settings.db, 'groups', user_id=tid['user_id'])
    
    # Only allow administrators to modify user settings
    if tid['user_id']=='admin' or 'admin' in groups:
        all_users = db_utils.get_all_ids(dbs, 'user_id')
        all_groups = db_utils.get_all_ids(dbs, 'group_id')
        user_settings = load_user_info(toyz_settings, tid, {
            'user_id': 'admin',
            'user_attr': ['groups', 'modules', 'toyz', 'paths'],
        })
        group_settings = load_user_info(toyz_settings, tid, {
            'group_id': 'admin',
            'user_attr': ['groups', 'modules', 'toyz', 'paths'],
        })
        del user_settings['id']
        del group_settings['id']
        
        user_settings['user_id'] = 'admin'
        group_settings['group_id'] = 'admin'
        response.update({
            'config': toyz_settings.config.__dict__,
            'db': toyz_settings.db.__dict__,
            'web': toyz_settings.web.__dict__,
            'security': toyz_settings.security.__dict__,
            'users': all_users,
            'groups': all_groups,
            'user_settings': user_settings,
            'group_settings': group_settings
        })
    
    # Only allow power users to modify toyz they have access to
    if 'modify_toyz' in groups or 'admin' in groups or tid['user_id'] == 'admin':
        response.update({
            'modules': db_utils.get_param(dbs, 'modules', user_id=tid['user_id']),
            'toyz': db_utils.get_param(dbs, 'toyz', user_id=tid['user_id'])
        })
    return response

def load_user_info(toyz_settings, tid, params):
    """
    Load info for a given user from the database
    
    Parameters
        - toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings`): Settings for the toyz 
          application
        - tid (*string* ): Task ID of the client user running the task
        - params (*dict* ): Any parameters sent by the client (see *params* below)
    
    Params
        - user_id or group_id (*string* ): User or group to load parameters for
        - user_attr (*list* ): List of user attributes to load
    
    Response
        - id: 'user_info'
        - Each attribute requested by the client is also returned as a key in the
          response
    """
    user = core.get_user_type(params)
    fields = params['user_attr']
    response = {
        'id': 'user_info'
    }
    for field in fields:
        if field in params['user_attr']:
            response[field] = db_utils.get_param(toyz_settings.db, field, **user)
    return response

def save_user_info(toyz_settings, tid, params):
    """
    Save a users info. If any admin settings are being changed, ensures that the user
    is in the admin group.
    
    Parameters
        - toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings`): Settings for the toyz 
          application
        - tid (*string* ): Task ID of the client user running the task
        - params (*dict* ): Any parameters sent by the client (see *params* below)
    
    Params can be any settings the user has permission to set on the server.
    
    Response
        - id: 'notification'
        - func: 'save_user_info'
        - msg: 'Settings saved for <user_id>'
    """
    groups = db_utils.get_param(toyz_settings.db, 'groups', user_id=tid['user_id'])
    # check that user is in the admin group
    if 'paths' in params and tid['user_id']!='admin' and 'admin' not in groups:
        raise ToyzJobError("You must be in the admin group to modify path permissions")
    
    if (('modules' in params or 'toyz' in params or 'third_party' in params) and 
            tid['user_id']!='admin' and 'admin' not in groups and 'modify_toyz' not in groups):
        raise ToyzJobError(
            "You must be an administrator or belong to the 'modify_toyz' "
            "group to modify a users toyz or module access")
    
    # Conditions is a dict that contains any conditional parameters from a gui
    # parameter list. We don't use any of those for this function, so we remove them
    if 'conditions' in params:
        del params['conditions']
    
    user = core.get_user_type(params)
    #update_fields = dict(params)
    #if 'user_id' in params:
    #    del update_fields['user_id']
    #elif 'group_id' in params:
    #   del update_fields['group_id']
    for field in params:
        if field in db_utils.param_formats:
            field_dict = {field: params[field]}
            field_dict.update(user)
            db_utils.update_all_params(toyz_settings.db, field, **field_dict)
    
    if 'user_id' in user:
        msg = params['user_id']
    else:
        msg = params['group_id']
    
    response = {
        'id': 'notification',
        'func': 'save_user_info',
        'msg': 'Settings saved for '+ msg
    }
    
    return response

def update_toyz_settings(toyz_settings, tid, params):
    """
    Update the toyz settings for the application
    """
    #print('db', toyz_settings.db)
    #print('config', toyz_settings.config)
    #rint('web', toyz_settings.web)
    #print('security', toyz_settings.security)
    
    db = toyz_settings.db.__dict__
    config = toyz_settings.config.__dict__
    web = toyz_settings.web.__dict__
    security = toyz_settings.security.__dict__
    db.update(params['db'])
    params['config']['path'] = os.path.join(
        params['config']['root_path'],
        params['config']['config_path']
    )
    config.update(params['config'])
    web.update(params['web'])
    security.update(params['security'])
    
    toyz_settings.db = core.ToyzClass(db)
    toyz_settings.config = core.ToyzClass(config)
    toyz_settings.web = core.ToyzClass(web)
    toyz_settings.security = core.ToyzClass(security)
    toyz_settings.save_settings()
    
    response = {
        'id': 'notification',
        'msg': 'Settings saved successfully',
        'func': 'update_toyz_settings'
    }
    
    return response

def add_new_user(toyz_settings, tid, params):
    """
    Add a new user to the toyz application.
    
    Parameters
        - toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings`): Settings for the toyz 
          application
        - tid (*string* ): Task ID of the client user running the task
        - params (*dict* ): Any parameters sent by the client (see *params* below)
    
    Params
        - user_id (*string* ): Id of user to add
    
    Response
        - id: 'notification'
        - func: 'add_new_user'
        - msg: 'User/Group added correctly'
    """
    user = core.get_user_type(params)
    user_id = six.next(six.itervalues(user))
    pwd = core.encrypt_pwd(toyz_settings, user_id)
    db_utils.update_param(toyz_settings.db, 'pwd', pwd=pwd, **user)
    if 'user_id' in user:
        # set permissions and shortcuts for users home path
        core.check_user_shortcuts(toyz_settings, **user)
        # Add user to all users
        db_utils.update_param(toyz_settings.db, 'users', group_id='all', users=[user['user_id']])
        msg = 'User added correctly'
    else:
        msg = 'Group added correctly'
    
    response = {
        'id': 'notification',
        'func': 'add_new_user',
        'msg': msg
    }
    return response

def change_pwd(toyz_settings, tid, params):
    """
    Change a users password.
    
    Parameters
        - toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings`): Settings for the toyz 
          application
        - tid (*string* ): Task ID of the client user running the task
        - params (*dict* ): Any parameters sent by the client (see *params* below)
    
    Params
        - current_pwd (*string* ):  Users current password. Must match the password on 
          file or an exception is raised
        - new_pwd (*string* ): New password
        - confirm_pwd (*string* ): Confirmation of the the new password. If new_pwd and 
          confirm_pwd do not match, an exception is raised
    
    Response
        - id: 'notification'
        - func: 'change_pwd'
        - msg: 'Password changed successfully'
    """
    core.check4keys(params, ['current_pwd', 'new_pwd', 'confirm_pwd'])
    if core.check_pwd(toyz_settings, tid['user_id'], params['current_pwd']):
        if params['new_pwd'] == params['confirm_pwd']:
            pwd_hash = core.encrypt_pwd(toyz_settings, params['new_pwd'])
        else:
            raise ToyzJobError("New passwords did not match")
    else:
        raise ToyzJobError("Invalid user_id or password")
    
    db_utils.update_param(toyz_settings.db, 'pwd', user_id=tid['user_id'], pwd=pwd_hash)
    
    response = {
        'id': 'notification',
        'func': 'change_pwd',
        'msg': 'Password changed successfully',
    }
    return response

def reset_pwd(toyz_settings, tid, params):
    """
    Reset a users password
    """
    user = core.get_user_type(params)
    if 'user_id' in params:
        user_id = params['user_id']
    elif 'group_id' in params:
        user_id = group_id
    else:
        raise ToyzJobError("Must specify a user_id or group_id to reset password")
    pwd_hash = core.encrypt_pwd(toyz_settings, user_id)
    db_utils.update_param(toyz_settings.db, 'pwd', pwd=pwd_hash, **user)
    
    response = {
        'id': 'notification',
        'func': 'reset_pwd',
        'msg': 'Password reset successfully',
    }
    return response

def load_directory(toyz_settings, tid, params):
    """
    Used by the file browser to load the folders and files in a given path.
    
    Parameters
        - toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings`): Settings for the toyz 
          application
        - tid (*string* ): Task ID of the client user running the task
        - params (*dict* ): Any parameters sent by the client (see *params* below)
    
    Params
        - path (*string* ): Path to search
    
    Response
        - id: 'directory'
        - path (*string* ): path passed to the function
        - shortcuts (*dict* ): Dictionary of ``shortcut_name: shortcut_path`` 's for the user
        - folders (*list* of strings): folders contained in the path
        - files (*list* of strings): files contained in the path
        - parent (*string* ): parent directory of current path
    """
    core.check4keys(params,['path'])
    show_hidden=False
    # If the path is contained in a set of dollar signs (for example `$images$`) then 
    # search in the users shortcuts for the given path
    shortcuts = db_utils.get_param(toyz_settings.db, 'shortcuts', user_id=tid['user_id'])
    if params['path'][0]=='$' and params['path'][-1]=='$':
        shortcut = params['path'][1:-1]
        if shortcut not in shortcuts:
            raise ToyzJobError("Shortcut '{0}' not found for user {1}".format(shortcut, 
                tid['user_id']))
        params['path'] = shortcuts[shortcut]
    
    if not os.path.isdir(params['path']):
        parent = os.path.dirname(params['path'])
        if not os.path.isdir(parent):
            raise ToyzJobError("Path '{0}' not found".format(params['path']))
        params['path'] = parent
    if 'show_hidden' in params and params['show_hidden']:
        show_hidden=True
    
    # Keep separate lists of the files and directories for the current path.
    # Only include the files and directories the user has permissions to view
    files = []
    folders = []
    groups = db_utils.get_param(toyz_settings.db, 'groups', user_id=tid['user_id'])
    if 'admin' in groups or tid['user_id'] == 'admin':
        admin=True
    else:
        admin=False
    for f in os.listdir(params['path']):
        if(f[0]!='.' or show_hidden):
            f_path =os.path.join(params['path'],f)
            if admin:
                permission = True
            else:
                permissions = file_access.get_parent_permissions(toyz_settings.db,
                    f_path, user_id=tid['user_id'])
                if permissions is None:
                    permissions = ''
                permission = 'f' in permissions
            if permission:
                if os.path.isfile(f_path):
                    files.append(str(f))
                elif os.path.isdir(f_path):
                    folders.append(str(f))
            else:
                print("no access to", f)
    files.sort(key=lambda v: v.lower())
    folders.sort(key=lambda v: v.lower())
    response={
        'id': 'directory',
        'path': os.path.join(params['path'],''),
        'shortcuts': shortcuts.keys(),
        'folders': folders,
        'files': files,
        'parent': os.path.abspath(os.path.join(params['path'],os.pardir))
    }
    
    #print('path info:', response)
    return response

def create_paths(toyz_settings, tid, params):
    """
    Creates a new path on the server (if it does not already exist).
    
    Parameters
        - toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings`): Settings for the toyz 
          application
        - tid (*string* ): Task ID of the client user running the task
        - params (*dict* ): Any parameters sent by the client (see *params* below)
    
    Params
        - path (*string* ): path to create on the server
    
    Response
        id: 'create_folder',
        status (*string* ): 'success',
        path (*string* ): path created on the server
    """
    core.check4keys(params, ['path', 'new_folder'])
    path = os.path.join(params['path'], params['new_folder'])
    permissions = file_access.get_parent_permissions(toyz_settings.db,
        path, user_id=tid['user_id'])
    if 'w' not in permissions and 'x' not in permissions:
        raise ToyzJobError("You do not have permission to create path {0}".format(path))
    core.create_paths(path)
    response = {
        'id': 'notification',
        'msg': 'Created path'.format(path),
        'func': 'create_dir'
    }
    return response

def load_data_file(toyz_settings, tid, params):
    """
    Load a data file given a set of parameters from the browser, initialized by
    ``get_io_info``.
    """
    import toyz.utils.io as io
    import toyz.utils.sources as sources
    
    src_types = sources.src_types
    modules = db_utils.get_param(toyz_settings.db, 'modules', user_id=tid['user_id'])
    for module in modules:
        try:
            config = importlib.import_module(module+'.config')
        except ImportError:
            import_error[module] = 'could not import' + module+'.config'
        if hasattr(config, 'src_types'):
            src_types.update(config.src_types)
    
    # If this is the first data source, define variable to keep track of data sources
    if not hasattr(session_vars, 'data_sources'):
        session_vars.data_sources = {}
    
    # Load the data into a data object
    src_id = params['src_id']
    src_name = params['src_name']
    
    if 'src_type' in params:
        src_type = params['src_type']
    else:
        src_type = 'DataSource'
    if 'data_type' in params:
        data_type = params['data_type']
    else:
        data_type = None
    
    session_vars.data_sources[src_id] = src_types[src_type](
        user_id=tid['user_id'], data_type=data_type, paths=params['paths'])
    session_vars.data_sources[src_id].src_id = src_id
    session_vars.data_sources[src_id].name = src_id
    
    response = {
        'id': 'data_file',
        'columns': session_vars.data_sources[src_id].columns,
    }
    return response

def save_data_file(toyz_settings, tid ,params):
    """
    Save a data source.
    """
    src = session_vars.data_sources[params['src_id']]
    new_file_options = src.save(params['save_paths'])
    response = {
        'id': 'save_data_file',
        'status': 'success',
        'new_file_options': new_file_options
    }
    return response
    
def get_src_columns(toyz_settings, tid, params):
    """
    Get column information from multiple sources and return to a workspace
    """
    sources = {}
    for src_id, src in params.items():
        if not hasattr(session_vars, 'data_sources') or src_id not in session_vars.data_sources:
            print('loading data source')
            load_data_file(toyz_settings, tid, params['params'])
        if len(src['columns'])>0:
            sources[src_id] = {
                'data_type': 'columns',
                'data': {}
            }
            sources[src_id]['data'] = session_vars.data_sources[src_id].to_dict(src['columns'])
    response = {
        'id': 'src_columns',
        'sources': sources
    }
    return response

def remove_datapoints(toyz_settings, tid, params):
    """
    Remove a point from a data source
    """
    src = session_vars.data_sources[params['src_id']]
    src.remove_rows(params['points'])
    response = {
        'id': 'notification',
        'msg': 'Successfully removed data points'
    }
    return response

def get_workspace_info(toyz_settings, tid, params):
    """
    Get I/O settings for different packages (pure python, numpy, pandas, etc) and
    other settings for the current users workspaces
    """
    import toyz.utils.io as io
    import toyz.utils.sources as sources
    
    src_types = sources.src_types.keys()
    data_types = sources.data_types
    image_types = sources.image_types
    toyz_modules = {
        'toyz': dict(io.io_modules)
    }
    
    # Get workspace info from other Toyz modules
    tiles = {}
    import_error = {}
    modules = db_utils.get_param(toyz_settings.db, 'modules', user_id=tid['user_id'])
    for module in modules:
        try:
            config = importlib.import_module(module+'.config')
        except ImportError:
            import_error[module] = 'could not import' + module+'.config'
        if hasattr(config, 'workspace_tiles'):
            tiles.update(config.workspace_tiles)
        if hasattr(config, 'data_types'):
            data_types += config.data_types
        if hasattr(config, 'image_types'):
            image_types += config.image_types
        if hasattr(config, 'io_modules'):
            toyz_modules.update({
                module: config.io_modules
            })
        if hasattr(config, 'src_types'):
            src_types += config.src_types.keys()
    
    load_src = io.build_gui(toyz_modules, 'load')
    load_src.update({
        'optional': {
            'src_type': {
                'lbl': 'Data Source Type',
                'type': 'select',
                'options': sorted(src_types),
                'default_val': 'DataSource'
            },
            'data_type': {
                'lbl': 'data type',
                'type': 'select',
                'options': sorted(data_types)
            },
            'image_type': {
                'lbl': 'image_type',
                'type': 'select',
                'options': sorted(image_types)
            }
        }
    })
    save_src = io.build_gui(toyz_modules, 'save')
    
    response = {
        'id': 'workspace_info',
        'load_src_info': load_src,
        'save_src_info': save_src,
        'tiles': tiles,
        'import_error': import_error
    }
    
    return response

def save_workspace(toyz_settings, tid, params):
    """
    Save a workspace for later use
    """
    core.check4keys(params, ['workspaces', 'overwrite'])
    workspaces = db_utils.get_param(toyz_settings.db, 'workspaces', user_id=tid['user_id'])
    work_id = params['workspaces'].keys()[0]
    if work_id in workspaces and params['overwrite'] is False:
        response = {
            'id': 'verify',
            'func': 'save_workspace'
        }
    else:
        user_id = tid['user_id']
        if 'user_id' in params and params['user_id']!=tid['user_id']:
            params['work_id'] = work_id
            permissions = core.get_workspace_permissions(toyz_settings, tid, params)
            if permissions['modify']:
                user_id = params['user_id']
            else:
                raise ToyzJobError(
                    "You do not have permission to save {0}".format(params['work_id']))
            
        db_utils.update_param(toyz_settings.db, 'workspaces', 
            workspaces=params['workspaces'], user_id=user_id)
        response = {
            'id': 'notification',
            'msg': 'Workspace saved successfully',
            'func': 'save_workspace'
        }
    
    return response

def load_workspace(toyz_settings, tid, params):
    """
    Load a workspace
    """
    core.check4keys(params, ['work_id'])
    user_id = tid['user_id']
    if 'user_id' in params and params['user_id']!=tid['user_id']:
        permissions = core.get_workspace_permissions(toyz_settings, tid, params)
        print('permissions', permissions)
        if permissions['view']:
            user_id = params['user_id']
        else:
            raise ToyzJobError("You do not have permission to load {0}".format(params['work_id']))
    
    workspaces = db_utils.get_param(toyz_settings.db, 'workspaces', user_id=user_id)
    if params['work_id'] not in workspaces:
        raise ToyzJobError("{0} not found in your workspaces".format(params['work_id']))
    response = {
        'id': 'workspace',
        'work_id': params['work_id'],
        'settings': workspaces[params['work_id']]
    }
    return response

def get_workspace_sharing(toyz_settings, tid, params):
    """
    Get shared workspace settings for users and groups
    
    Params
        - work_id ( *string* ): name of the workspace
    """
    core.check4keys(params, ['work_id'])
    shared_workspaces = db_utils.get_workspace_sharing(
        toyz_settings.db, user_id=tid['user_id'], work_id=params['work_id'])
    ws_users = [row for row in shared_workspaces if row['share_id_type']=='user_id']
    ws_groups = [row for row in shared_workspaces if row['share_id_type']=='group_id']
    
    response = {
        'id': 'get_workspace_sharing',
        'ws_users': ws_users,
        'ws_groups': ws_groups
    }
    return response

def update_workspace(toyz_settings, tid, params):
    """
    Update user permissions or delete a workspace
    
    Params
        - work_id ( *string* ): name of the workspace
        - type ( *string* ): type of update
            - Can be ``update`` to update user permissions or ``delete`` to remove the workspace
        - users ( *dict*, optional ):
            - Dict of permissions for other users
            - Required if the update type is ``update``
        - groups ( *dict*, optional ):
            - Dict of permissions for other groups
            - Required if the update type is ``update``
    
    Response
        - id: 'notification'
        - status: 'success' (if the update is successfully saved in the database)
    """
    params['user_id'] = tid['user_id']
    if params['type'] == 'delete':
        db_utils.delete_workspace(toyz_settings.db, tid['user_id'], params['work_id'])
    elif params['type'] == 'update':
        del params['type']
        db_utils.update_workspace(toyz_settings.db, **params)
    
    response = {
        'id': 'notification',
        'func': 'update_workspace',
        'msg': 'success'
    }
    return response

def get_file_info(toyz_settings, tid, params):
    """
    Get information about an image file
    """
    import toyz.web.viewer as viewer
    core.check4keys(params, ['file_info', 'img_info'])
    if tid['user_id']!='admin':
        permissions = file_access.get_parent_permissions(
            toyz_settings.db, params['file_info']['filepath'], user_id=tid['user_id'])
        if permissions is None or 'r' not in permissions:
            raise ToyzJobError(
                'You do not have permission to view the requested file.'
                'Please contact your network administrator if you believe this is an error.')
    file_info = viewer.get_file_info(params['file_info'])
    img_info = file_info['images'][file_info['frame']]
    img_info.update(params['img_info'])
    # Get the tile map for the first image
    result = get_img_info(toyz_settings, tid, {
        'file_info': file_info,
        'img_info': img_info
    })
    
    file_info['images'][file_info['frame']] = result['img_info']
    response = {
        'id': 'file info',
        'file_info': file_info,
        'new_tiles': result['new_tiles']
    }
    return response

def get_img_info(toyz_settings, tid, params):
    """
    Map a large image into a set of tiles that make up the larger image
    """
    import toyz.web.viewer as viewer
    print('************************************************')
    core.check4keys(params, ['img_info', 'file_info'])
    if tid['user_id']!='admin':
        permissions = file_access.get_parent_permissions(
            toyz_settings.db, params['file_info']['filepath'], user_id=tid['user_id'])
        if 'r' not in permissions:
            raise ToyzJobError(
                'You do not have permission to view the requested file.'
                'Please contact your network administrator if you believe this is an error.')
    shortcuts = db_utils.get_param(toyz_settings.db, 'shortcuts', user_id=tid['user_id'])
    save_path = os.path.join(shortcuts['temp'], tid['session_id'], 'images')
    params['img_info']['save_path'] = save_path
    img_info = viewer.get_img_info(params['file_info'], params['img_info'])
    
    result = get_tile_info(toyz_settings, tid, {
        'file_info': params['file_info'],
        'img_info': img_info
    })
    img_info['tiles'] = result['new_tiles']
    response = {
        'id': 'img info',
        'img_info': img_info,
        'new_tiles': result['new_tiles']
    }
    print('************************************************')
    return response

def get_tile_info(toyz_settings, tid, params):
    """
    Get new tiles that need to be loaded
    """
    import toyz.web.viewer as viewer
    
    core.check4keys(params, ['img_info', 'file_info'])
    if tid['user_id']!='admin':
        permissions = file_access.get_parent_permissions(
            toyz_settings.db, params['file_info']['filepath'], user_id=tid['user_id'])
        if 'r' not in permissions:
            raise ToyzJobError(
                'You do not have permission to view the requested file.'
                'Please contact your network administrator if you believe this is an error.')
    
    all_tiles, new_tiles = viewer.get_tile_info(params['file_info'], params['img_info'])
    
    #print('all tile:', all_tiles)
    
    response = {
        'id': 'tile info',
        'all_tiles': all_tiles,
        'new_tiles': new_tiles
    }
    return response

def get_img_tile(toyz_settings, tid, params):
    """
    Load a tile from a larger image and notify the client it has been created
    """
    import toyz.web.viewer as viewer
    
    core.check4keys(params, ['img_info', 'file_info', 'tile_info'])
    if tid['user_id']!='admin':
        permissions = file_access.get_parent_permissions(
            toyz_settings.db, params['file_info']['filepath'], user_id=tid['user_id'])
        if 'r' not in permissions:
            raise ToyzJobError(
                'You do not have permission to view the requested file.'
                'Please contact your network administrator if you believe this is an error.')
    
    created, tile_info = viewer.create_tile(
        params['file_info'], params['img_info'], params['tile_info'])
    
    response = {
        'id': 'tile created',
        'success': created,
        'tile_info': tile_info
    }
    
    return response

def get_img_data(toyz_settings, tid, params):
    """
    Get data from an image or FITS file
    """
    import toyz.web.viewer as viewer
    core.check4keys(params, ['data_type', 'file_info', 'img_info'])
    
    response = viewer.get_img_data(**params)
    #print('response:', response)
    return response