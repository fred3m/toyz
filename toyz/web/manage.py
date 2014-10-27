import os.path
from ..utils import core

def get_default_account_settings(params):
    user_dir = os.path.join(core.ROOT_DIR,'static','users',params['id']['userId'])
    account_settings = {
        'stored_dirs': [
            {
                'path_name': 'project',
                'path': os.path.join(user_dir,'project')
            },
            {
                'path_name': 'temp',
                'path': os.path.join(user_dir,'temp')
            },
            {
                'path_name': 'backup',
                'path': os.path.join(user_dir,'backup')
            }
        ]
    }
    return account_settings