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
    core.create_dirs(params['path'])
    response = {
        'id': 'create folder',
        'status': 'success',
        'path': params['path']
    }
    return response

