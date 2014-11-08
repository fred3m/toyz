import os
import base64
import uuid
import core

# Web application settings
app_settings = {
    'web': {
        'port': 8888,
        'cookie_secret': base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes),
        'config_encrypted': False,
        'static_path': os.path.join(core.ROOT_DIR, 'web', 'static'),
        'template_path': os.path.join(core.ROOT_DIR, 'web', 'templates')
        'config_name': 'toyz_config.p',
        'config_path': os.path.join(core.ROOT_DIR, 'config', config_name)
    },
    'db': {
        'db_type': 'sqlite'
        'interface_name': 'sqlite_interface'
        'path': os.path.join(core.ROOT_DIR, 'config', 'toyz.db')
    },
    # Encryption method for user passwords
    'pwd_context': {
        'schemes': ['sha512_crypt','pbkdf2_sha512'],
        'default': "sha512_crypt",
        'sha512_crypt__default_rounds': 500000,
        'pbkdf2_sha512__default_rounds': 100000,
        'all__vary_rounds': 0.1      # vary rounds parameter randomly when creating new hashes...
    }
}